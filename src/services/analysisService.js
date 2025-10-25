export async function uploadAnalysisFile(file) {
  // Simulação do envio e processamento
  await new Promise((res) => setTimeout(res, 2000));

  // Aqui futuramente chamará a API da OpenAI/Claude
  // const formData = new FormData();
  // formData.append("file", file);
  // const response = await fetch("/api/analyze", { method: "POST", body: formData });
  // return await response.json();

  // Mock de resultado
  return {
    score: 8.5,
    resumo:
      "A reunião abordou todos os tópicos principais, com boa organização e decisões práticas.",
    decisoes: [
      "Aprovação do plano de metas do Q4",
      "Revisão de orçamento para marketing",
    ],
    acoes: [
      "Pedro – enviar relatório final até sexta",
      "Carla – revisar proposta de fornecedores",
    ],
    aderencia: "A pauta foi seguida com 90% de coerência.",
    recomendacoes:
      "Reduzir tempo de discussão em tópicos menores e definir prazos mais claros.",
  };
}
