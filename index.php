<?php
// Démarrer la session pour garder le pseudo
session_start();

// Initialiser le fichier de scores s'il n'existe pas
if (!file_exists('data/scores.json')) {
    file_put_contents('data/scores.json', json_encode([]));
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevQuiz Top List</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Heroicons CDN (SVG) -->
    <script src="https://unpkg.com/heroicons@2.0.13/dist/heroicons.min.js"></script>
    <script>
    // Ajout du support dark mode Tailwind dès le chargement
    if (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class'
      }
    </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-500 transition text-gray-900 dark:text-gray-100">
    <div class="container mx-auto px-2 py-6 md:py-10">
        <!-- Hero Header -->
        <header class="relative rounded-3xl overflow-hidden mb-10 shadow-xl bg-indigo-600 dark:bg-indigo-400 text-white p-8 flex flex-col items-center justify-center">
            <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] pointer-events-none"></div>
            <!-- Dark mode toggle -->
            <button id="theme-toggle" class="absolute top-4 right-4 z-20 bg-white/20 dark:bg-gray-800/60 rounded-full p-2 shadow hover:scale-110 transition flex items-center justify-center" title="Changer de thème">
                <svg id="icon-sun" class="w-6 h-6 text-yellow-300 dark:hidden transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
                <svg id="icon-moon" class="w-6 h-6 text-indigo-200 hidden dark:inline transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
            </button>
            <div class="relative z-10 flex flex-col items-center">
                <div class="mb-3">
                    <svg class="w-16 h-16 text-white drop-shadow-lg" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h1 class="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight drop-shadow">DevQuiz Top List</h1>
                <p class="text-lg md:text-xl font-medium mb-4 drop-shadow">Génère ton quiz dev sur-mesure et mesure-toi aux meilleurs !</p>
                <button id="scroll-quiz" class="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2 rounded-full shadow transition flex items-center gap-2">
                    <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                    Commencer
                </button>
            </div>
        </header>

        <div class="flex flex-col lg:flex-row gap-8" id="main-content">
            <!-- Section Quiz -->
            <div class="lg:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative transition-colors duration-500">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <svg class="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Quiz
                    </h2>
                    <div id="quiz-status" class="text-sm text-gray-500 dark:text-gray-400">Prêt à commencer</div>
                </div>

                <!-- Sélection du quiz -->
                <div id="quiz-selection" class="mb-8 animate-fade-in">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Thème</label>
                            <select id="quiz-topic" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100">
                                <option value="JavaScript">JavaScript</option>
                                <option value="CSS">CSS</option>
                                <option value="HTML">HTML</option>
                                <option value="Python">Python</option>
                                <option value="SQL">SQL</option>
                                <option value="Regex">Regex</option>
                                <option value="Git">Git</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Niveau</label>
                            <select id="quiz-level" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100">
                                <option value="débutant">Débutant</option>
                                <option value="intermédiaire">Intermédiaire</option>
                                <option value="avancé">Avancé</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre de questions</label>
                            <select id="quiz-count" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100">
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mot-clé personnalisé (optionnel)</label>
                            <input type="text" id="quiz-keyword" placeholder="Ex: closure, async, flexbox..." class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100">
                        </div>
                    </div>
                    <div class="mb-4 flex items-center gap-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Pseudo</label>
                        <input type="text" id="user-pseudo" value="<?= $_SESSION['pseudo'] ?? 'Anonyme_' . rand(1000, 9999) ?>" 
                               class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-100">
                        <span id="avatar-pseudo" class="ml-2 w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow">
                            <i class="fas fa-user"></i>
                        </span>
                    </div>
                    <button id="generate-quiz" class="w-full bg-indigo-600 dark:bg-indigo-400 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:scale-105 transition flex items-center justify-center gap-2">
                        <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Générer un quiz
                    </button>
                </div>

                <!-- Loader -->
                <div id="quiz-loader" class="hidden flex flex-col items-center justify-center py-8 animate-fade-in">
                    <svg class="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" class="opacity-75"></path></svg>
                    <span class="text-indigo-600 dark:text-indigo-400 font-semibold">Génération du quiz en cours...</span>
                </div>

                <!-- Zone du quiz -->
                <div id="quiz-container" class="hidden animate-fade-in">
                    <div class="mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-sm text-gray-500 dark:text-gray-400">Progression</span>
                            <div id="progress-bar" class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div id="progress-bar-inner" class="h-2 bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-400 transition-all duration-300" style="width:0%"></div>
                            </div>
                        </div>
                    </div>
                    <div id="questions-list" class="space-y-6"></div>
                    <div class="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div id="score-display" class="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Score: 0/0</div>
                        <button id="submit-quiz" class="bg-teal-500 dark:bg-teal-400 text-white py-2 px-6 rounded-md font-semibold shadow hover:bg-teal-600 dark:hover:bg-teal-500 transition flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                            Valider
                        </button>
                    </div>
                </div>

                <!-- Résultats -->
                <div id="quiz-results" class="hidden mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow animate-fade-in">
                    <h3 class="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <svg class="w-6 h-6 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        Résultats
                    </h3>
                    <div id="results-content"></div>
                    <button id="new-quiz" class="mt-4 bg-indigo-600 dark:bg-indigo-400 text-white py-2 px-4 rounded-md font-semibold shadow hover:bg-indigo-700 dark:hover:bg-indigo-500 transition flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v16h16"></path></svg>
                        Nouveau quiz
                    </button>
                </div>
            </div>

            <!-- Top List -->
            <div class="lg:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col transition-colors duration-500">
                <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                    <svg class="w-7 h-7 text-yellow-400 dark:text-yellow-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 17.75L18.2 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                    Top List
                </h2>
                <div class="mb-4 flex space-x-2">
                    <button id="show-global" class="px-3 py-1 bg-indigo-100 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 rounded-md text-sm font-semibold shadow hover:bg-indigo-200 dark:hover:bg-indigo-400/40 transition">Global</button>
                    <button id="show-today" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-md text-sm font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition">Aujourd'hui</button>
                </div>
                <div id="toplist-content" class="space-y-3">
                    <p class="text-gray-500 dark:text-gray-400 text-center py-4">Chargement des scores...</p>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/js/app.js"></script>
    <script>
    // Animation scroll vers le quiz
    document.getElementById('scroll-quiz').addEventListener('click', function() {
        document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
    });
    // Avatar pseudo dynamique (initiales ou icône)
    const pseudoInput = document.getElementById('user-pseudo');
    const avatarPseudo = document.getElementById('avatar-pseudo');
    function updateAvatar() {
        const val = pseudoInput.value.trim();
        if(val.length > 0) {
            avatarPseudo.textContent = val[0].toUpperCase();
        } else {
            avatarPseudo.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
    pseudoInput.addEventListener('input', updateAvatar);
    updateAvatar();

    // Dark mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', function() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
    </script>
</body>
</html>