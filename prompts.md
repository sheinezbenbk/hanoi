### Le Journal du TP 


## Exercice 1 

**A/** Le LLM (Claude) a bien respecté la séparation des trois fichiers.
Cependant, il y a des éléments non demandés qui ont été ajoutés : 
- Dans inde.html : il y a un titre <h1>, un <label for="nb-anneaux">, une <div class="commandes"> et des balises <meta> et <title> 
- Dans style.css : tout l'habillage, nous avons demandé que la structure, mais si ils sont sans styles, tours serait invisibles et la page ressemblerait à une page blanche. 

**B/** Ces noms forment le contrat HTML, le CSS et la Javascript. Le script cherchera des identifiant non définis, s'ils changent d'un caractère, tout casse sans erreur claire. Les fixer dès le départ garantit la cohérence entre les étapes suivantes. 


