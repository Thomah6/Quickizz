import { CONFIG } from './config.js';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = CONFIG.GROQ_API_KEY;

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

    const prompt = `En tant qu'expert en création de quiz, générez 50 (minimum) questions de quiz originales en français sur la technologie "${techName}", avec un focus strict et exclusif sur le module "${moduleName}".

INSTRUCTIONS IMPORTANTES :
1. Chaque question doit être EXCLUSIVEMENT liée au module "${moduleName}" de la technologie "${techName}".
2. NE PAS inclure de questions sur d'autres modules ou aspects de la technologie qui ne sont pas directement liés à "${moduleName}".
3. Pour chaque question, la réponse correcte DOIT être l'une des options proposées (vérifiez bien cela).
4. Les questions doivent couvrir différents aspects du module de manière équilibrée.
5. Évitez les questions trop générales qui pourraient s'appliquer à plusieurs modules.

FORMAT DE RÉPONSE :
Répondez UNIQUEMENT avec un objet JSON valide contenant une seule clé "quizzes" qui est un tableau d'objets. Chaque objet doit avoir la structure suivante :
{
  "question": "[La question claire et précise]",
  "options": ["[Option 1]", "[Option 2]", "[Option 3]", "[Option 4]"],
  "answer": "[L'une des options ci-dessus, exactement comme écrite]",
  "appreciation": "[Explication claire et concise de la réponse, 1-2 phrases maximum]",
  "level": "${moduleName}"
}

EXIGENCES TECHNIQUES :
- Tous les textes doivent être en français.
- Les chaînes de caractères NE DOIVENT PAS contenir de sauts de ligne (\n), de tabulations (\t) ou de retours à la ligne non échappés.
- Les guillemets dans les textes doivent être échappés avec un antislash (\").
- La réponse DOIT être un JSON valide et bien formaté.`;

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
            
            // Nettoyer et valider chaque quiz
            const validatedQuizzes = [];
            
            for (const quiz of result.quizzes) {
                try {
                    // Vérifier que tous les champs requis existent
                    if (!quiz.question || !quiz.options || !quiz.answer || !quiz.appreciation) {
                        console.warn('Quiz invalide - champs manquants:', quiz);
                        continue;
                    }
                    
                    // Nettoyer les chaînes de caractères
                    const cleanedQuiz = {
                        question: String(quiz.question || '').replace(/\n/g, ' ').trim(),
                        answer: String(quiz.answer || '').replace(/\n/g, ' ').trim(),
                        appreciation: String(quiz.appreciation || '').replace(/\n/g, ' ').trim(),
                        level: String(quiz.level || moduleName),
                        options: Array.isArray(quiz.options) 
                            ? quiz.options
                                .map(opt => String(opt || '').replace(/\n/g, ' ').trim())
                                .filter(opt => opt.length > 0) // Supprimer les options vides
                            : []
                    };
                    
                    // Vérifier que la réponse est bien dans les options
                    if (!cleanedQuiz.options.includes(cleanedQuiz.answer)) {
                        console.warn('La réponse n\'est pas dans les options, ajout automatique:', {
                            question: cleanedQuiz.question,
                            answer: cleanedQuiz.answer,
                            options: cleanedQuiz.options
                        });
                        cleanedQuiz.options.push(cleanedQuiz.answer);
                    }
                    
                    // Vérifier qu'il y a au moins 2 options
                    if (cleanedQuiz.options.length < 2) {
                        console.warn('Pas assez d\'options pour la question:', cleanedQuiz.question);
                        continue;
                    }
                    
                    // Vérifier que les champs requis ne sont pas vides
                    if (cleanedQuiz.question && cleanedQuiz.answer && cleanedQuiz.appreciation) {
                        validatedQuizzes.push(cleanedQuiz);
                    }
                } catch (error) {
                    console.error('Erreur lors du nettoyage du quiz:', error, quiz);
                }
            }
            
            if (validatedQuizzes.length === 0) {
                throw new Error('Aucun quiz valide après validation. Vérifiez les logs pour plus de détails.');
            }
            
            return { quizzes: validatedQuizzes };
        } catch (parseError) {
            console.error('Erreur lors du parsing de la réponse:', parseError);
            throw new Error(`Erreur de format de la réponse: ${parseError.message}`);
        }

    } catch (error) {
        console.error('Failed to generate quiz with Groq:', error);
        throw new Error(`Échec de la génération du quiz: ${error.message}`);
    }
};

// test push
