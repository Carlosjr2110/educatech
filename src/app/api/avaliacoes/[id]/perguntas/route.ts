import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("perguntas")
    .select("*")
    .eq("avaliacao_id", id);

  if (error) {
    console.error("Erro ao buscar perguntas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Se for aluno, não retorna as respostas corretas
  if (session.user.role === "aluno") {
    const perguntasSemResposta = data.map(p => ({
      ...p,
      resposta_correta: undefined
    }));
    return NextResponse.json(perguntasSemResposta);
  }

  return NextResponse.json(data);
}
