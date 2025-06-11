const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let players = new Set();

server.on('connection', socket => {
  players.add(socket);
  broadcastPlayerCount();

  socket.on('message', data => {
    broadcast(data, socket);
  });

  socket.on('close', () => {
    players.delete(socket);
    broadcastPlayerCount();
  });
});

function broadcastPlayerCount() {
  const message = JSON.stringify({ type: 'players', count: players.size });
  for (let p of players) {
    if (p.readyState === WebSocket.OPEN) p.send(message);
  }
}

function broadcast(data, exclude) {
  for (let p of players) {
    if (p !== exclude && p.readyState === WebSocket.OPEN) p.send(data);
  }
}
