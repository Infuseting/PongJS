Simple Pong
=============

Projet individuel — Pour Christophe Vallot

Description
-----------
Jeu Pong simple implémenté en HTML5 Canvas, JavaScript et Tailwind (CDN).

Fonctionnalités
---------------
- V1: Lancer / réinitialiser la partie, score = durée en secondes, contrôles clavier (← → / espace) et tactiles, balle avec orientation aléatoire, rebonds murs et raquette, message de fin.
- V2: Vitesse augmente progressivement jusqu'à 5x, angle jamais strictement vertical, meilleur score sauvegardé en localStorage.
- Options: choix de la couleur du fond et des éléments, sauvegardées en localStorage.

Fichiers
-------
- `index.html` — page principale (Tailwind + Font Awesome via CDN)
- `script.js` — logique du jeu
- `README.md` — ceci

Tester localement
-----------------
Ouvrez `index.html` dans votre navigateur (double-clic). Pour un meilleur résultat (et pour éviter des restrictions liées au fichier local), servez les fichiers via un serveur local simple :

PowerShell (Windows):

```powershell
# si vous avez Python 3 installé
python -m http.server 8000
# puis ouvrez http://localhost:8000
```

Accessibilité
-------------
- Contrôles clavier supportés.
- L'aire de jeu est un `canvas` et possède un label ARIA.
- Messages d'état placés dans une zone `aria-live`.

Notes
-----
- Le projet utilise les CDNs pour Tailwind et Font Awesome. Pour une production stricte, préférez inclure des fichiers locaux ou une pipeline de build.

Licence
-------
Usage pédagogique.
