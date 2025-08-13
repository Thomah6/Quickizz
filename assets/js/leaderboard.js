import { authStateObserver, signInWithGoogle, signOutUser } from './auth.js';
import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

    const leaderboardList = document.getElementById('leaderboard-list');
    let currentUser = null;

    const getLeaderboard = async () => {
        const usersRef = collection(db, 'userProfiles');
const q = query(
        usersRef, 
        where('totalScore', '>=', 1),  // Nouvelle condition
        orderBy('totalScore', 'desc'), 
        limit(20)
    );
        try {
            const querySnapshot = await getDocs(q);
            leaderboardList.innerHTML = ''; // Clear previous list

            if (querySnapshot.empty) {
                leaderboardList.innerHTML = '<li class="p-4 text-center text-gray-500">Le classement est encore vide.</li>';
                return;
            }

            const rows = querySnapshot.docs.map((doc, index) => {
                const user = doc.data();
                const rank = index + 1;
                let medal = '';
                if (rank === 1) medal = '🥇';
                if (rank === 2) medal = '🥈';
                if (rank === 3) medal = '🥉';

                const isCurrentUser = currentUser && user.id === currentUser.uid;
                const rowClass = isCurrentUser ? 'bg-[#f0fff4] font-bold' : '';

                return `
                <tr class="${rowClass}">
                    <td class="p-4 text-center font-medium text-lg">${rank}${medal ? ` ${medal}` : ''}</td>
                    <td class="p-4 flex items-center">
                        <img src="${user.photoURL}" alt="${user.displayName}" class="w-10 h-10 rounded-full mr-4">
                        <span class="font-medium">${user.displayName}</span>
                    </td>
                    <td class="p-4 text-xl font-bold text-[#2da44e] text-center">${Math.max(user.totalScore || 0, 1)}</td>
                </tr>
            `});
            leaderboardList.innerHTML = rows.join('');
        } catch (error) {
            console.error("Error getting leaderboard: ", error);
            leaderboardList.innerHTML = '<li class="p-4 text-center text-red-500">Erreur de chargement du classement.</li>';
        }
    };

    const setupAuth = (user) => {
        const authContainerDesktop = document.getElementById('auth-container-desktop');
        const authContainerMobile = document.getElementById('auth-container-mobile');
        const updateUi = (user) => {
            currentUser = user;
            getLeaderboard(); // Reload leaderboard to highlight the user

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

        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#login-btn')) signInWithGoogle();
            if (e.target.closest('#logout-btn')) signOutUser();
        });

        updateUi(user);
    };

    authStateObserver(setupAuth);
});
