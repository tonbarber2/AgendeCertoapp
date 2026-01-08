import { AdminUser, Appointment, BusinessProfile, Professional, Service, PlanType, Product, ClientPlan } from "../types";
import { SERVICES as DEFAULT_SERVICES, PROFESSIONALS as DEFAULT_PROFESSIONALS, DEFAULT_BUSINESS_HOURS } from "../constants";
import { firebaseConfig } from './firebaseConfig';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
    
    // Verifica se o email já existe
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("E-mail já cadastrado.");
    }
    
    const isLifetimeUser = email.toLowerCase() === 'ton222418@gmail.com';
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
        plan: isLifetimeUser ? 'lifetime' : 'trial',
        status: 'active',
        startDate: now.toISOString(),
        expiresAt: isLifetimeUser ? null : trialExpiration.toISOString()
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
    
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", email), where("password", "==", password));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("Credenciais inválidas.");
    }

    let user = querySnapshot.docs[0].data() as AdminUser & { password?: string };
    
    let needsUpdate = false;

    if (!user.subscription) {
        const now = new Date();
        const trialExpiration = new Date(now);
        trialExpiration.setDate(now.getDate() + 7);
        user.subscription = { plan: 'trial', status: 'active', startDate: now.toISOString(), expiresAt: trialExpiration.toISOString() };
        needsUpdate = true;
    }

    if (user.email.toLowerCase() === 'ton222418@gmail.com') {
        if (user.subscription.plan !== 'lifetime' || user.subscription.status !== 'active') {
            user.subscription = { plan: 'lifetime', status: 'active', startDate: new Date().toISOString(), expiresAt: null };
            needsUpdate = true;
        }
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
      // Re-valida a assinatura ao carregar o usuário
      if (user.subscription && user.subscription.plan !== 'lifetime' && user.subscription.expiresAt) {
          const expiryDate = new Date(user.subscription.expiresAt);
          if (new Date() > expiryDate && user.subscription.status !== 'expired') {
              user.subscription.status = 'expired';
              await setDoc(userDocRef, user); // Atualiza no banco
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
    const usersRef = collection(firestore, "users");
    let targetUser: AdminUser | null = null;
    
    if (storeId) {
      const userDoc = await getDoc(doc(usersRef, storeId));
      if (userDoc.exists()) targetUser = userDoc.data() as AdminUser;
    } else {
        // Fallback: Tenta carregar o admin principal
        const adminEmail = 'ton222418@gmail.com';
        const q = query(usersRef, where("email", "==", adminEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            targetUser = querySnapshot.docs[0].data() as AdminUser;
        }
    }
    
    if (targetUser) {
      return this.loadData(targetUser.id);
    }
    
    // Final fallback
    return {
      profile: DEFAULT_PROFILE,
      appointments: [],
      professionals: DEFAULT_PROFESSIONALS,
      services: DEFAULT_SERVICES,
      products: [],
      clientPlans: []
    };
  },

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// --- SEED ADMIN USER ---
// Garante que o usuário administrador exista no Firestore.
(async function seedAdminUser() {
  const ADMIN_EMAIL = 'ton222418@gmail.com';
  const ADMIN_ID = 'admin_user_ton_01'; // Fixed ID
  const ADMIN_PASSWORD = '2222';

  try {
      const adminDocRef = doc(firestore, "users", ADMIN_ID);
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
          console.log('Admin user not found, seeding database...');
          const now = new Date();
          const adminUserWithPassword = {
            id: ADMIN_ID,
            name: 'Administrador',
            email: ADMIN_EMAIL,
            businessName: 'Barbearia Ton barber',
            subscription: {
              plan: 'lifetime' as PlanType,
              status: 'active' as 'active' | 'expired',
              startDate: now.toISOString(),
              expiresAt: null
            },
            password: ADMIN_PASSWORD
          };
          
          await setDoc(adminDocRef, adminUserWithPassword);
          
          const schedulingUrl = `${window.location.origin}?store=${ADMIN_ID}`;
          const adminData: AppData = {
            profile: { 
              ...DEFAULT_PROFILE, 
              name: adminUserWithPassword.businessName, 
              email: ADMIN_EMAIL,
              schedulingUrl: schedulingUrl
            },
            appointments: [],
            professionals: [...DEFAULT_PROFESSIONALS],
            services: [...DEFAULT_SERVICES],
            products: [],
            clientPlans: []
          };

          await setDoc(doc(firestore, "stores", ADMIN_ID), adminData);
          console.log(`Admin user seeded. Email: ${ADMIN_EMAIL}`);
      } else {
          // Opcional: Atualizar senha se necessário
          const adminData = adminDoc.data();
          if (adminData.password !== ADMIN_PASSWORD) {
              adminData.password = ADMIN_PASSWORD;
              await setDoc(adminDocRef, adminData);
              console.log("Admin password updated.");
          }
      }
  } catch (error) {
    console.error('Failed to seed or update admin user:', error);
  }
})();
