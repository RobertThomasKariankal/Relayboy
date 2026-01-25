const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map username -> ws
const clients = new Map();

function broadcastUsers() {
  const users = Array.from(clients.keys());
  const data = JSON.stringify({ type: "users", users });
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

wss.on("connection", (ws) => {
  let username = null;
  console.log("New client connected");

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === "register") {
        if (!msg.username || clients.has(msg.username)) {
          ws.send(JSON.stringify({ type: "error", message: "Username invalid or taken" }));
          return;
        }
        username = msg.username;
        clients.set(username, ws);
        console.log(`${username} connected`);
        broadcastUsers();
        return;
      }

      if (msg.type === "message") {
        const target = clients.get(msg.to);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            type: "message",
            from: username,
            message: msg.message,
            timestamp: new Date().toLocaleTimeString()
          }));
        }
      }
    } catch (err) {
      console.error("Invalid message", err);
    }
  });

  ws.on("close", () => {
    if (username) {
      clients.delete(username);
      console.log(`${username} disconnected`);
      broadcastUsers();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
