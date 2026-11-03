// ÉTAT DU JEU : trois piles (tableaux). Le bas de la pile est à l'indice 0.
// Une taille vaut 1 (plus petit anneau) à nb (plus grand anneau).
// Le DOM n'est jamais la source de vérité : tout l'affichage vient de cet état.
var etat = [[], [], []];

// Sélection en cours : indice de la tour d'origine, ou null si rien n'est sélectionné.
// C'est aussi une donnée JavaScript, jamais lue dans le DOM.
var selection = null;

// Vaut true seulement après un clic sur « Démarrer ».
var partieEnCours = false;

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
  afficherMessage(message);
  return n;
}

// Réinitialise l'état : tous les anneaux sur la première tour,
// du plus grand (en bas) au plus petit (en haut).
function initialiserEtat(nb) {
  etat = [[], [], []];
  for (var taille = nb; taille >= 1; taille--) {
    etat[0].push(taille);
  }
  selection = null;
}

// RÈGLE DU JEU : fonction pure, elle lit seulement `etat` et ne touche pas au DOM.
// Renvoie true si l'anneau du sommet de la tour `de` peut aller sur la tour `vers`.
function deplacementValide(de, vers) {
  if (de === vers) {
    return false;
  }
  var pileDe = etat[de];
  var pileVers = etat[vers];
  if (pileDe.length === 0) {
    return false; // rien à déplacer
  }
  if (pileVers.length === 0) {
    return true; // tour vide : toujours accepté
  }
  var anneauDeplace = pileDe[pileDe.length - 1];
  var sommetDestination = pileVers[pileVers.length - 1];
  return anneauDeplace < sommetDestination; // jamais un grand sur un petit
}

// Reconstruit entièrement l'affichage à partir de l'état (et de la sélection).
function rendre() {
  for (var i = 0; i < tours.length; i++) {
    var tour = tours[i];
    tour.textContent = ""; // vide la tour : aucun doublon possible

    for (var j = 0; j < etat[i].length; j++) {
      var taille = etat[i][j];
      var estSommet = (j === etat[i].length - 1);

      var anneau = document.createElement("div");
      anneau.className = "anneau";
      if (selection === i && estSommet) {
        anneau.className += " selectionne";
      }
      anneau.style.width = (20 + taille * 10) + "%";
      anneau.style.backgroundColor = "hsl(" + (taille * 40) + ", 65%, 55%)";

      // Le gestionnaire connaît (i, j) par fermeture : on ne relit pas le DOM.
      anneau.addEventListener("click", creerGestionnaireAnneau(i, j));
      tour.appendChild(anneau);
    }
  }
}

// Retour visuel temporaire sur une tour (dépôt refusé).
function signalerRefus(indexTour) {
  var tour = tours[indexTour];
  tour.classList.remove("refus");
  void tour.offsetWidth; // permet de rejouer l'animation
  tour.classList.add("refus");
  setTimeout(function () {
    tour.classList.remove("refus");
  }, 400);
}

// Gère un clic sur la tour i. j est l'indice de l'anneau cliqué dans la pile,
// ou -1 si le clic est sur la tour elle-même (hors anneau).
function gererClic(i, j) {
  // Aucune partie lancée : on explique quoi faire au lieu de dire « tour vide »
  if (!partieEnCours) {
    afficherMessage("Clique d’abord sur « Démarrer » pour commencer une partie.");
    return;
  }

  if (selection === null) {
    // Phase 1 : choisir un anneau à déplacer
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

  // Phase 2 : choisir la destination
  if (i === selection) {
    selection = null; // clic sur la tour d'origine : annulation
    afficherMessage("");
    rendre();
    return;
  }

  if (deplacementValide(selection, i)) {
    etat[i].push(etat[selection].pop());
    selection = null;
    afficherMessage("");
    rendre();
  } else {
    // Refusé : l'état ne change pas, la sélection est conservée
    afficherMessage("Déplacement interdit : on ne pose pas un grand anneau sur un plus petit.");
    signalerRefus(i);
  }
}

function creerGestionnaireAnneau(i, j) {
  return function (evenement) {
    evenement.stopPropagation(); // évite le doublon avec le clic sur la tour
    gererClic(i, j);
  };
}

function demarrer() {
  initialiserEtat(lireNombreAnneaux());
  partieEnCours = true;
  rendre();
}

btnDemarrer.addEventListener("click", demarrer);

for (var k = 0; k < tours.length; k++) {
  tours[k].addEventListener("click", (function (index) {
    return function () {
      gererClic(index, -1);
    };
  })(k));
}

// Affichage initial (plateau vide tant qu'on n'a pas cliqué)
rendre();