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
    SCMessenger = Messenger().post("Starting download from SoundCloud of " + data.count + " tracks" + (not_streamable > 0 ? " (" + data.not_streamable + " not streamable)" : ""));
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
    var sc_plist = player.playlist_collection.getByTitle("SoundCloud").attributes;
    sc_plist.songs.push({_id: data.content._id});
    // render if we are on the SoundCloud playlist
    if(player.playlist.title == "SoundCloud"){
      // update the model data
      player.playlist = sc_plist;
      player.songs = player.song_collection.getByIds(player.playlist);
      player.queue_pool = player.songs.slice(0);
      player.genShufflePool();
      redrawSongsChangedModel();
    }
  } else if(data.type == "skipped"){
    SCMessenger.update("Skipped song " + data.completed + ". Unable to read from SoundCloud");
  } else if(data.type == "error"){
    SCMessenger.update("Soundcloud track already exists");
  }
});
var YTMessenger = null;
socket.on('yt_update', function(data){
  console.log(data);
  if(data.type == "started"){
    YTMessenger = Messenger().post("Starting download from Youtube");
  } else if(data.type == "added") {
    player.song_collection.add(data.content);
    YTMessenger.update("Added " + data.content.title);
    var yt_plist = player.playlist_collection.getByTitle("Youtube").attributes;
    yt_plist.songs.push({_id: data.content._id});
    if(player.playlist.title == "Youtube"){
      player.playlist = yt_plist;
      player.songs = player.song_collection.getByIds(player.playlist);
      player.queue_pool = player.songs.slice(0);
      player.genShufflePool();
      redrawSongsChangedModel();
    }
  } else if(data.type == "error") {
    if(YTMessenger !== null) {
      YTMessenger.update(data.content);
    } else {
      YTMessenger = Messenger().post(data.content);
    }
  }
});
var SongMessenger = null;
socket.on('song_update', function(data){
  console.log("Updating song info");
  console.log(data);
  // iterate over tracks and update them
  for(var x = 0; x < data.length; x++){
    // remove the track
    player.song_collection.remove(player.song_collection.where({_id: data[x]._id}));
    // add the track
    player.song_collection.add(data[x]);
  }
  // regenerate the list of current songs
  player.songs = player.song_collection.getByIds(player.playlist);
  player.queue_pool = player.songs.slice(0);
  player.genShufflePool();
  // redraw the view
  redrawSongsChangedModel();
  // redraw info view
  redrawInfoView();
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
// remote controll events
var CommandMessenger = null;
var CommandTemplate = "Received command '{{command}}'.";
socket.on('command', function(data){
  var command = data.command;
  // show command
  if(CommandMessenger === null){
    CommandMessenger = Messenger().post(swig.render(CommandTemplate, {locals: data}));
  } else {
    CommandMessenger.update(swig.render(CommandTemplate, {locals: data}));
  }
  // run command
  switch(command){
    case 'next':
      player.nextTrack();
      break;
    case 'prev':
      player.prevTrack();
      break;
    case 'playpause':
      player.togglePlayState();
      break;
    case 'playpause':
      player.prevTrack();
      break;
    default:
      break;
  }
});

function redrawSongsChangedModel(){
  var sv = MusicApp.router.songview.render();
}

function redrawInfoView(){
  MusicApp.infoRegion.currentView.render();
}
