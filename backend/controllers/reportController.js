const Shift = require('../models/Shift');
const Session = require('../models/Session');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get owner financial summary
// @route   GET /api/reports/owner-summary
// @access  Private (OWNER only)
const getOwnerSummary = async (req, res) => {
  // Ensure only OWNER can access
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Access denied, owner only' });
  }

  try {
    const loungeId = req.user.loungeId;
    const now = new Date();
    
    // Today's boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // This month's boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Fetch shifts for today and this month
    const todayShifts = await Shift.find({
      loungeId,
      startTime: { $gte: startOfToday, $lt: endOfToday }
    });

    const monthShifts = await Shift.find({
      loungeId,
      startTime: { $gte: startOfMonth, $lt: endOfMonth }
    });

    const todayTotal = todayShifts.reduce((acc, shift) => acc + shift.totalSales, 0);
    const monthlyTotal = monthShifts.reduce((acc, shift) => acc + shift.totalSales, 0);

    // Staff Performance Calculation (All Time or Month - let's do All Time for now)
    const allShifts = await Shift.find({ loungeId }).populate('staffId', 'name');
    
    const staffPerformanceMap = {};
    allShifts.forEach(shift => {
      if (shift.staffId) {
        const staffName = shift.staffId.name;
        if (!staffPerformanceMap[staffName]) {
          staffPerformanceMap[staffName] = 0;
        }
        staffPerformanceMap[staffName] += shift.totalSales;
      }
    });

    const staffPerformance = Object.keys(staffPerformanceMap).map(name => ({
      name,
      totalCollected: staffPerformanceMap[name]
    }));

    // Revenue Breakdown
    // We can calculate PlayStation vs Cafe by checking Sessions vs Orders for the month
    const monthSessions = await Session.find({
      loungeId,
      status: 'Finished',
      endTime: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    let psRevenue = 0;
    let cafeRevenue = 0;

    monthSessions.forEach(session => {
      // session.totalCost includes ordersCost. 
      // Need to separate it based on orders array.
      let ordersCost = 0;
      session.orders.forEach(o => {
        ordersCost += o.quantity * o.priceAtOrder;
      });
      psRevenue += (session.totalCost - ordersCost);
      cafeRevenue += ordersCost;
    });

    // Also add standalone orders
    const standaloneOrders = await Order.find({
      loungeId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    standaloneOrders.forEach(order => {
      cafeRevenue += order.totalCost;
    });

    res.status(200).json({
      todayTotal,
      monthlyTotal,
      staffPerformance,
      revenueBreakdown: {
        playstation: psRevenue,
        cafe: cafeRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching owner summary' });
  }
};

// @desc    Get shifts log
// @route   GET /api/reports/shifts-log
// @access  Private (OWNER only)
const getShiftsLog = async (req, res) => {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Access denied, owner only' });
  }

  try {
    const shifts = await Shift.find({ loungeId: req.user.loungeId })
      .populate('staffId', 'name')
      .sort({ startTime: -1 });

    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching shifts log' });
  }
};

// @desc    Get detailed audit for a specific shift
// @route   GET /api/reports/shift-details/:shiftId
// @access  Private (OWNER only)
const getShiftDetails = async (req, res) => {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Access denied, owner only' });
  }

  try {
    const shift = await Shift.findOne({
      _id: req.params.shiftId,
      loungeId: req.user.loungeId,
    }).populate('staffId', 'name');

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Fetch all sessions for this shift
    const sessions = await Session.find({ shiftId: shift._id })
      .populate('deviceId', 'name')
      .populate('staffId', 'name');

    // Fetch all orders for this shift
    const orders = await Order.find({ shiftId: shift._id })
      .populate('staffId', 'name');

    res.status(200).json({
      shift,
      sessions,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching shift details' });
  }
};

module.exports = {
  getOwnerSummary,
  getShiftsLog,
  getShiftDetails
};
