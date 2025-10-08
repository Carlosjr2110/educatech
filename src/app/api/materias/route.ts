import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Exemplo Next.js API
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turma_id");

  let query = supabase
    .from("materias")
    .select(`
      id,
      nome,
      turma_id,
      professor_id,
      conteudos(
        id,
        titulo,
        descricao,
        data_publicacao,
        data_entrega,
        tipo,
        aulas(
          plano_estudo,
          materiais_complementares(*)
        )
      )
    `);

  // Se turma_id for fornecida, filtra por turma
  if (turmaId) {
    query = query.eq("turma_id", turmaId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "Erro ao buscar matérias" }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}
