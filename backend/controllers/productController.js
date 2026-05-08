const Product = require('../models/Product');

// @desc    Get all products for a lounge
// @route   GET /api/products
// @access  Private (OWNER & STAFF)
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ loungeId: req.user.loungeId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (OWNER only)
const createProduct = async (req, res) => {
  const { name, price, stockQuantity } = req.body;

  if (!name || !price || stockQuantity === undefined) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    const product = await Product.create({
      name,
      price,
      stockQuantity,
      loungeId: req.user.loungeId, // Extracted from token
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (OWNER only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure the product belongs to the user's lounge
    if (product.loungeId.toString() !== req.user.loungeId.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (OWNER only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure the product belongs to the user's lounge
    if (product.loungeId.toString() !== req.user.loungeId.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await product.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
