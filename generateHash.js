const bcrypt = require('bcrypt');

// Enter your password here
const password = 'password123'; // Example password for the test user

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Hashed Password:', hash);
  }
});
