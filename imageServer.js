import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();
const app = express();
app.use(express.json());
// app.use(cors());
app.use(cors({
  origin: ["http://localhost:5173", "https://justice-league-ochre.vercel.app/"],
  methods: ["GET", "POST"]
}));
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5003;
const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

const imageSchema = new mongoose.Schema({
  name: String,
  image: String,
});
const Image = mongoose.model("Image", imageSchema);

app.get("/", async (req, res) => {
  res.send("success!!!");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  const imageName = req.file.filename;
  try {
    await Image.create({ image: imageName });
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: `/uploads/${imageName}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading image" });
  }
});

app.get("/get-image", async (req, res) => {
  try {
    Image.find({}).then((data) => {
      res.send({ status: "200 OK", data: data });
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting image" });
  }
});

app.listen(PORT, () => {
  console.log(`Server started running on ${PORT}`);
});
