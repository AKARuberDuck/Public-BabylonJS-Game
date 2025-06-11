const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Fallback to index.html for unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// WebSocket logic
wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server + WebSocket running on port ${PORT}`);
});
