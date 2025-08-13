// Configuration de l'application
export const CONFIG = {
    // En production, cette valeur sera remplacée par la variable d'environnement
    GROQ_API_KEY: import.meta.env?.VITE_GROQ_API_KEY || 'MA_CLE_API'
};

// Vérification de la configuration
if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'MA_CLE_API') {
    console.warn('Avertissement: La clé API Groq n\'est pas configurée correctement.');
}
