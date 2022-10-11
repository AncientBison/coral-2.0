const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
// const email = require("./email")
// const database = require("./database.js")

// email.sendEmail("isb271@students.needham.k12.ma.us", "I like pie!");

// exampleUser = {
  // "username": "John Doe",
  // "email": "john.doe@example.com",
  // "password": "dv cng edfascxvd gv nhhngcbpassword"
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/" + HOME_PAGE);
});

app.get('*', function(req, res) {
  res.sendFile(__dirname + "/client" + req.params[0]);
});

function getRoomsForSocket(socket) {
  return Array.from(socket.rooms.values());
}

io.on("connection", (socket) => {
  let user = new User(socket);
  let id = socket.id;
  users.push({
    id: user
  });

  socket.join("Room 1")
  
  socket.data.username = "";
  
  socket.once("setUsername", (username) => {
    socket.data.username = username;
  });
  
  socket.on("message", (username, text) => {
  console.log(`New message received:
              username: ${username}
              text: ${text}`);
    
    io.in(getRoomsForSocket(socket)).emit("message", username, text);
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
  });

});


server.listen(3000, () => {
  console.log("listening on *:3000");
});

//Make socket remeber room using data. Then use that to emit with ".in()"