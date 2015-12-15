// view for showing / editing the detailed info of a selected track

function showInfoView(items) {
  // input checking
  if (items.length === 0) {
    Messenger().post('Error: 0 items selected');
    return;
  }

  // process the edit for the item
  var track = player.song_collection.findBy_Id(items[0]);

  // if they are currently on the computer running the app
  var onserver = (window.location.hostname == 'localhost') ? true : false;

  // has the user dropped a file
  var filedropdata = null;

  // has the cover been fetched from lastfm
  var islastfm = false;

  // generate the content of the modal
  var message = render('#info_template', {track: track, music_dir: music_dir, onserver: onserver});

  // function for saving data
  var save_func = function() {
    var cover_is_url = true;
    if (filedropdata !== null) {
      cover_is_url = false;
    }

    // change the data
    var data = {
      _id: $('#edit_id').val(),
      title: $('#title').val(),
      artist: $('#artist').val(),
      album: $('#album').val(),
      cover: $('.lfm_cover').attr('src') || filedropdata,
      cover_is_lastfm: islastfm,
      cover_is_url: cover_is_url,
    };
    if (data.cover == track.attributes.cover_location) {
      data.cover = null;
    }

    // get the data to change on the server
    socket.emit('update_song_info', data);

    // get the data to change on the client
    track.attributes.title = data.title;
    track.attributes.display_artist = data.artist;
    track.attributes.album = data.album;

    // redraw the song
    MusicApp.router.songview.redrawSong(data._id);

    if (player.playing_id === data._id) {
      MusicApp.infoRegion.currentView.render();
    }
  };

  bootbox.dialog({
    title: track.attributes.title,
    message: message,
    buttons: {
      success: {
        label: 'Save',
        className: 'btn-success',
        callback: save_func,
      },
      main: {
        label: 'Close Without Saving',
        className: 'btn-default',
      },
    },
  });

  // show the img in full when mousove
  var info_cover_popover = function() {
    $('.info_cover, .detailed').popover({
      html: true,
      trigger: 'hover',
      placement: 'bottom',
      content: function() {
        return '<p><img class="popover_cover" src="' + $(this)[0].src + '" /></p>';
      },
    });
  };

  info_cover_popover();

  // they want to find the cover for the song
  $('.find_cover_art').click(function(ev) {
    $('.find_cover_art').replaceWith('<i class="fa fa-2x fa-refresh fa-spin lastfm_spinner"></i>');
    var lastfm = new LastFM({
      apiKey: '4795cbddcdec3a6b3f622235caa4b504',
      apiSecret: 'cbe22daa03f35df599746f590bf015a5',
    });

    // fetch the cover from last fm by the artist and album
    lastfm.album.getInfo({artist: $('#artist').val(), album: $('#album').val()}, {success: function(data) {
      if (data.album.image.length > 0 && data.album.image[data.album.image.length - 1]['#text'] !== '') {
        // set the image as the preview image
        var cover_url = data.album.image[data.album.image.length - 1]['#text'];
        $('.img_block').html('<img class=\'info_cover detailed lfm_cover\' src=\'' + cover_url + '\'/>');
        info_cover_popover();
        islastfm = true;
      } else {
        // cover art could not be found
        bootbox.alert('Artwork not found on LastFM');
        $('.lastfm_spinner').replaceWith('<div class=\'btn btn-default find_cover_art\'>Find Cover Art</div>');
      }
    }, error: function(code, message) {

      bootbox.alert('Error fetching album artwork: ' + message);
      $('.lastfm_spinner').replaceWith('<div class=\'btn btn-default find_cover_art\'>Find Cover Art</div>');
    }, });
  });

  // auto correct info button
  $('.correct_info').click(function(ev) {
    // build the search string
    var title = $('#title').val();
    var album = $('#album').val();
    var artist = $('#artist').val();

    // defailts
    var prefix = '/proxy/search?term=';
    var suffix = '&entity=song&limit=10' + (country_code) ? '&country=' + country_code : '';

    // call the api with all three first
    $.getJSON(prefix + encodeURI([title, album, artist].join(' ')) + suffix, function(data) {
      console.log('searched with title and artist and album and found ' + data.resultCount + ' tracks');

      // were there results?
      if (data.resultCount) {
        foundInfo(data.results);
      } else {
        // call the api with title and artist
        $.getJSON(prefix + encodeURI([title, artist].join(' ')) + suffix, function(data) {
          console.log('searched with title and artist and found ' + data.resultCount + ' tracks');

          // were there results?
          if (data.resultCount) {
            foundInfo(data.results);
          } else {
            // call the api with only title
            $.getJSON(prefix + encodeURI([title].join(' ')) + suffix, function(data) {
              console.log('searched with only title and found ' + data.resultCount + ' tracks');
              if (data.resultCount) {
                foundInfo(data.results);
              } else {
                bootbox.alert('Unable to find song info on itunes. Maybe try tweaking the title/album/artist so it can be found better.');
              }
            });
          }
        });
      }
    });

    // function to run when song info found
    var foundInfo = function(results) {
      console.log('Found results:');
      console.log(results);

      // only use the first result
      var result = results[0];
      $('#title').val(result.trackName);
      $('#album').val(result.collectionName);
      $('#artist').val(result.artistName);

      // set the image as the preview image and upgrade it's size
      var cover_url = result.artworkUrl100.replace('100x100', '600x600');
      $('.img_block').html('<img class=\'info_cover detailed lfm_cover\' src=\'' + cover_url + '\'/>');
      info_cover_popover();
      islastfm = true;
    };
  });

  // tie the enter key on the inputs to the save function
  $('.edit_form :input').keydown(function(ev) {
    // if enter key
    if (ev.keyCode == 13) {
      save_func();

      // manually hide the modal, because it wasn't called from the button press
      $('.bootbox').modal('hide');
    }
  });

  // open the directory in a file manager
  $('.open_dir').click(function(ev) {
    var location = $(this).attr('title');
    socket.emit('open_dir', location);
  });

  // dismiss the modal on backdrop click
  $('.bootbox').click(function(ev) {
    if (ev.target != this) return;
    $('.bootbox').modal('hide');
  });

  dropZone = $('body');
  var drop_visible = false;
  var dragover_handler = function(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!drop_visible) {
      $('body').append('<div class=\'dropping_file\'>Drop File</div>');
      drop_visible = true;
    }
  };

  var dropped_handler = function(e) {
    drop_visible = false;
    dropZone.unbind('dragover', dragover_handler);
    dropZone.unbind('drop', dropped_handler);

    // remove the drop file div
    $('.dropping_file').remove();

    // stop the event propogating (i.e. don't load the image as the page in the browser)
    e.preventDefault();
    e.stopPropagation();
    if (e.originalEvent.dataTransfer) {
      // only if there was more than one file
      if (e.originalEvent.dataTransfer.files.length) {
        // get the first file
        var file = e.originalEvent.dataTransfer.files[0];

        // only if it is an image
        if (file.type.indexOf('image') === 0) {
          // read the file and set the data onto the preview image
          var reader = new FileReader();
          reader.onload = function(e) {
            filedropdata = e.target.result;
            $('.img_block').html('<img class=\'info_cover detailed\' src=\'' + filedropdata + '\'/>');
            info_cover_popover();
          };

          reader.readAsDataURL(file);
        }
      }
    }
  };

  dropZone.on('dragover', dragover_handler);
  dropZone.on('drop', dropped_handler);
}
