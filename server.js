const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "relayboy_super_secret_key"; // In production, move to env vars

// Database Setup
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("Database opening error: ", err);
  else {
    console.log("Connected to SQLite database");
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT
    )`);
  }
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Auth Routes ---

// Signup
app.post("/api/signup", async (req, res) => {
  const { email, username, password } = req.body;
  console.log("Signup request:", { email, username });
  if (!email || !username || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, username, password) VALUES (?, ?, ?)", [email.trim().toLowerCase(), username.trim(), hashedPassword], function (err) {
      if (err) {
        console.error("Signup DB Error:", err);
        if (err.message.includes("users.email")) return res.status(400).json({ error: "Email already exists" });
        if (err.message.includes("users.username")) return res.status(400).json({ error: "Username already exists" });
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "User created successfully" });
    });
  } catch (err) {
    console.error("Signup Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login (Works with Username OR Email)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body; // 'username' here can be email or username
  const identifier = username.trim().toLowerCase();

  console.log("Login attempt:", identifier);

  db.get("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier], async (err, user) => {
    if (err) {
      console.error("Login DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!user) {
      console.log("User not found:", identifier);
      return res.status(400).json({ error: "User not found" });
    }

    try {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });
      res.json({ token, username: user.username });
    } catch (err) {
      console.error("Login Bcrypt Error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
});

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

wss.on("connection", (ws, req) => {
  let username = null;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === "register") {
        // Verify JWT token sent during registration
        jwt.verify(msg.token, SECRET_KEY, (err, decoded) => {
          if (err || decoded.username !== msg.username) {
            ws.send(JSON.stringify({ type: "error", message: "Unauthorized access" }));
            return;
          }

          if (clients.has(msg.username)) {
            ws.send(JSON.stringify({ type: "error", message: "Username already active" }));
            return;
          }

          username = msg.username;
          clients.set(username, ws);
          console.log(`${username} connected`);
          broadcastUsers();
        });
        return;
      }

      if (msg.type === "message") {
        if (!username) return; // Prevent messages from unauthenticated sockets
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
