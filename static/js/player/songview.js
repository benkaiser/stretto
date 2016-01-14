SongView = Backbone.View.extend({
  template: '#song_template',
  render: function() {
    var self = this;

    // cache scrolltop (incase this is the second render, see bottom of function)
    var tmp_scrolltop = this.scrollTop;

    // calculate the duration
    var totalDuration = 0;
    for (var song = 0; song < player.songs.length; song++) {
      totalDuration += parseInt(player.songs[song].attributes.duration) || 0;
    }

    // render the view
    this.$el.html(render(this.template, {
      title: player.playlist.title,
      editable: player.playlist.editable,
      is_youtube: player.playlist.is_youtube,
      _id: player.playlist._id,
      sort_col: player.sort_col,
      sort_asc: player.sort_asc,
      songs: player.songs,
      numSongs: player.songs.length,
      totalDuration: prettyPrintSecondsorNA(totalDuration),
    }));
    this.$el.addClass('custom_scrollbar');

    // add scroll event handler
    this.scrollElem = player.onMobile ? $('#wrapper') : this.$el;
    this.scrollElem.scroll(function() {
      MusicApp.router.songview.renderSong();
    });

    // logic to manually order the songs in a playlist
    if (player.playlist.editable && // playlist is editable
        // it is sorted in a way that makes sense for sorting
        (player.sort_col === null && player.sort_asc === null)) {
      this.$el.find('.song_table tbody').sortable({
        delay: 100,
        items: 'tr',
        helper: fixHelper,
        update: function(event, ui) {
          // get where the item has moved from - to
          var item = player.song_collection.findBy_Id(ui.item.attr('id'));
          var oldIndex = item.attributes.index - 1;
          var newIndex = self.lastmin + ui.item.index() - 1;

          // remove the item from it's old place
          item = player.playlist.songs.splice(oldIndex, 1)[0];

          // add the item into it's new place
          player.playlist.songs.splice(newIndex, 0, item);

          // refresh the songs array from the playlist
          player.songs = player.song_collection.getByIds(player.playlist);

          // send the data back to the server
          socket.emit('song_moved_in_playlist', {
            playlist_id: player.playlist._id,
            oldIndex: oldIndex,
            newIndex: newIndex,
          });
        },
      });
    }

    // set the defaults and start rendering songs
    // init the processing variable
    this.processing = false;

    // content height
    this.contentHeight = $('#content').height();

    // get the spacers
    this.top_spacer = this.$el.find('#top-spacer');
    this.bottom_spacer = this.$el.find('#bottom-spacer');

    // height of one item
    this.individual_height = 42;

    // how many to show at a time
    this.how_many_drawn = Math.ceil(window.innerHeight / this.individual_height) * 2;
    if (this.how_many_drawn > player.songs.length) {
      this.how_many_drawn = player.songs.length;
    }

    // initialise the lastmin and lastmax
    this.lastmin = 0;
    if (player.songs.length > 0) {
      this.lastmin = 1;
    }

    this.lastmax = 0;

    // if the viewport has been drawn at least once
    self.drawn_full = false;

    // height of number drawn
    this.height_of_drawn = this.how_many_drawn * this.individual_height;

    // how high is the table in total
    this.total_table_height = player.songs.length * this.individual_height;

    // precompile the song rendering tempalte
    this.song_template = swig.compile($('#song_item').html());

    // default meta height until the defered function below evaluates
    this.meta_height = 40;
    _.defer(function() {
      // get hight of elems above table body incl header row
      self.meta_height = $('.playlist_meta').height() + 40;
      if (player.onMobile) {
        // mobile view has the playlists section in the scrollable view, add it to the meta_height
        self.meta_height += $('#sidebar').height();
      }

      // draw the songs
      self.renderSong();
    });

    // if they have already rendered this, scroll to last postition
    if (this.scrollTop) {
      _.defer(function() {
        self.scrollElem.animate({scrollTop: tmp_scrolltop + 'px'},
         0);
      });
    }
  },

  events: {
    'click .colsearch': 'triggerSearch',
    'click thead > tr': 'triggerSort',
    'click tbody > tr': 'triggerSong',
    'click .options': 'triggerOptions',
    'contextmenu td': 'triggerOptions',
    'click .cover': 'triggerCover',
    'click .rename_playlist': 'renamePlaylist',
    'click .delete_playlist': 'deletePlaylist',
  },

  triggerSearch: function(ev) {
    var search = $(ev.target).text();
    player.updateSearch(search);
  },

  triggerSort: function(ev) {
    var column_name = $(ev.target).closest('th').attr('class').replace('_th', '');
    console.log(column_name);
    player.sortSongs(column_name);
    this.render();
  },

  triggerSong: function(ev) {
    if ($(ev.target).hasClass('options') || $(ev.target).hasClass('colsearch')) {
      return;
    }

    id = $(ev.target).closest('tr').attr('id');
    hideOptions();
    if (ev.ctrlKey) {
      // ctrlKey pressed, add to selection
      addToSelection(id, true);
    } else if (ev.shiftKey) {
      // shiftkey pressed, add to selection
      selectBetween(id, lastSelection);
    } else {
      // just play the song
      clearSelection();
      player.queue_pool = player.songs.slice(0);
      player.playSong(id, false);
      player.genShufflePool();

      // add the song to the history and reset it to the top
      player.play_history.unshift(id);
      player.play_history_idx = 0;
    }
  },

  triggerOptions: function(ev) {
    if (!optionsVisible) {
      id = $(ev.target).closest('tr').attr('id');
      if ($.inArray(id, selectedItems) == -1) {
        // right click on non-selected item should select only that item
        clearSelection();
      }

      addToSelection(id, false);
      createOptions(ev.clientX, ev.clientY);
    } else {
      hideOptions();
    }

    return false;
  },

  triggerCover: function(ev) {
    showCover($(ev.target).attr('src'));
    return false;
  },

  // move the selection up and down
  moveSelection: function(direction) {
    var index_in_queue = player.findSongIndex(lastSelection);
    var new_index = index_in_queue || 0;
    if (direction == 'up' && index_in_queue - 1 >= 0) {
      new_index--;
    } else if (direction == 'down'  && index_in_queue + 1 < player.queue_pool.length) {
      new_index++;
    }

    var newly_selected = player.queue_pool[new_index];

    // get the offset
    var new_item = $('#' + newly_selected.attributes._id);
    var offset = new_item.offset();

    // it is actually in the view
    if (offset !== undefined) {
      // do we need to scroll to show the full item?
      var doc_height = $(document).height();

      // how far past the top minus navbar
      var top_diff = offset.top - 51;

      // how far past the bottom plus control bar and height of element
      var bottom_diff = offset.top - doc_height + 63 + this.individual_height;
      if (top_diff <= 0) {
        // move one item up
        this.$el.scrollTop(this.$el.scrollTop() - this.individual_height);
      } else if (bottom_diff > 0) {
        // move one item down
        this.$el.scrollTop(this.$el.scrollTop() + this.individual_height);
      }
    }

    // remove the old selection
    if (index_in_queue !== null) {
      delFromSelection(player.queue_pool[index_in_queue].attributes._id);
    }

    // select the new item
    addToSelection(newly_selected.attributes._id, false);
  },

  renamePlaylist: function(ev) {
    bootbox.prompt({
      title: 'What would you like to rename "' + player.playlist.title +
        '" to?',
      value: player.playlist.title,
      callback: function(result) {
        if (result !== null) {
          socket.emit('rename_playlist', {
            title: result,
            id: player.playlist._id,
          });
          $('#playlist_header').text(result);
        }
      },
    });
  },

  deletePlaylist: function(ev) {
    bootbox.dialog({
      message: 'Do you really want to delete this playlist?',
      title: 'Delete Playlist',
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },

        del: {
          label: 'Delete',
          className: 'btn-danger',
          callback: function() {
            socket.emit('delete_playlist', {del: player.playlist._id});
            MusicApp.router.playlist('LIBRARY');
          },
        },
      },
    });
  },

  renderSong: function() {
    // simple block to make sure it is only processing a render once at any point in time
    if (!this.processing) {
      this.processing = true;

      // cache scroll top variable
      this.scrollTop = this.scrollElem.scrollTop();

      // get the index of the item in the center of the screen
      // if contentHeight is 0, contentHeight / 2 is NaN, so default to 0
      var middle_of_viewport = this.scrollTop + (this.contentHeight / 2 || 0) - this.meta_height;
      this.middle_item = Math.floor(middle_of_viewport / this.individual_height);

      // get the bounds of items to draw
      var min = Math.floor(this.middle_item - this.how_many_drawn / 2);
      var max = Math.floor(this.middle_item + this.how_many_drawn / 2);

      // if the min is less than 0, set it to 0
      if (min < 0) {
        min = 0;
        max = Math.min(this.how_many_drawn, player.songs.length - 1);
      } else if (max > player.songs.length - 1) {
        // set the max item to the last item
        max = player.songs.length - 1;

        // only let it go as low as 0
        min = Math.max(max - this.how_many_drawn, 0);
      }

      if (min != this.lastmin || max != this.lastmax) {
        // shortcut to remove all items easily
        if (min > this.lastmax || max < this.lastmin) {
          this.$el.find('.song_row').remove();
          this.drawn_full = false;
        }

        // add the elements from the side they can be added from
        var index = 0;
        var diff;
        var render_item;
        if (max > this.lastmax) {
          // add them to the bottom
          diff = Math.min(max - this.lastmax, this.how_many_drawn) - 1;
          while (diff >= 0) {
            index = max - diff;
            render_item = this.song_template({
              song: player.songs[index],
              selected: (player.songs[index] ? selectedItems.indexOf(player.songs[index].attributes._id) != -1 : false),
              index: index,
            });

            // if we are redrawing, remove from the other side
            if (this.drawn_full) {
              this.top_spacer.next().remove();
            }

            this.bottom_spacer.before(render_item);
            diff--;
          }
        }

        if (min < this.lastmin) {
          // add them to the top
          diff = Math.min(this.lastmin - min, this.how_many_drawn) - 1;
          while (diff >= 0) {
            index = min + diff;
            render_item = this.song_template({
              song: player.songs[index],
              selected: (selectedItems.indexOf(player.songs[index].attributes._id) != -1),
              index: index,
            });

            // if we are redrawing, remove from the other side
            if (this.drawn_full) {
              this.bottom_spacer.prev().remove();
            }

            this.top_spacer.after(render_item);
            diff--;
          }
        }

        this.lastmax = max;
        this.lastmin = min;
      }

      // calculate the spacer heights based off what is missing
      var top = this.individual_height * this.lastmin;
      var bottom = this.individual_height *  (player.songs.length - this.lastmax);

      // set the spacing heights
      this.top_spacer.css('height', top);
      this.bottom_spacer.css('height', bottom);

      // set some finish variables
      this.processing = false;
      this.drawn_full = true;
    }
  },

  redrawSong: function(_id) {
    // check if the song is already visible
    var song_tr = this.$el.find('#' + _id);
    if (song_tr.length !== 0) {
      // now replace the item
      this.$el.find('#' + _id).replaceWith(this.song_template({ song: player.song_collection.findBy_Id(_id)}));
    }
  },
});
