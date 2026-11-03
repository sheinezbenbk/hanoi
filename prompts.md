
# Le Journal du TP

## Exercice 1

**A/** Le LLM (Claude) a bien respecté la séparation des trois fichiers.

Cependant, il y a des éléments non demandés qui ont été ajoutés :
- Dans index.html : il y a un titre `<h1>`, un `<label for="nb-anneaux">`, une `<div class="commandes">` et des balises `<meta>` et `<title>`.
- Dans style.css : tout l'habillage. Nous avons demandé que la structure, mais si elle est sans styles, tout serait invisible et la page ressemblerait à une page blanche.

**B/** Ces noms forment le contrat HTML, le CSS et le JavaScript. Le script cherchera des identifiants non définis ; s'ils changent d'un caractère, tout casse sans erreur claire. Les fixer dès le départ garantit la cohérence entre les étapes suivantes.

## Exercice 2

**A/** L'état du jeu est rangé dans une variable JavaScript, pas dans le DOM.
