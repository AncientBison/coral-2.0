import Cookies from "/libraries/cookies-js/js.cookie.mjs"

Object.defineProperty(Element.prototype, "outerHeight", {
  "get": function() {
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

let canSendUsername = true;

let room = "1";

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

socket.on("message", (username, text) => { //NEVER SENDS MESSAGE! PROBLEM WITH ENTER CASE?
  debug(`New message received:
              username: ${username}
              text: ${text}`);
  let message = new Message(username, text);
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

window.onload = function() {
  if (!isDeviceiOS()) {
    document.getElementById("navbar").classList.add("bottom-fixed");
  }
  messageElement = document.getElementById("message");
  messageElement.focus();
  setupUsernameEntrace();
}

function setupUsernameEntrace() {
  document.getElementById("message-start").innerText = ">Enter Username:";
}

function getSelectionStart() {
  let node = document.getSelection().anchorNode;
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

let incorrectFormatErroring = false;

function incorrectInputFormat(reason) {
  let triedUsername = messageElement.innerText;
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

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

addEventListener("load", () => {
  messageElement.addEventListener("input", function(event) {

    if (event.key == "Enter" || messageElement.innerHTML.includes("<br><br>")) { //messageElement.innerHTML.includes("<br><br>") fixes Android enter issue.

      debug(username);
      
      event.preventDefault();
      if (username == "" && canSendUsername) {
        if (checkUsernameIncorrectFormat()) {
          incorrectInputFormat(checkUsernameIncorrectFormat());
        } else {
          getAndSendUsername();
        }
      } else if (!incorrectFormatErroring) {
        let text = messageElement.innerText;
        sendMessage(new Message(username, text));
        messageElement.innerText = "";
      }
    }
    
    if (getSelectionStart() != messageElement) {
      sendCaretToEndOfMessageElement();
    }

    // document.getElementById("debug-mobile").innerText = escapeHtml(messageElement.innerHTML);

    console.log(messageElement.innerHTML)

  });
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

// messageElement.addEventListener("keydown", function(event) {
  
// });

document.addEventListener("mouseup", function() {
  messageElement.focus();
});

document.addEventListener("keypress", function() {
  messageElement.focus();
});

const scrollContainer = document.getElementById("navbar");

scrollContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
}, {passive: true});

function joinRoom(roomLocation) {
  if (roomLocation != room) {
    socket.emit("change room", roomLocation);
    clearMessageLog();
    room = roomLocation;
    debug(`Joined room: ${roomLocation}`);
  }
}

for (let element of document.getElementsByClassName("room-element")) {
  element.addEventListener("click", () => {
    document.getElementById("room" + room).classList.remove("active");
    element.classList.add("active");

    joinRoom(element.dataset.to);
  });
}

window.addEventListener("resize", () => {
  document.getElementById("messages").style.maxHeight = window.innerHeight - document.getElementById("navbar").offsetHeight - document.getElementById("messages").outerHeight + "px";
  scrollToBottomOfMessages();
});

//sidebar
const sidebar = document.getElementById('sidebar');
const button = document.getElementById('toggle');

button.addEventListener('click', _ => {
  sidebar.classList.toggle('collapsed');
});