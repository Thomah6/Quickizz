import { db } from '../assets/js/firebase-config.js';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { createOrUpdateModuleWithQuizzes } from './firestore-admin.js';
import { generateQuizWithGroq } from './groq.js';

// Éléments du DOM
let loginForm, signupForm, quizForm, loginView, signupView, dashboardView, logoutBtn;
let showSignupBtn, showLoginBtn, statusMessage, generateBtn, techSelect, techNameInput, techIconPreview, techIcon;
let techList, quizzesList, quizzesContainer, showGeneratorBtn, hideGeneratorBtn, quizGenerator;

// Fonction utilitaire pour le débogage
function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`, data || '');
}

// Liste des technologies disponibles avec leurs icônes Devicon
const availableTechnologies = [
    { id: 'javascript', name: 'JavaScript', devicon: 'javascript' },
    { id: 'react', name: 'React', devicon: 'react' },
    { id: 'vuejs', name: 'Vue.js', devicon: 'vuejs' },
    { id: 'angular', name: 'Angular', devicon: 'angularjs' },
    { id: 'nodejs', name: 'Node.js', devicon: 'nodejs' },
    { id: 'python', name: 'Python', devicon: 'python' },
    { id: 'java', name: 'Java', devicon: 'java' },
    { id: 'php', name: 'PHP', devicon: 'php' },
    { id: 'html5', name: 'HTML5', devicon: 'html5' },
    { id: 'css3', name: 'CSS3', devicon: 'css3' },
    { id: 'typescript', name: 'TypeScript', devicon: 'typescript' },
    { id: 'csharp', name: 'C#', devicon: 'csharp' },
    { id: 'swift', name: 'Swift', devicon: 'swift' },
    { id: 'kotlin', name: 'Kotlin', devicon: 'kotlin' },
    { id: 'go', name: 'Go', devicon: 'go' },
    { id: 'rust', name: 'Rust', devicon: 'rust' }
];

// État de l'application
let currentUser = null;
let currentPage = 1;
const usersPerPage = 10;
let allUsers = [];
let filteredUsers = [];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des éléments du DOM
    initElements();
    // Vérification de la session
    checkAuthState();
    // Configuration des écouteurs d'événements
    setupEventListeners();
    // Chargement des technologies
    loadTechnologies();
});

function initElements() {
    console.log('Initialisation des éléments du DOM...');
    
    // Formulaires
    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');
    quizForm = document.getElementById('quiz-generator-form');
    
    // Vues
    loginView = document.getElementById('login-view');
    signupView = document.getElementById('signup-view');
    dashboardView = document.getElementById('dashboard-view');
    
    // Boutons
    logoutBtn = document.getElementById('logout-btn');
    showSignupBtn = document.getElementById('show-signup');
    showLoginBtn = document.getElementById('show-login');
    generateBtn = document.getElementById('generate-btn');
    
    // Messages
    statusMessage = document.getElementById('status-message');
    
    // Éléments de la liste des technologies et quiz
    techList = document.getElementById('tech-list');
    quizzesList = document.getElementById('quizzes-list');
    quizzesContainer = document.getElementById('quizzes-container');
    showGeneratorBtn = document.getElementById('show-generator');
    hideGeneratorBtn = document.getElementById('hide-generator');
    quizGenerator = document.getElementById('quiz-generator');
    
    // Éléments du sélecteur de technologies
    techSelect = document.getElementById('tech-select');
    techNameInput = document.getElementById('tech-name');
    techIconPreview = document.getElementById('tech-icon-preview');
    techIcon = document.getElementById('tech-icon');
    
    console.log('Éléments du DOM initialisés :', {
        loginForm: !!loginForm,
        signupForm: !!signupForm,
        quizForm: !!quizForm,
        loginView: !!loginView,
        signupView: !!signupView,
        dashboardView: !!dashboardView,
        logoutBtn: !!logoutBtn,
        showSignupBtn: !!showSignupBtn,
        showLoginBtn: !!showLoginBtn,
        generateBtn: !!generateBtn,
        statusMessage: !!statusMessage,
        techSelect: !!techSelect,
        techNameInput: !!techNameInput,
        techIconPreview: !!techIconPreview,
        techIcon: !!techIcon,
        techList: !!techList,
        quizzesList: !!quizzesList,
        quizList: !!document.getElementById('quiz-list'),
        quizzesContainer: !!quizzesContainer,
        showGeneratorBtn: !!showGeneratorBtn,
        hideGeneratorBtn: !!hideGeneratorBtn,
        quizGenerator: !!quizGenerator
    });
}

function setupEventListeners() {
    console.log('Initialisation des écouteurs d\'événements...');
    
    // Gestion du clic sur le bouton d'actualisation des utilisateurs
    document.addEventListener('click', async (e) => {
        const refreshUsersBtn = e.target.closest('#refresh-users');
        if (refreshUsersBtn) {
            e.preventDefault();
            loadUsers();
            return;
        }
        
        // Gestion de la pagination
        if (e.target.matches('#prev-page')) {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                updateUsersUI(filteredUsers);
            }
            return;
        }
        
        if (e.target.matches('#next-page')) {
            e.preventDefault();
            const maxPage = Math.ceil(filteredUsers.length / usersPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                updateUsersUI(filteredUsers);
            }
            return;
        }
    });
    
    // Afficher/masquer le générateur de quiz
    if (showGeneratorBtn) {
        showGeneratorBtn.addEventListener('click', () => {
            quizGenerator.classList.remove('hidden');
            showGeneratorBtn.classList.add('hidden');
        });
    }
    
    if (hideGeneratorBtn) {
        hideGeneratorBtn.addEventListener('click', () => {
            quizGenerator.classList.add('hidden');
            showGeneratorBtn.classList.remove('hidden');
        });
    }
    
    // Événements de navigation
    if (showSignupBtn) {
        console.log('Ajout de l\'écouteur sur showSignupBtn');
        showSignupBtn.addEventListener('click', (e) => {
            console.log('Bouton showSignup cliqué');
            e.preventDefault();
            toggleAuthViews('signup');
        });
    } else {
        console.error('showSignupBtn est null ou undefined');
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthViews('login');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Soumission des formulaires
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('loginForm est null ou undefined');
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    } else {
        console.error('signupForm est null ou undefined');
    }
    
    if (quizForm) {
        quizForm.addEventListener('submit', handleQuizGeneration);
    }
}

// Initialise le sélecteur de technologies
function initTechSelect() {
    if (!techSelect) {
        console.error('Élément tech-select non trouvé');
        return;
    }
    
    // Trier les technologies par ordre alphabétique
    const sortedTechs = [...availableTechnologies].sort((a, b) => a.name.localeCompare(b.name));
    
    // Ajouter les options au select
    sortedTechs.forEach(tech => {
        const option = document.createElement('option');
        option.value = tech.id;
        option.textContent = tech.name;
        option.setAttribute('data-devicon', tech.devicon);
        techSelect.appendChild(option);
    });
    
    // Gérer le changement de sélection
    techSelect.addEventListener('change', (e) => {
        const selectedOption = techSelect.options[techSelect.selectedIndex];
        const devicon = selectedOption.getAttribute('data-devicon');
        const techName = selectedOption.textContent;
        
        // Mettre à jour le champ caché avec le nom de la technologie
        if (techNameInput) {
            techNameInput.value = techName;
        }
        
        // Mettre à jour l'aperçu de l'icône
        if (techIcon && techIconPreview) {
            if (devicon) {
                techIcon.className = `devicon-${devicon}-plain text-5xl`;
                techIconPreview.classList.remove('hidden');
            } else {
                techIconPreview.classList.add('hidden');
            }
        }
    });
    
    // Déclencher l'événement change pour la valeur par défaut
    if (techSelect.options.length > 0) {
        techSelect.dispatchEvent(new Event('change'));
    }
}

// Vérifie si un utilisateur est connecté
async function checkAuthState() {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userDoc = await getDoc(doc(db, 'admins', user.id));
            
            if (userDoc.exists()) {
                currentUser = { id: userDoc.id, ...userDoc.data() };
                showDashboard();
                initTechSelect();
                // Charger les technologies après la connexion
                loadTechnologies();
                return;
            }
        } catch (error) {
            console.error('Erreur de vérification de session:', error);
        }
        // Si la vérification échoue, déconnecter l'utilisateur
        handleLogout();
    } else {
        // Afficher la vue de connexion si aucun utilisateur n'est connecté
        showLoginView();
    }
}

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
        showStatus('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    try {
        const q = query(collection(db, 'admins'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('Identifiants incorrects');
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Dans un cas réel, il faudrait hasher le mot de passe et le comparer avec le hash stocké
        if (userData.password !== password) {
            throw new Error('Mot de passe incorrect');
        }
        
        // Connexion réussie
        currentUser = { id: userDoc.id, ...userData };
        localStorage.setItem('adminUser', JSON.stringify({ id: userDoc.id, email }));
        showDashboard();
        showStatus('Connexion réussie !', 'success');
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showStatus(error.message || 'Erreur de connexion', 'error');
    }
}

// Gestion de l'inscription
async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showStatus('Tous les champs sont obligatoires', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showStatus('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 6) {
        showStatus('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    try {
        // Vérifier si l'email existe déjà
        const emailCheck = query(collection(db, 'admins'), where('email', '==', email));
        const emailSnapshot = await getDocs(emailCheck);
        
        if (!emailSnapshot.empty) {
            throw new Error('Cet email est déjà utilisé');
        }
        
        // Créer le nouvel admin
        const userData = {
            username,
            email,
            password, // Dans un cas réel, il faudrait hasher le mot de passe
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        const docRef = await addDoc(collection(db, 'admins'), userData);
        currentUser = { id: docRef.id, ...userData };
        
        // Stocker les informations de l'utilisateur (sans le mot de passe)
        const userToStore = { id: docRef.id, email, username };
        localStorage.setItem('adminUser', JSON.stringify(userToStore));
        
        showDashboard();
        showStatus('Compte créé avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        showStatus(error.message || 'Erreur lors de la création du compte', 'error');
    }
}

// Gestion de la déconnexion
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('adminUser');
    showLoginView();
    showStatus('Déconnexion réussie', 'success');
}

// Gestion de la génération de quiz
async function handleQuizGeneration(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showStatus('Veuvez vous connecter pour générer un quiz', 'error');
        return;
    }
    
    const techName = document.getElementById('tech-name').value.trim();
    const moduleName = document.getElementById('module-name').value.trim();

    if (!techName || !moduleName) {
        showStatus('Veuillez sélectionner une technologie et un module', 'error');
        return;
    }

    try {
        // Désactiver le bouton et afficher le chargement
        generateBtn.disabled = true;
        generateBtn.innerHTML = 'Génération en cours...';
        showStatus('Génération du quiz en cours...', 'info');
        
        // 1. Générer les quiz avec Groq
        const response = await generateQuizWithGroq(techName, moduleName);
        
        if (!response.quizzes || response.quizzes.length === 0) {
            throw new Error('Aucun quiz généré par Groq');
        }
        
        // 2. Sauvegarder dans Firestore
        await createOrUpdateModuleWithQuizzes(techName, moduleName, response.quizzes);
        
        // 3. Afficher le succès
        showStatus(`${response.quizzes.length} quizzes générés et enregistrés avec succès pour ${techName} > ${moduleName}`, 'success');
        
        // Réinitialiser le formulaire
        quizForm.reset();
    } catch (error) {
        console.error('Erreur:', error);
        showStatus(`Erreur: ${error.message}`, 'error');
    } finally {
        // Réactiver le bouton
        generateBtn.disabled = false;
        generateBtn.innerHTML = 'Générer le Quiz';
    }
}

// Charge les technologies depuis Firestore
async function loadTechnologies() {
    console.log('Début du chargement des technologies...');
    
    if (!currentUser) {
        console.log('Aucun utilisateur connecté, arrêt du chargement des technologies');
        return;
    }
    
    try {
        // Charger les technologies
        const techsCollection = collection(db, 'technologies');
        const techsSnapshot = await getDocs(techsCollection);
        
        if (techsSnapshot.empty) {
            console.log('Aucune technologie trouvée dans la base de données');
            techList.innerHTML = `
                <div class="col-span-full">
                    <p class="text-gray-500 mb-4">Aucune technologie trouvée. Créez votre premier quiz pour commencer.</p>
                    <button id="create-first-quiz" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                        Créer un quiz
                    </button>
                </div>
            `;
            
            // Ajouter un écouteur d'événement pour le bouton
            const createFirstQuizBtn = document.getElementById('create-first-quiz');
            if (createFirstQuizBtn) {
                createFirstQuizBtn.addEventListener('click', () => {
                    quizGenerator.classList.remove('hidden');
                    showGeneratorBtn.classList.add('hidden');
                });
            }
            
            return;
        }
        
        techList.innerHTML = ''; // Vider la liste actuelle
        
        // Créer un Set pour stocker les IDs uniques des technologies
        const uniqueTechIds = new Set();
        
        // Pour chaque technologie, charger ses modules
        for (const techDoc of techsSnapshot.docs) {
            const techData = techDoc.data();
            const techId = techDoc.id;
            
            // Vérifier si on a déjà traité cette technologie
            if (uniqueTechIds.has(techId)) {
                continue; // Passer à l'itération suivante si déjà traitée
            }
            
            // Ajouter l'ID au Set des technologies traitées
            uniqueTechIds.add(techId);
            
            // Charger les modules de cette technologie
            const modulesCollection = collection(db, `technologies/${techId}/modules`);
            const modulesSnapshot = await getDocs(modulesCollection);
            const modulesCount = modulesSnapshot.size;
            
            // Trouver l'icône correspondante dans availableTechnologies
            const techInfo = availableTechnologies.find(t => t.id === techId) || {
                name: techData.name || (techId.charAt(0).toUpperCase() + techId.slice(1)),
                devicon: techId.toLowerCase()
            };
            
            // Vérifier si une carte pour cette technologie existe déjà
            const existingCard = Array.from(techList.children).find(card => 
                card.getAttribute('data-tech-id') === techId
            );
            
            if (!existingCard) {
                const techCard = document.createElement('div');
                techCard.className = 'tech-card bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow';
                techCard.setAttribute('data-tech-id', techId);
                techCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="devicon-${techInfo.devicon}-plain text-2xl"></i>
                            <h4 class="font-semibold">${techInfo.name}</h4>
                        </div>
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            ${modulesCount} ${modulesCount > 1 ? 'modules' : 'module'}
                        </span>
                    </div>
                    <div class="mt-2 text-sm text-gray-500">
                        Cliquez pour voir les détails
                    </div>
                `;
                
                techCard.addEventListener('click', async (e) => {
                    try {
                        // Supprimer la classe de sélection de toutes les cartes
                        document.querySelectorAll('.tech-card').forEach(card => {
                            card.classList.remove('ring-2', 'ring-blue-500');
                        });
                        // Ajouter la classe de sélection à la carte cliquée
                        e.currentTarget.classList.add('ring-2', 'ring-blue-500');
                        
                        // Afficher le conteneur des quiz
                        const quizzesContainer = document.getElementById('quizzes-container');
                        if (quizzesContainer) {
                            quizzesContainer.classList.remove('hidden');
                        }
                        
                        // Charger les quiz
                        await loadQuizzes(techId, techInfo);
                    } catch (error) {
                        console.error('Erreur lors du clic sur la carte technologie:', error);
                        showStatus('Une erreur est survenue lors du chargement des quiz', 'error');
                    }
                });
                
                techList.appendChild(techCard);
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des technologies:', error);
        showStatus('Erreur lors du chargement des technologies: ' + error.message, 'error');
    }
}

// Charge les quiz pour une technologie donnée
async function loadQuizzes(techId, techData) {
    console.log('Chargement des quiz pour la technologie:', techId);
    if (!currentUser || !techId) {
        console.error('Utilisateur non connecté ou ID de technologie manquant');
        return;
    }
    
    try {
        // Vérifier si quizzesList est défini
        if (!quizzesList) {
            console.error('Élément quizzesList non trouvé dans le DOM');
            return;
        }
        
        // Afficher le chargement
        quizzesList.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        `;
        
        // S'assurer que le conteneur est visible
        const quizzesContainer = document.getElementById('quizzes-container');
        if (quizzesContainer) {
            quizzesContainer.classList.remove('hidden');
        }
        
        // Charger les modules de cette technologie
        const modulesCollection = collection(db, `technologies/${techId}/modules`);
        const modulesSnapshot = await getDocs(modulesCollection);
        
        if (modulesSnapshot.empty) {
            quizzesList.innerHTML = `
                <div class="col-span-full">
                    <p class="text-gray-500 text-center py-8">
                        Aucun module trouvé pour cette technologie.
                    </p>
                </div>
            `;
            return;
        }
        
        // Afficher le titre de la technologie
        quizzesList.innerHTML = `
            <div class="col-span-full flex items-center space-x-3 mb-6">
                <i class="devicon-${techData.devicon}-plain text-3xl"></i>
                <h3 class="text-xl font-bold">${techData.name}</h3>
            </div>
        `;
        
        // Pour chaque module, charger ses quiz
        for (const moduleDoc of modulesSnapshot.docs) {
            const moduleData = moduleDoc.data();
            const moduleId = moduleDoc.id;
            
            // Créer la carte du module
            const moduleCard = document.createElement('div');
            moduleCard.className = 'col-span-full bg-white rounded-lg border border-gray-200 overflow-hidden';
            
            // En-tête du module
            const moduleHeader = document.createElement('div');
            moduleHeader.className = 'bg-gray-50 px-4 py-3 border-b border-gray-200';
            moduleHeader.innerHTML = `
                <h4 class="font-semibold text-gray-800">${moduleData.name}</h4>
                <p class="text-sm text-gray-500">${moduleData.quizCount || 0} quiz</p>
            `;
            
            // Contenu du module (liste des quiz)
            const moduleContent = document.createElement('div');
            moduleContent.className = 'p-4';
            
            // Charger les quiz de ce module
            const quizzesCollection = collection(db, `technologies/${techId}/modules/${moduleId}/quizzes`);
            const quizzesSnapshot = await getDocs(quizzesCollection);
            
            if (quizzesSnapshot.empty) {
                moduleContent.innerHTML = `
                    <p class="text-gray-500 text-sm">Aucun quiz disponible pour ce module.</p>
                `;
            } else {
                const quizzesList = document.createElement('div');
                quizzesList.className = 'space-y-2';
                
                quizzesSnapshot.forEach(quizDoc => {
                    const quizData = quizDoc.data();
                    const quizItem = document.createElement('div');
                    quizItem.className = 'p-3 bg-gray-50 rounded-md border border-gray-100';
                    
                    // Formater la difficulté
                    let difficultyBadge = '';
                    if (quizData.difficulty) {
                        const difficulty = quizData.difficulty.toLowerCase();
                        let bgColor = 'bg-gray-100 text-gray-800';
                        
                        if (difficulty.includes('facile')) {
                            bgColor = 'bg-green-100 text-green-800';
                        } else if (difficulty.includes('moyen')) {
                            bgColor = 'bg-yellow-100 text-yellow-800';
                        } else if (difficulty.includes('difficile')) {
                            bgColor = 'bg-red-100 text-red-800';
                        }
                        
                        difficultyBadge = `
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ml-2">
                                ${quizData.difficulty}
                            </span>
                        `;
                    }
                    
                    // Afficher la question et la réponse
                    quizItem.innerHTML = `
                        <div class="font-medium text-gray-800">${quizData.question || 'Question sans titre'}</div>
                        <div class="mt-1 text-sm text-gray-600">
                            <span class="font-medium">Réponse :</span> ${quizData.answer || 'Aucune réponse fournie'}
                            ${difficultyBadge}
                        </div>
                    `;
                    
                    quizzesList.appendChild(quizItem);
                });
                
                moduleContent.appendChild(quizzesList);
            }
            
            // Assembler la carte du module
            moduleCard.appendChild(moduleHeader);
            moduleCard.appendChild(moduleContent);
            quizzesList.appendChild(moduleCard);
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des quiz:', error);
        showStatus('Erreur lors du chargement des quiz: ' + error.message, 'error');
        
        quizzesList.innerHTML = `
            <div class="col-span-full">
                <p class="text-red-500 text-center py-8">
                    Une erreur est survenue lors du chargement des quiz. Veuillez réessayer.
                </p>
            </div>
        `;
    }
}

// Fonctions d'affichage des vues
function showLoginView() {
    loginView.classList.remove('hidden');
    signupView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    quizGenerator.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    if (loginForm) loginForm.reset();
}

function showSignupView() {
    signupView.classList.remove('hidden');
    loginView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    quizGenerator.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    if (signupForm) signupForm.reset();
}

function showDashboard() {
    dashboardView.classList.remove('hidden');
    loginView.classList.add('hidden');
    signupView.classList.add('hidden');
    quizGenerator.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    showGeneratorBtn.classList.remove('hidden');
    if (quizForm) quizForm.reset();
    
    // Initialiser la navigation par onglets et charger les données
    setupTabNavigation();
    
    // Charger les technologies par défaut
    if (currentUser) {
        loadTechnologies();
    }
}

function toggleAuthViews(view) {
    if (view === 'signup') {
        showSignupView();
    } else {
        showLoginView();
    }
}

// Affichage des messages d'état
function showStatus(message, type) {
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    statusMessage.className = 'mt-4 p-3 rounded-md text-center';
    
    // Effacer les classes de couleur existantes
    statusMessage.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-blue-100', 'text-blue-700');
    
    // Ajouter les classes appropriées en fonction du type
    switch (type) {
        case 'error':
            statusMessage.classList.add('bg-red-100', 'text-red-700');
            break;
        case 'success':
            statusMessage.classList.add('bg-green-100', 'text-green-700');
            break;
        case 'info':
            statusMessage.classList.add('bg-blue-100', 'text-blue-700');
            break;
        default:
            statusMessage.classList.add('bg-gray-100', 'text-gray-700');
    }
    
    // Masquer le message après 5 secondes
    if (type !== 'error') {
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = '';
        }, 5000);
    }
}

// Fonction pour configurer la navigation par onglets
function setupTabNavigation() {
    console.log('Configuration de la navigation par onglets...');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length === 0 || tabContents.length === 0) {
        console.warn('Aucun onglet ou contenu d\'onglet trouvé');
        return;
    }
    
    // Activer le premier onglet par défaut si aucun n'est actif
    let hasActiveTab = false;
    tabs.forEach(tab => {
        if (tab.classList.contains('active')) {
            hasActiveTab = true;
        }
    });
    
    if (!hasActiveTab && tabs.length > 0) {
        const defaultTab = document.querySelector('.tab[data-tab="technologies"]') || tabs[0];
        defaultTab.classList.add('active');
        const tabId = `${defaultTab.dataset.tab}-tab`;
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.remove('hidden');
            tabContent.classList.add('active');
        }
    }
    
    // Gestion des clics sur les onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = `${tab.dataset.tab}-tab`;
            
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            
            // Activer l'onglet cliqué
            tab.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.remove('hidden');
                tabContent.classList.add('active');
                
                // Charger les données si nécessaire
                if (tab.dataset.tab === 'users') {
                    loadUsers();
                } else if (tab.dataset.tab === 'technologies') {
                    loadTechnologies();
                }
            }
        });
    });
}

// Fonction pour charger les utilisateurs
async function loadUsers() {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
        console.error('Élément users-list non trouvé dans le DOM');
        return;
    }
    
    try {
        // Afficher un indicateur de chargement
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8">
                    <div class="flex justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                    <p class="mt-2 text-gray-500">Chargement des utilisateurs...</p>
                </td>
            </tr>`;
        
        console.log('Tentative de chargement des utilisateurs depuis Firestore...');
        
        // Récupérer tous les utilisateurs
        const usersRef = collection(db, 'userProfiles');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        console.log('Résultats de la requête obtenus:', querySnapshot.size, 'documents trouvés');
        
        allUsers = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                displayName: userData.displayName || userData.email || 'Utilisateur sans nom',
                email: userData.email || 'Aucun email',
                createdAt: userData.createdAt || new Date(),
                lastLogin: userData.lastLogin || null,
                totalScore: userData.totalScore || 0
            });
        });
        
        // Mettre à jour l'interface avec les utilisateurs filtrés
        filteredUsers = [...allUsers];
        updateUsersUI(filteredUsers);
        
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs :', error);
        
        let errorMessage = 'Erreur lors du chargement des utilisateurs';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission refusée. Vérifiez les règles de sécurité Firestore.';
        }
        
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-red-500">
                    ${errorMessage}
                    <div class="mt-2 text-sm text-gray-600">
                        Code d'erreur: ${error.code || 'N/A'}
                    </div>
                </td>
            </tr>`;
    }
}

// Fonction pour formater une date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Fonction pour mettre à jour l'interface des utilisateurs
function updateUsersUI(users) {
    const usersList = document.getElementById('users-list');
    const usersCount = document.getElementById('users-count');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (!usersList) return;
    
    // Mettre à jour le compteur
    if (usersCount) {
        usersCount.textContent = users.length;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = users.slice(startIndex, startIndex + usersPerPage);
    
    // Mettre à jour les boutons de pagination
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    }
    if (nextPageBtn) {
        nextPageBtn.disabled = startIndex + usersPerPage >= users.length;
    }
    
    // Afficher les utilisateurs
    if (users.length === 0) {
        usersList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    Aucun utilisateur trouvé.
                </td>
            </tr>`;
    } else {
        usersList.innerHTML = paginatedUsers.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="py-3">${user.displayName}</td>
                <td class="py-3">${user.email}</td>
                <td class="py-3">${formatDate(user.createdAt)}</td>
                <td class="py-3">${user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}</td>
                <td class="py-3 text-center">${user.totalScore} pts</td>
            </tr>
        `).join('');
    }
}