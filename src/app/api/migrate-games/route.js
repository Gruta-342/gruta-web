import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { gamesData } from "../../../data/games";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Acesso Negado. Apenas administradores." }, { status: 403 });
    }

    // Mapeia os dados do arquivo para o formato que o banco de dados espera
    const formattedGames = gamesData.map((game) => ({
      title: game.title,
      category: game.category,
      image: game.image, // Por enquanto, salva o caminho local (ex: /assets/games/dbd.jpg)
      badge: game.badge || null,
      is_visible: true,
    }));

    // Insere todos os registros de uma vez no banco
    const result = await prisma.game.createMany({
      data: formattedGames,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Jogos migrados com sucesso!", 
      inseridos: result.count 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro na migração." }, { status: 500 });
  }
}