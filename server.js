const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve client files
app.use(express.static(path.join(__dirname, "public")));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server on top of HTTP
const wss = new WebSocket.Server({ server });

const clients = new Map(); // username -> socket

wss.on("connection", (ws) => {
  let username = null;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);

      // Register username
      if (msg.type === "register") {
        username = msg.username;
        clients.set(username, ws);
        console.log(`${username} connected`);
        return;
      }

      // Relay message
      if (msg.type === "message") {
        const target = clients.get(msg.to);
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            from: username,
            message: msg.message
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
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
