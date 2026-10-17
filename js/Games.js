(function () {
var KEY = "cardsgram_games";
var isLocal = null;
var probing = null;

function probe() {
if (!probing) {
probing = fetch("api/games").then(function (r) { return !r.ok; }).catch(function () { return true; }).then(function (v) {
isLocal = v;
return v;
});
}
return probing;
}

function read() {
try {
var data = JSON.parse(localStorage.getItem(KEY));
if (data && Array.isArray(data.games)) {
return data;
}
} catch (e) {}
return { nextId: 1, games: [] };
}

function write(data) {
try {
localStorage.setItem(KEY, JSON.stringify(data));
} catch (e) {}
}

function request(method, url, body) {
return fetch(url, {
method: method,
headers: { "Content-Type": "application/json" },
body: body ? JSON.stringify(body) : undefined
}).then(function (r) {
return r.json().catch(function () { return null; }).then(function (data) {
return { status: r.status, data: data };
});
}).catch(function () {
return { status: 0, data: null };
});
}

function currentUser() {
var tg = window.Telegram && window.Telegram.WebApp;
var u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
if (u) {
return { id: String(u.id), name: u.username || u.first_name || "user", photo: u.photo_url || null };
}
return { id: "guest", name: "guest", photo: null };
}

var S = {
games: function () {
return request("GET", "api/games").then(function (r) { return r.status === 200 && Array.isArray(r.data) ? r.data : null; });
},
game: function (id) {
return request("GET", "api/games/" + id).then(function (r) {
return r.status === 200 ? r.data : r.status === 404 ? null : undefined;
});
},
create: function (opts, user) {
return request("POST", "api/games", { opts: opts, user: user }).then(function (r) { return r.status === 200 ? r.data : null; });
},
join: function (id, user) {
return request("POST", "api/games/" + id + "/join", { user: user }).then(function (r) { return r.status === 200 ? r.data : null; });
},
leave: function (id, userId) {
var url = "api/games/" + id + "/leave";
var body = JSON.stringify({ userId: userId });
if (navigator.sendBeacon) {
navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
return;
}
fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
}
};

var L = {
games: function () {
return Promise.resolve(read().games);
},
game: function (id) {
return Promise.resolve(read().games.find(function (g) { return g.id === id; }) || null);
},
create: function (opts, user) {
var data = read();
var players = [user];
for (var i = 1; i < opts.maxPlayers; i++) {
players.push({ id: "bot" + i, name: "Бот " + i, photo: null, bot: true });
}
var game = { id: data.nextId, rules: opts.rules, deck: opts.deck, maxPlayers: opts.maxPlayers, bet: opts.bet, creatorId: user.id, players: players };
data.nextId += 1;
data.games.push(game);
write(data);
return Promise.resolve(game);
},
join: function (id, user) {
var data = read();
var game = data.games.find(function (g) { return g.id === id; });
if (!game) {
return Promise.resolve(null);
}
if (!game.players.some(function (p) { return p.id === user.id; })) {
if (game.players.length >= game.maxPlayers) {
return Promise.resolve(null);
}
game.players.push(user);
write(data);
}
return Promise.resolve(game);
},
leave: function (id, userId) {
var data = read();
var game = data.games.find(function (g) { return g.id === id; });
if (!game) {
return;
}
if (game.creatorId === userId) {
data.games = data.games.filter(function (g) { return g.id !== id; });
} else {
game.players = game.players.filter(function (p) { return p.id !== userId; });
}
write(data);
}
};

function via(name) {
return function () {
var a = arguments;
return probe().then(function (local) { return (local ? L : S)[name].apply(null, a); });
};
}

window.CardsGram = {
currentUser: currentUser,
getGames: via("games"),
getGame: via("game"),
createGame: via("create"),
join: via("join"),
leave: function (id, userId) {
(isLocal ? L : S).leave(id, userId);
}
};
})();
