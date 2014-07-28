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
var waiting_sc_update = false;
socket.on('playlists', function(data){
  player.playlist_collection.reset();
  player.playlist_collection.add(data.playlists);
  // redraw the sidebar
  MusicApp.router.sidebar();
  // restart the router if we are loading for the first time
  loadedRestart("playlists");
  // if they are on the soundcloud playlist, there is a chance they just added the song
  if(waiting_sc_update){
    var sc_plist = player.playlist_collection.getByName("SoundCloud");
    MusicApp.router.playlist(sc_plist._id);
  }
});
var MessengerMessage = null;
socket.on('sc_update', function(data){
  if(data.type == "started"){
    MessengerMessage = Messenger().post("Starting download from SoundCloud of " + data.count + " tracks");
  } else if(data.type == "added"){
    // it came with a song
    player.song_collection.add(data.content);
    // show an updated message
    var msg = "song " + data.completed + " out of " + data.count;
    if(data.complete == data.count){
      msg = "last song of SoundCloud download";
    }
    MessengerMessage.update("Added " + msg + " (" + data.content.title + ")");
    // update the collections
    socket.emit('fetch_playlists');
    waiting_sc_update = true;
  } else if(data.type == "skipped"){
    MessengerMessage.update("Skipped song " + data.completed + ". Unable to read from SoundCloud");
  }
});
