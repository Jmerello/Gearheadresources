
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session'); // Add this line for session support

const app = express();
const port = 3000;

// Use a secure session secret key
const sessionSecret = '6b7b1c3c16f53b9b1cda75be7b9903a0ed582f6d43d242bcf35d1f90d5d9c1c0'; // This is a securely generated string

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the root

// Session middleware
app.use(session({
  secret: sessionSecret, // Use the secure session key here
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // If you're not using HTTPS, keep this false
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

// Serve the root page (`/`) and `index.html` if the user is logged in
app.get('/', (req, res) => {
  if (req.session.userId) {
    // If user is logged in, serve the index page
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    // If not logged in, redirect to login
    res.redirect('/login');
  }
});

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

// Serve the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Serve the forgot password page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error checking for existing username.' });
      }

      if (row) {
        return res.status(400).json({ error: 'Username already exists. Please choose a different one or go to "forgot Password".' });
      }

      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user into the database
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error saving user. Please try again later.' });
        }

        res.json({ message: 'Account created successfully! Please log in.' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup.' });
  }
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

      // Redirect to the home page after successful login
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

    // Redirect to the login page after successful logout
    res.redirect('/login');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
