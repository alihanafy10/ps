const Session = require('../models/Session');
const Device = require('../models/Device');
const Product = require('../models/Product');
const Shift = require('../models/Shift');

// Utility to get the io instance from app
const getIo = (req) => req.app.get('io');

// @desc    Start a session for a device
// @route   POST /api/sessions/start
// @access  Private (OWNER & STAFF)
const startSession = async (req, res) => {
  const { deviceId, type, isLimit, limitMinutes } = req.body;

  if (!deviceId || !type) {
    return res.status(400).json({ message: 'Please provide deviceId and type' });
  }

  try {
    const device = await Device.findById(deviceId);
    if (!device || device.loungeId.toString() !== req.user.loungeId.toString()) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const activeShift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (!activeShift && req.user.role === 'STAFF') {
      return res.status(400).json({ message: 'No active shift found. Please start a shift first.' });
    }

    const existingSession = await Session.findOne({
      deviceId,
      status: 'Active',
    });

    if (existingSession) {
      return res.status(400).json({ message: 'Device is already active' });
    }

    const session = await Session.create({
      deviceId,
      loungeId: req.user.loungeId,
      shiftId: activeShift ? activeShift._id : undefined,
      staffId: req.user._id,
      type,
      isLimit: isLimit || false,
      limitMinutes: isLimit ? limitMinutes : undefined,
      modeHistory: [{ type, startTime: Date.now() }],
      orders: [],
    });

    await session.populate('deviceId', 'name type priceSingle priceMulti');

    const io = getIo(req);
    if (io) {
      console.log(`[SOCKET] Emitting sessionStarted to room: ${req.user.loungeId.toString()}`);
      io.to(req.user.loungeId.toString()).emit('sessionStarted', session);
      io.emit('sessionStarted', session); // SLEDGEHAMMER TEST
    } else {
      console.log('[SOCKET] io object is undefined in startSession!');
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error starting session' });
  }
};

// @desc    Add or remove order from an active session
// @route   POST /api/sessions/order
// @access  Private (OWNER & STAFF)
const addOrderToSession = async (req, res) => {
  const { sessionId, productId, quantity } = req.body;

  if (!sessionId || !productId || quantity === undefined || quantity === 0) {
    return res.status(400).json({ message: 'Please provide valid sessionId, productId, and non-zero quantity' });
  }

  try {
    const session = await Session.findOne({
      _id: sessionId,
      status: 'Active',
      loungeId: req.user.loungeId,
    }).populate('deviceId');

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const product = await Product.findOne({
      _id: productId,
      loungeId: req.user.loungeId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > 0 && product.stockQuantity < quantity) {
      return res.status(400).json({ message: `Only ${product.stockQuantity} items left in stock` });
    }

    // Check if product is already in orders
    const existingOrderIndex = session.orders.findIndex(
      (o) => o.product.toString() === productId.toString()
    );

    if (existingOrderIndex >= 0) {
      session.orders[existingOrderIndex].quantity += quantity;
      // If quantity drops to 0 or below, remove it from the array
      if (session.orders[existingOrderIndex].quantity <= 0) {
        session.orders.splice(existingOrderIndex, 1);
      }
    } else {
      if (quantity > 0) {
        session.orders.push({
          product: productId,
          name: product.name,
          quantity,
          priceAtOrder: product.price,
        });
      }
    }

    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order' });
  }
};

// @desc    Stop an active session (Checkout)
// @route   POST /api/sessions/stop
// @access  Private (OWNER & STAFF)
const stopSession = async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ message: 'Please provide deviceId' });
  }

  try {
    const session = await Session.findOne({
      deviceId,
      status: 'Active',
      loungeId: req.user.loungeId,
    }).populate('deviceId');

    if (!session) {
      return res.status(404).json({ message: 'No active session found for this device' });
    }

    session.endTime = Date.now();
    session.status = 'Finished';

    // Calculate Play Cost
    let playCost = 0;
    
    if (session.modeHistory && session.modeHistory.length > 0) {
      // Finalize the last history entry
      session.modeHistory[session.modeHistory.length - 1].endTime = session.endTime;
      
      // Calculate sum of history
      for (let mode of session.modeHistory) {
        const start = new Date(mode.startTime).getTime();
        const end = new Date(mode.endTime).getTime();
        const durationMinutes = (end - start) / (1000 * 60);
        const hourlyRate = mode.type === 'Single' ? session.deviceId.priceSingle : session.deviceId.priceMulti;
        playCost += durationMinutes * (hourlyRate / 60);
      }
    } else {
      // Fallback for legacy active sessions
      const durationMs = session.endTime.getTime() - session.startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const hourlyRate = session.type === 'Single' ? session.deviceId.priceSingle : session.deviceId.priceMulti;
      playCost = durationMinutes * (hourlyRate / 60);
      
      // Retroactively add history for the receipt
      session.modeHistory = [{
        type: session.type,
        startTime: session.startTime,
        endTime: session.endTime
      }];
    }

    // Calculate Orders Cost and Deduct Stock
    let ordersCost = 0;
    for (let order of session.orders) {
      ordersCost += order.quantity * order.priceAtOrder;
      
      // Deduct stock
      const product = await Product.findById(order.product);
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - order.quantity);
        await product.save();
      }
    }

    session.totalCost = Math.ceil(playCost + ordersCost);

    // Link to active shift and increment shift sales
    const activeShift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (activeShift) {
      session.shiftId = activeShift._id;
      activeShift.totalSales += session.totalCost;
      await activeShift.save();
    }

    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionStopped', session);
      io.to(req.user.loungeId.toString()).emit('deviceAvailable', session.deviceId._id);
      
      io.emit('sessionStopped', session); // SLEDGEHAMMER TEST
      io.emit('deviceAvailable', session.deviceId._id);
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error stopping session' });
  }
};

// @desc    Switch active session mode (Single <-> Multi)
// @route   PATCH /api/sessions/switch/:sessionId
// @access  Private (OWNER & STAFF)
const switchSessionMode = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({
      _id: sessionId,
      status: 'Active',
      loungeId: req.user.loungeId,
    }).populate('deviceId', 'name type priceSingle priceMulti');

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const newType = session.type === 'Single' ? 'Multi' : 'Single';
    
    // Set endTime for the current mode
    if (session.modeHistory && session.modeHistory.length > 0) {
      session.modeHistory[session.modeHistory.length - 1].endTime = Date.now();
    } else {
      // Fallback if modeHistory is empty (for old sessions)
      session.modeHistory = [{
        type: session.type,
        startTime: session.startTime,
        endTime: Date.now()
      }];
    }

    // Push new mode
    session.modeHistory.push({
      type: newType,
      startTime: Date.now()
    });

    session.type = newType;
    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
      io.emit('sessionUpdated', session); // SLEDGEHAMMER TEST
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error switching session mode' });
  }
};

// @desc    Convert a Limit session to Open Time
// @route   POST /api/sessions/convert-to-open
// @access  Private (OWNER & STAFF)
const convertSessionToOpen = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: 'Please provide sessionId' });
  }

  try {
    const session = await Session.findOne({
      _id: sessionId,
      status: 'Active',
      loungeId: req.user.loungeId,
    }).populate('deviceId', 'name type priceSingle priceMulti');

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    session.isLimit = false;
    session.limitMinutes = undefined;
    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error converting session' });
  }
};

// @desc    Get active sessions
// @route   GET /api/sessions/active
// @access  Private (OWNER & STAFF)
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      loungeId: req.user.loungeId,
      status: { $in: ['Active', 'Paused'] },
    }).populate('deviceId', 'name type priceSingle priceMulti');

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching active sessions' });
  }
};

// @desc    Get public session info by device ID
// @route   GET /api/sessions/public/device/:deviceId
// @access  Public
const getPublicSessionByDevice = async (req, res) => {
  try {
    const session = await Session.findOne({
      deviceId: req.params.deviceId,
      status: { $in: ['Active', 'Paused'] },
    })
      .select('startTime type isLimit limitMinutes modeHistory orders loungeId deviceId')
      .populate('loungeId', 'name')
      .populate('deviceId', 'name type priceSingle priceMulti');

    if (!session) {
      const device = await Device.findById(req.params.deviceId).populate('loungeId', 'name');
      if (!device) return res.status(404).json({ message: 'Device not found' });
      
      return res.status(200).json({ 
        active: false, 
        loungeName: device.loungeId.name,
        deviceName: device.name,
        loungeId: device.loungeId._id
      });
    }

    res.status(200).json({
      active: true,
      loungeName: session.loungeId.name,
      loungeId: session.loungeId._id,
      session: {
        _id: session._id,
        startTime: session.startTime,
        type: session.type,
        isLimit: session.isLimit,
        limitMinutes: session.limitMinutes,
        orders: session.orders,
        device: {
          name: session.deviceId.name,
          type: session.deviceId.type,
          priceSingle: session.deviceId.priceSingle,
          priceMulti: session.deviceId.priceMulti
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pause an active session
// @route   POST /api/sessions/pause
// @access  Private (OWNER & STAFF)
const pauseSession = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await Session.findOne({
      _id: sessionId,
      status: 'Active',
      loungeId: req.user.loungeId,
    }).populate('deviceId', 'name type priceSingle priceMulti');

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    session.status = 'Paused';

    // End the current mode history segment
    if (session.modeHistory && session.modeHistory.length > 0) {
      session.modeHistory[session.modeHistory.length - 1].endTime = Date.now();
    } else {
      session.modeHistory = [{
        type: session.type,
        startTime: session.startTime,
        endTime: Date.now()
      }];
    }

    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error pausing session' });
  }
};

// @desc    Resume a paused session
// @route   POST /api/sessions/resume
// @access  Private (OWNER & STAFF)
const resumeSession = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await Session.findOne({
      _id: sessionId,
      status: 'Paused',
      loungeId: req.user.loungeId,
    }).populate('deviceId', 'name type priceSingle priceMulti');

    if (!session) {
      return res.status(404).json({ message: 'Paused session not found' });
    }

    session.status = 'Active';

    // Start a new mode history segment
    session.modeHistory.push({
      type: session.type,
      startTime: Date.now()
    });

    await session.save();

    const io = getIo(req);
    if (io) {
      io.to(req.user.loungeId.toString()).emit('sessionUpdated', session);
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error resuming session' });
  }
};

module.exports = {
  startSession,
  addOrderToSession,
  stopSession,
  convertSessionToOpen,
  switchSessionMode,
  getActiveSessions,
  getPublicSessionByDevice,
  pauseSession,
  resumeSession,
};
