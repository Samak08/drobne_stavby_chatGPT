const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'replace_this_with_a_real_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// DB
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    text_field TEXT,
    checkbox INTEGER,
    select_box TEXT,
    phone TEXT,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Utility: auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'not_authenticated' });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing_fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hash, function (err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'user_exists' });
        return res.status(500).json({ error: 'db_error' });
      }
      req.session.userId = this.lastID;
      req.session.username = username;
      return res.json({ ok: true });
    });
    stmt.finalize();
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
});

// API: login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing_fields' });

  db.get('SELECT id, password FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!row) return res.status(401).json({ error: 'invalid_credentials' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'invalid_credentials' });

    req.session.userId = row.id;
    req.session.username = username;
    return res.json({ ok: true });
  });
});

// API: logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'logout_failed' });
    res.clearCookie('connect.sid');
    return res.json({ ok: true });
  });
});

// API: get current user
app.get('/api/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ id: req.session.userId, username: req.session.username });
  }
  return res.json({ id: null });
});

// API: submit order
app.post('/api/orders', requireAuth, (req, res) => {
  const { text_field, checkbox, select_box, phone, latitude, longitude } = req.body;
  if (!text_field || typeof checkbox === 'undefined' || !select_box || !phone || !latitude || !longitude) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const stmt = db.prepare(`INSERT INTO orders (user_id, text_field, checkbox, select_box, phone, latitude, longitude)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`);

  stmt.run(req.session.userId, text_field, checkbox ? 1 : 0, select_box, phone, latitude, longitude, function (err) {
    if (err) return res.status(500).json({ error: 'db_error' });
    const orderId = this.lastID;
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err2, row) => {
      if (err2) return res.status(500).json({ error: 'db_error' });
      return res.json({ ok: true, order: row });
    });
  });
  stmt.finalize();
});

// API: get all orders for user
app.get('/api/orders', requireAuth, (req, res) => {
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    return res.json({ orders: rows });
  });
});

// Serve form and other static html directly from /public
app.get('/form', (req, res) => res.sendFile(path.join(__dirname, 'public', 'form.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, 'public', 'order.html')));

// Start
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
