const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises; 
const env = require("../lib/env")

cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET
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
