// music library object
function PlayState(){
  this.songs = [];
  this.playing_now = null;
  this.is_playing = false;
  this.current_track = document.getElementById("current_track");
  this.fade_track = document.getElementById("fade_track");
  this.playSong = function(id){
    if(id == this.playing_now){
      return;
    } else {
      this.playing_now = id;
    }
    this.current_track.innerHTML = "<source src='/songs/"+this.playing_now+"' type='audio/mpeg'>";
    this.current_track.play();
    this.is_playing = true;
  };
  this.togglePlayState = function(){
    if(this.is_playing){
      current_track.pause();
    } else {
      current_track.play();
    }
    this.is_playing = !this.is_playing;
  }
}
var player = new PlayState();

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

// backbone app
MusicApp = new Backbone.Marionette.Application();

MusicApp.addRegions({
  sideBarRegion: "#sidebar",
  contentRegion: "#content"
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
    console.log(id);
    player.playSong(id);
  }
});

SidebarView = Backbone.View.extend({
  template: "#sidebar_template",
  render: function(){
    this.$el.html(render(this.template, {"title": "Sidebar"}));
  }
});

MusicApp.start();

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}