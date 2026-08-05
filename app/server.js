let express = require('express');
let bodyParser = require('body-parser');
let { MongoClient } = require('mongodb');  // Use MongoClient
let path = require('path');
let app = express();
let port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection setup
let uri = "mongodb://admin:password@localhost:27017";  // Use 'localhost' for local MongoDB
let client;
let db, usersCollection;

async function connectToMongo() {
  try {
    client = new MongoClient(uri);  // No need for deprecated options
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db('userProfiles');
    usersCollection = db.collection('users');
  } catch (err) {
    console.error("Failed to connect to MongoDB. Running without database connection.");
    usersCollection = null; // Set collection to null if the DB connection fails
  }
}

// Attempt to connect to MongoDB when the app starts
connectToMongo();

// Serve profile.html as the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});
// Fetch profile data, handle case where the database is not available
app.get('/get-profile', async (req, res) => {
  if (!usersCollection) {
    // If the database is unavailable, return default profile
    return res.json({
      name: "Anna Smith",
      email: "anna.smith@example.com",
      interests: "coding"
    });
  }

  let profile = await usersCollection.findOne();
  if (!profile) {
    profile = {
      name: "Anna Smith",
      email: "anna.smith@example.com",
      interests: "coding"
    };
  }
  res.json(profile);
});

// Handle profile updates, return error if the database is not available
app.post('/update-profile', async (req, res) => {
  let { name, email, interests } = req.body;

  if (!usersCollection) {
    return res.status(503).json({ message: 'Database is unavailable. Profile update failed.' });
  }

  // Create or update the user profile
  let result = await usersCollection.updateOne(
    { email },  // Find user by email
    { $set: { name, interests } },  // Update or insert fields
    { upsert: true }  // Insert if not found
  );

  console.log(`Profile updated for: ${email}`);
  res.json({ message: 'Profile updated successfully!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
