import { authStateObserver, signInWithGoogle, signOutUser } from './auth.js';
import { getTechnologyDetails, getModulesForTechnology, getUserScores } from './firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('tech');

    if (!techId) {
        window.location.href = '/';
        return;
    }

    const techTitle = document.getElementById('tech-title');
    const modulesContainer = document.getElementById('modules-container');
    const breadcrumbContainer = document.getElementById('breadcrumb');
    let currentUser = null;

    const loadModules = async () => {
        const userScores = currentUser ? await getUserScores(currentUser.uid) : {};
        try {
            const techDetails = await getTechnologyDetails(techId);
            if (techDetails) {
                // Ajout de l'icône Devicon avant le titre
                const iconName = techDetails.name ? techDetails.name.toLowerCase() : '';
                techTitle.innerHTML = `<i class="devicon-${iconName}-plain text-3xl align-middle mr-2"></i>Modules de ${techDetails.name}`;
                breadcrumbContainer.innerHTML = `<a href="/" class="hover:underline">Accueil</a> > <span class="font-semibold">${techDetails.name}</span>`;
            }

            const modules = await getModulesForTechnology(techId);
            if (modules.length === 0) {
                modulesContainer.innerHTML = '<p class="text-gray-500">Aucun module disponible pour cette technologie.</p>';
                return;
            }

            modulesContainer.innerHTML = modules.map(module => {
                const scoreInfo = userScores[`${techId}_${module.id}`];
                let scoreHtml = '<p class="text-sm text-gray-500 mt-4">Aucun score enregistré</p>';
                if (scoreInfo) {
                    const percentage = Math.round((scoreInfo.score / scoreInfo.totalQuestions) * 100);
                    scoreHtml = `
                        <div class="mt-4">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-semibold text-[#2da44e]">Meilleur score</span>
                                <span class="text-sm font-semibold text-[#2da44e]">${scoreInfo.score}/${scoreInfo.totalQuestions}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-[#2da44e] h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }

                return `
                <a href="/game.html?techId=${techId}&moduleId=${module.id}" class="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-xl mb-2 text-gray-800">${module.name}</h3>
                        <p class="text-gray-600">${module.description || ''}</p>
                    </div>
                    ${scoreHtml}
                </a>
            `}).join('');

        } catch (error) {
            console.error("Error loading modules: ", error);
            modulesContainer.innerHTML = '<p class="text-red-500">Erreur lors du chargement des modules.</p>';
        }
    };

    loadModules();

    // --- Auth Logic ---
    const authContainerDesktop = document.getElementById('auth-container-desktop');
    const authContainerMobile = document.getElementById('auth-container-mobile');

    const updateUi = (user) => {
        currentUser = user;
        // Reload modules to display scores if user logs in
        if (document.readyState === 'complete') {
            loadModules();
        }

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
    };

    authStateObserver(updateUi);

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#login-btn')) {
            signInWithGoogle();
        }
        if (e.target.closest('#logout-btn')) {
            signOutUser();
        }
    });
});
