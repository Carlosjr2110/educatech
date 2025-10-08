// app/api/turmas/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const professorId = searchParams.get("professor_id");

  let query = supabase.from("turmas").select("*");

  // Se professor_id for fornecido, busca turmas onde o professor leciona
  if (professorId) {
    // Busca turmas que têm matérias lecionadas por este professor
    const { data: materias } = await supabase
      .from("materias")
      .select("turma_id")
      .eq("professor_id", professorId);

    if (materias && materias.length > 0) {
      const turmaIds = [...new Set(materias.map(m => m.turma_id))];
      query = query.in("id", turmaIds);
    } else {
      // Se não leciona em nenhuma turma, retorna array vazio
      return NextResponse.json([]);
    }
  }

  const { data, error } = await query.order("nome", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
