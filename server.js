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

// Hash existing passwords in the database (run this once)
db.all('SELECT * FROM users', [], (err, rows) => {
  if (err) {
    console.error(err.message);
    return;
  }

  rows.forEach((user) => {
    bcrypt.hash(user.password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return;
      }

      // Update the password in the database with the hashed password
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id], (err) => {
        if (err) {
          console.error('Error updating password in database:', err);
        } else {
          console.log(`Password for user ${user.username} has been updated.`);
        }
      });
    });
  });
});

// Serve the root page (/) and index.html regardless of login status
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
// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Fetch the user from the database
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking for existing username.' });
    }

    if (!row) {
      // If no user found, send error
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Compare the entered password with the stored hash
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        // Handle bcrypt comparison errors
        return res.status(500).json({ error: 'Error comparing passwords.' });
      }

      if (!result) {
        // If password doesn't match, return error
        return res.status(400).json({ error: 'Invalid username or password.' });
      }

      // Store the user ID in the session
      req.session.userId = row.id; // Store the user ID in the session

      // Redirect to the homepage after successful login
      res.redirect('/');  // Or wherever you'd like to redirect after successful login
    });
  });
});



// Handle logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }

    // Clear the session cookie (make sure it's the same name as the session cookie)
    res.clearCookie('connect.sid'); // 'connect.sid' is the default session cookie name.

    // Redirect to homepage or login page
    res.redirect('/');
  });
});


// Serve the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html')); // Correct path to signup.html
});

// Handle signup form submission
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking for existing username.' });
    }

    if (row) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password.' });
      }

      // Insert new user into the database with hashed password
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Error saving user to database.' });
        }

        // Log the user in by storing user ID in the session
        req.session.userId = this.lastID; // Store the user ID in the session

        // Redirect to the homepage after successful signup
        res.redirect('/');
      });
    });
  });
});

// Serve the forgot-password page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html')); // Correct path to forgot-password.html
});

// Handle forgot-password form submission
app.post('/forgot-password', (req, res) => {
  const { username } = req.body;

  // Check if the user exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking for username.' });
    }

    if (!row) {
      return res.status(400).json({ error: 'No user found with that username.' });
    }

    // Generate a password reset token (this is just an example, use a better mechanism in production)
    const resetToken = Math.random().toString(36).substr(2);

    // Normally, you would send this token to the user via email, but for now, we’ll just log it
    console.log('Password reset token for ${username}: ${resetToken}');

    // Here you would send an email with the reset token (not implemented)
    res.json({ message: 'Password reset link sent to your email.' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
