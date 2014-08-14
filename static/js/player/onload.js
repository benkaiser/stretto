$(document).ready(function(){
  player.setScubElem($("#scrub_bar"));
  $("body").keydown(function(event){
    // don't fire the controls if the user is editing an input
    if(event.target.localName == 'input'){
      return;
    }
    switch(event.which){
      case 32: // space key
        player.togglePlayState();
        event.preventDefault();
        break;
      case 39: // right key
        player.nextTrack();
        event.preventDefault();
        break;
      case 37: // left key
        player.prevTrack();
        event.preventDefault();
        break;
      case 38: // up key
        MusicApp.router.songview.moveSelection("up");
        event.preventDefault();
        break;
      case 40: // down key
        MusicApp.router.songview.moveSelection("down");
        event.preventDefault();
        break;
      case 13: // enter key
        // play the last selected item
        player.playSong(lastSelection);
        // add it to the history and reset the history
        player.play_history.unshift(lastSelection);
        player.play_history_idx = 0;
    }
  });
  // disable the options on scroll
  $("#content").scroll(hideOptions);
  // add click handler on menu items
  $("#soundcloud_fetch").click(function(){
    bootbox.prompt({
      title: "Enter the SoundCloud URL",
      callback: function(result){
        if (result !== null) {
          socket.emit("soundcloud_download", {url: result});
        }
      }
    });
  });
  $("#youtube_fetch").click(function(){
    bootbox.prompt({
      title: "Enter the Youtube URL",
      callback: function(result){
        if (result !== null) {
          socket.emit("youtube_download", {url: result});
        }
      }
    });
  });
  // scan library handlers
  $("#soft_scan").click(function(){
    socket.emit('start_scan');
  });
  $("#hard_scan").click(function(){
    socket.emit('start_scan_hard');
  });
  // sync button handlers
  $("#load_sync_view").click(function(){
    MusicApp.router.syncview = new SyncView();
    MusicApp.contentRegion.show(MusicApp.router.syncview);
  });
  // setup messenger
  Messenger.options = {
      extraClasses: 'messenger-fixed messenger-on-top',
      theme: 'air'
  };
});
