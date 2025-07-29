const mongoose = require("mongoose");

function connectDB() {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log("connect to DB");
    })
    .catch((err) => {
      console.log(err);
    });
}

module.exports = connectDB
