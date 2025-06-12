const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from ../public
app.use(express.static(path.join(__dirname, "../public")));

// Catch-all: serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// WebSocket player count
let clients = new Set();
wss.on("connection", (ws) => {
  clients.add(ws);
  broadcast({ type: "players", count: clients.size });

  ws.on("close", () => {
    clients.delete(ws);
    broadcast({ type: "players", count: clients.size });
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
