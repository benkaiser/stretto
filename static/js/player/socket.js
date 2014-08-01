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
  // redraw the sidebar
  MusicApp.router.sidebar();
  // restart the router if we are loading for the first time
  loadedRestart("playlists");
});
var SCMessenger = null;
socket.on('sc_update', function(data){
  console.log(data);
  if(data.type == "started"){
    SCMessenger = Messenger().post("Starting download from SoundCloud of " + data.count + " tracks");
  } else if(data.type == "added"){
    // it came with a song
    player.song_collection.add(data.content);
    // show an updated message
    var msg = "song " + data.completed + " out of " + data.count;
    if(data.complete == data.count){
      msg = "last song of SoundCloud download";
    }
    SCMessenger.update("Added " + msg + " (" + data.content.title + ")");
    // add the song to the SoundCloud playlist
    var sc_plist = player.playlist_collection.getByName("SoundCloud");
    sc_plist.songs.push({_id: data.content._id});
    // render if we are on the SoundCloud playlist
    if(player.playlist.title == "SoundCloud"){
      // update the model data
      player.playlist = sc_plist;
      player.songs = player.song_collection.getByIds(player.playlist);
      player.queue_pool = player.songs.slice(0);
      player.genShufflePool();
      // redraw the songview
      MusicApp.router.songview.renderSong();
    }
  } else if(data.type == "skipped"){
    SCMessenger.update("Skipped song " + data.completed + ". Unable to read from SoundCloud");
  }
});
var ScanMessenger = null;
var ScanTemplate = "Scanned {{count}} out of {{completed}}{% if details %}: {{details}}{% endif %}";
socket.on('scan_update', function(data){
  console.log(data);
  if(ScanMessenger === null){
    ScanMessenger = Messenger().post(swig.render(ScanTemplate, {locals: data}));
  } else {
    ScanMessenger.update(swig.render(ScanTemplate, {locals: data}));
  }
});
