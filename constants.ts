
import { Service, Professional, TimeSlot, DayOption, BusinessHours } from './types';

export const SERVICES: Service[] = [
  {
    id: '5',
    name: 'Área vip Cortes',
    description: 'Uma experiência completa com tratamento especial. Preço a consultar.',
    price: 0,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1583241801238-a583c480a84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '15',
    name: 'Área vip sobrancelhas',
    description: 'Design e tratamento VIP para suas sobrancelhas. Preço a consultar.',
    price: 0,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1634472645118-a85c829a239a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '3',
    name: 'Barba',
    description: 'Modelagem e alinhamento da barba com toalha quente e navalha.',
    price: 15.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1615182582998-3850785f768b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '8',
    name: 'Cabelo+Barba+sobrancelha+pigmentação',
    description: 'Pacote completo para renovar o visual: cabelo, barba, sobrancelha e pigmentação.',
    price: 50.00,
    duration: 45,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1634472645096-7788a101217e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '4',
    name: 'Corte + barba',
    description: 'O combo perfeito para um visual completo e alinhado.',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1599351548092-93c6918804c8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '1',
    name: 'Corte com máquina e tesoura',
    description: 'Corte versátil utilizando máquina e tesoura para o acabamento perfeito.',
    price: 27.00,
    duration: 30,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc3330058da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '7',
    name: 'Corte com tesoura',
    description: 'Corte clássico e modelado inteiramente na tesoura.',
    price: 30.00,
    duration: 30,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1605497788018-8734341902c9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '2',
    name: 'Corte Degradê/Navalhado/Americano/Moicano',
    description: 'Estilos modernos com acabamento preciso na navalha ou máquina zero.',
    price: 25.00,
    duration: 30,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1622288399328-5e4a07010a30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '9',
    name: 'Corte Simples',
    description: 'Corte rápido e prático, feito inteiramente com máquina.',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1603233489397-1521d9c1356f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '10',
    name: 'Corte Social',
    description: 'Corte clássico e elegante, ideal para o dia a dia e ocasiões formais.',
    price: 22.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1565862214952-f09230537042?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '11',
    name: 'Corte+ Pigmentação',
    description: 'Corte moderno com aplicação de pigmentação para disfarçar falhas ou dar estilo.',
    price: 35.00,
    duration: 30,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1622979205933-485a3c613134?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '12',
    name: 'Design de sobrancelhas',
    description: 'Modelagem e alinhamento das sobrancelhas com navalha ou pinça.',
    price: 20.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1634472645096-7788a101217e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '14',
    name: 'Pigmentação barba',
    description: 'Pigmentação para preencher falhas e dar mais volume à barba.',
    price: 13.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1599351548092-93c6918804c8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '13',
    name: 'Pigmentação Cabelo',
    description: 'Aplicação de pigmento para cobrir falhas ou dar um novo estilo ao cabelo.',
    price: 15.00,
    duration: 20,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1622979205933-485a3c613134?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '6',
    name: 'Sobrancelha com henna',
    description: 'Design de sobrancelha com aplicação de henna para preenchimento.',
    price: 35.00,
    duration: 45,
    deposit: 5.00,
    image: 'https://images.unsplash.com/photo-1634472645118-a85c829a239a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80'
  }
];

export const PROFESSIONALS: Professional[] = [];

export const TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  sunday: { isOpen: true, intervals: [{ start: '11:00', end: '14:30' }] },
  monday: { isOpen: false, intervals: [] },
  tuesday: { isOpen: true, intervals: [{ start: '14:00', end: '19:00' }] },
  wednesday: { isOpen: true, intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '19:00' }] },
  thursday: { isOpen: true, intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '17:00' }] },
  friday: { isOpen: true, intervals: [{ start: '08:30', end: '12:00' }, { start: '14:00', end: '19:30' }] },
  saturday: { isOpen: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '19:30' }] }
};

export const getNextDays = (days: number): DayOption[] => {
  const options: DayOption[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    let label = '';
    if (i === 0) label = 'Hoje';
    else if (i === 1) label = 'Amanhã';
    else {
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      label = weekDays[d.getDay()];
    }

    options.push({
      date: d,
      label,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`
    });
  }
  return options;
};