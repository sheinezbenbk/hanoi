
"use strict";

/* =====================================
   RÉCUPÉRATION DES ÉLÉMENTS
===================================== */

const plateau = document.getElementById("plateau");
const champAnneaux = document.getElementById("nb-anneaux");

const tours = document.querySelectorAll(".tour");

const btnDemarrer = document.getElementById("btn-demarrer");
const btnDemo = document.getElementById("btn-demo");
const btnReset = document.getElementById("btn-reset");
const btnTheme = document.getElementById("btn-theme");

const compteur = document.getElementById("compteur");
const minimum = document.getElementById("minimum");
const score = document.getElementById("score");
const message = document.getElementById("message");

/* =====================================
   VARIABLES DU JEU
===================================== */

let nombreAnneaux = 0;
let coups = 0;
let anneauSelectionne = null;

let partieEnCours = false;
let partieTerminee = false;
let demoEnCours = false;
let animationEnCours = false;

let identifiantDemo = 0;
let themeSombre = false;

// Les couleurs sont attribuées par taille.
const couleurs = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#8e44ad",
    "#e84393"
];

// Stockage simple des anneaux dans chaque tour.
// L'indice 0 correspond au bas de la pile.
let etatTours = [[], [], []];

/* =====================================
   OUTILS
===================================== */

function afficherMessage(texte) {
    message.textContent = texte;
}

function calculerMinimum() {
    return Math.pow(2, nombreAnneaux) - 1;
}

function attendre(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =====================================
   CRÉATION DES ANNEAUX
===================================== */

function creerAnneaux(n) {
    nombreAnneaux = n;
    etatTours = [[], [], []];

    // Les plus grands anneaux sont placés en premier.
    for (let i = n; i >= 1; i--) {
        etatTours[0].push(i);
    }

    coups = 0;
    anneauSelectionne = null;

    partieEnCours = true;
    partieTerminee = false;

    compteur.textContent = "0";
    minimum.textContent = calculerMinimum();
    score.textContent = "—";

    afficherAnneaux();
}

/* =====================================
   AFFICHAGE DES ANNEAUX
===================================== */

function afficherAnneaux() {
    tours.forEach((tour, index) => {
        tour.innerHTML = "";

        etatTours[index].forEach((taille, position) => {
            const anneau = document.createElement("div");

            anneau.classList.add("anneau");

            // Largeur calculée selon la taille de l'anneau.
            anneau.style.width =
                (25 + (taille / nombreAnneaux) * 75) + "%";

            anneau.style.backgroundColor = couleurs[taille - 1];

            // Seul le sommet de la tour est sélectionnable.
            if (
                anneauSelectionne &&
                anneauSelectionne.tour === index &&
                position === etatTours[index].length - 1
            ) {
                anneau.classList.add("selectionne");
            }

            tour.appendChild(anneau);
        });
    });

    compteur.textContent = coups;
}

/* =====================================
   RÈGLE DU JEU
===================================== */

function deplacementAutorise(de, vers) {
    if (de === vers || etatTours[de].length === 0) {
        return false;
    }

    const tailleDepart =
        etatTours[de][etatTours[de].length - 1];

    if (etatTours[vers].length === 0) {
        return true;
    }

    const tailleArrivee =
        etatTours[vers][etatTours[vers].length - 1];

    return tailleDepart < tailleArrivee;
}

/* =====================================
   ANIMATION DES DÉPLACEMENTS
===================================== */

async function animerAnneau(de, vers, taille) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const elementDepart = tours[de];
    const elementArrivee = tours[vers];

    const rectangleDepart = elementDepart.getBoundingClientRect();
    const rectangleArrivee = elementArrivee.getBoundingClientRect();

    const clone = document.createElement("div");

    clone.className = "anneau anneau-animation";

    const largeur =
        (25 + (taille / nombreAnneaux) * 75) *
        rectangleDepart.width / 100;

    clone.style.width = largeur + "px";
    clone.style.height = "25px";
    clone.style.backgroundColor = couleurs[taille - 1];

    const xDepart =
        rectangleDepart.left +
        (rectangleDepart.width - largeur) / 2;

    const xArrivee =
        rectangleArrivee.left +
        (rectangleArrivee.width - largeur) / 2;

    const yDepart = rectangleDepart.top + 100;
    const yArrivee = rectangleArrivee.top + 100;

    clone.style.left = xDepart + "px";
    clone.style.top = yDepart + "px";

    document.body.appendChild(clone);

    const distanceX = xArrivee - xDepart;
    const hauteur = Math.max(70, Math.abs(distanceX) * 0.2);

    const animation = clone.animate(
        [
            { transform: "translate(0, 0)" },
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
        // L'animation peut être interrompue par un Reset.
    }

    clone.remove();
}

/* =====================================
   EFFECTUER UN DÉPLACEMENT
===================================== */

async function deplacerAnneau(de, vers) {
    if (!deplacementAutorise(de, vers)) {
        return false;
    }

    const taille =
        etatTours[de][etatTours[de].length - 1];

    // Modifier immédiatement l'état du jeu.
    etatTours[de].pop();
    etatTours[vers].push(taille);

    coups++;
    anneauSelectionne = null;

    afficherAnneaux();

    // L'animation est uniquement visuelle.
    await animerAnneau(de, vers, taille);

    return true;
}

/* =====================================
   GESTION DE LA SÉLECTION
===================================== */

async function cliquerTour(index) {
    if (!partieEnCours) {
        afficherMessage(
            "Cliquez sur Démarrer pour commencer la partie."
        );
        return;
    }

    if (demoEnCours || animationEnCours || partieTerminee) {
        return;
    }

    // Première sélection.
    if (anneauSelectionne === null) {
        if (etatTours[index].length === 0) {
            afficherMessage("Cette tour est vide.");
            return;
        }

        const taille =
            etatTours[index][etatTours[index].length - 1];

        anneauSelectionne = {
            tour: index,
            taille: taille
        };

        afficherAnneaux();

        afficherMessage(
            "Anneau sélectionné. Choisissez une tour de destination."
        );

        return;
    }

    const origine = anneauSelectionne.tour;

    // Cliquer sur la tour d'origine annule la sélection.
    if (origine === index) {
        anneauSelectionne = null;
        afficherAnneaux();

        afficherMessage("Sélection annulée.");
        return;
    }

    // Refuser un déplacement interdit.
    if (!deplacementAutorise(origine, index)) {
        afficherRefus(index);
        return;
    }

    animationEnCours = true;

    await deplacerAnneau(origine, index);

    animationEnCours = false;

    verifierVictoire();

    if (!partieTerminee) {
        afficherMessage("Déplacement effectué. Continuez !");
    }
}

/* =====================================
   ANIMATION DE REFUS
===================================== */

function afficherRefus(index) {
    const tour = tours[index];

    tour.classList.remove("refus");

    // Relancer l'animation CSS.
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

/* =====================================
   VICTOIRE ET SCORE
===================================== */

function verifierVictoire() {
    if (partieTerminee) return;

    if (etatTours[2].length !== nombreAnneaux) {
        return;
    }

    partieTerminee = true;
    partieEnCours = false;

    anneauSelectionne = null;

    const scoreFinal = Math.round(
        (calculerMinimum() / coups) * 100
    );

    score.textContent = scoreFinal + " %";

    afficherAnneaux();

    afficherMessage(
        `🎉 Félicitations ! Partie terminée en ${coups} coups. Score : ${scoreFinal} %.`
    );
}

/* =====================================
   CORRECTION DU NOMBRE D'ANNEAUX
===================================== */

function obtenirNombreAnneaux() {
    const valeur = champAnneaux.value.trim();
    const nombre = Number(valeur);

    if (
        valeur === "" ||
        !Number.isInteger(nombre) ||
        nombre < 1 ||
        nombre > 8
    ) {
        let correction = 3;

        if (valeur !== "" && Number.isFinite(nombre)) {
            correction = Math.max(
                1,
                Math.min(8, Math.floor(nombre))
            );
        }

        champAnneaux.value = correction;

        afficherMessage(
            `Valeur incorrecte : entre 1 et 8 anneaux sont autorisés. Correction : ${correction}.`
        );

        return correction;
    }

    return nombre;
}

/* =====================================
   CALCUL DE LA SOLUTION
===================================== */

function resoudre(n, de, vers, via) {
    if (n === 0) {
        return [];
    }

    return [
        ...resoudre(n - 1, de, via, vers),
        [de, vers],
        ...resoudre(n - 1, via, vers, de)
    ];
}

/* =====================================
   DÉMONSTRATION AUTOMATIQUE
===================================== */

async function lancerDemo() {
    // Annuler une ancienne démonstration.
    interrompreDemo();

    const id = identifiantDemo;

    const n = obtenirNombreAnneaux();

    creerAnneaux(n);

    demoEnCours = true;

    afficherMessage("🤖 Démonstration automatique en cours...");

    const solution = resoudre(n, 0, 2, 1);

    for (const [de, vers] of solution) {
        // Vérifier que cette démo est toujours active.
        if (id !== identifiantDemo) {
            return;
        }

        await deplacerAnneau(de, vers);

        if (id !== identifiantDemo) {
            return;
        }

        await attendre(
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 100
                : 180
        );
    }

    if (id !== identifiantDemo) {
        return;
    }

    demoEnCours = false;

    verifierVictoire();
}

/* =====================================
   INTERRUPTION DE LA DÉMONSTRATION
===================================== */

function interrompreDemo() {
    identifiantDemo++;

    demoEnCours = false;
    animationEnCours = false;

    // Supprimer les clones encore visibles.
    document.querySelectorAll(".anneau-animation").forEach(
        clone => clone.remove()
    );
}

/* =====================================
   DÉMARRER UNE NOUVELLE PARTIE
===================================== */

btnDemarrer.addEventListener("click", () => {
    interrompreDemo();

    const n = obtenirNombreAnneaux();

    creerAnneaux(n);

    afficherMessage(
        `Nouvelle partie : ${n} anneau(x). À vous de jouer !`
    );
});

/* =====================================
   LANCER LA DÉMO
===================================== */

btnDemo.addEventListener("click", lancerDemo);

/* =====================================
   RESET
===================================== */

btnReset.addEventListener("click", () => {
    interrompreDemo();

    etatTours = [[], [], []];

    nombreAnneaux = 0;
    coups = 0;

    anneauSelectionne = null;

    partieEnCours = false;
    partieTerminee = false;

    compteur.textContent = "0";
    minimum.textContent = "0";
    score.textContent = "—";

    tours.forEach(tour => {
        tour.innerHTML = "";
        tour.classList.remove("refus");
    });

    afficherMessage(
        "Jeu réinitialisé. Cliquez sur Démarrer pour recommencer."
    );
});

/* =====================================
   MODE SOMBRE / CLAIR
===================================== */

btnTheme.addEventListener("click", () => {
    themeSombre = !themeSombre;

    document.body.classList.toggle(
        "theme-sombre",
        themeSombre
    );

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

/* =====================================
   ÉVÉNEMENTS DES TOURS
===================================== */

tours.forEach((tour, index) => {
    tour.addEventListener("click", () => {
        cliquerTour(index);
    });
});

/* =====================================
   INITIALISATION
===================================== */

console.assert(
    resoudre(3, 0, 2, 1).length === 7,
    "Erreur dans la solution à 3 anneaux."
);

console.assert(
    resoudre(5, 0, 2, 1).length === 31,
    "Erreur dans la solution à 5 anneaux."
);

afficherAnneaux();
