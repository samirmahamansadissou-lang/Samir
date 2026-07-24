# Portfolio — Samir Mahaman Sadissou

Site portfolio personnel, responsive, construit en **HTML, CSS et JavaScript** purs (aucune installation requise).

## ✨ Fonctionnalités

- Design moderne et responsive (mobile, tablette, ordinateur)
- Mode sombre / clair avec mémorisation du choix
- Menu mobile
- Animations d'apparition au défilement
- Barres de compétences animées
- Frise de parcours (timeline)
- Formulaire de contact fonctionnel (via Formspree)
- Bouton de téléchargement du CV
- Sections : Accueil, À propos, Compétences, Parcours, Projets, Contact

## 📁 Structure

```
.
├── index.html   # Structure de la page
├── styles.css   # Styles et thèmes
└── script.js    # Interactivité (thème, menu, données, animations)
```

## 🚀 Lancer le site en local

Aucune dépendance. Ouvre simplement `index.html` dans ton navigateur.

Ou, pour un petit serveur local :

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

## ✏️ Personnaliser

- **Textes** : modifie directement `index.html`.
- **Compétences, parcours et projets** : édite les tableaux `skills`, `timeline` et `projects` en haut de `script.js`.
  - Pour un projet, remplis `link` (lien démo) et `code` (dépôt GitHub) — laisse `""` pour masquer le bouton.
- **Couleurs** : ajuste les variables `--accent`, `--bg`… au début de `styles.css`.

## 📄 Ajouter ton CV

Dépose ton CV au format PDF à la racine du projet, nommé **`cv.pdf`**.
Le bouton « Télécharger mon CV » (page d'accueil) le proposera automatiquement.

## 📬 Activer le formulaire de contact

Le formulaire utilise [Formspree](https://formspree.io) (gratuit, sans backend) :

1. Crée un compte sur [formspree.io](https://formspree.io) et un nouveau formulaire.
2. Copie l'identifiant fourni (ex. `xzbqwabc`).
3. Dans `index.html`, remplace `VOTRE_ID_FORMSPREE` dans l'attribut `action` du formulaire :
   ```html
   <form ... action="https://formspree.io/f/xzbqwabc" method="POST">
   ```

Tant que ce n'est pas configuré, le formulaire affiche un message d'avertissement au lieu d'envoyer.

## 🌍 Mettre en ligne (gratuit)

**GitHub Pages** : dans les *Settings* du dépôt → *Pages* → sélectionne la branche → le site est publié.

D'autres options : [Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/) — glisser-déposer le dossier suffit.
