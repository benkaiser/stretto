var util = require(__dirname + '/../util.js');
var lib_func = require(__dirname + '/../library_functions.js');
var config = require(__dirname + '/../config').config();
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
  app.io.route('scan_page_connected', function(req){ req.io.join('scanners'); });
  app.io.route('start_scan', function(req){ lib_func.scanLibrary(app); });
  app.io.route('stop_scan', function(req){ lib_func.stopScan(app); });
  app.io.route('fetch_songs', returnSongs);

};

function musicRoute(req, res){
  res.render('index');
}

function sendSong(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(err || !song){
      res.status(404).send();
    } else {
      res.sendfile(song.location, {'root': '/'});
    }
  });
}

function sendCover(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(!song.hasOwnProperty("cover_location")){
      res.sendfile("/static/images/unknown.png", {root: __dirname + "/../"});
    } else {
      res.sendfile(song.cover_location, {'root': '/'});
    }
  });
}

function returnSongs(req){
  app.db.songs.find({}, function(err, docs){
    if(!err){
      req.io.emit('songs', {"songs": docs});
    }
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