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

function stringifyMessage(message) {
  if (message.direct) {
    return `${message.username} -> ${message.to}: ${message.text}`;
  } else {
    return `{${message.username}}: ${message.text}`;
  }
}

// class Message {
//   constructor(username, text) {
//     this.username = username;
//     this.text = text;
//   }

//   toString() {
//     return `{${this.username}}: ${this.text}`;
//   }
// }

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

socket.on("session result", (result) => {
  if (result.succes) {
    username = result.username;
  }
});

socket.on("connect", () => {
  connected = true;
  debug("Sucsessfully Connected to the Socket.");
  if (localStorage.getItem("sessionId")) {
    socket.emit("old session", localStorage.getItem("sessionId"));
    signedIn = true;
  }
});

socket.on("disconnect", () => {
  connected = false;
  debug("Disconnected from the Socket.");
});

socket.on("message", (messageRecived) => {
  debug(`New message received:
              username: ${messageRecived.username}
              text: ${messageRecived.text}`);``
  addMessage(messageRecived);
});

async function sendMessage(message) {
  if (message.to == "" && message.direct) {
    return "No reciver";
  } else {
    debug(`New message sent:
            text: ${message.text}`);
    socket.emit("message", message);
  }
}

const MESSAGE_OVERFLOW_STYLE = "scroll"; //"remove"

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

function createMessageElement(message) {
  let paragraph = document.createElement("p");
  let text = document.createTextNode(stringifyMessage(message));
  paragraph.appendChild(text);
  paragraph.classList.add("message");

  return paragraph;
}

function appendMessage(message) {
  if (MESSAGE_OVERFLOW_STYLE == "remove") {
    messagesShown += 1;
  }
  
  let messages = document.getElementById("messages");
  messages.insertBefore(createMessageElement(message), document.getElementById("message-start"));
  cleanMessageLog();
}

function addMessage(message) {
  appendMessage(message);
}

window.onload = function () {
  if (!isDeviceiOS()) {
    document.getElementById("navbar").classList.add("bottom-fixed");
  }
  messageElement = document.getElementById("message");
  messageElement.focus();
  resizeMessages();
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
      sendMessage({"text": text});
      messageElement.innerText = "";
    }
    
    if (getSelectionStart() != messageElement) {
      sendCaretToEndOfMessageElement();
    }

    // document.getElementById("debug-mobile").innerText = escapeHtml(messageElement.innerHTML);

  });
});

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

let oldRoomElementId = "room" + room;

for (let element of document.getElementsByClassName("navbar-navigation")) {
  element.addEventListener("click", () => {
    document.getElementById(oldRoomElementId).classList.remove("active");
    element.classList.add("active");
    oldRoomElementId = element.id;
    
    if (element.classList.contains("room-element")) {
      joinRoom(element.dataset.to);
      openMessages();
    }

    if (element.id == "account-button") {
      openSettings();
    }
  });
}

window.addEventListener("resize", resizeMessages);

function resizeMessages() {
  document.getElementById("messages").style.maxHeight = window.innerHeight - document.getElementById("navbar").offsetHeight - (document.getElementById("messages").outerHeight - document.getElementById("messages").offsetHeight) + "px";
  scrollToBottomOfMessages();
}

function openSettings() {
  document.getElementById("account").classList.remove("hidden");
  document.getElementById("messages").classList.add("hidden");
  settingsOpen = true;
 }

function openMessages() {
  document.getElementById("account").classList.add("hidden");
  document.getElementById("messages").classList.remove("hidden");
  settingsOpen = false;
  resizeMessages();
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

function signOut() {
  signedIn = false;
  document.getElementById("settings-confirm").innerText = "Comfirm";
  document.getElementById("main-account-settings").classList.remove("hidden");
  document.getElementById("settings-confirm").classList.remove("button-3-red");
  document.getElementById("secondary-account-settings").classList.add("hidden");  
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
    signedIn = true;
    document.getElementById("settings-confirm").innerText = "Sign Out";
    document.getElementById("main-account-settings").classList.add("hidden");
    document.getElementById("settings-confirm").classList.add("button-3-red");
    document.getElementById("validator").classList.add("hidden");
    document.getElementById("secondary-account-settings").classList.remove("hidden");
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

//Notifications
let notificationMode = "normal";

document.getElementById("notification-mode-selector").addEventListener("change", function() {
  socket.emit("notification mode change", document.getElementById("notification-mode-selector").value);
  notificationMode = document.getElementById("notification-mode-selector").value;
});