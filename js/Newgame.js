(function () {
var tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

var bet = document.getElementById("bet");
var hint = document.getElementById("betHint");
var btn = document.getElementById("createBtn");

function value(name) {
var el = document.querySelector('input[name="' + name + '"]:checked');
return el ? el.value : "";
}

function showError(text) {
hint.textContent = text;
hint.classList.add("error");
}

bet.addEventListener("input", function () {
bet.removeAttribute("aria-invalid");
hint.textContent = "Минимум 100";
hint.classList.remove("error");
});

btn.addEventListener("click", function () {
var amount = Number(bet.value);
if (!bet.value || !Number.isInteger(amount) || amount < 100) {
bet.setAttribute("aria-invalid", "true");
showError("Минимум 100");
bet.focus();
return;
}
btn.disabled = true;
CardsGram.createGame({
rules: value("rules"),
deck: Number(value("deck")),
maxPlayers: Number(value("players")),
bet: amount
}, CardsGram.currentUser()).then(function (game) {
if (!game) {
btn.disabled = false;
showError("Не удалось создать игру");
return;
}
location.href = "Game.html?id=" + game.id;
});
});
})();
