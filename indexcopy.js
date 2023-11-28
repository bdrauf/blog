import express, { response } from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const ID = process.env.CLIENT_ID;
const SECRET = process.env.CLIENT_SECRET;
const URI = process.env.REDIRECT_URI;
const TOKEN = process.env.REFRESH_TOKEN;

const oauth2client = new google.auth.OAuth2(ID, SECRET, URI);

oauth2client.setCredentials({ refresh_token: TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2client,
});

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, 'img_' + Date.now());
  },
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), async function (req, res) {
  try {
    const file = req.file;

    // Define the parent folder's ID where you want to upload the file
    const folderId = process.env.FOLDER;

    // Upload the file to Google Drive and add it to the specified folder
    const response = await drive.files.create({
      requestBody: {
        name: file.filename,
        mimeType: file.mimetype,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
    });
    const webViewLink = response.data.webViewLink;
    res.status(201).json(file.filename);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(8800, () => {
  console.log('Server is running on port 8800');
});
