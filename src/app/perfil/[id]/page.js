import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import Perfil from "../../../component/Perfil/Perfil";

export const metadata = {
  title: "Perfil | Gruta",
  description: "Veja e edite o seu perfil de usuário na Gruta Game House.",
};

export default async function PerfilPage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id || null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      roles: true,
      joined_date: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isOwn = viewerId !== null && viewerId === user.id;

  return (
    <Perfil user={user} isOwn={isOwn} viewerId={viewerId} />
  );
}
