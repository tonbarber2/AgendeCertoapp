import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// A configuração agora é construída a partir das variáveis de ambiente injetadas pelo Vite.
// Isso garante que as chaves seguras da Vercel sejam usadas em produção.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

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
    const errorMessage = `Erro de Configuração: As seguintes chaves do Firebase estão faltando nas variáveis de ambiente: ${missingKeys.join(', ')}. Por favor, configure-as nas configurações da Vercel e tente novamente.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    app = initializeApp(firebaseConfig as any); // Cast to any because Vite replaces the process.env values with strings
    firestore = getFirestore(app);
    return { app, firestore };
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
    throw new Error("Não foi possível conectar ao Firebase. Verifique se as chaves de API estão corretas nas variáveis de ambiente da Vercel.");
  }
}

export const getFirebase = () => {
    // A inicialização "lazy" (preguiçosa) garante que a verificação seja executada apenas quando o Firebase for necessário pela primeira vez.
    if (!app || !firestore) {
        return initializeFirebase();
    }
    return { app, firestore };
};