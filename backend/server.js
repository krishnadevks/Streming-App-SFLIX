const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Path to service account key
const videoRoutes = require("./routes/videoRoutes");
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sflixs-72295-default-rtdb.firebaseio.com",
  });
} else {
  admin.app();
}

const app = express();
const db = admin.firestore(); // Initialize Firestore

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/video", videoRoutes(db)); // Pass Firestore instance
app.use("/api/v1", subscriptionRoutes);
app.use(videoRoutes(db));

// Fallback route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
