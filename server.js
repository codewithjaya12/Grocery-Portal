
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Ensure MONGO_URI is set
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not set. Create a .env file with MONGO_URI=<your connection string>");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });


const User = require('./models/User');


const loginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  ip: { type: String }, // optional
});

const Login = mongoose.model("Login", loginSchema);

// ======================================
// 🚀 Routes
// ======================================

// Test Route
app.get("/", (req, res) => {
  res.send("🛒 Grocery Backend Running...");
});

// -------------------------------
// 📝 Signup Route (Updated)
// -------------------------------
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(req.body);
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    console.log(`✅ New user created: ${email}`);
    res.status(201).json({ message: "✅ User registered successfully" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: err.message || "Server error during signup" });
  }
});

// -------------------------------
// 🔑 Login Route
// -------------------------------
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    // Save login record (don't store password)
    try {
      await Login.create({ email, ip: req.ip });
      console.log(`✅ Login recorded for ${email}`);
    } catch (logErr) {
      console.warn("⚠️ Could not save login record:", logErr.message);
      // not fatal for login flow
    }

    res.status(200).json({
      message: "✅ Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin },
      loginTime: new Date(),
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// -------------------------------
// 🧾 Dashboard Route (Fetch Login History)
// -------------------------------
app.get("/auth/dashboard/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const records = await Login.find({ email }).sort({ loginTime: -1 });

    if (!records || records.length === 0) {
      return res.status(200).json({
        message: "No login records found",
        loginHistory: [],
      });
    }

    res.status(200).json({
      message: "✅ Login history fetched successfully",
      loginHistory: records,
    });
  } catch (err) {
    console.error("❌ Dashboard Fetch Error:", err);
    res.status(500).json({ message: "Server error fetching login history" });
  }
});


// ======================================
// 🚀 Start Server
// ======================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// -------------------------------
// Mount modular routes (products, users, orders, admin)
// -------------------------------
try {
  const productRoutes = require('./routes/productRoutes');
  const userRoutes = require('./routes/userRoutes');
  const orderRoutes = require('./routes/orderRoutes');
  const adminRoutes = require('./routes/adimnRoutes');

  app.use('/products', productRoutes);
  app.use('/user', userRoutes);
  app.use('/orders', orderRoutes);
  app.use('/admin', adminRoutes);
} catch (err) {
  console.warn('Could not mount modular routes automatically:', err.message);
}
