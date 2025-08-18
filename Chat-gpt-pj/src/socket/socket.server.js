const { Server } = require("socket.io");
function initServerSocket(httpServer) {
  const io = new Server(httpServer, {});

  io.on("connection", (socket) => {
    console.log("New Socket Connection", socket.id);
  });
}

module.exports = initServerSocket;
