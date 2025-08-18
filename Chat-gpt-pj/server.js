require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");
const initServerSocket = require("./src/socket/socket.server");
const httpServer = require("http").createServer(app);

connectDB();
initServerSocket(httpServer);

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
