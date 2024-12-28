const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const axios = require("axios");

const app = express();
 
// JWT Configuration
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable
const JWT_EXPIRES_IN = '1h'; // Token expires in 1 hour

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB setup
mongoose.connect(
  "mongodb+srv://shahsidharth96:shahsid@cluster0.paj7h.mongodb.net/cluster0?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  sessionToken: { type: String },
});

const User = mongoose.model("User", userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token expired or invalid' });
    }
    req.user = user;
    next();
  });
};

// Insert hardcoded credentials (only once)
const insertHardcodedCredentials = async () => {
  try {
    const userExists = await User.findOne({ email: "Sid96@gmail.com" });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash("Sid@123", 10);
      const newUser = new User({
        email: "Sid96@gmail.com",
        password: hashedPassword,
      });
      await newUser.save();
      console.log("Hardcoded user credentials inserted.");
    } else {
      console.log("User already exists, skipping insert.");
    }
  } catch (err) {
    console.error("Error managing hardcoded user:", err);
  }
};

// Initialize hardcoded credentials
insertHardcodedCredentials();

// Email Validation Endpoint
app.post("/login/email", async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({ 
        message: "Email is valid, please enter your password."
      });
    } else {
      return res.status(400).json({ 
        message: "Invalid email address" 
      });
    }
  } catch (error) {
    console.error('Email validation error:', error);
    return res.status(500).json({ 
      message: "Server error during email validation" 
    });
  }
});

// Password Validation and Login Endpoint
app.post("/login/password", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        // Update user's last login and session token
        user.lastLogin = new Date();
        user.sessionToken = token;
        await user.save();

        return res.status(200).json({
          message: "Login successful",
          token,
          expiresIn: 3600 // 1 hour in seconds
        });
      }
    }
    
    return res.status(400).json({ 
      message: "Invalid email or password" 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: "Server error during login" 
    });
  }
});

// Protected Profile Route
app.get("/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      email: user.email,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

// Logout Endpoint
app.post("/logout", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.sessionToken = null;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Error during logout" });
  }
});

app.post("/git/commit-summary", async (req, res) => {
  const { repositoryUrl } = req.body;

  if (!repositoryUrl) {
    return res.status(400).json({ message: "Repository URL is required" });
  }

  const [owner, repo] = repositoryUrl.split("/").slice(-2);

  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      headers: {
        "Authorization": `Github Token`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    const commits = response.data.map(commit => ({
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date
    }));

    return res.status(200).json(commits);
  } catch (error) {
    console.error("Error fetching commit summaries:", error.response ? error.response.data : error.message);
    return res.status(500).json({ message: "Failed to fetch commit summaries", error: error.response ? error.response.data : error.message });
  }
});

// Session Check Endpoint
app.get("/check-session", authenticateToken, (req, res) => {
  res.json({ valid: true });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
