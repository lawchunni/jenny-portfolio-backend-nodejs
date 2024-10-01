const express = require('express');
const { connectToDb, getDb } = require('./connect');

// load .env variables
require('dotenv').config(); 

// init app & middleware
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
// const multer = require('multer'); // handle file upload
const path = require('path');

// middleware
app.use(bodyParser.json());
app.use(cors());

//Routes
const userRoutes = require('./routes/userRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const authRoutes = require('./routes/authRoutes');

// db connection
let db;

connectToDb((err) => {
  if (!err) {

    db = getDb();

    // Start the server
    app.listen(4000, () => {
      console.log('app listening on port 4000');
    })

    // Routes logic
    app.use('/api/users', userRoutes(db));  
    app.use('/api/portfolio', portfolioRoutes(db));
    app.use('/api/auth', authRoutes(db));  
  }
});

// Serve static files from the uploaded directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
