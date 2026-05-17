const { Server } = require("socket.io");

function initScoketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id );
  });

  return io;
}

module.exports = initScoketServer;
