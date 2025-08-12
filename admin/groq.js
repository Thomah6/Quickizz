const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Clé API Groq
const GROQ_API_KEY =process.env.MA_CLE_API_GROQ;

/**
 * Generates a quiz using the Groq API.
 * @param {string} techName - The name of the technology.
 * @param {string} moduleName - The name of the module.
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON response from the API.
 */
export const generateQuizWithGroq = async (techName, moduleName) => {
    if (!techName || !moduleName) {
        throw new Error('Missing required parameters');
    }

    const prompt = `En tant qu'expert en création de quiz, générez 50 questions de quiz originales en français sur la technologie "${techName}", avec un focus sur le niveau "${moduleName}". Répondez uniquement avec un objet JSON valide. L'objet doit contenir une seule clé "quizzes" qui est un tableau d'objets. Chaque objet dans le tableau doit représenter une question et contenir les clés suivantes: "question" (la question du quiz), "options" (un tableau de 4 chaînes de caractères pour les réponses), "answer" (la bonne réponse), "appreciation" (une brève explication de la bonne réponse), et "level" (le niveau du quiz, qui est "${moduleName}"). Assurez-vous que l'ensemble de la réponse est un JSON valide et bien formaté. Les valeurs des chaînes de caractères ne doivent contenir aucun caractère de saut de ligne, de tabulation ou de retour à la ligne non échappé.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            }),
            timeout: 30000 // 30 seconds timeout
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content in Groq API response.');
        }

        // Parse and validate the response
        let result;
        try {
            // Essayer de parser le contenu tel quel
            result = typeof content === 'string' ? JSON.parse(content) : content;
            
            // Vérifier si la réponse contient une erreur
            if (result.error) {
                throw new Error(result.error.message || 'Erreur inconnue de l\'API Groq');
            }
            
            // Vérifier le format des quizzes
            if (!result.quizzes || !Array.isArray(result.quizzes)) {
                // Essayer de récupérer le contenu de 'failed_generation' si disponible
                const failedGen = result.error?.failed_generation;
                if (failedGen) {
                    try {
                        const parsedFailed = JSON.parse(failedGen);
                        if (parsedFailed.quizzes && Array.isArray(parsedFailed.quizzes)) {
                            console.warn('Using content from failed_generation field');
                            return parsedFailed;
                        }
                    } catch (e) {
                        console.error('Failed to parse failed_generation:', e);
                    }
                }
                throw new Error('Format de quiz invalide. Assurez-vous que la réponse contient un tableau \'quizzes\'.');
            }
            
            // Nettoyer les chaînes de caractères
            result.quizzes = result.quizzes.map(quiz => ({
                ...quiz,
                question: quiz.question?.replace(/\n/g, ' ').trim(),
                answer: quiz.answer?.replace(/\n/g, ' ').trim(),
                appreciation: quiz.appreciation?.replace(/\n/g, ' ').trim(),
                level: quiz.level || moduleName,
                options: Array.isArray(quiz.options) 
                    ? quiz.options.map(opt => typeof opt === 'string' ? opt.replace(/\n/g, ' ').trim() : String(opt))
                    : []
            }));
            
            return result;
        } catch (parseError) {
            console.error('Erreur lors du parsing de la réponse:', parseError);
            throw new Error(`Erreur de format de la réponse: ${parseError.message}`);
        }

    } catch (error) {
        console.error('Failed to generate quiz with Groq:', error);
        throw new Error(`Échec de la génération du quiz: ${error.message}`);
    }
};