// collections
var PlaylistCollection = Backbone.Collection.extend({});
var SongCollection = Backbone.Collection.extend({});
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
        playlists: a.playlist_collection.models,
        title: "This Server"
      }
    });
    left.render();
    right = new listView({
      el: $(".playlists_right")[0],
      model: {
        playlists: b.playlist_collection.models,
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
  console.log(left.getSelected());
  console.log(right.getSelected());
}

// the playlist view
listView = Backbone.View.extend({
  template: "#sync_template",
  render: function(){
    this.$el.html(render(this.template, {
      playlists: this.model.playlists,
      title: this.model.title
    }));
  },
  getSelected: function(){
    var selected = [];
    this.$el.find(':input').each(function(index){
      if($(this).is(':checked')){
        selected.push($(this).attr('id'));
      }
    });
    return selected;
  }
});

// utility functions
function render(template, data){
  return swig.render($(template).html(), {locals: data});
}
