// these functions handle selection of songs and drawing the (right click) context menu

var optionsVisible = false;
var selectedItems = [];
var recentPlaylists = [];
var lastSelection = '';
function createOptions(x, y) {
  // calculate if the menu should 'drop up'
  var dropup = '';
  if (y + 300 > $(window).height()) {
    dropup = 'dropup';
  }

  var foundYoutube = false;
  var foundNormal = false;
  selectedItems.forEach(function(item) {
    var model = player.song_collection.findBy_Id(item);
    if (model.isYoutube()) {
      foundYoutube = true;
    } else {
      foundNormal = true;
    }
  });

  var type = foundYoutube ? (foundNormal ? 'mix' : 'youtube') : 'normal';

  $('.options_container').html(render('#options_template', {
      playlists: player.playlist_collection.models,
      current_playlist: player.playlist,
      recents: recentPlaylists,
      dropup: dropup,
      type: type,
      numSelected: selectedItems.length,
    }))
    .css({top: y + 'px', left: x + 'px'});
  $('.add_to_queue').click(function(ev) {
    for (var x = 0; x < selectedItems.length; x++) {
      player.play_history.unshift(selectedItems[x]);
      player.play_history_idx++;
    }

    hideOptions();
  });

  $('.add_to_playlist').click(function(ev) {
    id = $(ev.target).closest('li').attr('id');
    socket.emit('add_to_playlist', {add: selectedItems, playlist: id});
    hideOptions();

    // add to recents
    var this_playlist = player.playlist_collection.getBy_Id(id);

    // take it out if it's in the recents
    for (var x = 0; x < recentPlaylists.length; x++) {
      if (recentPlaylists[x].attributes._id == this_playlist.attributes._id) {
        // remove it from recents
        recentPlaylists.splice(x, 1);
      }
    }

    // add to the start of recents
    recentPlaylists.unshift(this_playlist);

    // remove if too many
    if (recentPlaylists.length > 3) {
      recentPlaylists.pop();
    }
  });

  $('.remove_from_playlist').click(function(ev) {
    id = $(ev.target).closest('li').attr('id');

    // get a handle on the playlist
    for (var i = 0; i < selectedItems.length; i++) {
      $('#' + selectedItems[i]).remove();

      // remove the song from the queue_pool
      for (var j = 0; j < player.songs.length; j++) {
        if (player.songs[j].attributes._id == selectedItems[i]) {
          // remove the element
          player.songs.splice(j, 1);
        }
      }
    }

    // fix bug with infinite scroll having elements removed
    if (MusicApp.router.songview.how_many_drawn > player.songs.length) {
      MusicApp.router.songview.how_many_drawn = player.songs.length;
    }

    // update the server
    socket.emit('remove_from_playlist', {remove: selectedItems, playlist: id});
    hideOptions();
  });

  $('.hard_rescan').click(function(ev) {
    socket.emit('hard_rescan', {items: selectedItems});
    hideOptions();
  });

  $('.rewrite_tags').click(function(ev) {
    socket.emit('rewrite_tags', {items: selectedItems});
    hideOptions();
  });

  $('.view_info').click(function(ev) {
    showInfoView(selectedItems);
    hideOptions();
  });

  $('.similar_songs').click(function(ev) {
    // use the first selected option
    var song = player.song_collection.findBy_Id(lastSelection);

    // send it to the server to start the search
    socket.emit('similar_songs', {title: song.attributes.title, artist: song.attributes.display_artist, _id: song.attributes._id});

    // notify the user that we are looking for a mix
    Messenger().post('Searching for similar songs...');

    // hide the context menu
    hideOptions();
  });

  $('.save_youtube').click(function(ev) {
    var results = selectedItems.map(function(id) {
      return player.song_collection.findBy_Id(id).attributes;
    });

    socket.emit('youtube_import', {songs: results});

    // hide the context menu
    hideOptions();
  });

  optionsVisible = true;
}

function hideOptions() {
  $('.options_container').css({'top:': '-1000px', left: '-1000px'});
  optionsVisible = false;
}

function addToSelection(id, clearIfIn) {
  lastSelection = id;
  for (var i = 0; i < selectedItems.length; i++) {
    if (selectedItems[i] == id) {
      if (clearIfIn) {
        selectedItems.splice(i, 1);
        $('#' + id).removeClass('selected');
      }

      return;
    }
  }

  selectedItems.push(id);
  $('#' + id).addClass('selected');
}

function delFromSelection(id) {
  for (var i = 0; i < selectedItems.length; i++) {
    if (selectedItems[i] == id) {
      selectedItems.splice(i, 1);
      $('#' + id).removeClass('selected');
    }
  }
}

function selectBetween(id, id2) {
  loc1 = indexInSongView(id);
  loc2 = indexInSongView(id2);

  // make sure loc1 is less than loc2
  if (loc1 > loc2) {
    temp = loc1;
    loc1 = loc2;
    loc2 = temp;
  }

  for (var i = loc1; i <= loc2; i++) {
    addToSelection(player.songs[i].attributes._id, false);
  }
}

function indexInSongView(id) {
  for (var i = 0; i < player.songs.length; i++) {
    if (player.songs[i].attributes._id == id) {
      return i;
    }
  }

  return -1;
}

function clearSelection() {
  selectedItems = [];
  $('tr').removeClass('selected');
}
