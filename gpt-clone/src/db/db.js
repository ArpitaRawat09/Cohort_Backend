const mongoose = require("mongoose");

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("connected to MongoDB...");
  } catch (error) {
    console.log("Error to connect MongoDB...");
  }
}

module.exports = connectDb
