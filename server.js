const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(3000, () => {
  console.log("서버가 실행되었습니다");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  let chatting = {};

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
              io.to(i).emit("broadcast", {
                roomId: i,
                msg: i + "번 방에 입장하셨습니다",
              });
              clearInterval(wait);
            }
          }, 1000);
          break;
        } else {
          socket.join(i);
          io.to(i).emit("broadcast", {
            roomId: i,
            msg: i + "번 방에 입장하셨습니다",
          });
          break;
        }
      }
    }
  });

  socket.on("leave", async () => {
    const rooms = io.sockets.adapter.rooms;
    rooms.forEach((value, key) => {
      if (value.has(socket.id)) {
        io.sockets.adapter.rooms.delete(key);
      }
    });
  });

  // socket.on("message", () => {
  //   const rooms = io.sockets.adapter.rooms;
  //   rooms.forEach((value, key) => {
  //     if (value.has(socket.id)) {
  //       io.to(key).emit("message", chatting[key]);
  //     }
  //   });
  // });
});
