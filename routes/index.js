var util = require(__dirname + '/../util.js');
var lib_func = require(__dirname + '/../library_functions.js');
var async = require('async');
var AdmZip = require('adm-zip');
var os = require('os');
var opener = require('opener');
var md5 = require('MD5');
var request = require('request').defaults({ encoding: null });
var fs = require('fs');
var path = require('path');
var MobileDetect = require('mobile-detect');
/*
 * GET home page.
 */

app = null;

exports.createRoutes = function(app_ref){
  app = app_ref;
  app.get('/', musicRoute);
  app.get('/remote/:name', musicRoute);
  app.get('/songs/:id', sendSong);
  app.get('/cover/:id', sendCover);
  app.get('/downloadplaylist/:id', downloadPlaylist);
  // remote control commands
  app.get('/command/:name/:command', remoteCommand);
  app.io.route('player_page_connected', function(req){ req.io.join('players'); });
  // remote functions
  app.io.route('set_comp_name', setCompName);
  // scanning signals
  app.io.route('scan_page_connected', function(req){ req.io.join('scanners'); });
  app.io.route('start_scan', function(req){ lib_func.scanLibrary(app, false); });
  app.io.route('start_scan_hard', function(req){ lib_func.scanLibrary(app, true); });
  app.io.route('stop_scan', function(req){ lib_func.stopScan(app); });
  app.io.route('hard_rescan', rescanItem);
  // send the songs to the client
  app.io.route('fetch_songs', returnSongs);
  // playlist modifications
  app.io.route('fetch_playlists', returnPlaylists);
  app.io.route('create_playlist', createPlaylist);
  app.io.route('rename_playlist', renamePlaylist);
  app.io.route('delete_playlist', deletePlaylist);
  app.io.route('add_to_playlist', addToPlaylist);
  app.io.route('remove_from_playlist', removeFromPlaylist);
  app.io.route('song_moved_in_playlist', songMovedInPlaylist);
  // play count
  app.io.route('update_play_count', updatePlayCount);
  // remote control routes
  app.io.route('get_receivers', getReceiversMinusThis);
  // open file manager to location
  app.io.route('open_dir', function(req){ opener(req.data.substring(0, req.data.lastIndexOf(path.sep))); });
  // update the info of a song
  app.io.route('update_song_info', updateSongInfo);
  // sync routes
  app.io.route('sync_page_connected', syncPageConnected);
  app.io.route('sync_playlists', syncPlaylists);
  // soundcloud downloading
  app.io.route('soundcloud_download', soundcloudDownload);
  app.io.route('youtube_download', youtubeDownload);
};

function musicRoute(req, res){
  // test if client is mobile
  md = new MobileDetect(req.headers['user-agent']);
  // get ip (for syncing functions)
  util.getip(function(ip){
    // render the view
    res.render((md.mobile() ? 'mobile' : 'index'), {
      menu: !md.mobile(),
      music_dir: app.get('config').music_dir,
      music_dir_set: app.get('config').music_dir_set,
      country_code: app.get('config').country_code,
      ip: ip + ":" + app.get('port'),
      remote_name: req.params.name
    });
  });
}

function sendSong(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(err || !song){
      res.status(404).send();
    } else {
      res.sendfile(path.join(app.get('config').music_dir, encodeURIComponent(song.location)));
    }
  });
}

function sendCover(req, res){
  // if they passed the location of the cover, fetch it
  if(req.params.id.length > 0){
    res.sendfile(app.get('root') + '/dbs/covers/' + encodeURIComponent(req.params.id));
  } else {
    res.sendfile(app.get('root') + "/static/images/unknown.png");
  }
}

function downloadPlaylist(req, res){
  app.db.playlists.findOne({_id: req.params.id}, function(err, playlist){
    if(err) throw err;
    // create zip
    var filename = os.tmpdir() + '/download.zip';
    var zip = new AdmZip();
    async.forEach(playlist.songs, function(item, callback){
      app.db.songs.findOne({_id: item._id}, function(err, song){
        if(err) throw err;
        var zip_location;
        if(song.location.lastIndexOf(path.sep) > 0){
          zip_location = song.location.substring(0, song.location.lastIndexOf(path.sep));
        } else {
          zip_location = song.location;
        }
        zip.addLocalFile(path.join(app.get('config').music_dir, song.location), zip_location);
        callback();
      });
    }, function(err){
      // convert the zip to a buffer
      zip.toBuffer(function(buffer){
        // download the buffer
        res.setHeader('Content-disposition', 'attachment; filename=download.zip');
        res.end(buffer, 'binary');
      });
    });
  });
}

function returnSongs(req){
  get_songs(function(songs){
    req.io.emit('songs', {"songs": songs});
  });
}

function get_songs(callback){
  app.db.songs.find({}, function(err, songs){
    if(!err){
      callback(songs);
    } else {
      callback([]);
    }
  });
}

function returnPlaylists(req){
  // send the playlists back to the user
  get_playlists(function(playlists){
    req.io.emit('playlists', {"playlists": playlists});
  });
}

function get_playlists(callback){
  app.db.playlists.find({}).sort({ title: 1 }).exec(function(err, docs){
    playlists = docs;
    // create a new playlist for the library
    getLibraryIds(function(result){
      // add library
      playlists.unshift({
        _id: "LIBRARY",
        title: "Library",
        songs: result,
        editable: false
      });
      // add queue
      playlists.unshift({
        _id: "QUEUE",
        title: "Queue",
        songs: [], // populated by client
        editable: false
      });
      // send the playlists back to the user
      callback(playlists);
    });
  });
}

// get the _id's of every song in the library
function getLibraryIds(callback){
  app.db.songs.find({}).sort({ title: 1 }).exec(function(err, docs){
    for(var i = 0; i < docs.length; i++){
      docs[i] = {_id: docs[i]._id};
    }
    callback(docs);
  });
}

function createPlaylist(req){
  plist = {
    title: req.data.title,
    songs: req.data.songs,
    editable: true
  };
  app.db.playlists.insert(plist, function(err, doc){
    req.io.route('fetch_playlists');
  });
}

function renamePlaylist(req){
  var id = req.data.id;
  var title = req.data.title;
  app.db.playlists.update({_id: id}, { $set: {title: title} }, function(){
    req.io.route('fetch_playlists');
  });
}

function deletePlaylist(req){
  del = req.data.del;
  app.db.playlists.remove({_id: del}, {}, function(err, numRemoved){
    req.io.route('fetch_playlists');
  });
}

function addToPlaylist(req){
  addItems = req.data.add;
  to = req.data.playlist;
  // pull the playlists database
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    // used as a counter to count how many still need to be added
    waitingOn = 0;
    // prep function for use in loop
    var checkFinish = function(){
      if(--waitingOn === 0){
        req.io.route('fetch_playlists');
      }
    };
    // run loop
    for (var i = 0; i < addItems.length; i++) {
      var found = false;
      for(var j = 0; j < doc.songs.length; j++){
        if(doc.songs[j]._id == addItems[i]){
          found = true;
          break;
        }
      }
      if(!found){
        waitingOn++;
        app.db.playlists.update({_id: to}, { $push:{songs: {_id: addItems[i]}}}, checkFinish);
      }
    }
  });
}

function removeFromPlaylist(req){
  removeItems = req.data.remove;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    var tmpSongs = [];
    for(var i = 0; i < doc.songs.length; i++){
      if(removeItems.indexOf(doc.songs[i]._id) == -1){
        tmpSongs.push(doc.songs[i]);
      }
    }
    app.db.playlists.update({_id: to}, { $set:{songs: tmpSongs}}, function(){
      req.io.route('fetch_playlists');
    });
  });
}

function songMovedInPlaylist(req){
  var playlist_id = req.data.playlist_id;
  var oldIndex = req.data.oldIndex;
  var newIndex = req.data.newIndex;
  app.db.playlists.findOne({ _id: playlist_id}, function (err, playlist) {
    // remove the item from it's old place
    var item = playlist.songs.splice(oldIndex, 1)[0];
    // add the item into it's new place
    playlist.songs.splice(newIndex, 0, item);
    // update the playlist with the new order
    app.db.playlists.update({_id: playlist_id}, { $set:{songs: playlist.songs}});
  });
}

// update song play count
function updatePlayCount(req){
  var _id = req.data.track_id;
  var plays = req.data.plays;
  // apply the new play_count to the database
  app.db.songs.update({_id: _id}, { $set: { play_count: plays } });
}

// force rescan of a set of items
function rescanItem(req){
  var items = req.data.items;
  var songLocArr = [];
  app.db.songs.find({ _id: { $in: items }}, function(err, songs){
    if(!err && songs)
        // add the location to the list of songs to scan
      for (var i = 0; i < songs.length; i++) {
        songLocArr.push(songs[i].location);
      }
      lib_func.scanItems(app, songLocArr);
  });
}

// update the details for a song
function updateSongInfo(req){
  // update the details about the song in the database (minus the cover)
  app.db.songs.update({_id: req.data._id}, {
    $set: {
      title: req.data.title,
      display_artist: req.data.artist,
      album: req.data.album,
      date_modified: Date.now() // it has been modified, update it
    }
  });
  // update the cover photo
  var cover = req.data.cover;
  if(cover !== null){
    // function to be called by both download file and file upload methods
    var process_cover = function(type, content_buffer){
      var cover_filename = md5(content_buffer) + "." + type;
      var location = app.get('root') + '/dbs/covers/' + cover_filename;
      fs.exists(location, function(exists){
        if(!exists){
          fs.writeFile(location, content_buffer, function(err){
            if(err){
              console.log(err);
            } else {
              console.log("Wrote cover here: " + location);
            }
          });
        }
        // update the songs cover even if the image already exists
        app.db.songs.update({display_artist: req.data.artist, album: req.data.album}, {
          $set: {
            cover_location: cover_filename
          }
        }, { multi: true }, function (err, numReplaced) {
          app.db.songs.find({display_artist: req.data.artist, album: req.data.album}, function(err, tracks){
            app.io.broadcast("song_update", tracks);
          });
        });
      });
    };
    // different methods of setting cover
    if(req.data.cover_is_url && req.data.cover_is_lastfm){
      // they fetched the cover from lastfm
      request(cover, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var type = response.headers['content-type'].split('/').pop();
          process_cover(type, body);
        }
      });
    } else {
      // they dropped a file to upload
      var image = util.decodeBase64Image(cover);
      process_cover(image.type, image.data);
    }
  }
}

// controller routes

function remoteCommand(req, res){
  // get params
  var command = req.params.command;
  var name = req.params.name;
  // bool to see if server was found
  var command_sent = false;
  // find destination machine and send the command
  var receivers = getReceiverList();
  receivers.forEach(function(client){
    if(client.store.data.name &&
      client.store.data.name.length > 0 &&
      client.store.data.name == name){
      client.emit("command", {command: command});
      // mark it as sent
      command_sent = true;
    }
  });
  if(command_sent){
    res.send("OK");
  } else {
    res.send("NAME_NOT_FOUND");
  }
}

function setCompName(req){
  req.io.join('receivers');
  req.socket.set('name', req.data.name);
}

function getReceiverList(req){
  return app.io.sockets.clients('receivers');
}

function getReceiversMinusThis(req){
  var receivers = getReceiverList();
  var validReceivers = [];
  receivers.forEach(function(client){
    if(client.store.data.name && client.store.data.name.length > 0){
      validReceivers.push({
        id: client.id,
        name: client.store.data.name
      });
    }
  });
  req.io.emit('recievers', {"recievers": validReceivers});
}

// sync routes
function syncPageConnected(req){
  // get the playlist data
  get_playlists(function(playlists){
    // get the songs data
    get_songs(function(songs){
      req.io.emit('alldata', {"playlists": playlists, "songs": songs});
    });
  });
}

// the playlists to sync have been selected, sync them
function syncPlaylists(req){
  var lists = req.data.playlists;
  // function for within loop
  var playlistResult = function(err, numReplaced, newDoc){
    if(newDoc){
      console.log("Inserted playlist: " + newDoc.title);
    } else {
      console.log("Updated playlist");
    }
  };
  // loop over lists to join editable lists
  for(var list_cnt = 0; list_cnt < lists.length; list_cnt++){
    // attempt to replace the playlist if it is editable
    if(lists[list_cnt].editable){
      app.db.playlists.update({_id: lists[list_cnt]._id}, lists[list_cnt], {upsert: true}, playlistResult);
    }
  }
  var songs = req.data.songs;
  var remote_url = req.data.remote_url;
  lib_func.sync_import(app, songs, remote_url);
}

// download the soundcloud songs from the requested url
function soundcloudDownload(req){
  lib_func.scDownload(app, req.data.url);
}

// download the youtube song
function youtubeDownload(req){
  lib_func.ytDownload(app, req.data.url);
}
