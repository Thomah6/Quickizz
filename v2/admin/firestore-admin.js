import { db } from '../assets/js/firebase-config.js';
import { collection, query, where, getDocs, addDoc, writeBatch, doc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

// Helper to find a document by name in a collection or create it.
const findOrCreateDoc = async (collRef, nameField, nameValue, createData) => {
    if (!nameValue || typeof nameValue !== 'string') {
        throw new Error('Invalid name value provided');
    }

    const q = query(collRef, where(nameField, '==', nameValue));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const docRef = await addDoc(collRef, { 
            ...createData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    }
};

/**
 * Creates or updates a module with a set of quizzes.
 * @param {string} techName - The name of the technology.
 * @param {string} moduleName - The name of the module.
 * @param {Array} quizzes - The array of quiz objects from Groq.
 */
export const createOrUpdateModuleWithQuizzes = async (techName, moduleName, quizzes) => {
    if (!techName || !moduleName || !quizzes || !Array.isArray(quizzes)) {
        throw new Error('Invalid input parameters');
    }

    try {
        // 1. Find or create the technology
        const techColRef = collection(db, 'technologies');
        const techId = await findOrCreateDoc(techColRef, 'name', techName, { 
            name: techName, 
            imageUrl: '' 
        });

        // 2. Find or create the module within the technology
        const moduleColRef = collection(db, `technologies/${techId}/modules`);
        const moduleId = await findOrCreateDoc(moduleColRef, 'name', moduleName, { 
            name: moduleName, 
            description: `Quiz sur ${moduleName}`,
            quizCount: quizzes.length
        });

        // 3. Batch write all the quizzes to the module's subcollection
        const quizzesColRef = collection(db, `technologies/${techId}/modules/${moduleId}/quizzes`);
        const batch = writeBatch(db);

        // Add timestamp to each quiz
        const timestamp = new Date();
        quizzes.forEach(quizData => {
            const newQuizRef = doc(quizzesColRef);
            batch.set(newQuizRef, {
                ...quizData,
                createdAt: timestamp,
                updatedAt: timestamp
            });
        });

        await batch.commit();
        console.log(`${quizzes.length} quizzes have been added to module ${moduleName}.`);
        
    } catch (error) {
        console.error('Error in createOrUpdateModuleWithQuizzes:', error);
        throw new Error(`Failed to save quizzes: ${error.message}`);
    }
};