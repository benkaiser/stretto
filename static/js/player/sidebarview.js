SidebarView = Backbone.View.extend({
  template: '#sidebar_template',
  render: function() {
    var editable = player.playlist_collection.where({editable: true});
    var fixed = player.playlist_collection.where({editable: false});
    this.setElement(render(this.template, {title: 'Playlists', search: player.searchText, editable: editable, fixed: fixed}));
  },

  events: {
    'click .add_playlist': 'addPlaylist',
    'click .search-youtube': 'searchYoutube',
    'keyup .search-input': 'searchItems',
  },
  addPlaylist: function() {
    bootbox.prompt('Playlist title?', function(result) {
      if (result !== null && result !== '') {
        socket.emit('create_playlist', {title: result, songs: []});
      }
    });
  },

  searchItems: function() {
    searchText = $('.search-input').val();
    player.updateSearch(searchText);
    return true;
  },

  searchYoutube: function() {
    var searchText = $('.search-input').val();
    socket.emit('youtube_search', { search: searchText });
    Messenger().post('Searching youtube for songs...');
  },
});

SettingsBarView = Backbone.View.extend({
  template: '#settings_bar_template',
  render: function() {
    this.$el.html(render(this.template, {vol: player.getVolume()}));
    _.defer(function() {
      var volElem = $('#vol_bar');
      if (volElem.length > 0) {
        player.setVolElem(volElem);
      }
    });
  },

  events: {
    'click #remote_setup': 'openOptions',
  },
  openOptions: function() {
    bootbox.dialog({
      message: render('#control_template', { comp_name: player.comp_name, host: window.location.host }),
      title: 'Setup Remote Control',
      buttons: {
        danger: {
          label: 'Cancel',
          className: 'btn-danger',
        },
        success: {
          label: 'Save',
          className: 'btn-success',
          callback: function() {
            comp_name = $('#comp_name_input').val();
            player.setCompName(comp_name);
          },
        },
      },
    });
  },
});
