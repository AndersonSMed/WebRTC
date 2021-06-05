const express = require('express');
const app = express();
const http = require('http').Server(app);

const io = require('socket.io')(http);

app.use(express.static('public'));

http.listen(3000, () => {
  console.log('listening on 3000');
});

io.on('connection', socket => {
  console.log('a user connected');

  socket.on('create or join', room => {
    console.log('create or join to room', room);
    const myRoom = io.sockets.adapter.rooms.get(room) || { size: 0 };
    const numClients = myRoom.size;
    console.log(room, 'has', numClients, 'clients');

    if (numClients == 0) {
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients === 1) {
      socket.join(room);
      socket.emit('joined', room);
    } else {
      socket.emit('full', room);
    }

  });

  socket.on('ready', room => {
    console.log('ready');
    socket.broadcast.to(room).emit('ready');
  });

  socket.on('candidate', event => {
    console.log('candidate');
    socket.broadcast.to(event.room).emit('candidate', event);
  });

  socket.on('offer', event => {
    console.log('offer');
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  });

  socket.on('answer', event => {
    console.log('answer');
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  });
});
