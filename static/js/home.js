// define things before they are used
var socket = io.connect('http://'+window.location.hostname+':2000');

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
        song = this.findBy_Id(playlist.songs[i]["_id"]);
        if(song){
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
  this.d = {
    scrubTimeout: null
  };
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
  // current pool of songs to play
  this.queue_pool = [];
  this.song_collection = null;
  this.playlist_collection = null;
  this.playing_id = null;
  this.is_playing = false;
  this.shuffle_state = false;
  this.repeat_state = 0;
  this.current_track = document.getElementById("current_track");
  this.fade_track = document.getElementById("fade_track");
  this.scrub = null;
  this.init = function(){
    setInterval(function(){ player.update() }, 50);
    $(this.names.playpause).click(function(){ player.togglePlayState() });
    $(this.names.next).click(function(){ player.nextTrack() });
    $(this.names.prev).click(function(){ player.prevTrack() });
    $(this.names.repeat).click(function(){ player.toggleRepeat() });
    $(this.names.shuffle).click(function(){ player.toggleShuffle() });
    this.current_src = $("#current_src");
    this.fade_src = $("#fade_src");
    this.current_track.addEventListener('ended', function(){ player.nextTrack() });
    this.current_track.addEventListener('durationchange', function(){ player.durationChanged() });
    this.shuffle_state = localStorage.getItem('shuffle') || false;
    this.redrawShuffle();
    this.repeat_state = localStorage.getItem('repeat') || this.repeat_states.all;
    this.redrawRepeat();
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
  }
  this.searchItems = function(searchText){
    this.searchText = searchText;
    if(searchText.length < 3){
      return;
    }
    searchText = searchText.toLowerCase();
    var tmpSongs = [];
    for (var i = 0; i < this.song_collection.length; i++) {
      var item = this.song_collection.models[i];
      if(this.songMatches(item, searchText)){
        tmpSongs.push(item);
      }
    }
    this.songs = tmpSongs;
    this.playlist = {
      title: "Search Results for: '"+searchText+"'",
      editable: false
    };
    if(MusicApp.router.songview){
      MusicApp.router.songview.render();
    } else {
      MusicApp.router.songview = new SongView();
      MusicApp.contentRegion.show(MusicApp.router.songview);
    }
    window.location.hash = '';
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
  this.durationChanged = function(){
    var seconds = prettyPrintSeconds(this.current_track.duration);
    $(".duration").html(seconds);
  }
  this.playSong = function(id){
    this.current_index = this.findSongIndex(id);
    this.current_song = this.queue_pool[this.current_index];
    if(id == this.playing_id){
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
  this.nextTrack = function(){
    if(this.repeat_state == this.repeat_states.one){
      this.current_track.currentTime = 0;
      this.current_track.play();
      return;
    }
    var index = 0;
    if(this.shuffle_state){
      // the -2 is to take 1 off the length and 1 for the current track
      // it then adds to the value if it is >= the current index.
      // this ensures the same track is not played and the the new random
      // track contains no bias
      var index = randomIntFromInterval(0, this.queue_pool.length-2);
      if(index >= this.current_index){
        index++;
      }
    } else {
      var index = this.current_index+1;
      if(index == this.queue_pool.length){
        index = 0;
      }
    }
    this.playSong(this.queue_pool[index].attributes._id);
  }
  this.prevTrack = function(){
    if(this.current_track.currentTime > 5.00 || this.repeat_state == this.repeat_states.one){
      this.current_track.currentTime = 0;
      this.current_track.play();
    } else {
      // move to the previous song
      var index = this.current_index-1;
      if(index == -1){
        index = this.queue_pool.length-1;
      }
      this.playSong(this.queue_pool[index].attributes._id);
    }
  }
  this.setScubElem = function(elem){
    this.scrub = elem;
    this.scrub.slider()
      .on('slide', function(){ player.scrubTimeout() })
      .on('slideStop', function(){ player.scrubTo() });
  }
  this.scrubTimeout = function(){
    if(this.d.scrubTimeout !== null){
      clearTimeout(this.d.scrubTimeout);
    }
    this.d.scrubTimeout = setTimeout(function(){ player.scrubTo() }, 1000);
    this.isSeeking = true;
    // update the time to show the current scrub value
    var seconds = prettyPrintSeconds(this.current_track.duration * this.scrub.slider('getValue') / 100.00);
    $(".current_time").html(seconds);
  }
  this.scrubTo = function(){
    clearTimeout(this.d.scrubTimeout);
    this.isSeeking = false;
    var value = this.scrub.slider('getValue');
    var length = this.current_track.duration;
    this.current_track.currentTime = length * value / 100.00;
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
  MusicApp.router.sidebar();
  loadedRestart("playlists");
});

// jquery initialiser
$(document).ready(function(){
  player.setScubElem($("#scrub_bar"));
  $("#wrapper").keydown(function(event){
    if(event.target.id != 'wrapper'){
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
  infoRegion: "#current_info"
});

items = ["playlists", "songs"];
itemsLoaded = [];
MusicAppRouter = Backbone.Router.extend({
  sb: null,
  songview: null,
  routes: {
    "playlist/:id": "playlist"
  },
  playlist: function(id){
    player.playlist = player.playlist_collection.getBy_Id(id);
    player.songs = player.song_collection.getByIds(player.playlist);
    if(player.songs){
      this.songview = new SongView();
      MusicApp.contentRegion.show(this.songview);
    }
  },
  sidebar: function(id){
    this.sb = new SidebarView();
    MusicApp.sideBarRegion.show(this.sb);
  }
});

MusicApp.addInitializer(function(options){
  this.router = new MusicAppRouter();
  Backbone.history.start({pushState: false});
});

SongView = Backbone.View.extend({
  template: "#song_template",
  render: function(){
    this.$el.html(render(this.template, {
      title: player.playlist.title, 
      editable: player.playlist.editable,
      _id: player.playlist._id,
      songs: player.songs
    }));
    this.$el.addClass("custom_scrollbar");
    // add scroll event handler
    this.$el.scroll(function(){
      MusicApp.router.songview.checkScroll();
    });
    this.songIndex = 0;
    this.renderSong();
  },
  events: {
    "click tbody > tr": "triggerSong",
    "click .options": "triggerOptions",
    "contextmenu td": "triggerOptions",
    "click .cover": "triggerCover"
  },
  triggerSong: function(ev){
    if($(ev.target).hasClass("options")){
      return;
    }
    id = $(ev.target).closest("tr").attr('id');
    player.queue_pool = player.songs.slice(0);
    player.playSong(id);
  },
  triggerOptions: function(ev){
    if(!optionsVisible){
      id = $(ev.target).closest("tr").attr('id');
      createOptions(ev.clientX, ev.clientY, id);
    } else {
      hideOptions();
    }
    return false;
  },
  triggerCover: function(ev){
    showCover($(ev.target).attr('src'));
    return false;
  },
  renderSong: function(){
    var batch = 50;

    if(this.songIndex < player.songs.length){
      var item = "";
      for(i = 0; i < batch; i++){
        item += render("#song_item", { song: player.songs[this.songIndex], index: this.songIndex} );
        this.songIndex++;
        if(this.songIndex == player.songs.length){
          break;
        }
      }
      this.$el.find(".song_body").append(item);
    }
  },
  checkScroll: function(){
    var scroll = this.$el.scrollTop() + $("#content").height();
    var height = this.$el.find("table").height();
    if((scroll / height) > 0.8){
      this.renderSong();
    }
  }
});

function showCover(src){
  box = new CoverBox(src);
  box.activate();
}

var optionsVisible = false;
var optionsItem = "";
function createOptions(x, y, id){
  // calculate if the menu should 'drop up'
  var dropup = "";
  if(y+300 > $(window).height()){
    dropup = "dropup"
  }
  optionsItem = id;
  $(".options_container").html(render("#options_template", {
      playlists: player.playlist_collection.models,
      current_playlist: player.playlist,
      dropup: dropup
    }))
    .css({"top": y+"px", "left": x+"px"});
  $(".add_to_playlist").click(function(ev){
    id = $(ev.target).closest("li").attr('id');
    socket.emit("add_to_playlist", {add: optionsItem, playlist: id});
    hideOptions();
  });
  $(".remove_from_playlist").click(function(ev){
    id = $(ev.target).closest("li").attr('id');
    $("#"+optionsItem).remove();
    socket.emit("remove_from_playlist", {remove: optionsItem, playlist: id});
    hideOptions();
  });
  $(".hard_rescan").click(function(ev){
    socket.emit("hard_rescan", {item: optionsItem});
    hideOptions();
  });
  optionsVisible = true;
}
function hideOptions(){
  $(".options_container").css({"top:": "-1000px", "left": "-1000px"});
  optionsVisible = false;
}

SidebarView = Backbone.View.extend({
  template: "#sidebar_template",
  render: function(){
    var editable = player.playlist_collection.where({'editable': true});
    var fixed = player.playlist_collection.where({'editable': false});
    this.setElement(render(this.template, {"title": "Playlists", search: player.searchText, editable: editable, fixed: fixed}));
  },
  events: {
    "click .add_playlist": "addPlaylist",
    "keyup .search-input": "searchItems"
  },
  addPlaylist: function(){
    bootbox.prompt("Playlist title?", function(result){
      if (result !== null) {
        socket.emit('create_playlist', {"title": result, songs: []});
      }
    });
  },
  searchItems: function(){
    searchText = $(".search-input").val();
    player.searchItems(searchText);
    return true;
  }
});

InfoView = Backbone.View.extend({
  template: "#current_info_template",
  render: function(){
    this.$el.html(render(this.template, player.current_song));
  },
  events: {
    "click .info_cover": "triggerCover"
  },
  triggerCover: function(ev){
    showCover($(ev.target).attr('src'));
    return false;
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
  pretty += (seconds > 60) ? Math.floor(seconds/60) + ":" : "0:";
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

function randomIntFromInterval(min,max){
  return Math.floor(Math.random()*(max-min+1)+min);
}
// make it usable in swig
swig.setFilter('prettyPrintSeconds', prettyPrintSecondsorNA);