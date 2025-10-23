import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MeetingCardProps {
  id: string;
  title: string;
  objective: string;
  scheduledDate: string;
  participantCount: number;
  status: "scheduled" | "completed" | "cancelled";
  score?: number;
}

const MeetingCard = ({
  id,
  title,
  objective,
  scheduledDate,
  participantCount,
  status,
  score,
}: MeetingCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "scheduled":
        return "bg-primary text-primary-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "completed":
        return "Concluída";
      case "scheduled":
        return "Agendada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{objective}</p>
          </div>
          <Badge className={getStatusColor()}>{getStatusLabel()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(scheduledDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount} participantes</span>
          </div>

          {score !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Score de Produtividade:</span>
              <span className={`font-bold text-lg ${getScoreColor(score)}`}>{score}/10</span>
            </div>
          )}
        </div>

        <Button asChild className="w-full gap-2">
          <Link to={`/meeting/${id}`}>
            Ver Detalhes
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default MeetingCard;