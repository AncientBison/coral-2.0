import Cookies from "/libraries/cookies-js/js.cookie.mjs"

const socket = io();

var connected = false;

var messagesShown = 0;

var username = "";

var messageElement;

const DEBUG = false;

var canSendUsername = true;


// if (Cookies.get("style") == undefined) {
  // socket
// }

function debug(text) {
  if (DEBUG) {
    console.log(text)
  }
}

class Message {  
  constructor(username, text) {
    this.username = username;
    this.text = text;
  }

  toString() {
    return `{${this.username}}: ${this.text}`;
  }
}

socket.on("connect", () => {
  connected = true;
  debug("Sucsessfully Connected to the Socket.");
});

socket.on("disconnect", () => {
  connected = false;
  debug("Disconnected from the Socket.");
});

socket.on("message", (username, text) => { //NEVER SENDS MESSAGE! PROBLEM WITH ENTER CASE?
  debug(`New message received:
              username: ${username}
              text: ${text}`);
  var message = new Message(username, text);
  addMessage(message);
});

async function sendUsername() {
  debug(`Set username to: ${username}`)
  socket.emit("setUsername", username);
}

async function sendMessage(message) {
  if (username == "") {
    return "No username";
  } else {
      debug(`New message sent:
            username: ${username.trim()}
            text: ${message.text}`);
    socket.emit("message", message.username.trim(), message.text);
  }
}

const MESSAGE_OVERFLOW_STYLE = "scroll" //"remove"

function cleanMessageLog() {
  if (MESSAGE_OVERFLOW_STYLE == "scroll") {
    console.log(document.getElementById("messages").scrollHeight);
    document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
  } else {
    if (messagesShown >= 10) {
      messageElement.parentNode.children[0].remove();
      messagesShown -= 1;
    }
  }
}

function addMessage(message) {
  if (MESSAGE_OVERFLOW_STYLE == "remove") {
    messagesShown += 1;
  }
  var paragraph = document.createElement("p");
  var text = document.createTextNode(message.toString());
  paragraph.appendChild(text);
  var messages = document.getElementById("messages");
  messages.insertBefore(paragraph, document.getElementById("message-start"));
  cleanMessageLog();
}

window.onload = function() {
  messageElement = document.getElementById("message");
  messageElement.focus();
  setupUsernameEntrace();
}

function setupUsernameEntrace() {
  document.getElementById("message-start").innerText = ">Enter Username:";
}

function getSelectionStart() {
  var node = document.getSelection().anchorNode;
  return (node.nodeType == 3 ? node.parentNode : node);
}

function getAndSendUsername() {
  username = messageElement.innerText;
  messageElement.innerText = "";
  document.getElementById("message-start").innerText = ">";
  sendUsername();
}

function sendCaretToEndOfMessageElement() {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(messageElement);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  messageElement.focus();
  range.detach();
  messageElement.scrollTop = messageElement.scrollHeight;
}

const SHOW_ERROR_TIME = 500;

var incorrectFormatErroring = false;

function incorrectInputFormat(reason) {
  var triedUsername = messageElement.innerText;
  messageElement.setAttribute("contenteditable", "");
  messageElement.setAttribute("style", "color: red; caret-color: transparent;"); //TODO: Change when style works.
  messageElement.innerText = reason;
  canSendUsername = false;
  incorrectFormatErroring = true;
  setTimeout(function() {
    messageElement.setAttribute("contenteditable", "true");
    messageElement.setAttribute("style", ""); //TODO: Change when style works.
    messageElement.innerText = triedUsername;
    sendCaretToEndOfMessageElement();
    canSendUsername = true;
    incorrectFormatErroring = false;
  }, SHOW_ERROR_TIME);
}

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 25;

document.addEventListener("keypress", function(event) {
  messageElement.focus();
  
  if (event.key == "Enter") {
    debug(username);
    event.preventDefault();
    if (username == "" && canSendUsername) {
      if (checkUsernameIncorrectFormat()) {
        incorrectInputFormat(checkUsernameIncorrectFormat());
      } else {
        getAndSendUsername();
      }
    } else if (!incorrectFormatErroring) {
      var text = messageElement.innerText;
      sendMessage(new Message(username, text));
      messageElement.innerText = "";
    }
  }
  
  if (getSelectionStart() != messageElement) {
    sendCaretToEndOfMessageElement();
  }
});

function checkUsernameIncorrectFormat() {
switch (true) {
  case messageElement.innerText.trim().length <= MIN_USERNAME_LENGTH:
    return `Username must be more than ${MIN_USERNAME_LENGTH} characters.`;
  case messageElement.innerText.trim().length >= MAX_USERNAME_LENGTH:
    return `Username must be less than ${MAX_USERNAME_LENGTH} characters.`;
  case /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(messageElement.innerText):
    return `Username cannot contain emojis.`;
  default:
    ""
  }
}

const scrollContainer = document.getElementById("navbar");

scrollContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
});