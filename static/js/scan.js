// soccet connection and events
var socket = io.connect('http://'+window.location.hostname+':2000');
socket.on('connect', function(){
  socket.emit('scan_page_connected');
  console.log("Socket connected");
});
socket.on('update', function(data){
  console.log(data);
  var progress = data.completed / data.count * 100.00;
  $(".progress-bar").css('width', progress + '%');
});

$("#start_scan").click(function(){
  socket.emit('start_scan');
});