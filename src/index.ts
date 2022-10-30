import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { roomHandler } from "./events/numberevent";

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user Connected");
  socket.on("join-room", (roomId: string, userId: number) => {
    console.log(`${roomId} and ${userId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
  });
  //registerOrderHandlers(io, socket);
});

function startServer() {
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

startServer();
