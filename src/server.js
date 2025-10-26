import express from 'express';
import multer from 'multer';
import fs from 'fs';
// Se você não for usar a Gladia para transcrição, pode remover as duas linhas abaixo.
// import { GladiaClient } from '@gladiaio/sdk'; 
// const gladiaClient = new GladiaClient({ apiKey: process.env.GLADIA_API_KEY });
import dotenv from 'dotenv';
import cors from 'cors';

// 1. IMPORTAÇÃO DO GOOGLE GEN AI E TIPOS
import { GoogleGenAI, Type } from "@google/genai";

// ⚠️ CORREÇÃO NECESSÁRIA PARA pdf-parse (CommonJS) no ambiente ESM
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse'); 
// FIM da correção

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// 2. INICIALIZAÇÃO DO CLIENTE GEMINI COM CHAVE EXPLÍCITA
const ai = new GoogleGenAI({ 
    apiKey: process.env.GOOGLE_API_KEY, 
});

app.use(cors({
  origin: 'http://localhost:8080', // seu frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. DEFINIÇÃO DO SCHEMA DE SAÍDA PARA O GEMINI (inalterado)
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.NUMBER,
            description: "Pontuação de produtividade da reunião em uma escala de 1 a 10. Use uma casa decimal."
        },
        summary: {
            type: Type.STRING,
            description: "Um resumo conciso da reunião, cobrindo os principais pontos de discussão e resultados."
        },
        decisions: {
            type: Type.ARRAY,
            description: "Uma lista de todas as decisões firmes tomadas durante a reunião.",
            items: {
                type: Type.OBJECT,
                properties: {
                    decision: { type: Type.STRING },
                    responsible: { type: Type.STRING, description: "O nome da pessoa responsável pela decisão." }
                },
                required: ["decision", "responsible"]
            }
        },
        action_items: {
            type: Type.ARRAY,
            description: "Uma lista de todas as tarefas de acompanhamento (action items) definidas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    task: { type: Type.STRING },
                    responsible: { type: Type.STRING, description: "O nome da pessoa responsável pela tarefa." },
                    priority: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["task", "responsible"]
            }
        },
        agenda_adherence: {
            type: Type.STRING,
            description: "Uma análise sobre o quão bem a reunião aderiu à pauta original, mencionando desvios ou foco."
        },
        recommendations: {
            type: Type.STRING,
            description: "Recomendações baseadas na transcrição para melhorar futuras reuniões ou processos."
        }
    },
    required: ["score", "summary", "decisions", "action_items", "agenda_adherence", "recommendations"]
};


app.post("/analyze", upload.single("file"), async (req, res) => {
    let file = req.file;
    let scopeText = req.body.scopeText;
    const meetingTitle = req.body.meetingTitle || "Reunião";
    const meetingId = req.body.meetingId;
    
    try {
        console.log("📥 Chegou requisição para análise da reunião:", meetingTitle);

        if (!file && !scopeText) {
            return res.status(400).json({ error: "Nenhum arquivo ou texto enviado" });
        }

        let textContent = scopeText || "";

        if (file) {
            try {
                if (file.mimetype === "text/plain") {
                    textContent = fs.readFileSync(file.path, "utf8");
                } else if (file.mimetype === "application/pdf") {
                    // Nota: 'pdfParse' está sendo usado com a correção de importação
                    const dataBuffer = fs.readFileSync(file.path);
                    const pdfData = await pdfParse(dataBuffer);
                    textContent = pdfData.text;
                } else {
                    return res.status(400).json({ error: "Tipo de arquivo não suportado" });
                }
            } catch (readErr) {
                console.error("❌ Erro ao ler arquivo:", readErr);
                return res.status(500).json({ error: "Erro ao processar arquivo enviado" });
            } finally {
                fs.unlinkSync(file.path); 
            }
        }

        console.log("📄 Conteúdo para IA (200 chars):", textContent.slice(0, 200), "...");

        // 4. CHAMADA REAL À API DO GEMINI
        const systemInstruction = `Você é um Analista de Produtividade de Reuniões. Sua tarefa é analisar a transcrição de uma reunião, que é sobre a pauta ${meetingTitle}. Você deve extrair todas as informações solicitadas no formato JSON exato. Seja objetivo e profissional. O score deve refletir a produtividade real da conversa.`;

        const prompt = `Analise a seguinte transcrição de reunião. Crie um resumo, extraia todas as decisões e itens de ação com seus respectivos responsáveis e prioridades, avalie a aderência à pauta e forneça recomendações para melhoria. Retorne o resultado estritamente no formato JSON definido: \n\n### TRANSCRIÇÃO:\n${textContent}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            }
        });
        
        const analysisResult = JSON.parse(response.text);

        console.log("✅ Análise da IA concluída. Score:", analysisResult.score);

        // 5. RETORNO DA RESPOSTA ESTRUTURADA
        res.json({
            success: true,
            score: analysisResult.score,
            summary: analysisResult.summary,
            decisions: analysisResult.decisions,
            action_items: analysisResult.action_items,
            agenda_adherence: analysisResult.agenda_adherence,
            recommendations: analysisResult.recommendations,
        });

    } catch (err) {
        console.error("❌ Erro ao analisar reunião com IA:", err);
        res.status(500).json({ 
            error: "Erro ao chamar a API de Análise. Verifique sua chave GOOGLE_API_KEY e os logs do backend.",
            detail: err.message
        });
    }
});


app.listen(5001, () => {
    console.log('Servidor rodando em http://localhost:5001');
});