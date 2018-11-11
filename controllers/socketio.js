module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('socket joined!' + socket.id);
    socket.on('joinRoom', (email) => {
      socket.join(email);
      socket._room = email;
    });

    socket.on('controllable', () => {

    });

    socket.on('playpause', () => {
      socket.to(socket._room).emit('playpause');
    });

    socket.on('previous', () => {
      socket.to(socket._room).emit('previous');
    });

    socket.on('next', () => {
      socket.to(socket._room).emit('next');
    });
  });
}