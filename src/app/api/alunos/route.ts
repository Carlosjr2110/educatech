import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("alunos")
    .select(`
      user_id, matricula, turma_id, responsavel_id,
      usuarios(name, email, created_at)
    `);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = data.map((a: any) => ({
    id: a.user_id,
    name: a.usuarios.name,
    email: a.usuarios.email,
    role: 'aluno' as const,
    password: '',
    created_at: a.usuarios.created_at,
    matricula: a.matricula,
    turma_id: a.turma_id,
    responsavel_id: a.responsavel_id
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, matricula, turma_id, responsavel_id } = body;

  // Criar usuário
  const { data: userData, error: userError } = await supabase
    .from("usuarios")
    .insert([{ name, email, password, role: "aluno" }])
    .select("id")
    .single();

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  // Criar aluno
  const { error: alunoError } = await supabase
    .from("alunos")
    .insert([{ user_id: userData.id, matricula, turma_id, responsavel_id }]);

  if (alunoError) return NextResponse.json({ error: alunoError.message }, { status: 500 });

  return NextResponse.json({ success: true, id: userData.id });
}
