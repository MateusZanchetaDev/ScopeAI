import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, Clock, Upload, TrendingUp, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";


interface MeetingData {
  id: string;
  title: string;
  objective: string;
  scheduled_date: string;
  status: string;
  organizer_id: string;
  profiles: { full_name: string; email: string };
  agenda_items: Array<{ id: string; title: string; duration_minutes: number; context: string; order_index: number }>;
  meeting_transcripts?: Array<{ id: string; content: string; uploaded_by: string }>;
  meeting_analysis?: Array<{
    productivity_score: number;
    summary: string;
    decisions: any[];
    action_items: any[];
    agenda_adherence: string;
    recommendations: string;
    participant_analysis: any[];
  }>;
}

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          profiles!meetings_organizer_id_fkey(full_name, email),
          agenda_items(*),
          meeting_transcripts(*),
          meeting_analysis(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setMeeting(data as any);

      if (data.meeting_transcripts && Array.isArray(data.meeting_transcripts) && data.meeting_transcripts.length > 0) {
        setTranscript(data.meeting_transcripts[0].content);
      }
    } catch (error) {
      console.error("Error fetching meeting:", error);
      toast.error("Erro ao carregar reunião");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Por favor, envie um arquivo .txt ou .pdf");
      return;
    }

    setUploadedFile(file);
    setUploadingTranscript(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let content = "";

      if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        toast.error("Suporte para PDF será adicionado em breve. Por favor, use arquivos .txt");
        setUploadingTranscript(false);
        return;
      }

      // Salva no Supabase
      const { error } = await supabase
        .from("meeting_transcripts")
        .upsert({
          meeting_id: id,
          content: content,
          uploaded_by: user.id,
        });

      if (error) throw error;

      setTranscript(content);
      //toast.success("Transcrição enviada com sucesso!");

      // Chama análise de IA automaticamente
      await handleAnalyze(file, content);

      // Atualiza os dados da reunião
      await fetchMeeting();

    } catch (error) {
      console.error("Error uploading transcript:", error);
      toast.error("Erro ao enviar transcrição");
    } finally {
      setUploadingTranscript(false);
    }
  };

  const handleAnalyze = async (file?: File, scopeText?: string) => {
    if (!file && !transcript) {
      toast.error("Nenhuma transcrição disponível para análise.");
      return;
    }

    try {
      setAnalyzing(true);
      toast.custom((t) => (
        <div
          className="bg-yellow-400 text-black font-bold text-lg p-6 rounded-xl shadow-lg"
        >
          Analisando reunião com IA...
        </div>
      ));


      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      formData.append("scopeText", scopeText || transcript);

      formData.append("meetingId", id as string);
      formData.append("meetingTitle", meeting?.title || "Reunião Sem Título");

      const response = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao processar a transcrição no backend.");

      const data = await response.json();

      const analysisData = {
        productivity_score: parseFloat(data.score) || 0,
        summary: data.summary || "Resumo não gerado.",
        decisions: data.decisions || [],
        action_items: data.action_items || [],
        agenda_adherence: data.agenda_adherence || "Não analisado.",
        recommendations: data.recommendations || "Nenhuma recomendação.",
        participant_analysis: data.participant_analysis || [],
      };

      // Salva no localStorage para a AnalysisPage
      localStorage.setItem(
        `analiseReuniao_${id}`,
        JSON.stringify({
          productivity_score: analysisData.productivity_score,
          summary: analysisData.summary,
          meetingTitle: meeting?.title,
          createdAt: Date.now() // adiciona timestamp
        })
      );

      // Salva o resultado no Supabase
      // const { error: analysisError } = await supabase
      //   .from("meeting_analysis")
      //   .upsert({
      //     meeting_id: id,
      //     productivity_score: analysisData.productivity_score,
      //     summary: analysisData.summary,
      //     decisions: analysisData.decisions,
      //     action_items: analysisData.action_items,
      //     agenda_adherence: analysisData.agenda_adherence,
      //     recommendations: analysisData.recommendations,
      //     participant_analysis: analysisData.participant_analysis,
      //   });

      // if (analysisError) throw analysisError;


      toast.custom((t) => (
        <div
          className="bg-green-600 text-white font-bold text-lg p-6 rounded-xl shadow-lg"
        >
          Análise concluída! O resultado foi salvo e atualizado.
        </div>
      ));

      await fetchMeeting();

      setTimeout(() => {
        navigate("/analises");
      }, 2000);
    } catch (err) {
      console.error("Erro ao analisar reunião:", err);
      toast.error("Erro ao analisar reunião com IA. Verifique o backend.");
    } finally {
      setAnalyzing(false);
    }
  };


  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return "bg-success text-success-foreground";
    if (score >= 5) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  // --- Renderização ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Reunião não encontrada</p>
        </div>
      </div>
    );
  }

  const hasTranscript = meeting.meeting_transcripts && meeting.meeting_transcripts.length > 0;
  const hasAnalysis = meeting.meeting_analysis && meeting.meeting_analysis.length > 0;
  const analysis = hasAnalysis ? meeting.meeting_analysis[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* 1. Header (Informações da Reunião - Título, Data, Organizador) */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
              <p className="text-muted-foreground">{meeting.objective}</p>
            </div>
            <Badge className={meeting.status === "completed" ? "bg-success" : ""}>
              {meeting.status === "completed" ? "Concluída" : "Agendada"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(meeting.scheduled_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Organizador: {meeting.profiles.full_name}</span>
            </div>
          </div>
        </div>

        {/* 2. Conteúdo Principal em Fluxo Vertical */}
        <div className="space-y-6">

          {/* 2a. Agenda (Pauta) - Ocupa a largura total */}
          <Card>
            <CardHeader>
              <CardTitle>Pauta da Reunião</CardTitle>
              <CardDescription>Tópicos planejados para discussão</CardDescription>
            </CardHeader>
            <CardContent>
              {meeting.agenda_items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum tópico na pauta</p>
              ) : (
                <div className="space-y-4">
                  {meeting.agenda_items
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((item, index) => (
                      <div key={item.id} className="border-l-2 border-primary pl-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold">
                            {index + 1}. {item.title}
                          </h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{item.duration_minutes}min</span>
                          </div>
                        </div>
                        {item.context && (
                          <p className="text-sm text-muted-foreground">{item.context}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2b. Upload de Transcrição - Ocupa a largura total (AGORA AQUI) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Transcrição da Reunião
              </CardTitle>
              <CardDescription>
                {hasTranscript ? "Transcrição enviada com sucesso" : "Faça upload de um arquivo .txt"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingTranscript}
                className="w-full gap-2"
                variant={hasTranscript ? "secondary" : "default"}
              >
                <FileText className="h-4 w-4" />
                {uploadingTranscript ? "Enviando..." : hasTranscript ? "Atualizar Transcrição" : "Selecionar Arquivo"}
              </Button>

              {(uploadedFile || hasTranscript) && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {uploadedFile ? `Arquivo selecionado: ${uploadedFile.name}` : "Pronto para análise."}
                </p>
              )}

              {!hasAnalysis && hasTranscript && (
                <Button
                  onClick={() => handleAnalyze(uploadedFile || undefined)}
                  disabled={analyzing}
                  className="w-full gap-2 mt-3"
                >
                  <TrendingUp className="h-4 w-4" />
                  {analyzing ? "Analisando..." : "Gerar Resultado"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 2c. Resultados da Análise - Agora em uma grade de 2/1 coluna abaixo do Upload */}
          {hasAnalysis && analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Coluna Principal da Análise (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Resumo da Reunião</CardTitle>
                      <Badge className={getScoreBadgeColor(analysis.productivity_score)}>
                        Score: {analysis.productivity_score.toFixed(1)}/10
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Decisões Tomadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.decisions.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma decisão foi tomada</p>
                    ) : (
                      <ul className="space-y-2">
                        {analysis.decisions.map((decision: any, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <div>
                              <p>{decision.decision}</p>
                              {decision.responsible && (
                                <p className="text-sm text-muted-foreground">
                                  Responsável: {decision.responsible}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      Itens de Ação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.action_items.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum item de ação definido</p>
                    ) : (
                      <ul className="space-y-3">
                        {analysis.action_items.map((item: any, index: number) => (
                          <li key={index} className="border-l-2 border-primary pl-3">
                            <p className="font-medium">{item.task}</p>
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                              {item.responsible && <span>Responsável: {item.responsible}</span>}
                              {item.priority && (
                                <Badge variant="outline" className="text-xs">
                                  {item.priority === "high" ? "Alta" : item.priority === "medium" ? "Média" : "Baixa"}
                                </Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar da Análise (1/3) */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Aderência à Pauta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis.agenda_adherence}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis.recommendations}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;