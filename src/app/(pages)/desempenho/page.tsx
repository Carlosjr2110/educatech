import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DesempenhoClient from "./DesempenhoClient";

export default async function DesempenhoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = session.user;

  return (
    <DesempenhoClient
      userRole={user.role}
      userId={user.id}
    />
  );
}
