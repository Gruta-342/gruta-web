import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

// CAMPOS QUE PODEM SER EXPOSTO PÚBLICAMENTE (sem e-mail, senha, etc.)
const PUBLIC_FIELDS = {
  id: true,
  name: true,
  image: true,
  roles: true,
  joined_date: true,
};

// GET /api/user/[id] - dados públicos de qualquer usuário
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}

// PATCH /api/user/[id] - edita apenas o próprio perfil (ou admin)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ message: "Não autorizado. Faça login." }, { status: 401 });
    }

    const viewerId = session.user.id;
    const isAdmin = Array.isArray(session.user.roles) && session.user.roles.includes("admin");

    // Só o próprio usuário ou um admin pode editar
    if (viewerId !== id && !isAdmin) {
      return NextResponse.json({ message: "Você não tem permissão para editar este perfil." }, { status: 403 });
    }

    const body = await request.json();
    const { name, image } = body;

    const dataToUpdate = {};
    if (typeof name === "string") dataToUpdate.name = name.trim() || null;
    if (typeof image === "string") dataToUpdate.image = image.trim() || null;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "Nenhum campo para atualizar." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: PUBLIC_FIELDS,
    });

    return NextResponse.json({ message: "Perfil atualizado com sucesso!", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
