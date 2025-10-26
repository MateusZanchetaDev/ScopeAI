import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

serve(async (req) => {
  try {
    const { meeting_id, transcription } = await req.json();

    if (!transcription) {
      return new Response(JSON.stringify({ error: "Nenhuma transcrição fornecida" }), { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const prompt = `
Analise a transcrição abaixo e produza:
- Um score de produtividade (0 a 10)
- Um resumo da reunião
- Decisões tomadas (em formato de lista)
- Itens de ação (com responsável e prioridade)
- Grau de aderência à pauta
- Recomendações para próximas reuniões

Transcrição:
${transcription}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;

    const analysis = {
      productivity_score: Math.floor(Math.random() * 5) + 6, // Score fictício
      summary: responseText,
      decisions: [],
      action_items: [],
      agenda_adherence: "Boa aderência aos tópicos planejados.",
      recommendations: "Iniciar reuniões com objetivos mais claros.",
    };

    // Salvar no banco Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.33.1");
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("meeting_analysis").upsert({
      meeting_id,
      ...analysis,
    });

    return new Response(JSON.stringify(analysis), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
