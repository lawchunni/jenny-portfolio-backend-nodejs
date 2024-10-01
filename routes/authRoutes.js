const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

module.exports = (db) => {
  router.post('/login', (req, res) => authController.userLogin(req, res, db)); // Route for user login
  router.post('/logout', (req, res) => authController.userLogout(req, res, db)); // Route for user logout
  router.post('/refresh-access-token', (req, res) => authController.refreshAccessToken(req, res, db)); // Route for refreshing access token when it is missing / expired on client side

  return router;
};
