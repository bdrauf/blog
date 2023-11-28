import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_KEY_SECRET,
  secure: true,
});

const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({ storage }).single('file');

app.post('/api/upload', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return reject(err);
        }
        resolve();
      });
    });

    if (!req.file) {
      throw new Error('No file received');
    }

    const file = req.file;

    // Generate a unique public_id based on the current date and time
    const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const publicId = `${currentDateTime}`;

    // Upload the file to Cloudinary using the stream option
    const result = await cloudinary.uploader
      .upload_stream(
        {
          folder: 'blog',
          public_id: publicId,
        },
        async (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            const imageUrl = result.secure_url;
            res.status(201).json(imageUrl);
          }
        }
      )
      .end(file.buffer);
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
