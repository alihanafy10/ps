const mongoose = require('mongoose');

const loungeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a lounge name'],
    },
    area: {
      type: String,
      default: 'Unknown Area',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lounge', loungeSchema);
