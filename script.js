// ÉTAT DU JEU : trois piles (tableaux). Le bas de la pile est à l'indice 0.
// Une taille vaut 1 (plus petit anneau) à nb (plus grand anneau).
// Le DOM n'est jamais la source de vérité : tout l'affichage vient de cet état.
var etat = [[], [], []];

var NB_MIN = 1;
var NB_MAX = 8;

var champNb = document.getElementById("nb-anneaux");
var btnDemarrer = document.getElementById("btn-demarrer");
var tours = document.querySelectorAll("#plateau .tour");

// Lit le champ, le corrige si besoin (entier entre 1 et 8) et renvoie la valeur.
function lireNombreAnneaux() {
  var n = parseInt(champNb.value, 10);
  if (isNaN(n)) {
    n = 3;
  }
  n = Math.max(NB_MIN, Math.min(NB_MAX, n));
  champNb.value = n;
  return n;
}

// Réinitialise l'état : tous les anneaux sur la première tour,
// du plus grand (en bas) au plus petit (en haut).
function initialiserEtat(nb) {
  etat = [[], [], []];
  for (var taille = nb; taille >= 1; taille--) {
    etat[0].push(taille);
  }
}

// Reconstruit entièrement l'affichage à partir de l'état.
function rendre() {
  for (var i = 0; i < tours.length; i++) {
    var tour = tours[i];
    tour.textContent = ""; // vide la tour : aucun doublon possible

    for (var j = 0; j < etat[i].length; j++) {
      var taille = etat[i][j];
      var anneau = document.createElement("div");
      anneau.className = "anneau";
      anneau.dataset.taille = taille;
      // largeur croissante avec la taille : de 30 % (taille 1) à 100 % (taille 8)
      anneau.style.width = (20 + taille * 10) + "%";
      anneau.style.backgroundColor = "hsl(" + (taille * 40) + ", 65%, 55%)";
      tour.appendChild(anneau);
    }
  }
}

function demarrer() {
  initialiserEtat(lireNombreAnneaux());
  rendre();
}

btnDemarrer.addEventListener("click", demarrer);

// Affichage initial (plateau vide tant qu'on n'a pas cliqué)
rendre();