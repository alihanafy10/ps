const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, ownerOnly, checkSubscription } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, checkSubscription, getProducts)
  .post(protect, ownerOnly, checkSubscription, createProduct);

router.route('/:id')
  .put(protect, ownerOnly, checkSubscription, updateProduct)
  .delete(protect, ownerOnly, checkSubscription, deleteProduct);

module.exports = router;
