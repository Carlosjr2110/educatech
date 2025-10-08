import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EstudantesClient from "./EstudantesClient";

export default async function EstudantesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  // Apenas responsaveis podem acessar esta pagina
  if (session.user.role !== "responsavel") {
    redirect("/dashboard");
  }

  return <EstudantesClient userId={session.user.id} />;
}
