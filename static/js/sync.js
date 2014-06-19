// collections
var PlaylistCollection = Backbone.Collection.extend({});
var SongCollection = Backbone.Collection.extend({});
// soccet connection to player this was loaded from
var a = {
  socket: io.connect('http://'+window.location.host),
  song_collection: new SongCollection(),
  playlist_collection: new PlaylistCollection()
};
var b = {
  socket: null,
  song_collection: new SongCollection(),
  playlist_collection: new PlaylistCollection()
};
a.socket.on('connect', function(){
  a.socket.emit('sync_page_connected');
  console.log("Socket_a connected");
});
a.socket.on('alldata', function(data){
  // reset the playlists
  a.playlist_collection.reset();
  a.playlist_collection.add(data.playlists);
  // reset the songs
  a.song_collection.reset();
  a.song_collection.add(data.songs);
  console.log("A recieved data");
});

$("#fetch_data").click(function(){
  b.socket = io.connect($("#remote").val());
  b.socket.on('connect', function(){
    b.socket.emit('sync_page_connected');
    console.log("Socket_b connected");
  });
  b.socket.on('alldata', function(data){
    // reset the playlists
    a.playlist_collection.reset();
    a.playlist_collection.add(data.playlists);
    // reset the songs
    a.song_collection.reset();
    a.song_collection.add(data.songs);
    console.log("B recieved data");
  });
});
