const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  broadcast({ type: "players", count: clients.size });

  ws.on("close", () => {
    clients.delete(ws);
    broadcast({ type: "players", count: clients.size });
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  for (let ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server and WebSocket running on port ${PORT}`);
});
