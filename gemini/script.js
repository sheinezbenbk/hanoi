const COULEURS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#34495e'];

const inputNb = document.getElementById('nb-anneaux');
const btnDemarrer = document.getElementById('btn-demarrer');
const btnDemo = document.getElementById('btn-demo');
const btnReset = document.getElementById('btn-reset');
const btnTheme = document.getElementById('btn-theme');
const plateau = document.getElementById('plateau');
const tours = plateau.querySelectorAll('.tour');
const compteurEl = document.getElementById('compteur-coups');
const msgErreur = document.getElementById('message-erreur');
const msgVictoire = document.getElementById('message-victoire');

let coups = 0;
let selection = null;
let partieEnCours = false;
let partieTerminee = false;
let demoEnCours = false;

function afficherErreur(txt) {
    msgErreur.textContent = txt;
    msgErreur.classList.remove('cache');
}

function cacherErreur() {
    msgErreur.textContent = '';
    msgErreur.classList.add('cache');
}

function validerNb() {
    let val = parseInt(inputNb.value, 10);
    if (isNaN(val) || val < 1) {
        val = 1;
        afficherErreur("Valeur corrigée à 1.");
    } else if (val > 8) {
        val = 8;
        afficherErreur("Valeur corrigée à 8.");
    } else {
        cacherErreur();
    }
    inputNb.value = val;
    return val;
}

function demarrer() {
    demoEnCours = false;
    const n = validerNb();
    tours.forEach(t => t.innerHTML = '');
    coups = 0;
    selection = null;
    partieEnCours = true;
    partieTerminee = false;
    compteurEl.textContent = coups;
    msgVictoire.classList.add('cache');

    for (let i = n; i >= 1; i--) {
        const anneau = document.createElement('div');
        anneau.className = 'anneau';
        anneau.dataset.taille = i;
        anneau.style.width = `${20 + (i / n) * 60}%`;
        anneau.style.backgroundColor = COULEURS[i - 1];
        tours[0].appendChild(anneau);
    }
}

function reset() {
    demoEnCours = false;
    tours.forEach(t => t.innerHTML = '');
    coups = 0;
    selection = null;
    partieEnCours = false;
    partieTerminee = false;
    compteurEl.textContent = '0';
    cacherErreur();
    msgVictoire.classList.add('cache');
}

function deplacer(tourSrc, tourDest) {
    const sommetSrc = tourSrc.lastElementChild;
    const sommetDest = tourDest.lastElementChild;

    if (!sommetSrc) return false;
    if (sommetDest && parseInt(sommetSrc.dataset.taille) > parseInt(sommetDest.dataset.taille)) {
        return false;
    }

    tourDest.appendChild(sommetSrc);
    coups++;
    compteurEl.textContent = coups;

    if (tours[2].children.length === parseInt(inputNb.value) && !partieTerminee) {
        partieTerminee = true;
        const minCoups = Math.pow(2, parseInt(inputNb.value)) - 1;
        const score = Math.round((minCoups / coups) * 100);
        msgVictoire.textContent = `Victoire en ${coups} coups ! Score : ${score}% (${minCoups} min).`;
        msgVictoire.classList.remove('cache');
    }
    return true;
}

plateau.addEventListener('click', (e) => {
    if (!partieEnCours || partieTerminee || demoEnCours) {
        if (!partieEnCours) afficherErreur("Cliquez sur Démarrer.");
        return;
    }

    const tour = e.target.closest('.tour');
    if (!tour) return;

    if (!selection) {
        if (tour.lastElementChild) {
            selection = tour.lastElementChild;
            selection.classList.add('selectionne');
        }
    } else {
        const tourSrc = selection.parentElement;
        if (tourSrc === tour) {
            selection.classList.remove('selectionne');
            selection = null;
        } else {
            if (deplacer(tourSrc, tour)) {
                selection.classList.remove('selectionne');
                selection = null;
            } else {
                tour.classList.add('refus');
                setTimeout(() => tour.classList.remove('refus'), 400);
            }
        }
    }
});

function resoudre(n, de, vers, via) {
    if (n === 1) return [[de, vers]];
    return [...resoudre(n - 1, de, via, vers), [de, vers], ...resoudre(n - 1, via, vers, de)];
}

async function lancerDemo() {
    demarrer();
    demoEnCours = true;
    const n = parseInt(inputNb.value);
    const mouvements = resoudre(n, 0, 2, 1);

    for (let [src, dest] of mouvements) {
        if (!demoEnCours) break;
        await new Promise(r => setTimeout(r, 400));
        if (!demoEnCours) break;
        deplacer(tours[src], tours[dest]);
    }
    demoEnCours = false;
}

btnDemarrer.addEventListener('click', demarrer);
btnReset.addEventListener('click', reset);
btnDemo.addEventListener('click', lancerDemo);

btnTheme.addEventListener('click', () => {
    const html = document.documentElement;
    const sombre = html.getAttribute('data-theme') === 'sombre';
    html.setAttribute('data-theme', sombre ? 'clair' : 'sombre');
    btnTheme.textContent = sombre ? 'Mode sombre' : 'Mode clair';
});