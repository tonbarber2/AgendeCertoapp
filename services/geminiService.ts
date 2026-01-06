
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile, Professional, Service } from "../types";

// A chave da API é carregada da variável de ambiente `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createSystemInstruction = (
    profile: BusinessProfile,
    services: Service[],
    professionals: Professional[]
): string => {
  const businessName = profile.name || "Agende Certo";
  const servicesList = services.map(s => `${s.name} (R$ ${s.price.toFixed(2)})`).join(', ') || "Nenhum serviço cadastrado.";
  const professionalsList = professionals.map(p => `${p.name} (${p.role})`).join(', ') || "Nenhum profissional cadastrado.";

  return `
Você é a assistente virtual inteligente do "${businessName}", uma barbearia premium.
Seu objetivo é ajudar os clientes a escolherem o melhor serviço e profissional, ou tirar dúvidas sobre o agendamento.

Contexto da Barbearia:
- Nome do Negócio: ${businessName}
- Serviços Disponíveis: ${servicesList}.
- Profissionais: ${professionalsList}.

Diretrizes:
- Seja curta, educada e direta.
- Use emojis ocasionalmente.
- Se o usuário perguntar sobre preços, liste apenas os relevantes.
- Se o usuário pedir uma recomendação, pergunte o estilo dele ou sugira o serviço de maior valor como uma experiência premium.
- Responda sempre em Português do Brasil.
`;
};

export const sendMessageToGemini = async (
  history: {role: string, parts: {text: string}[]}[], 
  message: string,
  businessProfile: BusinessProfile,
  services: Service[],
  professionals: Professional[]
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const systemInstruction = createSystemInstruction(businessProfile, services, professionals);

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua resposta no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, estou tendo dificuldades técnicas. Por favor, tente novamente mais tarde.";
  }
};
