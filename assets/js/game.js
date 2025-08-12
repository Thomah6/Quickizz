import { authStateObserver, signInWithGoogle, signOutUser } from './auth.js';
import { getQuizzesForModule, saveUserScore, getTechnologyDetails, getModulesForTechnology } from './firestore.js';

// Simple confetti (fallback CSS emojis)
const launchConfetti = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    for (let i = 0; i < 60; i++) {
        const span = document.createElement('span');
        span.textContent = Math.random() > 0.5 ? '🎉' : '✨';
        span.style.position = 'absolute';
        span.style.left = Math.random() * 100 + '%';
        span.style.top = '-10%';
        span.style.fontSize = (12 + Math.random() * 18) + 'px';
        span.style.transition = 'transform 1.4s ease, opacity 1.4s ease';
        container.appendChild(span);
        setTimeout(() => {
            span.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random()*360}deg)`;
            span.style.opacity = '0';
        }, 0);
    }
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1600);
};

// Variables pour le minuteur
let timeLeft = 10 * 60; // 10 minutes en secondes
let timerInterval = null;

// Fonction pour formater le temps en minutes:secondes
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fonction pour démarrer le minuteur
function startTimer() {
    const timerElement = document.getElementById('timer');
    
    // Mettre à jour immédiatement
    timerElement.textContent = formatTime(timeLeft);
    
    // Démarrer le compte à rebours
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Mettre à jour l'affichage
        timerElement.textContent = formatTime(timeLeft);
        
        // Changer la couleur en orange quand il reste 2 minutes
        if (timeLeft <= 120) {
            timerElement.classList.add('text-orange-500');
            timerElement.classList.remove('text-red-500');
        }
        
        // Changer la couleur en rouge quand il reste 30 secondes
        if (timeLeft <= 30) {
            timerElement.classList.remove('text-orange-500');
            timerElement.classList.add('text-red-500');
            
            // Faire clignoter les 10 dernières secondes
            if (timeLeft <= 10) {
                timerElement.classList.toggle('opacity-70');
            }
        }
        
        // Temps écoulé
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }
    }, 1000);
}

// Fonction appelée quand le temps est écoulé
function timeUp() {
    // Désactiver tous les boutons de réponse
    const buttons = document.querySelectorAll('#options-container button');
    buttons.forEach(button => {
        button.disabled = true;
    });
    
    // Afficher un message
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = '<span class="flex items-center"><span class="material-icons text-red-600 mr-2">timer_off</span>Temps écoulé !</span>';
    resultContainer.className = 'text-lg font-semibold text-red-600 mb-2';
    
    // Afficher le bouton pour voir les résultats
    nextBtn.classList.remove('hidden');
    
    // Afficher les résultats finaux
    showFinalResults();
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- Breadcrumb ---
    const breadcrumbContainer = document.getElementById('breadcrumb');
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('techId');
    const moduleId = params.get('moduleId');
    let techName = techId;
    let moduleName = moduleId;
    if (techId && moduleId) {
        try {
            const techDetails = await getTechnologyDetails(techId);
            if (techDetails && techDetails.name) techName = techDetails.name;
            const modules = await getModulesForTechnology(techId);
            const foundModule = modules.find(m => m.id === moduleId);
            if (foundModule && foundModule.name) moduleName = foundModule.name;
        } catch (e) {}
        breadcrumbContainer.innerHTML = `<a href="/" class="hover:underline">Accueil</a> > <a href="/quiz.html?tech=${techId}" class="hover:underline">Quiz</a> > <span class="font-semibold">${techName} - ${moduleName}</span>`;
    } else {
        breadcrumbContainer.innerHTML = `<a href="/" class="hover:underline">Accueil</a> > <span class="font-semibold">Quiz</span>`;
    }

    // --- DOM Elements ---
    const questionEl = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-btn');
    const resultContainer = document.getElementById('result-container');
    const appreciationContainer = document.getElementById('appreciation-container');
    const quizArea = document.getElementById('quiz-area');
    const resultArea = document.getElementById('result-area');
    const scoreDisplay = document.getElementById('score');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');

    // --- State ---
    let quizzes = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let currentUser = null;

    const loadQuizData = async () => {
        const params = new URLSearchParams(window.location.search);
        const techId = params.get('techId');
        const moduleId = params.get('moduleId');

        if (!techId || !moduleId) {
            questionEl.textContent = 'Erreur : Manque des informations pour charger le quiz.';
            return;
        }

        quizzes = await getQuizzesForModule(techId, moduleId);
        if (quizzes && quizzes.length > 0) {
            startQuiz();
        } else {
            questionEl.textContent = 'Désolé, aucun quiz n\'est disponible pour ce module pour le moment.';
        }
    };

    const startQuiz = () => {
        currentQuestionIndex = 0;
        score = 0;
        timeLeft = 10 * 60; // Réinitialiser le minuteur à 10 minutes
        if (timerInterval) clearInterval(timerInterval);
        startTimer();
        showQuestion();
    };

    // Fonction pour mélanger un tableau (algorithme de Fisher-Yates)
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const showQuestion = () => {
        // Reset UI
        resultContainer.textContent = '';
        appreciationContainer.classList.add('hidden');
        nextBtn.classList.add('hidden');
        optionsContainer.innerHTML = '';

        const question = quizzes[currentQuestionIndex];
        questionEl.textContent = question.question;

        // Update progress bar
        const progress = ((currentQuestionIndex + 1) / quizzes.length) * 100;
        progressText.textContent = `Question ${currentQuestionIndex + 1}/${quizzes.length}`;
        progressBar.style.width = `${progress}%`;

        // Mélanger les options de réponse
        const shuffledOptions = shuffleArray(question.options);
        
        // Afficher les boutons dans un ordre aléatoire
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'w-full text-left p-4 bg-gray-100 rounded-lg border-2 border-transparent hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2da44e]';
            button.addEventListener('click', () => handleAnswer(button, option, question.answer));
            optionsContainer.appendChild(button);
        });
    };

    const handleAnswer = (button, selectedOption, correctAnswer) => {
        const isCorrect = selectedOption === correctAnswer;

        // Disable all buttons
        Array.from(optionsContainer.children).forEach(btn => {
            btn.disabled = true;
            // Reveal correct answer
            if (btn.textContent === correctAnswer) {
                btn.classList.add('bg-green-100', 'border-green-500');
            }
        });

        if (isCorrect) {
            score++;
            resultContainer.innerHTML = '<span class="flex items-center"><span class="material-icons text-green-600 mr-2">check_circle</span>Bonne réponse !</span>';
            resultContainer.className = 'text-lg font-semibold text-green-600 mb-2';
        } else {
            resultContainer.innerHTML = '<span class="flex items-center"><span class="material-icons text-red-600 mr-2">cancel</span>Mauvaise réponse.</span>';
            resultContainer.className = 'text-lg font-semibold text-red-600 mb-2';
            button.classList.add('bg-red-100', 'border-red-500'); // Highlight wrong answer
        }

        // Show appreciation if available
        const question = quizzes[currentQuestionIndex];
        if (question.appreciation) {
            appreciationContainer.innerHTML = `<p><strong class='font-semibold'>Explication :</strong> ${question.appreciation}</p>`;
            appreciationContainer.classList.remove('hidden');
        }

        nextBtn.classList.remove('hidden');
    };

    const showFinalResults = async () => {
        // Arrêter le minuteur
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        quizArea.classList.add('hidden');
        resultArea.classList.remove('hidden');
        // Affichage du score ?/total
        scoreDisplay.textContent = `${score}/${quizzes.length}`;
        // Message d'appréciation
        const appreciationDiv = document.getElementById('score-appreciation');
        let appreciation = '';
        const ratio = score / quizzes.length;
        if (ratio === 1) {
            appreciation = "🔥 Parfait ! Tu es un(e) vrai(e) boss du quiz !";
        } else if (ratio >= 0.8) {
            appreciation = "👏 Excellent ! Tu frôles la perfection, continue comme ça !";
        } else if (ratio >= 0.6) {
            appreciation = "😎 Pas mal du tout ! Encore un petit effort pour le top !";
        } else if (ratio >= 0.4) {
            appreciation = "💪 Courage ! Rome ne s'est pas faite en un jour. Tu vas y arriver !";
        } else if (ratio > 0) {
            appreciation = "😂 Oups ! C'est le moment de réviser un peu... ou de retenter ta chance !";
        } else {
            appreciation = "🤔 Tu as tenté, c'est déjà ça ! La prochaine sera la bonne !";
        }
        appreciationDiv.textContent = appreciation;

        // Boutons Reprendre et Module suivant
        const retryBtn = document.getElementById('retry-btn');
        const nextModuleBtn = document.getElementById('next-module-btn');
        if (retryBtn) {
            retryBtn.onclick = () => {
                resultArea.classList.add('hidden');
                quizArea.classList.remove('hidden');
                startQuiz();
                const loginPrompt = document.getElementById('login-btn-final')?.parentElement;
                if (loginPrompt) loginPrompt.remove();
            };
        }
        if (nextModuleBtn) {
            nextModuleBtn.onclick = async () => {
                const params = new URLSearchParams(window.location.search);
                const techId = params.get('techId');
                const moduleId = params.get('moduleId');
                try {
                    const modules = await getModulesForTechnology(techId);
                    const idx = modules.findIndex(m => m.id === moduleId);
                    if (idx !== -1 && idx < modules.length - 1) {
                        const nextModule = modules[idx + 1];
                        window.location.href = `/game.html?techId=${techId}&moduleId=${nextModule.id}`;
                    } else {
                        nextModuleBtn.disabled = true;
                        nextModuleBtn.textContent = 'Aucun autre module';
                    }
                } catch (e) {
                    nextModuleBtn.disabled = true;
                    nextModuleBtn.textContent = 'Erreur';
                }
            };
        }

        if (currentUser) {
            const params = new URLSearchParams(window.location.search);
            const techId = params.get('techId');
            const moduleId = params.get('moduleId');
            saveUserScore(currentUser.uid, techId, moduleId, score, quizzes.length);
        } else {
            // Afficher un message d'incitation à la connexion
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-900 flex flex-col items-center';
            loginPrompt.innerHTML = `
                <span class="material-icons text-3xl mb-2">person</span>
                <p class="mb-2 text-center">Connecte-toi pour sauvegarder tes prochains scores et apparaître dans le classement !</p>
                <button id="login-btn-final" class="flex items-center gap-2 bg-[#2da44e] hover:bg-[#2c974b] text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                    <span class="material-icons">login</span>
                    Connexion
                </button>
            `;
            resultArea.appendChild(loginPrompt);
            document.getElementById('login-btn-final').addEventListener('click', signInWithGoogle);
        }
    };

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizzes.length) {
            showQuestion();
        } else {
            showFinalResults();
        }
    });

    // --- Auth Logic ---
    const authContainerDesktop = document.getElementById('auth-container-desktop');
    const authContainerMobile = document.getElementById('auth-container-mobile');
    authStateObserver((user) => {
        currentUser = user;

        const loggedInHtml = `
            <div class="flex items-center gap-3">
                <img src="${user.photoURL}" alt="${user.displayName}" class="w-9 h-9 rounded-full border-2 border-white">
                <button id="logout-btn" class="text-[#57606a] hover:text-red-600 font-medium flex items-center gap-2">
                    <span class="material-icons">logout</span>
                    Déconnexion
                </button>
            </div>
        `;

        const loggedOutHtml = `
            <button id="login-btn" class="flex items-center gap-2 bg-[#2da44e] hover:bg-[#2c974b] text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                <span class="material-icons">login</span>
                Connexion
            </button>
        `;

        if (user) {
            authContainerDesktop.innerHTML = loggedInHtml;
            authContainerMobile.innerHTML = loggedInHtml;
        } else {
            authContainerDesktop.innerHTML = loggedOutHtml;
            authContainerMobile.innerHTML = loggedOutHtml;
        }
    });
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#login-btn')) signInWithGoogle();
        if (e.target.closest('#logout-btn')) signOutUser();
    });

    // --- Initial Load ---
    loadQuizData();
});
