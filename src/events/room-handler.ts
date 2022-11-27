import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserType } from ".";
import { io } from "..";

type onCallPairType = {
  caller: UserType;
  partner: UserType;
}

let UserWaitQueue: UserType[] = [];
let onCallPairBank: onCallPairType[] = [];

const FIND_TIMEOUT_MS = 45000; 

export const roomHandler = (socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  console.log(`a user Connected - ${socket.id}`);

  const socketRooms = Array.from(socket.rooms.values());

  socket.on("calling", ({ user }: { user: UserType }, userState) => {
    socket.to(user.sid).emit("on-called", socket.id, userState);
  });
  
  socket.on("join-room", (data) => {
    const socketRooms = Array.from(socket.rooms.values());

    socketRooms.forEach((room, i) => {
      i !== 0 && socket.leave(room);
    });

    socket.join(data);    
  });

  socket.on("leave-peer", () => {
    const socketRooms = Array.from(socket.rooms.values());

    socketRooms.forEach((room, i) => {
      i !== 0 && socket.leave(room);
    });
  });

  socket.on("mic-mute", (data) => {
    io.to(socketRooms).emit("user-mic-mute", data);
  });

  socket.on("make-request", ({ user }: { user: UserType }) => {  
    if (onCallPairBank.find((item) => item.caller.sid === user.sid || item.partner.sid === user.sid) === undefined) {
      
      if (UserWaitQueue.length !== 0) {
        const outUser = UserWaitQueue.pop()!;

        if (outUser.sid !== user.sid) {
          setTimeout(() => {
            socket.emit("accepted", { user: outUser });
          }, 1000);
  
          socket.join(outUser?.sid);
          
          onCallPairBank.push({ caller: outUser, partner: user });
          console.log("sharer served");
        } else {
          UserWaitQueue.push(user);
        
          console.log("sharer banked");
        
          setTimeout(() => {
            if(UserWaitQueue.includes(user)) {
              UserWaitQueue = UserWaitQueue.filter((buser) => buser.sid !== user.sid)
              console.log("sharer unbanked");
              socket.emit("bank-time-out");
            }
          }, FIND_TIMEOUT_MS);
        }
        
      } else {
        UserWaitQueue.push(user);
        
        console.log("sharer banked");
        
        setTimeout(() => {
          if(UserWaitQueue.includes(user)) {
            UserWaitQueue = UserWaitQueue.filter((buser) => buser.sid !== user.sid)
            console.log("sharer unbanked");
            socket.emit("bank-time-out");
          }
        }, FIND_TIMEOUT_MS);
      }
    } else {
      const socketRooms = Array.from(socket.rooms.values());
      io.to(socketRooms[1]).emit("user-disconnected", "io-emit");
      onCallPairBank = onCallPairBank.filter((item) => {item.caller.sid !== user.sid && item.partner.sid !== user.sid});
      console.log(onCallPairBank);
    }
  });

  socket.on("disconnect", () => {
    const socketRooms = Array.from(socket.rooms.values());

    for (let index = 0; index < 2; index++) {
      io.to(socketRooms[index]).emit("user-disconnected", socket.id);
    }

    onCallPairBank = onCallPairBank.filter((item) => item.caller.sid !== socket.id && item.partner.sid !== socket.id);
    
    socketRooms.forEach((room, i) => {
      i !== 0 && socket.leave(room);
    });
  });

  socket.on("end-call", () => {
    const socketRooms = Array.from(socket.rooms.values());
    console.log("user - end disconnect");

    for (let index = 0; index < 2; index++) {
      io.to(socketRooms[index]).emit("user-disconnected", socket.id);
    }

    socketRooms.forEach((room, i) => {
      i !== 0 && socket.leave(room);
    });
    
    onCallPairBank = onCallPairBank.filter((item) => item.caller.sid !== socket.id && item.partner.sid !== socket.id);
  });
  
};
