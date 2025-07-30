const express = require("express");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const user = await userModel.create({
    username: username,
    password: password,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token);

  return res.status(201).json({
    message: "User registered Successfully",
    user,
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const isUser = await userModel.findOne({
    username: username,
  });
  if (!isUser) {
    return res.status(401).json({
      message: "Invalid User",
    });
  }

  const isPasswordValid = password == isUser.password;
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid Password",
    });
  }

  res.status(200).json({
    message: "User LoggedIn Successfully",
  });
});

router.get("/user", async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findOne({
      _id: decoded.id,
    });
    return res.status(200).json({
      message: "User Fetch data successfully",
      user,
    });
    // res.send(decoded);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token ",
    });
  }
});
module.exports = router;
