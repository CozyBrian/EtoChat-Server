import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserType } from ".";
import { io } from "..";

type onCallPairType = {
  caller: UserType;
  partner: UserType;
}

let SharerBank: UserType[] = [];
let ListenerBank: UserType[] = [];
let onCallPairBank: onCallPairType[] = [];

export const roomHandler = (socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  console.log("a user Connected");
  console.log(socket.id);

  const socketRooms = Array.from(socket.rooms.values());

  socket.on("calling", ({ user }: { user: UserType }) => {
    console.log(`called ${user.sid} from ${socket.id}`);
    
    socket.to(user.sid).emit("on-called", socket.id)
  })
  
  socket.on("join-room", (data) => {
    console.log(`joined ${data} from ${socket.id}`);
    socket.join(data);
  })

  socket.on("leave-peer", () => {
    socket.leave(socketRooms[1]);
  })

  socket.on("make-request", ({ user }: { user: UserType }) => {
    console.log(user);
    if (onCallPairBank.find((item) => item.caller.sid === user.sid || item.partner.sid === user.sid) === undefined) {
      
      if (user.mode === "SHARER") {
        if (ListenerBank.length !== 0) {
          const outUser = ListenerBank.pop()!;
          
          socket.join(outUser?.sid);
          
          setTimeout(() => {
            socket.emit("accepted", { user: outUser });
          }, 1000);
          
          onCallPairBank.push({ caller: outUser, partner: user });
          console.log("sharer served");
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
          const outUser = SharerBank.pop()!;

          socket.join(outUser?.sid);

          setTimeout(() => {
            socket.emit("accepted", { user: outUser });
          }, 1000);

          onCallPairBank.push({caller: outUser, partner: user});
          console.log("listener served");
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
    } else {
      io.to(Array.from(socket.rooms.values())).emit("user-disconnected", "io-emit");
      onCallPairBank = onCallPairBank.filter((item) => {item.caller.sid !== user.sid && item.partner.sid !== user.sid});
      console.log(onCallPairBank);
      
    }
      
    socket.on("disconnect", () => {
      console.log("user disconnect");
      io.to(socketRooms).emit("user-disconnected", "io-emit");
      onCallPairBank = onCallPairBank.filter((item) => item.caller.sid !== socket.id && item.partner.sid !== socket.id);
      socket.leave(socketRooms[1]);
    });
    
    socket.on("end-call", () => {
      console.log("user - end disconnect");
      io.to(socketRooms).emit("user-disconnected", "io-emit");
      socket.leave(socketRooms[1]);
      
      onCallPairBank = onCallPairBank.filter((item) => item.caller.sid !== socket.id && item.partner.sid !== socket.id);
    });

  });
  
};
