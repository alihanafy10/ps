const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a device name (e.g. Screen 1, VIP Room)'],
    },
    type: {
      type: String,
      required: [true, 'Please add a device type (e.g. PS4, PS5, PC)'],
    },
    priceSingle: {
      type: Number,
      required: [true, 'Please add single player price per hour'],
    },
    priceMulti: {
      type: Number,
      required: [true, 'Please add multiplayer price per hour'],
    },
    loungeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Lounge',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Device', deviceSchema);
