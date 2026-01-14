
import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Camera, 
  X, 
  Clock, 
  Plus, 
  Save, 
  Edit2, 
  User, 
  Link as LinkIcon, 
  Briefcase, 
  Trash2, 
  Settings, 
  ChevronRight, 
  ArrowLeft, 
  Eye, 
  Ban, 
  Package, 
  CalendarDays, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Palette, 
  Type, 
  FolderPlus, 
  Bell, 
  Phone, 
  History, 
  ImageIcon, 
  MapPin, 
  Smartphone, 
  Home, 
  QrCode, 
  Sun, 
  Moon, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  Loader2
} from 'lucide-react';
import { Theme, BusinessProfile, Service, Professional, Appointment, AdminUser, Product, ClientPlan, BusinessHours, ServiceCategory, DaySchedule } from '../types';

interface AdminDashboardProps {
  onViewMyStore: () => void;
  onViewAsClient: () => void;
  toggleTheme: () => void;
  currentTheme: Theme;
  businessProfile: BusinessProfile;
  onUpdateProfile: (profile: Partial<BusinessProfile>) => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  professionals: Professional[];
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clientPlans: ClientPlan[];
  setClientPlans: React.Dispatch<React.SetStateAction<ClientPlan[]>>;
  categories: ServiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
  currentUser: AdminUser;
  onSaveChanges: () => Promise<void>;
  isDirty: boolean;
  onLogout: () => void;
}

// Interface auxiliar para edição de cliente
interface EditableClient {
    originalName: string;
    name: string;
    phone: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onViewMyStore, 
  onViewAsClient,
  toggleTheme,
  currentTheme,
  businessProfile,
  onUpdateProfile,
  appointments,
  setAppointments,
  professionals,
  setProfessionals,
  services,
  setServices,
  products,
  setProducts,
  clientPlans,
  setClientPlans,
  categories,
  setCategories,
  currentUser,
  onSaveChanges,
  isDirty,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('inicio');
  
  // Profile Navigation State
  const [profileView, setProfileView] = useState<'menu' | 'meus_dados' | 'horarios' | 'servicos' | 'produtos' | 'profissionais' | 'cancelados' | 'planos' | 'aparencia' | 'notificacoes'>('menu');
  
  // Local Form State (Buffer for My Data editing)
  const [profileForm, setProfileForm] = useState<BusinessProfile>(businessProfile);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedProfId, setCopiedProfId] = useState<string | null>(null);

  // Save Button State
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync local form when external profile changes
  useEffect(() => {
    setProfileForm(businessProfile);
  }, [businessProfile]);

  // File Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const professionalAvatarRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  // --- States for Inline Editing (Buffer Objects) ---
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPlan, setEditingPlan] = useState<ClientPlan | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Novo estado para editar cliente
  const [editingClient, setEditingClient] = useState<EditableClient | null>(null);
  
  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
        await onSaveChanges();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
        console.error("Failed to save:", e);
        // Add user-facing error feedback if desired
    } finally {
        setIsSaving(false);
    }
  };

  // --- Calculations for Dashboard ---
  const getDaysRemaining = () => {
    if (!currentUser || !currentUser.subscription || !currentUser.subscription.expiresAt) return Infinity; 
    
    try {
        const expire = new Date(currentUser.subscription.expiresAt);
        const now = new Date();
        const diff = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    } catch (e) {
        return Infinity; // Fallback seguro
    }
  };

  const daysRemaining = getDaysRemaining();
  const isTrial = currentUser?.subscription?.plan === 'trial';

  // --- Shared Handlers ---
  
  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
      const appointment = appointments.find(a => a.id === id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      
      if (appointment) {
          let message = '';
          const phone = appointment.phone ? appointment.phone.replace(/\D/g, '') : '';
          if (newStatus === 'confirmado') {
              message = `Opa! Tudo bem ${appointment.client}? Passando pra informar que o seu agendamento para o dia ${appointment.date} às ${appointment.time}, foi confirmado! Te aguardando! 😉`;
          } else if (newStatus === 'cancelado') {
              message = `Opa! Tudo bem ${appointment.client}? É uma pena que o seu agendamento para o dia ${appointment.date} às ${appointment.time}, foi cancelado!`;
          }

          if (message && phone.length >= 10) {
              const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
              setTimeout(() => window.open(url, '_blank'), 100);
          }
      }
  };

  // --- Handlers ---
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          onUpdateProfile({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          onUpdateProfile({ backgroundImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfessionalAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProfessional) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedPro = { ...editingProfessional, avatar: reader.result as string };
          setEditingProfessional(updatedPro);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const updatedProd = { ...editingProduct, image: reader.result as string };
          setEditingProduct(updatedProd);
          setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    const url = businessProfile.schedulingUrl || `${window.location.origin}?store=${currentUser.id}`;
    navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleCopyProfessionalLink = (profId: string) => {
    const baseUrl = businessProfile.schedulingUrl || `${window.location.origin}?store=${currentUser.id}`;
    const cleanBaseUrl = baseUrl.split('&professionalId=')[0];
    const url = `${cleanBaseUrl}&professionalId=${profId}`;
    navigator.clipboard.writeText(url).then(() => {
        setCopiedProfId(profId);
        setTimeout(() => setCopiedProfId(null), 2000);
    });
  };

  const handleSaveProfileData = () => {
    onUpdateProfile(profileForm);
  };

  // --- CRUD Operations (Local State Only) ---
  const handleSaveService = () => {
    if (editingService) {
      if (services.some(s => s.id === editingService.id)) {
        setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
      } else {
        setServices(prev => [editingService, ...prev]);
      }
      setEditingService(null);
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      setServices(prev => prev.filter(s => s.id !== id));
      if (editingService?.id === id) {
        setEditingService(null);
      }
    }
  };

  const handleSaveProfessional = () => {
    if (editingProfessional) {
      if (professionals.find(p => p.id === editingProfessional.id)) {
        setProfessionals(prev => prev.map(p => p.id === editingProfessional.id ? editingProfessional : p));
      } else {
        setProfessionals(prev => [editingProfessional, ...prev]);
      }
      setEditingProfessional(null);
    }
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
      setEditingProfessional(null);
    }
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      if (products.find(p => p.id === editingProduct.id)) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      } else {
        setProducts(prev => [...prev, editingProduct]);
      }
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Excluir produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setEditingProduct(null);
    }
  };

  const handleSaveClient = () => {
      if (editingClient) {
          const updatedAppointments = appointments.map(apt => 
              apt.client === editingClient.originalName 
              ? { ...apt, client: editingClient.name, phone: editingClient.phone } 
              : apt
          );
          setAppointments(updatedAppointments);
          setEditingClient(null);
      }
  }

  const handleDeleteClient = (clientName: string) => {
      if (confirm(`Tem certeza que deseja excluir o cliente ${clientName}? Esta ação removerá TODO o histórico de agendamentos deste cliente e não pode ser desfeita.`)) {
          setAppointments(prev => prev.filter(a => a.client !== clientName));
          if (editingClient?.originalName === clientName) {
              setEditingClient(null);
          }
      }
  }

  // --- Sub-Views Render Functions ---

  const renderHomeView = () => {
      // FIX: Use consistent and reliable date formatting.
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const today = `${day}/${month}`;
      // FIX: Use strict equality `===` instead of `includes` for accurate date matching.
      const todaysAppointments = appointments.filter(a => a.date === today || a.date === 'Hoje');
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmado');
      const income = confirmedAppointments.reduce((acc, apt) => {
        const service = services.find(s => s.name === apt.service);
        return acc + (service ? service.price : 0);
      }, 0);
      const pendingAppointments = appointments.filter(a => a.status === 'pendente');
      const schedulingUrl = businessProfile.schedulingUrl || `${window.location.origin}?store=${currentUser.id}`;

      return (
          <div className="space-y-6 animate-fade-in-up pb-24 px-4 pt-4">
              <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Olá, {currentUser.name.split(' ')[0]}! 👋</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gerencie seu negócio</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                          onClick={toggleTheme}
                          className="p-2 bg-white dark:bg-[#0a0a0a] shadow-sm rounded-full text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                      >
                          {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      </button>
                      
                      <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 bg-white dark:bg-[#0a0a0a] rounded-full text-gray-600 dark:text-gray-300 shadow-sm relative border border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-colors"
                        >
                            <Bell size={20} />
                            {pendingAppointments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {pendingAppointments.length}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in-up z-50">
                                <div className="p-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between items-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Solicitações Pendentes</p>
                                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {pendingAppointments.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                                            <CheckCircle size={32} className="text-gray-300"/>
                                            Tudo em dia! Nenhuma solicitação pendente.
                                        </div>
                                    ) : (
                                        pendingAppointments.map(apt => (
                                            <div key={apt.id} className="p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">{apt.client}</p>
                                                        <p className="text-xs text-gray-500">{apt.service}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">{apt.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                                    <Calendar size={12}/> {apt.date}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleStatusChange(apt.id, 'confirmado')} 
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Check size={14} /> Confirmar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(apt.id, 'cancelado')} 
                                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <X size={14} /> Recusar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-2xl border border-primary/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setActiveTab('agenda')}>
                      <Calendar size={28} className="text-primary mb-2" />
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">{todaysAppointments.length}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Agendamentos Hoje</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" onClick={() => setActiveTab('financeiro')}>
                      <DollarSign size={28} className="text-green-600 dark:text-green-400 mb-2" />
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">R$ {income.toFixed(0)}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Faturamento Total</span>
                  </div>
              </div>
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <h3 className="font-bold text-lg mb-1">Seu Link de Agendamento</h3>
                      <p className="text-sm text-gray-300 mb-4">Este é seu link exclusivo. Compartilhe com seus clientes!</p>
                      <div className="flex gap-2">
                          <input type="text" readOnly value={schedulingUrl} className="w-full bg-gray-700/50 text-white text-xs rounded-lg px-3 py-2 border border-gray-600/50 focus:outline-none truncate" />
                          <button onClick={handleCopyLink} className={`w-auto px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${linkCopied ? 'bg-green-600 text-white' : 'bg-primary text-white hover:bg-primary-hover'}`}>
                             {linkCopied ? <Check size={16} /> : <LinkIcon size={16} />}
                             {linkCopied ? 'COPIADO' : 'COPIAR'}
                         </button>
                      </div>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12 pointer-events-none">
                      <QrCode size={140} />
                  </div>
              </div>
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">Acesso Rápido</h3>
                  <div className="grid grid-cols-4 gap-2">
                       <button onClick={() => { setProfileView('servicos'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600"><Briefcase size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Serviços</span>
                       </button>
                       <button onClick={() => { setProfileView('profissionais'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600"><Users size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Equipe</span>
                       </button>
                       <button onClick={() => { setProfileView('horarios'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600"><Clock size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Horários</span>
                       </button>
                       <button onClick={() => { setProfileView('aparencia'); setActiveTab('perfil'); }} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all">
                           <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center text-pink-600"><Palette size={18}/></div>
                           <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Tema</span>
                       </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderAgendaView = () => {
    const handleEditChange = (field: keyof Appointment, value: any) => {
        if (editingAppointment) {
            setEditingAppointment({ ...editingAppointment, [field]: value });
        }
    };

    const handleSaveAppointment = () => {
        if (editingAppointment) {
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? editingAppointment : a));
            setEditingAppointment(null);
        }
    };

    const handleAddNew = () => {
        const newApt: Appointment = { 
            id: Date.now().toString(), client: '', service: services[0]?.name || '', 
            time: '09:00', status: 'confirmado', date: 'Hoje', phone: '',
            professional: professionals.length > 0 ? professionals[0].name : undefined
        };
        setAppointments([newApt, ...appointments]);
        setEditingAppointment(newApt);
    };

    const activeAppointments = appointments.filter(a => a.status !== 'cancelado');

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 px-4 pt-4">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setActiveTab('inicio')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agenda</h2>
            </div>
            <button onClick={handleAddNew} className="w-full py-3 bg-white dark:bg-[#0a0a0a] border-2 border-dashed border-gray-300 dark:border-white/10 text-gray-400 rounded-xl font-bold text-sm mb-4 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Plus size={18} /> Novo Agendamento
            </button>
            {activeAppointments.length === 0 && <p className="text-gray-500 text-center py-10">Sua agenda está vazia.</p>}
            {activeAppointments.map((apt) => {
                const isEditing = editingAppointment?.id === apt.id;
                const dataToDisplay = isEditing ? editingAppointment! : apt;
                
                return (
                    <div key={apt.id} className={`bg-white dark:bg-[#0a0a0a] rounded-xl border-l-4 border-primary shadow-sm overflow-hidden transition-all dark:border-r dark:border-y dark:border-r-white/5 dark:border-y-white/5 ${isEditing ? 'ring-2 ring-primary' : ''}`}>
                        {isEditing ? (
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-primary text-sm uppercase">Editando Agendamento</h3>
                                    <button onClick={() => setEditingAppointment(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18}/></button>
                                </div>
                                <div className="space-y-3">
                                    <input type="text" value={dataToDisplay.client} onChange={e => handleEditChange('client', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Nome Cliente" />
                                    <input type="text" value={dataToDisplay.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="WhatsApp" />
                                    <select value={dataToDisplay.service} onChange={e => handleEditChange('service', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm">
                                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                    <select value={dataToDisplay.professional} onChange={e => handleEditChange('professional', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm">
                                        <option value="">Selecione Profissional</option>
                                        {professionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input type="text" value={dataToDisplay.date} onChange={e => handleEditChange('date', e.target.value)} className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Data" />
                                        <input type="text" value={dataToDisplay.time} onChange={e => handleEditChange('time', e.target.value)} className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm" placeholder="Hora" />
                                    </div>
                                    <button onClick={handleSaveAppointment} className="w-full bg-primary text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1" onClick={() => setEditingAppointment(apt)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{apt.time}</span>
                                            <span className="text-xs text-gray-400 ml-1">({apt.date})</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{apt.client}</h3>
                                        <p className="text-xs text-gray-500">{apt.service} {apt.professional ? `• ${apt.professional}` : ''}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{apt.status}</div>
                                        <button onClick={() => setEditingAppointment(apt)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary"><Edit2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-2">
                                    {apt.status !== 'confirmado' && <button onClick={() => handleStatusChange(apt.id, 'confirmado')} className="text-green-600 text-xs font-bold px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">CONFIRMAR</button>}
                                    <button onClick={() => handleStatusChange(apt.id, 'cancelado')} className="text-red-600 text-xs font-bold px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100">CANCELAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  const renderClientsView = () => {
    const clientMap = new Map<string, { name: string; phone: string; visits: number; lastVisit: string }>();
    appointments.forEach(apt => {
        if (!clientMap.has(apt.client)) {
            clientMap.set(apt.client, { name: apt.client, phone: apt.phone || '', visits: 0, lastVisit: apt.date });
        }
        const client = clientMap.get(apt.client)!;
        client.visits += 1;
        if (apt.date > client.lastVisit) client.lastVisit = apt.date;
    });
    const clients = Array.from(clientMap.values());

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 px-4 pt-4">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setActiveTab('inicio')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Meus Clientes</h2>
            </div>
            {editingClient && (
                 <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-primary">Editar Cliente</h3>
                        <button onClick={() => setEditingClient(null)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                            <input type="text" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
                            <input type="text" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleDeleteClient(editingClient.originalName)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Excluir Cliente"><Trash2 size={20} /></button>
                             <button onClick={handleSaveClient} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar Alterações</button>
                        </div>
                        <p className="text-xs text-red-400 text-center">Nota: Isso atualizará o nome em todos os agendamentos.</p>
                    </div>
                </div>
            )}
            {clients.length === 0 && (<div className="text-center py-10 text-gray-500">Nenhum cliente registrado ainda.</div>)}
            <div className="space-y-3">
                {clients.map((client, index) => (
                    <div key={index} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">{client.name.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate">{client.name}</h3>
                                {client.phone && (<div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12} /> {client.phone}</div>)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                 <div className="flex items-center justify-end gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg mb-1"><History size={12} /> {client.visits} visitas</div>
                                 <p className="text-[10px] text-gray-400">Última: {client.lastVisit}</p>
                            </div>
                            <button onClick={() => setEditingClient({ originalName: client.name, name: client.name, phone: client.phone })} className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteClient(client.name)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderFinancesView = () => {
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmado');
    const financialTransactions = confirmedAppointments.map(apt => {
        const service = services.find(s => s.name === apt.service);
        return { id: apt.id, title: `${apt.service} - ${apt.client}`, type: 'income' as const, amount: service ? service.price : 0, date: `${apt.date} às ${apt.time}` };
    });
    const totalIncome = financialTransactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="space-y-6 pb-24 px-4 pt-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('inicio')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
            </div>
            <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-white/5">
                 <div className="relative z-10">
                     <p className="text-green-400 text-sm font-medium mb-1">Faturamento Total (Confirmado)</p>
                     <p className="text-4xl font-bold">R$ {totalIncome.toFixed(2)}</p>
                 </div>
                 <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={100} />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Detalhes do Faturamento</h3>
                {financialTransactions.length === 0 ? (<div className="text-center py-10 text-gray-500">Nenhuma entrada registrada. Agendamentos confirmados aparecerão aqui.</div>) : (
                    <div className="space-y-3">
                        {financialTransactions.map(t => (
                            <div key={t.id} className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600"><DollarSign size={20} /></div>
                                    <div className="min-w-0"><p className="font-bold text-gray-800 dark:text-white truncate">{t.title}</p><p className="text-xs text-gray-500">{t.date}</p></div>
                                </div>
                                <span className="font-bold whitespace-nowrap text-green-600 pl-2">+ R$ {t.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderProfileView = () => {
    const renderHeaderBack = (title: string) => (
        <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setProfileView('menu')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
    );

    if (profileView === 'menu') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setActiveTab('inicio')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Perfil e Configurações</h2>
                </div>
                <div className="mb-6">
                    <button onClick={onViewAsClient} className="w-full bg-gradient-to-r from-primary to-yellow-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform"><ShoppingBag size={24} /></div>
                            <div className="text-left"><p className="font-bold text-lg">Minha Loja Online</p><p className="text-xs text-white/80">Toque para visualizar como cliente</p></div>
                        </div>
                        <ChevronRight className="text-white/80" />
                    </button>
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 px-2">Configurações Gerais</p>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5">
                    {/* Meus Dados */}
                    <div onClick={() => setProfileView('meus_dados')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <User size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Meus Dados</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Horários */}
                    <div onClick={() => setProfileView('horarios')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Clock size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Horários</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Aparência */}
                    <div onClick={() => setProfileView('aparencia')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Palette size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Aparência</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Notificações */}
                    <div onClick={() => setProfileView('notificacoes')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Bell size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Notificações</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 px-2 mt-6">Gestão do Negócio</p>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5">
                    {/* Serviços */}
                    <div onClick={() => setProfileView('servicos')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Briefcase size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Serviços</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Produtos */}
                    <div onClick={() => setProfileView('produtos')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Package size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Produtos</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Profissionais */}
                    <div onClick={() => setProfileView('profissionais')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <Users size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Profissionais</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    {/* Planos */}
                    <div onClick={() => setProfileView('planos')} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <CheckCircle size={20} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 dark:text-white">Planos para Clientes</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <button onClick={onViewMyStore} className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-transparent text-gray-800 dark:text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <Eye size={20} /> Ver Minha Loja Online
                    </button>
                    <button onClick={onLogout} className="w-full border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-transparent text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut size={20} /> Sair da Conta
                    </button>
                </div>
            </div>
        );
    }
    
    if (profileView === 'meus_dados') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Dados')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-6 space-y-4 border border-gray-100 dark:border-white/5">
                    <div className="flex justify-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-primary transition-colors">
                                {profileForm.logo ? (<img src={profileForm.logo} alt="Logo" className="w-full h-full object-cover" />) : (<Camera className="text-gray-400" size={32} />)}
                            </div>
                             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-bold">Alterar</span></div>
                        </div>
                        <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                    </div>
                    <div className="space-y-4">
                        <InputField icon={Briefcase} label="Nome do Negócio" value={profileForm.name || ''} onChange={(val) => setProfileForm({...profileForm, name: val})} onBlur={handleSaveProfileData} />
                        <InputField icon={Phone} label="WhatsApp (para agendamentos)" placeholder="(00) 00000-0000" value={profileForm.whatsapp || ''} onChange={(val) => setProfileForm({...profileForm, whatsapp: val})} onBlur={handleSaveProfileData} />
                        <InputField icon={QrCode} label="Chave PIX (para sinal)" placeholder="CPF, e-mail, telefone..." value={profileForm.pixKey || ''} onChange={(val) => setProfileForm({...profileForm, pixKey: val})} onBlur={handleSaveProfileData} />
                        <InputField icon={MapPin} label="Endereço" placeholder="Rua, Número, Bairro" value={profileForm.address || ''} onChange={(val) => setProfileForm({...profileForm, address: val})} onBlur={handleSaveProfileData} />
                        <InputField icon={LinkIcon} label="URL de Agendamento (Opcional)" placeholder="https://seusite.com/agendar" value={profileForm.schedulingUrl || ''} onChange={(val) => setProfileForm({...profileForm, schedulingUrl: val})} onBlur={handleSaveProfileData} />
                    </div>
                     <div className="mt-6">
                        <label className="text-xs font-bold text-gray-500 uppercase">Imagem de Fundo da Loja</label>
                        <div className="mt-1 group relative w-full h-32 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-primary transition-colors">
                            {profileForm.backgroundImage ? (
                                <>
                                    <img src={profileForm.backgroundImage} alt="Fundo" className="w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => bgInputRef.current?.click()} className="text-white text-xs font-bold bg-black/50 py-1 px-3 rounded-full hover:bg-black/70">Alterar</button>
                                        <button onClick={() => onUpdateProfile({ backgroundImage: null })} className="ml-2 p-2 text-white bg-red-500/80 rounded-full hover:bg-red-600"><Trash2 size={14} /></button>
                                    </div>
                                </>
                            ) : (
                                <div onClick={() => bgInputRef.current?.click()} className="text-center text-gray-400 cursor-pointer">
                                    <ImageIcon className="mx-auto" size={32} />
                                    <span className="text-xs font-semibold mt-1 block">Adicionar Imagem</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={bgInputRef} onChange={handleBgChange} accept="image/*" className="hidden" />
                    </div>
                </div>
            </div>
        );
    }
    
if (profileView === 'servicos') {
    const handleServiceFieldChange = (field: keyof Service, value: string | number) => {
        if (editingService) {
            setEditingService({ ...editingService, [field]: value });
        }
    };

    return (
        <div className="pb-24 pt-6 px-4 animate-fade-in-up">
            {renderHeaderBack('Meus Serviços')}
            <button 
                onClick={() => setEditingService({ 
                    id: Date.now().toString(), name: '', description: '', price: 0, 
                    duration: 30, deposit: 0 
                })} 
                className="w-full py-3 bg-primary/10 text-primary rounded-xl border-2 border-dashed border-primary/30 font-bold flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors"
            >
                <Plus size={20} /> Adicionar Serviço
            </button>
            {editingService && (
                <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-primary">{services.some(s => s.id === editingService.id) ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                        <button onClick={() => setEditingService(null)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome do Serviço" value={editingService.name} onChange={e => handleServiceFieldChange('name', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-sm" />
                        <textarea placeholder="Descrição" value={editingService.description} onChange={e => handleServiceFieldChange('description', e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-sm h-20 resize-none" />
                        <div className="grid grid-cols-2 gap-3">
                             <input type="number" placeholder="Preço (R$)" value={editingService.price} onChange={e => handleServiceFieldChange('price', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-sm" />
                             <input type="number" placeholder="Duração (min)" value={editingService.duration} onChange={e => handleServiceFieldChange('duration', parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-sm" />
                             <input type="number" placeholder="Sinal (R$)" value={editingService.deposit} onChange={e => handleServiceFieldChange('deposit', parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/10 text-sm col-span-2" />
                        </div>
                        <button onClick={handleSaveService} className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
                            <Save size={16}/> Salvar Serviço
                        </button>
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {services.map(service => (
                    <div key={service.id} className="bg-white dark:bg-[#0a0a0a] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Briefcase size={20} className="text-gray-400" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate">{service.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{service.duration} min • {service.price > 0 ? `R$ ${service.price.toFixed(2)}` : 'A consultar'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditingService(service)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteService(service.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

    if (profileView === 'horarios') {
        const handleHourChange = (day: keyof BusinessHours, index: number, field: 'start' | 'end', value: string) => {
            const newHours = JSON.parse(JSON.stringify(profileForm.openingHours));
            newHours[day].intervals[index][field] = value;
            setProfileForm(prev => ({ ...prev, openingHours: newHours }));
        };
    
        const toggleDay = (day: keyof BusinessHours) => {
            const newHours = JSON.parse(JSON.stringify(profileForm.openingHours));
            newHours[day].isOpen = !newHours[day].isOpen;
            if (newHours[day].isOpen && newHours[day].intervals.length === 0) {
                newHours[day].intervals.push({ start: '09:00', end: '18:00' });
            }
            setProfileForm(prev => ({ ...prev, openingHours: newHours }));
            handleSaveProfileData();
        };
    
        const addInterval = (day: keyof BusinessHours) => {
            const newHours = JSON.parse(JSON.stringify(profileForm.openingHours));
            newHours[day].intervals.push({ start: '', end: '' });
            setProfileForm(prev => ({ ...prev, openingHours: newHours }));
        };
    
        const removeInterval = (day: keyof BusinessHours, index: number) => {
            const newHours = JSON.parse(JSON.stringify(profileForm.openingHours));
            newHours[day].intervals.splice(index, 1);
            setProfileForm(prev => ({ ...prev, openingHours: newHours }));
        };
        
        const daysOfWeek: { key: keyof BusinessHours, label: string }[] = [
            { key: 'sunday', label: 'Domingo' },
            { key: 'monday', label: 'Segunda-feira' },
            { key: 'tuesday', label: 'Terça-feira' },
            { key: 'wednesday', label: 'Quarta-feira' },
            { key: 'thursday', label: 'Quinta-feira' },
            { key: 'friday', label: 'Sexta-feira' },
            { key: 'saturday', label: 'Sábado' },
        ];
    
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Horários de Funcionamento')}
                <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => {
                        const daySchedule = profileForm.openingHours[key];
                        return (
                            <div key={key} className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-4 border border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-gray-800 dark:text-white">{label}</span>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleDay(key)}>
                                        <span className={`text-xs font-bold ${daySchedule.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                                            {daySchedule.isOpen ? 'Aberto' : 'Fechado'}
                                        </span>
                                        <div className={`w-10 h-6 rounded-full flex items-center px-1 ${daySchedule.isOpen ? 'bg-primary justify-end' : 'bg-gray-200 dark:bg-white/10 justify-start'}`}>
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>
                                {daySchedule.isOpen && (
                                    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                        {daySchedule.intervals.map((interval, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={interval.start}
                                                    onChange={(e) => handleHourChange(key, index, 'start', e.target.value)}
                                                    onBlur={handleSaveProfileData}
                                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] dark:border-white/10 text-sm"
                                                />
                                                <span className="text-gray-400 text-sm">às</span>
                                                <input
                                                    type="time"
                                                    value={interval.end}
                                                    onChange={(e) => handleHourChange(key, index, 'end', e.target.value)}
                                                    onBlur={handleSaveProfileData}
                                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-[#111] dark:border-white/10 text-sm"
                                                />
                                                <button onClick={() => removeInterval(key, index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => addInterval(key)} className="w-full mt-2 text-primary text-sm font-bold flex items-center justify-center gap-1 hover:bg-primary/10 py-2 rounded-lg transition-colors">
                                            <Plus size={16} /> Adicionar Horário
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    if (profileView === 'aparencia') {
        const handleColorChange = (colorKey: keyof BusinessProfile['colors'], value: string) => {
            const newColors = { ...profileForm.colors, [colorKey]: value };
            setProfileForm(prev => ({ ...prev, colors: newColors }));
        };

        const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
             setProfileForm(prev => ({...prev, fontFamily: e.target.value}));
        }

        const fonts = ['Inter', 'Roboto', 'Montserrat', 'Lato', 'Open Sans'];

        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Aparência da Loja')}
                 <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-white/5">
                     <h3 className="font-bold text-gray-800 dark:text-white mb-4">Cores da Marca</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Cor Principal" value={profileForm.colors.primary} onChange={e => handleColorChange('primary', e.target.value)} onBlur={handleSaveProfileData}/>
                        <ColorInput label="Cor Destaque" value={profileForm.colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} onBlur={handleSaveProfileData}/>
                        <ColorInput label="Cor do Fundo" value={profileForm.colors.background} onChange={e => handleColorChange('background', e.target.value)} onBlur={handleSaveProfileData}/>
                        <ColorInput label="Cor Títulos" value={profileForm.colors.textPrimary} onChange={e => handleColorChange('textPrimary', e.target.value)} onBlur={handleSaveProfileData}/>
                        <ColorInput label="Cor Textos" value={profileForm.colors.textSecondary} onChange={e => handleColorChange('textSecondary', e.target.value)} onBlur={handleSaveProfileData}/>
                        <ColorInput label="Cor Preços" value={profileForm.colors.listPrice} onChange={e => handleColorChange('listPrice', e.target.value)} onBlur={handleSaveProfileData}/>
                     </div>
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 mt-6">Tipografia</h3>
                      <select value={profileForm.fontFamily} onChange={handleFontChange} onBlur={handleSaveProfileData} className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary">
                          {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                      </select>
                 </div>
                 
                 <div className="mt-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-center text-sm">Pré-visualização</h3>
                    <div className="p-6 rounded-xl shadow-inner" style={{ backgroundColor: profileForm.colors.background, fontFamily: `'${profileForm.fontFamily}', sans-serif`}}>
                         <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl flex gap-4 shadow-md border border-gray-100 dark:border-white/10">
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundColor: profileForm.colors.secondary }}></div>
                            <div className="flex-1">
                                <h4 className="font-bold" style={{color: profileForm.colors.listTitle}}>Nome do Serviço</h4>
                                <p className="text-xs" style={{color: profileForm.colors.listInfo}}>Descrição de exemplo do serviço.</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-medium" style={{color: profileForm.colors.listInfo}}>30 min</span>
                                    <span className="font-bold" style={{color: profileForm.colors.listPrice}}>R$ 25,00</span>
                                </div>
                            </div>
                         </div>
                         <button className="w-full mt-4 py-3 rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: profileForm.colors.primary }}>
                             Continuar
                         </button>
                    </div>
                 </div>
            </div>
        );
    }
    
    if (profileView === 'produtos') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Meus Produtos')}
                 <div className="text-center p-8 bg-white dark:bg-dark-card rounded-xl">
                    <h3 className="font-bold text-lg">Gerenciar Produtos</h3>
                    <p className="text-sm text-gray-500 mt-2">Esta seção está em desenvolvimento.</p>
                </div>
            </div>
        );
    }
    
    if (profileView === 'profissionais') {
    return (
        <div className="pb-24 pt-6 px-4 animate-fade-in-up">
            {renderHeaderBack('Meus Profissionais')}
            <button onClick={() => setEditingProfessional({ id: Date.now().toString(), name: '', role: 'Barbeiro', avatar: '', rating: 5 })} className="w-full py-3 bg-primary/10 text-primary rounded-xl border-2 border-dashed border-primary/30 font-bold flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors">
                <Plus size={20} /> Adicionar Profissional
            </button>
            {editingProfessional && (
                <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-lg border-2 border-primary mb-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-primary">{professionals.find(p => p.id === editingProfessional.id) ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                        <button onClick={() => setEditingProfessional(null)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    <div className="space-y-3">
                         <div className="flex items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => professionalAvatarRef.current?.click()}>
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed">
                                    {editingProfessional.avatar ? <img src={editingProfessional.avatar} alt="Avatar" className="w-full h-full object-cover"/> : <Camera size={24}/>}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} className="text-white"/></div>
                            </div>
                             <input type="file" ref={professionalAvatarRef} onChange={handleProfessionalAvatarChange} accept="image/*" className="hidden" />
                            <div className="flex-1 space-y-2">
                                <input type="text" placeholder="Nome" value={editingProfessional.name} onChange={e => setEditingProfessional({...editingProfessional, name: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                                <input type="text" placeholder="Cargo" value={editingProfessional.role} onChange={e => setEditingProfessional({...editingProfessional, role: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:border-white/10 dark:text-white" />
                            </div>
                         </div>
                        <button onClick={handleSaveProfessional} className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-hover transition-colors">Salvar</button>
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {professionals.map(pro => (
                    <div key={pro.id} className="bg-white dark:bg-[#0a0a0a] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={pro.avatar} alt={pro.name} className="w-12 h-12 rounded-full object-cover"/>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">{pro.name}</h4>
                                <p className="text-xs text-gray-500">{pro.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleCopyProfessionalLink(pro.id)} className={`p-2 rounded-lg transition-colors ${copiedProfId === pro.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-primary'}`}>
                                {copiedProfId === pro.id ? <Check size={16} /> : <LinkIcon size={16} />}
                            </button>
                            <button onClick={() => setEditingProfessional(pro)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-500 hover:text-primary transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteProfessional(pro.id)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

    if (profileView === 'planos') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Planos para Clientes')}
                <div className="text-center p-8 bg-white dark:bg-dark-card rounded-xl">
                    <h3 className="font-bold text-lg">Gerenciar Planos</h3>
                    <p className="text-sm text-gray-500 mt-2">Esta seção está em desenvolvimento.</p>
                </div>
            </div>
        );
    }
    
    if (profileView === 'notificacoes') {
        return (
            <div className="pb-24 pt-6 px-4 animate-fade-in-up">
                {renderHeaderBack('Notificações')}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-4 border border-gray-100 dark:border-white/5">
                    <p className="font-bold text-gray-800 dark:text-white mb-2">Sons do App</p>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Som do Assistente Virtual</p>
                            <p className="text-xs text-gray-500">Tocar um sino ao receber resposta.</p>
                        </div>
                        <button
                            onClick={() => onUpdateProfile({ notificationSound: !businessProfile.notificationSound })}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                                businessProfile.notificationSound ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'
                            }`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                    businessProfile.notificationSound ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <div></div>
  };

  const InputField = ({ icon: Icon, label, ...props }: any) => (
    <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
        <div className="relative mt-1">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input {...props} className="w-full p-3 pl-10 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 text-gray-900 dark:bg-[#111] dark:text-white focus:outline-none focus:border-primary" />
        </div>
    </div>
  );

  const ColorInput = ({ label, value, ...props }: any) => (
    <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
        <div className="flex items-center gap-2 border border-gray-200 dark:border-white/10 rounded-lg p-1 bg-gray-50 dark:bg-[#111]">
            <input type="color" value={value || '#000000'} {...props} className="w-8 h-8 rounded shrink-0 cursor-pointer appearance-none bg-transparent border-none" style={{'WebkitAppearance': 'none'}} />
            <input type="text" value={value || ''} {...props} className="w-full bg-transparent outline-none text-sm font-mono text-gray-700 dark:text-gray-300" />
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans pb-20 transition-colors">
      <main>
          {activeTab === 'inicio' && renderHomeView()}
          {activeTab === 'agenda' && renderAgendaView()}
          {activeTab === 'clientes' && renderClientsView()}
          {activeTab === 'financeiro' && renderFinancesView()}
          {activeTab === 'perfil' && renderProfileView()}
      </main>
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/5 pb-safe px-6 py-3 flex justify-around items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'inicio' ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
             <Home size={22} strokeWidth={activeTab === 'inicio' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Início</span>
         </button>
          <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'agenda' ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
             <Calendar size={22} strokeWidth={activeTab === 'agenda' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Agenda</span>
         </button>
          <button onClick={() => setActiveTab('clientes')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'clientes' ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
             <Users size={22} strokeWidth={activeTab === 'clientes' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Clientes</span>
         </button>
          <button onClick={() => setActiveTab('financeiro')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'financeiro' ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
             <DollarSign size={22} strokeWidth={activeTab === 'financeiro' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Financeiro</span>
         </button>
         <button onClick={() => setActiveTab('perfil')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'perfil' ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
             <User size={22} strokeWidth={activeTab === 'perfil' ? 2.5 : 2} />
             <span className="text-[10px] font-bold">Perfil</span>
         </button>
      </nav>

      {isDirty && (
        <div className="fixed bottom-24 right-4 z-50 animate-fade-in-up">
            <button
                onClick={handleSaveClick}
                disabled={isSaving || showSuccess}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                    showSuccess ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {isSaving ? (<Loader2 className="animate-spin" size={20} />) 
                : showSuccess ? (<CheckCircle size={20} />) 
                : (<Save size={20} />)}
                <span className="text-sm">
                    {isSaving ? 'Salvando...' : showSuccess ? 'Salvo!' : 'Salvar Alterações'}
                </span>
            </button>
        </div>
      )}
    </div>
  );
};