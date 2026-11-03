// ÉTAT DU JEU : trois piles (tableaux). Le bas de la pile est à l'indice 0.
// Une taille vaut 1 (plus petit anneau) à nb (plus grand anneau).
// Le DOM n'est jamais la source de vérité : tout l'affichage vient de cet état.
var etat = [[], [], []];

var NB_MIN = 1;
var NB_MAX = 8;
var NB_DEFAUT = 3;

var champNb = document.getElementById("nb-anneaux");
var btnDemarrer = document.getElementById("btn-demarrer");
var zoneMessage = document.getElementById("message");
var tours = document.querySelectorAll("#plateau .tour");

function afficherMessage(texte) {
  zoneMessage.textContent = texte;
}

// Lit le champ, le corrige si besoin (entier entre 1 et 8),
// signale la correction à l'utilisateur et renvoie la valeur retenue.
function lireNombreAnneaux() {
  var brut = champNb.value.trim();
  var n = Number(brut);
  var message = "";

  if (brut === "" || isNaN(n)) {
    n = NB_DEFAUT;
    message = "Valeur manquante ou invalide : " + n + " anneaux ont été utilisés.";
  } else if (n < NB_MIN) {
    n = NB_MIN;
    message = "Le minimum est " + NB_MIN + " anneau : la valeur a été corrigée.";
  } else if (n > NB_MAX) {
    n = NB_MAX;
    message = "Le maximum est " + NB_MAX + " anneaux : la valeur a été corrigée.";
  } else if (!Number.isInteger(n)) {
    n = Math.floor(n);
    message = "Le nombre d’anneaux doit être entier : " + n + " a été utilisé.";
  }

  champNb.value = n;
  afficherMessage(message); // chaîne vide si la valeur était valide
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