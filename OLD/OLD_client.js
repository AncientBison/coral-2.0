//socket
canSendMessage = true
var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (canSendMessage) {
    if (input.value) {
      socket.emit('chat message', `{${name}}: ${input.value}`);
      input.value = '';
    }
    canSendMessage = false;
    setTimeout(() => {canSendMessage = true}, 250);
  }
});

socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
  notifyNewMessage(msg)
});

//notifications
//-setup
function checkNotificationPromise() {
    try {
      Notification.requestPermission().then();
    } catch(e) {
      return false;
    }

    return true;
  }

//-notifier
var pageFocused = true;

window.onblur = function() {
  console.log("gause")
  pageFocused = false;
}

window.onfocus = function() {
  console.log("l9ol")
  pageFocused = true;  
}


Notification.requestPermission()

function notifyNewMessage(messageText) {
  if (Notification.permission === "granted" && !pageFocused) {
    console.log("test 1")
    var notification = new Notification("New chat message", { body: messageText});
    // var notification = new Notification("New chat message", { body: messageText, icon: img });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        n.close();
      }
    });
  }
}

//naming
name = ""

function validName(name) {
  return name.length >= 2 && name.length <= 20 ? true : false
}

var modal = document.getElementById("modal")
var bootstrapModal = new bootstrap.Modal(document.getElementById('modal'));
var nameInput = document.getElementById('name')

modal.addEventListener('shown.bs.modal', function () {
  nameInput.focus();
})

document.onreadystatechange = function () {
  bootstrapModal.show();

};

function getName() {
  return nameInput.value.trim();
}

document.getElementById("enter-name").addEventListener("click", function() {
  name = getName()
  socket.emit('name', name);
});

document.getElementById("name").addEventListener("keypress", function(key) {
  if (!validName(getName())) {
    document.getElementById("enter-name").setAttribute("disabled", "")
  } else {
    document.getElementById("enter-name").removeAttribute("disabled", "")
  }
  
  if (key.key == "Enter") {
    document.getElementById("enter-name").click();
  }
});
