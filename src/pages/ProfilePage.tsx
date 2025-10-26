import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client"; // Assumindo este path
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


// 1. Definição da interface de dados dinâmicos do perfil
interface UserProfile {
  name: string;
  role: string;
  email: string;
  company: string;
  joinedAt: string;
  analysesCount: number; // Mudamos de 'analyses' para 'analysesCount'
  lastActivity: string;
}

// Helper para obter iniciais (Fallback do Avatar)
const getInitials = (fullName: string) => {
  if (!fullName) return 'U';
  const parts = fullName.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return fullName[0].toUpperCase();
};


const ProfilePage = () => {
  // 2. Estado para o perfil dinâmico
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // A. Busca o usuário atual (Supabase)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // Se não houver usuário logado, redireciona para a página de login
          toast.info("Sessão expirada ou não autenticada. Faça login.");
          navigate("/auth");
          return;
        }

        // B. Coleta dados do localStorage (Contagem de Análises)
        let analysesCount = 0;
        let lastAnalysisDate: Date | null = null;

        // Percorre o localStorage para contar e encontrar a última análise
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("analiseReuniao_")) {
            analysesCount++;
            // Nota: Se você tivesse um timestamp salvo em cada análise, usaria ele.
            // Aqui, usamos a data atual como um proxy simples se houver análises.
            if (lastAnalysisDate === null) {
              lastAnalysisDate = new Date(); // Simula "Hoje" se existir ao menos uma análise
            }
          }
        }

        // C. Constrói o objeto de perfil
        const profileData: UserProfile = {
          // Dados do usuário (Auth e User Metadata do Supabase)
          name: user.user_metadata.full_name || 'Usuário Desconhecido',
          email: user.email || 'N/A',

          // Dados fixos (Pode ser atualizado futuramente com dados de uma tabela 'profiles')
          role: user.user_metadata.role || "Membro",
          company: user.user_metadata.company || "N/A",

          // Data de criação da conta (Auth do Supabase)
          joinedAt: user.created_at,

          // Dados Locais
          analysesCount: analysesCount,
          lastActivity: analysesCount > 0
            ? (lastAnalysisDate?.toLocaleDateString('pt-BR') || 'Hoje')
            : 'Nenhuma análise',
        };

        setUserProfile(profileData);

      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        toast.error("Erro ao carregar o perfil do usuário.");
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]); // Adicionamos 'navigate' como dependência

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Carregando perfil...</p>
      </div>
    );

  // Certifica-se de que o usuário existe antes de renderizar
  if (!userProfile) return null;

  const user = userProfile;

  const handleEditClick = () => {
    // Aqui, "/edit-profile" é o caminho que deve ser configurado no seu router
    navigate("/edit-profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Perfil do Usuário</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card de informações pessoais */}
          <Card className="shadow-md border-border">
            <CardHeader className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/profile-pic.jpg" alt={user.name} />
                {/* Fallback dinâmico com as iniciais do nome */}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{user.role}</p>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">E-mail:</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Empresa:</p>
                <p>{user.company}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Membro desde:</p>
                {/* Formata a data de entrada do Supabase */}
                <p>{new Date(user.joinedAt).toLocaleDateString()}</p>
              </div>

              <div className="pt-4">
                <Button onClick={handleEditClick}> Editar Perfil </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de estatísticas */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle>📊 Estatísticas</CardTitle>
            </CardHeader>

            <CardContent className="grid sm:grid-cols-2 gap-4 text-center">
              <div className="border rounded-lg p-4 hover:shadow transition-all">
                {/* Dados dinâmicos */}
                <p className="text-3xl font-bold text-foreground">{user.analysesCount}</p>
                <p className="text-sm text-muted-foreground">Análises realizadas</p>
              </div>
              <div className="border rounded-lg p-4 hover:shadow transition-all">
                {/* Dados dinâmicos */}
                <p className="text-3xl font-bold text-foreground">{user.lastActivity}</p>
                <p className="text-sm text-muted-foreground">Última atividade</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;