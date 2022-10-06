const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const email = require("./email")
// const database = require("./database.js")

// email.sendEmail("isb271@students.needham.k12.ma.us", "I like pie!");

exampleUser = {
  "username": "John Doe",
  "email": "john.doe@example.com",
  "password": "password"
}

// database.addUser(exampleUser);

class User {
  constructor(socket) {
    this.socket = socket;
  }
}

var users = [];

const HOME_PAGE = "index.html"

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/" + HOME_PAGE);
});

app.get('*', function(req, res) {
  res.sendFile(__dirname + "/client" + req.params[0]);
});

io.on("connection", (socket) => {
  var user = new User(socket);
  var id = socket.id;
  users.push({
    id: user
  });
  
  socket.data.username = "";
  
  socket.once("setUsername", (username) => {
    socket.data.username = username;
  });
  
  socket.on("message", (username, text) => {
  console.log(`New message received:
              username: ${username}
              text: ${text}`);
    
    io.emit("message", username, text);
  });
  
  socket.once("disconnect", () => {
    user = users.find(o => o.id === id);
    delete user;
  });
});


server.listen(3000, () => {
  console.log("listening on *:3000");
});