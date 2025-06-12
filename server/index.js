const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from /public
app.use(express.static(path.join(__dirname, "../public")));

// Fallback to index.html for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// WebSocket logic
wss.on("connection", (ws) => {
  console.log("✅ New WebSocket connection");

  ws.on("message", (msg) => {
    console.log("Message from client:", msg.toString());
    // You can choose to broadcast or respond here
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running at http://localhost:${PORT}`);
});
