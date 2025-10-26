import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck } from "lucide-react";

interface Analysis {
  meetingId: string;
  meetingTitle: string;
  productivity_score: number;
  summary: string;
}

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = () => {
    try {
      const items: Analysis[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("analiseReuniao_")) {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          const score = parseFloat(data.productivity_score) || 0;
          if (score > 0 || data.summary) {
            const meetingId = key.replace("analiseReuniao_", "");
            items.push({
              meetingId,
              meetingTitle: data.meetingTitle || `Reunião ${meetingId}`,
              productivity_score: score,
              summary: data.summary,
            });
          }
        }
      }
      setAnalyses(items);
    } catch (error) {
      console.error("Erro ao carregar análises do localStorage:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-black";
    return "bg-red-500 text-white";
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Carregando análises...
      </div>
    );
  if (analyses.length === 0)
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center bg-background text-foreground">
          Nenhuma análise disponível.
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar fixa */}
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho da Página */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Análises de Reuniões</h1>
          <div /> {/* placeholder para alinhamento */}
        </div>

        {/* Grid de Cards */}
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {analyses.map((a) => (
            <Card
              key={a.meetingId}
              className="shadow-md border border-border rounded-2xl hover:shadow-lg transition-all"
            >
              <CardHeader className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-3">
                    <CalendarCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {a.meetingTitle}
                  </CardTitle>
                </div>
                <Badge className={getScoreColor(a.productivity_score)}>
                  {a.productivity_score.toFixed(1)}/10
                </Badge>
              </CardHeader>

              <CardContent className="text-muted-foreground whitespace-pre-wrap text-sm">
                {a.summary}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
