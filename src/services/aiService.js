import { GladiaClient } from '@gladiaio/sdk';

const gladiaClient = new GladiaClient({
  apiKey: process.env.VITE_GLADIA_API_KEY,
});

export const analyzeMeeting = async (scopeText, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scopeText', scopeText);

  const response = await fetch('http://localhost:5001/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erro ao processar a transcrição');
  }

  const data = await response.json();
  return data.resultado;
};

export const analyzeTranscriptionLocal = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:5001/api/analisar-transcricao", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao processar a transcrição");
  }

  const data = await response.json();
  return data.resultado; // texto retornado pela IA
};
