import Cookies from "/libraries/cookies-js/js.cookie.mjs";

var editing = "text";

var style = {
  "text": "#ffffff", 
  "background": "#000000", 
  "buttons": "#ffffff", 
  "font": "#ffffff"
};

if (Cookies.get("style") != undefined) {
 Cookies.set("style", JSON.stringify(style));
}

$("#color-selector").spectrum({
  flat: true,
  showButtons: false, 
  containerClassName: "color-selector-flat", 
  move: function(color) {
    console.log(editing);
    style[editing] = color.toHexString();
    //Not optimised but I'm to lazy to optimize? Maybe feature me could?
  }
});

document.getElementById("element-selector").addEventListener("change", function() {
  editing = document.getElementById("element-selector").value;
});

document.getElementById("back").addEventListener("click", function() {
  Cookies.set("style", JSON.stringify(style));
  window.location.replace("index.html");
});