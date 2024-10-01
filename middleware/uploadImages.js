const multer = require('multer'); // handle file upload
const path = require('path');

//Set up storage and multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); // store the images in the upload folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Unique file name
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType) {
      return cb(null, true);
    }

    cb(new Error('Invalid file type. Only JPEG, JPG, PNG and GIF are allowed.'));
  }
});

module.exports = {
  uploadImages: upload.fields([{name: 'thumbnail', maxCount: 1}, {name: 'images', maxCount: 10}]),
  upload: upload
};
