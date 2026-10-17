(function () {
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

var SU = ["♠", "♥", "♦", "♣"];
var RN = { 11: "В", 12: "Д", 13: "К", 14: "А" };
var id = parseInt(new URLSearchParams(location.search).get("id"), 10);
var $ = function (i) { return document.getElementById(i); };
var me = [], bot = [], deck = [], table = [], trump, att = "me", busy = true, els = {};

function hand(w) { return w === "me" ? me : bot; }
function other(w) { return w === "me" ? "bot" : "me"; }
function red(c) { return c.s === 1 || c.s === 2; }
function label(c) { return (RN[c.r] || c.r) + "\n" + SU[c.s]; }
function beats(a, d) { return (d.s === a.s && d.r > a.r) || (d.s === trump.s && a.s !== trump.s); }
function open() { return table.find(function (p) { return !p.d; }); }

function canAdd(c, D) {
return table.length < 6 && D.length > 0 && (!table.length || table.some(function (p) { return p.a.r === c.r || (p.d && p.d.r === c.r); }));
}

function mode() {
if (open()) { return other(att) === "me" ? "defend" : "wait"; }
return att === "me" ? "attack" : "wait";
}

function playable(c) {
if (busy) { return false; }
var m = mode();
if (m === "attack") { return canAdd(c, bot); }
if (m === "defend") { return beats(open().a, c); }
return false;
}

function build(n) {
var lo = n === 24 ? 9 : n === 52 ? 2 : 6, d = [];
for (var s = 0; s < 4; s++) { for (var r = lo; r <= 14; r++) { d.push({ r: r, s: s, k: "c" + s + "_" + r }); } }
for (var i = d.length - 1; i > 0; i--) {
var j = Math.floor(Math.random() * (i + 1)), t = d[i];
d[i] = d[j];
d[j] = t;
}
return d;
}

function el(c, back) {
var e = els[c.k];
if (!e) {
e = document.createElement("div");
els[c.k] = e;
}
e.className = "card" + (back ? " back" : "") + (!back && red(c) ? " red" : "");
e.textContent = back ? "" : label(c);
return e;
}

function hud() {
var t = deck[0] || trump;
$("trump").textContent = label(t);
$("trump").className = "card trump" + (red(t) ? " red" : "");
$("trump").style.visibility = deck.length ? "visible" : "hidden";
$("pile").style.visibility = deck.length > 1 ? "visible" : "hidden";
$("pile").dataset.n = deck.length;
$("suit").textContent = "Козырь " + SU[trump.s];
}

function render(delay) {
var f = {}, k, i = 0;
for (k in els) { if (els[k].isConnected) { f[k] = els[k].getBoundingClientRect(); } }
var pr = $("pile").getBoundingClientRect();
var hb = $("bot"), hm = $("me"), fl = $("field");
hb.textContent = "";
hm.textContent = "";
fl.textContent = "";
bot.forEach(function (c) { hb.appendChild(el(c, true)); });
me.slice().sort(function (a, b) { return a.s - b.s || a.r - b.r; }).forEach(function (c) {
var e = el(c);
e.classList.toggle("ok", playable(c));
hm.appendChild(e);
});
table.forEach(function (p) {
var d = document.createElement("div");
d.className = "pair";
d.appendChild(el(p.a));
if (p.d) {
var x = el(p.d);
x.classList.add("def");
d.appendChild(x);
}
fl.appendChild(d);
});
hud();
var m = mode();
$("act").hidden = busy || !(m === "defend" || (m === "attack" && table.length));
$("act").textContent = m === "defend" ? "Беру" : "Бито";
$("msg").textContent = busy ? "" : m === "attack" ? (table.length ? "Подкидывай или «Бито»" : "Твой ход") : m === "defend" ? "Отбивайся или бери" : "Ход бота";
for (k in els) {
var e2 = els[k];
if (!e2.isConnected) { continue; }
var r = e2.getBoundingClientRect(), o = f[k] || pr;
var dx = o.left - r.left, dy = o.top - r.top;
if (Math.abs(dx) + Math.abs(dy) < 2) { continue; }
e2.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], {
duration: 450,
delay: (delay || 0) + (f[k] ? 0 : i++ * 90),
easing: "cubic-bezier(.2,.8,.2,1)",
fill: "backwards"
});
}
}

function lowT(h) {
var t = h.filter(function (c) { return c.s === trump.s; });
return t.length ? Math.min.apply(null, t.map(function (c) { return c.r; })) : 99;
}

function draw(h) {
while (h.length < 6 && deck.length) { h.push(deck.pop()); }
}

function over() {
if (deck.length) { return false; }
var t = !me.length && !bot.length ? "Ничья" : !me.length ? "Ты выиграл!" : !bot.length ? "Ты дурак" : null;
if (!t) { return false; }
busy = true;
render(0);
$("endText").textContent = t;
$("end").hidden = false;
return true;
}

function endTurn(took) {
busy = true;
var a = att, d = other(a);
if (!took) {
table.forEach(function (p) {
[p.a, p.d].forEach(function (c) {
if (c) {
els[c.k].animate([{ transform: "none", opacity: 1 }, { transform: "translate(120vw,-30vh) rotate(60deg)", opacity: 0 }], { duration: 500, easing: "ease-in", fill: "forwards" });
delete els[c.k];
}
});
});
}
setTimeout(function () {
if (took) {
table.forEach(function (p) {
hand(d).push(p.a);
if (p.d) { hand(d).push(p.d); }
});
}
table = [];
draw(hand(a));
if (!took) {
draw(hand(d));
att = d;
}
step(0);
}, took ? 0 : 520);
}

function step(delay) {
var a = att, d = other(a), isOpen = !!open();
busy = false;
if (!table.length && over()) { return; }
if (!isOpen && table.length && (!hand(a).length || table.length >= 6 || !hand(d).length)) {
endTurn(false);
return;
}
render(delay);
if (a === "bot" && !isOpen) { setTimeout(botAttack, 800); }
else if (isOpen && d === "bot") { setTimeout(botDefend, 800); }
}

function low(h) {
return h.slice().sort(function (x, y) { return (x.s === trump.s) - (y.s === trump.s) || x.r - y.r; });
}

function botAttack() {
var c = low(bot).find(function (x) { return canAdd(x, me); });
if (!c) { endTurn(false); return; }
bot.splice(bot.indexOf(c), 1);
table.push({ a: c });
step(0);
}

function botDefend() {
var t = open();
var c = low(bot).find(function (x) { return beats(t.a, x); });
if (!c) { endTurn(true); return; }
bot.splice(bot.indexOf(c), 1);
t.d = c;
step(0);
}

$("me").addEventListener("click", function (e) {
var n = e.target.closest(".card");
if (!n || busy) { return; }
var c = me.find(function (x) { return els[x.k] === n; });
if (!c || !playable(c)) { return; }
var m = mode();
me.splice(me.indexOf(c), 1);
if (m === "defend") { open().d = c; } else { table.push({ a: c }); }
step(0);
});

$("act").addEventListener("click", function () {
if (busy) { return; }
endTurn(mode() === "defend");
});

$("leave").addEventListener("click", function () {
CardsGram.leave(id, CardsGram.currentUser().id);
});

function start(n) {
deck = build(n);
trump = deck[0];
hud();
$("pile").classList.add("shuf");
setTimeout(function () {
$("pile").classList.remove("shuf");
for (var i = 0; i < 6; i++) {
me.push(deck.pop());
bot.push(deck.pop());
}
att = lowT(bot) < lowT(me) ? "bot" : "me";
step(0);
}, 1300);
}

CardsGram.getGame(id).then(function (g) { start(g && g.deck ? g.deck : 36); });
})();
