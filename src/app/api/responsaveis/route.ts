// app/api/responsaveis/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("responsaveis")
    .select("user_id, telefone, usuarios(name, email, created_at)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = data.map((r: any) => ({
    id: r.user_id,
    name: r.usuarios.name,
    email: r.usuarios.email,
    role: 'responsavel' as const,
    password: '',
    created_at: r.usuarios.created_at,
    telefone: r.telefone,
    filhos: []
  }));

  return NextResponse.json(formatted);
}
