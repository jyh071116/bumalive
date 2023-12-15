const socket = io();
let roomId = undefined;

const broadcast = document.getElementById("broadcast");
const disconnect = document.getElementById("disconnect");
const connect = document.getElementById("connect");
const message = document.getElementById("message");
const inputForm = document.getElementById("inputForm");
const clientCount = document.getElementById("clientCount");
const cancel = document.getElementById("cancel");
const text = document.getElementById("text");
const main = document.getElementById("chatbox_main");
const connects_button = document.querySelector(".connects_button");

const joinRoom = async () => {
  console.log("방찾기");
  broadcast.innerHTML = "찾는 중...";
  connect.style.display = "none";
  cancel.style.display = "block";
  message.innerHTML = "";
  await socket.emit("join");
  socket.on("broadcast", (res) => {
    roomId = res.roomId;
    broadcast.innerHTML = res.msg;
    message.innerHTML = "";
    cancel.style.display = "none";
    disconnect.style.display = "block";
    inputForm.style.display = "block";
  });
};

const sendMessage = async (content) => {
  if (!content.trim()) {
    return;
  }
  await socket.emit("send", roomId, content);
};

connect.addEventListener("click", () => joinRoom());

disconnect.addEventListener("click", () => socket.emit("leave", roomId));

inputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(e.target.children[0].value);
  e.target.children[0].value = "";
});

cancel.addEventListener("click", () => socket.emit("cancel"));

socket.on("message", (res) => {
  res = res.map((chat) => {
    if (chat.user == socket.id) {
      chat.user = "나";
      chat.color = "#597EFF";
    } else {
      chat.user = "상대방";
      chat.color = "black";
    }
    return chat;
  });

  let resMessage = ``;
  res.forEach((msg) => {
    resMessage += `<div style="color: ${msg.color};"><span style="font-weight: 600">${msg.user}</span>: ${msg.content}</div>`;
  });

  message.innerHTML = resMessage;
});

socket.on("leave", () => {
  roomId = undefined;
  broadcast.innerHTML = "";
  disconnect.style.display = "none";
  message.innerHTML += '<p class="alert">대화가 종료되었습니다</p>';
  connect.style.display = "block";
  cancel.style.display = "none";
  inputForm.style.display = "none";
});

socket.on("clientsCount", (res) => {
  clientCount.innerHTML = `접속자 수: ${res}명`;
});

setInterval(async () => {
  main.scrollTop = main.scrollHeight;
  await socket.emit("clientsCount");
  if (typeof roomId === "number") {
    await socket.emit("message", roomId);
  }
}, 100);
