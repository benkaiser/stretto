// define things before they are used
var socket = io.connect('http://'+window.location.host);

var PlaylistCollection = Backbone.Collection.extend({
  comparator: function(playlist){
    return [playlist.get("editable"), playlist.get('title')];
  },
  fetch: function(options){
    socket.emit('fetch_playlists');
  },
  getBy_Id: function(id){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes["_id"] == id){
        return this.models[i].attributes;
      }
    }
    return -1;
  }
});

var SongCollection = Backbone.Collection.extend({
  fetch: function(options){
    socket.emit('fetch_songs');
  },
  findBy_Id: function(id){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes["_id"] == id){
        return this.models[i];
      }
    }
    return 0;
  },
  getByIds: function(playlist){
    if(playlist !== undefined && playlist.songs !== undefined){
      songs = [];
      for(var i = 0; i < playlist.songs.length; i++){
        var song = this.findBy_Id(playlist.songs[i]["_id"]);
        if(song){
          // set the index in the playlist
          song.attributes.index = i+1;
          songs.push(song);
        }
      }
      return songs;
    }
    return;
  }
});

// music library object
function PlayState(){
  this.scrubberTimeout = null;
  this.names = {
    playpause: "#playpause",
    next: "#next",
    prev: "#prev",
    repeat: "#repeat",
    repeat_badge: "#repeat_badge",
    shuffle: "#shuffle"
  };
  this.repeat_states = {
    all: 0,
    one: 1,
    none: 2
  };
  // search info
  this.searchText = ""
  // currently viewed songs
  this.songs = [];
  // current song list sort state
  this.sort_asc = null;
  this.sort_col = null;
  // current pool of songs to play, in order from whatever list they were picked
  this.queue_pool = [];
  // same as above but shuffled, used to make sure a correct shuffle is done
  this.shuffle_pool = [];
  this.shuffle_idx = 0;
  // other state
  this.song_collection = null;
  this.playlist_collection = null;
  this.playing_id = null;
  this.is_playing = false;
  this.shuffle_state = false;
  this.repeat_state = 0;
  this.current_track = document.getElementById("current_track");
  this.fade_track = document.getElementById("fade_track");
  this.scrub = null;
  // keep track of play next and history
  this.play_history = [];
  this.play_history_idx = 0;
  // remote control data
  this.comp_name = null;
  this.init = function(){
    setInterval(function(){ player.update() }, 50);
    $(this.names.playpause).click(function(){ player.togglePlayState() });
    $(this.names.next).click(function(){ player.nextTrack() });
    $(this.names.prev).click(function(){ player.prevTrack() });
    $(this.names.repeat).click(function(){ player.toggleRepeat() });
    $(this.names.shuffle).click(function(){ player.toggleShuffle() });
    this.current_src = $("#current_src");
    this.fade_src = $("#fade_src");
    this.current_track.addEventListener('ended', function(){ player.trackEnded() });
    this.current_track.addEventListener('durationchange', function(){ player.durationChanged() });
    this.shuffle_state = localStorage.getItem('shuffle') || false;
    this.redrawShuffle();
    this.repeat_state = localStorage.getItem('repeat') || this.repeat_states.all;
    this.redrawRepeat();
    this.comp_name = localStorage.getItem('comp_name') || '';
    socket.emit('set_comp_name', {name: this.comp_name});
  }
  this.setupCollections = function(){
    this.song_collection = new SongCollection();
    this.playlist_collection = new PlaylistCollection();
    this.song_collection.fetch();
    this.playlist_collection.fetch();
  }
  this.update = function(){
    if(this.is_playing && !this.isSeeking){
      this.scrub.slider('setValue', this.current_track.currentTime / this.current_track.duration * 100.0);
      var seconds = prettyPrintSeconds(this.current_track.currentTime);
      $(".current_time").html(seconds);
    }
  }
  this.findSongIndex = function(id){
    for (var i = 0; i < this.queue_pool.length; i++) {
      if(id == this.queue_pool[i].attributes._id){
        return i;
      }
    }
    // fallback to all songs
    return null;
  }
  this.updateSearch = function(searchText){
    MusicApp.router.navigate("search/"+encodeURIComponent(searchText), true);
  }
  this.searchItems = function(searchText){
    this.searchText = searchText;
    if(searchText.length < 3){
      return;
    }
    // set the search box to the search text
    $(".search-input").val(searchText);
    // normalise the search text to lower case
    searchText = searchText.toLowerCase();
    var tmpSongs = [];
    // counter for index in the song list
    var matched = 0;
    for (var i = 0; i < this.song_collection.length; i++) {
      var item = this.song_collection.models[i];
      if(this.songMatches(item, searchText)){
        // set the index
        item.attributes.index = matched++;
        // add it to the list of matched songs
        tmpSongs.push(item);
      }
    }
    this.songs = tmpSongs;
    // reset the sorting attributes
    player.sort_asc = player.sort_col = null;
    // create a mock playlist for the search results
    this.playlist = {
      title: "Search Results for: '"+this.searchText+"'",
      editable: false,
      songs: deAttribute(this.songs)
    };
    if(MusicApp.router.songview){
      MusicApp.router.songview.render();
    } else {
      MusicApp.router.songview = new SongView();
      MusicApp.contentRegion.show(MusicApp.router.songview);
    }
  }
  // note: this is a very expensive method of searching
  // it is used to match each term in the search against the title, album and artist
  this.songMatches = function(item, searchText){
    item = item.attributes;
    if(!item.searchString){
      item.searchString = "";
      item.searchString += (item.title) ? item.title.toLowerCase() : "";
      item.searchString += (item.album) ? item.album.toLowerCase() : "";
      item.searchString += (item.display_artist) ? item.display_artist.toLowerCase() : "";
    }
    var searchTextParts = searchText.split(/[ ]+/);
    if(searchMatchesSong(item.searchString, searchTextParts)){
      return true;
    }
    return false;
  }
  // sort the list of songs currently viewed by a certain column
  this.sortSongs = function(col){
    if(this.sort_col == null || this.sort_asc == null || this.sort_col != col) {
      // start the sorting
      this.sort_col = col;
      this.sort_asc = true;
    } else if(this.sort_col == col){
      // already sorted on this column, flip the direction
      this.sort_asc = !this.sort_asc;
    }
    // perform the sort
    player.songs.sort(this.songSortFunc);
  }
  // function to perform the sort based on current sorting attributes
  this.songSortFunc = function(a, b){
    if(a.attributes[player.sort_col] < b.attributes[player.sort_col])
       return (player.sort_asc) ? -1 : 1;
    if(a.attributes[player.sort_col] > b.attributes[player.sort_col])
      return (player.sort_asc) ? 1 : -1;
    return 0;
  }
  this.durationChanged = function(){
    var seconds = prettyPrintSeconds(this.current_track.duration);
    $(".duration").html(seconds);
  }
  this.trackEnded = function(){
    // increment the playcount
    this.current_song.attributes.play_count++;
    socket.emit('update_play_count', {
      track_id: this.current_song.attributes._id,
      plays: this.current_song.attributes.play_count
    });
    // redraw that songs row (i.e. update it's play count)
    MusicApp.router.songview.redrawSong(this.current_song.attributes._id);
    // go to the next track
    this.nextTrack();
  }
  this.playSong = function(id, force_restart){
    // remove the last playing song from the selection
    delFromSelection(this.playing_id);
    addToSelection(id, false);
    // set the current song
    var index_in_queue = this.findSongIndex(id);
    if(index_in_queue == null){
      this.current_index = 0;
      this.current_song = this.song_collection.findBy_Id(id);
    } else {
      this.current_index = index_in_queue;
      this.current_song = this.queue_pool[this.current_index];
    }
    if(id == this.playing_id && !force_restart){
      return;
    } else {
      this.playing_id = id;
    }
    // update the audio element
    this.current_track.pause();
    this.current_src.attr("src", "/songs/"+this.playing_id);
    this.current_track.load();
    this.current_track.play();
    // set the state to playing
    this.setIsPlaying(true);
    // show the songs info
    info = new InfoView();
    MusicApp.infoRegion.show(info);
    // update the selected item
    $("tr").removeClass("light-blue");
    $("#"+id).addClass("light-blue");
    // update the window title
    window.document.title = this.current_song.attributes.title + " - " + this.current_song.attributes.display_artist;
  };
  this.setIsPlaying = function(isPlaying){
    this.is_playing = isPlaying;
    $(this.names.playpause).removeClass("fa-play fa-pause");
    if(this.is_playing){
      $(this.names.playpause).addClass("fa-pause");
    } else {
      $(this.names.playpause).addClass("fa-play");
    }
  }
  this.togglePlayState = function(){
    if(this.is_playing){
      current_track.pause();
    } else {
      current_track.play();
    }
    this.setIsPlaying(!this.is_playing);
  }
  this.toggleShuffle = function(){
    // toggle and save the value
    this.shuffle_state = !this.shuffle_state;
    localStorage.setItem('shuffle', this.shuffle_state);
    this.redrawShuffle();
  }
  this.redrawShuffle = function(){
    // change the dom
    if(this.shuffle_state){
      $(this.names.shuffle).addClass('blue');
    } else {
      $(this.names.shuffle).removeClass('blue');
    }
  }
  this.toggleRepeat = function(){
    // change the state and save the value
    this.repeat_state = (this.repeat_state+1)%3;
    localStorage.setItem('repeat', this.repeat_state);
    this.redrawRepeat();
  }
  this.redrawRepeat = function(){
    $(this.names.repeat).addClass("blue");
    $(this.names.repeat_badge).addClass("hidden");
    if(this.repeat_state == this.repeat_states.one){
      $(this.names.repeat_badge).removeClass("hidden");
    } else if(this.repeat_state == this.repeat_states.none) {
      $(this.names.repeat).removeClass("blue");
    }
  }
  this.genShufflePool = function(){
    if(player.queue_pool.length > 1){
      // create the shuffle pool, remove the current track, shuffle it and place
      // the current track at the start. This creates a correct shuffle.
      player.shuffle_pool = player.queue_pool.slice(0);
      // remove the current song
      player.shuffle_pool.splice(player.current_index, 1);
      // shuffle the array
      player.shuffle_pool = shuffle_array(player.shuffle_pool);
      // set the shuffle idx back at the start
      player.shuffle_idx = 0;
    } else {
      player.shuffle_pool = player.queue_pool.slice(0);
      player.shuffle_idx = 0;
    }
  }
  this.nextTrack = function(){
    // repeat the current song if the repeat state is on one
    if(this.repeat_state == this.repeat_states.one){
      this.current_track.currentTime = 0;
      this.current_track.play();
      return;
    }
    // find the index we should move to
    var index = 0;
    if(this.play_history_idx > 0 && this.play_history.length >= this.play_history_idx){
      // move forward a song in the history
      this.play_history_idx--;
      // play it and break
      this.playSong(this.play_history[this.play_history_idx], true);
      return;
    } else {
      if(this.shuffle_state){
        if(this.shuffle_idx == this.shuffle_pool.length){
          // reshuffle to make it seem more random
          this.genShufflePool();
        }
        // play the next shuffle song
        this.play_history.unshift(this.shuffle_pool[this.shuffle_idx].attributes._id);
        this.playSong(this.shuffle_pool[this.shuffle_idx].attributes._id, true);
        // increment the shuffle idx for the next time `next` is pressed
        this.shuffle_idx++;
      } else {
        // they don't have shuffle turned on, play the next song in the queue
        var index = this.current_index+1;
        if(index == this.queue_pool.length){
          index = 0;
        }
        // add the song to the history
        this.play_history.unshift(this.queue_pool[index].attributes._id);
        this.playSong(this.queue_pool[index].attributes._id, true);
      }
    }
  }
  this.prevTrack = function(){
    // should we just start this song again
    if(this.current_track.currentTime > 5.00 || this.repeat_state == this.repeat_states.one){
      this.current_track.currentTime = 0;
      this.current_track.play();
    } else {
      // find the previous song if it exists
      if(this.play_history.length > 0 && this.play_history_idx+1 < this.play_history.length){
        // increment the history index marker
        this.play_history_idx++;
        // play the song from the history
        this.playSong(this.play_history[this.play_history_idx], true);
      } else {
        // move to the previous song in the playlist
        var index = this.current_index-1;
        if(index == -1){
          index = this.queue_pool.length-1;
        }
        this.playSong(this.queue_pool[index].attributes._id, true);
      }
    }
  }
  this.setScubElem = function(elem){
    this.scrub = elem;
    this.scrub.slider()
      .on('slide', function(){ player.scrubTimeout() })
      .on('slideStop', function(){ player.scrubTimeoutComplete() });
  }
  this.setVolElem = function(elem){
    this.vol = elem;
    this.vol.slider()
      .on('slide', function(){ player.setVolume(player.vol.slider('getValue')) });
  }
  this.setVolume = function(value){
    this.current_track.volume = value / 100.00;
  }
  this.scrubTimeout = function(){
    if(this.scrubberTimeout !== null){
      clearTimeout(this.scrubberTimeout);
    }
    this.scrubberTimeout = setTimeout(function(){ player.scrubTimeoutComplete() }, 1000);
    this.isSeeking = true;
    // update the time to show the current scrub value
    var seconds = prettyPrintSeconds(this.current_track.duration * this.scrub.slider('getValue') / 100.00);
    $(".current_time").html(seconds);
  }
  this.scrubTimeoutComplete = function(){
    clearTimeout(this.scrubberTimeout);
    this.isSeeking = false;
    this.scrubTo(this.scrub.slider('getValue'));
  }
  // scrub to percentage in current track
  this.scrubTo = function(value){
    var length = this.current_track.duration;
    this.current_track.currentTime = length * value / 100.00;
  }
  this.setCompName = function(name){
    // update the local data
    this.comp_name = name;
    localStorage.setItem('comp_name', this.comp_name);
    // update the name with the server
    socket.emit('set_comp_name', {name: this.comp_name});
  }
}
var player = new PlayState();
player.init();
player.setupCollections();

// soccet connection and events
var loaded = false;
socket.on('connect', function(){
  console.log("Socket connected");
  socket.emit('player_page_connected');
  if(!loaded){
    loaded = !loaded;
  }
});
socket.on('songs', function(data){
  player.song_collection.add(data.songs);
  loadedRestart("songs");
});
socket.on('playlists', function(data){
  player.playlist_collection.reset();
  player.playlist_collection.add(data.playlists);
  // if they just renamed the playlist, redraw the songview
  if(player.playlist !== undefined && player.playlist.editable){
    MusicApp.router.playlist(player.playlist._id);
  }
  // redraw the sidebar
  MusicApp.router.sidebar();
  // restart the router if we are loading for the first time
  loadedRestart("playlists");
});

// jquery initialiser
$(document).ready(function(){
  player.setScubElem($("#scrub_bar"));
  $("body").keydown(function(event){
    // don't fire the controls if the user is editing an input
    if(event.target.localName == 'input'){
      return;
    }
    switch(event.which){
      case 32:
        player.togglePlayState();
        event.preventDefault();
        break;
      case 39:
        player.nextTrack();
        event.preventDefault();
        break;
      case 37:
        player.prevTrack();
        event.preventDefault();
        break;
    }
  });
  // disable the options on scroll
  $("#content").scroll(hideOptions);
});

// backbone app
MusicApp = new Backbone.Marionette.Application();

MusicApp.addRegions({
  sideBarRegion: "#sidebar",
  contentRegion: "#content",
  infoRegion: "#current_info",
  settingBarRegion: "#settings_bar"
});

items = ["playlists", "songs"];
itemsLoaded = [];
MusicAppRouter = Backbone.Router.extend({
  sb: null,
  songview: null,
  settingsbar: null,
  routes: {
    "playlist/:id": "playlist",
    "search/:search": "search"
  },
  playlist: function(id){
    findId = player.playlist_collection.getBy_Id(id);
    if(findId == -1){
      findId = player.playlist_collection.getBy_Id("LIBRARY");
    }
    player.playlist = findId;
    // update the currently viewed songs
    player.songs = player.song_collection.getByIds(player.playlist);
    // reset the sorting variables
    player.sort_asc = player.sort_col = null;
    // if the songs were found, update the songview
    if(player.songs){
      this.songview = new SongView();
      MusicApp.contentRegion.show(this.songview);
    }
  },
  search: function(search){
    player.searchItems(search);
  },
  sidebar: function(id){
    this.sb = new SidebarView();
    MusicApp.sideBarRegion.show(this.sb);
  },
  settingsbar: function(id){
    this.settingsbar = new SettingsBarView();
    MusicApp.settingBarRegion.show(this.settingsbar);
  }
});

MusicApp.addInitializer(function(options){
  this.router = new MusicAppRouter();
  // setup the settings bar section
  MusicApp.router.settingsbar();
  // load the history api
  Backbone.history.start({pushState: false});
});

SongView = Backbone.View.extend({
  template: "#song_template",
  render: function(){
    var self = this;
    // calculate the duration
    var totalDuration = 0;
    for(var song = 0; song < player.songs.length; song++){
     totalDuration += player.songs[song].attributes.duration;
    }
    // render the view
    this.$el.html(render(this.template, {
      title: player.playlist.title,
      editable: player.playlist.editable,
      _id: player.playlist._id,
      sort_col: player.sort_col,
      sort_asc: player.sort_asc,
      songs: player.songs,
      numSongs: player.songs.length,
      totalDuration: prettyPrintSecondsorNA(totalDuration)
    }));
    this.$el.addClass("custom_scrollbar");
    // add scroll event handler
    this.$el.scroll(function(ev){
      MusicApp.router.songview.checkScroll(ev);
    });
    // logic to manually order the songs in a playlist
    if( player.playlist.editable && // playlist is editable
        // it is sorted in a way that makes sense for sorting
        (player.sort_col == null && player.sort_asc == null)){
      this.$el.find(".song_table tbody").sortable({
        delay: 100,
        items: 'tr',
        helper: fixHelper,
        update: function(event, ui){
          // get where the item has moved from - to
          var item = player.song_collection.findBy_Id(ui.item.attr('id'));
          var oldIndex = item.attributes.index-1;
          var newIndex = ui.item.index();
          // remove the item from it's old place
          var item = player.playlist.songs.splice(oldIndex, 1)[0];
          // add the item into it's new place
          player.playlist.songs.splice(newIndex, 0, item);
          // refresh the songs array from the playlist
          player.songs = player.song_collection.getByIds(player.playlist);
          // send the data back to the server
          socket.emit("song_moved_in_playlist", {
            playlist_id: player.playlist._id,
            oldIndex: oldIndex,
            newIndex: newIndex
          });
        }
      });
    }
    // set the defaults and start rendering songs
    // init the processing variable
    this.processing = false;
    // content height
    this.contentHeight = $("#content").height();
    // height of one item
    this.individual_height = 42;
    // how many to show at a time
    this.how_many_drawn = Math.ceil(window.innerHeight / this.individual_height) * 2;
    if(this.how_many_drawn > player.songs.length){
      this.how_many_drawn = player.songs.length;
    }
    // initialise the lastmin and lastmax
    this.lastmin = 0;
    if(player.songs.length > 0){
      this.lastmin = 1;
    }
    this.lastmax = 0;
    // height of number drawn
    this.height_of_drawn = this.how_many_drawn * this.individual_height;
    // how high is the table in total
    this.total_table_height = player.songs.length * this.individual_height;
    setTimeout(function(){
      // get hight of elems above table body incl header row
      self.meta_height = $(".playlist_meta").height() + 40;
      // draw the songs
      self.renderSong();
    }, 0);
  },
  events: {
    "click .colsearch": "triggerSearch",
    "click thead > tr": "triggerSort",
    "click tbody > tr": "triggerSong",
    "click .options": "triggerOptions",
    "contextmenu td": "triggerOptions",
    "click .cover": "triggerCover",
    "click .rename_playlist": "renamePlaylist",
    "click .delete_playlist": "deletePlaylist"
  },
  triggerSearch: function(ev){
    var search = $(ev.target).text();
    player.updateSearch(search);
  },
  triggerSort: function(ev){
    var column_name = $(ev.target).closest("th").attr('class').replace('_th', '');
    player.sortSongs(column_name);
    this.render();
  },
  triggerSong: function(ev){
    if($(ev.target).hasClass("options") || $(ev.target).hasClass("colsearch")){
      return;
    }
    id = $(ev.target).closest("tr").attr('id');
    hideOptions();
    if(ev.ctrlKey){
      // ctrlKey pressed, add to selection
      addToSelection(id, true);
    } else if(ev.shiftKey){
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
  triggerOptions: function(ev){
    if(!optionsVisible){
      id = $(ev.target).closest("tr").attr('id');
      if($.inArray(id, selectedItems) == -1){
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
  triggerCover: function(ev){
    showCover($(ev.target).attr('src'));
    return false;
  },
  renamePlaylist: function(ev){
    bootbox.prompt({
      title: "What would you like to rename \"" + player.playlist.title
        + "\" to?",
      value: player.playlist.title,
      callback: function(result){
        if (result !== null) {
          socket.emit('rename_playlist', {
            title: result,
            id: player.playlist._id
          });
        }
      }
    });
  },
  deletePlaylist: function(ev){
    bootbox.dialog({
      message: "Do you really want to delete this playlist?",
      title: "Delete Playlist",
      buttons: {
        cancel: {
          label: "Cancel",
          className: "btn-default"
        },
        del: {
          label: "Delete",
          className: "btn-danger",
          callback: function() {
            socket.emit('delete_playlist', {del: player.playlist._id});
            MusicApp.router.playlist("LIBRARY");
          }
        }
      }
    });
  },
  renderSong: function(){
    // simple block to make sure it is only processing a render once at any point in time
    if(!this.processing){
      this.processing = true;
      // cache scroll top variable
      var scrollTop = this.$el.scrollTop();
      // get the index of the item in the center of the screen
      var middle_of_viewport = scrollTop + this.contentHeight / 2 - this.meta_height;
      var middle_item = Math.floor(middle_of_viewport / this.individual_height);

      // get the bounds of items to draw
      var min = middle_item - this.how_many_drawn/2;
      var max = middle_item + this.how_many_drawn/2;
      if(min < 0){
        min = 0;
        max = this.how_many_drawn;
      }
      if(max > player.songs.length-1){
        max = player.songs.length-1;
        min = max - this.how_many_drawn + 1;
      }

      if(min != this.lastmin || max != this.lastmax){
        // the elements we are drawing has changed
        // remove the elements no longer viewable
        $(".song_body tr").each(function(index){
          var index = $(this).attr('data-index');
          if(index != 'spacer'){
            index = parseInt(index);
            if(index < min || index > max){
              $(this).remove();
            }
          }
        });
        // add the elements from the side they can be added from
        var index = 0;
        if(max > this.lastmax){
          // add them to the bottom
          var diff = max - this.lastmax - 1;
          while(diff >= 0){
            index = max-diff;
            var render_item = render("#song_item", {
              song: player.songs[index],
              selected: (selectedItems.indexOf(player.songs[index].attributes._id) != -1),
              index: index
            });
            $(".bottom-spacer").before(render_item);
            diff--;
          }
        }
        if(min < this.lastmin){
          // add them to the top
          var diff = this.lastmin - min - 1;
          while(diff >= 0){
            index = min+diff;
            var render_item = render("#song_item", {
              song: player.songs[index],
              selected: (selectedItems.indexOf(player.songs[index].attributes._id) != -1),
              index: index
            });
            $(".top-spacer").after(render_item);
            diff--;
          }
        }
        this.lastmax = max;
        this.lastmin = min;
      }

      // calculate the spacing heights
      var top_of_viewport  = scrollTop;
      var top = top_of_viewport - this.height_of_drawn/2;
      if(top < 0)
        top = 0;
      if(top > this.total_table_height - this.height_of_drawn)
        top = this.total_table_height - this.height_of_drawn;

      var bottom_of_viewport = scrollTop + this.contentHeight;
      var bottom = this.total_table_height - bottom_of_viewport - this.height_of_drawn/2;
      if(bottom < 0)
        bottom = 0;

      // set the spacing heights
      $(".top-spacer").css('height', top);
      $(".items-spacer").css('height', this.height_of_drawn);
      $(".bottom-spacer").css('height', bottom);

      this.processing = false;
    }
  },
  redrawSong: function(_id){
    // check if the song is already visible
    var song_tr = this.$el.find("#"+_id);
    if(song_tr.length != 0){
      // now replace the item
      this.$el.find("#"+_id).replaceWith(render("#song_item", { song: player.song_collection.findBy_Id(_id)}));
    }
  },
  checkScroll: function(ev){
    this.renderSong();
  }
});

function showCover(src){
  box = new CoverBox(src);
  box.activate();
}

var optionsVisible = false;
var selectedItems = [];
var lastSelection = '';
function createOptions(x, y){
  // calculate if the menu should 'drop up'
  var dropup = "";
  if(y+300 > $(window).height()){
    dropup = "dropup"
  }
  $(".options_container").html(render("#options_template", {
      playlists: player.playlist_collection.models,
      current_playlist: player.playlist,
      dropup: dropup
    }))
    .css({"top": y+"px", "left": x+"px"});
  $(".add_to_queue").click(function(ev){
    player.play_history.unshift(lastSelection);
    player.play_history_idx++;
    hideOptions();
  });
  $(".add_to_playlist").click(function(ev){
    id = $(ev.target).closest("li").attr('id');
    socket.emit("add_to_playlist", {add: selectedItems, playlist: id});
    hideOptions();
  });
  $(".remove_from_playlist").click(function(ev){
    id = $(ev.target).closest("li").attr('id');
    for (var i = 0; i < selectedItems.length; i++) {
      $("#"+selectedItems[i]).remove();
    }
    socket.emit("remove_from_playlist", {remove: selectedItems, playlist: id});
    hideOptions();
  });
  $(".hard_rescan").click(function(ev){
    socket.emit("hard_rescan", {items: selectedItems});
    hideOptions();
  });
  $(".view_info").click(function(ev){
    shoInfoView(selectedItems);
    hideOptions();
  })
  optionsVisible = true;
}
function hideOptions(){
  $(".options_container").css({"top:": "-1000px", "left": "-1000px"});
  optionsVisible = false;
}
function addToSelection(id, clearIfIn){
  lastSelection = id;
  for (var i = 0; i < selectedItems.length; i++) {
    if(selectedItems[i] == id){
      if(clearIfIn){
        selectedItems.splice(i, 1);
        $("#"+id).removeClass("selected");
      }
      return;
    }
  }
  selectedItems.push(id);
  $("#"+id).addClass("selected");
}
function delFromSelection(id){
  for (var i = 0; i < selectedItems.length; i++) {
    if(selectedItems[i] == id){
      selectedItems.splice(i, 1);
      $("#"+id).removeClass("selected");
    }
  }
}
function selectBetween(id, id2){
  loc1 = indexInSongView(id);
  loc2 = indexInSongView(id2);
  // make sure loc1 is less than loc2
  if(loc1 > loc2){
    temp = loc1;
    loc1 = loc2;
    loc2 = temp;
  }
  for(var i = loc1; i <= loc2; i++){
    addToSelection(player.songs[i].attributes._id, false)
  };
}
function indexInSongView(id){
  for(var i = 0; i < player.songs.length; i++){
    if(player.songs[i].attributes._id == id){
      return i;
    }
  }
  return -1;
}
function clearSelection(){
  selectedItems = [];
  $("tr").removeClass("selected")
}

// show the info for the selected songs
function shoInfoView(items){
  // input checking
  if(items.length > 1){
    console.log("Currently we only support editing of one item at a time");
  } else if(items.length == 0){
    console.log("Error: 0 items selected");
    return;
  }
  // process the edit for the item
  var track = player.song_collection.findBy_Id(items[0]);
  // if they are currently on the computer running the app
  var onserver = (window.location.hostname == 'localhost') ? true : false;
  // generate the content of the modal
  var message = render("#info_template", {track: track, music_dir: music_dir, onserver: onserver});
  // function for saving data
  var save_func = function(){
    // change the data
    var data = {
      _id: $("#edit_id").val(),
      title: $("#title").val(),
      artist: $("#artist").val(),
      album: $("#album").val()
    };
    // get the data to change on the server
    socket.emit('update_song_info', data);
    // get the data to change on the client
    track.attributes.title = data.title;
    track.attributes.display_artist = data.artist;
    track.attributes.album = data.album;
    // redraw the song
    MusicApp.router.songview.redrawSong(data._id);
  };
  bootbox.dialog({
    title: track.attributes.title,
    message: message,
    buttons: {
      success: {
        label: "Save",
        className: "btn-success",
        callback: save_func
      },
      main: {
        label: "Close Without Saving",
        className: "btn-default"
      }
    }
  });
  // show the img in full when mousove
  $(".info_cover, .detailed").popover({
    html: true,
    trigger: 'hover',
    placement: 'bottom',
    content: function () {
      return '<p><img src="' +$(this)[0].src + '" /></p>';
    }
  });
  // tie the enter key on the inputs to the save function
  $(".edit_form :input").keydown(function(ev){
    // if enter key
    if(ev.keyCode==13){
      save_func();
      // manually hide the modal, because it wasn't called from the button press
      $('.bootbox').modal('hide');
    }
  });
  // open the directory in a file manager
  $(".open_dir").click(function(ev){
    var location = $(this).attr('title');
    socket.emit('open_dir', location);
  });
  // dismiss the modal on backdrop click
  $(".bootbox").click(function(ev){
    if(ev.target != this) return;
    $('.bootbox').modal('hide');
  });
}

SidebarView = Backbone.View.extend({
  template: "#sidebar_template",
  render: function(){
    var editable = player.playlist_collection.where({'editable': true});
    var fixed = player.playlist_collection.where({'editable': false});
    this.setElement(render(this.template, {title: "Playlists", search: player.searchText, editable: editable, fixed: fixed}));
  },
  events: {
    "click .add_playlist": "addPlaylist",
    "keyup .search-input": "searchItems"
  },
  addPlaylist: function(){
    bootbox.prompt("Playlist title?", function(result){
      if (result !== null) {
        socket.emit('create_playlist', {title: result, songs: []});
      }
    });
  },
  searchItems: function(){
    searchText = $(".search-input").val();
    player.updateSearch(searchText);
    return true;
  }
});

SettingsBarView = Backbone.View.extend({
  template: "#settings_bar_template",
  render: function(){
    this.$el.html(render(this.template, {vol: 100}));
    _.defer(function(){
      var volElem = $("#vol_bar");
      if(volElem.length > 0){
        player.setVolElem(volElem);
      }
    });
  },
  events: {
    "click #remote_setup": "openOptions"
  },
  openOptions: function(){
    bootbox.dialog({
      message: render("#control_template", { comp_name: player.comp_name, host: window.location.host }),
      title: "Setup Remote Control",
      buttons: {
        danger: {
          label: "Cancel",
          className: "btn-danger"
        },
        success: {
          label: "Save",
          className: "btn-success",
          callback: function() {
            comp_name = $("#comp_name_input").val();
            player.setCompName(comp_name);
          }
        }
      }
    });
  }
})

InfoView = Backbone.View.extend({
  template: "#current_info_template",
  render: function(){
    this.$el.html(render(this.template, player.current_song));
  },
  events: {
    "click .colsearch": "triggerSearch",
    "click .info_cover": "triggerCover",
    "click .info_options": "triggerOptions"
  },
  triggerCover: function(ev){
    showCover($(ev.target).attr('src'));
    return false;
  },
  triggerOptions: function(ev){
    if(!optionsVisible){
      addToSelection(player.playing_id, false);
      createOptions(ev.clientX, ev.clientY);
    }
    return false;
  },
  triggerSearch: function(ev){
    search = $(ev.target).text();
    player.updateSearch(search);
  }
});

MusicApp.start();

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}

function loadedRestart(item){
  itemsLoaded.push(item);
  if(arraysEqual(items, itemsLoaded)){
    Backbone.history.stop();
    Backbone.history.start();
    // if the player is showing nothing, show the default place
    if(MusicApp.router.songview === null){
      MusicApp.router.playlist();
    }
  }
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  a.sort();
  b.sort();

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function prettyPrintSeconds(seconds){
  var pretty = "";
  // days
  if(seconds > 86400){
    pretty += Math.floor(seconds / 86400) + " day";
    // is it plural
    if(Math.floor(seconds / 86400) != 1.0){
      pretty += "s";
    }
    pretty += " ";
  }
  // hours
  if(seconds > 3600){
    pretty += Math.floor(seconds % 86400 / 3600) + ":";
  }
  // minutes
  if(seconds > 60){
    pretty += ("0" + Math.floor(seconds % 3600 / 60)).slice(-2) + ":";
  } else {
    pretty += "0:";
  }
  // seconds
  pretty += ("0" + Math.floor(seconds % 60)).slice(-2);
  return pretty;
}
function prettyPrintSecondsorNA(seconds){
  if(seconds == 0){
    return "N/A";
  } else {
    return prettyPrintSeconds(seconds);
  }
}

function searchMatchesSong(songString, searchWords){
  for(var i = 0; i < searchWords.length; i++){
    if(songString.indexOf(searchWords[i]) == -1){
      return false;
    }
  }
  return true;
}

// implementation of knuth-shuffle by @coolaj86
// https://github.com/coolaj86/knuth-shuffle
function shuffle_array(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function randomIntFromInterval(min,max){
  return Math.floor(Math.random()*(max-min+1)+min);
}

function deAttribute(collection){
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

// make it usable in swig
swig.setFilter('prettyPrintSeconds', prettyPrintSecondsorNA);
