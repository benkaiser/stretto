// main player class that is used by the player object to control the playing of songs

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
  this.searchText = "";
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
    setInterval(function(){ player.update(); }, 50);
    $(this.names.playpause).click(function(){ player.togglePlayState(); });
    $(this.names.next).click(function(){ player.nextTrack(); });
    $(this.names.prev).click(function(){ player.prevTrack(); });
    $(this.names.repeat).click(function(){ player.toggleRepeat(); });
    $(this.names.shuffle).click(function(){ player.toggleShuffle(); });
    this.current_src = $("#current_src");
    this.fade_src = $("#fade_src");
    this.current_track.addEventListener('ended', function(){ player.trackEnded(); });
    this.current_track.addEventListener('durationchange', function(){ player.durationChanged(); });
    this.shuffle_state = localStorage.getItem('shuffle') || false;
    this.redrawShuffle();
    this.repeat_state = localStorage.getItem('repeat') || this.repeat_states.all;
    this.redrawRepeat();
    this.comp_name = localStorage.getItem('comp_name') || '';
    this.onMobile = on_mobile;
    socket.emit('set_comp_name', {name: this.comp_name});
  };
  this.setupCollections = function(){
    this.song_collection = new SongCollection();
    this.playlist_collection = new PlaylistCollection();
    this.song_collection.fetch();
    this.playlist_collection.fetch();
  };
  this.update = function(){
    if(this.is_playing && !this.isSeeking){
      this.scrub.slider('setValue', this.current_track.currentTime / this.current_track.duration * 100.0, false);
      var seconds = prettyPrintSeconds(this.current_track.currentTime);
      $(".current_time").html(seconds);
      localStorage.setItem('currentTime', this.current_track.currentTime);
    }
  };
  this.findSongIndex = function(id){
    for (var i = 0; i < this.queue_pool.length; i++) {
      if(id == this.queue_pool[i].attributes._id){
        return i;
      }
    }
    // fallback to all songs
    return null;
  };
  this.updateSearch = function(searchText){
    MusicApp.router.navigate("search/"+encodeURIComponent(searchText), true);
  };
  this.searchItems = function(searchText){
    this.searchText = searchText;
    if(searchText.length < 3){
      return;
    }
    // set the search box to the search text if it isn't focuessed
    if($(".search-input:focus").size() === 0){
      $(".search-input").val(searchText);
    }
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
    // used for if they load the browser with a search page
    if(this.queue_pool.length === 0){
      this.queue_pool = this.songs.slice(0);
      this.genShufflePool();
    }
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
  };
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
  };
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
  };

  // sort the songs again (for when the underlying data has changed)
  this.resortSongs = function() {
    // perform the sort
    player.songs.sort(this.songSortFunc);
  };

  // function to perform the sort based on current sorting attributes
  this.songSortFunc = function(a, b){
    a = a.attributes;
    b = b.attributes;
    switch(player.sort_col){
      case 'album':
        return sortAlbums(a,b);
      case 'title':
        return sortTitle(a,b)
      case 'display_artist':
        if(a.display_artist.toLowerCase() > b.display_artist.toLowerCase()){
          return (player.sort_asc) ? 1 : -1;
        }else if(a.display_artist.toLowerCase() < b.display_artist.toLowerCase()){
          return (player.sort_asc) ? -1 : 1;
        }
        return sortAlbums(a,b);
      case 'play_count':
        if(a.play_count > b.play_count){
          return (player.sort_asc) ? 1 : -1;
        }else if(a.play_count < b.play_count){
          return (player.sort_asc) ? -1 : 1;
        }
        return sortTitle(a,b);
      case 'date_added':
        if(a.date_added > b.date_added){
          return (player.sort_asc) ? 1 : -1;
        }else if(a.date_added < b.date_added){
          return (player.sort_asc) ? -1 : 1;
        }else
          return sortAlbums(a,b);
      case 'duration':
        if(a.duration > b.duration){
          return (player.sort_asc) ? 1 : -1;
        }else if(a.duration < b.duration){
          return (player.sort_asc) ? -1 : 1;
        }
        return sortTitle(a,b);
    }
    return 0;
    // sort functions
    function sortTitle(a,b){
      if(a.title.toLowerCase() > b.title.toLowerCase()){
        return (player.sort_asc) ? 1 : -1;
      }else if(a.title.toLowerCase() < b.title.toLowerCase()){
        return(player.sort_asc) ? -1 : 1;
      }
      return  sortAlbums(a,b);
    }

    function sortInsideAlbum(a,b){
      if(a.discnr > b.discnr){
        return (player.sort_asc) ? 1 : -1;
      }else if(a.discnr < b.discnr){
        return (player.sort_asc) ? -1 : 1;
      }
      if(a.tracknr > b.tracknr){
        return (player.sort_asc) ? 1 : -1;
      }else if (a.tracknr < b.tracknr) {
        return (player.sort_asc) ? -1 : 1;
      }
      return 0;
    }

    function sortAlbums(a,b){
      if(a.album.toLowerCase() > b.album.toLowerCase()){
        return (player.sort_asc) ? 1 : -1;
      }else if(a.album.toLowerCase() < b.album.toLowerCase()){
        return (player.sort_asc) ? -1 : 1;
      }
      return sortInsideAlbum(a,b);
    }
  };
  this.durationChanged = function(){
    var seconds = prettyPrintSeconds(this.current_track.duration);
    $(".duration").html(seconds);
  };
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
  };
  this.playSong = function(id, force_restart){
    // remove the last playing song from the selection
    delFromSelection(this.playing_id);
    addToSelection(id, false);
    // set the current song
    var index_in_queue = this.findSongIndex(id);
    if(index_in_queue === null){
      // song was played from outside the current queue, get it by id
      this.current_index = 0;
      this.current_song = this.song_collection.findBy_Id(id);
    } else {
      // song played was in the current queue, fetch the info from the queue
      this.current_index = index_in_queue;
      this.current_song = this.queue_pool[this.current_index];
    }
    // skip resetting the song if it's the same song playing and we don't need to force restart
    if(id == this.playing_id && !force_restart){
      return;
    } else {
      this.playing_id = id;
      localStorage.setItem('last_playing_id', id);
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
    // update the cover photo if it's showing fullscreen and the new song has cover art
    if(cover_is_visible && cover_is_current && this.current_song.attributes.cover_location){
      showCover("/cover/" + this.current_song.attributes.cover_location);
    }
    // send a song change notification to the desktop:
    if ("Notification" in window) {
      var showNotifiaction = function(){
        // build the notification data
        var notifTitle = "Playing: " + this.current_song.attributes.title;
        var notifOptions = {
          dir: "auto",
          body: "Album: " + this.current_song.attributes.album + "\nArtist: " + this.current_song.attributes.display_artist,
          icon: "/cover/" + this.current_song.attributes.cover_location
        };
        if(this.lastNotificationTimeout){
          clearTimeout(this.lastNotificationTimeout);
          this.lastNotification.close();
        }
        // show the notifiaction
        try {
          this.lastNotification = new Notification(notifTitle, notifOptions);
          // close the notification after a timeout
          this.lastNotificationTimeout = setTimeout(this.lastNotification.close.bind(this.lastNotification), 4321);
        } catch(exception) {
          console.log("Error using old notification style on device.");
        }
      };
      // check if we have permission, if not, ask for it
      if (Notification.permission === "granted") {
        showNotifiaction.bind(this)();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          if(permission === "granted"){
            showNotifiaction().bind(this)();
          }
        });
      }
    }
  };
  this.setIsPlaying = function(isPlaying){
    this.is_playing = isPlaying;
    localStorage.setItem('last_play_state', isPlaying);
    $(this.names.playpause).removeClass("fa-play fa-pause");
    if(this.is_playing){
      $(this.names.playpause).addClass("fa-pause");
    } else {
      $(this.names.playpause).addClass("fa-play");
    }
  };
  this.togglePlayState = function(){
    if(this.is_playing){
      current_track.pause();
    } else {
      current_track.play();
    }
    this.setIsPlaying(!this.is_playing);
  };
  this.toggleShuffle = function(){
    // toggle and save the value
    this.shuffle_state = !this.shuffle_state;
    localStorage.setItem('shuffle', this.shuffle_state);
    this.redrawShuffle();
    // if we are viewing the queue, retrigger route
    if(this.playlist._id == "QUEUE"){
      MusicApp.router.playlist("QUEUE");
    }
  };
  this.redrawShuffle = function(){
    // change the dom
    if(this.shuffle_state){
      $(this.names.shuffle).addClass('blue');
    } else {
      $(this.names.shuffle).removeClass('blue');
    }
  };
  this.toggleRepeat = function(){
    // change the state and save the value
    this.repeat_state = (this.repeat_state+1)%3;
    localStorage.setItem('repeat', this.repeat_state);
    this.redrawRepeat();
  };
  this.redrawRepeat = function(){
    $(this.names.repeat).addClass("blue");
    $(this.names.repeat_badge).addClass("hidden");
    if(this.repeat_state == this.repeat_states.one){
      $(this.names.repeat_badge).removeClass("hidden");
    } else if(this.repeat_state == this.repeat_states.none) {
      $(this.names.repeat).removeClass("blue");
    }
  };
  this.genShufflePool = function(){
    if(player.queue_pool.length > 1){
      // create the shuffle pool, remove the current track, shuffle it and place
      // the current track at the start. This creates a correct shuffle.
      player.shuffle_pool = player.queue_pool.slice(0);
      // remove the current song
      var current_song = player.shuffle_pool.splice(player.current_index, 1);
      // shuffle the array
      player.shuffle_pool = shuffle_array(player.shuffle_pool);
      // re-add the current song at the start
      player.shuffle_pool.unshift(current_song[0]);
      // set the shuffle idx at the snog after this one
      player.shuffle_idx = 1;
    } else {
      player.shuffle_pool = player.queue_pool.slice(0);
      player.shuffle_idx = 0;
    }
    if(player.playlist && player.playlist._id == "QUEUE"){
      player.songs = player.shuffle_pool;
      if(MusicApp.router.songview){
        MusicApp.router.songview.render();
      }
    }
  };
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
        index = this.current_index+1;
        if(index == this.queue_pool.length){
          index = 0;
        }
        // add the song to the history
        this.play_history.unshift(this.queue_pool[index].attributes._id);
        this.playSong(this.queue_pool[index].attributes._id, true);
      }
    }
  };
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
  };
  this.setScubElem = function(elem){
    this.scrub = elem;
    this.scrub.slider()
      /* disable seeking as soon as slide / click starts.
      * this was added due to an issue causing the slider to update to the old
      * duration even when a click was triggered because of the delay for the
      * slideStop
      */
      .on('slideStart', function(){ player.isSeeking = true; })
      .on('slide', function(slideEvt){ player.scrub_value = slideEvt.value; player.scrubTimeout(); })
      .on('slideStop', function(slideEvt){ player.scrub_value = slideEvt.value; player.scrubTimeoutComplete(); });
  };
  this.setVolElem = function(elem){
    this.vol = elem;
    this.vol.slider()
      .on('slide', function(){ player.setVolume(player.vol.slider('getValue')); });
  };
  this.setVolume = function(value){
    this.current_track.volume = value / 100.00;
  };
  this.scrubTimeout = function(){
    if(this.scrubberTimeout !== null){
      clearTimeout(this.scrubberTimeout);
    }
    this.scrubberTimeout = setTimeout(function(){ player.scrubTimeoutComplete(); }, 1000);
    this.isSeeking = true;
    // update the time to show the current scrub value
    var seconds = prettyPrintSeconds(this.current_track.duration * this.scrub_value / 100.00);
    $(".current_time").html(seconds);
  };
  this.scrubTimeoutComplete = function(){
    clearTimeout(this.scrubberTimeout);
    this.isSeeking = false;
    this.scrubTo(this.scrub_value);
  };
  // scrub to percentage in current track
  this.scrubTo = function(value){
    var length = this.current_track.duration;
    this.seekTo(length * value / 100.00);
  };
  // seek to specific time in track
  this.seekTo = function(value){
    this.current_track.currentTime = value;
  };
  this.setCompName = function(name){
    // update the local data
    this.comp_name = name;
    localStorage.setItem('comp_name', this.comp_name);
    // update the name with the server
    socket.emit('set_comp_name', {name: this.comp_name});
  };
}
var player = new PlayState();
player.init();
player.setupCollections();
