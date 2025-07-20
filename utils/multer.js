const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute path to the uploads directory
const uploadDir = path.join(__dirname, '../uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (/image\/(jpeg|png|gif)/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image uploads allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5Mb
  fileFilter
});

module.exports = upload;
