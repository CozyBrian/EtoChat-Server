import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { roomHandler } from "./events/room-handler";
import { ExpressPeerServer } from "peer";

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

app.use("/peer", ExpressPeerServer(server, {}));

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", roomHandler);

function startServer() {
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

startServer();
