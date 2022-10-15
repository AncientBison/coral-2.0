const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');
// const email = require("./email")
const database = require("./database.js")

// email.sendEmail("isb271@students.needham.k12.ma.us", "I like pie!");

// exampleUser = {
// "username": "John Doe",
// "email": "john.doe@example.com",
// "password": "p4ssw0rd"
// }

// database.addUser(exampleUser);

class User {
  constructor(socket) {
    this.socket = socket;
  }
}

let users = [];

const HOME_PAGE = "index.html"

const DEFAULT_ROOM = "Room 1"

const MAX_MESSAGE_LOG_MEMORY = 100;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/" + HOME_PAGE);
});

app.get('*', function (req, res) {
  res.sendFile(__dirname + "/client" + req.params[0]);
});

function populateRoomMessagesToUser(socket, room) {
  try {
    let data = JSON.parse(fs.readFileSync(room + ".json"));
    for (message of data.messages) {
      socket.emit("message", message.username, message.text);
    }
    // socket.emit("message", username, text);
  } catch (error) {
    return;
  }
}

function logNewMessage(message, room) {
  try {
    fs.writeFileSync(room + ".json", (function getNewData() {
      let oldData = JSON.parse(fs.readFileSync(room + ".json"));
      oldData.messages.push(message);
      if (oldData.messages.length > MAX_MESSAGE_LOG_MEMORY) {
        oldData.messages.shift();
      }
      return JSON.stringify(oldData, null, 2);
    })()); //Sync is bad practice, change this later.
  } catch (error) {
    return;
  }
}

function getRoomsForSocket(socket) {
  return Array.from(socket.rooms.values());
}

io.on("connection", (socket) => {
  let user = new User(socket);
  let id = socket.id;
  users.push({
    id: user
  });

  socket.join(DEFAULT_ROOM);

  populateRoomMessagesToUser(socket, DEFAULT_ROOM);

  socket.data.username = "";

  socket.once("setUsername", (username) => {
    socket.data.username = username;
  });

  socket.on("message", (username, text) => {
    console.log(`New message received:
              username: ${username}
              text: ${text}`);


    io.in(getRoomsForSocket(socket)).emit("message", username, text);
    for (room of getRoomsForSocket(socket)) {
      logNewMessage({ "username": username, "text": text }, room);
    }
  });

  socket.once("disconnect", () => {
    user = users.find(o => o.id === id);
    delete user;
  });

  socket.on("change room", (roomNumber) => {
    socket.leave("Room 1");
    socket.leave("Room 2");
    socket.leave("Room 3");
    socket.leave("Room 4");
    socket.leave("Room 5");
    // Make dynamic.
    socket.join("Room " + roomNumber);

    console.log(`User: ${socket.data.username} is now in rooms ${getRoomsForSocket(socket)}`);

    populateRoomMessagesToUser(socket, "Room " + roomNumber);
  });

});


server.listen(3000, () => {
  console.log("listening on *:3000");
});

//Make socket remeber room using data. Then use that to emit with ".in()"