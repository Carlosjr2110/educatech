import { MaterialComplementar } from "@/app/types/aula";

export async function uploadArquivo(file: File, tipo: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipo", tipo);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao fazer upload");
  }

  const data = await res.json();
  return data.url;
}

export async function buscarMateriaisAula(aulaId: string): Promise<MaterialComplementar[]> {
  const res = await fetch(`/api/materiais?aula_id=${aulaId}`);

  if (!res.ok) {
    throw new Error("Erro ao buscar materiais");
  }

  return res.json();
}

export async function criarMaterial(material: Omit<MaterialComplementar, "id">): Promise<MaterialComplementar> {
  const res = await fetch("/api/materiais", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(material),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao criar material");
  }

  return res.json();
}

export async function deletarMaterial(id: string): Promise<void> {
  const res = await fetch(`/api/materiais?id=${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao deletar material");
  }
}
