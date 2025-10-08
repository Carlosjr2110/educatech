import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import PlanoAulasClient from "./PlanoAulasClient";
import { supabase } from "@/lib/supabase";

export default async function PlanoAulas() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = session.user;

  // Buscar turma_id do aluno logado
  let turmaId: string | null = null;

  if (user.role === "aluno") {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("turma_id")
      .eq("user_id", user.id)
      .single();

    turmaId = alunoData?.turma_id || null;
  }

  return (
    <PlanoAulasClient
      userRole={user.role as "aluno" | "professor" | "responsavel"}
      turmaId={turmaId}
      userId={user.id}
    />
  );
}
