const ETAT_INIT = {
    tours: [[], [], []],
    nbAnneauxTotal: 3,
    selection: null,
    coups: 0,
    partieEnCours: false,
    partieTerminee: false,
    idDemo: 0,
    animationEnCours: false
};

let etat = JSON.parse(JSON.stringify(ETAT_INIT));

const COULEURS_ANNEAUX = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#34495e'
];

const inputNbAnneaux = document.getElementById('nb-anneaux');
const btnDemarrer = document.getElementById('btn-demarrer');
const btnDemo = document.getElementById('btn-demo');
const btnReset = document.getElementById('btn-reset');
const btnTheme = document.getElementById('btn-theme');
const plateau = document.getElementById('plateau');
const compteurCoups = document.getElementById('compteur-coups');
const messageErreur = document.getElementById('message-erreur');
const messageVictoire = document.getElementById('message-victoire');

function afficherErreur(texte) {
    messageErreur.textContent = texte;
    messageErreur.classList.remove('cache');
}

function cacherErreur() {
    messageErreur.textContent = '';
    messageErreur.classList.add('cache');
}

function validerEtCorrigerNbAnneaux() {
    let valeur = parseInt(inputNbAnneaux.value, 10);
    if (isNaN(valeur) || !Number.isInteger(Number(inputNbAnneaux.value))) {
        valeur = 3;
        afficherErreur("Valeur invalide corrigée à 3 (nombre entier requis).");
    } else if (valeur < 1) {
        valeur = 1;
        afficherErreur("Valeur trop petite corrigée à 1.");
    } else if (valeur > 8) {
        valeur = 8;
        afficherErreur("Valeur trop grande corrigée à 8.");
    } else {
        cacherErreur();
    }
    inputNbAnneaux.value = valeur;
    return valeur;
}

function deplacementValide(de, vers, toursState) {
    if (de === vers) return false;
    const tourOrigine = toursState[de];
    const tourCible = toursState[vers];
    if (tourOrigine.length === 0) return false;
    if (tourCible.length === 0) return true;
    const sommetOrigine = tourOrigine[tourOrigine.length - 1];
    const sommetCible = tourCible[tourCible.length - 1];
    return sommetOrigine < sommetCible;
}

function resoudre(n, de, vers, via) {
    if (n === 1) {
        return [[de, vers]];
    }
    let coups = [];
    coups = coups.concat(resoudre(n - 1, de, via, vers));
    coups.push([de, vers]);
    coups.concat(resoudre(n - 1, via, vers, de));
    return coups;
}

function executerCoup(de, vers) {
    if (!deplacementValide(de, vers, etat.tours)) return false;
    const anneau = etat.tours[de].pop();
    etat.tours[vers].push(anneau);
    etat.coups++;
    
    if (etat.tours[2].length === etat.nbAnneauxTotal && !etat.partieTerminee) {
        etat.partieTerminee = true;
        const minimumCoups = Math.pow(2, etat.nbAnneauxTotal) - 1;
        const score = Math.round((minimumCoups / etat.coups) * 100);
        messageVictoire.textContent = `Victoire en ${etat.coups} coups ! Score : ${score}% (${minimumCoups} coups minimum).`;
        messageVictoire.classList.remove('cache');
    }
    return true;
}

function rendre() {
    compteurCoups.textContent = etat.coups;
    const elementsTours = plateau.querySelectorAll('.tour');
    
    elementsTours.forEach((tourEl, indexTour) => {
        tourEl.innerHTML = '';
        const anneaux = etat.tours[indexTour];
        
        anneaux.forEach((tailleAnneau, indexHauteur) => {
            const anneauEl = document.createElement('div');
            anneauEl.className = 'anneau';
            const largeurPourcent = 20 + (tailleAnneau / etat.nbAnneauxTotal) * 60;
            anneauEl.style.width = `${largeurPourcent}%`;
            anneauEl.style.backgroundColor = COULEURS_ANNEAUX[tailleAnneau - 1];
            
            if (etat.selection === indexTour && indexHauteur === anneaux.length - 1) {
                anneauEl.classList.add('selectionne');
            }
            tourEl.appendChild(anneauEl);
        });
    });
}

function animerDeplacement(de, vers, callback) {
    const elementsTours = plateau.querySelectorAll('.tour');
    const tourOrigineEl = elementsTours[de];
    const anneauEl = tourOrigineEl.lastElementChild;
    
    if (!anneauEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        callback();
        return;
    }
    
    etat.animationEnCours = true;
    const rectOrigine = tourOrigineEl.getBoundingClientRect();
    const rectCible = elementsTours[vers].getBoundingClientRect();
    const deltaX = rectCible.left - rectOrigine.left;
    
    anneauEl.style.transition = 'transform 0.2s ease';
    anneauEl.style.transform = 'translateY(-120px)';
    
    setTimeout(() => {
        anneauEl.style.transform = `translate(${deltaX}px, -120px)`;
        setTimeout(() => {
            anneauEl.style.transform = `translate(${deltaX}px, 0)`;
            setTimeout(() => {
                etat.animationEnCours = false;
                callback();
            }, 200);
        }, 200);
    }, 200);
}

function declencherRefus(indexTour) {
    const elementsTours = plateau.querySelectorAll('.tour');
    const tourEl = elementsTours[indexTour];
    tourEl.classList.add('refus');
    setTimeout(() => {
        tourEl.classList.remove('refus');
    }, 400);
}

function demarrerPartie() {
    etat.idDemo++;
    etat.animationEnCours = false;
    const n = validerEtCorrigerNbAnneaux();
    etat.nbAnneauxTotal = n;
    etat.tours = [[], [], []];
    for (let i = n; i >= 1; i--) {
        etat.tours[0].push(i);
    }
    etat.selection = null;
    etat.coups = 0;
    etat.partieEnCours = true;
    etat.partieTerminee = false;
    messageVictoire.classList.add('cache');
    messageVictoire.textContent = '';
    rendre();
}

function resetJeu() {
    etat.idDemo++;
    etat.animationEnCours = false;
    etat = JSON.parse(JSON.stringify(ETAT_INIT));
    cacherErreur();
    messageVictoire.classList.add('cache');
    messageVictoire.textContent = '';
    rendre();
}

plateau.addEventListener('click', (e) => {
    if (!etat.partieEnCours || etat.partieTerminee || etat.animationEnCours) {
        if (!etat.partieEnCours) {
            afficherErreur("Veuillez cliquer sur « Démarrer » pour commencer.");
        }
        return;
    }
    
    const tourEl = e.target.closest('.tour');
    if (!tourEl) return;
    const indexTour = parseInt(tourEl.dataset.index, 10);
    
    if (etat.selection === null) {
        if (etat.tours[indexTour].length > 0) {
            etat.selection = indexTour;
            rendre();
        }
    } else {
        const origine = etat.selection;
        if (origine === indexTour) {
            etat.selection = null;
            rendre();
        } else {
            if (deplacementValide(origine, indexTour, etat.tours)) {
                etat.selection = null;
                etat.animationEnCours = true;
                animerDeplacement(origine, indexTour, () => {
                    executerCoup(origine, indexTour);
                    rendre();
                });
            } else {
                declencherRefus(indexTour);
            }
        }
    }
});

async function lancerDemo() {
    etat.idDemo++;
    const currentIdDemo = etat.idDemo;
    demarrerPartie();
    const listeCoups = resoudre(etat.nbAnneauxTotal, 0, 2, 1);
    
    for (let [de, vers] of listeCoups) {
        if (etat.idDemo !== currentIdDemo) return;
        await new Promise((resolve) => {
            etat.animationEnCours = true;
            animerDeplacement(de, vers, () => {
                executerCoup(de, vers);
                rendre();
                resolve();
            });
        });
        await new Promise(r => setTimeout(r, 200));
    }
}

btnDemarrer.addEventListener('click', demarrerPartie);
btnReset.addEventListener('click', resetJeu);
btnDemo.addEventListener('click', lancerDemo);

btnTheme.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.getAttribute('data-theme') === 'sombre') {
        html.setAttribute('data-theme', 'clair');
        btnTheme.textContent = 'Mode sombre';
    } else {
        html.setAttribute('data-theme', 'sombre');
        btnTheme.textContent = 'Mode clair';
    }
});

rendre();