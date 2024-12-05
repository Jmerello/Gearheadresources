const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session'); // For session support

const app = express();
const port = 3000;

// Use a secure session secret key
const sessionSecret = 'your_secure_session_secret'; // Use a securely generated string

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the public folder

// Session middleware
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if you're using HTTPS
}));

// Connect to SQLite database
const db = new sqlite3.Database('./gearheadresources.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
  }
});

// Create users table if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)');

// Serve the root page (`/`) and `index.html` regardless of login status
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check if user is logged in
app.get('/check-login', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // Correct path to login.html
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Fetch the user from the database
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking for existing username.' });
    }

    if (!row) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Compare the entered password with the stored hash
    bcrypt.compare(password, row.password, (err, result) => {
      if (err || !result) {
        return res.status(400).json({ error: 'Invalid username or password.' });
      }

      // Store the user information in the session
      req.session.userId = row.id; // Store the user ID in the session (or any other user data you want)

      // Stay on the homepage after successful login (no redirect)
      res.redirect('/');
    });
  });
});

// Handle logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }

    // Stay on the homepage after successful logout (no redirect)
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
