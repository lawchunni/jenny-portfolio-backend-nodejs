const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('./connect');
const bcrypt = require('bcrypt');

// init app & middleware
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

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


app.post('/users', async (req, res) => {
  const { email, password, isAdmin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { email, password: hashedPassword, isAdmin };
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

