const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Set up SQLite database connection
const db = new sqlite3.Database('./user_data.db', (err) => {
  if (err) {
    console.error('Database opening error: ', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Basic route to check if the server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Set up the login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(400).json({ error: 'User not found' });
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Password comparison error' });
      }
      if (result) {
        return res.status(200).json({ message: 'Login successful' });
      } else {
        return res.status(400).json({ error: 'Incorrect password' });
      }
    });
  });
});

// Set up the registration route
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Password hashing error' });
    }

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      return res.status(201).json({ message: 'User registered' });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
