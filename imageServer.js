import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { GridFSBucket } from "mongodb";
import Grid from "gridfs-stream";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "https://justice-league-ochre.vercel.app/"],
  methods: ["GET", "POST"],
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5003;
const uri = process.env.MONGODB_URI;

const conn = mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('image'), (req, res) => {
  const writestream = gfs.createWriteStream({
    filename: Date.now().toString() + '-' + req.file.originalname,
    content_type: req.file.mimetype,
    metadata: req.file,
  });

  writestream.write(req.file.buffer);
  writestream.end();

  writestream.on('close', (file) => {
    res.status(200).json({ message: 'Image uploaded successfully', imageUrl: `/uploads/${file.filename}` });
  });
});

app.get('/get-image', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);
  });
});

app.listen(PORT, () => {
  console.log(`Server started running on ${PORT}`);
});
