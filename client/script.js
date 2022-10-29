import Cookies from "/libraries/cookies-js/js.cookie.mjs"

Object.defineProperty(Element.prototype, "outerHeight", {
  "get": function () {
    var height = this.clientHeight;
    var computedStyle = window.getComputedStyle(this);
    height += parseInt(computedStyle.marginTop, 10);
    height += parseInt(computedStyle.marginBottom, 10);
    height += parseInt(computedStyle.borderTopWidth, 10);
    height += parseInt(computedStyle.borderBottomWidth, 10);
    return height;
  }
});

const socket = io();

let connected = false;

let messagesShown = 0;

let username = "";

let messageElement;

const DEBUG = true;

let room = "1";

let settingsOpen = false;

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

function isDeviceiOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}


socket.on("connect", () => {
  connected = true;
  debug("Sucsessfully Connected to the Socket.");
});

socket.on("disconnect", () => {
  connected = false;
  debug("Disconnected from the Socket.");
});

socket.on("message", (username, text) => {
  debug(`New message received:
              username: ${username}
              text: ${text}`);
  let message = new Message(username, text);
  addMessage(message);
});

async function sendMessage(message) {
  if (username == "") {
    return "No username";
  } else {
    debug(`New message sent:
            username: ${username}
            text: ${message.text}`);
    socket.emit("message", message.username, message.text);
  }
}

const MESSAGE_OVERFLOW_STYLE = "scroll" //"remove"

function scrollToBottomOfMessages() {
  document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight);
}

function cleanMessageLog() {
  if (MESSAGE_OVERFLOW_STYLE == "scroll") {
    scrollToBottomOfMessages();
  } else {
    if (messagesShown >= 10) {
      messageElement.parentNode.children[0].remove();
      messagesShown -= 1;
    }
  }
}

function clearMessageLog() {
  Array.from(document.getElementsByClassName("message")).forEach(message => {
    message.remove();
  });

  messagesShown = 0;
}

function addMessage(message) {
  if (MESSAGE_OVERFLOW_STYLE == "remove") {
    messagesShown += 1;
  }

  let paragraph = document.createElement("p");
  let text = document.createTextNode(message.toString());
  paragraph.appendChild(text);
  paragraph.classList.add("message");
  let messages = document.getElementById("messages");
  messages.insertBefore(paragraph, document.getElementById("message-start"));
  cleanMessageLog();
}

window.onload = function () {
  if (!isDeviceiOS()) {
    document.getElementById("navbar").classList.add("bottom-fixed");
  }
  messageElement = document.getElementById("message");
  messageElement.focus();
}

function getSelectionStart() {
  let node = document.getSelection().anchorNode;
  return (node.nodeType == 3 ? node.parentNode : node);
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

let incorrectFormatErroring = false;

function incorrectInputFormat(reason) {
  let triedContent = messageElement.innerText;
  messageElement.setAttribute("contenteditable", "");
  messageElement.setAttribute("style", "color: red; caret-color: transparent;"); //TODO: Change when style works.
  messageElement.innerText = reason;
  incorrectFormatErroring = true;
  setTimeout(function () {
    messageElement.setAttribute("contenteditable", "true");
    messageElement.setAttribute("style", ""); //TODO: Change when style works.
    messageElement.innerText = triedContent;
    sendCaretToEndOfMessageElement();
    incorrectFormatErroring = false;
  }, SHOW_ERROR_TIME);
}

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 25;

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

addEventListener("load", () => {
  messageElement.addEventListener("input", function (event) {

    if (event.key == "Enter" || messageElement.innerHTML.includes("<br><br>")) { //messageElement.innerHTML.includes("<br><br>") fixes Android enter issue.
      event.preventDefault();
      
      let text = messageElement.innerText;
      sendMessage(new Message(username, text));
      messageElement.innerText = "";
    }
    
    if (getSelectionStart() != messageElement) {
      sendCaretToEndOfMessageElement();
    }

    // document.getElementById("debug-mobile").innerText = escapeHtml(messageElement.innerHTML);

  });
});

function checkUsernameIncorrectFormat() {
  switch (true) {
    case messageElement.innerText.trim().length <= MIN_USERNAME_LENGTH:
      return `Username must be more than ${MIN_USERNAME_LENGTH} characters.`;
    case messageElement.innerText.trim().length >= MAX_USERNAME_LENGTH:
      return `Username must be less than ${MAX_USERNAME_LENGTH} characters.`;
    case /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(messageElement.innerText):
      return "Username cannot contain emojis.";
    default:
      return "";
  }
}

// messageElement.addEventListener("keydown", function(event) {

// });

document.addEventListener("mouseup", function () {
  if (!settingsOpen) {
    messageElement.focus();
  }
});

document.addEventListener("keypress", function () {
  if (!settingsOpen) {
    messageElement.focus();
  }
});

const scrollContainer = document.getElementById("navbar");

scrollContainer.addEventListener("wheel", (evt) => {
  evt.preventDefault();
  scrollContainer.scrollLeft += evt.deltaY;
}, { passive: true });

function joinRoom(roomLocation) {
  if (roomLocation != room) {
    socket.emit("change room", roomLocation);
    clearMessageLog();
    room = roomLocation;
    debug(`Joined room: ${roomLocation}`);
  }
}

let oldRoomElementID = "room" + room;

for (let element of document.getElementsByClassName("navbar-navigation")) {
  element.addEventListener("click", () => {
    document.getElementById(oldRoomElementID).classList.remove("active");
    element.classList.add("active");
    oldRoomElementID = element.id;
    
    if (element.classList.contains("room-element")) {
      joinRoom(element.dataset.to);
      openMessages();
    }

    if (element.id == "account-button") {
      openSettings();
    }
  });
}

window.addEventListener("resize", () => {
  // console.log(window.innerHeight - document.getElementById("navbar").offsetHeight - document.getElementById("messages").outerHeight);
  // console.log(document.getElementById("navbar").offsetHeight);
  // console.log(document.getElementById("messages").outerHeight);
  document.getElementById("messages").style.maxHeight = window.innerHeight - document.getElementById("navbar").offsetHeight - (document.getElementById("messages").outerHeight - document.getElementById("messages").offsetHeight) + "px";
  scrollToBottomOfMessages();
});

function openSettings() {
  document.getElementById("account").classList.remove("hidden");
  document.getElementById("messages").classList.add("hidden");
  settingsOpen = true;
 }

function openMessages() {
  document.getElementById("account").classList.add("hidden");
  document.getElementById("messages").classList.remove("hidden");
  settingsOpen = false;
}

//Settings

let signedIn = false;
let signingInOrUp = "sign in";

function getUserInfo() {
  // exampleUser = {
  // "username": "John Doe",
  // "email": "john.doe@example.com",
  // "password": "p4ssw0rd"
  // }
  return {
    "username": document.getElementById("username").value, 
    "password": document.getElementById("password").value,
    "email": document.getElementById("email").value
  }
}

async function signInOrUp() {
  if (signingInOrUp == "sign in") {
    await socket.emit("sign in", getUserInfo());
  } else {
    await socket.emit("sign up", getUserInfo());
  }
}

socket.on("sign in result", function(result) {
  if (result.success) {
    username = result.triedData.username;
    console.log(result);
  } else {
    document.getElementById("validator").classList.remove("hidden");
    document.getElementById("validator").innerText = result.result;
  }
});

document.getElementById("element-selector").addEventListener("change", function() {
  if (document.getElementById("element-selector").value == "signIn") {
    document.getElementById("email-box").classList.add("hidden");
    signingInOrUp = "sign in";
  } else {
    document.getElementById("email-box").classList.remove("hidden");
    signingInOrUp = "sign up";
  }
});

document.getElementById("settings-confirm").addEventListener("click", function() {
  if (signedIn) {
    signOut();
    return;
  }
  
  signInOrUp();
  
});