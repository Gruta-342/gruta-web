import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(games);
  } catch (error) {
    console.error("Erro ao buscar jogos:", error);
    return NextResponse.json({ error: "Erro ao buscar jogos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Acesso Negado. Apenas administradores." }, { status: 403 });
    }

    const data = await request.json();
    const game = await prisma.game.create({
      data: {
        title: data.title,
        category: data.category,
        image: data.image,
        badge: data.badge || null,
        is_visible: data.is_visible !== undefined ? data.is_visible : true,
      },
    });
    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar jogo:", error);
    return NextResponse.json({ error: "Erro ao criar jogo" }, { status: 500 });
  }
}