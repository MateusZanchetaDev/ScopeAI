import { supabase } from "@/integrations/supabase/client";

export const uploadAnalysisFile = async (file) => {
  if (!file) throw new Error("Nenhum arquivo selecionado");

  const text = await file.text();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Salva transcrição no banco
  const { data, error } = await supabase
    .from("meeting_transcripts")
    .insert([{ content: text, uploaded_by: user.id }])
    .select()
    .single();

  if (error) throw error;

  // Chama a função de IA
  const { data: analysis, error: aiError } = await supabase.functions.invoke("analyze-meeting", {
    body: { transcriptId: data.id },
  });

  if (aiError) throw aiError;

  return analysis;
};
