const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs');
const email = require("./email")
const database = require("./database.js")
require('dotenv').config()
const uuid = require("uuid");

// console.clear();

// email.setEmailAccount(process.env['emailAccount']);
// email.setEmailPassword(process.env['emailPassword'])
// email.sendEmail("ilansbernstein@gmail.com", "I like pie!");

function sendNewMessageEmail(username, text, sendTo) {
  email.sendEmail({
    subject: `New Message from ${username}`,
    text: text,
    to: sendTo,
    from: process.env.EMAIL
  });
  console.log(sendTo);
}

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
      socket.emit("message", message);
    }
  } catch (error) {
    return;
  }
}

function getRoomsForSocket(socket) {
  return Array.from(socket.rooms.values());
}

// io.use((socket, next) => {
//   try {
//     const sessionID = socket.handshake.auth.sessionID;
//     if (sessionID) {
//       // find existing session
//       const session = sessionStore.findSession(sessionID);
//       if (session) {
//         socket.sessionID = sessionID;
//         socket.userID = session.userID;
//         return next();
//       }
//     }
//     // create new session
//     socket.sessionID = uuid.v4();
//     socket.userID = uuid.v4();
//     next();
//   } catch (error) {
//     console.error(error);
//   }
// });

io.on("connection", (socket) => {
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });
  
  let user = new User(socket);
  let id = socket.id;
  users.push({
    id: user
  });

  socket.join(DEFAULT_ROOM);
  socket.data.id = uuid.v4();
  socket.join(socket.data.id);

  populateRoomMessagesToUser(socket, DEFAULT_ROOM);

  socket.data.username = "";

  socket.on("message", async (message) => {
    console.log(`New message received:
              username: ${username}
              text: ${text}`);

    if (message.username != socket.data.username) {
      return;
    }
    
    io.in(getRoomsForSocket(socket)).emit("message", message);

    for (let email of (await database.getUsersWithEmailNotificationEmails()).filter()) {
      sendNewMessageEmail(message.username, message.text, email);
    }
    
    for (let room of getRoomsForSocket(socket)) {
      database.newMessage(message, room);
    }
  });

  socket.on("old session", (sessionID) => {
    if (database.sessionStore.sessionExists(sessionID)) {
      socket.emit("session", );
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

  socket.on("sign in", async (userInfo) => {
    let result = await database.signIn(userInfo);
    socket.emit("sign in result", result);
    
    if (result.success) {
      socket.data.username = userInfo.username;
      socket.data.signedIn = true;
    }
  });

  socket.on("sign up", async (userInfo) => {
    let result = await database.signUp(userInfo);
    console.log("signing up");
    socket.emit("sign in result", result);
    if (result.success) {
      socket.data.username = userInfo.username;
      socket.data.signedIn = true;
    }
  });

  socket.on("notification mode change", (newMode) => {
    database.changeNotificationForUser(socket.data.username, newMode);
    socket.data.notifications = newMode;
  });

});


server.listen(3000, () => {
  console.log("listening on *:3000");
});

//Make socket remeber room using data. Then use that to emit with ".in()"