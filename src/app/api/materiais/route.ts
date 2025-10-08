import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET - Buscar materiais de uma aula
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get("aula_id");

    if (!aulaId) {
      return NextResponse.json({ error: "aula_id é obrigatório" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("materiais_complementares")
      .select("*")
      .eq("aula_id", aulaId)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar materiais:", error);
      return NextResponse.json({ error: "Erro ao buscar materiais" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST - Criar novo material
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { aula_id, nome, tipo, url } = body;

    if (!aula_id || !nome || !tipo || !url) {
      return NextResponse.json(
        { error: "Campos obrigatórios: aula_id, nome, tipo, url" },
        { status: 400 }
      );
    }

    const materialId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("materiais_complementares")
      .insert([{
        id: materialId,
        aula_id,
        nome,
        tipo,
        url,
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar material:", error);
      return NextResponse.json({ error: "Erro ao criar material" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE - Deletar material
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("materiais_complementares")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar material:", error);
      return NextResponse.json({ error: "Erro ao deletar material" }, { status: 500 });
    }

    return NextResponse.json({ message: "Material deletado com sucesso" });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
