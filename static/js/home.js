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
  this.songs = [];
  this.queue_pool = [];
  this.playing_id = null;
  this.is_playing = false;
  this.shuffle_state = false;
  this.repeat_state = 0;
  this.current_track = document.getElementById("current_track");
  this.fade_track = document.getElementById("fade_track");
  this.scrub = null;
  this.init = function(){
    setInterval(function(){ player.update() }, 20);
    $(this.names.playpause).click(function(){ player.togglePlayState() });
    $(this.names.next).click(function(){ player.nextTrack() });
    $(this.names.prev).click(function(){ player.prevTrack() });
    $(this.names.repeat).click(function(){ player.toggleRepeat() });
    $(this.names.shuffle).click(function(){ player.toggleShuffle() });
    this.current_track.addEventListener('ended', function(){ player.nextTrack() });
  }
  this.update = function(){
    if(this.is_playing && !this.isSeeking){
      this.scrub.slider('setValue', this.current_track.currentTime / this.current_track.duration * 100.0);
    }
  }
  this.findSongIndex = function(id){
    for (var i = 0; i < this.songs.length; i++) {
      if(id == this.songs[i]["_id"]){
        return i;
      }
    }
  }
  this.playSong = function(id){
    this.current_song = this.songs[this.findSongIndex(id)];
    if(id == this.playing_id){
      return;
    } else {
      this.playing_id = id;
    }
    // update the audio element
    this.current_track.pause();
    this.current_track.innerHTML = "<source src='/songs/"+this.playing_id+"' type='audio/mpeg'>";
    this.current_track.play();
    // set the state to playing
    this.setIsPlaying(true);
    // show the songs info
    info = new InfoView();
    MusicApp.infoRegion.show(info);
    // update the selected item
    $("tr").removeClass("light-blue");
    $("#"+id).addClass("light-blue");
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
    this.shuffle_state = !this.shuffle_state;
    if(this.shuffle_state){
      $(this.names.shuffle).addClass('blue');
    } else {
      $(this.names.shuffle).removeClass('blue');
    }
  }
  this.toggleRepeat = function(){
    // change the state
    this.repeat_state = (this.repeat_state+1)%3;
    // reset the look
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
    var index = this.findSongIndex(this.current_song._id)+1;
    if(index == this.songs.length){
      index = 0;
    }
    this.playSong(this.songs[index]._id);
  }
  this.prevTrack = function(){
    var index = this.findSongIndex(this.current_song._id)-1;
    if(index == -1){
      index = this.songs.length-1;
    }
    this.playSong(this.songs[index]._id);
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
  }
  this.scrubTo = function(){
    clearTimeout(this.d.scrubTimeout);
    this.isSeeking = false;
    value = this.scrub.slider('getValue');
    length = this.current_track.duration;
    this.current_track.currentTime = length * value / 100.00;
  }
}
var player = new PlayState();
player.init();

// soccet connection and events
var socket = io.connect('http://'+window.location.hostname+':2000');
var loaded = false;
socket.on('connect', function(){
  console.log("Socket connected");
  if(!loaded){
    socket.emit('fetch_songs');
    loaded = !loaded;
  }
});
socket.on('songs', function(data){
  player.songs = data.songs;
  songView = new SongView();
  MusicApp.contentRegion.show(songView);
});

// jquery initialiser
$(document).ready(function(){
  console.log("Ready");
  player.setScubElem($("#scrub_bar"));
});

// backbone app
MusicApp = new Backbone.Marionette.Application();

MusicApp.addRegions({
  sideBarRegion: "#sidebar",
  contentRegion: "#content",
  infoRegion: "#current_info"
});

MusicApp.addInitializer(function(options){
  sidebar = new SidebarView();
  MusicApp.sideBarRegion.show(sidebar);
  Backbone.history.start();
});

SongView = Backbone.View.extend({
  template: "#song_template",
  render: function(){
    this.$el.html(render(this.template, {songs: player.songs}));
  },
  events: {
    "click tr": "triggerSong"
  },
  triggerSong: function(ev){
    id = $(ev.target).closest("tr").attr('id');
    player.queue_pool = player.songs;
    player.playSong(id);
  }
});

SidebarView = Backbone.View.extend({
  template: "#sidebar_template",
  render: function(){
    this.$el.html(render(this.template, {"title": "Sidebar"}));
  }
});

InfoView = Backbone.View.extend({
  template: "#current_info_template",
  render: function(){
    this.$el.html(render(this.template, player.current_song));
  }
});

MusicApp.start();

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}