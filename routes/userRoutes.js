const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { upload } = require('../middleware/uploadImages');

const userController = require('../controllers/userController');

module.exports = (db) => {
  router.get('/admin/list', (req, res) => userController.getUserList(req, res, db)); // Route for getting user list
  router.post('/admin/create', verifyToken, upload.none(), (req, res) => userController.createUser(req, res, db)); // Create new user
  router.delete('/admin/delete/:id', verifyToken, (req, res) => userController.deleteUserSingle(req, res, db)); // Delete user

  return router;
};
