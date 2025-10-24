import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Home, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
      toast.success("Logout realizado com sucesso");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">ScopeAI</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                asChild
                className="gap-2"
              >
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              
              <Button
                variant={isActive("/analytics") ? "default" : "ghost"}
                asChild
                className="gap-2"
              >
                <Link to="/analytics">
                  <BarChart3 className="h-4 w-4" />
                  Análises
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/profile">
                <User className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;