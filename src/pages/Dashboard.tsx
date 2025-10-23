import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MeetingCard from "@/components/MeetingCard";
import ScoreCard from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  objective: string;
  scheduled_date: string;
  status: "scheduled" | "completed" | "cancelled";
  meeting_participants: { count: number }[];
  meeting_analysis?: { productivity_score: number }[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    avgScore: 0,
    scheduledMeetings: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchMeetings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          meeting_participants(count),
          meeting_analysis(productivity_score)
        `)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      setMeetings((data || []) as any);
      calculateStats((data || []) as any);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Erro ao carregar reuniões");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (meetingsData: Meeting[]) => {
    const total = meetingsData.length;
    const scheduled = meetingsData.filter((m) => m.status === "scheduled").length;
    const completed = meetingsData.filter((m) => m.status === "completed");
    
    const scores = completed
      .map((m) => m.meeting_analysis?.[0]?.productivity_score)
      .filter((s): s is number => s !== undefined);
    
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    setStats({
      totalMeetings: total,
      avgScore,
      scheduledMeetings: scheduled,
    });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Gerencie suas reuniões e acompanhe a produtividade
            </p>
          </div>
          
          <Button onClick={() => navigate("/meeting/new")} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nova Reunião
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ScoreCard
            title="Total de Reuniões"
            value={stats.totalMeetings}
            icon={<Calendar className="h-5 w-5" />}
          />
          
          <ScoreCard
            title="Score Médio"
            value={`${stats.avgScore}/10`}
            subtitle="Produtividade geral"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          
          <ScoreCard
            title="Reuniões Agendadas"
            value={stats.scheduledMeetings}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        {/* Meetings Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Suas Reuniões</h2>
          
          {meetings.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma reunião ainda</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira reunião
              </p>
              <Button onClick={() => navigate("/meeting/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Reunião
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  id={meeting.id}
                  title={meeting.title}
                  objective={meeting.objective}
                  scheduledDate={meeting.scheduled_date}
                  participantCount={meeting.meeting_participants?.[0]?.count || 0}
                  status={meeting.status}
                  score={meeting.meeting_analysis?.[0]?.productivity_score}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;