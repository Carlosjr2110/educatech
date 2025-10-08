export async function buscarDesempenho(alunoId?: string) {
  const url = alunoId ? `/api/desempenho?aluno_id=${alunoId}` : "/api/desempenho";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Erro na API de desempenho:", res.status, errorData);
    throw new Error(errorData.error || "Erro ao buscar desempenho");
  }
  return res.json();
}

export async function buscarAlunosProfessor() {
  const res = await fetch("/api/desempenho/alunos", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao buscar alunos");
  return res.json();
}

export async function buscarFilhosResponsavel() {
  // API para responsável buscar seus filhos
  const res = await fetch("/api/responsaveis/filhos", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}
