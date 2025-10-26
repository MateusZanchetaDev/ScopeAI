import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// ❌ LINHA REMOVIDA: import AnalysisPage from "./pages/AnalysisPage"; 

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
          
          // ✅ Correção: Garante que o score é um número
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

  if (loading) return <p>Carregando análises...</p>;
  if (analyses.length === 0) return <p>Nenhuma análise disponível.</p>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {analyses.map((a) => (
          <Card key={a.meetingId} className="mb-4">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{a.meetingTitle}</CardTitle>
              <Badge className={getScoreColor(a.productivity_score)}>
                {a.productivity_score.toFixed(1)}/10 {/* Usando toFixed(1) para melhor visualização se o score for decimal */}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{a.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalysisPage;