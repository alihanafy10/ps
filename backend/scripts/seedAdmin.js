require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ps_saas');

    const adminExists = await User.findOne({ email: 'admin@ps-saas.com' });

    if (adminExists) {
      console.log('Super Admin already exists.');
      process.exit();
    }

    const admin = new User({
      name: 'System Admin',
      email: 'admin@ps-saas.com',
      password: 'adminpassword',
      role: 'SUPER_ADMIN',
    });

    await admin.save();
    console.log('SUPER_ADMIN created successfully! Email: admin@ps-saas.com, Password: adminpassword');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
