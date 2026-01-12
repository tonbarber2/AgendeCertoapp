import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;

function initializeFirebase() {
  if (app && firestore) {
    return { app, firestore };
  }
  
  const requiredKeys: (keyof typeof firebaseConfig)[] = [
    'apiKey', 
    'authDomain', 
    'projectId', 
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    const errorMessage = `Erro de Configuração: As seguintes chaves do Firebase estão faltando: ${missingKeys.join(', ')}. Por favor, configure suas variáveis de ambiente (no arquivo .env ou nas configurações da Vercel) e atualize a página.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    return { app, firestore };
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
    throw new Error("Não foi possível conectar ao Firebase. Verifique se as chaves de API estão corretas.");
  }
}

export const getFirebase = () => {
    // A inicialização "lazy" (preguiçosa) garante que a verificação seja executada apenas quando o Firebase for necessário pela primeira vez.
    if (!app || !firestore) {
        return initializeFirebase();
    }
    return { app, firestore };
};
