var fs = require('fs');
var path = require('path');
var MM = require('musicmetadata');
var md5 = require('md5');
var request = require('request');
var mkdirp = require('mkdirp');
var async = require('async');
var SoundcloudResolver = require('soundcloud-resolver');
var ytdl = require('ytdl-core');
var youtubePlaylistInfo = require('youtube-playlist-info').playlistInfo;
var ffbinaries = require('ffbinaries');
var hasbin = require('hasbin');

var util = require(path.join(__dirname, 'util.js'));

var ffmpeg = null;
var ffmetadata = null;

function binaryPath(extension) {
  extension = extension || '';
  if (extension && ffbinaries.detectPlatform().startsWith('win')) {
    extension += '.exe';
  }
  return path.join(app.get('configDir'), 'binaries', extension);
}

function downloadFFMpeg(callback) {
  var platform = ffbinaries.detectPlatform();

  ffbinaries.downloadFiles(platform, {
    components: ['ffmpeg', 'ffprobe'],
    destination: binaryPath()
  }, callback)
}

function loadFFMpegLibraries() {
  ffmpeg = require('fluent-ffmpeg');
  ffmetadata = require('ffmetadata-ohnx-fork');
}

function attemptFFMpegLoad() {
  hasbin.all(['ffmpeg', 'ffprobe'], function (hasFFMpeg) {
    if (hasFFMpeg) {
      loadFFMpegLibraries();
    } else {
      // load the modules setting the binary path
      process.env.FFMPEG_PATH = binaryPath('ffmpeg');
      process.env.FFPROBE_PATH = binaryPath('ffprobe');
      loadFFMpegLibraries();
      // download the binaries if we haven't already
      if (!fs.existsSync(binaryPath('ffmpeg')) ||
          !fs.existsSync(binaryPath('ffprobe'))) {
        console.log("FFMpeg binaries don't exist, downloading binaries...");
        mkdirp(binaryPath(), function() {
          downloadFFMpeg(function() {
            console.log('Completed download of ffmpeg binaries to ' +
                        binaryPath());
          });
        });
      }
    }
  });
}

// init other variables
var running = false;
var hard_rescan = false;
var app = null;
var cnt = 0;
var song_list = [];

var song_extensions = ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac', 'raw'];

function findNextSong() {
  if (cnt < song_list.length && running) {
    findSong(song_list[cnt], function(err) {
      if (err) {
        console.log({error: err, file: song_list[cnt]});
      }

      cnt++;
      setTimeout(findNextSong, 0);
    });
  } else {
    console.log('finished!');
    broadcast('scan_update', {type: 'finish', count: song_list.length, completed: song_list.length, details: 'Finished'});

    // run check for any missing durations in 5 seconds (in case there are a few still running)
    setTimeout(checkDurationMissing, 5000);

    // reset for next scan
    cnt = 0;
    song_list = [];
    running = false;
  }
}

function findSong(relative_location, callback) {
  var found_metadata = false;
  var song;

  // convert the filename into full path
  var full_location = path.join(app.get('config').music_dir, relative_location);
  app.db.songs.findOne({location: relative_location}, function(err, doc) {
    // only scan if we haven't scanned before, or we are scanning every document again
    if (doc === null || hard_rescan) {
      // insert the new song
      var stream = fs.createReadStream(full_location);
      stream.on('error', function() {
        app.db.songs.remove({location: relative_location}, {multi: false}, function(err, numRemoved) {
          console.log(numRemoved + ' track deleted');
        });
        callback(null);
      });
      stream.on('open', function() {
        var parser = new MM(stream, function(err, result) {

          console.log(result);

          // mark the songs added time as the time it was exactly added
          // so that it is seperate from other songs
          var now = Date.now();

          if (err) {
            // get the file extension
            var ext = '';
            if (relative_location.lastIndexOf('.') > 0) {
              ext = relative_location.substr(relative_location.lastIndexOf('.') + 1, relative_location.length);
            }

            // if it was a metadata error and the file appears to be audio, add it
            if (err.toString().indexOf('Could not find metadata header') > 0 &&
                util.contains(song_extensions, ext)) {
              console.log('Could not find metadata. Adding the song by filename.');

              // create a song with the filename as the title
              song = {
                title: relative_location.substr(relative_location.lastIndexOf(path.sep) + 1, relative_location.length),
                album: 'Unknown (no tags)',
                artist: 'Unknown (no tags)',
                albumartist: 'Unknown (no tags)',
                display_artist: 'Unknown (no tags)',
                genre: 'Unknown',
                year: 'Unknown',
                disc: 0,
                track: 0,
                duration: -1,
                play_count: (doc === null) ? 0 : doc.play_count || 0,
                location: relative_location,
                date_added: now,
                date_modified: now,
              };

              if (doc === null) {
                app.db.songs.insert(song, function(err, newDoc) {
                  duration_fetch(relative_location, newDoc._id);

                  // update the browser the song has been added
                  broadcast('scan_update', {
                    type: 'add',
                    count: song_list.length,
                    completed: cnt,
                    details: 'Added: ' + newDoc.title,
                    doc: newDoc,
                  });
                  callback(null);
                });
              } else if (hard_rescan) {
                // use the old date_added
                if (doc.date_added) {
                  song.date_added = doc.date_added;
                }

                // update the document
                app.db.songs.update({location: relative_location}, song, {}, function(err, numRplaced) {
                  duration_fetch(relative_location, doc._id);
                  broadcast('scan_update', {
                    type: 'update',
                    count: song_list.length,
                    completed: cnt,
                    details: 'Updated: ' + song.title,
                  });
                  callback(null);
                });
              } else {
                callback(null);
              }
            } else {
              callback(err);
            }
          } else {
            // add the location
            song = {
              title: result.title,
              album: result.album,
              artist: result.artist,
              albumartist: result.albumartist,
              display_artist: normaliseArtist(result.albumartist, result.artist),
              genre: result.genre,
              year: result.year,
              disc: (result.disk || {no:0}).no || 0,
              track: (result.track || {no:0}).no || 0,
              duration: -1,
              play_count: (doc === null) ? 0 : doc.play_count || 0,
              location: relative_location,
              date_added: now,
              date_modified: now,
            };

            // write the cover photo as an md5 string
            if (result.picture.length > 0) {
              pic = result.picture[0];
              pic.format = pic.format.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              song.cover_location = md5(pic.data) + '.' + pic.format;
              filename = app.get('configDir') + '/dbs/covers/' + song.cover_location;
              fs.exists(filename, function(exists) {
                if (!exists) {
                  fs.writeFile(filename, pic.data, function(err) {
                    if (err) console.log(err);
                    console.log('Wrote file!');
                  });
                }
              });
            }

            if (doc === null) {
              // insert the song
              app.db.songs.insert(song, function(err, newDoc) {
                duration_fetch(relative_location, newDoc._id);

                // update the browser the song has been added
                broadcast('scan_update', {
                  type: 'add',
                  count: song_list.length,
                  completed: cnt,
                  details: 'Added: ' + newDoc.title + ' - ' + newDoc.albumartist,
                  doc: newDoc,
                });
                callback(null);
              });
            } else if (hard_rescan) {
              // use the old date_added
              if (doc.date_added) {
                song.date_added = doc.date_added;
              }

              // update the document
              app.db.songs.update({location: relative_location}, song, {}, function(err, numRplaced) {
                duration_fetch(relative_location, doc._id);
                broadcast('scan_update', {
                  type: 'update',
                  count: song_list.length,
                  completed: cnt,
                  details: 'Updated: ' + song.title + ' - ' + song.artist,
                  doc: doc,
                });
                callback(null);
              });
            } else {
              callback(null);
            }
          }
        });
      });
    }
  });
}

function normaliseArtist(albumartist, artist) {
  if (typeof (albumartist) != 'string') {
    if (albumartist.length === 0) {
      albumartist = '';
    } else {
      albumartist = albumartist.join('/');
    }
  }

  if (typeof (artist) != 'string') {
    if (artist.length === 0) {
      artist = '';
    } else {
      artist = artist.join('/');
    }
  }

  return (artist.length > albumartist.length) ? artist : albumartist;
}

function duration_fetch(path, id) {
  // use musicmetadata with duration flag to fetch duration
  var parser = new MM(fs.createReadStream(app.get('config').music_dir + path), { duration: true }, function(err, result) {
    if (!err) {
      app.db.songs.update({ _id: id }, { $set: { duration: result.duration} });
      broadcast('duration_update', {
        _id: id,
        new_duration: result.duration,
      });
    }
  });
}

function checkDurationMissing() {
  app.db.songs.find({duration: -1}, function(err, docs) {
    console.log(docs);
    for (var i in docs) {
      duration_fetch(docs[i].location, docs[i]._id);
    }
  });
}

// clear all the songs with `location` not in the dbs
function clearNotIn(list) {
  app.db.songs.remove({location: { $nin: list }}, {multi: true}, function(err, numRemoved) {
    console.log(numRemoved + ' tracks deleted');
  });
}

// removes the items that have already been scanned from the list so that the
// scan can focus on items not scanned yet. Only used when not a hard scan
function remove_scanned(list, callback) {
  app.db.songs.find({}, function(err, songs) {
    if (!err) {
      var unscanned_list = [];
      for (var list_cnt = 0; list_cnt < list.length; list_cnt++) {
        var add = true;
        for (var song_cnt = 0; song_cnt < songs.length; song_cnt++) {
          // if the song is found, don't add it and break to the next song
          if (songs[song_cnt].location == list[list_cnt]) {
            add = false;
            break;
          }
        }

        // if no song matched the location, then it is an unscanned file and we should scan it
        if (add) {
          unscanned_list.push(list[list_cnt]);
        }
      }

      callback(unscanned_list);
    } else {
      console.log(err);
    }
  });
}

// must be called before anything else
exports.setApp = function(appRef) {
  app = appRef;
  attemptFFMpegLoad();
};

exports.scanItems = function(locations) {
  hard_rescan = true;
  running = true;
  song_list = song_list.concat(locations);
  findNextSong();
};

exports.scanLibrary = function(hard) {
  hard_rescan = hard;
  util.walk(app.get('config').music_dir, function(err, list) {
    if (err) {
      console.log(err);
    }

    // list with paths with music_dir removed
    var stripped = [];
    list.forEach(function(item) {
      if (item) {
        stripped.push(item.replace(app.get('config').music_dir, ''));
      }
    });

    clearNotIn(stripped);
    if (!hard) {
      remove_scanned(stripped, function(unscanned) {
        song_list = unscanned;
        findNextSong();
      });
    } else {
      song_list = stripped;
      findNextSong();
    }
  });

  running = true;
};

// add a song_id to a certain playlist
var addToPlaylist = function(song_id, playlist_name) {
  app.db.playlists.findOne({ title: playlist_name}, function(err, doc) {
    if (!doc) {
      // playlist doesn't exist, add it
      var plist = {
        title: playlist_name,
        songs: [{_id: song_id}],
        editable: true,
      };
      app.db.playlists.insert(plist, function(err, newDoc) {
        broadcast('addPlaylist', newDoc);
      });
    } else {
      // playlist does exist, inser the song if it isn't already in there
      var found = false;
      for (var i = 0; i < doc.songs.length; i++) {
        if (doc.songs[i]._id == song_id) {
          found = true;
          break;
        }
      }

      if (!found) {
        // it isn't in there, add it
        app.db.playlists.update({_id: doc._id}, { $push:{songs: {_id: song_id}}});
      }
    }
  });
};

// make it visible outside this module
exports.addToPlaylist = addToPlaylist;

exports.scDownload = function(url) {
  // init the soundcloud resolver with the clientid
  var scres = new SoundcloudResolver(app.get('config').soundcloud.client_id);

  // resolve the tracks
  scres.resolve(url, function(err, tracks) {
    if (err) {
      console.log(err);
    } else {
      var track_length = tracks.length;

      // filter out not streamable tracks
      var not_streamable = 0;
      for (var x = 0; x < tracks.length; x++) {
        if (!tracks[x].streamable) {
          // remove it and modify the index
          tracks.splice(x, 1);
          x--;

          // increment not streamable
          not_streamable++;
        }
      }

      // update the client
      broadcast('sc_update', {
        type: 'started',
        count: track_length,
        not_streamable: not_streamable,
        completed: 0,
      });

      // make sure the dl dir is existent
      var out_dir = path.join(app.get('config').music_dir, app.get('config').soundcloud.dl_dir);
      mkdirp(out_dir, function() {
        // start an async loop to download the songs
        var finished = false;
        async.until(function() { return tracks.length === 0; }, function(callback) {
          // get the current item and remove it from the stack
          var current_track = tracks.pop();

          // create the location the song is written to
          var location = path.join(out_dir, current_track.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.mp3');

          // use the time the song is actually added as the added time
          var now = Date.now();

          // create the data to add to the database
          var song = {
            title: current_track.title || 'Unknown Title',
            album: current_track.label_name || 'Unknown Album',
            artist: current_track.user.username  || 'Unknown Artist',
            albumartist: current_track.user.username  || 'Unknown Artist',
            display_artist: current_track.user.username || 'Unknown Artist',
            genre: current_track.genre,
            year: current_track.release_year  || '2014',
            disc: 0,
            track: 0,
            duration: current_track.duration / 1000, // in milliseconds
            play_count: 0,
            location: location.replace(app.get('config').music_dir, ''),
            date_added: now,
            date_modified: now,
          };

          // prep function to run after we have finished grabbing all the files we can
          var finish_add = function() {
            // add the song
            app.db.songs.insert(song, function(err, newDoc) {
              addToPlaylist(newDoc._id, 'SoundCloud');

              // update the browser the song has been added
              broadcast('sc_update', {
                type: 'added',
                count: track_length,
                completed: track_length - tracks.length,
                content: newDoc,
              });

              // enter next iteration
              callback();

              // lazy save the id3 tags to the file
              saveID3(song);
            });
          };

          // check if we need to download it
          fs.exists(location, function(exists) {
            if (!exists) {
              // download the song
              request(current_track.stream_url + '?client_id=' + app.get('config').soundcloud.client_id, function(error, response, body) {
                if (error) {
                  console.log('Error downloading soundcloud track: ' + error);
                }

                // if it was an rmtp stream / didn't download
                if (!response || response.headers['content-length'] == 1) {
                  // remove the file
                  fs.unlink(location);

                  // update the client
                  broadcast('sc_update', {
                    type: 'skipped',
                    count: track_length,
                    completed: track_length - tracks.length,
                  });
                  callback();
                  return;
                }

                // is artwork present?
                if (current_track.artwork_url) {
                  // download it's cover art
                  var large_cover_url = current_track.artwork_url.replace('large.jpg', 't500x500.jpg');
                  downloadCoverArt(large_cover_url, function(cover_location) {
                    song.cover_location = cover_location;
                    finish_add();
                  });
                } else {
                  // add without artwork to the database
                  finish_add();
                }
              }).pipe(fs.createWriteStream(location));
            } else {
              console.log('File already exists (\'' + location + '\'). Most likely already in library. Either scan libaray or remove file and start again.');
              broadcast('sc_update', {
                type: 'error',
                content: 'Track already exists',
              });
              callback();
            }
          });
        }, function() {
          // finished
          console.log('Finished Download');
        });
      });
    }
  });
};

// download an entire youtube playlist, makes use of ytDownload below
function ytPlaylistDownload(playlistId, callback) {
  // fetch the playlist information
  youtubePlaylistInfo(app.get('config').youtube.api, playlistId, function(results) {
    // setup a queue, to run this function in parallel, the concurrency
    // of this is definied as youtube.parallel_download in config.js
    var queue = async.queue(function(result, next) {
      module.exports.ytDownload({url: 'https://www.youtube.com/watch?v=' + result.resourceId.videoId}, next);
    }, app.get('config').youtube.parallel_download);

    // when done, call the callback
    if (callback) {
      queue.drain = callback;
    }

    // add all the items to the queue
    queue.push(results);
  });
}

var playlistRegex = /playlist\?list=(.*)(\&|$)/g;
exports.ytDownload = function(data, finalCallback) {
  // check to see if this is a playlist download
  var playlistId = playlistRegex.exec(data.url);

  // if it was a playlist, trigger the playlist download
  if (playlistId && playlistId.length > 2) {
    ytPlaylistDownload(playlistId[1], finalCallback);
  } else {
    // othwerwise, the url must be an invidual video, download that
    if (ffmpeg) {
      var trackInfo = null;
      var out_dir = path.join(app.get('config').music_dir, app.get('config').youtube.dl_dir);
      var location = null;
      mkdirp(out_dir, function() {
        async.waterfall([
          function(callback) {
            broadcast('yt_update', {
              type: 'started',
            });
            callback();
          },

          function(callback) {
            ytdl.getInfo(data.url, function(err, info) {
              if (!err) {
                trackInfo = info;
                location = path.join(out_dir, trackInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.mp3');
                fs.exists(location, function(exists) {
                  if (!exists) {
                    callback();
                  } else {
                    callback(true, {
                      message: 'Youtube track already exists.',
                    });
                  }
                });
              } else {
                callback(true, {
                  message: 'Error fetching info: ' + err,
                });
              }
            });
          },

          function(callback) {
            ffmpeg(ytdl(data.url, {
                quality: 'highest',
                filter: function(format) { return format.resolution === null; },
              }))
              .noVideo()
              .audioCodec('libmp3lame')
              .on('start', function() {
                console.log('Started converting Youtube movie to mp3');
              })
              .on('end', function() {
                console.log('finished!');
                callback(false);
              })
              .on('error', function(err) {
                callback(err, {message: err});
              })
              .save(location);
          },
        ], function(error, errorMessage) {
          if (!error) {
            var now = Date.now();
            var song;

            var saveData = function(song) {
              app.db.songs.update({location: song.location}, song,
                {upsert: true, returnUpdatedDocs: true},
                function(err, numAffected, newDoc, upsert) {
                  broadcast('yt_update', {
                    type: upsert ? 'added': 'updated',
                    content: newDoc,
                  });

                  addToPlaylist(newDoc._id, 'Youtube');

                  // update the browser the song has been added


                  // lazy save the id3 tags to the file
                  saveID3(song);

                  // call the final callback because we are finished downloading
                  if (finalCallback)
                    finalCallback();
                });
            };

            // decide how to build the metadata based on if we have it or not
            if (!data.title) {
              var dashpos = trackInfo.title.indexOf('-');
              var title = trackInfo.title;
              var artist = trackInfo.title;

              // if there is a dash, set them in the assumed format [artist] - [title]
              if (dashpos != -1) {
                artist = trackInfo.title.substr(0, dashpos).trim();
                title = trackInfo.title.substr(dashpos + 1).trim();
              }

              song = {
                title: title || 'Unknown Title',
                album: trackInfo.title || 'Unknown Album',
                artist: artist || 'Unknown Artist',
                albumartist: artist || 'Unknown Artist',
                display_artist: artist || 'Unknown Artist',
                genre: 'Unknown Genre',
                year: new Date().getFullYear(),
                disc: 0,
                track: 0,
                duration: trackInfo.length_seconds,
                play_count: 0,
                location: location.replace(app.get('config').music_dir, ''),
                date_added: now,
                date_modified: now,
              };

              saveData(song);
            } else {
              song = {
                title: data.title || 'Unknown Title',
                album: data.album || 'Unknown Album',
                artist: data.artist || 'Unknown Artist',
                albumartist: data.album || 'Unknown Artist',
                display_artist: data.artist || 'Unknown Artist',
                genre: data.genre,
                year: new Date().getFullYear(),
                disc: data.disc,
                track: data.track,
                duration: trackInfo.length_seconds,
                play_count: 0,
                location: location.replace(app.get('config').music_dir, ''),
                date_added: now,
                date_modified: now,
              };

              downloadCoverArt(data.cover_location, function(cover_location) {
                song.cover_location = cover_location;
                saveData(song);
              });
            };
          } else {
            if (typeof error != Object) {
              error = {
                message: errorMessage.message,
              };
            }

            console.log('Error: ' + errorMessage.message);
            broadcast('yt_update', {
              type: 'error',
              content: error.message,
            });
            if (finalCallback)
              finalCallback();
          }
        });
      });
    } else {
      var msg = 'Youtube downloading requires ffmpeg. Please install ffmpeg and try `npm install` again.';
      console.log(msg);
      broadcast('yt_update', {
        type: 'error',
        content: msg,
      });
    }
  }
};

exports.sync_import = function(songs, url) {
  // clean up the url
  if (url.indexOf('://') == -1) {
    url = 'http://' + url;
  }

  // import the songs
  var cnt = 0;
  async.until(function() { return songs.length == cnt; }, function(callback) {

    var file_url = app.get('config').music_dir + songs[cnt].location;
    var folder_of_file = file_url.substring(0, file_url.lastIndexOf(path.sep));

    // create the folder
    mkdirp(folder_of_file, function() {
        var song_file_url = app.get('config').music_dir + songs[cnt].location;

        // download the file
        request(url + '/songs/' + songs[cnt]._id).on('end', function() {
          // once the song has been transferred successfully
          var addSong = function(song) {
            // if the song doesn't have the dates set, set them
            if (song.date_added === undefined) {
              var now = Date.now();
              song.date_added = now;
              song.date_modified = now;
            }

            // upsert the song
            app.db.songs.update({_id: song._id}, song, {upsert: true}, function(err, numReplaced, newDoc) {
              // incrememnt the count to be the next index
              cnt++;

              // update the browser with the sync status
              broadcast('sync_update', {
                type: 'add',
                count: songs.length,
                completed: cnt,
                content: song,
              });

              // start the next iteration
              callback();
            });
          };

          // is there a cover?
          if (songs[cnt].cover_location !== undefined) {
            var cover_file_url = app.get('configDir') + '/dbs/covers/' + songs[cnt].cover_location;
            request(url + '/cover/' + songs[cnt].cover_location).on('end', function() {
              // once the cover has finished transferring add the song to the database
              addSong(songs[cnt]);
            }).pipe(fs.createWriteStream(cover_file_url));
          } else {
            // no cover, add the song to the database
            addSong(songs[cnt]);
          }
        }).pipe(fs.createWriteStream(song_file_url));
      });
  }, function() {
    // finished
    console.log('Finished Syncing songs to this computer');
  });
};

exports.stopScan = function(app) {
  running = false;
};

function saveID3(songData) {
  // did we successfully load the ffmetadata library

  if (ffmetadata) {
    // only commit the fields ffmpeg will honor: http://wiki.multimedia.cx/index.php?title=FFmpeg_Metadata#MP3
    var data = {
      title: songData.title,
      artist: [songData.display_artist],
      album: songData.album,
      year: songData.year,
      genre: songData.genre,
    };

    // add the cover art if available
    var options = {};
    if (songData.cover_location) {
      // assign it in array format with 1 element
      options.attachments = [path.join(app.get('configDir') + '/dbs/covers/' + songData.cover_location)];
    }

    var destinationFile = path.join(app.get('config').music_dir, songData.location);

    // write the to the id3 tags on the file
    ffmetadata.write(destinationFile, data, options, function(err) {
      if (err) {
        console.log('Error writing id3 tags to file: ' + err);
      } else {
        console.log('Successfully wrote id3 tags to file: ' + destinationFile);
      }
    });
  }
}

// fetch coverart for url
function downloadCoverArt(url, callback) {
  request({url: url, encoding: null}, function(error, response, body) {
    // where are we storing the cover art?
    var cover_location = md5(body) + '.jpg';
    var filename = app.get('configDir') + '/dbs/covers/' + cover_location;

    // does it exist?
    fs.exists(filename, function(exists) {
      if (!exists) {
        fs.writeFile(filename, body, function(err) {
          callback(cover_location);
        });
      } else {
        callback(cover_location);
      }
    });
  });
}

// make the function visible outside this module
exports.saveID3 = saveID3;

function broadcast(id, message) {
  app.io.sockets.emit(id, message);
}
