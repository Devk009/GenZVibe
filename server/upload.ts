import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Express } from 'express';

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/images', 'uploads/videos'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    createUploadDirs();
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/images');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/videos');
    } else {
      cb(new Error('Invalid file type'), '');
    }
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniquePrefix + ext);
  }
});

// File filter to restrict file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to get file URL from file path
export const getFileUrl = (filePath: string): string => {
  return `/media/${path.basename(filePath)}`;
};

// Setup static media serving
export const setupMediaRoutes = (app: Express) => {
  createUploadDirs();
  app.use('/media', (req, res, next) => {
    // Simple caching headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
  }, (req, res, next) => {
    // Route to the correct subfolder based on file extension
    const filename = req.path.split('/').pop() || '';
    const ext = path.extname(filename).toLowerCase();
    
    let subfolder = '';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      subfolder = 'images';
    } else if (['.mp4', '.webm', '.ogg'].includes(ext)) {
      subfolder = 'videos';
    }
    
    if (subfolder) {
      const filePath = path.join('uploads', subfolder, filename);
      if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
      }
    }
    
    next();
  });
};