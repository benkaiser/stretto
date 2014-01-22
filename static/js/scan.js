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
  $(".scan_details").html(data.details);
});

var on = false;
$("#start_scan").click(function(){
  if(on){
    socket.emit('stop_scan');
    $(this).text("Start Scan");
  } else {
    socket.emit('start_scan');
    $(this).text("Stop Scan");
  }
  on = !on;
});
$("#start_scan_hard").click(function(){
  if(on){
    socket.emit('stop_scan');
    $(this).text("Hard Scan (recheck all songs)");
  } else {
    socket.emit('start_scan_hard');
    $(this).text("Stop Hard Scan");
  }
  on = !on;
});