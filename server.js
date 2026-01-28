import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import session from "express-session";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple user store (JSON file)
const USERS_FILE = path.join(__dirname, "users.json");
function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessionParser = session({
  saveUninitialized: false,
  secret: "relayboy_secret_change_me",
  resave: false
});
app.use(sessionParser);

// Serve public assets
app.use('/static', express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/chat', (req, res) => {
  if (!req.session || !req.session.authenticated) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- UPDATED REGISTER ROUTE --------------------
app.post('/register', (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });

  const users = loadUsers();

  // ensure unique email and username
  for (const u in users) {
    if (users[u].email === email) return res.status(400).json({ error: 'Email taken' });
    if (users[u].username === username) return res.status(400).json({ error: 'Username taken' });
  }

  const hashed = bcrypt.hashSync(password, 10);

  // New structured user object
  const userId = username; // keep username as key
  users[userId] = {
    username,
    email,
    password_hash: hashed,
    created_at: new Date().toISOString(),
    last_login: null,
    is_verified: false
  };

  saveUsers(users);

  req.session.authenticated = true;
  req.session.username = username;
  res.json({ ok: true });
});

// -------------------- UPDATED LOGIN ROUTE --------------------
app.post('/login', (req, res) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing fields' });

  const users = loadUsers();

  // Find by username or email
  let found = null;
  for (const u in users) {
    if (u === emailOrUsername || users[u].email === emailOrUsername) {
      found = users[u];
      break;
    }
  }

  if (!found) return res.status(400).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, found.password_hash)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // update last_login
  found.last_login = new Date().toISOString();
  saveUsers(users);

  req.session.authenticated = true;
  req.session.username = found.username;
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// -------------------- WebSocket --------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Map username -> ws
const clients = new Map();

function broadcastUsers() {
  const users = Array.from(clients.keys());
  const data = JSON.stringify({ type: "users", users });
  for (const ws of clients.values()) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(data);
    }
  }
}

server.on('upgrade', (req, socket, head) => {
  sessionParser(req, {}, () => {
    if (!req.session || !req.session.authenticated) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
});

wss.on('connection', (ws, req) => {
  const username = req.session.username;
  if (!username) {
    ws.close();
    return;
  }
  console.log(`${username} connected via websocket`);
  clients.set(username, ws);

  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'connected', username }));
  }

  broadcastUsers();

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'message') {
        const target = clients.get(msg.to);
        if (target && target.readyState === 1) {
          target.send(JSON.stringify({ type: 'message', from: username, message: msg.message, timestamp: new Date().toLocaleTimeString() }));
        }
      }
    } catch (err) {
      console.error('Invalid message', err);
    }
  });

  ws.on('close', () => {
    clients.delete(username);
    console.log(`${username} disconnected`);
    broadcastUsers();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
