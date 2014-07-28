// this file contains the models/collections in needed by the player

var PlaylistCollection = Backbone.Collection.extend({
  comparator: function(playlist){
    return [playlist.get("editable"), playlist.get('title')];
  },
  fetch: function(options){
    socket.emit('fetch_playlists');
  },
  getByName: function(name){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes.title == name){
        return this.models[i].attributes;
      }
    }
    return -1;
  },
  getBy_Id: function(id){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes._id == id){
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
      if(this.models[i].attributes._id == id){
        return this.models[i];
      }
    }
    return 0;
  },
  getByIds: function(playlist){
    if(playlist !== undefined && playlist.songs !== undefined){
      songs = [];
      for(var i = 0; i < playlist.songs.length; i++){
        var song = this.findBy_Id(playlist.songs[i]._id);
        if(song){
          // set the index in the playlist
          song.attributes.index = i+1;
          songs.push(song);
        }
      }
      return songs;
    }
    return;
  }
});
