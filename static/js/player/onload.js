(function () {
  player.setScubElem($('#scrub_bar'));

  // variable for keeping track of seeking
  var is_seeking = false;
  /*
   * use this flag to mark a keydown has happened before a keyup happens
   * this is to work with a stupid bug in windows that lets the desktop-level
   * workspace change shortcuts leak keys (like right/left arrow) though to the
   * application...
   */
  var prevNextDown = false;
  var seek_interval = 0;
  var HOLD_TIME = 500;
  $('body').keydown(function(event) {
    // don't fire the controls if the user is editing an input
    if (event.target.localName == 'input') {
      return;
    }

    if (event.which == 37 || event.which == 39) {
      prevNextDown = true;
    }

    switch (event.which){
      case 191: // '?' key
      case 83: // 's' key
        // focus search box
        $('.search-input').select();
        return false;
      case 32: // space key
        player.togglePlayState();
        event.preventDefault();
        break;
      case 39: // right key
        // block to only run on first key down
        if (!seek_interval) {
          is_seeking = false;

          // call function every HOLD_TIME, if we don't get called, then it wasn't held down
          seek_interval = setInterval(function() {
            is_seeking = true;
            player.PlayMethodAbstracter.setCurrentTime(player.PlayMethodAbstracter.getCurrentTime() + 5);
          }, HOLD_TIME);
        }

        event.preventDefault();
        break;
      case 37: // left key
        // block to only run on first key down
        if (!seek_interval) {
          is_seeking = false;

          // call function every HOLD_TIME, if we don't get called, then it wasn't held down
          seek_interval = setInterval(function() {
            is_seeking = true;
            player.PlayMethodAbstracter.setCurrentTime(player.PlayMethodAbstracter.getCurrentTime() - 5);
          }, HOLD_TIME);
        }

        event.preventDefault();
        break;
      case 38: // up key
        MusicApp.router.songview.moveSelection('up');
        event.preventDefault();
        break;
      case 40: // down key
        MusicApp.router.songview.moveSelection('down');
        event.preventDefault();
        break;
      case 13: // enter key
        // play the last selected item
        player.playSong(lastSelection);

        // add it to the history and reset the history
        player.play_history.unshift(lastSelection);
        player.play_history_idx = 0;
    }
  });

  $('body').keyup(function(event) {
    // don't fire the controls if the user is editing an input
    if (event.target.localName == 'input') {
      return;
    }

    // left or right repectively
    if (event.which == 37 || event.which == 39) {
      // clear the seeking interval
      clearInterval(seek_interval);
      seek_interval = 0;

      // decide if we should move to the next/prev track
      if (prevNextDown) {
        prevNextDown = false;

        // don't go next if we are seeking
        if (!is_seeking) {
          // based on the keycode, call prev/next on the player
          event.which == 37 ? player.prevTrack() : player.nextTrack();
        }
      }

      // prevent the event from propagating
      event.preventDefault();
    }
  });

  // disable the options on scroll
  $('#content').scroll(hideOptions);

  // add click handler on menu items
  $('#soundcloud_fetch').click(function() {
    bootbox.prompt({
      title: 'Enter the SoundCloud URL',
      callback: function(result) {
        if (result !== null) {
          socket.emit('soundcloud_download', {url: result});
        }
      },
    });
  });

  $('#youtube_fetch').click(function() {
    bootbox.prompt({
      title: 'Enter the Youtube URL (also works for playlist downloads)',
      callback: function(result) {
        if (result !== null) {
          socket.emit('youtube_download', {url: result});
        }
      },
    });
  });

  $('#open_settings').click(function() {
    showSettings();
  });

  // ask them if they would like to view the settings on first load
  if (!music_dir_set) {
    showSettings('Welcome! Please ensure your music directory is correct.');
  }

  // scan library handlers
  $('#soft_scan').click(function() {
    socket.emit('start_scan');
  });

  $('#hard_scan').click(function() {
    socket.emit('start_scan_hard');
  });

  // sync button handlers
  $('#load_sync_view').click(function() {
    MusicApp.router.syncview = new SyncView();
    MusicApp.contentRegion.show(MusicApp.router.syncview);
  });

  $('#export_data').click(function() {
    (new Exporter()).export();
  });

  // setup messenger
  Messenger.options = {
    extraClasses: 'messenger-fixed messenger-on-top',
    theme: 'air',
    messageDefaults: {
      showCloseButton: true,
    },
  };
})();
