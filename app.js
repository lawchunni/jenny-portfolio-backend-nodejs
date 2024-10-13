const express = require('express');
const connectToMongoDB = require('./connect');

// load .env variables
require('dotenv').config(); 

// init app & middleware
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
// const multer = require('multer'); // handle file upload
const path = require('path');

const port = process.env.PORT || 4000;

// middleware
app.use(bodyParser.json());
app.use(cors());

//Routes
const userRoutes = require('./routes/userRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const authRoutes = require('./routes/authRoutes');

// db connection
let db;

connectToMongoDB().then((database) => {

  db = database;

  app.get('/', (req, res) => {
    res.send('Database connection built up successfully!');
  })

  // Routes logic
  app.use('/api/users', userRoutes(db));  
  app.use('/api/portfolio', portfolioRoutes(db));
  app.use('/api/auth', authRoutes(db));  

  // Start the server after connection
  app.listen(port, () => {
    console.log(`app listening on port ${port}`);
  });

});

// Serve static files from the uploaded directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
