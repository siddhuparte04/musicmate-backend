// ==================== IMPORTS ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
require("dotenv").config(); // allows local .env usage

// ==================== APP INIT ====================
const app = express();
app.use(cors());
app.use(express.json());

// ==================== NODEMAILER ====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // from environment variable
    pass: process.env.EMAIL_PASS, // from environment variable
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ==================== FORGET PASSWORD ====================
app.post("/forgetpass", async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "siddeshparte106@gmail.com", // recipient
      subject: "Alert from MusicMate",
      text: "username: siddhu04  password: siddhu@123",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.response);
    res.status(200).json({ msg: "Email sent successfully", info: info.response });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ msg: "Failed to send email", error: err.message });
  }
});

// ==================== ADMIN LOGIN ====================
app.post("/admin/login", async (req, res) => {
  const { username, pass } = req.body;

  if (!username || !pass) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  const ADMIN_USER = "siddhu04";
  const ADMIN_PASS = "siddhu@123";

  if (username === ADMIN_USER && pass === ADMIN_PASS) {
    return res.status(200).json({ msg: "Successfully logged in" });
  } else {
    return res.status(401).json({ msg: "Invalid credentials" });
  }
});

// ==================== MULTER SETUP ====================
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "musicFile") cb(null, "musics/");
    if (file.fieldname === "musicImgFile") cb(null, "images/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: musicStorage });

// ==================== DATABASE CONNECTION ====================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ==================== MONGOOSE SCHEMA ====================
const userSchema = new mongoose.Schema(
  {
    musicName: { type: String, required: true },
    artistName: { type: String, required: true },
    musicImg: { type: String },
    musicUrl: { type: String },
  },
  { timestamps: true }
);

const SongData = mongoose.model("SongData", userSchema);

// ==================== UPLOAD MUSIC + IMAGE ====================
app.post(
  "/api/admin",
  upload.fields([
    { name: "musicFile", maxCount: 1 },
    { name: "musicImgFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { musicName, artistName } = req.body;

      if (
        !musicName ||
        !artistName ||
        !req.files?.musicFile ||
        !req.files?.musicImgFile
      ) {
        return res.status(400).json({ msg: "All fields and files are required" });
      }

      const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
      const musicUrl = `${BASE_URL}/musics/${req.files.musicFile[0].filename}`;
      const musicImg = `${BASE_URL}/images/${req.files.musicImgFile[0].filename}`;

      const song = await SongData.create({
        musicName,
        artistName,
        musicImg,
        musicUrl,
      });

      res.status(201).json({ msg: "Music and image uploaded successfully", song });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

// ==================== SERVE STATIC FILES ====================
app.use("/musics", express.static(path.join(__dirname, "musics")));
app.use("/images", express.static(path.join(__dirname, "images")));

// ==================== FETCH ALL SONGS ====================
app.get("/admin", async (req, res) => {
  try {
    const allSongs = await SongData.find({});
    res.json(allSongs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==================== SEARCH SONG ====================
app.get("/searchsong", async (req, res) => {
  try {
    const query = req.query.query?.trim();
    if (!query) return res.status(400).json({ msg: "No search query provided" });

    const result = await SongData.find({
      musicName: { $regex: query, $options: "i" },
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ==================== DELETE SONG ====================
app.delete("/delete/:id", async (req, res) => {
  try {
    const result = await SongData.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ msg: "Item not found" });

    res.status(200).json({ msg: "Deleted successfully", result });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==================== UPDATE SONG ====================
app.patch("/update/:id", async (req, res) => {
  try {
    const updates = req.body;
    const updatedSong = await SongData.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedSong) return res.status(404).json({ msg: "Song not found" });

    res.status(200).json({ msg: "Song updated successfully", updatedSong });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
