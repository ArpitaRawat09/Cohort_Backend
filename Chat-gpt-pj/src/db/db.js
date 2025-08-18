const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
  } catch (error) {
    console.log("Error to connectDB", error);
  }
}

module.exports = connectDB