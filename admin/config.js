// Configuration de l'application
export const CONFIG = {
    // Clé API Groq - À remplacer par votre clé en développement
    // En production, cette valeur sera remplacée par la variable d'environnement
    GROQ_API_KEY: import.meta.env?.VITE_GROQ_API_KEY || 'votre_cle_api_ici'
};

// Vérification de la configuration
if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'votre_cle_api_ici') {
    console.warn('Avertissement: La clé API Groq n\'est pas configurée correctement.');
}
