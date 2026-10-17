(function () {
var tg = window.Telegram && window.Telegram.WebApp;
var user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
if (tg) { tg.ready(); tg.expand(); }
if (user) {
var name = user.username || user.first_name || "user";
var avatar = document.getElementById("userAvatar");
document.getElementById("userName").textContent = name;
avatar.textContent = name.charAt(0).toUpperCase();
if (user.photo_url) {
var img = new Image();
img.alt = "";
img.onload = function () {
avatar.textContent = "";
avatar.appendChild(img);
};
img.src = user.photo_url;
}
}
})();
