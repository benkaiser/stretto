// This file is a bunch of utility functions
var fs = require('fs');

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
exports.walk = walk;

var mkdir = function(dir, done) {
  fs.exists(dir, function(exists){
    if(!exists){
      fs.mkdir(dir, '0777', function(){
        done();
      });
    } else {
      done();
    }
  });
}
exports.mkdir = mkdir;