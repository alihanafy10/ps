const Order = require('../models/Order');
const Product = require('../models/Product');
const Shift = require('../models/Shift');
const PendingOrder = require('../models/PendingOrder');
const Session = require('../models/Session');

// @desc    Create a standalone order (Cafe POS)
// @route   POST /api/orders
// @access  Private (OWNER & STAFF)
const createOrder = async (req, res) => {
  const { products } = req.body; // Array of { productId, quantity }

  if (!products || products.length === 0) {
    return res.status(400).json({ message: 'No products provided' });
  }

  try {
    const activeShift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (!activeShift && req.user.role === 'STAFF') {
      return res.status(400).json({ message: 'No active shift found. Please start a shift first.' });
    }

    let totalCost = 0;
    const orderItems = [];

    // Verify stock and calculate price
    for (let item of products) {
      const product = await Product.findOne({
        _id: item.productId,
        loungeId: req.user.loungeId,
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });

      totalCost += product.price * item.quantity;
    }

    // Deduct stock
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity },
      });
    }

    const order = await Order.create({
      loungeId: req.user.loungeId,
      shiftId: activeShift ? activeShift._id : undefined,
      staffId: req.user._id,
      products: orderItems,
      totalCost,
    });

    // Add to shift total sales if shift exists
    if (activeShift) {
      activeShift.totalSales += totalCost;
      await activeShift.save();
    }

    const getIo = (req) => req.app.get('io');
    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('orderCreated', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order: ' + error.message });
  }
};

// @desc    Get orders for current shift
// @route   GET /api/orders/shift
// @access  Private (OWNER & STAFF)
const getShiftOrders = async (req, res) => {
  try {
    const activeShift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (!activeShift) {
      return res.status(200).json([]);
    }

    const orders = await Order.find({ shiftId: activeShift._id }).populate('staffId', 'name');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// @desc    Get pending public orders
// @route   GET /api/orders/pending
// @access  Private
const getPendingOrders = async (req, res) => {
  try {
    const orders = await PendingOrder.find({
      loungeId: req.user.loungeId,
      status: 'Pending'
    }).populate('deviceId', 'name');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching pending orders' });
  }
};

// @desc    Confirm a pending order
// @route   PATCH /api/orders/pending/:id/confirm
// @access  Private
const confirmPendingOrder = async (req, res) => {
  try {
    const order = await PendingOrder.findOne({
      _id: req.params.id,
      loungeId: req.user.loungeId,
      status: 'Pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Pending order not found or already processed' });
    }

    // Stock deduction is handled by sessionController.stopSession when the session ends
    // to maintain consistency with addOrderToSession.

    // Add to active session
    const session = await Session.findOne({ _id: order.sessionId });
    if (session && session.status === 'Active') {
      session.orders.push(...order.items);
      session.totalCost += order.totalCost;
      await session.save();
      
      const getIo = (req) => req.app.get('io');
      const io = getIo(req);
      if (io) {
        io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
      }
    }

    order.status = 'Confirmed';
    await order.save();

    const getIo = (req) => req.app.get('io');
    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('orderHandled', order._id);
    }

    res.status(200).json({ message: 'Order confirmed successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error confirming order' });
  }
};

// @desc    Cancel a pending order
// @route   PATCH /api/orders/pending/:id/cancel
// @access  Private
const cancelPendingOrder = async (req, res) => {
  try {
    const order = await PendingOrder.findOne({
      _id: req.params.id,
      loungeId: req.user.loungeId,
      status: 'Pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Pending order not found or already processed' });
    }

    order.status = 'Cancelled';
    await order.save();

    const getIo = (req) => req.app.get('io');
    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('orderHandled', order._id);
    }

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};

module.exports = {
  createOrder,
  getShiftOrders,
  getPendingOrders,
  confirmPendingOrder,
  cancelPendingOrder
};
