SyncView = Backbone.View.extend({
  template: '#sync_body_template',
  events: {
    'click #fetch_data': 'connectB',
    'click .sync_div': 'sync',
    'click .back_to_songs': 'goBack',
  },
  initialize: function() {
    this.a = {
      socket: socket,
      server_ip: this_ip,
      song_collection: player.song_collection,
      playlist_collection: player.playlist_collection,
      loaded: true,
    };
    this.b = {
      socket: null,
      server_ip: '',
      song_collection: new SongCollection(),
      playlist_collection: new PlaylistCollection(),
      loaded: false,
    };
  },

  render: function() {
    this.b.server_ip = localStorage.getItem('server_b_ip') || '';

    this.setElement(render(this.template, {this_ip: this_ip, remote_ip: this.b.server_ip}));

    if (this.b.server_ip.length > 0) {
      this.connectB();
    }
  },

  connectB: function() {
    var self = this;

    // save the setting
    this.b.server_ip = this.$el.find('#remote_b').val();
    localStorage.setItem('server_b_ip', this.b.server_ip);

    // connect
    this.b.socket = io.connect(this.b.server_ip, {'force new connection': true});
    this.b.socket.on('connect', function() {
      self.b.socket.emit('sync_page_connected');
      console.log('Socket_b connected');
    });

    this.b.socket.on('alldata', function(data) {
      // reset the playlists
      self.b.playlist_collection.reset();
      self.b.playlist_collection.add(data.playlists);

      // reset the songs
      self.b.song_collection.reset();
      self.b.song_collection.add(data.songs);
      self.b.loaded = true;
      self.drawSync();
    });
  },

  drawSync: function() {
    if (this.b.loaded) {
      // render the left and right panes
      this.left = new SyncListView({
        el: this.$el.find('.playlists_left')[0],
        model: {
          playlists: this.a.playlist_collection,
          title: 'This Server',
          side: 'left',
        },
      });
      this.left.render();
      this.right = new SyncListView({
        el: this.$el.find('.playlists_right')[0],
        model: {
          playlists: this.b.playlist_collection,
          title: 'Remote Server',
          side: 'right',
        },
      });
      this.right.render();

      // show the sync button
      this.$el.find('.sync_div').css('visibility', 'visible');
    }
  },

  sync: function() {
    var left_items = this.left.getSelected();
    var right_items = this.right.getSelected();

    var data_to_send = null;
    if (left_items.length > 0) {
      // filter the lists and work out the new songs
      data_to_send = this.filter_out(left_items, this.a, this.b);
      data_to_send.remote_url = this.a.server_ip;

      // sync the playlists
      console.log(data_to_send);
      this.b.socket.emit('sync_playlists', data_to_send);
    }

    if (right_items.length > 0) {
      // filter the lists and work out the new songs
      data_to_send = this.filter_out(right_items, this.b, this.a);
      data_to_send.remote_url = this.b.server_ip;

      // sync the playlists
      console.log(data_to_send);
      this.a.socket.emit('sync_playlists', data_to_send);
    }
  },
  /* this function replaces the uids of songs that share the same title + artist
   * + album on the playlists that are being synced across. This allows for syncing
   * to be skipped for items that seem to be the same track.
   */
  filter_out: function(selected_lists, from, to) {
    var new_songs = [];
    for (var list_cnt = 0; list_cnt < selected_lists.length; list_cnt++) {
      for (var item_cnt = 0; item_cnt < selected_lists[list_cnt].songs.length; item_cnt++) {
        // if the song is already in the library, set the correct _id
        var uid = selected_lists[list_cnt].songs[item_cnt]._id;
        var from_song = from.song_collection.findBy_Id(uid);
        if (from_song) {
          var match_song = to.song_collection.findItem(from_song);
          if (match_song) {
            selected_lists[list_cnt].songs[item_cnt]._id = match_song.attributes._id;
          } else {
            new_songs.push(from_song.attributes);
          }
        }
      }

      // check if the playlist is a dupe, if so merge it
      var match_playlist = to.playlist_collection.getByTitle(selected_lists[list_cnt].title);
      if (match_playlist) {
        selected_lists[list_cnt] = this.mergePlaylists(selected_lists[list_cnt], match_playlist.attributes);
      }
    }

    return {songs: new_songs, playlists: selected_lists};
  },

  mergePlaylists: function(list_one, list_two) {
    list_one._id = list_two._id;
    for (var song_cnt = 0; song_cnt < list_two.songs.length; song_cnt++) {
      // see if we can find the song in the first playlist
      var found = false;
      for (var inner_cnt = 0; inner_cnt < list_one.songs.length; inner_cnt++) {
        if (list_one.songs[inner_cnt]._id == list_two.songs[song_cnt]._id) {
          found = true;
        }
      }

      // if it isn't found, add it
      if (!found) {
        list_one.songs.push(list_two.songs[song_cnt]);
      }
    }

    return list_one;
  },

  goBack: function() {
    MusicApp.contentRegion.show(MusicApp.router.songview);
    MusicApp.router.songview.delegateEvents();
  },
});

// viewing the playlists from each server
SyncListView = Backbone.View.extend({
  template: '#sync_template',
  render: function() {
    this.$el.html(render(this.template, {
      playlists: this.model.playlists.models,
      side: this.model.side,
      title: this.model.title,
    }));
  },

  getSelected: function() {
    var selected = [];
    var self = this;
    this.$el.find(':input').each(function(index) {
      if ($(this).is(':checked')) {
        // add the playlist by _id
        selected.push(self.model.playlists.getBy_Id($(this).attr('id').replace(self.model.side + '_', '')).attributes);
      }
    });

    return selected;
  },
});
