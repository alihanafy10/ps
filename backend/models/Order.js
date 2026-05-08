const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    loungeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Lounge',
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Shift',
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    products: [
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

module.exports = mongoose.model('Order', orderSchema);
