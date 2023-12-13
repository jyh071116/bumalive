const { copyFileSync } = require("fs");

const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(3000, () => {
  console.log("서버가 실행되었습니다");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let chatting = {};

io.on("connection", (socket) => {
  const enterRoom = (roomId) => {
    chatting[roomId] = [];
    io.to(roomId).emit("broadcast", {
      roomId: roomId,
      msg: roomId + "번 방에 입장하셨습니다",
    });
  };

  const deleteRoom = (roomId) => {
    delete chatting.roomId;
    io.to(roomId).emit("leave");
    io.sockets.adapter.rooms.delete(roomId);
  };

  socket.on("join", async () => {
    let i = 0;
    while (true) {
      try {
        const personnel = io.sockets.adapter.rooms.get(i).size;
        if (personnel == 1) throw new Error("인원 부족한 방 입장");
        i += 1;
      } catch (e) {
        if (e instanceof TypeError) {
          socket.join(i);
          const wait = setInterval(() => {
            const personnel = io.sockets.adapter.rooms.get(i).size;
            if (personnel == 2) {
              enterRoom(i);
              clearInterval(wait);
            }
          }, 1000);
          break;
        } else {
          socket.join(i);
          enterRoom(i);
          break;
        }
      }
    }
  });

  socket.on("leave", async (roomId) => deleteRoom(roomId));

  socket.on("message", async (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size < 2) {
      deleteRoom(roomId);
    } else {
      io.to(roomId).emit("message", chatting[roomId]);
    }
  });

  socket.on("send", async (roomId, content) => {
    chatting[roomId].push({ user: socket.id, content: content });
  });
});
