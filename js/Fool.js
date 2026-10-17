(function () {
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

var btn = document.getElementById("infoBtn");
var rules = document.getElementById("rules");
var list = document.getElementById("gamesList");
var lastKey = null;

function setOpen(open) {
rules.hidden = !open;
btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function span(cls, text) {
var el = document.createElement("span");
el.className = cls;
el.textContent = text;
return el;
}

function row(g) {
var a = document.createElement("a");
a.className = "room";
a.href = "Game.html?id=" + g.id;

var main = document.createElement("span");
main.className = "room-main";
main.appendChild(span("room-title", "Игра №" + g.id));
main.appendChild(span("room-sub", g.rules + ", " + g.deck + " карт"));

var side = document.createElement("span");
side.className = "room-side";
side.appendChild(span("room-players", g.players.length + "/" + g.maxPlayers));
side.appendChild(span("room-bet", String(g.bet)));

a.appendChild(main);
a.appendChild(side);
return a;
}

function render() {
CardsGram.getGames().then(function (games) {
if (!games) {
return;
}
games = games.slice().reverse();
var key = JSON.stringify(games);
if (key === lastKey) {
return;
}
lastKey = key;
list.textContent = "";
if (!games.length) {
var p = document.createElement("p");
p.className = "empty";
p.textContent = "Игр пока нет";
list.appendChild(p);
return;
}
games.forEach(function (g) {
list.appendChild(row(g));
});
});
}

btn.addEventListener("click", function (e) {
e.stopPropagation();
setOpen(rules.hidden);
});

document.addEventListener("click", function (e) {
if (!rules.hidden && !rules.contains(e.target)) {
setOpen(false);
}
});

document.addEventListener("keydown", function (e) {
if (e.key === "Escape") {
setOpen(false);
}
});

window.addEventListener("pageshow", render);
setInterval(render, 3000);
render();
})();
