const express = require("express");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const user = await userModel.create({
    username,
    password,
  });

  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "user registerd successfully",
    user,
    token,
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  //   check user
  const user = await userModel.findOne({
    username: username,
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid username",
    });
  }

  //   check password
  const isPasswordValid = password == user.password;

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid password",
    });
  }

  res.status(200).json({
    message: "user loggedIn successfully",
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
    // res.send(decoded);
    const user = await userModel
      .findOne({
        _id: decoded.id,
      })
      .select("-password");
    res.status(200).json({
      message: "user data fetch successfully",
      user,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized-Invalid token",
    });
  }
});

module.exports = router;
