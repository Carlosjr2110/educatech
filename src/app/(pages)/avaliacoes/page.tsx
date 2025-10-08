import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AvaliacoesClient from "./AvaliacoesClient";

export default async function AvaliacoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = session.user;

  // Buscar matérias do professor ou da turma do aluno
  let materias: any[] = [];

  if (user.role === "professor") {
    const { data } = await supabase
      .from("materias")
      .select("*")
      .eq("professor_id", user.id);
    materias = data || [];
  } else if (user.role === "aluno") {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("turma_id")
      .eq("user_id", user.id)
      .single();

    if (alunoData?.turma_id) {
      const { data } = await supabase
        .from("materias")
        .select("*")
        .eq("turma_id", alunoData.turma_id);
      materias = data || [];
    }
  }

  return (
    <AvaliacoesClient
      userRole={user.role}
      userId={user.id}
      materias={materias}
    />
  );
}
