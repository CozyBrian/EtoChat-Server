import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserType } from ".";
import { io } from "..";


let SharerBank: UserType[] = [];
let ListenerBank: UserType[] = [];

export const roomHandler = (socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  console.log("a user Connected");
  console.log(socket.id);

  socket.on("calling", ({user}: {user: UserType}) => {
    console.log(`called ${user.sid} from ${socket.id}`);
    
    socket.to(user.sid).emit("on-called", socket.id)
  })
  
  socket.on("join-room", (data) => {
    console.log(`joined ${data} from ${socket.id}`);
    socket.join(data);
  })

  socket.on("make-request", ({user}: {user: UserType}) => {
    console.log(user);
    if (user.mode === "SHARER") {
      if (ListenerBank.length !== 0) {
        console.log("sharer served");
        const outUser = ListenerBank.pop()!;
        socket.join(outUser?.sid);
        setTimeout(() => {
          socket.emit("accepted", { user: outUser });
        }, 1000);
      } else {
        SharerBank.push(user);
        console.log("sharer banked");
        setTimeout(() => {
          if(SharerBank.includes(user)) {
            SharerBank = SharerBank.filter((buser) => buser.sid !== user.sid)
            console.log("sharer unbanked");
            socket.emit("bank-time-out");
          }
        }, 10000);
      }
    }
    
    if (user.mode === "LISTENER") {
      if (SharerBank.length !== 0) {
        console.log("listener served");
        const outUser = SharerBank.pop()!;
        socket.join(outUser?.sid);
        setTimeout(() => {
          socket.emit("accepted", { user: outUser });
        }, 1000);
      } else {
        ListenerBank.push(user);
        console.log("listener banked");
        setTimeout(() => {
          if(ListenerBank.includes(user)) {
            ListenerBank = ListenerBank.filter((buser) => buser.sid !== user.sid);
            console.log("listener unbanked");
            socket.emit("bank-time-out");
          }
        }, 10000);
      }

    }

    socket.on("disconnect", () => {
      console.log("user disconnect");
      // socket.to(Array.from(socket.rooms.values())).emit("user-disconnected", { data:"socket-emit" });
      // socket.broadcast.to(Array.from(socket.rooms.values())).emit("user-disconnected", { data: "socket-broadcast" });
      io.to(Array.from(socket.rooms.values())).emit("user-disconnected", "io-emit");
    })

    socket.on("end-call", () => {
      console.log("user - end disconnect");
      // socket.to(Array.from(socket.rooms.values())).emit("user-disconnected", { data:"socket-emit" });
      // socket.broadcast.to(Array.from(socket.rooms.values())).emit("user-disconnected", { data: "socket-broadcast" });
      io.to(Array.from(socket.rooms.values())).emit("user-disconnected", "io-emit");
    })

  });
  
};
