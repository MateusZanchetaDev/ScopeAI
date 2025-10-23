import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Users, Clock, Upload, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MeetingData {
  id: string;
  title: string;
  objective: string;
  scheduled_date: string;
  status: string;
  organizer_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  agenda_items: Array<{
    id: string;
    title: string;
    duration_minutes: number;
    context: string;
    order_index: number;
  }>;
  meeting_transcripts?: Array<{
    id: string;
    content: string;
  }>;
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

  const handleUploadTranscript = async () => {
    if (!transcript.trim()) {
      toast.error("Por favor, insira a transcrição da reunião");
      return;
    }

    setUploadingTranscript(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("meeting_transcripts")
        .upsert({
          meeting_id: id,
          content: transcript,
          uploaded_by: user.id,
        });

      if (error) throw error;

      toast.success("Transcrição enviada com sucesso!");
      fetchMeeting();
    } catch (error) {
      console.error("Error uploading transcript:", error);
      toast.error("Erro ao enviar transcrição");
    } finally {
      setUploadingTranscript(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-meeting", {
        body: { meetingId: id },
      });

      if (error) throw error;

      toast.success("Análise concluída com sucesso!");
      fetchMeeting();
    } catch (error) {
      console.error("Error analyzing meeting:", error);
      toast.error("Erro ao analisar reunião");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return "bg-success text-success-foreground";
    if (score >= 5) return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

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

        {/* Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda */}
            <Card>
              <CardHeader>
                <CardTitle>Pauta da Reunião</CardTitle>
                <CardDescription>
                  Tópicos planejados para discussão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meeting.agenda_items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum tópico na pauta
                  </p>
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

            {/* Transcript Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Transcrição da Reunião
                </CardTitle>
                <CardDescription>
                  {hasTranscript ? "Transcrição já enviada" : "Cole a transcrição da reunião para análise"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transcript">Transcrição</Label>
                    <Textarea
                      id="transcript"
                      placeholder="Cole aqui a transcrição completa da reunião..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={10}
                      disabled={hasTranscript && hasAnalysis}
                    />
                  </div>

                  {!hasTranscript && (
                    <Button
                      onClick={handleUploadTranscript}
                      disabled={uploadingTranscript || !transcript.trim()}
                      className="w-full gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingTranscript ? "Enviando..." : "Enviar Transcrição"}
                    </Button>
                  )}

                  {hasTranscript && !hasAnalysis && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="w-full gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      {analyzing ? "Analisando..." : "Gerar Análise com IA"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {hasAnalysis && analysis && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Resumo da Reunião</CardTitle>
                      <Badge className={getScoreBadgeColor(analysis.productivity_score)}>
                        Score: {analysis.productivity_score}/10
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
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {hasAnalysis && analysis && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;