var fs = require('fs');
var mm = require('musicmetadata');

var util = require(__dirname + '/util.js');
var config = require(__dirname + '/config').config();

var local_app = null;
var cnt = 0;
var song_list = [];

function findNextSong(){
  if(cnt < song_list.length){
    findSong(song_list[cnt], function(err){
      cnt++;
      local_app.io.room('scanners').broadcast('update', {err: err, count: song_list.length, completed: cnt});
      findNextSong();
    });
  } else {
    console.log("finished!");
  }
}

function findSong(item, callback){
  console.log("looking for item...");
  local_app.db.songs.findOne({location: item}, function(err, doc){
    if(doc == null){
      // insert the new song
      var parser = new mm(fs.createReadStream(item));

      parser.on('metadata', function(result){
        // console.log(result);
      });

      parser.on('done', function (err) {
        if (err) {
          callback(err);
        }
        callback(null);
      });
    } else {
      // perform rescan? hard rescan option?
    }
  })
}

exports.scanLibrary = function(app){
  local_app = app;
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    song_list = list;
    findNextSong();

  });
}