import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AnalysisResult = ({ data }) => {
  if (!data) return null;

  const { score, resumo, decisoes, acoes, aderencia, recomendacoes } = data;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Resultado da Análise</CardTitle>
        <div className="text-sm text-muted-foreground">Score de Produtividade</div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-sm text-muted-foreground font-medium">Score</div>
          <div className={`text-3xl font-bold ${
            score >= 8 ? "text-success" : score >= 5 ? "text-warning" : "text-destructive"
          }`}>
            {score}/10
          </div>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h3 className="text-foreground font-medium mb-1">Resumo</h3>
            <p>{resumo}</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-1">Decisões Tomadas</h3>
            <ul className="list-disc ml-5">
              {decisoes.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-1">Itens de Ação</h3>
            <ul className="list-disc ml-5">
              {acoes.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-1">Aderência à Pauta</h3>
            <p>{aderencia}</p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-1">Recomendações para Próximas Reuniões</h3>
            <p>{recomendacoes}</p>
          </section>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;
