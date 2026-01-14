import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Theme, BusinessProfile, Appointment, Professional, Service, Product, ClientPlan, ServiceCategory, AdminUser } from './types';
import { LandingPage } from './components/LandingPage';
import { BookingFlow } from './components/BookingFlow';
import { AIReceptionist } from './components/AIReceptionist';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { db } from './services/db';
import { DEFAULT_BUSINESS_HOURS } from './constants';
import { ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('AUTH');
  const [theme, setTheme] = useState<Theme>('light');
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

  // Admin State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Booking State
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [preSelectedProId, setPreSelectedProId] = useState<string | undefined>(undefined);

  // --- Data State ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '', email: '', phone: '', logo: null, backgroundImage: null, pixKey: '',
    whatsapp: '', address: '', openingHours: DEFAULT_BUSINESS_HOURS, notificationSound: true,
    selectedSound: 'Padrão (Digital)', fontFamily: 'Inter', colors: {
        primary: '#D4AF37', secondary: '#F3E5AB', background: '#f9fafb',
        listTitle: '#111827', listPrice: '#D4AF37', listInfo: '#6b7280',
        textPrimary: '#111827', textSecondary: '#6b7280'
    }
  });

  const loadAdminData = useCallback(async (userId: string) => {
    const data = await db.loadData(userId);
    setBusinessProfile(data.profile);
    setAppointments(data.appointments || []);
    setProfessionals(data.professionals || []);
    setServices(data.services || []);
    setProducts(data.products || []);
    setClientPlans(data.clientPlans || []);
    setCategories([]);
    setIsDirty(false);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      setIsDataLoaded(false);
      try {
        const params = new URLSearchParams(window.location.search);
        const storeIdFromUrl = params.get('store');
        
        if (storeIdFromUrl) {
          // Public client view
          setPublicStoreId(storeIdFromUrl);
          const data = await db.loadPublicData(storeIdFromUrl);
          if (data && data.profile.name !== 'Loja não encontrada') {
            setBusinessProfile(data.profile);
            setAppointments(data.appointments || []);
            setProfessionals(data.professionals || []);
            setServices(data.services || []);
            setProducts(data.products || []);
            setClientPlans(data.clientPlans || []);
            setView('LANDING');
          } else {
             setBusinessProfile({ ...businessProfile, name: 'Loja não encontrada' });
             setView('LANDING');
          }
        } else {
          // Admin view
          const adminUserId = localStorage.getItem('adminUserId');
          if (adminUserId) {
            const user = await db.getUserById(adminUserId);
            if (user) {
              setCurrentUser(user);
              await loadAdminData(user.id);
              if (user.subscription.status === 'expired') {
                setView('SUBSCRIPTION');
              } else {
                setView('ADMIN');
              }
            } else {
              setView('AUTH');
            }
          } else {
            setView('AUTH');
          }
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setView('AUTH');
      } finally {
        setIsDataLoaded(true);
      }
    };
    initializeApp();
  }, [loadAdminData]);
  
  const handleLoginSuccess = async (user: AdminUser) => {
    setCurrentUser(user);
    localStorage.setItem('adminUserId', user.id);
    await loadAdminData(user.id);
    if (user.subscription.status === 'expired') {
      setView('SUBSCRIPTION');
    } else {
      setView('ADMIN');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('adminUserId');
    setView('AUTH');
  };

  const handleSubscriptionUpdate = (updatedUser: AdminUser) => {
    setCurrentUser(updatedUser);
    if(updatedUser.subscription.status === 'active') {
        setView('ADMIN');
    }
  };

  const handleUpdateProfile = (profileUpdate: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({ ...prev, ...profileUpdate }));
    setIsDirty(true);
  };
  
  const createDirtySetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: React.SetStateAction<T>) => {
      setter(value);
      setIsDirty(true);
    };
  };

  const handleSaveChanges = async () => {
    if (currentUser && isDirty) {
      await db.saveData(currentUser.id, {
        profile: businessProfile,
        appointments,
        professionals,
        services,
        products,
        clientPlans,
      });
      setIsDirty(false);
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', businessProfile.colors.primary);
    root.style.setProperty('--color-primary-hover', businessProfile.colors.primary); 
    root.style.setProperty('--color-secondary', businessProfile.colors.secondary);
    root.style.setProperty('--color-text-primary', businessProfile.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', businessProfile.colors.textSecondary);
    root.style.setProperty('--color-list-title', businessProfile.colors.listTitle);
    root.style.setProperty('--color-list-price', businessProfile.colors.listPrice);
    root.style.setProperty('--color-list-info', businessProfile.colors.listInfo);
    document.body.style.fontFamily = `'${businessProfile.fontFamily}', sans-serif`;

    if (theme === 'light') {
      document.body.style.backgroundColor = businessProfile.colors.background;
    } else {
      document.body.style.backgroundColor = ''; 
    }
  }, [businessProfile.colors, businessProfile.fontFamily, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStartBooking = (date: Date) => {
    setBookingDate(date);
    setView('BOOKING_FLOW');
  };

  const handleNewBooking = (newAppointment: Appointment) => {
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    const targetStoreId = publicStoreId || currentUser?.id;
    if (!targetStoreId) {
      console.error("Booking failed: No store ID found.");
      alert("Ocorreu um erro: não foi possível identificar a loja.");
      return;
    }
    db.saveData(targetStoreId, { 
      profile: businessProfile, 
      appointments: updatedAppointments, 
      professionals, 
      services,
      products,
      clientPlans
    });
  };
  
  const renderView = () => {
    if (!isDataLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    switch(view) {
      case 'AUTH':
        return <AuthScreen onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} currentTheme={theme} />;
      case 'SUBSCRIPTION':
        if (!currentUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} currentTheme={theme} />;
        return <SubscriptionScreen user={currentUser} onSubscriptionUpdate={handleSubscriptionUpdate} onLogout={handleLogout} />;
      case 'ADMIN':
        if (!currentUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} currentTheme={theme} />;
        return (
          <AdminDashboard 
            currentUser={currentUser}
            onViewMyStore={() => window.open(businessProfile.schedulingUrl || `/?store=${currentUser.id}`, '_blank')}
            onViewAsClient={() => setView('LANDING')}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            onUpdateProfile={handleUpdateProfile}
            appointments={appointments}
            setAppointments={createDirtySetter(setAppointments)}
            professionals={professionals}
            setProfessionals={createDirtySetter(setProfessionals)}
            services={services}
            setServices={createDirtySetter(setServices)}
            products={products}
            setProducts={createDirtySetter(setProducts)}
            clientPlans={clientPlans}
            setClientPlans={createDirtySetter(setClientPlans)}
            categories={categories}
            setCategories={createDirtySetter(setCategories)}
            onSaveChanges={handleSaveChanges}
            isDirty={isDirty}
            onLogout={handleLogout}
          />
        );
      case 'BOOKING_FLOW':
        return (
          <BookingFlow 
            initialDate={bookingDate}
            onBackToLanding={() => setView('LANDING')}
            onConfirmBooking={handleNewBooking}
            professionals={professionals}
            services={services}
            preSelectedProId={preSelectedProId}
            pixKey={businessProfile.pixKey}
            adminPhone={businessProfile.whatsapp}
            appointments={appointments}
            businessHours={businessProfile.openingHours}
          />
        );
      case 'LANDING':
      default:
        return (
          <LandingPage 
            onStartBooking={handleStartBooking}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      
      {/* Show AI Assistant only in client views and if store exists */}
      {(view === 'LANDING' || view === 'BOOKING_FLOW') && businessProfile.name !== 'Loja não encontrada' && (
        <AIReceptionist 
          businessProfile={businessProfile}
          services={services}
          professionals={professionals}
        />
      )}

      {/* "Back to Admin" button for admins viewing their client page */}
      {view === 'LANDING' && currentUser && !publicStoreId && (
         <button
          onClick={() => setView('ADMIN')}
          className="fixed bottom-4 left-4 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-hover transition-all z-50 flex items-center gap-2 text-sm font-bold"
          aria-label="Voltar ao Painel"
        >
          <ArrowLeft size={16} />
          Voltar ao Painel
        </button>
      )}
    </>
  );
};

export default App;