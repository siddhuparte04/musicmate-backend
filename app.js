const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const { name } = require("ejs");
const  nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");


app.use(cors());
app.use(express.json());


//create transporter
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"siddeshparte04@gmail.com",
        pass:"pkjw yxpy qqwy ewxn"
    },
    tls: {
    rejectUnauthorized: false // ignore self-signed certificate
  }
});



app.post("/forgetpass", async (req, res) => {
  try {
    // Update mailOptions dynamically if needed
    const mailOptions = {
      from: "siddeshpart04@gmail.com",
      to: "siddeshparte106@gmail.com",  // <-- recipient email here
      subject: "alert from MusicMate",
      text: "username:siddhu04 password:siddhu@123"
      
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    res.status(200).json({ msg: "Email sent successfully", info: info.response });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ msg: "Failed to send email", error: err.message });
  }
});


//authentication of admin 

app.post("/admin/login",async(req,res) => {
    console.log("request body:",req.body);
     const body = req.body;
     if(
        !body ||
        !body.username ||
        !body.pass
     ){
        return res.status(400).json({msg:"all fields are req"});
     }

     const username = "siddhu04"
     const pass = "siddhu@123"

     if(body.username == username && body.pass == pass){
        return res.status(201).json({ msg:"successfully login"});
     }
     else{
        return res.status(404).json({msg:"invalid credesntial"});
     }
});

// malter music file upload code here

// Multer configuration
// Multer storage
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

// Upload route for both music and image
app.post(
  "/api/admin",
  upload.fields([
    { name: "musicFile", maxCount: 1 },
    { name: "musicImgFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { musicName, artistName } = req.body;

      if (!musicName || !artistName || !req.files?.musicFile || !req.files?.musicImgFile) {
        return res.status(400).json({ msg: "All fields and files are required" });
      }

      const musicUrl = `http://localhost:5000/musics/${req.files.musicFile[0].filename}`;
      const musicImg = `http://localhost:5000/images/${req.files.musicImgFile[0].filename}`;

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

// Serve folders
app.use("/musics", express.static(path.join(__dirname, "musics")));
app.use("/images", express.static(path.join(__dirname, "images")));





//connection
mongoose.connect("mongodb://127.0.0.1:27017/musicDB")
.then(()=> console.log("mongoDB connected..."))
.catch(err => console.log("mongo ERROR:",err));

// Schema

const userSchema = new mongoose.Schema({
    musicName:{
        type:String,
        require:true,
    },
    artistName:{
        type:String,
        require:true,
    },
    musicImg:{
        type:String,
    },
    musicUrl:{
        type:String,
    }
}
,{
    timestamps: true
});

//model
const SongData = mongoose.model('songData',userSchema);

//post

app.post("/api/admin", async(req,res) => {
    console.log("request body:",req.body);
    const body = req.body;
    if(
        !body ||
        !body.musicImg ||
        !body.artistName ||
        !body.musicImg ||
        !body.musicUrl
    ){
        return res.status(400).json({msg:"all fields are req..."})
    }

    const result = await SongData.create({
        musicName:body.musicName,
        artistName: body.artistName,
        musicImg: body.musicImg,
        musicUrl: body.musicUrl
    });

    console.log("result:",result);
    return res.status(201).json({msg:"success"});
});


//get

app.get("/admin", async (req, res) => {
  try {
    const allDBsongs = await SongData.find({});
    res.json(allDBsongs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


//search get

app.get("/serachsong", async (req, res) => {
  try {
    const query = req.query.query?.trim();

    if (!query) {
      return res.status(400).json({ message: "no any result" });
    }

    const result = await SongData.find({
      musicName: { $regex: query, $options: "i" },
    });

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});


// delete

app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Example: deleting from MongoDB
    const result = await SongData.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ msg: "Item not found" });
    }

    res.status(200).json({ msg: "Deleted successfully", result });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

//update

app.patch("/update/:id", async (req, res) => {
  const id = req.params.id;
  const updates = req.body; // JSON body with fields to update

  try {
    const updatedSong = await SongData.findByIdAndUpdate(
      id,
      { $set: updates }, // only update specified fields
      { new: true }      // return the updated document
    );

    if (!updatedSong) {
      return res.status(404).json({ msg: "Song not found" });
    }

    res.status(200).json({ msg: "Song updated successfully", updatedSong });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});


app.listen(5000, ()=> {
    console.log("server running on : http://localhost:5000");
})