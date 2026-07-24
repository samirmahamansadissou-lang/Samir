# StockCaisse 🧾

Application mobile (PWA) pour **entrepreneurs** : gérez votre stock, encaissez vos ventes et générez des reçus — **sans avoir à discuter avec le client**, et **même hors-ligne**.

Construite en **HTML, CSS et JavaScript purs** — aucune installation, aucun serveur, aucun compte. Vos données restent sur votre téléphone.

## ✨ Fonctionnalités

- **📊 Tableau de bord** : chiffre d'affaires, bénéfice estimé, valeur du stock, ventes du jour.
- **📦 Stock** : ajout/modification de produits (prix de vente, prix d'achat, quantité), alertes de rupture.
- **🛒 Caisse** : panier rapide, le stock se décrémente automatiquement à chaque vente.
- **🧾 Reçus** : génération automatique numérotée, impression (PDF) et partage (WhatsApp, SMS…).
- **⚙️ Réglages** : nom de l'entreprise, téléphone, adresse, devise (FCFA par défaut).
- **💾 Sauvegarde** : export / import de toutes vos données en un fichier.
- **📴 Hors-ligne** : installable sur l'écran d'accueil, fonctionne sans connexion.

## 🚀 Essayer en local

Aucune dépendance. Depuis le dossier `app/` :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

> Ouvrir directement `index.html` fonctionne aussi, mais le mode hors-ligne
> (service worker) nécessite un petit serveur ou une mise en ligne (HTTPS).

## 📱 Installer sur le téléphone

Une fois le site en ligne (voir ci-dessous), ouvrez-le dans le navigateur puis
« **Ajouter à l'écran d'accueil** ». L'app s'ouvre alors en plein écran comme
une vraie application.

## 🌍 Mettre en ligne gratuitement (GitHub Pages)

1. Dépôt GitHub → **Settings** → **Pages**.
2. **Source** : « Deploy from a branch », branche `claude/create-app-2iz1y4`, dossier `/ (root)`.
3. L'app sera accessible à :
   `https://samirmahamansadissou-lang.github.io/Samir/app/`

## 📁 Structure

```
app/
├── index.html            # Interface
├── styles.css            # Styles (thème clair/sombre auto)
├── app.js                # Logique (stock, caisse, reçus)
├── manifest.webmanifest  # App installable
├── sw.js                 # Mode hors-ligne
└── icon.svg              # Icône
```

## 🔒 Confidentialité

Toutes les données (produits, ventes, reçus) sont enregistrées **localement**
dans le navigateur (`localStorage`). Rien n'est envoyé sur Internet. Pensez à
utiliser **Réglages → Exporter** pour garder une sauvegarde.
