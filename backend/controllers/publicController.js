const Product = require('../models/Product');
const Session = require('../models/Session');
const PendingOrder = require('../models/PendingOrder');
const Device = require('../models/Device');

// @desc    Get public menu for a lounge
// @route   GET /api/public/menu/:loungeId
// @access  Public
const getPublicMenu = async (req, res) => {
  try {
    const products = await Product.find({ 
      loungeId: req.params.loungeId, 
      stockQuantity: { $gt: 0 } 
    }).select('name price stockQuantity imageUrl');

    // Also fetch lounge name if needed, but for now just products
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching menu' });
  }
};

// @desc    Place a public order from a device
// @route   POST /api/public/order
// @access  Public
const placeOrder = async (req, res) => {
  const { loungeId, deviceId, items } = req.body;

  if (!loungeId || !deviceId || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing required order details' });
  }

  try {
    // 1. Validate active session for the device
    const activeSession = await Session.findOne({
      deviceId,
      loungeId,
      status: 'Active'
    });

    if (!activeSession) {
      return res.status(400).json({ message: 'برجاء فتح الجهاز أولاً' }); // 'Please start the device first'
    }

    // 2. Calculate total cost and construct items array
    let totalCost = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Product ${product ? product.name : item.productId} is out of stock or insufficient.` });
      }

      const cost = product.price * item.quantity;
      totalCost += cost;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });
    }

    // 3. Create PendingOrder
    const pendingOrder = await PendingOrder.create({
      loungeId,
      deviceId,
      sessionId: activeSession._id,
      items: orderItems,
      totalCost,
      status: 'Pending',
    });

    const populatedOrder = await PendingOrder.findById(pendingOrder._id).populate('deviceId', 'name');

    // 4. Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(loungeId.toString()).emit('newOrderNotification', populatedOrder);
    }

    res.status(201).json({ message: 'Order placed successfully', order: pendingOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error placing order' });
  }
};

// @desc    Get device info for public page
// @route   GET /api/public/device/:deviceId
// @access  Public
const getDeviceInfo = async (req, res) => {
  try {
    const device = await Device.findById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPublicMenu,
  placeOrder,
  getDeviceInfo
};
