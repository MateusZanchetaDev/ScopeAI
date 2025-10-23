import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        *,
        agenda_items(*),
        meeting_transcripts(*),
        meeting_participants(*, profiles(*))
      `)
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      throw new Error('Meeting not found');
    }

    if (!meeting.meeting_transcripts || meeting.meeting_transcripts.length === 0) {
      throw new Error('No transcript found for this meeting');
    }

    const transcript = meeting.meeting_transcripts[0];
    const agendaItems = meeting.agenda_items || [];
    const participants = meeting.meeting_participants || [];

    // Prepare agenda summary
    const agendaSummary = agendaItems.map((item: any, index: number) => 
      `${index + 1}. ${item.title} (${item.duration_minutes} min) - Responsável: ${item.responsible_id || 'Não definido'}`
    ).join('\n');

    // Prepare analysis prompt
    const analysisPrompt = `Você é um analista especializado em produtividade de reuniões. Analise a seguinte reunião corporativa:

**INFORMAÇÕES DA REUNIÃO:**
- Título: ${meeting.title}
- Objetivo: ${meeting.objective}
- Data: ${new Date(meeting.scheduled_date).toLocaleDateString('pt-BR')}
- Número de participantes: ${participants.length}

**PAUTA PLANEJADA:**
${agendaSummary || 'Nenhuma pauta definida'}

**TRANSCRIÇÃO DA REUNIÃO:**
${transcript.content}

**INSTRUÇÕES DE ANÁLISE:**
Com base nas informações acima, forneça uma análise completa no seguinte formato JSON:

{
  "productivity_score": <número de 0 a 10>,
  "summary": "<resumo da reunião em 2-3 parágrafos>",
  "decisions": [
    {"decision": "<decisão tomada>", "responsible": "<responsável>", "deadline": "<prazo ou null>"}
  ],
  "action_items": [
    {"task": "<tarefa>", "responsible": "<responsável>", "priority": "high|medium|low", "deadline": "<prazo ou null>"}
  ],
  "agenda_adherence": "<análise se a pauta foi seguida, incluindo desvios e tempo gasto>",
  "recommendations": "<recomendações para melhorar futuras reuniões>",
  "participant_analysis": [
    {"name": "<nome do participante>", "participation_level": "high|medium|low", "key_contributions": "<principais contribuições>"}
  ]
}

**CRITÉRIOS PARA O SCORE (0-10):**
- Coerência entre pauta e transcrição
- Relevância dos assuntos discutidos
- Decisões e conclusões práticas alcançadas
- Equilíbrio de tempo entre tópicos
- Número adequado de participantes
- Equilíbrio de participação entre membros
- Quantidade e clareza de action items
- Ausência de repetição de tópicos já tratados
- Tom geral da reunião (positivo, neutro, negativo)

Responda APENAS com o JSON válido, sem texto adicional.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um analista especializado em produtividade de reuniões corporativas. Sempre responda em português brasileiro com análises objetivas e acionáveis.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI Gateway error');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Parse JSON response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('meeting_analysis')
      .upsert({
        meeting_id: meetingId,
        productivity_score: analysisData.productivity_score,
        summary: analysisData.summary,
        decisions: analysisData.decisions || [],
        action_items: analysisData.action_items || [],
        agenda_adherence: analysisData.agenda_adherence,
        recommendations: analysisData.recommendations,
        participant_analysis: analysisData.participant_analysis || [],
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw new Error('Failed to save analysis');
    }

    // Update meeting status to completed
    await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-meeting function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});