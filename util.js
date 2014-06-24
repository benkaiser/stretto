// This file is a bunch of utility functions
var fs = require('fs');

var walk = function(dir, done) {
  var results = [];
  var strip_results = [];
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
            if (!--pending) done(null, results, strip_results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results, strip_results);
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

var contains = function(a, obj){
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}
exports.contains = contains;

// function to get the IP of the current machine on the network
var getip = function(callback){
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    callback(add);
  });
}
exports.getip = getip;
