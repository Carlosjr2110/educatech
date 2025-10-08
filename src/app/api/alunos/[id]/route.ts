import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { name, email, matricula, responsavel_id } = body;

  // Atualizar usuario
  const { error: userError } = await supabase
    .from("usuarios")
    .update({ name, email })
    .eq("id", id);

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  // Atualizar aluno
  const { error: alunoError } = await supabase
    .from("alunos")
    .update({ matricula, responsavel_id })
    .eq("user_id", id);

  if (alunoError) return NextResponse.json({ error: alunoError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Deletar aluno
  const { error: alunoError } = await supabase
    .from("alunos")
    .delete()
    .eq("user_id", id);

  if (alunoError) return NextResponse.json({ error: alunoError.message }, { status: 500 });

  // Deletar usuário
  const { error: userError } = await supabase
    .from("usuarios")
    .delete()
    .eq("id", id);

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
