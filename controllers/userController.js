const bcrypt = require('bcrypt');

// get user list logic
const getUserList = async (req, res, db) => {
  let records = [];

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

};

// create user logic
const createUser = async (req, res, db) => {

  const { username, password, isAdmin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, isAdmin };
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

module.exports = { getUserList, createUser };
