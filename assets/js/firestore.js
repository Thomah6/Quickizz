import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp, runTransaction, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/**
 * Fetches all documents from the 'technologies' collection.
 * @returns {Promise<Array>} A promise that resolves to an array of technology objects.
 */
export const getTechnologies = async () => {
    const querySnapshot = await getDocs(collection(db, "technologies"));
    const technologies = [];
    querySnapshot.forEach((doc) => {
        technologies.push({ id: doc.id, ...doc.data() });
    });
    return technologies;
};

/**
 * Fetches the details for a single technology document.
 * @param {string} techId The ID of the technology document.
 * @returns {Promise<Object|null>} A promise that resolves to the technology data or null if not found.
 */
export const getTechnologyDetails = async (techId) => {
    const docRef = doc(db, "technologies", techId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        console.error("No such technology!");
        return null;
    }
};

/**
 * Fetches all modules for a given technology.
 * @param {string} techId The ID of the technology.
 * @returns {Promise<Array>} A promise that resolves to an array of module objects.
 */
export const getModulesForTechnology = async (techId) => {
    const modulesColRef = collection(db, `technologies/${techId}/modules`);
    const querySnapshot = await getDocs(modulesColRef);
    const modules = [];
    querySnapshot.forEach((doc) => {
        modules.push({ id: doc.id, ...doc.data() });
    });
    return modules;
};

/**
 * Fetches all quiz questions for a given module.
 * @param {string} techId The ID of the technology.
 * @param {string} moduleId The ID of the module.
 * @returns {Promise<Array>} A promise that resolves to an array of quiz question objects.
 */
export const getQuizzesForModule = async (techId, moduleId) => {
    const quizzesColRef = collection(db, `technologies/${techId}/modules/${moduleId}/quizzes`);
    const querySnapshot = await getDocs(quizzesColRef);
    let quizzes = [];
    querySnapshot.forEach((doc) => {
        quizzes.push({ id: doc.id, ...doc.data() });
    });

    // Shuffle the array and pick 10 questions
    quizzes.sort(() => Math.random() - 0.5);
    return quizzes.slice(0, 10);
};

/**
 * Creates a user profile document in Firestore if it doesn't already exist.
 * @param {Object} user - The user object from Firebase Auth.
 */
export const findOrCreateUserProfile = async (user) => {
    const userRef = doc(db, 'userProfiles', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        try {
            await setDoc(userRef, {
                displayName: user.displayName,
                photoURL: user.photoURL,
                email: user.email,
                createdAt: serverTimestamp(),
                totalScore: 0
            });
            console.log("User profile created for", user.displayName);
        } catch (error) {
            console.error("Error creating user profile:", error);
        }
    }
};

/**
 * Saves the user's score for a specific module.
 * @param {string} userId The user's ID.
 * @param {string} techId The technology ID.
 * @param {string} moduleId The module ID.
 * @param {number} score The score achieved.
 * @param {number} totalQuestions The total number of questions.
 */
/**
 * Fetches all scores for a given user.
 * @param {string} userId The user's ID.
 * @returns {Promise<Object>} A promise that resolves to an object mapping module IDs to scores.
 */
export const getUserScores = async (userId) => {
    if (!userId) return {};
    const scoresColRef = collection(db, `users/${userId}/scores`);
    const querySnapshot = await getDocs(scoresColRef);
    const scores = {};
    querySnapshot.forEach((doc) => {
        // The document ID is `${techId}_${moduleId}`
        scores[doc.id] = doc.data();
    });
    return scores;
};

/**
 * Saves the user's score for a specific module.
 * @param {string} userId The user's ID.
 * @param {string} techId The technology ID.
 * @param {string} moduleId The module ID.
 * @param {number} score The score achieved.
 * @param {number} totalQuestions The total number of questions.
 */
export const saveUserScore = async (userId, techId, moduleId, score, totalQuestions) => {
    const scoreRef = doc(db, `users/${userId}/scores`, `${techId}_${moduleId}`);
    const userProfileRef = doc(db, 'userProfiles', userId);

    try {
        await runTransaction(db, async (transaction) => {
            const userProfileDoc = await transaction.get(userProfileRef);
            if (!userProfileDoc.exists()) {
                throw "User profile does not exist!";
            }

            const oldScoreData = await transaction.get(scoreRef);
            const scoreDifference = oldScoreData.exists() ? score - oldScoreData.data().score : score;

            // Update module score
            transaction.set(scoreRef, {
                techId,
                moduleId,
                score,
                totalQuestions,
                completedAt: serverTimestamp()
            }, { merge: true });

            // Update total score in profile
            const newTotalScore = (userProfileDoc.data().totalScore || 0) + scoreDifference;
            transaction.update(userProfileRef, { totalScore: newTotalScore });
        });
        console.log("Transaction successfully committed!");
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
};
