const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('./connect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // load .env variables

// init app & middleware
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const privateKey = process.env.SECRET_KEY;

// middleware
app.use(bodyParser.json());
app.use(cors());

// db connection
let db;

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
    .sort({ _id: 1 })
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

// get single portfolio item for admin page
app.get('/admin/portfolio-edit/:id', (req, res) => {
  
  db.collection('portfolio')
    .findOne({_id: new ObjectId(req.params.id)})
    .then(doc => {
      res.status(200).json(doc)
    }) 
    .catch(err => {
      res.status(500).json({error: 'Could not fetch the document'})
    })
})

// update single portfolio item from admin page
app.put('/admin/portfolio-edit/:id', async (req, res) => {
  const updatedFields = req.body;

  try {
    const result = await db.collection('portfolio').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedFields }
    );

    if(result.modifiedCount > 0) {
      res.status(200).json({ message: 'Portfolio item updated successfully. '});
    } else {
      res.status(404).json({ message: 'Portfolio item not found or no change made. '});
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update record'})
  }
});

// get user list
app.get('/users', (req, res) => {
  let records = [];

  db.collection('users')
    .find() // return cursor
    .sort({ _id: 1 })
    .forEach(record => records.push(record))
    .then(() => {
      res.status(200).json(records)
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the document'});
    })

});

// insert new user into database
app.post('/users', async (req, res) => {
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


// route to handle user login
app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.collection('users').findOne({ username: username });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username: user.username }, privateKey, {expiresIn: '1h'});
      const isAdmin = user.isAdmin;
      const preferredName = user.preferredName;
      res.status(200).json({ message: 'Login Successful', username, preferredName, isAdmin, token });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
      res.status(500).json({ message: 'Interal server error'});
  }
});
