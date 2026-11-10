// ÉTAT DU JEU : trois piles (le bas est à l'indice 0), valeurs = tailles d'anneaux.
// Le DOM n'est jamais la source de vérité : rendre() reconstruit tout depuis ces variables.
var etat = [[], [], []];
var selection = null;        // tour d'origine de l'anneau sélectionné, ou null
var nbAnneaux = 0;           // nombre d'anneaux de la partie (0 = aucune partie)
var nbCoups = 0;             // compteur de coups (manuel et démo)
var partieEnCours = false;
var partieTerminee = false;
var demoEnCours = false;
var animationEnCours = false;
var idDemo = 0;              // change à chaque nouvelle partie : annule démo et animations en retard

var NB_MIN = 1;
var NB_MAX = 8;
var NB_DEFAUT = 3;
var DUREE_MANUEL = 450;      // durée de l'animation d'un coup du joueur (ms)
var DUREE_DEMO = 300;        // durée de l'animation d'un coup de la démo (ms)
var DELAI_DEMO = 100;        // pause entre deux coups de la démo (ms)

var COULEURS = ["#e6194b", "#f58231", "#f5c400", "#3cb44b",
                "#2bb3c0", "#4363d8", "#911eb4", "#e052b0"];

var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
var reduireMouvement = window.matchMedia("(prefers-reduced-motion: reduce)");

var champNb = document.getElementById("nb-anneaux");
var btnDemarrer = document.getElementById("btn-demarrer");
var btnDemo = document.getElementById("btn-demo");
var btnReset = document.getElementById("btn-reset");
var btnTheme = document.getElementById("btn-theme");
var zoneMessage = document.getElementById("message");
var zoneCompteur = document.getElementById("compteur");
var zoneMinimum = document.getElementById("minimum");
var zoneScore = document.getElementById("score");
var tours = document.querySelectorAll("#plateau .tour");

function afficherMessage(texte, succes) {
  zoneMessage.textContent = texte;
  zoneMessage.className = succes ? "succes" : "";
}

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
  afficherMessage(message);
  return n;
}

function initialiserEtat(nb) {
  etat = [[], [], []];
  for (var taille = nb; taille >= 1; taille--) {
    etat[0].push(taille);
  }
  selection = null;
  nbAnneaux = nb;
  nbCoups = 0;
  partieTerminee = false;
}

// RÈGLES : fonctions qui ne touchent pas au DOM.
function deplacementValide(de, vers) {
  if (de === vers) { return false; }
  var pileDe = etat[de];
  var pileVers = etat[vers];
  if (pileDe.length === 0) { return false; }
  if (pileVers.length === 0) { return true; }
  return pileDe[pileDe.length - 1] < pileVers[pileVers.length - 1];
}

// Victoire : tous les anneaux sont sur la troisième tour.
function estVictoire() {
  return nbAnneaux > 0 && etat[2].length === nbAnneaux;
}

function calculerMinimum(n) {
  return Math.pow(2, n) - 1;
}

// Score en % : minimum de coups / coups joués (100 % = parfait).
function calculerScore(n, coups) {
  if (coups === 0) { return 0; }
  return Math.round(100 * calculerMinimum(n) / coups);
}

// SOLVEUR : renvoie la liste des coups [de, vers], sans rien afficher.
function resoudre(n, de, vers, via) {
  if (n === 0) { return []; }
  var avant = resoudre(n - 1, de, via, vers);
  var apres = resoudre(n - 1, via, vers, de);
  return avant.concat([[de, vers]], apres);
}

function attente(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function afficherInfos() {
  zoneCompteur.textContent = nbCoups;
  zoneMinimum.textContent = nbAnneaux > 0 ? calculerMinimum(nbAnneaux) : "—";
  zoneScore.textContent = partieTerminee ? calculerScore(nbAnneaux, nbCoups) + " %" : "—";
}

// Reconstruit entièrement l'affichage à partir de l'état.
function rendre() {
  for (var i = 0; i < tours.length; i++) {
    var tour = tours[i];
    tour.textContent = "";
    tour.classList.toggle("origine", selection === i);

    for (var j = 0; j < etat[i].length; j++) {
      var taille = etat[i][j];
      var anneau = document.createElement("div");
      anneau.className = "anneau";
      if (selection === i && j === etat[i].length - 1) {
        anneau.className += " selectionne";
      }
      anneau.style.width = (20 + taille * 10) + "%";
      anneau.style.backgroundColor = COULEURS[taille - 1];
      anneau.addEventListener("click", creerGestionnaireAnneau(i, j));
      tour.appendChild(anneau);
    }
  }
  afficherInfos();
}

function signalerRefus(indexTour) {
  var tour = tours[indexTour];
  tour.classList.remove("refus");
  void tour.offsetWidth;
  tour.classList.add("refus");
  setTimeout(function () { tour.classList.remove("refus"); }, 400);
}

// ANIMATION (purement visuelle) : l'état est déjà à jour et rendre() a déjà redessiné.
// On fait partir le nouvel anneau de son ancienne position : il se soulève,
// glisse au-dessus des tours, puis redescend sur sa nouvelle pile.
function animerAnneau(anneau, avant, duree) {
  if (reduireMouvement.matches || !anneau.animate) {
    return Promise.resolve();
  }
  var apres = anneau.getBoundingClientRect();
  var dx = avant.left - apres.left;
  var dy = avant.top - apres.top;
  var haut = Math.min(dy, tours[0].getBoundingClientRect().top - 30 - apres.top);

  anneau.style.zIndex = 10;
  var animation = anneau.animate([
    { transform: "translate(" + dx + "px," + dy + "px)", offset: 0, easing: "ease-out" },
    { transform: "translate(" + dx + "px," + haut + "px)", offset: 0.3, easing: "ease-in-out" },
    { transform: "translate(0px," + haut + "px)", offset: 0.7, easing: "ease-in" },
    { transform: "translate(0px,0px)", offset: 1 }
  ], { duration: duree });

  return animation.finished.then(
    function () { anneau.style.zIndex = ""; },
    function () {}
  );
}

// Un coup (manuel ou démo) : état, compteur, affichage, animation, puis victoire.
async function jouerCoup(de, vers, duree) {
  var id = idDemo;
  var avant = tours[de].lastElementChild.getBoundingClientRect();

  selection = null;
  etat[vers].push(etat[de].pop());
  nbCoups++;
  rendre();

  animationEnCours = true;
  await animerAnneau(tours[vers].lastElementChild, avant, duree);
  if (id !== idDemo) { return; } // une nouvelle partie a commencé entre-temps
  animationEnCours = false;

  if (estVictoire()) {
    terminerPartie();
  }
}

function terminerPartie() {
  partieTerminee = true;
  var minimum = calculerMinimum(nbAnneaux);
  var score = calculerScore(nbAnneaux, nbCoups);

  if (demoEnCours) {
    afficherMessage("La démo a résolu le jeu en " + nbCoups + " coups, le minimum possible.", true);
  } else if (nbCoups === minimum) {
    afficherMessage("Bravo, parfait ! Tu as réussi en " + nbCoups + " coups, le minimum possible. Score : 100 %.", true);
  } else {
    afficherMessage("Bravo ! Tu as réussi en " + nbCoups + " coups (minimum : " + minimum + "). Score : " + score + " %.", true);
  }
  rendre();
}

function gererClic(i, j) {
  if (demoEnCours) {
    afficherMessage("Démo en cours : clique sur « Démarrer » ou « Reset » pour l’interrompre.");
    return;
  }
  if (animationEnCours) { return; }
  if (!partieEnCours) {
    afficherMessage("Clique d’abord sur « Démarrer » pour commencer une partie.");
    return;
  }
  if (partieTerminee) {
    afficherMessage("Partie terminée : clique sur « Démarrer » pour rejouer.", true);
    return;
  }

  if (selection === null) {
    if (etat[i].length === 0) {
      afficherMessage("Cette tour est vide : rien à sélectionner.");
      return;
    }
    if (j !== -1 && j !== etat[i].length - 1) {
      afficherMessage("Seul l’anneau du sommet peut être déplacé.");
      return;
    }
    selection = i;
    afficherMessage("");
    rendre();
    return;
  }

  if (i === selection) {
    selection = null;
    afficherMessage("");
    rendre();
    return;
  }

  if (deplacementValide(selection, i)) {
    afficherMessage("");
    jouerCoup(selection, i, DUREE_MANUEL);
  } else {
    afficherMessage("Déplacement interdit : on ne pose pas un grand anneau sur un plus petit.");
    signalerRefus(i);
  }
}

function creerGestionnaireAnneau(i, j) {
  return function (evenement) {
    evenement.stopPropagation();
    gererClic(i, j);
  };
}

// Arrête démo et animations en cours (elles se retirent au prochain contrôle d'id).
function annulerDemo() {
  idDemo++;
  demoEnCours = false;
  animationEnCours = false;
  btnDemo.disabled = false;
}

async function rejouer(liste, id) {
  await attente(DELAI_DEMO * 3);
  for (var n = 0; n < liste.length; n++) {
    if (id !== idDemo) { return; }
    var de = liste[n][0];
    var vers = liste[n][1];
    if (!deplacementValide(de, vers)) {
      afficherMessage("Erreur : coup impossible dans la démo.");
      break;
    }
    afficherMessage("Démo : coup " + (n + 1) + " sur " + liste.length);
    await jouerCoup(de, vers, DUREE_DEMO);
    if (id !== idDemo) { return; }
    await attente(DELAI_DEMO);
  }
  if (id === idDemo) {
    demoEnCours = false;
    btnDemo.disabled = false;
  }
}

function demarrer() {
  annulerDemo();
  initialiserEtat(lireNombreAnneaux());
  partieEnCours = true;
  rendre();
}

function lancerDemo() {
  annulerDemo();
  var nb = lireNombreAnneaux();
  initialiserEtat(nb);
  partieEnCours = true;
  rendre();
  demoEnCours = true;
  btnDemo.disabled = true;
  rejouer(resoudre(nb, 0, 2, 1), idDemo);
}

// Reset : retour complet à l'écran de départ (plateau vide, compteur à 0, champ à 3).
function reinitialiser() {
  annulerDemo();
  etat = [[], [], []];
  selection = null;
  nbAnneaux = 0;
  nbCoups = 0;
  partieEnCours = false;
  partieTerminee = false;
  champNb.value = NB_DEFAUT;
  afficherMessage("");
  rendre();
}

function appliquerTheme() {
  document.documentElement.dataset.theme = theme;
  btnTheme.textContent = theme === "sombre" ? "Mode clair" : "Mode sombre";
}

function basculerTheme() {
  theme = (theme === "sombre") ? "clair" : "sombre";
  appliquerTheme();
}

btnDemarrer.addEventListener("click", demarrer);
btnDemo.addEventListener("click", lancerDemo);
btnReset.addEventListener("click", reinitialiser);
btnTheme.addEventListener("click", basculerTheme);

for (var k = 0; k < tours.length; k++) {
  tours[k].addEventListener("click", (function (index) {
    return function () { gererClic(index, -1); };
  })(k));
}

appliquerTheme();
rendre();