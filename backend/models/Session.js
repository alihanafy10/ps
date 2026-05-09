const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Device',
    },
    loungeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Lounge',
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['Single', 'Multi'],
      required: true,
    },
    isLimit: {
      type: Boolean,
      default: false,
    },
    limitMinutes: {
      type: Number,
    },
    modeHistory: [
      {
        type: {
          type: String,
          enum: ['Single', 'Multi'],
          required: true,
        },
        startTime: {
          type: Date,
          default: Date.now,
        },
        endTime: {
          type: Date,
        },
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Finished'],
      default: 'Active',
    },
    orders: [
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
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
