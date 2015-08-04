var request = require('request');

exports.findLyrics = function(artist, song, callback){

  var url = 'https://lyric-api.herokuapp.com/api/find/'+artist+'/'+song;
  // get a list of songs

  request(url, function(error, response, body) {
    callback(body);
  });
};