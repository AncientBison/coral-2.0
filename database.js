const mongoose = require("mongoose");
const bcrypt = require ("bcrypt");

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const saltRounds = 10;

const MAX_MESSAGES_MEMORY_LOG = 10;

const User = mongoose.model("User", {
  username: String, 
  password: String, 
  email: String
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

  const exampleUserJSON = {
    "username": "John Doe",
    "password": "passw0rd",
    "email": "john.doe@example.com"
  };

  const exampleMessageJSON = {
    "username": "John Doe",
    "text": "Test!"
  };
  // exampleUser.save().then(()

  newMessage(exampleMessageJSON, "Room 1");

  // console.log(await getUserFromUsername("John Doe"));
});

async function saltAndHash(password) {
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

async function validateSaltAndHash(password, savedPassword) {
  const result = bcrypt.compareSync(password, savedPassword);

  return result;
}   

async function signIn(user) {
  const userModel = new User({
    "username": user.username, 
    "password": await saltAndHash(user.password), 
    "email": user.email
  });

  var userExists = await User.exists({
    username: user.username, 
    email: user.email
  });
  
  if (userExists != null) {
    
    oldUser = await getUserFromUsername(user.username);

    var correctPassword = await validateSaltAndHash(user.password, oldUser.password);

    if (correctPassword) {
      return "Correct password";
    } else {
      return "Incorrect password";
    }
    
  }

  return "No user found";
}

async function signUp(user) {
  const userModel = new User({
    "username": user.username, 
    "password": await saltAndHash(user.password), 
    "email": user.email
  });

  var userExists = await User.exists({
    username: user.username, 
    email: user.email
  });

  console.log(userExists);
  
  if (userExists != null) {
    return "User already exists";
  }
  
  userModel.save(function(err) {
    if (err) {
      console.log("Error saving user: " + err);
      return "Failed";
    }

    console.log(`Saved user sucsessfully.
      Username: ${user.username}
      Email: ${user.email}`);
    return "Saved";
  });
}

async function getUserFromUsername(username) {
  var user = await User.findOne({name: new RegExp(`^${RegExp.escape(username)}$`)});
  
  if (user == null) {
    return "No user found";
  }
  
  return user;
}

async function newMessage(message, room) {
  const messageModel = new Message(message);

  var roomExists = await Room.exists({
    "name": room
  });

  console.log(roomExists);
  if (!roomExists) {
    return "No room found";
  }

  Room.update({"name": room}, {"$push": {"messages": {"$each": [messageModel], "$slice": -MAX_MESSAGES_MEMORY_LOG}}});
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

module.exports = {
  signUp: signUp,
  signIn: signIn,
  getUser: getUserFromUsername,
  newMessage: newMessage
};