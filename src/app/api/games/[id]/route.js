import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    
    const game = await prisma.game.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        image: data.image,
        badge: data.badge || null,
        is_visible: data.is_visible,
      },
    });
    return NextResponse.json(game);
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    return NextResponse.json({ error: "Erro ao atualizar jogo" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { id } = await params;
    
    await prisma.game.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Jogo deletado." });
  } catch (error) {
    console.error("Erro ao deletar jogo:", error);
    return NextResponse.json({ error: "Erro ao deletar jogo" }, { status: 500 });
  }
}