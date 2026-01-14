import React, { useState } from 'react';
import { Bell, Moon, Sun, Calendar } from 'lucide-react';
import { Theme, BusinessProfile, BusinessHours } from '../types';
import { Logo } from './Logo';

interface LandingPageProps {
  onStartBooking: (date: Date) => void;
  toggleTheme: () => void;
  currentTheme: Theme;
  businessProfile: BusinessProfile;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStartBooking, 
  toggleTheme,
  currentTheme,
  businessProfile,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );

  const handleContinue = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    // Create date object interpreting as local time (00:00:00) to avoid timezone shifts
    const date = new Date(year, month - 1, day); 
    onStartBooking(date);
  };

  const daysOfWeek: { key: keyof BusinessHours; label: string }[] = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
  ];
  const todayIndex = new Date().getDay();

  if (businessProfile.name === 'Loja não encontrada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#050505] text-center p-4">
        <Logo size={80} />
        <h1 className="mt-8 text-2xl font-bold text-c-text-primary dark:text-white">Loja não encontrada</h1>
        <p className="mt-2 text-c-text-secondary dark:text-gray-400">
          Parece que a URL de agendamento está incorreta ou incompleta.
        </p>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Por favor, verifique o link que você recebeu ou entre em contato com o estabelecimento.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans transition-colors relative">
      {/* Background Image (If set) */}
      {businessProfile.backgroundImage && (
        <div 
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{ 
                backgroundImage: `url(${businessProfile.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'grayscale(100%)'
            }}
        />
      )}

      {/* Header */}
      <header className="p-4 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2">
            <Logo size={40} />
         </div>
         <div className="flex items-center gap-3">
            <button className="p-3 bg-gray-200/70 dark:bg-gray-800/70 shadow-md rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-white/5 backdrop-blur-sm">
                <Bell size={20} />
            </button>
            <button 
                onClick={toggleTheme}
                className="p-3 bg-gray-200/70 dark:bg-gray-800/70 shadow-md rounded-xl text-gray-700 dark:text-gray-300 border border-transparent dark:border-white/5 backdrop-blur-sm"
            >
                {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center pt-10 pb-20 px-4 relative z-10">
        
        {/* Logo Badge (Dynamic) */}
        <div className="mb-8 relative">
            <div className="w-40 h-40 rounded-full bg-gray-900 border-4 border-secondary shadow-xl flex items-center justify-center overflow-hidden relative z-10 bg-white dark:bg-[#0a0a0a]">
                {businessProfile.logo ? (
                    <img 
                        src={businessProfile.logo} 
                        alt="Logo da Barbearia" 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // Default Brand Logo
                     <div className="flex flex-col items-center justify-center">
                        <Logo size={80} />
                     </div>
                )}
            </div>
            {/* Glow effect behind logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-secondary/20 blur-xl rounded-full -z-0"></div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-10 max-w-md">
            <h2 className="text-2xl font-bold mb-3 text-c-text-primary dark:text-white">Seja bem vindo!</h2>
            <p className="text-c-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                Que bom ter você por aqui! Logo abaixo você poderá escolher a melhor data e horário para ser atendido. Te aguardando viu!
            </p>
        </div>

        {/* Booking Card */}
        <div className="w-full max-w-sm bg-gray-800 dark:bg-[#0a0a0a] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white border border-transparent dark:border-white/5">
            {/* Card Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 border-2 border-primary flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
                    <Calendar className="text-primary" size={28} />
                </div>
                
                <h3 className="text-lg font-bold mb-6 text-center text-white">
                    Qual dia vc quer<br/>agendar?
                </h3>

                <div className="w-full mb-6">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 block text-center">
                        AGENDE AQUI
                    </label>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 text-center font-bold outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    />
                </div>

                <button 
                    onClick={handleContinue}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                    CONTINUAR
                </button>
            </div>

            {/* Background decoration for card */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-900/50 -z-0"></div>
        </div>

        {/* Business Hours */}
        <div className="w-full max-w-sm mt-10 text-center">
            <h3 className="font-bold text-c-text-primary dark:text-white mb-4">Nossos Horários</h3>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 space-y-2 text-sm">
                {daysOfWeek.map((day, index) => {
                    const daySchedule = businessProfile.openingHours[day.key as keyof BusinessHours];
                    const isToday = index === todayIndex;

                    return (
                        <div key={day.key} className={`flex justify-between items-center py-1.5 px-3 rounded-lg ${isToday ? 'bg-secondary dark:bg-primary/10' : ''}`}>
                            <span className={`font-medium ${isToday ? 'text-primary font-bold' : 'text-c-text-secondary dark:text-gray-300'}`}>
                                {day.label}
                            </span>
                            <span className={`font-semibold ${daySchedule.isOpen ? 'text-gray-800 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
                                {daySchedule.isOpen && daySchedule.intervals.length > 0
                                    ? daySchedule.intervals.map(i => `${i.start} - ${i.end}`).join(' / ') 
                                    : 'Fechado'
                                }
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};