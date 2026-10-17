(function () {
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

var me = CardsGram.currentUser();
var id = parseInt(new URLSearchParams(location.search).get("id"), 10);
var box = document.getElementById("players");
var leaving = false;
var lastKey = null;

function go(url) {
leaving = true;
location.replace(url);
}

function render(game) {
box.textContent = "";
game.players.forEach(function (p) {
if (p.id === me.id || !p.photo) {
return;
}
var item = document.createElement("div");
item.className = "player";

var img = new Image();
img.alt = "";
img.onerror = function () { item.remove(); };
img.src = p.photo;

var name = document.createElement("span");
name.className = "player-name";
name.textContent = p.name;

item.appendChild(img);
item.appendChild(name);
box.appendChild(item);
});
}

function check() {
CardsGram.getGame(id).then(function (game) {
if (game === undefined || leaving) {
return;
}
if (!game) {
go("Fool.html");
return;
}
if (game.players.length >= game.maxPlayers) {
go("Play.html?id=" + id);
return;
}
var key = game.players.map(function (p) { return p.id; }).join(",");
if (key !== lastKey) {
lastKey = key;
render(game);
}
});
}

CardsGram.join(id, me).then(function (game) {
if (!game) {
go("Fool.html");
return;
}
check();
setInterval(check, 1000);
});

window.addEventListener("pagehide", function () {
if (!leaving) {
CardsGram.leave(id, me.id);
}
});

window.addEventListener("pageshow", function (e) {
if (e.persisted) {
location.reload();
}
});
})();
