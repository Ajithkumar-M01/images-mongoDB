import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GridFSBucket } from "mongodb";
import multerGridfsStorage from "multer-gridfs-storage";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "https://justice-league-ochre.vercel.app/"],
  methods: ["GET", "POST"],
}));

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5003;
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Create GridFS Storage
const storage = new multerGridfsStorage({
  url: uri,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => ({
    filename: Date.now().toString() + '-' + file.originalname,
    bucketName: 'uploads',
  }),
});

const uploadGridFS = multer({ storage });

app.post('/upload', uploadGridFS.single('image'), (req, res) => {
  res.status(200).json({
    message: 'Image uploaded successfully',
    imageUrl: `/uploads/${req.file.filename}`,
  });
});

app.get('/uploads/:filename', (req, res) => {
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });

  bucket.openDownloadStreamByName(req.params.filename)
    .pipe(res)
    .on('error', () => {
      res.status(404).json({ message: 'Image not found' });
    });
});

app.listen(PORT, () => {
  console.log(`Server started running on ${PORT}`);
});
