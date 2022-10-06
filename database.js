const Database = require("@replit/database")
const db = new Database()

function initiateDatabase() {
  if (db.get("users")))
  db.set("users", []);
}

async function updateUser(entry, database) {
  var user = getUserByName(entry.name);

  if (user == "No User Found") {
    database.users.push(entry);
    return "Added User"
  } else {
    database.users[user] = entry;
    return "Updated User"
  }
}

async function getUsersFromDatabase() {
  db.get("users").then(value => {return JSON.parse(value)});
}

async function setUsersInDatabase(value) {
  db.set("users", value).then(() => {});
}

async function databaseOperation(operation, value) {
  var db = getUsersFromDatabase();
  var returnValue = operation(value, db);
  setUsersInDatabase(db);
  return returnValue;
}

async function getUserByName(name, database) {
  var returnValue = null;
  database.users.every((user) => {
    if (user.username == name) {
      returnValue = user;
      return false;
    }
  });

  if (returnValue == null) {
    return "No User Found";
  }
  
  return returnValue;
}

async function _addUser(entry) {
  databaseOperation(updateUser, (entry));
}

async function _getUserByName(name) {
  return databaseOperation(getUserByName, (name));
}

module.exports = {
  addUser: _addUser,
  getUser: _getUserByName
};