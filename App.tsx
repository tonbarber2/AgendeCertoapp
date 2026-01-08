
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Theme, BusinessProfile, Appointment, Professional, Service, AdminUser, Product, ClientPlan, ServiceCategory } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { BookingFlow } from './components/BookingFlow';
import { AIReceptionist } from './components/AIReceptionist';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { db } from './services/db';
import { DEFAULT_BUSINESS_HOURS } from './constants';

// Interface para agrupar todos os dados salváveis
interface AppData {
  profile: BusinessProfile;
  appointments: Appointment[];
  professionals: Professional[];
  services: Service[];
  products: Product[];
  clientPlans: ClientPlan[];
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('AUTH');
  const [theme, setTheme] = useState<Theme>('light');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Store ID Management for Public Views
  const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

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
  
  // State to track unsaved changes
  const [initialData, setInitialData] = useState<AppData | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const storeIdFromUrl = params.get('store');
        const professionalIdFromUrl = params.get('professionalId');

        if (storeIdFromUrl) {
          // Public client view flow
          setView('LANDING');
          setPublicStoreId(storeIdFromUrl);
          setCurrentUser(null);
          const data = await db.loadPublicData(storeIdFromUrl);

          if (data) {
            setBusinessProfile(data.profile);
            setAppointments(data.appointments || []);
            setProfessionals(data.professionals || []);
            setServices(data.services || []);
            setProducts(data.products || []);
            setClientPlans(data.clientPlans || []);
            setCategories([]);

            if (professionalIdFromUrl && data.professionals.some((p: Professional) => p.id === professionalIdFromUrl)) {
              setPreSelectedProId(professionalIdFromUrl);
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setBookingDate(tomorrow);
              setView('BOOKING_FLOW');
            }
          }
        }
        // If no storeIdFromUrl, the view remains 'AUTH' by default.
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    initializeApp();
  }, []);

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

  const handleSaveChanges = async () => {
    if (!currentUser || !isDataLoaded) return;
    const currentData: AppData = {
        profile: businessProfile, appointments, professionals,
        services, products, clientPlans
    };
    await db.saveData(currentUser.id, currentData);
    setInitialData(currentData); // Update baseline to new saved state
  };
  
  const isDirty = useMemo(() => {
      if (!initialData) return false;
      const currentData: AppData = {
          profile: businessProfile, appointments, professionals,
          services, products, clientPlans
      };
      // Simple deep comparison
      return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [initialData, businessProfile, appointments, professionals, services, products, clientPlans]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStartBooking = (date: Date) => {
    setBookingDate(date);
    setView('BOOKING_FLOW');
  };

  const handleNewBooking = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment]);
    if (!currentUser) {
      const targetStoreId = publicStoreId;
      if (!targetStoreId) {
        console.error("Booking failed: No store ID found in URL.");
        alert("Ocorreu um erro: não foi possível identificar a loja para o agendamento.");
        return;
      }
      db.loadData(targetStoreId).then(async (storeData) => {
        if (storeData) {
          const updatedData = { ...storeData, appointments: [...(storeData.appointments || []), newAppointment] };
          await db.saveData(targetStoreId, updatedData);
        }
      });
    }
  };

  const updateProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({ ...prev, ...profile }));
  };
  
  // --- Navigation & Auth Handlers ---
  const handleLoginSuccess = async (user: AdminUser) => {
      setIsDataLoaded(false);
      try {
        const data = await db.loadData(user.id);
        if (data) {
           let safeProfile = data.profile;
           if (typeof safeProfile.openingHours === 'string') {
               safeProfile.openingHours = DEFAULT_BUSINESS_HOURS;
           }
           setBusinessProfile(safeProfile);
           setAppointments(data.appointments || []);
           setProfessionals(data.professionals || []);
           setServices(data.services || []);
           setProducts(data.products || []);
           setClientPlans(data.clientPlans || []);
           const initialSnapshot: AppData = {
               profile: safeProfile, appointments: data.appointments || [],
               professionals: data.professionals || [], services: data.services || [],
               products: data.products || [], clientPlans: data.clientPlans || []
           };
           setInitialData(initialSnapshot);
        }
        setCurrentUser(user);
        setView('ADMIN');
      } catch (error) {
        console.error("Failed to load user data:", error);
        setCurrentUser(null);
        setView('AUTH');
      } finally {
        setIsDataLoaded(true);
      }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setInitialData(null);
    setBusinessProfile({
      name: '', email: '', phone: '', logo: null, backgroundImage: null, pixKey: '',
      whatsapp: '', address: '', openingHours: DEFAULT_BUSINESS_HOURS, notificationSound: true,
      selectedSound: 'Padrão (Digital)', fontFamily: 'Inter', colors: {
          primary: '#D4AF37', secondary: '#F3E5AB', background: '#f9fafb',
          listTitle: '#111827', listPrice: '#D4AF37', listInfo: '#6b7280',
          textPrimary: '#111827', textSecondary: '#6b7280'
      }
    });
    setAppointments([]);
    setProfessionals([]);
    setServices([]);
    setProducts([]);
    setClientPlans([]);
    setView('AUTH');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleEnterAdmin = () => {
    if (currentUser) {
        setView('ADMIN');
        setPublicStoreId(null);
        window.history.pushState({}, '', window.location.pathname);
    } else {
        setView('AUTH');
    }
  };
  
  const handleViewMyStore = () => {
    if (currentUser) {
      setPublicStoreId(currentUser.id);
      window.history.pushState({}, '', `?store=${currentUser.id}`);
      setView('LANDING');
    }
  };

  const renderView = () => {
    if (!isDataLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (currentUser?.subscription?.status === 'expired') {
        return <SubscriptionScreen user={currentUser} onSubscriptionUpdate={setCurrentUser} onLogout={handleLogout} />;
    }

    switch(view) {
      case 'AUTH':
        return (
          <AuthScreen 
            onLoginSuccess={handleLoginSuccess} 
            toggleTheme={toggleTheme} 
            currentTheme={theme} 
          />
        );
      case 'ADMIN':
        if (!currentUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} toggleTheme={toggleTheme} currentTheme={theme} />;
        return (
          <AdminDashboard 
            onViewMyStore={handleViewMyStore}
            onViewAsClient={handleViewMyStore}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            onUpdateProfile={updateProfile}
            appointments={appointments}
            setAppointments={setAppointments}
            professionals={professionals}
            setProfessionals={setProfessionals}
            services={services}
            setServices={setServices}
            products={products}
            setProducts={setProducts}
            clientPlans={clientPlans}
            setClientPlans={setClientPlans}
            categories={categories}
            setCategories={setCategories}
            currentUser={currentUser}
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
        const isPublicClientView = !currentUser && !!publicStoreId;
        return (
          <LandingPage 
            onStartBooking={handleStartBooking}
            onGoToAdmin={handleEnterAdmin}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            isLoggedIn={!!currentUser}
            isPublicView={isPublicClientView}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {view !== 'ADMIN' && view !== 'AUTH' && (
        <AIReceptionist 
          businessProfile={businessProfile}
          services={services}
          professionals={professionals}
        />
      )}
    </>
  );
};

export default App;