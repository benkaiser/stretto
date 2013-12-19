var util = require(__dirname + '/../util.js');
var config = require(__dirname + '/../config').config;
/*
 * GET home page.
 */

exports.createRoutes = function(app){
  app.get('/', musicRoute);
  app.get('/scan', scanRoute);
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