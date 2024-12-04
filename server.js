const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // To parse form data

// Connect to SQLite database
const db = new sqlite3.Database('./gearheadresources.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});

// Serve the login page
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
      return res.status(400).send('Username already taken. Please choose a different one.');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).send('Error hashing password.');
      }

      // Insert the user into the database
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
        if (err) {
          return res.status(500).send('Error saving user.');
        }

        res.send('Account created successfully! Please <a href="/login">log in</a>.');
      });
    });
  });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
