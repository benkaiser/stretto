// soccet connection and events
var socket = io.connect('http://'+window.location.hostname+':2000');
socket.on('connect', function(){
  console.log('Socket connected');
  socket.emit('fetch_songs');
});
socket.on('songs', function(data){
  setSongs(data.songs);
});

var songs;
function setSongs(update_songs){
  songs = update_songs;
  console.log(songs);
  html = "";
  for(var i = 0; i < songs.length; i++){
    html += "<tr id='"+songs[i]['_id']+"'>";
    html += "<td>" + songs[i]['title'] + "</td>";
    html += "<td>" + songs[i]['artist'] + "</td>";
    html += "<td>" + songs[i]['album'] + "</td>";
    html += "</tr>";
  }
  $(".song_body").html(html);
  $(".song_body tr").click(function(e){
    id = $(e.target).parent().attr('id');
    playSong(id);
  });
}

function playSong(id){
  $(".audio_elem").html("<source src='/songs/"+id+"' type='audio/mpeg'>");
  $(".audio_elem").trigger("play")
}