# DevQuiz Top List

Générateur de quiz techniques pour développeurs avec classement en temps réel.

## Fonctionnalités

- Génération de quiz par IA (JavaScript, CSS, Python, etc.)
- 3 niveaux de difficulté
- Classement global et quotidien
- Pas d'inscription requise
- Feedback immédiat avec explications

## Installation

1. Cloner le dépôt
2. Configurer un serveur web avec PHP
3. Remplacer la clé API Groq dans `api/generate.php`
4. Assurer que le dossier `data/` est accessible en écriture

## Configuration

- Modifier les thèmes disponibles dans `index.php`
- Adapter les prompts IA dans `api/generate.php`

## Technologies

- PHP (backend)
- JavaScript vanilla (frontend)
- Tailwind CSS (styles)
- Groq API (génération IA)