
import { AdminUser, Appointment, BusinessProfile, Professional, Service, PlanType, Product, ClientPlan } from "../types";
import { SERVICES as DEFAULT_SERVICES, PROFESSIONALS as DEFAULT_PROFESSIONALS, DEFAULT_BUSINESS_HOURS } from "../constants";
import { firebaseConfig } from './firebaseConfig';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, deleteDoc } from "firebase/firestore";

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Default Profile Template (Premium Gold Theme)
const DEFAULT_PROFILE: BusinessProfile = {
  name: 'Barbearia Ton barber',
  email: 'contato@exemplo.com',
  phone: '(00) 0000-0000',
  logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAIAAgADASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAECBAMFBgf/xABHEAACAQMCBAMFBwIEBAMGBwAAAQIDERIhBAUxQVEGYXGBIhMykaGxwfBCUnLR4RQVIzOCFiQ0U2KSFzRzorLC8XWEk6PT/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAgEQEBAQEAAwEAAwEBAAAAAAAAAQIREhMhMQNBUQQi/9oADAMBAAIRAxEAPwD+SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAACgAAAAAAAAAKAAAAAAAAAAAAAAAKAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAKAAAAAAAAAAAAAAAoAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//2Q==',
  backgroundImage: null,
  pixKey: '71986073552',
  whatsapp: '71986073552',
  address: '',
  schedulingUrl: '',
  openingHours: DEFAULT_BUSINESS_HOURS,
  notificationSound: true,
  selectedSound: 'Padrão (Digital)',
  fontFamily: 'Inter',
  colors: {
      primary: '#D4AF37',
      secondary: '#F3E5AB',
      background: '#f9fafb',
      listTitle: '#111827',
      listPrice: '#D4AF37',
      listInfo: '#6b7280',
      textPrimary: '#111827',
      textSecondary: '#6b7280'
  }
};

interface AppData {
  profile: BusinessProfile;
  appointments: Appointment[];
  professionals: Professional[];
  services: Service[];
  products: Product[];
  clientPlans: ClientPlan[];
}

// Armazenamento temporário de códigos de recuperação (em memória)
const recoveryCodes = new Map<string, string>();

export const db = {
  
  // --- Auth Methods ---

  async register(name: string, email: string, password: string, businessName: string): Promise<AdminUser> {
    await this.delay(800);

    if (email.toLowerCase() === 'ton222418@gmail.com') {
      throw new Error("Este e-mail não pode ser utilizado. Por favor, escolha outro.");
    }
    
    // Verifica se o email já existe
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("E-mail já cadastrado.");
    }
    
    const now = new Date();
    const trialExpiration = new Date(now);
    trialExpiration.setDate(now.getDate() + 7);

    const newUserId = Date.now().toString();

    const newUser: AdminUser = {
      id: newUserId,
      name,
      email,
      businessName,
      subscription: {
        plan: 'trial',
        status: 'active',
        startDate: now.toISOString(),
        expiresAt: trialExpiration.toISOString()
      }
    };
    
    const userWithPassword = { ...newUser, password };
    await setDoc(doc(firestore, "users", newUser.id), userWithPassword);

    const schedulingUrl = `${window.location.origin}?store=${newUser.id}`;

    await this.saveData(newUser.id, {
      profile: { 
        ...DEFAULT_PROFILE, 
        name: businessName, 
        email: email,
        schedulingUrl: schedulingUrl
      },
      appointments: [],
      professionals: [...DEFAULT_PROFESSIONALS],
      services: [...DEFAULT_SERVICES],
      products: [],
      clientPlans: []
    });

    return newUser;
  },

  async login(email: string, password: string): Promise<AdminUser> {
    await this.delay(800);
    
    if (email.toLowerCase() === 'ton222418@gmail.com') {
        throw new Error("Credenciais inválidas.");
    }

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("Credenciais inválidas.");
    }

    const userDoc = querySnapshot.docs[0];
    let user = userDoc.data() as AdminUser & { password?: string };

    if (user.password !== password) {
      throw new Error("Credenciais inválidas.");
    }
    
    let needsUpdate = false;
    if (!user.subscription) {
        const now = new Date();
        const trialExpiration = new Date(now);
        trialExpiration.setDate(now.getDate() + 7);
        user.subscription = { plan: 'trial', status: 'active', startDate: now.toISOString(), expiresAt: trialExpiration.toISOString() };
        needsUpdate = true;
    }

    if (user.subscription.plan !== 'lifetime' && user.subscription.expiresAt) {
        const expiryDate = new Date(user.subscription.expiresAt);
        if (new Date() > expiryDate && user.subscription.status !== 'expired') {
            user.subscription.status = 'expired';
            needsUpdate = true;
        }
    }
    
    if(needsUpdate) {
        await setDoc(doc(firestore, "users", user.id), user);
    }
    
    delete user.password;
    return user;
  },
  
  async getUserById(userId: string): Promise<AdminUser | null> {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const user = userDoc.data() as AdminUser & { password?: string };
      if (user.subscription && user.subscription.plan !== 'lifetime' && user.subscription.expiresAt) {
          const expiryDate = new Date(user.subscription.expiresAt);
          if (new Date() > expiryDate && user.subscription.status !== 'expired') {
              user.subscription.status = 'expired';
              await setDoc(userDocRef, user);
          }
      }
      delete user.password;
      return user;
    }
    return null;
  },

  async requestPasswordReset(email: string): Promise<string> {
    await this.delay(1000);
    
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        throw new Error("Usuário não encontrado.");
    }
    const user = querySnapshot.docs[0].data();
    
    const storeData = await this.loadData(user.id);
    const phone = storeData.profile?.whatsapp || storeData.profile?.phone || "";

    if (!phone || phone.length < 8) {
        throw new Error("Nenhum telefone válido cadastrado. Entre em contato com o suporte.");
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    recoveryCodes.set(email, code);

    const maskedPhone = phone.replace(/.(?=.{4})/g, '*');

    alert(`[SIMULAÇÃO SMS] Seu código de recuperação é: ${code}`);
    console.log(`Código para ${email}: ${code}`);

    return maskedPhone;
  },

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
      await this.delay(1000);
      
      if (recoveryCodes.get(email) !== code) {
          throw new Error("Código inválido ou expirado.");
      }

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          throw new Error("Usuário não encontrado.");
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      userData.password = newPassword;
      await setDoc(userDoc.ref, userData);
      
      recoveryCodes.delete(email);
  },

  async renewSubscription(userId: string, plan: PlanType): Promise<AdminUser> {
      await this.delay(1000);
      const userDocRef = doc(firestore, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) throw new Error("Usuário não encontrado.");

      const now = new Date();
      const newExpiration = new Date();

      if (plan === 'monthly') newExpiration.setDate(now.getDate() + 30);
      else if (plan === 'semiannual') newExpiration.setDate(now.getDate() + 180);
      else if (plan === 'annual') newExpiration.setDate(now.getDate() + 365);
      
      const user = userDoc.data() as AdminUser & { password?: string };
      user.subscription = {
          plan: plan,
          status: 'active',
          startDate: now.toISOString(),
          expiresAt: newExpiration.toISOString()
      };

      await setDoc(userDocRef, user);

      delete user.password;
      return user;
  },

  // --- Data Methods (Sync) ---

  async loadData(userId: string): Promise<AppData> {
    await this.delay(500);
    const docRef = doc(firestore, "stores", userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        profile: DEFAULT_PROFILE,
        appointments: [],
        professionals: DEFAULT_PROFESSIONALS,
        services: DEFAULT_SERVICES,
        products: [],
        clientPlans: []
      };
    }
    return this.normalizeData(docSnap.data());
  },

  async saveData(userId: string, data: AppData): Promise<void> {
    const docRef = doc(firestore, "stores", userId);
    await setDoc(docRef, data);
  },

  normalizeData(data: any): AppData {
      return {
        ...data,
        profile: data.profile || DEFAULT_PROFILE,
        appointments: data.appointments || [],
        professionals: data.professionals || DEFAULT_PROFESSIONALS,
        services: data.services || DEFAULT_SERVICES,
        products: data.products || [],
        clientPlans: data.clientPlans || []
      };
  },

  async loadPublicData(storeId?: string | null): Promise<AppData> {
    if (!storeId) {
      // Se não houver storeId, retorna dados padrão para evitar erros.
      return {
        profile: DEFAULT_PROFILE,
        appointments: [],
        professionals: [],
        services: [],
        products: [],
        clientPlans: []
      };
    }
    
    // Carrega os dados da loja pública com base no storeId
    const usersRef = collection(firestore, "users");
    const userDoc = await getDoc(doc(usersRef, storeId));
    
    if (userDoc.exists()) {
      return this.loadData(userDoc.id);
    }
    
    // Retorna um estado vazio e seguro se a loja não for encontrada
    return {
      profile: { ...DEFAULT_PROFILE, name: 'Loja não encontrada' },
      appointments: [],
      professionals: [],
      services: [],
      products: [],
      clientPlans: []
    };
  },

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// --- Função para deletar usuário (chamada uma vez para limpar) ---
(async function deleteLegacyAdmin() {
    const ADMIN_ID = 'admin_user_ton_01';
    const ADMIN_EMAIL = 'ton222418@gmail.com';

    try {
        const userDocRef = doc(firestore, "users", ADMIN_ID);
        const userDoc = await getDoc(userDocRef);
        
        // Verifica se o documento existe e se o email corresponde
        if (userDoc.exists() && userDoc.data().email === ADMIN_EMAIL) {
            const storeDocRef = doc(firestore, "stores", ADMIN_ID);
            
            // Inicia um batch para garantir a atomicidade
            const batch = writeBatch(firestore);
            batch.delete(userDocRef);
            batch.delete(storeDocRef);
            
            await batch.commit();
            console.log(`Legacy admin user ${ADMIN_EMAIL} and their store data have been successfully deleted.`);
        }
    } catch (error) {
        console.error('Error during cleanup of legacy admin user:', error);
    }
})();

// --- Função para deletar usuário uelton.cs619@gmail.com (chamada uma vez) ---
(async function deleteUeltonAccount() {
    const USER_EMAIL = 'uelton.cs619@gmail.com';

    try {
        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("email", "==", USER_EMAIL));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            const storeDocRef = doc(firestore, "stores", userId);

            const batch = writeBatch(firestore);
            batch.delete(userDoc.ref);
            batch.delete(storeDocRef);

            await batch.commit();
            console.log(`User ${USER_EMAIL} and their store data have been successfully deleted.`);
        } else {
            console.log(`User with email ${USER_EMAIL} not found for deletion.`);
        }
    } catch (error) {
        console.error(`Error deleting user ${USER_EMAIL}:`, error);
    }
})();
