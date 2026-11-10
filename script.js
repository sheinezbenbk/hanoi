// ÉTAT DU JEU : trois piles (tableaux). Le bas de la pile est à l'indice 0.
// Une taille vaut 1 (plus petit anneau) à nb (plus grand anneau).
// Le DOM n'est jamais la source de vérité : tout l'affichage vient de cet état.
var etat = [[], [], []];

// Sélection en cours : indice de la tour d'origine, ou null si rien n'est sélectionné.
var selection = null;

// Vaut true seulement après un clic sur « Démarrer » (ou « Démo automatique »).
var partieEnCours = false;

// Démo automatique : true pendant qu'elle tourne.
// idDemo sert à annuler une démo en cours : chaque démo mémorise son numéro
// et s'arrête dès que le numéro courant a changé.
var demoEnCours = false;
var idDemo = 0;

var NB_MIN = 1;
var NB_MAX = 8;
var NB_DEFAUT = 3;
var DELAI_DEMO = 300; // millisecondes entre deux étapes de la démo

// Une couleur distincte par taille d'anneau (indice = taille - 1).
var COULEURS = [
  "#e6194b", // 1 rouge
  "#f58231", // 2 orange
  "#f5c400", // 3 jaune
  "#3cb44b", // 4 vert
  "#2bb3c0", // 5 turquoise
  "#4363d8", // 6 bleu
  "#911eb4", // 7 violet
  "#e052b0"  // 8 rose
];

var champNb = document.getElementById("nb-anneaux");
var btnDemarrer = document.getElementById("btn-demarrer");
var btnDemo = document.getElementById("btn-demo");
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

// SOLVEUR RÉCURSIF : renvoie la liste des coups [de, vers] qui déplacent
// n anneaux de la tour `de` vers la tour `vers`, en passant par `via`.
// Il ne lit ni ne modifie `etat`, et n'affiche rien : il ne calcule que des coups.
function resoudre(n, de, vers, via) {
  if (n === 0) {
    return [];
  }
  var avant = resoudre(n - 1, de, via, vers);   // dégager les n-1 anneaux du dessus
  var milieu = [[de, vers]];                    // déplacer le plus grand
  var apres = resoudre(n - 1, via, vers, de);   // remettre les n-1 anneaux dessus
  return avant.concat(milieu, apres);
}

// Fonction d'attente pour async/await : se résout après `ms` millisecondes.
function attente(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// Reconstruit entièrement l'affichage à partir de l'état (et de la sélection).
function rendre() {
  for (var i = 0; i < tours.length; i++) {
    var tour = tours[i];
    tour.textContent = ""; // vide la tour : aucun doublon possible
    tour.classList.toggle("origine", selection === i); // purement visuel

    for (var j = 0; j < etat[i].length; j++) {
      var taille = etat[i][j];
      var estSommet = (j === etat[i].length - 1);

      var anneau = document.createElement("div");
      anneau.className = "anneau";
      if (selection === i && estSommet) {
        anneau.className += " selectionne";
      }
      anneau.style.width = (20 + taille * 10) + "%";
      anneau.style.backgroundColor = COULEURS[taille - 1];

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
  // Pendant la démo, le joueur ne touche pas au plateau
  if (demoEnCours) {
    afficherMessage("Démo en cours : clique sur « Démarrer » pour l’interrompre.");
    return;
  }

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

// Interrompt une démo éventuelle (elle s'arrête au prochain contrôle d'id).
function annulerDemo() {
  idDemo++;
  demoEnCours = false;
  btnDemo.disabled = false;
}

// REJEU : joue la liste de coups, un par un, avec un délai.
// Pour chaque coup : on sélectionne l'anneau, on attend, puis on le dépose.
// Les coups passent par etat et rendre(), comme ceux du joueur.
async function rejouer(coups, id) {
  await attente(DELAI_DEMO * 2); // laisse voir la position de départ
  if (id !== idDemo) { return; }

  for (var k = 0; k < coups.length; k++) {
    var de = coups[k][0];
    var vers = coups[k][1];

    // Sécurité : la liste doit respecter la règle du jeu
    if (!deplacementValide(de, vers)) {
      afficherMessage("Erreur : coup impossible dans la démo.");
      break;
    }

    afficherMessage("Coup " + (k + 1) + " sur " + coups.length);
    selection = de;
    rendre();
    await attente(DELAI_DEMO);
    if (id !== idDemo) { return; } // démo annulée pendant l'attente

    etat[vers].push(etat[de].pop());
    selection = null;
    rendre();
    await attente(DELAI_DEMO);
    if (id !== idDemo) { return; }
  }

  if (id === idDemo) {
    demoEnCours = false;
    btnDemo.disabled = false;
    if (k === coups.length) {
      afficherMessage("Démo terminée en " + coups.length + " coups.");
    }
  }
}

function demarrer() {
  annulerDemo(); // « Démarrer » interrompt toujours une démo
  initialiserEtat(lireNombreAnneaux());
  partieEnCours = true;
  rendre();
}

// Démo : repart d'un plateau neuf avec le nombre d'anneaux du champ,
// calcule les coups (sans rien afficher), puis les rejoue.
function lancerDemo() {
  annulerDemo();
  var nb = lireNombreAnneaux();
  initialiserEtat(nb);
  partieEnCours = true;
  rendre();

  var coups = resoudre(nb, 0, 2, 1); // de la tour 0 vers la tour 2, via la tour 1
  demoEnCours = true;
  btnDemo.disabled = true;
  rejouer(coups, idDemo);
}

btnDemarrer.addEventListener("click", demarrer);
btnDemo.addEventListener("click", lancerDemo);

for (var k = 0; k < tours.length; k++) {
  tours[k].addEventListener("click", (function (index) {
    return function () {
      gererClic(index, -1);
    };
  })(k));
}

// Affichage initial (plateau vide tant qu'on n'a pas cliqué)
rendre();