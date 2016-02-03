// this file stores utility functions and misc setup that happens
// before the rest of the JS is loaded

// define swig functions before swig is used at all
function prettyPrintSeconds(seconds) {
  var pretty = '';

  // days
  if (seconds > 86400) {
    pretty += Math.floor(seconds / 86400) + ' day';

    // is it plural
    if (Math.floor(seconds / 86400) != 1.0) {
      pretty += 's';
    }

    pretty += ' ';
  }

  // hours
  if (seconds > 3600) {
    pretty += Math.floor(seconds % 86400 / 3600) + ':';
  }

  // minutes
  if (seconds > 60) {
    pretty += ('0' + Math.floor(seconds % 3600 / 60)).slice(-2) + ':';
  } else {
    pretty += '0:';
  }

  // seconds
  pretty += ('0' + Math.floor(seconds % 60)).slice(-2);
  return pretty;
}

// pretty print the date_added milliseconds
function prettyPrintDateAdded(milliseconds) {
  // convert it to a javascript date object
  var date = new Date(milliseconds);

  // get the format of it
  var dateFormat = date.toString('yyyy-MM-dd HH:mm:ss');
  return dateFormat;
}

function prettyPrintSecondsorNA(seconds) {
  if (seconds <= 0) {
    return 'N/A';
  } else {
    return prettyPrintSeconds(seconds);
  }
}

// make it usable in swig
swig.setFilter('prettyPrintSeconds', prettyPrintSecondsorNA);
swig.setFilter('prettyPrintDateAdded', prettyPrintDateAdded);

var cover_is_current = false;
var cover_is_visible = false;
var box; // coverbox ref
function showCover(src) {
  // deactivate it if it's visible already
  if (cover_is_visible && box) {
    box.deactivate();
  }

  // check if the new cover art is from the current track
  cover_is_current = ('cover/' + player.current_song.attributes.cover_location == src);

  // create and activate the cover art
  box = new CoverBox(src, function() {
    cover_is_visible = false;
  });

  box.activate();
  cover_is_visible = true;
}

// utility functions
function render(template, data) {
  return swig.render($(template).html(), {locals: data});
}

function loadedRestart(item) {
  itemsLoaded.push(item);
  if (arraysEqual(items, itemsLoaded)) {
    Backbone.history.stop();
    Backbone.history.start();

    // if the player is showing nothing, show the default place
    if (MusicApp.router.songview === null) {
      MusicApp.router.playlist();
    }

    // if they last played a song, continue playing
    var play_state = localStorage.getItem('last_play_state'); // must be fetched before the song is played
    var song_id = localStorage.getItem('last_playing_id');
    if (song_id) {
      player.playSong(song_id);

      // set the currentTime
      var currentTime = parseInt(localStorage.getItem('currentTime'));
      if (currentTime) {
        player.PlayMethodAbstracter.setCurrentTime(currentTime);
      }
    }

    // it is stored as a string
    if (play_state == 'false') {
      player.togglePlayState();
    }
  }
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;

  a.sort();
  b.sort();

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

function searchMatchesSong(songString, searchWords) {
  for (var i = 0; i < searchWords.length; i++) {
    if (songString.indexOf(searchWords[i]) == -1) {
      return false;
    }
  }

  return true;
}

function imageToBase64(img) {
  // create the canvas
  var canvas = document.createElement('canvas');
  canvas.height = img.height;
  canvas.width = img.width;

  // grab the context for drawing
  var ctx = canvas.getContext('2d');

  // draw the image to the context
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // return the dataURL
  return canvas.toDataURL('image/png');
}

// implementation of knuth-shuffle by @coolaj86
// https://github.com/coolaj86/knuth-shuffle
function shuffle_array(array) {
  var currentIndex = array.length;
  var temporaryValue;
  var randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function deAttribute(collection) {
  var newCollection = [];
  for (var i = 0; i < collection.length; i++) {
    newCollection.push(collection[i].attributes);
  }

  return newCollection;
}

// make table row widths be correct when dragging
var fixHelper = function(e, ui) {
  ui.children().each(function() {
    $(this).width($(this).width());
  });

  return ui;
};

// define things before they are used
var socket = io.connect('//' + window.location.host, {path: window.location.pathname + 'socket.io'});

