import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import TurmasClient from "./TurmasClient";

export default async function TurmasPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = session.user;

  return <TurmasClient userId={user.id} userRole={user.role} />;
}
