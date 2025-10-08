export async function buscarAvaliacoes() {
  try {
    const res = await fetch("/api/avaliacoes", { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar avaliações");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function criarAvaliacao(avaliacao: any) {
  const res = await fetch("/api/avaliacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(avaliacao)
  });
  if (!res.ok) throw new Error("Erro ao criar avaliação");
  return res.json();
}

export async function editarAvaliacao(avaliacao: any) {
  const res = await fetch("/api/avaliacoes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(avaliacao)
  });
  if (!res.ok) throw new Error("Erro ao editar avaliação");
  return res.json();
}

export async function deletarAvaliacao(id: string) {
  const res = await fetch(`/api/avaliacoes?id=${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Erro ao deletar avaliação");
  return res.json();
}

export async function buscarPerguntas(avaliacaoId: string) {
  const res = await fetch(`/api/avaliacoes/${avaliacaoId}/perguntas`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Erro ao buscar perguntas");
  return res.json();
}

export async function submeterRespostas(avaliacaoId: string, respostas: any) {
  const res = await fetch(`/api/avaliacoes/${avaliacaoId}/submeter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respostas })
  });
  if (!res.ok) throw new Error("Erro ao submeter respostas");
  return res.json();
}
