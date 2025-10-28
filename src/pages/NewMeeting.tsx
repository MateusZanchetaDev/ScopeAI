import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AgendaItem {
  title: string;
  duration_minutes: number;
  context: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

const NewMeeting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { title: "", duration_minutes: 10, context: "" },
  ]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addParticipant = (userId: string) => {
    if (!participants.includes(userId)) {
      setParticipants([...participants, userId]);
      setSearchTerm("");
    }
  };

  const removeParticipant = (userId: string) => {
    setParticipants(participants.filter((id) => id !== userId));
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      !participants.includes(user.id) &&
      (user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, { title: "", duration_minutes: 10, context: "" }]);
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: string | number) => {
    const updated = [...agendaItems];
    updated[index] = { ...updated[index], [field]: value };
    setAgendaItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          title,
          objective,
          scheduled_date: scheduledDate,
          organizer_id: user.id,
          status: "scheduled",
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Add participants
      if (participants.length > 0) {
        const participantsData = participants.map((userId) => ({
          meeting_id: meeting.id,
          user_id: userId,
          confirmed: false,
        }));

        const { error: participantsError } = await supabase
          .from("meeting_participants")
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      // Create agenda items
      const validAgendaItems = agendaItems.filter((item) => item.title.trim() !== "");
      if (validAgendaItems.length > 0) {
        const agendaData = validAgendaItems.map((item, index) => ({
          meeting_id: meeting.id,
          title: item.title,
          duration_minutes: item.duration_minutes,
          context: item.context || null,
          order_index: index,
        }));

        const { error: agendaError } = await supabase
          .from("agenda_items")
          .insert(agendaData);

        if (agendaError) throw agendaError;
      }

      toast.success(
        <span className="text-lg font-bold">
          Reunião criada com sucesso!
        </span>
      );
      navigate(`/meeting/${meeting.id}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Erro ao criar reunião");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nova Reunião</CardTitle>
            <CardDescription>
              Preencha as informações da reunião e construa a pauta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Reunião *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Revisão Estratégica Q3 - Comercial"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo Central *</Label>
                  <Textarea
                    id="objective"
                    placeholder="Descreva o objetivo principal desta reunião"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Data e Hora *</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Participantes</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Buscar usuários por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => addParticipant(user.id)}
                              className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                              <UserPlus className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {participants.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {participants.map((userId) => {
                          const user = availableUsers.find((u) => u.id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary" className="gap-1">
                              {user.full_name}
                              <button
                                type="button"
                                onClick={() => removeParticipant(userId)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Agenda Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pauta da Reunião</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAgendaItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Tópico
                  </Button>
                </div>

                {agendaItems.map((item, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6 space-y-4">
                      {agendaItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removeAgendaItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                      <div className="space-y-2">
                        <Label>Título do Tópico {index + 1}</Label>
                        <Input
                          placeholder="Ex: Análise de Faturamento"
                          value={item.title}
                          onChange={(e) => updateAgendaItem(index, "title", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tempo Estimado (minutos)</Label>
                        <Input
                          type="number"
                          min="5"
                          value={item.duration_minutes}
                          onChange={(e) => updateAgendaItem(index, "duration_minutes", parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contexto (opcional)</Label>
                        <Textarea
                          placeholder="Informações adicionais sobre este tópico"
                          value={item.context}
                          onChange={(e) => updateAgendaItem(index, "context", e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Criando..." : "Criar Reunião"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewMeeting;