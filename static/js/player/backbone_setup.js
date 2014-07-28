// setup the backbone app and router
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
  settingbar: null,
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
    // block for when this function is called on page load
    if(player.songs === undefined){
      return;
    }
    // if they haven't selected a queue yet, make this playlist the queue
    // this is used when they are loading a page and haven't clicked a song yet
    if(player.queue_pool.length === 0){
      player.queue_pool = player.songs.slice(0);
      player.genShufflePool();
    }
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
    this.settingbar = new SettingsBarView();
    MusicApp.settingBarRegion.show(this.settingbar);
  }
});

MusicApp.addInitializer(function(options){
  this.router = new MusicAppRouter();
  // setup the settings bar section
  MusicApp.router.settingsbar();
  // load the history api
  Backbone.history.start({pushState: false});
});
