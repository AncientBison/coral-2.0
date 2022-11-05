const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const SALT_ROUNDS = 10;

var maxMessageLogMemory = 10;

function setMaxMessageLogMemory(newValue) {
  maxMessageLogMemory = newValue;
}

const User = mongoose.model("User", {
  username: String, 
  password: String, 
  email: String, 
  notifications: String, 
  session: String
});

const MessageSchema = new mongoose.Schema({
  username: String,
  text: String
});

const Message = mongoose.model("Message", MessageSchema);

const Room = mongoose.model("Room", {
  name: String,
  messages: [MessageSchema]
});

mongoose.connect(
  process.env.MONGO_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "coral"
  }
);

mongoose.connection.on('error', function(error) {
  console.log(error);
});

mongoose.connection.on('connected', async function() {
  console.log("Database connected.");

  // encoded = await validateSaltAndHash("ilikepies!", await saltAndHash("ilikepie!"));

  // console.log(encoded);

  // const exampleUserJSON = {
  //   "username": "John Doe",
  //   "password": "passw0rd",
  //   "email": "john.doe@example.com"
  // };

  // const exampleMessageJSON = {
  //   "username": "John Doe",
  //   "text": "Test232!"
  // };
  // exampleUser.save().then(()

  // newMessage(exampleMessageJSON, "Room 1425");

  // console.log(await getUserFromUsername("John Doe"));
  // console.log(await getMessages("Room 1425"))
});

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 25;

function checkUsernameIncorrectFormat(username) {
  switch (true) {
    case username.trim().length <= MIN_USERNAME_LENGTH:
      return `Username must be more than ${MIN_USERNAME_LENGTH} characters.`;
    case username.trim().length >= MAX_USERNAME_LENGTH:
      return `Username must be less than ${MAX_USERNAME_LENGTH} characters.`;
    case /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(username):
      return "Username cannot contain emojis.";
    default:
      return "";
  }
}

function isValidEmail(email) {
  return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g.test(email);
}

async function saltAndHash(password) {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

async function validateSaltAndHash(password, savedPassword) {
  const result = bcrypt.compareSync(password, savedPassword);
  return result;
}   

async function signIn(user) {
  let userExists = await User.exists({
    username: user.username
  });
  
  if (userExists == null) {
    return {"result": "No user with that username found.", "triedData": user.username, "success": false};
  }

  let savedUser = await getUserFromUsername(user.username);

  let isCorrectPassword = await validateSaltAndHash(user.password, savedUser.password);
  
  if (isCorrectPassword) {
    return {"result": "Correct password.", "triedData": user.username, "success": true};
  } else {
    return {"result": "Incorrect password.", "triedData": user.username, "success": false};
  }
}

async function signUp(user) {
  const userModel = new User({
    "username": user.username, 
    "password": await saltAndHash(user.password), 
    "email": user.email, 
    "notifications": "email", 
    "session": createNewSessionKey()
  });

  let userExists = await User.exists({
    username: user.username
  });

  let result;
  
  if (userExists != null) {
    return {"result": "User with that username already exists.", "triedData": user.username, "success": false};
  }

  //Validate username format
  if (checkUsernameIncorrectFormat(user.username)) {
    return {"result": checkUsernameIncorrectFormat(user.username), "triedData": user.username, "success": false}
  }

  if (!isValidEmail(user.email)) {
    return {"result": "That email is not valid.", "triedData": user.username, "success": false}
  }
  
  await userModel.save().then(savedUser => {
    console.log(`Saved user successfully.
      Username: ${savedUser.username}
      Email: ${savedUser.email}`);
    result = {"result": "Saved", "triedData": savedUser.username, "success": true};
  }).catch(err => {
    console.log("Error saving user: " + err);
    result = {"result": "Failed", "triedData": user.username, "success": false};
  });
  
  return result;
}

async function getUserFromUsername(username) {
  let user = await User.findOne({"username": new RegExp(`^${RegExp.escape(username)}$`)});
  
  if (user == null) {
    return "No user found";
  }
  
  return user;
}

async function getEmailFromUsername(username) {
  let user = await getUserFromUsername(username);

  return user.email;
}

async function createNewSessionIdForUser(username) {
  let sessionId = createNewSessionId();

  await User.updateOne({"username": username}, {"session": sessionId}).then(result => {
    result = {"result": "Saved", "session": sessionId, "success": true};
  }).catch(err => {
    console.log(err);
    result = {"result": "Failed", "session": sessionId, "success": false};
  });
}

async function createRoom(room) {
  // return await Room.create({"name": room, "messages": []}).then(result => {
  //   return result;
  // });
  return new Promise(function(resolve, reject) {
    Room.create({"name": room, "messages": []}, function (err, result) {
      if (err) {
        console.log(err);
        reject();
        return;
      }

      resolve(result);
    });
  });
}

async function newMessage(message, room) {
  const messageModel = new Message(message);

  let roomExists = await Room.exists({
    "name": room
  });

  // console.log(roomExists);
  let roomLocated = null;
  let result;
  if (!roomExists) {
    await createRoom(room).then(roomLocated => {
      roomLocated.updateOne({"$push": {"messages": {"$each": [messageModel], "$slice": -maxMessageLogMemory}}}).then(message => {
        result = "Saved";
      }).catch(err => {
        console.log(err);
        result = "Failed";
      });
    }).catch(err => {
      console.log(err);
      result = "Rejected";
    });

    return result;
  }

  // console.log(await Room.exists({
  //   "name": room
  // }));

  Room.updateOne({"name": room}, {"$push": {"messages": {"$each": [messageModel], "$slice": -maxMessageLogMemory}}}, function(err, result) {
    if (err) {
      console.log(err);
      return "Failed";
    } else {
      return "Saved";
    }
  });
  // Room.updateOne({name: room}, {$push: {messages: [messageModel]}}, function(err, result) {
  //   if (err) {
  //     console.log(err);
  //     return "Failed";
  //   } else {
  //     console.log(result);
  //     return "Saved";
  //   }
  // });
}

async function changeNotificationForUser(username, newNotificationMode) {
  let result;

  await User.updateOne({"username": username}, {"notifications": newNotificationMode}).then(result => {
    result = "Saved";
  }).catch(err => {
    console.log(err);
    result = "Failed";
  });

  return result;
}

async function getMessages(room) {
  let roomDocument = await Room.findOne({"name": room}).exec();
  
  if (!roomDocument) {
    await createRoom(room).then((roomLocated) => {
      return roomLocated.messages;
    });
  }

  return roomDocument.messages;
}

async function getUsersWithEmailNotificationEmails() {
  let usersMatched = await User.find({"notifications": "email"}).exec();
  let emails = usersMatched.map(_ => _.email);
  return emails;
}

module.exports = {
  signUp: signUp,
  signIn: signIn,
  getUser: getUserFromUsername,
  newMessage: newMessage, 
  getMessages: getMessages, 
  setMaxMessageLogMemory: setMaxMessageLogMemory, 
  changeNotificationForUser: changeNotificationForUser, 
  getUsersWithEmailNotificationEmails, getUsersWithEmailNotificationEmails
};