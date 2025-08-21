const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.services");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initServerSocket(httpServer) {
  const io = new Server(httpServer, {});

  // socket io middleware. :- In this code only loggenIn user is connected to socket io server
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    // console.log("Socket connection cookies", cookies);

    if (!cookies.token) {
      next(new Error("Authentication Error: No token provided"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication Error : Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // console.log("User connected", socket.user);
    // console.log("New Socket Connection", socket.id);

    socket.on("ai-message", async (messagePayload) => {
      // console.log(messagePayload);

      const message = await messageModel.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: messagePayload.content,
        role: "user",
      });

      const vectors = await aiService.generateVector(messagePayload.content);
      // console.log("vectors:",vectors);

      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content,
        },
      });


      // provide previous memory 
      const memory = await queryMemory({
        queryVector: vectors,
        limit: 3,
        metadata: {},
      });

      console.log(memory);
      

      // short term memory
      const chatHistory = (
        await messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createAt: -1 })
          .limit(20)
      ).reverse();

      const response = await aiService.generateResponse(
        chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        })
      );

      const responseMessage = await messageModel.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: response,
        role: "model",
      });

      const responseVector = await aiService.generateVector(response);

      await createMemory({
        vectors: responseVector,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response,
        },
      });

      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });
    });
  });
}

module.exports = initServerSocket;
