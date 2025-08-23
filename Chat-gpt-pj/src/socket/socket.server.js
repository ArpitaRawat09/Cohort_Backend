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

      // gives the message
      // const message = await messageModel.create({
      //   chat: messagePayload.chat,
      //   user: socket.user._id,
      //   content: messagePayload.content,
      //   role: "user",
      // });

      // // convert user msg into vector
      // const vectors = await aiService.generateVector(messagePayload.content);
      // // console.log("vectors:",vectors);

      // save message and create vector at a same time
      const [message, vectors] = await Promise.all([
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        }),
        aiService.generateVector(messagePayload.content),
      ]);

      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content,
        },
      });

      // provide previous memory (save in vector database)

      const [memory, chatHistory] = await Promise.all([
        queryMemory({
          queryVector: vectors,
          limit: 3,
          metadata: {
            user: socket.user._id,
          },
        }),

        messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .then((messages) => messages.reverse()),
      ]);

      // short term memory
      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      // long term memory
      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `these are some previous chat from the chat,use them to generate an response
          ${memory.map((item) => item.metadata.text).join("\n")}`,
            },
          ],
        },
      ];

      // and feed to the ai
      const response = await aiService.generateResponse([...ltm, ...stm]);

      // // than ai gives response and save in database
      // const responseMessage = await messageModel.create({
      //   chat: messagePayload.chat,
      //   user: socket.user._id,
      //   content: response,
      //   role: "model",
      // });

      // // and than convert the response in vectors
      // const responseVector = await aiService.generateVector(response);

      // // and than save in vector database
      // await createMemory({
      //   vectors: responseVector,
      //   messageId: responseMessage._id,
      //   metadata: {
      //     chat: messagePayload.chat,
      //     user: socket.user._id,
      //     text: response,
      //   },
      // });

      // and than what generate the response by the ai gives in response
      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });

      // save response message and response vector in databse
      const [responseMessage, responseVectors] = await Promise.all([
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        }),
        aiService.generateVector(response),
      ]);

      await createMemory({
        vectors: responseVectors,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response,
        },
      });
    });
  });
}

module.exports = initServerSocket;
