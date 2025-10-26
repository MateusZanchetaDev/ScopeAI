import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Save } from "lucide-react"; // Usando ícones lucide-react

// 1. Definição da interface de dados do formulário
interface FormData {
    name: string;
    role: string;
    company: string;
    email: string;
}

const EditProfilePage = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        role: '',
        company: '',
        email: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    // Função para carregar os dados do usuário atual
    const fetchUserData = async () => {
        setLoading(true);
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                toast.info("Sessão expirada. Redirecionando para o login.");
                navigate("/auth");
                return;
            }
            
            // Mapeia os dados do Supabase para o estado do formulário (Garantindo strings vazias para evitar erros no Input)
            setFormData({
                name: user.user_metadata?.full_name || '',
                role: user.user_metadata?.role || '',
                company: user.user_metadata?.company || '',
                email: user.email || 'N/A', // O email não é editável
            }); 

        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            toast.error("Erro ao carregar o perfil para edição.");
        } finally {
            setLoading(false);
        }
    };

    // Efeito para buscar os dados ao montar o componente
    useEffect(() => {
        fetchUserData();
    }, []); 
    
    // Handler para inputs controlados
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
    };

    // Lógica para salvar as alterações
    const handleSaveProfile = async () => {
        if (isSaving) return;

        // Validação básica
        if (!formData.name.trim()) {
            toast.warning("O nome é obrigatório.");
            return;
        }

        setIsSaving(true);
        try {
            // Atualiza apenas os campos do user_metadata que são editáveis
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.name,
                    role: formData.role,
                    company: formData.company,
                }
            });

            if (error) throw error;
            
            toast.success("Perfil atualizado com sucesso!");
            // Redireciona de volta para a página de perfil para ver as mudanças
            navigate("/profile"); 

        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            toast.error("Falha ao atualizar o perfil. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    // Renderiza o loading
    if (loading)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Carregando perfil...</p>
            </div>
        );

    // Estrutura do formulário
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Editar Perfil</h1>
                    <Button variant="outline" onClick={() => navigate("/profile")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar ao Perfil
                    </Button>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        
                        {/* Campo Nome */}
                        <div>
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input 
                                id="name"
                                value={formData.name} 
                                onChange={handleInputChange}
                                placeholder="Insira seu nome completo"
                            />
                        </div>

                        {/* Campo E-mail (Estático) */}
                        <div>
                            <Label htmlFor="email-display">E-mail (Não Editável)</Label>
                            <div 
                                id="email-display"
                                className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center"
                            >
                                {formData.email}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">O e-mail é a chave de acesso e não pode ser alterado aqui.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Campo Cargo */}
                            <div>
                                <Label htmlFor="role">Cargo</Label>
                                <Input 
                                    id="role"
                                    value={formData.role} 
                                    onChange={handleInputChange}
                                    placeholder="Seu Cargo Atual"
                                />
                            </div>

                            {/* Campo Empresa */}
                            <div>
                                <Label htmlFor="company">Empresa</Label>
                                <Input 
                                    id="company"
                                    value={formData.company} 
                                    onChange={handleInputChange}
                                    placeholder="Nome da sua Empresa"
                                />
                            </div>
                        </div>

                        {/* Botão Salvar */}
                        <div className="pt-4">
                            <Button 
                                onClick={handleSaveProfile} 
                                disabled={isSaving} 
                                className="w-full"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                                        A Salvar...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EditProfilePage;