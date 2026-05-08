const mongoose = require('mongoose');

const pendingOrderSchema = new mongoose.Schema(
  {
    loungeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Lounge',
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Device',
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Session',
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
        },
        priceAtOrder: {
          type: Number,
          required: true,
        },
      },
    ],
    totalCost: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PendingOrder', pendingOrderSchema);
