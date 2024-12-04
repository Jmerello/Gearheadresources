const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database('./gearheadresources.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Make sure index.html is in the root directory
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
