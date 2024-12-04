const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the root

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

// Redirect root ('/') to '/login'
app.get('/', (req, res) => {
  res.redirect('/login'); // Redirect to login page
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

      // Redirect to the home page after successful login
      res.redirect('index'); // Change '/home' to whatever route you use for the home page
    });
  });
});

// Serve the home page
app.get('index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));  // Serve your actual home page HTML file
});

// Handle forgot password form submission (Placeholder)
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  res.send(`Password reset instructions sent to ${email}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }

    res.redirect('/login');
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
