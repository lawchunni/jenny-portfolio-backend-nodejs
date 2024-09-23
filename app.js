const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('./connect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/verifyToken');
require('dotenv').config(); // load .env variables

// init app & middleware
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // handle file upload
const path = require('path');

// Auth Token 
const privateKey = process.env.SECRET_KEY;
const refreshKey = process.env.REFRESH_SECRET;
let refreshTokens = [];

// middleware
app.use(bodyParser.json());
app.use(cors());

// db connection
let db;

// =============================== Client Site ===============================

connectToDb((err) => {
  if (!err) {
    app.listen(4000, () => {
      console.log('app listening on port 4000');
    })
    db = getDb();
  }
})

// get portfolio full list
app.get('/portfolio', (req, res) => {
  let records = [];

  db.collection('portfolio')
    .find() // return cursor
    .sort({ _id: -1 })
    .forEach(record => records.push(record))
    .then(() => {
      res.status(200).json(records)
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the document'});
    })
})

// get single portfolio item
app.get('/portfolio/:id', (req, res) => {
  
  db.collection('portfolio')
    .findOne({_id: new ObjectId(req.params.id)})
    .then(doc => {
      res.status(200).json(doc)
    }) 
    .catch(err => {
      res.status(500).json({error: 'Could not fetch the document'})
    })
})

// =============================== Admin - get portfolio item ===============================

// get single portfolio item for admin page
app.get('/admin/portfolio-edit/:id', verifyToken, (req, res) => {
  
  db.collection('portfolio')
    .findOne({_id: new ObjectId(req.params.id)})
    .then(doc => {
      res.status(200).json(doc)
    }) 
    .catch(err => {
      res.status(500).json({error: 'Could not fetch the document'})
    })
})

// =============================== Admin - Upload image ===============================

//Set up storage and multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // in folder to store uploaded images from the client side
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Unique file name
  }
});

const upload = multer({ storage: storage});

// Serve static files from the uploaded directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// update single portfolio item from admin page
const uploadImages = upload.fields([{name: 'thumbnail', maxCount: 1}, {name: 'images', maxCount: 10}]);

// insert a new portfolio item into database 
app.post('/admin/portfolio', uploadImages, verifyToken, async (req, res) => {
  const {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight,
    deleted
  } = req.body;

  let newData = {
    title,
    desc_short,
    desc_long,
    tags,
    slug
  }

  newData.highlight = highlight === 'true';
  newData.deleted = deleted === 'true';

  try {

    if (req.files.thumbnail) {
      newData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    }
    
    if (req.files.images) {
      // combind existing images with new added images 
      newData.images = req.files.images.map(file => `/uploads/${file.filename}`);
    }

    const result = await db.collection('portfolio').insertOne(newData);
    res.status(201).json({ message: 'Portfolio item created successfully', itemId: result.insertedId});

  } catch (err) {
    res.status(500).json({ error: 'Failed to update record'})
  }
})

// get portfolio full list in admin 
app.get('/admin/portfolio', verifyToken, (req, res) => {
  let records = [];

  db.collection('portfolio')
    .find() // return cursor
    .sort({ _id: -1 })
    .forEach(record => records.push(record))
    .then(() => {
      res.status(200).json(records)
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the document'});
    })
});

// edit single portfolio item 
app.put('/admin/portfolio-edit/:id', verifyToken, uploadImages, async (req, res) => {
  const {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight,
    deleted
  } = req.body;

  let newData = {
    title,
    desc_short,
    desc_long,
    tags,
    slug
  }

  newData.highlight = highlight === 'true';
  newData.deleted = deleted === 'true';

  try {

    const existingItem = await db.collection('portfolio').findOne({ _id: new ObjectId(req.params.id)});


    if (!existingItem) {
      return res.status(404).json({ error: 'Portfolio item not found.'});
    }

    if (req.files.thumbnail) {
      newData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    }
    
    if (req.files.images) {
      // combind existing images with new added images 
      const newImageUrls = req.files.images.map(file => `/uploads/${file.filename}`);
      newData.images = [...existingItem.images, ...newImageUrls];
    }

    const result = await db.collection('portfolio').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: newData}
    );

    if(result.modifiedCount > 0) {
      res.status(200).json({ message: 'Portfolio item updated successfully. '});
    } else {
      res.status(404).json({ message: 'No change made.'});
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update record'})
  }
});

// =============================== Auth ===============================

// get user list
app.get('/users', verifyToken, (req, res) => {
  // res.set('Access-Control-Allow-Origin', 'localhost:3000');

  let records = [];

  console.log('admin users refresh token1: ',refreshTokens);

  db.collection('users')
    .find() // return cursor
    .sort({ _id: 1 })
    .forEach(record => records.push(record))
    .then(() => {
      res.status(200).json(records);
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the document'});
    })

});

// insert new user into database
app.post('/users', verifyToken, upload.none(), async (req, res) => {

  const { username, password, isAdmin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, isAdmin };
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});


// =============================== Login ===============================

const generateAccessToken = (user) => {
  return jwt.sign({ username: user.username }, privateKey, { expiresIn: '1h' });
}

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign({ username: user.username }, refreshKey, { expiresIn: '7d' });
  refreshTokens.push(refreshToken);
  return refreshToken;
}

// route to handle user login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.collection('users').findOne({ username: username });

    if (user && await bcrypt.compare(password, user.password)) {

      // generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      console.log('login refresh token: ',refreshTokens);

      const isAdmin = user.isAdmin;
      const preferredName = user.preferredName;

      res.status(200).json({ 
        message: 'Login Successful', 
        username, 
        preferredName, 
        isAdmin, 
        accessToken: accessToken, 
        refreshToken: refreshToken });

    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
      res.status(500).json({ message: 'Interal server error'});
  }
});

// route to handle user login
app.post('/api/logout', async (req, res) => {
  const { refreshToken } = req.body;

  console.log('logout refresh token: ',refreshTokens);

  // remove the refreshToken from the list
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);

  res.json({message: 'User logout successfully'});
});

// Route to refresh access token
app.post('/api/refresh-token', (req, res) => {

  // res.set('Access-Control-Allow-Origin', 'localhost:3000');

  const { refreshToken } = req.body;

  console.log('token refresh token: ',refreshTokens);

  if (!refreshToken) {
    return res.status(403).json({ message: 'Refresh token required' });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: 'Invalid refresh token, no token record' });
  }

  jwt.verify(refreshToken, refreshKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken({ username: user.username});
    res.json({ accessToken: newAccessToken});
  }) 
});
