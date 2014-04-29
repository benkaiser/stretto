var util = require(__dirname + '/../util.js');
var lib_func = require(__dirname + '/../library_functions.js');
var config = require(__dirname + '/../config').config();
var async = require('async');
var AdmZip = require('adm-zip');
var os = require('os');
/*
 * GET home page.
 */

app = null;

exports.createRoutes = function(app_ref){
  app = app_ref;
  app.get('/', musicRoute);
  app.get('/mobile', mobileMusicRoute);
  app.get('/scan', scanRoute);
  app.get('/songs/:id', sendSong);
  app.get('/cover/:id', sendCover);
  app.get('/downloadplaylist/:id', downloadPlaylist);
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
  app.io.route('delete_playlist', deletePlaylist);
  app.io.route('add_to_playlist', addToPlaylist);
  app.io.route('remove_from_playlist', removeFromPlaylist);
  // play count
  app.io.route('update_play_count', updatePlayCount);
  // remote control routes
  app.io.route('get_receivers', getReceivers);
};

function musicRoute(req, res){
  res.render('index', {menu: true});
}

function mobileMusicRoute(req, res){
  res.render('mobile', {menu: false});
}

function sendSong(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(err || !song){
      res.status(404).send();
    } else {
      res.sendfile(encodeURIComponent(song.location));
    }
  });
}

function sendCover(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(!song || !song.hasOwnProperty("cover_location")){
      res.sendfile("/static/images/unknown.png", {root: __dirname + "/../"});
    } else {
      res.sendfile(song.cover_location);
    }
  });
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
        //song.location.replace(config.music_dir, '')
        zip.addLocalFile(song.location, "/");
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
  app.db.songs.find({}, function(err, docs){
    if(!err){
      req.io.emit('songs', {"songs": docs});
    }
  });
}

function returnPlaylists(req){
  app.db.playlists.find({}, function(err, docs){
    playlists = docs;
    getLibraryIds(function(result){
      playlists.push({
        _id: "LIBRARY",
        title: "Library",
        songs: result,
        editable: false
      });
      req.io.emit('playlists', {"playlists": playlists});
    });
  });
}

function getLibraryIds(callback){
  app.db.songs.find({}, function(err, docs){
    for(var i = 0; i < docs.length; i++){
      docs[i] = {_id: docs[i]["_id"]};
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

function deletePlaylist(req){
  del = req.data.del;
  app.db.playlists.remove({_id: del}, {}, function(err, numRemoved){
    req.io.route('fetch_playlists');
  });
}

function addToPlaylist(req){
  addItems = req.data.add;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    waitingOn = 0;
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
        app.db.playlists.update({_id: to}, { $push:{songs: {_id: addItems[i]}}}, function(){
          if(--waitingOn == 0){
            req.io.route('fetch_playlists');
          }
        });
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

function updatePlayCount(req){
  var _id = req.data.track_id;
  var plays = req.data.plays;
  // apply the new play_count to the database
  app.db.songs.update({_id: _id}, { $set: { play_count: plays } });
}

function rescanItem(req){
  items = req.data.items;
  app.db.songs.find({ _id: { $in: items }}, function(err, songs){
    if(!err && songs)
      var songLocArr = [];
      for (var i = 0; i < songs.length; i++) {
        songLocArr.push(songs[i].location);
      };
      lib_func.scanItems(app, songLocArr);
  });
}

function scanRoute(req, res){
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    if(typeof list == 'undefined') {
      list = []
      dir_error = true;
    } else {
      dir_error = false;
    }

    res.render('scan', {
      dir: config.music_dir,
      num_items: list.length,
      menu: true,
      dir_error: dir_error
    });
  });
}

function setCompName(req){
  req.io.join('receivers');
  req.socket.set('name', req.data.name);
}

function getReceivers(req){
  var receivers = app.io.sockets.clients('receivers');
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