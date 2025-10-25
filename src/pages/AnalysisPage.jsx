import React, { useState, useRef } from "react";
import { uploadAnalysisFile } from "../services/analysisService";
import AnalysisResult from "../components/AnalysisResult";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";

const AnalysisPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo primeiro!");
    setLoading(true);

    try {
      const response = await uploadAnalysisFile(file);
      setResult(response);
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a análise da reunião.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Análises de Reunião – ScopeAI</h1>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Upload da Transcrição</CardTitle>
            <div className="text-sm text-muted-foreground">Aceitamos .txt e .pdf</div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Input
                ref={fileRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                className="w-full"
              />

              <div className="flex items-center gap-3">
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? "Processando..." : "Gerar Resultado"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = null;
                    setResult(null);
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="mt-8">
            <AnalysisResult data={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
