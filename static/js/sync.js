// collections
var PlaylistCollection = Backbone.Collection.extend({
  getBy_Id: function(id){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes["_id"] == id){
        return this.models[i];
      }
    }
    return false;
  },
  getByTitle: function(title){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes.title == title){
        return this.models[i];
      }
    }
    return false;
  },
  comparator: function(playlist){
    return [playlist.get("editable"), playlist.get('title')];
  }
});
var SongCollection = Backbone.Collection.extend({
  findBy_Id: function(id){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes["_id"] == id){
        return this.models[i];
      }
    }
    return false;
  },
  findItem: function(item){
    for(var i = 0; i < this.models.length; i++){
      if(this.models[i].attributes["title"] == item.attributes["title"]
        && this.models[i].attributes["album"] == item.attributes["album"]
        && this.models[i].attributes["display_artist"] == item.attributes["display_artist"]){
        return this.models[i];
      }
    }
    return false;
  }
});
// soccet connection to player this was loaded from
var a = {
  socket: io.connect('http://'+window.location.host, {'force new connection': true }),
  song_collection: new SongCollection(),
  playlist_collection: new PlaylistCollection()
};
var b = {
  socket: null,
  song_collection: new SongCollection(),
  playlist_collection: new PlaylistCollection()
};
// check what items have been loaded
var needed = ['a', 'b'];
var fetched = [];
// checks that all the needed elements are in the fetched array
function allLoaded(inArr, needArr){
  for(var cnt = 0; cnt < needArr.length; cnt++){
    if(inArr.indexOf(needArr[cnt]) < 0){
      return false;
    }
  }
  return true;
}
// fetch the data for server a (this server)
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
  fetched.push('a');
  drawSync();
});
// when they click to connect, fetch the data for the remote server we are
// syncing with (server b)
$("#fetch_data").click(function(){
  bConnected();
});
function bConnected(){
  // save the setting
  var server_b_ip = $("#remote_b").val();
  localStorage.setItem('server_b_ip', server_b_ip);
  // connect
  b.socket = io.connect(server_b_ip, {'force new connection': true });
  b.socket.on('connect', function(){
    b.socket.emit('sync_page_connected');
    console.log("Socket_b connected");
  });
  b.socket.on('alldata', function(data){
    // reset the playlists
    b.playlist_collection.reset();
    b.playlist_collection.add(data.playlists);
    // reset the songs
    b.song_collection.reset();
    b.song_collection.add(data.songs);
    console.log("B recieved data");
    fetched.push('b');
    drawSync();
  });
}
$(document).ready(function(){
  // set the remote to the saved address
  var server_b_ip = localStorage.getItem('server_b_ip') || '';
  $("#remote_b").val(server_b_ip);
  if(server_b_ip.length > 0){
    bConnected();
  }
  // link up the button click
  $(".sync_btn").click(sync);
});

// setup the page on load of data
var left;
var right;
function drawSync(){
  if(allLoaded(fetched, needed)){
    // render the left and right panes
    left = new listView({
      el: $(".playlists_left")[0],
      model: {
        playlists: a.playlist_collection,
        title: "This Server"
      }
    });
    left.render();
    right = new listView({
      el: $(".playlists_right")[0],
      model: {
        playlists: b.playlist_collection,
        title: "Remote Server"
      }
    });
    right.render();
    // show the sync button
    $(".sync_div").css('visibility', 'visible');
  }
}

// sync the libraries
function sync(){
  var left_items = left.getSelected();
  var right_items = right.getSelected();

  if(left_items.length > 0){
    filter_out(left_items, a, b);
  }
  if(right_items.length > 0){
    filter_out(right_items, b, a);
  }
}

/* this function replaces the uids of songs that share the same title + artist
 * + album on the playlists that are being synced across. This allows for syncing
 * to be skipped for items that seem to be the same track.
 */
function filter_out(selected_lists, from, to){
  for(var list_cnt = 0; list_cnt < selected_lists.length; list_cnt++){
    for(var item_cnt = 0; item_cnt < selected_lists[list_cnt].songs.length; item_cnt++){
      // if the song is already in the library, set the correct _id
      var uid = selected_lists[list_cnt].songs[item_cnt]._id;
      var from_song = from.song_collection.findBy_Id(uid);
      var match = to.song_collection.findItem(from_song);
      if(match){
        selected_lists[list_cnt].songs[item_cnt]._id = match.attributes._id;
      }
    }
    // check if the playlist is a dupe, if so merge it
    var match = to.playlist_collection.getByTitle(selected_lists[list_cnt].title);
    if(match){
      selected_lists[list_cnt] = mergePlaylists(selected_lists[list_cnt], match.attributes);
    }
  }
}

// merge two playlists into one and return it
function mergePlaylists(list_one, list_two){
  for(var song_cnt = 0; song_cnt < list_two.songs.length; song_cnt++){
    // see if we can find the song in the first playlist
    var found = true;
    for(var inner_cnt = 0; inner_cnt < list_one.songs.length; inner_cnt++){
      
    }
    // if it isn't found, add it
    if(!found){

    }
  }
}

// the playlist view
listView = Backbone.View.extend({
  template: "#sync_template",
  render: function(){
    this.$el.html(render(this.template, {
      playlists: this.model.playlists.models,
      title: this.model.title
    }));
  },
  getSelected: function(){
    var selected = [];
    var self = this;
    this.$el.find(':input').each(function(index){
      if($(this).is(':checked')){
        // add the playlist by _id
        selected.push(self.model.playlists.getBy_Id($(this).attr('id').attributes));
      }
    });
    return selected;
  }
});

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}
