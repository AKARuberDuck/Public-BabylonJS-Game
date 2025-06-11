const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let clients = [];

server.on('connection', socket => {
  clients.push(socket);
  socket.send(JSON.stringify({ message: "Welcome to the game lobby!" }));

  socket.on('message', data => {
    clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  socket.on('close', () => {
    clients = clients.filter(c => c !== socket);
  });
});
