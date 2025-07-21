# Cahier des charges — HighFive Quickizz

## 1. Présentation générale

**HighFive Quickizz** est une application web ultra-légère de quiz technique pour développeurs, générant tous les quiz en temps réel grâce à une IA (Groq), avec classement instantané (“top list”) pour stimuler la progression, la motivation individuelle et l’émulation entre pairs.

## 2. Objectifs

- Permettre à chaque développeur de s’entraîner, de s’auto-évaluer et de se challenger sur les sujets clés du développement (JS, CSS, SQL, Python, Regex…).
- Rendre l’apprentissage quotidien plus fun, rapide et accessible à tous niveaux.
- Afficher un **classement dynamique** (top scores) pour encourager la compétition bienveillante ou simplement visualiser ses progrès.

## 3. Fonctionnalités principales

### 3.1 Génération instantanée de quiz par IA
- Choix du thème/langage (ex: JavaScript, CSS, SQL, Regex…)
- Sélection du niveau (débutant, intermédiaire, avancé)
- Sélection du nombre de questions (5, 10, 15)
- Saisie d’un mot-clé personnalisé (optionnel)
- Génération automatisée par IA (Groq) de 5 à 15 questions à chaque requête : QCM, Vrai/Faux, question ouverte courte
- Affichage instantané du quiz sans inscription préalable

### 3.2 Participation et scoring en temps réel
- Réponse directe aux questions sur l’interface
- Feedback immédiat pour chaque question (explication/correction IA visible dès la réponse)
- Calcul du score à la volée, affichage dynamique
- Validation finale pour voir le récapitulatif

### 3.3 Classement (“Top List”) & historique
- Affichage d’un tableau de scores (par pseudo), daté : classement du jour, global, ou par thème
- Filtrage dynamique par thème et pseudo (historique personnel)
- Affichage avatars (initiale ou icône), date et heure du score
- Stockage des meilleurs scores en base simple (fichier .json)
- Possibilité de jouer en invité (aucun login obligatoire)

### 3.4 Interface simple, rapide et moderne
- Design responsive grâce à **Tailwind CSS** (CDN, configs sans build)
- Icônes SVG (HeroIcons, FontAwesome CDN)
- UI dynamique en **JavaScript vanilla** (pas de framework, pas de Node/NPM, pas de transpilation)
- Navigation rapide, accès aux quiz, scores et top list en 1 ou 2 clics
- Mode light/dark avec toggle, persistance du choix
- Accessibilité (contrastes, navigation clavier, ARIA sur les boutons principaux)

### 3.5 Backend léger et déployable partout
- **PHP natif** (aucun framework, aucune dépendance lourde)
- Communication avec l’API Groq pour générer les quiz à la demande (requête HTTP, parsing JSON)
- Stockage des scores et classements dans des fichiers .json

### 3.6 Partage et viralité
- Bouton de partage du score (Twitter, LinkedIn, copier le lien) après chaque quiz

## 4. Points forts & différenciation

- **Génération purement IA** : tous les quiz sont uniques, contextualisés et renouvelés à chaque partie

- **Simplicité d’usage** : aucun formulaire lourd, aucune inscription, maximum deux actions pour jouer et se mesurer aux autres
- **Classement en live** : dynamique de groupe, stimulation du jeu et volonté de progresser chaque semaine

## 5. Spécifications techniques

### 5.1 Frontend
- HTML5, Tailwind CSS (CDN, darkMode: 'class')
- FontAwesome & HeroIcons (CDN)
- JavaScript vanilla (aucune dépendance)
- Responsive (mobile, tablette, desktop)
- Accessibilité (contrastes, navigation clavier, ARIA)

### 5.2 Backend
- PHP natif (aucun framework)
- Appels HTTP à l’API Groq (cURL)
- Stockage des scores dans `data/scores.json`
- API REST minimaliste pour la génération de quiz et la gestion des scores

### 5.3 Déploiement
- Fonctionne sur tout hébergement PHP standard (mutualisé ou dédié)
- Aucun build, aucune dépendance à installer
- Installation : copier les fichiers, configurer la clé API Groq


## 6. Évolutions possibles
- Mode révision (rejouer les questions ratées)
- PWA (offline, installation mobile)
- Export/partage de quiz
- Support base SQL en option

---

**Contact & contribution** : Projet open source, contributions bienvenues ! 