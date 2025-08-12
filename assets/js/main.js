import { signInWithGoogle, signOutUser, authStateObserver } from './auth.js';
import { getTechnologies } from './firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const authContainerDesktop = document.getElementById('auth-container-desktop');
    const authContainerMobile = document.getElementById('auth-container-mobile');

    const updateUi = (user) => {
        let loggedInHtml = '';
        if (user) {
            loggedInHtml = `
                <div class="flex items-center gap-3">
                    <img src="${user.photoURL}" alt="${user.displayName}" class="w-9 h-9 rounded-full border-2 border-white">
                    <button id="logout-btn" class="text-[#57606a] hover:text-red-600 font-medium flex items-center gap-2">
                        <span class="material-icons">logout</span>
                        Déconnexion
                    </button>
                </div>
            `;
            authContainerDesktop.innerHTML = loggedInHtml;
            authContainerMobile.innerHTML = loggedInHtml;
        } else {
            const loggedOutHtml = `
                <button id="login-btn" class="flex items-center gap-2 bg-[#2da44e] hover:bg-[#2c974b] text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors">
                    <span class="material-icons">login</span>
                    Connexion
                </button>
            `;
            authContainerDesktop.innerHTML = loggedOutHtml;
            authContainerMobile.innerHTML = loggedOutHtml;
        }
    };

    // Listen for auth state changes
    authStateObserver(updateUi);

    // Add single event listener to the container
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#login-btn')) {
            signInWithGoogle();
        }
        if (e.target.closest('#logout-btn')) {
            signOutUser();
        }
    });

    const techChoiceContainer = document.getElementById('tech-choice');

    const displayTechnologies = async () => {
        try {
            const technologies = await getTechnologies();
            const techChoiceDiv = document.getElementById('tech-choice');
            if (!techChoiceDiv) return;
            techChoiceDiv.innerHTML = ''; // Clear existing

            technologies.forEach(tech => {
                // Map technology ID to Devicon icon name if they differ
                const iconName = tech.name.toLowerCase();

                const techCard = `
                   <a href="/quiz.html?tech=${tech.id}" 
   class="group relative w-20 h-20 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center p-4 overflow-hidden
          hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out">
  
  <!-- Icon -->
  <i class="devicon-${iconName}-plain text-5xl text-gray-700 transition-transform duration-300 group-hover:scale-110"></i>
  
  <!-- Overlay texte avec conteneur spécifique -->
  <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl p-1">
    <div class="w-full h-full flex items-center justify-center">
      <span class="text-white font-bold text-center whitespace-nowrap dynamic-text" style="font-size: calc(12px + 0.5vw);">${tech.name}</span>
    </div>
  </div>
</a>
                `;
                techChoiceDiv.innerHTML += techCard;
            });
        } catch (error) {
            console.error("Error fetching technologies:", error);
            techChoiceContainer.innerHTML = '<p class="text-red-500">Erreur lors du chargement des technologies.</p>';
        }
    };

    displayTechnologies();
});
