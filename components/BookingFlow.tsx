
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Star,
  Copy,
  Upload,
  CreditCard,
  Banknote,
  AlertCircle
} from 'lucide-react';
import { 
  getNextDays 
} from '../constants';
import { 
  Service, 
  Professional, 
  BookingStep, 
  DayOption, 
  UserDetails,
  Appointment,
  BusinessHours,
  DaySchedule
} from '../types';

interface BookingFlowProps {
  initialDate?: Date;
  onBackToLanding: () => void;
  onConfirmBooking: (appointment: Appointment) => void;
  professionals: Professional[];
  services: Service[];
  preSelectedProId?: string;
  pixKey?: string;
  adminPhone?: string;
  appointments: Appointment[];
  businessHours: BusinessHours;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ 
  initialDate, 
  onBackToLanding, 
  onConfirmBooking,
  professionals,
  services,
  preSelectedProId,
  pixKey = "000.000.000-00", // Default fallback
  adminPhone,
  appointments,
  businessHours
}) => {
  // Helpers
  const dayOptions = getNextDays(14);
  
  // State
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Initialize professional based on preSelectedProId from link
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(() => {
    if (preSelectedProId) {
      return professionals.find(p => p.id === preSelectedProId) || null;
    }
    return null;
  });
  
  // Find the DayOption that matches initialDate or default to first available
  const initialDayOption = initialDate 
    ? dayOptions.find(d => d.date.toDateString() === initialDate.toDateString()) || dayOptions[0]
    : dayOptions[0];

  const [selectedDate, setSelectedDate] = useState<DayOption>(initialDayOption);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', phone: '', notes: '' });

  // Payment State
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');

  const isStepValid = () => {
    switch(step) {
      case BookingStep.SERVICE: return !!selectedService;
      case BookingStep.DATETIME: return !!selectedDate && !!selectedTime;
      case BookingStep.DETAILS: return !!userDetails.name && userDetails.phone.length >= 10;
      default: return true; // Payment step is now always valid
    }
  };

  const finalizeBooking = (withPayment: boolean) => {
    if (!selectedService || !selectedTime || !selectedDate) return;

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      client: userDetails.name,
      service: selectedService.name,
      time: selectedTime,
      date: selectedDate.displayDate,
      status: 'pendente',
      phone: userDetails.phone,
      professional: selectedProfessional ? selectedProfessional.name : undefined
    };

    const adminPhoneClean = adminPhone?.replace(/\D/g, '') || '';

    const messageParts = [
      `Olá! Gostaria de confirmar meu agendamento:`,
      `📅 *Data:* ${selectedDate.displayDate}`,
      `⏰ *Horário:* ${selectedTime}`,
      `✂️ *Serviço:* ${selectedService.name}`,
    ];

    if (selectedProfessional) {
      messageParts.push(`👤 *Profissional:* ${selectedProfessional.name}`);
    }
    
    messageParts.push(`*Cliente:* ${userDetails.name}`);

    if (withPayment) {
      const amountPaid = paymentType === 'deposit' ? selectedService?.deposit : selectedService?.price;
      messageParts.push(`💰 *Valor a Pagar (PIX):* R$ ${amountPaid?.toFixed(2)}`);
      messageParts.push(`\n*Vou realizar o pagamento e enviar o comprovante aqui.*`);
    } else {
       if (selectedService.price <= 0) {
            messageParts.push(`\nEste é um serviço VIP e não possui custo. Aguardo a confirmação do profissional.`);
       } else {
            messageParts.push(`\nEste serviço não requer pagamento de sinal. O valor de R$ ${selectedService.price.toFixed(2)} será pago no local.`);
       }
    }

    const message = messageParts.join('\n');

    const whatsappUrl = `https://wa.me/55${adminPhoneClean}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    onConfirmBooking(newAppointment);
    setStep(BookingStep.CONFIRMATION);
    window.scrollTo(0, 0);
  };


  const handleNext = () => {
    if (!isStepValid()) return;

    if (step === BookingStep.PAYMENT) {
      finalizeBooking(true);
      return;
    }

    if (step === BookingStep.DETAILS && (!selectedService || selectedService.price <= 0)) {
       finalizeBooking(false);
       return;
    }

    let nextStep = step + 1;

    if (step === BookingStep.SERVICE) {
      nextStep = BookingStep.DATETIME; // Always skip to DateTime
    }

    setStep(nextStep as BookingStep);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    let prevStep = step - 1;

    if (step === BookingStep.DATETIME) {
      prevStep = BookingStep.SERVICE; // Always go back to Service
    }

    if (prevStep >= 1) {
        setStep(prevStep as BookingStep);
    } else {
        onBackToLanding();
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey).then(() => {
        alert("Chave PIX copiada com sucesso!");
    }).catch(() => {
        alert("Erro ao copiar. Tente selecionar manualmente.");
    });
  };

  // Helper function to generate time slots based on business hours
  const generateTimeSlotsForDay = (daySchedule: DaySchedule, slotIncrement: number = 30): string[] => {
    if (!daySchedule || !daySchedule.isOpen) {
      return [];
    }

    const slots: string[] = [];
    
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const formatTime = (date: Date): string => {
      return date.toTimeString().slice(0, 5);
    };

    daySchedule.intervals.forEach(interval => {
      let currentTime = parseTime(interval.start);
      const endTime = parseTime(interval.end);

      while (currentTime < endTime) {
        slots.push(formatTime(currentTime));
        currentTime.setMinutes(currentTime.getMinutes() + slotIncrement);
      }
    });

    return slots;
  };

  // Logic to calculate available time slots based on business hours and existing appointments
  const getAvailableAndAllSlots = () => {
    const dayIndex = selectedDate.date.getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex] as keyof BusinessHours;
    const daySchedule = businessHours[dayName];
    
    const allPossibleSlots = generateTimeSlotsForDay(daySchedule);

    // Total capacity is the number of professionals, or 1 if none are registered.
    const capacity = professionals.length > 0 ? professionals.length : 1;

    const available = allPossibleSlots.filter(time => {
      // Find all confirmed/pending appointments at this specific time and date
      const appointmentsAtTime = appointments.filter(apt => 
          apt.date === selectedDate.displayDate &&
          apt.time === time &&
          apt.status !== 'cancelado'
      );

      // If a specific professional is selected...
      if (selectedProfessional) {
          // ... the slot is taken only if THAT professional has an appointment.
          const isProfessionalBusy = appointmentsAtTime.some(apt => apt.professional === selectedProfessional.name);
          return !isProfessionalBusy;
      } else {
          // If no professional is selected, the slot is available if the number of appointments is less than the total capacity.
          return appointmentsAtTime.length < capacity;
      }
    });

    return { allSlots: allPossibleSlots, availableSlots: available };
  };

  const { allSlots, availableSlots } = getAvailableAndAllSlots();

  // Renderers for each step
  const renderStepIndicator = () => {
    const steps = [
      { num: BookingStep.SERVICE, label: 'Serviço' },
      { num: BookingStep.DATETIME, label: 'Horário' },
      { num: BookingStep.DETAILS, label: 'Dados' },
      { num: BookingStep.PAYMENT, label: 'Pagamento' },
    ];
    
    const currentStepIndex = steps.findIndex(s => s.num === step);
    const progressPercentage = currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;
    
    return (
      <div className="w-full bg-white dark:bg-[#0a0a0a] pt-6 pb-4 px-4 shadow-sm mb-6 sticky top-0 z-10 transition-colors border-b border-transparent dark:border-white/5">
        <div className="flex justify-between items-center max-w-lg mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-white/10 -z-10 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>

          {steps.map((s, index) => (
            <div key={s.num} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 border-2 ${
                  step >= s.num 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white dark:bg-[#0a0a0a] border-gray-300 dark:border-white/20 text-gray-400'
                }`}
              >
                {step > s.num ? <CheckCircle size={14} /> : index + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderServices = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white col-span-full mb-2">Escolha o serviço</h2>
      
      {/* Show pre-selected professional hint if exists */}
      {selectedProfessional && (
        <div className="col-span-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-3 rounded-lg flex items-center gap-3 mb-2">
            <img src={selectedProfessional.avatar} alt={selectedProfessional.name} className="w-10 h-10 rounded-full object-cover"/>
            <div>
                <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">Profissional Selecionado</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Agendando com {selectedProfessional.name}</p>
            </div>
        </div>
      )}

      {services.map(service => (
        <div 
          key={service.id}
          onClick={() => setSelectedService(service)}
          className={`bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex gap-4 ${
            selectedService?.id === service.id 
              ? 'border-primary ring-1 ring-primary bg-orange-50 dark:bg-white/5' 
              : 'border-transparent shadow-sm dark:border-white/5'
          }`}
        >
          <img src={service.image} alt={service.name} className="w-20 h-20 rounded-lg object-cover" />
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-c-list-title dark:text-white">{service.name}</h3>
              <p className="text-xs text-c-list-info dark:text-gray-400 mt-1 line-clamp-2">{service.description}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-c-list-info dark:text-gray-400 flex items-center gap-1">
                <Clock size={14} /> {service.duration} min
              </span>
              <span className="font-bold text-c-list-price">
                {service.price > 0 ? `R$ ${service.price.toFixed(2)}` : 'A consultar'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDateTime = () => {
    const { allSlots, availableSlots } = getAvailableAndAllSlots();

    const morningSlots = allSlots.filter(time => parseInt(time.split(':')[0], 10) < 12);
    const afternoonSlots = allSlots.filter(time => parseInt(time.split(':')[0], 10) >= 12 && parseInt(time.split(':')[0], 10) < 18);
    const eveningSlots = allSlots.filter(time => parseInt(time.split(':')[0], 10) >= 18);

    const renderSlotGrid = (slots: string[]) => {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {slots.map(time => {
            const isAvailable = availableSlots.includes(time);
            return (
              <button
                key={time}
                onClick={() => isAvailable && setSelectedTime(time)}
                disabled={!isAvailable}
                className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${
                  !isAvailable
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed decoration-slice line-through'
                      : selectedTime === time
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-primary'
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="px-4 pb-24 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Qual o melhor dia?</h2>
        
        {/* Date Scroller */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-6">
          {dayOptions.map((day, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedDate(day);
                setSelectedTime(null);
              }}
              className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                selectedDate.date.toDateString() === day.date.toDateString()
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-[#0a0a0a] text-c-text-secondary dark:text-gray-300 border-gray-200 dark:border-white/10'
              }`}
            >
              <span className="text-xs font-medium opacity-80">{day.label}</span>
              <span className="text-lg font-bold">{day.displayDate}</span>
            </button>
          ))}
        </div>

        <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-2">Horários disponíveis</h2>
        
        {morningSlots.length > 0 && (
            <div className="mt-4">
                <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Manhã</h3>
                {renderSlotGrid(morningSlots)}
            </div>
        )}
        {afternoonSlots.length > 0 && (
            <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Tarde</h3>
                {renderSlotGrid(afternoonSlots)}
            </div>
        )}
        {eveningSlots.length > 0 && (
            <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">Noite</h3>
                {renderSlotGrid(eveningSlots)}
            </div>
        )}

        {allSlots.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-8">Nenhum horário de funcionamento para esta data.</p>
        ) : availableSlots.length === 0 && allSlots.length > 0 ? (
            <p className="text-center text-gray-500 text-sm mt-8">Nenhum horário disponível para esta data.</p>
        ) : null}
      </div>
    );
  };

  const renderDetails = () => (
    <div className="px-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Seus dados</h2>
      <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl shadow-sm space-y-4 border border-gray-100 dark:border-white/5">
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Nome Completo</label>
          <input 
            type="text" 
            value={userDetails.name}
            onChange={(e) => setUserDetails({...userDetails, name: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: João Silva"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Telefone (WhatsApp)</label>
          <input 
            type="tel" 
            value={userDetails.phone}
            onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-c-text-secondary dark:text-gray-300 mb-1">Observações (Opcional)</label>
          <textarea 
            value={userDetails.notes}
            onChange={(e) => setUserDetails({...userDetails, notes: e.target.value})}
            className="w-full border border-gray-300 dark:border-white/10 dark:bg-[#111] dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
            placeholder="Alguma preferência especial?"
          />
        </div>
      </div>
      
      {/* Summary Mini Card */}
      <div className="mt-6 bg-orange-50 dark:bg-[#111] p-4 rounded-xl border border-orange-100 dark:border-white/5">
        <h3 className="font-semibold text-orange-900 dark:text-primary mb-2">Resumo do Agendamento</h3>
        <ul className="space-y-2 text-sm text-orange-800 dark:text-gray-300">
          <li className="flex justify-between"><span>Serviço:</span> <b>{selectedService?.name}</b></li>
          {selectedProfessional && <li className="flex justify-between"><span>Profissional:</span> <b>{selectedProfessional.name}</b></li>}
          <li className="flex justify-between"><span>Data:</span> <b>{selectedDate?.displayDate} às {selectedTime}</b></li>
          <li className="flex justify-between border-t border-orange-200 dark:border-white/10 pt-2 mt-2 text-lg font-bold">
            <span>Total:</span> <span>R$ {selectedService?.price.toFixed(2)}</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderPayment = () => {
    const depositAmount = selectedService?.deposit || 10;
    const fullAmount = selectedService?.price || 0;
    const amountToPay = paymentType === 'deposit' ? depositAmount : fullAmount;

    return (
      <div className="px-4 pb-24 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-c-text-primary dark:text-white mb-4">Pagamento Obrigatório</h2>
        
        {/* Payment Options */}
        <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl shadow-sm mb-4 space-y-3 border border-gray-100 dark:border-white/5">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Escolha como pagar:</h3>
            
            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentType === 'deposit' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
                <input 
                    type="radio" 
                    name="paymentType" 
                    checked={paymentType === 'deposit'} 
                    onChange={() => setPaymentType('deposit')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                    <span className="block font-bold text-gray-800 dark:text-white">Pagar apenas o Sinal</span>
                    <span className="text-xs text-gray-500">Para garantir o horário</span>
                </div>
                <span className="font-bold text-lg text-primary">R$ {depositAmount.toFixed(2)}</span>
            </label>

            <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentType === 'full' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'}`}>
                <input 
                    type="radio" 
                    name="paymentType" 
                    checked={paymentType === 'full'} 
                    onChange={() => setPaymentType('full')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                    <span className="block font-bold text-gray-800 dark:text-white">Pagar Valor Total</span>
                    <span className="text-xs text-gray-500">Serviço completo</span>
                </div>
                <span className="font-bold text-lg text-gray-800 dark:text-white">R$ {fullAmount.toFixed(2)}</span>
            </label>
        </div>

        {/* PIX Info */}
        <div className="bg-gray-900 dark:bg-[#050505] text-white p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Banknote size={100} />
            </div>
            <p className="text-sm text-gray-400 mb-1">Chave PIX para pagamento</p>
            <div 
                onClick={handleCopyPix}
                className="flex items-center justify-between bg-gray-800 dark:bg-[#111] p-3 rounded-lg border border-gray-700 dark:border-white/10 mb-3 cursor-pointer hover:bg-gray-700 transition-colors active:scale-95"
            >
                <code className="font-mono text-lg truncate flex-1">{pixKey}</code>
                <div className="ml-2 text-primary hover:text-white flex items-center gap-1 text-sm font-bold">
                    <Copy size={16} /> COPIAR
                </div>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Valor a transferir:</span>
                <span className="text-2xl font-bold text-primary">R$ {amountToPay.toFixed(2)}</span>
            </div>
        </div>
        
        {/* Next Step Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 mt-6 text-left flex gap-3">
            <AlertCircle className="text-blue-500 flex-shrink-0 mt-1" size={24} />
            <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-bold mb-1">Próximo Passo</p>
                <p>Ao finalizar, abriremos uma conversa no WhatsApp para você enviar o comprovante do PIX e confirmar seu horário.</p>
            </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6 relative">
        <Clock size={48} />
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-800">
             <CheckCircle size={16} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-c-text-primary dark:text-white mb-2">Solicitação Enviada!</h2>
      <p className="text-c-text-secondary dark:text-gray-400 max-w-xs mx-auto mb-6">
        Seu agendamento foi pré-reservado.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-8 max-w-sm w-full text-left flex gap-3">
         <AlertCircle className="text-blue-500 flex-shrink-0" size={24} />
         <div className="text-sm text-blue-800 dark:text-blue-300">
             <p className="font-bold mb-1">Verifique seu WhatsApp</p>
             <p>A conversa com o estabelecimento deve ter sido aberta para o envio do comprovante. O profissional confirmará assim que receber.</p>
         </div>
      </div>
      
      <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-white/5 pb-4">
          <img src={selectedProfessional?.avatar} className="w-12 h-12 rounded-full" alt="pro" />
          <div className="text-left">
            <p className="font-bold text-c-list-title dark:text-white">{selectedService?.name}</p>
            {selectedProfessional && <p className="text-sm text-c-list-info dark:text-gray-400">com {selectedProfessional.name}</p>}
          </div>
        </div>
        <div className="flex justify-between items-center text-gray-800 dark:text-gray-300 font-medium">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            {selectedDate.displayDate}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            {selectedTime}
          </div>
        </div>
      </div>

      <button 
        onClick={() => {
          setStep(BookingStep.SERVICE);
          setSelectedService(null);
          setSelectedProfessional(null);
          setSelectedTime(null);
          setUserDetails({name: '', phone: '', notes: ''});
          setPaymentType('deposit');
          window.scrollTo(0, 0);
        }}
        className="mt-8 text-primary font-semibold hover:text-primary-hover"
      >
        Fazer novo agendamento
      </button>
      
      <button 
        onClick={onBackToLanding}
        className="mt-4 text-c-text-secondary dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        Voltar para o início
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans pb-10 transition-colors">
      <div className="sticky top-0 z-20 bg-white dark:bg-[#0a0a0a] shadow-sm p-4 flex items-center gap-3 border-b border-transparent dark:border-white/5">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300"/>
        </button>
        <span className="font-semibold text-lg text-c-text-primary dark:text-white">Agendar Horário</span>
      </div>

      {step !== BookingStep.CONFIRMATION && renderStepIndicator()}

      <div className="max-w-3xl mx-auto pt-4">
        {step === BookingStep.SERVICE && renderServices()}
        {step === BookingStep.DATETIME && renderDateTime()}
        {step === BookingStep.DETAILS && renderDetails()}
        {step === BookingStep.PAYMENT && renderPayment()}
        {step === BookingStep.CONFIRMATION && renderConfirmation()}
      </div>

      {/* Footer Actions (Sticky) */}
      {step !== BookingStep.CONFIRMATION && (
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/5 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button 
              onClick={handleBack}
              className="px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                isStepValid() 
                  ? 'bg-primary hover:bg-primary-hover shadow-orange-200 dark:shadow-none' 
                  : 'bg-gray-300 dark:bg-white/5 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === BookingStep.PAYMENT ? 'Finalizar e Abrir WhatsApp' : 'Continuar'}
              {step !== BookingStep.PAYMENT && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};