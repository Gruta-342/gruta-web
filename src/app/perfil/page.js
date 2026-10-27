import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Meu Perfil | Gruta",
  description: "Acesse o seu perfil de usuário na Gruta Game House.",
};

export default async function MeuPerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  redirect(`/perfil/${session.user.id}`);
}
