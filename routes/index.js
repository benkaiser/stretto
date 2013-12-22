var util = require(__dirname + '/../util.js');
var lib_func = require(__dirname + '/../library_functions.js');
var config = require(__dirname + '/../config').config();
/*
 * GET home page.
 */

exports.createRoutes = function(app){
  app.get('/', musicRoute);
  app.get('/scan', scanRoute);
  app.io.route('scan_page_connected', function(req){
    req.io.join('scanners');
  })
  app.io.route('start_scan', function(req){
    lib_func.scanLibrary(app);
  });

};

function musicRoute(req, res){
  res.render('index');
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