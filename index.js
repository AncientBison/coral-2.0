const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');
// const email = require("./email")
const database = require("./database.js")
require('dotenv').config()

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

database.setMaxMessageLogMemory(MAX_MESSAGE_LOG_MEMORY);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/" + HOME_PAGE);
});

app.get('*', function (req, res) {
  res.sendFile(__dirname + "/client" + req.params[0]);
});

async function populateRoomMessagesToUser(socket, room) {
  console.log(room);
  try {
    let messages = await database.getMessages(room);
    for (let message of messages) {
      socket.emit("message", message.username, message.text);
    }
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

  socket.on("message", (username, text) => {
    console.log(`New message received:
              username: ${username}
              text: ${text}`);

    if (username == socket.data.username) {
      io.in(getRoomsForSocket(socket)).emit("message", username, text);
      for (room of getRoomsForSocket(socket)) {
        database.newMessage({ "username": username, "text": text }, room);
      }
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

  socket.on("sign in", async (userInfo) => {
    let result = await database.signIn(userInfo);
    socket.emit("sign in result", result);
    
    if (result.success) {
      socket.data.username = userInfo.username;
    }
  });

  socket.on("sign up", async (userInfo) => {
    let result = await database.signUp(userInfo);
    console.log("signing up");
    socket.emit("sign in result", result);
    if (result.success) {
      socket.data.username = userInfo.username;
    }
  });

});


server.listen(3000, () => {
  console.log("listening on *:3000");
});

//Make socket remeber room using data. Then use that to emit with ".in()"