const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // To parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the root

// Connect to SQLite database
const db = new sqlite3.Database('./gearheadresources.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
  }
});

// Redirect root ('/') to '/login'
app.get('/', (req, res) => {
  res.redirect('/login'); // Redirect to login page
});

// Serve the login page when visiting '/login'
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

// Serve the forgot password page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'forgot-password.html'));
});

// Handle signup form submission
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error checking for existing username.');
    }

    if (row) {
      // Username already exists
      return res.status(400).send('Username already exists. Please choose a different one or go to "forgot Password".');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).send('Error hashing password.');
      }

      // Insert the user into the database
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
        if (err) {
          return res.status(500).send('Error saving user. Please try again later.');
        }

        res.send('Account created successfully! Please <a href="/login">log in</a>.');
      });
    });
  });
});

// Handle forgot password form submission
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Placeholder: Logic to handle password reset
  // In a real-world scenario, you would generate a token and send a reset email.
  res.send(`Password reset instructions sent to ${email}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
