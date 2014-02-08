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
  app.get('/scan', scanRoute);
  app.get('/songs/:id', sendSong);
  app.get('/cover/:id', sendCover);
  app.get('/downloadplaylist/:id', downloadPlaylist);
  app.io.route('scan_page_connected', function(req){ req.io.join('scanners'); });
  app.io.route('player_page_connected', function(req){ req.io.join('players'); });
  app.io.route('start_scan', function(req){ lib_func.scanLibrary(app, false); });
  app.io.route('start_scan_hard', function(req){ lib_func.scanLibrary(app, true); });
  app.io.route('stop_scan', function(req){ lib_func.stopScan(app); });
  app.io.route('fetch_songs', returnSongs);
  app.io.route('fetch_playlists', returnPlaylists);
  app.io.route('create_playlist', createPlaylist);
  app.io.route('add_to_playlist', addToPlaylist);
  app.io.route('remove_from_playlist', removeFromPlaylist);
  app.io.route('hard_rescan', rescanItem);
};

function musicRoute(req, res){
  res.render('index');
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
        zip.addLocalFile(song.location);
        callback();
      });
    }, function(err){
      zip.writeZip(filename);
      res.download(filename, 'download.zip');
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

function addToPlaylist(req){
  add = req.data.add;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    var found = false;
    for(var i = 0; i < doc.songs.length; i++){
      if(doc.songs[i]._id == add){
        found = true;
        break;
      }
    }
    if(!found){
      app.db.playlists.update({_id: to}, { $push:{songs: {_id: add}}}, function(){
        req.io.route('fetch_playlists');
      });
    }
  });
}

function removeFromPlaylist(req){
  remove = req.data.remove;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    var tmpSongs = [];
    for(var i = 0; i < doc.songs.length; i++){
      if(doc.songs[i]._id != remove){
        tmpSongs.push(doc.songs[i]);
      }
    }
    app.db.playlists.update({_id: to}, { $set:{songs: tmpSongs}}, function(){
      req.io.route('fetch_playlists');
    });
  });
}

function rescanItem(req){
  item = req.data.item;
  app.db.songs.findOne({_id: item}, function(err, song){
    if(!err && song)
      lib_func.scanItem(app, song.location);
  });
}

function scanRoute(req, res){
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    res.render('scan', {
      dir: config.music_dir,
      num_items: list.length
    });
  });
}