// This file is a bunch of utility functions
var fs = require('fs');
var path = require('path');

var walk = function(dir, done) {
  var results = [];
  var strip_results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      if (file[0] === '.') {
        if (!--pending) done(null, results, strip_results);
        return;
      }

      file = path.join(dir, file);
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
};

exports.walk = walk;

var contains = function(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i] === obj) {
      return true;
    }
  }

  return false;
};

exports.contains = contains;

// function to get the IP of the current machine on the network
var cached_ip = null;
var getip = function(callback) {
  if (cached_ip === null) {
    require('dns').lookup(require('os').hostname(), function(err, add, fam) {
      callback(add);

      // save it for the next call
      cached_ip = add;
    });
  } else {
    callback(cached_ip);
  }
};

exports.getip = getip;

exports.decodeBase64Image = function(dataString) {
  var matches = dataString.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  var response = {};

  if (matches === null) {
    console.log(dataString);
    console.log('Invalid file uploaded');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
};
