
"use strict";

/* =========================================
   CONSTANTES ET ÉLÉMENTS HTML
========================================= */

const plateau = document.getElementById("plateau");
const champAnneaux = document.getElementById("nb-anneaux");

const btnDemarrer = document.getElementById("btn-demarrer");
const btnDemo = document.getElementById("btn-demo");
const btnReset = document.getElementById("btn-reset");
const btnTheme = document.getElementById("btn-theme");

const affichageCompteur = document.getElementById("compteur");
const affichageMinimum = document.getElementById("minimum");
const affichageScore = document.getElementById("score");
const affichageMessage = document.getElementById("message");

const COULEURS = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#8e44ad",
    "#e84393"
];

const REDUCED_MOTION = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

/* =========================================
   ÉTAT DU JEU
========================================= */

// Les anneaux sont numérotés du plus petit (1)
// au plus grand (n).
// L'indice 0 correspond toujours au bas de la pile.

let tours = [[], [], []];

let selection = null;
let coups = 0;
let partieEnCours = false;
let partieTerminee = false;
let nombreAnneaux = 0;

let minimumCoups = 0;

// Identifiant permettant d'annuler les anciennes démos.
let identifiantDemo = 0;

// Empêche les clics pendant une animation.
let animationEnCours = false;

// Thème indépendant du reset.
let themeSombre = false;

/* =========================================
   OUTILS
========================================= */

function attendre(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function afficherMessage(texte) {
    affichageMessage.textContent = texte;
}

function calculerMinimum(n) {
    return Math.pow(2, n) - 1;
}

/* =========================================
   CRÉATION DE LA PARTIE
========================================= */

function creerPartie(n) {
    tours = [[], [], []];

    // Les grands anneaux sont placés en premier.
    for (let i = n; i >= 1; i--) {
        tours[0].push(i);
    }

    nombreAnneaux = n;
    coups = 0;
    selection = null;
    partieTerminee = false;
    partieEnCours = true;

    minimumCoups = calculerMinimum(n);

    rendre();
}

/* =========================================
   RENDU DU DOM
========================================= */

// Le DOM est entièrement reconstruit depuis l'état.
// Il ne sert jamais à déterminer la validité d'un coup.

function rendre() {
    const elementsTours = plateau.querySelectorAll(".tour");

    elementsTours.forEach((elementTour, indexTour) => {
        elementTour.replaceChildren();

        tours[indexTour].forEach((taille, indexAnneau) => {
            const anneau = document.createElement("div");

            anneau.className = "anneau";

            // Largeur proportionnelle à la taille de l'anneau.
            const largeur = 25 + (taille / nombreAnneaux) * 75;

            anneau.style.width = largeur + "%";
            anneau.style.backgroundColor = COULEURS[taille - 1];

            anneau.dataset.taille = taille;

            // Seul l'anneau situé au sommet peut être sélectionné.
            const estSommet =
                indexAnneau === tours[indexTour].length - 1;

            if (
                selection &&
                selection.tour === indexTour &&
                estSommet
            ) {
                anneau.classList.add("selectionne");
            }

            elementTour.appendChild(anneau);
        });
    });

    affichageCompteur.textContent = coups;
    affichageMinimum.textContent = minimumCoups;
}

/* =========================================
   VALIDATION DES DÉPLACEMENTS
========================================= */

// Cette fonction ne touche jamais au DOM ni à l'état.

function deplacementValide(de, vers) {
    if (de === vers) return false;

    const tourSource = tours[de];
    const tourDestination = tours[vers];

    if (tourSource.length === 0) return false;

    const anneauSource = tourSource[tourSource.length - 1];

    if (tourDestination.length === 0) return true;

    const anneauDestination =
        tourDestination[tourDestination.length - 1];

    return anneauSource < anneauDestination;
}

/* =========================================
   CALCUL RÉCURSIF DE LA SOLUTION
========================================= */

// Cette fonction calcule uniquement la liste des coups.
// Elle ne modifie jamais l'état du jeu.

function resoudre(n, de, vers, via) {
    if (n === 0) {
        return [];
    }

    const coupsSolution = [];

    // Déplacer n-1 anneaux vers la tour intermédiaire.
    coupsSolution.push(
        ...resoudre(n - 1, de, via, vers)
    );

    // Déplacer le plus grand anneau.
    coupsSolution.push([de, vers]);

    // Déplacer n-1 anneaux vers la destination.
    coupsSolution.push(
        ...resoudre(n - 1, via, vers, de)
    );

    return coupsSolution;
}

/* =========================================
   ANIMATION VISUELLE
========================================= */

// L'état est déjà mis à jour lorsque cette fonction est appelée.
// L'animation utilise un élément temporaire indépendant du DOM du jeu.

async function animerDeplacement(
    tourDepart,
    tourArrivee,
    taille,
    numeroDemo
) {
    if (REDUCED_MOTION.matches) {
        return;
    }

    const elementDepart = plateau.querySelectorAll(".tour")[tourDepart];
    const elementArrivee = plateau.querySelectorAll(".tour")[tourArrivee];

    const ancienAnneau = document.createElement("div");

    ancienAnneau.className = "anneau anneau-animation";

    const largeur = 25 + (taille / nombreAnneaux) * 75;

    ancienAnneau.style.width =
        (largeur / 100 * elementDepart.clientWidth) + "px";

    ancienAnneau.style.height = "25px";
    ancienAnneau.style.backgroundColor = COULEURS[taille - 1];

    const positionDepart = elementDepart.getBoundingClientRect();
    const positionArrivee = elementArrivee.getBoundingClientRect();

    // Le clone part de l'ancienne position de l'anneau.
    const xDepart = positionDepart.left +
        (positionDepart.width - ancienAnneau.offsetWidth) / 2;

    const yDepart = positionDepart.top + 100;

    const xArrivee = positionArrivee.left +
        (positionArrivee.width - ancienAnneau.offsetWidth) / 2;

    const yArrivee = positionArrivee.top + 100;

    ancienAnneau.style.left = xDepart + "px";
    ancienAnneau.style.top = yDepart + "px";

    document.body.appendChild(ancienAnneau);

    const distanceX = xArrivee - xDepart;

    const hauteur = Math.max(
        70,
        Math.abs(distanceX) * 0.2
    );

    const animation = ancienAnneau.animate(
        [
            {
                transform: "translate(0, 0)"
            },
            {
                transform: `translate(0, -${hauteur}px)`,
                offset: 0.25
            },
            {
                transform: `translate(${distanceX}px, -${hauteur}px)`,
                offset: 0.75
            },
            {
                transform: `translate(${distanceX}px, ${yArrivee - yDepart}px)`
            }
        ],
        {
            duration: 550,
            easing: "ease-in-out",
            fill: "forwards"
        }
    );

    try {
        await animation.finished;
    } catch (erreur) {
        // Une animation annulée ne doit pas interrompre le jeu.
    }

    ancienAnneau.remove();
}

/* =========================================
   EXÉCUTION D'UN COUP
========================================= */

// Cette fonction est commune au joueur et à la démo.

async function effectuerCoup(de, vers, numeroDemo = null) {
    if (!deplacementValide(de, vers)) {
        return false;
    }

    const taille = tours[de][tours[de].length - 1];

    // Mise à jour de l'état avant l'animation.
    tours[de].pop();
    tours[vers].push(taille);

    coups++;

    selection = null;

    rendre();

    await animerDeplacement(
        de,
        vers,
        taille,
        numeroDemo
    );

    return true;
}

/* =========================================
   DÉTECTION DE LA VICTOIRE
========================================= */

function verifierVictoire() {
    if (partieTerminee) return;

    if (tours[2].length !== nombreAnneaux) {
        return;
    }

    partieTerminee = true;
    partieEnCours = false;
    selection = null;

    const score = Math.round(
        (minimumCoups / coups) * 100
    );

    affichageScore.textContent = score + " %";

    rendre();

    afficherMessage(
        `🎉 Félicitations ! Vous avez terminé en ${coups} coups. ` +
        `Score : ${score} %. Minimum théorique : ${minimumCoups} coups.`
    );
}

/* =========================================
   SÉLECTION ET DÉPLACEMENT MANUELS
========================================= */

function gererClicTour(indexTour) {
    if (!partieEnCours) {
        afficherMessage(
            "Cliquez sur « Démarrer » pour commencer une nouvelle partie."
        );
        return;
    }

    if (animationEnCours || partieTerminee) {
        return;
    }

    // Aucune sélection : sélectionner le sommet.
    if (selection === null) {
        if (tours[indexTour].length === 0) {
            afficherMessage("Cette tour est vide.");
            return;
        }

        selection = {
            tour: indexTour,
            taille: tours[indexTour][tours[indexTour].length - 1]
        };

        rendre();

        afficherMessage("Anneau sélectionné. Choisissez une tour de destination.");
        return;
    }

    const tourOrigine = selection.tour;

    // Cliquer sur la tour d'origine annule la sélection.
    if (indexTour === tourOrigine) {
        selection = null;
        rendre();

        afficherMessage("Sélection annulée.");
        return;
    }

    // Vérification de la règle.
    if (!deplacementValide(tourOrigine, indexTour)) {
        selectionnerRefus(indexTour);
        return;
    }

    // Exécuter le déplacement.
    animationEnCours = true;

    effectuerCoup(tourOrigine, indexTour)
        .then(() => {
            verifierVictoire();

            if (!partieTerminee) {
                afficherMessage("Déplacement effectué. À vous de jouer !");
            }
        })
        .finally(() => {
            animationEnCours = false;
        });
}

/* =========================================
   REFUS VISUEL
========================================= */

function selectionnerRefus(indexTour) {
    const tour = plateau.querySelectorAll(".tour")[indexTour];

    tour.classList.remove("refus");

    // Force le redémarrage de l'animation.
    void tour.offsetWidth;

    tour.classList.add("refus");

    afficherMessage(
        "Déplacement interdit : un grand anneau ne peut pas être posé sur un plus petit."
    );

    tour.addEventListener(
        "animationend",
        () => tour.classList.remove("refus"),
        { once: true }
    );
}

/* =========================================
   GESTION DE LA VALEUR DU CHAMP
========================================= */

function lireNombreAnneaux() {
    const valeur = champAnneaux.value.trim();

    const nombre = Number(valeur);

    if (
        valeur === "" ||
        !Number.isInteger(nombre) ||
        nombre < 1 ||
        nombre > 8
    ) {
        // Une valeur invalide est ramenée dans les bornes.
        let correction = 3;

        if (valeur !== "" && Number.isFinite(nombre)) {
            correction = Math.max(
                1,
                Math.min(8, Math.floor(nombre))
            );
        }

        champAnneaux.value = correction;

        afficherMessage(
            `Valeur incorrecte : le nombre d'anneaux doit être un entier entre 1 et 8. Valeur corrigée à ${correction}.`
        );

        return correction;
    }

    return nombre;
}

/* =========================================
   ARRÊT PROPRE D'UNE PARTIE OU DÉMO
========================================= */

function interrompreDemo() {
    identifiantDemo++;

    // Annulation de toutes les animations visuelles en cours.
    document.querySelectorAll(".anneau-animation").forEach(
        element => element.remove()
    );

    animationEnCours = false;
}

/* =========================================
   BOUTON DÉMARRER
========================================= */

btnDemarrer.addEventListener("click", () => {
    interrompreDemo();

    const n = lireNombreAnneaux();

    creerPartie(n);

    affichageScore.textContent = "—";

    afficherMessage(
        `Nouvelle partie : ${n} anneau(x). Déplacez-les vers la troisième tour.`
    );
});

/* =========================================
   DÉMO AUTOMATIQUE
========================================= */

async function lancerDemo() {
    interrompreDemo();

    const numeroDemo = identifiantDemo;

    const n = lireNombreAnneaux();

    creerPartie(n);

    afficherMessage("🤖 Démonstration automatique en cours...");

    animationEnCours = true;

    const solution = resoudre(n, 0, 2, 1);

    for (const [de, vers] of solution) {
        // Une nouvelle partie ou un reset invalide cette démo.
        if (numeroDemo !== identifiantDemo) {
            return;
        }

        if (deplacementValide(de, vers)) {
            await effectuerCoup(de, vers, numeroDemo);
        }

        if (numeroDemo !== identifiantDemo) {
            return;
        }

        await attendre(REDUCED_MOTION.matches ? 100 : 180);
    }

    if (numeroDemo !== identifiantDemo) {
        return;
    }

    animationEnCours = false;

    verifierVictoire();
}

btnDemo.addEventListener("click", lancerDemo);

/* =========================================
   BOUTON RESET
========================================= */

function resetJeu() {
    interrompreDemo();

    tours = [[], [], []];

    selection = null;
    coups = 0;
    nombreAnneaux = 0;
    minimumCoups = 0;

    partieEnCours = false;
    partieTerminee = false;

    affichageCompteur.textContent = "0";
    affichageMinimum.textContent = "0";
    affichageScore.textContent = "—";

    // Reconstruire le plateau vide.
    plateau.querySelectorAll(".tour").forEach(tour => {
        tour.replaceChildren();
        tour.classList.remove("refus");
    });

    afficherMessage(
        "Jeu réinitialisé. Cliquez sur « Démarrer » pour recommencer."
    );

    // Le thème n'est volontairement pas modifié.
}

btnReset.addEventListener("click", resetJeu);

/* =========================================
   MODE SOMBRE / CLAIR
========================================= */

btnTheme.addEventListener("click", () => {
    themeSombre = !themeSombre;

    document.body.classList.toggle("theme-sombre", themeSombre);

    btnTheme.textContent = themeSombre
        ? "☀️ Mode clair"
        : "🌙 Mode sombre";

    btnTheme.setAttribute(
        "aria-label",
        themeSombre
            ? "Activer le thème clair"
            : "Activer le thème sombre"
    );
});

/* =========================================
   INITIALISATION DES ÉVÉNEMENTS
========================================= */

// Les trois tours sont identifiées par leur indice.
// Les clics passent exclusivement par la logique JavaScript.

plateau.querySelectorAll(".tour").forEach((tour, index) => {
    tour.addEventListener("click", () => {
        gererClicTour(index);
    });
});

/* =========================================
   INITIALISATION
========================================= */

// Vérification des fonctions récursives.
console.assert(
    resoudre(3, 0, 2, 1).length === 7,
    "La solution de 3 anneaux doit comporter 7 coups."
);

console.assert(
    resoudre(5, 0, 2, 1).length === 31,
    "La solution de 5 anneaux doit comporter 31 coups."
);

rendre();
