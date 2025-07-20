const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises; 

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(filePath, folder = 'uploads') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    await fs.unlink(filePath); 
    return result;
  } catch (error) {
    try { await fs.unlink(filePath); } catch {}
    throw error;
  }
}

module.exports = { uploadToCloudinary };
