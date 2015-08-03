var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
/**
 * Override default underscore escape map
 */
var escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  "'": '&apos;',
  '`': '&#x60;'
};
var unescapeMap = _.invert(escapeMap);
var createEscaper = function(map) {
  var escaper = function(match) {
    return map[match];
  };

  var source = '(?:' + _.keys(map).join('|') + ')';
  var testRegexp = RegExp(source);
  var replaceRegexp = RegExp(source, 'g');
  return function(string) {
    string = string == null ? '' : '' + string;
    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
  };
};
_.escape = createEscaper(escapeMap);
_.unescape = createEscaper(unescapeMap);


var urls   = [];
var lyrics = [];

var cleanLyrics = function(lyrics) {
  // replace html codes with punctuation
  lyrics = _.unescape(lyrics);
  // remove everything between brackets
  lyrics = lyrics.replace(/\[[^\]]*\]/g, '');
  // remove html comments
  lyrics = lyrics.replace(/(<!--)[^-]*-->/g, '');
  // remove all tags
  lyrics = lyrics.replace(/<[^>]*>/g, ' ');
  // remove all punctuation
  //lyrics = lyrics.replace(/[\.\,]/g, '');
  // return all lower case
  return lyrics;
};
    
// get the lyrics for an individual song 
var getLyrics = function(url, callback) {
  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('script').remove()
      var cleanlyrics = cleanLyrics($('.lyricbox').html());
      callback(cleanlyrics);
    }
    else{
      console.log('Error at:' + url);
    }
  });
};


exports.findLyrics2 = function(artist){
//print all lyrics for an artist
  var url = 'http://lyrics.wikia.com/api.php?artist=' + artist;
  // get a list of songs
  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      var songs = $('.songs').find('li');
      for (var i = 0; i < songs.length; i++) {
        urls.push($(songs[i]).find('a').attr('href'));
      }
      urls.forEach(function(url) {
        getLyrics(url, function(songLyrics) {
          console.log(songLyrics);
        });
      });
    }
  });

};

exports.findLyrics = function(artist, song){

  var url = 'http://lyrics.wikia.com/api.php?artist=' + artist;
  // get a list of songs
  songName = song.toLowerCase().split(' ');

  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      var songs = $('.songs').find('li');
      for (var i = 0; i < songs.length; i++) {
        
        song_name = ((($(songs[i]).find('a').attr('href')).split(':')[2]).toLowerCase().split('_'));
        //add a better check for song name similarity
        if(songName[0] == song_name[0]){
          urls.push($(songs[i]).find('a').attr('href'));
        }
      }
        getLyrics(urls.pop(), function(songLyrics) {
          console.log(songLyrics);
          return 'found';
        });
    }
    else{
      console.log('error in song: ' + url);
    }
  });
return 'not found';
};