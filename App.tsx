
import React, { useState, useEffect } from 'react';
import { ViewState, Theme, BusinessProfile, Appointment, Professional, Service, AdminUser, Product, ClientPlan, ServiceCategory } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { BookingFlow } from './components/BookingFlow';
import { AIReceptionist } from './components/AIReceptionist';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { db } from './services/db';
import { DEFAULT_BUSINESS_HOURS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [theme, setTheme] = useState<Theme>('light');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Store ID Management for Public Views
  const [publicStoreId, setPublicStoreId] = useState<string | null>(null);

  // Booking State
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [preSelectedProId, setPreSelectedProId] = useState<string | undefined>(undefined);
  
  // --- Data State (Now loaded from DB) ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    name: '',
    email: '',
    phone: '',
    logo: null,
    backgroundImage: null,
    pixKey: '',
    whatsapp: '',
    address: '',
    openingHours: DEFAULT_BUSINESS_HOURS,
    notificationSound: true,
    selectedSound: 'Padrão (Digital)',
    fontFamily: 'Inter',
    colors: {
        primary: '#D4AF37',   // Gold
        secondary: '#F3E5AB', // Champagne
        background: '#f9fafb',
        listTitle: '#111827',
        listPrice: '#D4AF37',
        listInfo: '#6b7280',
        textPrimary: '#111827',
        textSecondary: '#6b7280'
    }
  });

  // --- Initialization & Data Loading ---

  // Effect 1: Restore user session from localStorage on initial app load
  useEffect(() => {
    const restoreSession = async () => {
      const userId = localStorage.getItem('ac_logged_in_user_id');
      if (userId) {
        const user = await db.getUserById(userId);
        if (user) {
          // This state change triggers Effect 2 to load this user's data
          setCurrentUser(user);
        } else {
          // Clean up if the user ID is invalid or user was deleted
          localStorage.removeItem('ac_logged_in_user_id');
        }
      }
    };
    restoreSession();
  }, []); // Empty array ensures this runs only once on mount

  // Effect 2: Load data based on the current user (or public view if no user)
  useEffect(() => {
    const initData = async () => {
      try {
        let data;
        const params = new URLSearchParams(window.location.search);
        const storeIdFromUrl = params.get('store');
        const professionalIdFromUrl = params.get('professionalId');

        if (currentUser) {
          // ADMIN VIEW
          if (currentUser.subscription?.status === 'expired') {
            setView('SUBSCRIPTION');
            setIsDataLoaded(true);
            return;
          }
          setView('ADMIN');
          data = await db.loadData(currentUser.id);
        } else if (storeIdFromUrl) {
          // PUBLIC VIEW via shared link
          setView('LANDING');
          setPublicStoreId(storeIdFromUrl);
          data = await db.loadPublicData(storeIdFromUrl);
        } else {
          // DEFAULT: AUTH screen
          setView('AUTH');
          setIsDataLoaded(true);
          return;
        }

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
          setCategories([]);

          // Handle direct professional link if not logged in
          if (!currentUser && professionalIdFromUrl && data.professionals.some((p: Professional) => p.id === professionalIdFromUrl)) {
            setPreSelectedProId(professionalIdFromUrl);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setBookingDate(tomorrow);
            setView('BOOKING_FLOW');
          }
        } else if (storeIdFromUrl) {
            console.error(`No data for store: ${storeIdFromUrl}. Redirecting to Auth.`);
            setView('AUTH');
        }
      } catch (error) {
        console.error("Falha ao carregar dados:", error);
        // Fallback to Auth on any error if not logged in
        if (!currentUser) {
          setView('AUTH');
        }
      } finally {
        setIsDataLoaded(true);
      }
    };

    initData();
  }, [currentUser]);

  // Persist Data Changes (Sync with Server)
  useEffect(() => {
    // We prevent saving data until initial load is complete
    if (currentUser && isDataLoaded && currentUser.subscription?.status === 'active') {
        db.saveData(currentUser.id, {
            profile: businessProfile,
            appointments,
            professionals,
            services,
            products,
            clientPlans
        });
    }
  }, [businessProfile, appointments, professionals, services, products, clientPlans, currentUser, isDataLoaded]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply Dynamic Styles
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

  // --- Actions ---

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStartBooking = (date: Date) => {
    setBookingDate(date);
    setView('BOOKING_FLOW');
  };

  const handleNewBooking = (newAppointment: Appointment) => {
    // Optimistic UI update for the current session.
    setAppointments(prev => [...prev, newAppointment]);
    
    // If an admin is logged in, data is saved via the main useEffect hook.
    // This logic is specifically for unauthenticated clients using a public link.
    if (!currentUser) {
      const targetStoreId = publicStoreId;

      if (!targetStoreId) {
        console.error("Booking failed: No store ID found in URL. Cannot save appointment.");
        alert("Ocorreu um erro: não foi possível identificar a loja para o agendamento. Por favor, use o link fornecido pelo estabelecimento.");
        return; // Abort if the target store is unknown.
      }
      
      // Asynchronously load the specific store's data, update it, and save it back.
      db.loadData(targetStoreId).then(async (storeData) => {
        if (storeData) {
          const updatedData = {
            ...storeData,
            appointments: [...(storeData.appointments || []), newAppointment],
          };
          await db.saveData(targetStoreId, updatedData);
        } else {
          console.error(`Booking failed: Could not load data for store ID ${targetStoreId}.`);
          alert("Ocorreu um erro ao salvar seu agendamento. A loja pode não existir.");
        }
      }).catch(error => {
        console.error("Error during public booking save:", error);
        alert("Ocorreu um erro de comunicação ao salvar seu agendamento. Tente novamente.");
      });
    }
  };

  const updateProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => ({ ...prev, ...profile }));
  };

  const handleEnterAdmin = () => {
      if (currentUser) {
          setView('ADMIN');
      } else {
          setView('AUTH');
      }
  };

  const handleLoginSuccess = (user: AdminUser) => {
      localStorage.setItem('ac_logged_in_user_id', user.id);
      setCurrentUser(user); // Triggers data reload via useEffect
      setIsDataLoaded(false); // Force reload spinner
      
      // The main data loading useEffect will handle view changes
  };

  const handleLogout = () => {
      localStorage.removeItem('ac_logged_in_user_id');
      setCurrentUser(null);
      setView('AUTH');
      setIsDataLoaded(false);
  };

  const handleSubscriptionUpdate = (updatedUser: AdminUser) => {
      setCurrentUser(updatedUser);
      // The main data loading useEffect will re-evaluate and set the correct view
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
          return (
            <AuthScreen 
              onLoginSuccess={handleLoginSuccess}
              toggleTheme={toggleTheme}
              currentTheme={theme}
            />
          );
      case 'SUBSCRIPTION':
          if (!currentUser) { return null; }
          return (
              <SubscriptionScreen 
                  user={currentUser}
                  onSubscriptionUpdate={handleSubscriptionUpdate}
                  onLogout={handleLogout}
              />
          );
      case 'ADMIN':
        if (!currentUser) {
            setView('AUTH');
            return null;
        }
        if (currentUser.subscription?.status === 'expired') {
            setView('SUBSCRIPTION');
            return null;
        }
        return (
          <AdminDashboard 
            onSwitchToClient={handleLogout} 
            onViewAsClient={() => setView('LANDING')}
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
            onGoToAdmin={handleEnterAdmin}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            businessProfile={businessProfile}
            isLoggedIn={!!currentUser}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {view !== 'ADMIN' && view !== 'AUTH' && view !== 'SUBSCRIPTION' && (
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
