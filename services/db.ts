import { AdminUser, Appointment, BusinessProfile, Professional, Service, PlanType, Product, ClientPlan } from "../types";
import { SERVICES as DEFAULT_SERVICES, PROFESSIONALS as DEFAULT_PROFESSIONALS, DEFAULT_BUSINESS_HOURS } from "../constants";

// Default Profile Template (Premium Gold Theme)
const DEFAULT_PROFILE: BusinessProfile = {
  name: 'AgendeCerto Barbearia',
  email: 'contato@exemplo.com',
  phone: '(00) 0000-0000',
  logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJjM2U1MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMTE4MjciLz48cGF0aCBkPSJNMTYuNSAzLjVhMi4xMiAyLjEyIDAgMCAxIDMgM0w3IDE5bC00LTRICTYuNSAzLjV6IiBmaWxsPSIjZjVhNjIzIiBzdHJva2U9IiNmNWE2MjMiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9ImTE1IDUgMyAzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTMgMjFsNC00IiBzdHJva2U9IiNmNWE2MjMiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==',
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
      primary: '#f5a623',
      secondary: '#F3E5AB',
      background: '#f9fafb',
      listTitle: '#111827',
      listPrice: '#f5a623',
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

// --- Helpers para LocalStorage ---
const USERS_KEY = 'agende-certo-users';
const STORE_KEY_PREFIX = 'agende-certo-store-';

const getUsers = (): (AdminUser & { password?: string })[] => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (e) {
    return [];
  }
};

const saveUsers = (users: (AdminUser & { password?: string })[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};
// --- Fim Helpers ---


export const db = {
  
  // --- Auth Methods ---

  async register(name: string, email: string, password: string, businessName: string): Promise<AdminUser> {
    await this.delay(800);
    
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("O e-mail é obrigatório.");

    const users = getUsers();
    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error("E-mail já cadastrado.");
    }
    
    const now = new Date();
    const trialExpiration = new Date(now);
    trialExpiration.setDate(now.getDate() + 7);

    const newUserId = Date.now().toString();

    const newUser: AdminUser = {
      id: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      businessName: businessName.trim(),
      subscription: {
        plan: 'trial',
        status: 'active',
        startDate: now.toISOString(),
        expiresAt: trialExpiration.toISOString()
      }
    };
    
    const userWithPassword = { ...newUser, password };
    users.push(userWithPassword);
    saveUsers(users);

    const schedulingUrl = `${window.location.origin}?store=${newUser.id}`;

    await this.saveData(newUser.id, {
      profile: { 
        ...DEFAULT_PROFILE, 
        name: businessName.trim(), 
        email: normalizedEmail,
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
    
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("O e-mail é obrigatório.");

    const users = getUsers();
    let user = users.find(u => u.email === normalizedEmail);
    
    if (!user || user.password !== password) {
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
        saveUsers(users);
    }
    
    const { password: _, ...userToReturn } = user;
    return userToReturn;
  },
  
  async getUserById(userId: string): Promise<AdminUser | null> {
    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (user) {
      if (user.subscription && user.subscription.plan !== 'lifetime' && user.subscription.expiresAt) {
          const expiryDate = new Date(user.subscription.expiresAt);
          if (new Date() > expiryDate && user.subscription.status !== 'expired') {
              user.subscription.status = 'expired';
              saveUsers(users);
          }
      }
      const { password, ...userToReturn } = user;
      return userToReturn;
    }
    return null;
  },

  async requestPasswordReset(email: string): Promise<string> {
    await this.delay(1000);
    
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("O e-mail é obrigatório.");

    const users = getUsers();
    const user = users.find(u => u.email === normalizedEmail);
    
    if (!user) {
        throw new Error("Usuário não encontrado.");
    }
    
    const storeData = await this.loadData(user.id);
    const phone = storeData.profile?.whatsapp || storeData.profile?.phone || "";

    if (!phone || phone.length < 8) {
        throw new Error("Nenhum telefone válido cadastrado. Entre em contato com o suporte.");
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    recoveryCodes.set(normalizedEmail, code);

    const maskedPhone = phone.replace(/.(?=.{4})/g, '*');

    alert(`[SIMULAÇÃO SMS] Seu código de recuperação é: ${code}`);
    console.log(`Código para ${email}: ${code}`);

    return maskedPhone;
  },

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
      await this.delay(1000);
      
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) throw new Error("O e-mail é obrigatório.");
      
      if (recoveryCodes.get(normalizedEmail) !== code) {
          throw new Error("Código inválido ou expirado.");
      }

      const users = getUsers();
      const userIndex = users.findIndex(u => u.email === normalizedEmail);

      if (userIndex === -1) {
          throw new Error("Usuário não encontrado.");
      }
      
      users[userIndex].password = newPassword;
      saveUsers(users);
      
      recoveryCodes.delete(normalizedEmail);
  },

  async renewSubscription(userId: string, plan: PlanType): Promise<AdminUser> {
      await this.delay(1000);
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) throw new Error("Usuário não encontrado.");

      const now = new Date();
      const newExpiration = new Date();

      if (plan === 'monthly') newExpiration.setDate(now.getDate() + 30);
      else if (plan === 'semiannual') newExpiration.setDate(now.getDate() + 180);
      else if (plan === 'annual') newExpiration.setDate(now.getDate() + 365);
      
      const user = users[userIndex];
      user.subscription = {
          plan: plan,
          status: 'active',
          startDate: now.toISOString(),
          expiresAt: newExpiration.toISOString()
      };
      
      saveUsers(users);

      const { password, ...userToReturn } = user;
      return userToReturn;
  },

  // --- Data Methods (Sync) ---

  async loadData(userId: string): Promise<AppData> {
    await this.delay(500);
    const storeJson = localStorage.getItem(`${STORE_KEY_PREFIX}${userId}`);
    
    if (!storeJson) {
      return {
        profile: DEFAULT_PROFILE,
        appointments: [],
        professionals: DEFAULT_PROFESSIONALS,
        services: DEFAULT_SERVICES,
        products: [],
        clientPlans: []
      };
    }
    return this.normalizeData(JSON.parse(storeJson));
  },

  async saveData(userId: string, data: AppData): Promise<void> {
    localStorage.setItem(`${STORE_KEY_PREFIX}${userId}`, JSON.stringify(data));
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
      return {
        profile: { ...DEFAULT_PROFILE, name: 'Loja não encontrada' },
        appointments: [],
        professionals: [],
        services: [],
        products: [],
        clientPlans: []
      };
    }
    
    const users = getUsers();
    const user = users.find(u => u.id === storeId);
    
    if (user) {
      return this.loadData(user.id);
    }
    
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