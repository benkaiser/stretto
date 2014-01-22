var fs = require('fs');
var mm = require('musicmetadata');
var md5 = require('MD5');

var util = require(__dirname + '/util.js');
var config = require(__dirname + '/config').config();

var running = false;
var hard_rescan = false;
var app = null;
var cnt = 0;
var song_list = [];

function findNextSong(){
  if(cnt < song_list.length && running){
    findSong(song_list[cnt], function(err, title){
      cnt++;
      setTimeout(findNextSong, 0);
    });
  } else {
    console.log("finished!");
    broadcast("update", {count: song_list.length, completed: song_list.length, details: "Finished"});
    // reset for next scan
    cnt = 0;
  }
}

function findSong(item, callback){
  app.db.songs.findOne({location: item}, function(err, doc){
    // only scan if we haven't scanned before, or we are scanning every document again
    if(doc == null || hard_rescan){
      // insert the new song
      var parser = new mm(fs.createReadStream(item));

      parser.on('metadata', function(result){
        // add the location
        song = {
          title: result.title,
          album: result.album,
          artist: result.artist,
          albumartist: result.albumartist,
          genre: result.genre,
          year: result.year,
          duration: result.duration,
          location: item
        };
        // write the cover photo as an md5 string
        if(result.picture.length > 0){
          pic = result.picture[0];
          filename = __dirname + '/dbs/covers/' + md5(pic['data']) + "." + pic["format"];
          song.cover_location = filename;
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
            // update the browser the song has been added
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Added: " + newDoc["title"] + " - " + newDoc["albumartist"]
            });
          });
        } else if (hard_rescan){
          app.db.songs.update({location: item}, song, {}, function(err, numRplaced){
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
          callback(err);
        }
        callback(null);
      });
    } else {
      // perform rescan? hard rescan option?
      callback(null);
    }
  })
}

exports.scanLibrary = function(app_ref, hard){
  app = app_ref;
  hard_rescan = hard;
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    song_list = list;
    findNextSong();

  });
  running = true;
}

exports.stopScan = function(app){
  running = false;
}

function broadcast(id, message){
  app.io.room('scanners').broadcast(id, message);
}