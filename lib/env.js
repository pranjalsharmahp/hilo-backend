const env = {
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET
  }
}

module.exports = { env };