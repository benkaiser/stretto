var fs = require('fs');
var path = require('path');
var mm = require('musicmetadata');
var taglib = require('taglib');
var md5 = require('MD5');
var request = require('request');
var mkdirp = require('mkdirp');
var async = require('async');
var SoundcloudResolver = require('soundcloud-resolver');

var util = require(__dirname + '/util.js');
var config = require(__dirname + '/config').config();

// init the soundcloud resolver with the clientid
var scres = new SoundcloudResolver(config.sc_client_id);

// init other variables
var running = false;
var hard_rescan = false;
var app = null;
var cnt = 0;
var song_list = [];

var song_extentions = ["mp3", "m4a", "aac", "ogg", "wav", "flac", "raw"];

function findNextSong(){
  if(cnt < song_list.length && running){
    findSong(song_list[cnt], function(err){
      if(err){
        console.log({error: err, file: song_list[cnt]});
      }
      cnt++;
      setTimeout(findNextSong, 0);
    });
  } else {
    console.log("finished!");
    broadcast("update", {count: song_list.length, completed: song_list.length, details: "Finished"});
    // reset for next scan
    cnt = 0;
    song_list = [];
    running = false;
  }
}

function findSong(relative_location, callback){
  // convert the filename into full path
  var full_location = config.music_dir + relative_location;
  app.db.songs.findOne({location: relative_location}, function(err, doc){
    // only scan if we haven't scanned before, or we are scanning every document again
    if(doc == null || hard_rescan){
      // insert the new song
      var parser = new mm(fs.createReadStream(full_location));

      parser.on('metadata', function(result){
        // add the location
        var song = {
          title: result.title,
          album: result.album,
          artist: result.artist,
          albumartist: result.albumartist,
          display_artist: normaliseArtist(result.albumartist, result.artist),
          genre: result.genre,
          year: result.year,
          duration: result.duration,
          play_count: (doc == null) ? 0 : doc.play_count || 0,
          location: relative_location
        };
        // write the cover photo as an md5 string
        if(result.picture.length > 0){
          pic = result.picture[0];
          pic["format"] = pic["format"].replace(/[^a-z0-9]/gi, '_').toLowerCase();
          song.cover_location = md5(pic['data']) + "." + pic["format"];
          filename = __dirname + '/dbs/covers/' + song.cover_location;
          fs.exists(filename, function(exists){
            if(!exists){
              fs.writeFile(filename, pic['data'], function(err){
                if(err) console.log(err);
                console.log("Wrote file!");
              });
            }
          })
        }
        if(doc == null){
          // insert the song
          app.db.songs.insert(song, function (err, newDoc){
            taglib_fetch(relative_location, newDoc._id);
            // update the browser the song has been added
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Added: " + newDoc["title"] + " - " + newDoc["albumartist"]
            });
          });
        } else if (hard_rescan){
          app.db.songs.update({location: relative_location}, song, {}, function(err, numRplaced){
            taglib_fetch(relative_location, doc._id);
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Updated: " + song["title"] + " - " + song["artist"]
            });
          })
        }
      });

      parser.on('done', function (err) {
        if (err) {
          // get the file extension
          var ext = "";
          if(relative_location.lastIndexOf(".") > 0) {
            ext = relative_location.substr(relative_location.lastIndexOf(".")+1, relative_location.length);
          }
          // if it was a metadata error and the file appears to be audio, add it
          if(err.toString().indexOf("Could not find metadata header") > 0
             && util.contains(song_extentions, ext)){
            console.log("Could not find metadata. Adding the song by filename.");
            // create a song with the filename as the title
            var song = {
              title: relative_location.substr(relative_location.lastIndexOf("/") + 1, relative_location.length),
              album: "Unknown (no tags)",
              artist: "Unknown (no tags)",
              albumartist: "Unknown (no tags)",
              display_artist: "Unknown (no tags)",
              genre: "Unknown",
              year: "Unknown",
              duration: 0,
              play_count: (doc == null) ? 0 : doc.play_count || 0,
              location: relative_location
            };
            if(doc == null){
              app.db.songs.insert(song, function (err, newDoc){
                taglib_fetch(relative_location, newDoc._id);
                // update the browser the song has been added
                broadcast("update", {
                  count: song_list.length,
                  completed: cnt,
                  details: "Added: " + newDoc["title"]
                });
              });
            } else if (hard_rescan){
              app.db.songs.update({location: relative_location}, song, {}, function(err, numRplaced){
                taglib_fetch(relative_location, doc._id);
                broadcast("update", {
                  count: song_list.length,
                  completed: cnt,
                  details: "Updated: " + song["title"]
                });
              })
            }
            callback(null);
          } else {
            callback(err);
          }
        } else {
          callback(null);
        }
      });
    } else {
      broadcast("update", {
        count: song_list.length,
        completed: cnt,
        details: "Already scanned item: " + item
      });
      callback(null);
    }
  })
}

function normaliseArtist(albumartist, artist){
  if(typeof(albumartist) != 'string'){
    if(albumartist.length == 0){
      albumartist = '';
    } else {
      albumartist = albumartist.join('/');
    }
  }
  if(typeof(artist) != 'string'){
    if(artist.length == 0){
      artist = '';
    } else {
      artist = artist.join('/');
    }
  }
  return (artist.length > albumartist.length) ? artist : albumartist;
}

function taglib_fetch(path, id){
  // use taglib to fetch duration
  taglib.read(config.music_dir + path, function(err, tag, audioProperties) {
    app.db.songs.update({ _id: id }, { $set: { duration: audioProperties.length} });
  });
}

// clear all the songs with `location` not in the dbs
function clearNotIn(list){
  app.db.songs.remove({location: { $nin: list }}, {multi: true}, function(err, numRemoved){
    console.log(numRemoved + " tracks deleted");
  });
}

// removes the items that have already been scanned from the list so that the
// scan can focus on items not scanned yet. Only used when not a hard scan
function remove_scanned(list, callback){
  app.db.songs.find({}, function(err, songs){
    if(!err){
      var unscanned_list = [];
      for(var list_cnt = 0; list_cnt < list.length; list_cnt++){
        var add = true;
        for(var song_cnt = 0; song_cnt < songs.length; song_cnt++){
          // if the song is found, don't add it and break to the next song
          if(songs[song_cnt].location == list[list_cnt]){
            add = false;
            break;
          }
        }
        // if no song matched the location, then it is an unscanned file and we should scan it
        if(add){
          unscanned_list.push(list[list_cnt]);
        }
      }
      callback(unscanned_list);
    } else {
      console.log(err);
    }
  });
}

exports.scanItems = function(app_ref, locations){
  app = app_ref;
  hard_rescan = true;
  running = true;
  song_list = song_list.concat(locations);
  findNextSong();
}

exports.scanLibrary = function(app_ref, hard){
  app = app_ref;
  hard_rescan = hard;
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    // list with paths with music_dir removed
    var stripped = [];
    for(var cnt = 0; cnt < list.length; cnt++){
      stripped.push(list[cnt].replace(config.music_dir, ""));
    }

    clearNotIn(stripped);
    if(!hard){
      remove_scanned(stripped, function(unscanned){
        song_list = unscanned;
        findNextSong();
      })
    } else {
      song_list = stripped;
      findNextSong();
    }
  });
  running = true;
}

exports.scDownload = function(app_ref, url){
  app = app_ref;
  // resolve the tracks
  scres.resolve( url, function(err, tracks) {
    console.log(url);
    console.log(tracks.length);
    // make sure the dl dir is existent
    var out_dir = path.join(config.music_dir, config.sc_dl_dir);
    mkdirp(out_dir, function(){
      // start an async loop to download the songs
      var finished = false;
      async.until(function(){ return tracks.length === 0; }, function(callback){
        // get the current item and remove it from the stack
        var current_track = tracks.pop();
        // create the location the song is written to
        var location = path.join(out_dir, current_track.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".mp3");
        // create the data to add to the database
        var song = {
          title: current_track.title || 'Unknown Title',
          album: current_track.label_name || 'Unknown Album',
          artist: current_track.user.username  || 'Unknown Artist',
          albumartist: current_track.user.username  || 'Unknown Artist',
          display_artist: current_track.user.username || 'Unknown Artist',
          genre: current_track.genre,
          year: current_track.release_year  || '2014',
          duration: current_track.duration/1000, // in milliseconds
          play_count: 0,
          location: location
        };
        // check if we need to download it
        fs.exists(location, function(exists){
          if(!exists){
            // download the song
            request(current_track.stream_url + "?client_id=" + config.sc_client_id).on('end', function(){
              // is artwork present?
              if(current_track.artwork_url){
                // download it's cover art
                var large_cover_url = current_track.artwork_url.replace('large.jpg', 't500x500.jpg');
                request({url: large_cover_url, encoding: null}, function(error, response, body){
                  // where are we storing the cover art?
                  var cover_location = md5(body) + ".jpg";
                  var filename = __dirname + '/dbs/covers/' + cover_location;
                  // does it exist?
                  fs.exists(filename, function(exists){
                    if(!exists){
                      fs.writeFile(filename, body, function(err){
                        console.log("Wrote cover to " + filename);
                      });
                    } else {
                      console.log("cover already present");
                    }
                  });
                  // add the song to the database
                  callback();
                });
              } else {
                // add without artwork to the database
                callback();
              }
            }).pipe(fs.createWriteStream(location));
          } else {
            console.log("File already exists ('" + location + "'). Most likely already in library.");
            callback();
          }
        });
      }, function(){
        // finished
        console.log("Finished Download");
      });
    });
  });
};

exports.sync_import = function(app_ref, songs, url){
  app = app_ref;
  // clean up the url
  if(url.indexOf("://") == -1){
    url = "http://" + url;
  }
  // import the sons
  for(var cnt = 0; cnt < songs.length; cnt++){
    var file_url = config.music_dir + songs[cnt].location;
    var folder_of_file = file_url.substring(0, file_url.lastIndexOf("/"));
    (function(cnt) {
      // create the folder
      mkdirp(folder_of_file, function(){
        var song_file_url = config.music_dir + songs[cnt].location;
        // download the file
        request(url + "/songs/" + songs[cnt]._id).on('end', function(){
          // once the song has been transferred successfully
          var addSong = function(song){
            app.db.songs.update({_id: song._id}, song, {upsert: true}, function (err, numReplaced, newDoc){
              // update the browser the song has been added
              console.log(newDoc);
            });
          };
          // is there a cover?
          if(songs[cnt].cover_location !== undefined){
            var cover_file_url = __dirname + '/dbs/covers/' + songs[cnt].cover_location;
            request(url + "/cover/" + songs[cnt].cover_location).on('end', function(){
              // once the cover has finished transferring add the song to the database
              addSong(songs[cnt]);
            }).pipe(fs.createWriteStream(cover_file_url));
          } else {
            // no cover, add the song to the database
            addSong(songs[cnt]);
          }
        }).pipe(fs.createWriteStream(song_file_url));
      });
    })(cnt);
  }
}

exports.stopScan = function(app){
  running = false;
}

function broadcast(id, message){
  app.io.broadcast(id, message);
}
