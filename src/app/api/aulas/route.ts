import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Aula } from "@/app/types/aula";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// ======================
// GET - Listar todas as aulas com materiais complementares
// ======================
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get("turma_id");

    let query = supabase
      .from("conteudos")
      .select(`
        id,
        titulo,
        descricao,
        turma_id,
        professor_id,
        materia_id,
        data_publicacao,
        data_entrega,
        aulas(
          plano_estudo,
          materiais_complementares!fk_material_aula(*)
        )
      `)
      .eq("tipo", "aula")
      .order("data_publicacao", { ascending: false });

    // Se turma_id for fornecida, filtra por turma
    if (turmaId) {
      query = query.eq("turma_id", turmaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar aulas:", error);
      return NextResponse.json({ error: "Erro ao buscar aulas" }, { status: 500 });
    }

    const aulas: Aula[] = data?.map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao,
      turma_id: item.turma_id,
      professor_id: item.professor_id,
      data_publicacao: item.data_publicacao,
      data_entrega: item.data_entrega,
      tipo: "aula",
      plano_estudo: item.aulas?.plano_estudo ?? "",
      materiais_complementares: item.aulas?.materiais_complementares ?? [],
      materia_id: item.materia_id ?? "",
    })) ?? [];

    return NextResponse.json(aulas, { status: 200 });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// ======================
// POST - Criar nova aula
// ======================
export async function POST(request: Request) {
  try {
    const body: Aula = await request.json();

    console.log("📥 Dados recebidos para criar aula:", body);

    if (!body?.titulo || !body?.turma_id || !body?.professor_id || !body?.plano_estudo || !body?.materia_id) {
      const camposFaltando = [];
      if (!body?.titulo) camposFaltando.push("titulo");
      if (!body?.turma_id) camposFaltando.push("turma_id");
      if (!body?.professor_id) camposFaltando.push("professor_id");
      if (!body?.plano_estudo) camposFaltando.push("plano_estudo");
      if (!body?.materia_id) camposFaltando.push("materia_id");

      console.error("❌ Campos faltando:", camposFaltando);
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${camposFaltando.join(", ")}` },
        { status: 400 }
      );
    }

    console.log("✅ Todos os campos obrigatórios presentes");

    // Gera um UUID para o conteúdo
    const conteudoId = crypto.randomUUID();
    console.log("🆔 UUID gerado para conteúdo:", conteudoId);

    // Cria conteúdo primeiro
    const dadosConteudo = {
      id: conteudoId,
      titulo: body.titulo,
      descricao: body.descricao,
      turma_id: body.turma_id,
      professor_id: body.professor_id,
      materia_id: body.materia_id,
      data_publicacao: body.data_publicacao ? new Date(body.data_publicacao).toISOString() : new Date().toISOString(),
      data_entrega: body.data_entrega ? new Date(body.data_entrega).toISOString() : null,
      tipo: "aula",
    };

    console.log("📤 Inserindo conteúdo:", dadosConteudo);

    const { data: conteudo, error: conteudoError } = await supabase
      .from("conteudos")
      .insert([dadosConteudo])
      .select()
      .single();

    if (conteudoError) {
      console.error("❌ Erro ao criar conteúdo:", conteudoError);
      return NextResponse.json({
        error: "Erro ao criar conteúdo da aula",
        details: conteudoError.message
      }, { status: 500 });
    }

    console.log("✅ Conteúdo criado:", conteudo);

    // Cria a aula vinculada ao conteúdo
    console.log("📤 Inserindo aula com id:", conteudo.id);

    const { data: aula, error: aulaError } = await supabase
      .from("aulas")
      .insert([{ id: conteudo.id, plano_estudo: body.plano_estudo }])
      .select()
      .single();

    if (aulaError) {
      console.error("❌ Erro ao criar aula:", aulaError);
      return NextResponse.json({
        error: "Erro ao criar registro de aula",
        details: aulaError.message
      }, { status: 500 });
    }

    console.log("✅ Aula criada com sucesso:", aula);

    return NextResponse.json({
      id: aula.id,
      titulo: conteudo.titulo,
      descricao: conteudo.descricao,
      turma_id: conteudo.turma_id,
      professor_id: conteudo.professor_id,
      materia_id: conteudo.materia_id,
      data_publicacao: conteudo.data_publicacao,
      data_entrega: conteudo.data_entrega,
      tipo: "aula",
      plano_estudo: aula.plano_estudo,
      materiais_complementares: [],
    }, { status: 201 });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// ======================
// PUT - Atualizar aula
// ======================
export async function PUT(request: Request) {
  try {
    const body: Aula = await request.json();
    if (!body?.id) return NextResponse.json({ error: "ID da aula é obrigatório" }, { status: 400 });

    // Atualiza conteúdo
    const { data: conteudo, error: conteudoError } = await supabase
      .from("conteudos")
      .update({
        titulo: body.titulo,
        descricao: body.descricao,
        turma_id: body.turma_id,
        professor_id: body.professor_id,
        materia_id: body.materia_id,
        data_publicacao: body.data_publicacao ? new Date(body.data_publicacao).toISOString() : null,
        data_entrega: body.data_entrega ? new Date(body.data_entrega).toISOString() : null,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (conteudoError) {
      console.error("Erro ao atualizar conteúdo:", conteudoError);
      return NextResponse.json({ error: "Erro ao atualizar aula" }, { status: 500 });
    }

    // Atualiza plano de estudo na tabela aulas
    const { data: aula, error: aulaError } = await supabase
      .from("aulas")
      .update({ plano_estudo: body.plano_estudo })
      .eq("id", body.id)
      .select()
      .single();

    if (aulaError) {
      console.error("Erro ao atualizar aula:", aulaError);
      return NextResponse.json({ error: "Erro ao atualizar aula" }, { status: 500 });
    }

    return NextResponse.json({
      id: aula.id,
      titulo: conteudo.titulo,
      descricao: conteudo.descricao,
      turma_id: conteudo.turma_id,
      professor_id: conteudo.professor_id,
      dataPublicacao: conteudo.data_publicacao,
      dataEntrega: conteudo.data_entrega,
      tipo: "aula",
      planoEstudo: aula.plano_estudo,
      materiais_complementares: [],
    }, { status: 200 });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// ======================
// DELETE - Remover aula
// ======================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    console.log("🗑️ Deletando aula com ID:", id);

    // Primeiro deleta os materiais complementares (se houver)
    const { error: materiaisError } = await supabase
      .from("materiais_complementares")
      .delete()
      .eq("aula_id", id);

    if (materiaisError) {
      console.error("❌ Erro ao deletar materiais:", materiaisError);
      // Continua mesmo se não houver materiais
    }

    // Depois deleta a aula
    const { error: aulaError } = await supabase
      .from("aulas")
      .delete()
      .eq("id", id);

    if (aulaError) {
      console.error("❌ Erro ao deletar aula:", aulaError);
      return NextResponse.json({
        error: "Erro ao deletar aula",
        details: aulaError.message
      }, { status: 500 });
    }

    // Por último deleta o conteúdo
    const { error: conteudoError } = await supabase
      .from("conteudos")
      .delete()
      .eq("id", id);

    if (conteudoError) {
      console.error("❌ Erro ao deletar conteúdo:", conteudoError);
      return NextResponse.json({
        error: "Erro ao deletar conteúdo",
        details: conteudoError.message
      }, { status: 500 });
    }

    console.log("✅ Aula deletada com sucesso");
    return NextResponse.json({ message: "Aula deletada com sucesso" }, { status: 200 });
  } catch (error) {
    console.error("❌ Erro no servidor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
