import { authStateObserver } from './auth.js';
import { getUserScores, getTechnologies, getModulesForTechnology, getUserProfile } from './firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Références aux éléments DOM
  const DOM = {
    avatar: document.getElementById('profile-avatar'),
    name: document.getElementById('profile-name'),
    email: document.getElementById('profile-email'),
    totalScore: document.getElementById('profile-total-score'),
    statsContainer: document.getElementById('profile-stats-container'),
    progressList: document.getElementById('progress-list')
  };

  // Fonction pour créer l'avatar
  const createAvatar = (user) => {
    return `
      <div class="relative">
        <img src="${user.photoURL}" alt="${user.displayName}" 
             class="w-32 h-32 rounded-full p-[4px] border border-[#d0d7de] bg-white object-cover">
        <div class="absolute -bottom-2 -right-2 bg-white rounded-full flex w-10 h-10 items-center justify-center border border-[#d0d7de]">
          <span class="material-icons text-[#52c41a] text-2xl">verified</span>
        </div>
      </div>
    `;
  };

 

  // Fonction pour créer un item de technologie
  const createTechItem = (tech, modules, scores) => {
    const techScore = modules.reduce((sum, module) => {
      const key = `${tech.id}_${module.id}`;
      return sum + (scores[key]?.score || 0);
    }, 0);
    
    const techTotal = modules.reduce((sum, module) => {
      const key = `${tech.id}_${module.id}`;
      return sum + (scores[key]?.totalQuestions || 0);
    }, 0);
    
    const percentage = techTotal > 0 ? Math.round((techScore / techTotal) * 100) : 0;
    
    return `
      <div class="p-6 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-4 cursor-pointer" data-toggle="tech-${tech.id}">
          <div class="flex-shrink-0">
            <i class="devicon-${tech.name.toLowerCase()}-plain text-4xl text-gray-700"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg text-gray-900">${tech.name}</h3>
            <div class="mt-1 flex items-center gap-3">
              <div class="w-full bg-gray-200 rounded-full h-2.5 flex-grow">
                <div class="bg-[#52c41a] h-2.5 rounded-full" style="width: ${percentage}%"></div>
              </div>
              <span class="text-sm font-medium text-gray-700">${percentage}%</span>
            </div>
          </div>
          <span class="material-icons text-gray-400 transition-transform" data-icon="tech-${tech.id}">chevron_right</span>
        </div>
        
        <div id="tech-${tech.id}" class="hidden mt-4 pl-14">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${modules.map(module => {
              const key = `${tech.id}_${module.id}`;
              const scoreData = scores[key];
              if (!scoreData) return '';
              
              const modulePercentage = Math.round((scoreData.score / scoreData.totalQuestions) * 100);
              const progressColor = modulePercentage >= 80 ? 'bg-[#52c41a]' : 
                                  modulePercentage >= 50 ? 'bg-[#faad14]' : 'bg-[#f5222d]';
              
              return `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all">
                  <div class="flex justify-between items-start">
                    <h4 class="font-medium text-gray-800">${module.name}</h4>
                    <span class="text-xs font-semibold px-2 py-1 rounded-full 
                      ${modulePercentage >= 80 ? 'bg-[#f6ffed] text-[#52c41a]' : 
                       modulePercentage >= 50 ? 'bg-[#fffbe6] text-[#faad14]' : 'bg-[#fff1f0] text-[#f5222d]'}">
                      ${modulePercentage}%
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-2">
                    <div class="w-full bg-gray-100 rounded-full h-2 flex-grow">
                      <div class="${progressColor} h-2 rounded-full" style="width: ${modulePercentage}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${scoreData.score}/${scoreData.totalQuestions}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  };

  // Fonction principale de rendu
  const renderProfile = async (user) => {
    if (!user) {
      window.location.href = '/';
      return;
    }

    // Rendu de base
    DOM.avatar.innerHTML = createAvatar(user);
    DOM.name.textContent = user.displayName || 'Utilisateur';
    DOM.email.textContent = user.email || '';

    // Chargement des données
    const [scores, technologies, profile] = await Promise.all([
      getUserScores(user.uid),
      getTechnologies(),
      getUserProfile(user.uid)
    ]);

    // Mise à jour des statistiques
    if (profile) {
      DOM.totalScore.textContent = `Score total : ${profile.totalScore || 0}`;
    }

    // Rendu de la progression
    let hasContent = false;
    let progressHTML = '';

    for (const tech of technologies) {
      const modules = await getModulesForTechnology(tech.id);
      const attemptedModules = modules.filter(module => scores[`${tech.id}_${module.id}`]);
      
      if (attemptedModules.length > 0) {
        hasContent = true;
        progressHTML += createTechItem(tech, attemptedModules, scores);
      }
    }

    DOM.progressList.innerHTML = hasContent ? progressHTML : `
      <div class="p-8 text-center">
        <span class="material-icons text-gray-300 text-5xl mb-3">auto_awesome</span>
        <h3 class="text-gray-500 font-medium">Aucune progression enregistrée</h3>
        <p class="text-gray-400 mt-2">Commencez à passer des quiz pour voir votre progression apparaître ici</p>
        <button class="mt-4 px-4 py-2 bg-[#52c41a] text-white rounded-lg hover:bg-[#3dad42] transition-colors">
          Découvrir les quiz
        </button>
      </div>
    `;

    // Gestion des interactions
    DOM.progressList.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-toggle]');
      if (!toggleBtn) return;
      
      const techId = toggleBtn.getAttribute('data-toggle');
      const techContent = document.getElementById(techId);
      const icon = document.querySelector(`[data-icon="${techId}"]`);
      
      if (techContent && icon) {
        techContent.classList.toggle('hidden');
        icon.textContent = techContent.classList.contains('hidden') ? 'chevron_right' : 'expand_more';
      }
    });
  };

  // Initialisation
  authStateObserver(renderProfile);
});