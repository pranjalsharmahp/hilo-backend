const multer = require('multer');
const path = require('path');

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Modify the path as needed
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp-originalname
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
