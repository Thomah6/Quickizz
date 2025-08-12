document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const quizSelection = document.getElementById('quiz-selection');
    const quizContainer = document.getElementById('quiz-container');
    const questionsList = document.getElementById('questions-list');
    const quizResults = document.getElementById('quiz-results');
    const resultsContent = document.getElementById('results-content');
    const scoreDisplay = document.getElementById('score-display');
    const generateBtn = document.getElementById('generate-quiz');
    const submitBtn = document.getElementById('submit-quiz');
    const newQuizBtn = document.getElementById('new-quiz');
    const toplistContent = document.getElementById('toplist-content');
    const showGlobalBtn = document.getElementById('show-global');
    const showTodayBtn = document.getElementById('show-today');
    const userPseudoInput = document.getElementById('user-pseudo');
    const quizStatus = document.getElementById('quiz-status');
    const progressBar = document.getElementById('progress-bar');
    const progressBarInner = document.getElementById('progress-bar-inner');

    // Variables d'état
    let currentQuiz = null;
    let userAnswers = [];
    let score = 0;
    let currentTopListFilter = 'global';

    // Charger le top list au démarrage
    loadTopList('global');

    // Événements
    generateBtn.addEventListener('click', generateQuiz);
    submitBtn.addEventListener('click', submitQuiz);
    newQuizBtn.addEventListener('click', resetQuiz);
    showGlobalBtn.addEventListener('click', () => loadTopList('global'));
    showTodayBtn.addEventListener('click', () => loadTopList('today'));

    // Générer un nouveau quiz
    async function generateQuiz() {
        const topic = document.getElementById('quiz-topic').value;
        const level = document.getElementById('quiz-level').value;
        const count = document.getElementById('quiz-count').value;
        const keyword = document.getElementById('quiz-keyword').value.trim();
        const pseudo = userPseudoInput.value.trim() || 'Anonyme_' + Math.floor(1000 + Math.random() * 9000);
        
        // Sauvegarder le pseudo en session
        try {
            const response = await fetch('/api/set_pseudo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo })
            });
        } catch (e) {
            console.error('Erreur sauvegarde pseudo:', e);
        }

        quizStatus.textContent = 'Génération en cours...';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';

        try {
            let url = `api/generate.php?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}&count=${encodeURIComponent(count)}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
            const response = await fetch(url);
            currentQuiz = await response.json();
            
            displayQuestions(currentQuiz.questions);
            quizSelection.classList.add('hidden');
            quizContainer.classList.remove('hidden');
            quizStatus.textContent = `Quiz ${topic} - Niveau ${level}`;
        } catch (error) {
            console.error('Erreur:', error);
            quizStatus.textContent = 'Erreur de génération';
            alert('Une erreur est survenue lors de la génération du quiz. Veuillez réessayer.');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = 'Générer un quiz <i class="fas fa-bolt ml-2"></i>';
        }
    }

    // Afficher les questions
    function displayQuestions(questions) {
        questionsList.innerHTML = '';
        userAnswers = [];
        
        questions.forEach((question, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'question p-4 border border-gray-200 rounded-lg';
            questionEl.dataset.index = index;
            questionEl.dataset.type = question.type;
            questionEl.dataset.correctAnswer = question.correctAnswer;
            
            let choicesHtml = '';
            if (question.type === 'multiple') {
                question.choices.forEach(choice => {
                    choicesHtml += `
                        <button class="choice-btn w-full text-left p-3 mb-2 border border-gray-300 rounded-md hover:bg-gray-50 transition" 
                                data-value="${choice}">
                            ${choice}
                        </button>
                    `;
                });
            } else { // boolean
                choicesHtml = `
                    <div class="flex space-x-4">
                        <button class="choice-btn flex-1 p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition" 
                                data-value="true">
                            <i class="fas fa-check-circle mr-2"></i> Vrai
                        </button>
                        <button class="choice-btn flex-1 p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition" 
                                data-value="false">
                            <i class="fas fa-times-circle mr-2"></i> Faux
                        </button>
                    </div>
                `;
            }
            
            questionEl.innerHTML = `
                <h3 class="text-lg font-medium mb-3">${index + 1}. ${question.question}</h3>
                <div class="choices">${choicesHtml}</div>
                <div class="explanation mt-3 p-3 bg-yellow-50 hidden"></div>
            `;
            
            questionsList.appendChild(questionEl);
        });

        // Ajouter les événements aux boutons de choix
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const questionEl = this.closest('.question');
                const questionIndex = parseInt(questionEl.dataset.index);
                const selectedValue = this.dataset.value;

                // Si déjà répondu, ne rien faire
                if (questionEl.classList.contains('answered')) return;

                // Désélectionner les autres choix pour cette question
                questionEl.querySelectorAll('.choice-btn').forEach(b => {
                    b.classList.remove('bg-indigo-100', 'border-indigo-300', 'dark:bg-indigo-900', 'dark:border-indigo-400');
                });

                // Sélectionner ce choix
                this.classList.add('bg-indigo-100', 'border-indigo-300', 'dark:bg-indigo-900', 'dark:border-indigo-400');

                // Enregistrer la réponse
                userAnswers[questionIndex] = selectedValue;

                // Feedback immédiat
                const correctAnswer = questionEl.dataset.correctAnswer;
                const isCorrect = selectedValue === correctAnswer.toString();
                const explanationDiv = questionEl.querySelector('.explanation');
                explanationDiv.classList.remove('hidden');
                explanationDiv.classList.remove('bg-yellow-50', 'bg-green-50', 'bg-red-50', 'dark:bg-yellow-900', 'dark:bg-green-900', 'dark:bg-red-900');
                explanationDiv.classList.add(isCorrect ? 'bg-green-50' : 'bg-red-50');
                explanationDiv.classList.add(isCorrect ? 'dark:bg-green-900' : 'dark:bg-red-900');
                explanationDiv.innerHTML =
                    (isCorrect
                        ? '<span class="inline-flex items-center text-green-700 dark:text-green-300 font-semibold"><i class="fas fa-check-circle mr-2"></i>Bonne réponse !</span>'
                        : '<span class="inline-flex items-center text-red-700 dark:text-red-300 font-semibold"><i class="fas fa-times-circle mr-2"></i>Mauvaise réponse.</span>'
                    ) +
                    '<br><span class="text-gray-700 dark:text-gray-200">' + currentQuiz.questions[questionIndex].explanation + '</span>';

                // Marquer la question comme répondue
                questionEl.classList.add('answered');
                // Désactiver tous les boutons de cette question
                questionEl.querySelectorAll('.choice-btn').forEach(b => {
                    b.disabled = true;
                    b.classList.remove('ring-2', 'ring-green-400', 'ring-red-400', 'dark:ring-green-600', 'dark:ring-red-600');
                    if (b.dataset.value === correctAnswer.toString()) {
                        b.classList.add('ring-2', 'ring-green-400', 'dark:ring-green-600');
                    }
                    if (b === this && !isCorrect) {
                        b.classList.add('ring-2', 'ring-red-400', 'dark:ring-red-600');
                    }
                });

                // Mettre à jour le score en temps réel
                updateLiveScore();
                updateProgressBar();
            });
        });
        
        // Initialiser le score
        score = 0;
        scoreDisplay.textContent = `Score: 0/${questions.length}`;
        updateProgressBar();
    }

    // Mettre à jour le score en direct
    function updateLiveScore() {
        if (!currentQuiz) return;
        
        let newScore = 0;
        const questionEls = document.querySelectorAll('.question');
        
        questionEls.forEach(el => {
            const index = parseInt(el.dataset.index);
            const correctAnswer = el.dataset.correctAnswer;
            const userAnswer = userAnswers[index];
            
            if (userAnswer && userAnswer === correctAnswer.toString()) {
                newScore++;
            }
        });
        
        score = newScore;
        scoreDisplay.textContent = `Score: ${score}/${currentQuiz.questions.length}`;
    }

    // Soumettre le quiz
    async function submitQuiz() {
        if (!currentQuiz) return;
        
        const totalQuestions = currentQuiz.questions.length;
        const pseudo = userPseudoInput.value.trim() || 'Anonyme_' + Math.floor(1000 + Math.random() * 9000);
        const topic = document.getElementById('quiz-topic').value;
        
        // Afficher les résultats
        showResults();
        
        // Sauvegarder le score
        try {
            const response = await fetch('api/save_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo,
                    score,
                    maxScore: totalQuestions,
                    topic
                })
            });
            
            const data = await response.json();
            if (data.success) {
                loadTopList('global'); // Recharger le classement
            }
        } catch (error) {
            console.error('Erreur sauvegarde score:', error);
        }
    }

    // Afficher les résultats
    function showResults() {
        quizContainer.classList.add('hidden');
        quizResults.classList.remove('hidden');
        
        let resultsHtml = `
            <div class="mb-6 p-4 rounded-lg ${score === currentQuiz.questions.length ? 'bg-green-100 text-green-800' : 
               score >= currentQuiz.questions.length / 2 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}">
                <h4 class="font-bold text-lg mb-2">Votre score: ${score}/${currentQuiz.questions.length}</h4>
                <p>${getResultMessage(score, currentQuiz.questions.length)}</p>
            </div>
        `;
        // Boutons de partage
        const shareText = encodeURIComponent(`J'ai obtenu ${score}/${currentQuiz.questions.length} au quiz DevQuiz Top List sur le thème ${document.getElementById('quiz-topic').value} ! 🚀 https://quickizz.devquiz-top-list/`);
        resultsHtml += `
            <div class="flex flex-wrap gap-2 mb-6">
                <button id="share-twitter" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2"><i class="fab fa-twitter"></i> Twitter</button>
                <button id="share-linkedin" class="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded flex items-center gap-2"><i class="fab fa-linkedin"></i> LinkedIn</button>
                <button id="share-copy" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded flex items-center gap-2"><i class="fas fa-link"></i> Copier le score</button>
            </div>
        `;
        
        currentQuiz.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer.toString();
            
            resultsHtml += `
                <div class="mb-6 p-4 border rounded-lg ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                    <h4 class="font-medium mb-2">${index + 1}. ${question.question}</h4>
                    <p class="mb-2"><strong>Votre réponse:</strong> ${userAnswer || 'Aucune réponse'}</p>
                    <p class="mb-2"><strong>Réponse correcte:</strong> ${question.correctAnswer}</p>
                    <p class="text-sm text-gray-600"><strong>Explication:</strong> ${question.explanation}</p>
                </div>
            `;
        });
        
        resultsContent.innerHTML = resultsHtml;
        // Ajout listeners partage
        document.getElementById('share-twitter').onclick = function() {
            window.open('https://twitter.com/intent/tweet?text=' + shareText, '_blank');
        };
        document.getElementById('share-linkedin').onclick = function() {
            window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent('https://quickizz.devquiz-top-list/') + '&summary=' + shareText, '_blank');
        };
        document.getElementById('share-copy').onclick = function() {
            navigator.clipboard.writeText(`J'ai obtenu ${score}/${currentQuiz.questions.length} au quiz DevQuiz Top List sur le thème ${document.getElementById('quiz-topic').value} ! 🚀 https://quickizz.devquiz-top-list/`);
            this.textContent = 'Copié !';
            setTimeout(() => { this.innerHTML = '<i class="fas fa-link"></i> Copier le score'; }, 1500);
        };
    }

    // Message en fonction du score
    function getResultMessage(score, total) {
        const percentage = (score / total) * 100;
        
        if (percentage === 100) {
            return 'Parfait! Vous maîtrisez parfaitement ce sujet.';
        } else if (percentage >= 80) {
            return 'Excellent! Vous avez une très bonne connaissance du sujet.';
        } else if (percentage >= 60) {
            return 'Bien joué! Vous avez une bonne base mais pouvez encore progresser.';
        } else if (percentage >= 40) {
            return 'Pas mal! Quelques révisions et vous serez au top.';
        } else {
            return 'À travailler! Consultez les explications et retentez votre chance.';
        }
    }

    // Réinitialiser le quiz
    function resetQuiz() {
        currentQuiz = null;
        userAnswers = [];
        score = 0;
        
        quizResults.classList.add('hidden');
        quizSelection.classList.remove('hidden');
        quizStatus.textContent = 'Prêt à commencer';
        updateProgressBar();
    }

    // Ajout dynamique des thèmes dans le menu déroulant
    async function populateTopics() {
        try {
            const response = await fetch('api/scores.php?filter=global');
            const scores = await response.json();
            const topics = Array.from(new Set(scores.map(s => s.topic)));
            const select = document.createElement('select');
            select.id = 'toplist-topic';
            select.className = 'px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mr-2';
            select.innerHTML = '<option value="">Tous thèmes</option>' + topics.map(t => `<option value="${t}">${t}</option>`).join('');
            select.addEventListener('change', () => {
                loadTopList(currentTopListFilter, select.value, toplistPseudoInput.value);
            });
            const container = document.createElement('div');
            container.className = 'mb-2 flex items-center';
            container.appendChild(select);
            // Champ pseudo
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'toplist-pseudo';
            input.placeholder = 'Pseudo';
            input.className = 'px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm';
            input.value = userPseudoInput.value;
            input.addEventListener('input', () => {
                loadTopList(currentTopListFilter, select.value, input.value);
            });
            container.appendChild(input);
            const toplist = document.getElementById('toplist-content');
            toplist.parentNode.insertBefore(container, toplist);
            window.toplistTopicSelect = select;
            window.toplistPseudoInput = input;
        } catch (e) {}
    }
    // Surcharge loadTopList pour supporter topic et pseudo
    async function loadTopList(filter, topic = '', pseudo = '') {
        currentTopListFilter = filter;
        let url = `api/scores.php?filter=${filter}`;
        if (topic) url += `&topic=${encodeURIComponent(topic)}`;
        if (pseudo) url += `&pseudo=${encodeURIComponent(pseudo)}`;
        try {
            const response = await fetch(url);
            const scores = await response.json();
            if (scores.length === 0) {
                toplistContent.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun score enregistré</p>';
                return;
            }
            let html = '<div class="space-y-2">';
            scores.forEach((score, index) => {
                const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                const percentage = score.percentage || Math.round((score.score / score.maxScore) * 100);
                // Avatar : initiale du pseudo ou icône
                const avatar = `<span class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-lg mr-2">${score.pseudo[0].toUpperCase()}</span>`;
                html += `
                    <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="w-8 text-center font-medium">${medal}</div>
                        ${avatar}
                        <div class="flex-1">
                            <div class="font-medium">${score.pseudo}</div>
                            <div class="text-sm text-gray-500">${score.topic} • ${score.date.replace(' ', ' à ')}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold">${score.score}/${score.maxScore}</div>
                            <div class="text-sm ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                ${percentage}%
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            toplistContent.innerHTML = html;
            // Mettre en évidence le bouton actif
            showGlobalBtn.classList.toggle('bg-indigo-100', filter === 'global');
            showGlobalBtn.classList.toggle('text-indigo-700', filter === 'global');
            showTodayBtn.classList.toggle('bg-indigo-100', filter === 'today');
            showTodayBtn.classList.toggle('text-indigo-700', filter === 'today');
        } catch (error) {
            console.error('Erreur chargement top list:', error);
            toplistContent.innerHTML = '<p class="text-red-500 text-center py-4">Erreur de chargement</p>';
        }
    }

    function updateProgressBar() {
        if (!currentQuiz || !progressBarInner) return;
        const total = currentQuiz.questions.length;
        const answered = userAnswers.filter(a => a !== undefined).length;
        const percent = Math.round((answered / total) * 100);
        progressBarInner.style.width = percent + '%';
        progressBarInner.setAttribute('aria-valuenow', percent);
    }
    // Initialisation
    populateTopics();
});