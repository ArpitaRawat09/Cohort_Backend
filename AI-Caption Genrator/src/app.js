const express = require("express");
const authRoutes = require("../src/routes/auth.routes");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use(cookieParser());

module.exports = app;
