const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
      socketTimeoutMS:          45000,  // abort slow queries after 45s
      connectTimeoutMS:         10000,  // give up connecting after 10s
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Stop the server if DB fails
  }
};

module.exports = connectDB;
