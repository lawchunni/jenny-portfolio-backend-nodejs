const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { uploadImages } = require('../middleware/uploadImages');

const portfolioController = require('../controllers/portfolioController');

module.exports = (db) => {
  router.get('/list', (req, res) => portfolioController.getPortfolioList(req, res, db)); // Route for getting portfolio list
  router.get('/:id', (req, res) => portfolioController.getPortfolioSingle(req, res, db)); // Route for getting portfolio single item

  router.get('/admin/list', verifyToken, (req, res) => portfolioController.getPortfolioList(req, res, db)); // Route for getting admin portfolio list
  router.get('/admin/:id', verifyToken, (req, res) => portfolioController.getPortfolioSingle(req, res, db)); // Route for getting admin portfolio single item
  router.post('/admin/create', verifyToken, uploadImages, (req, res) => portfolioController.createPortfolioSingle(req, res, db)); // Route for creating new portfolio single item
  router.put('/admin/update/:id', verifyToken, uploadImages, (req, res) => portfolioController.updatePortfolioSingle(req, res, db)); // Route for updating new portfolio single item

  return router;
};
