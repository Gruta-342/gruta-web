import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { items } = await request.json(); // Recebe um array: [{ id: "...", order: 0 }, { id: "...", order: 1 }]
    
    // Atualiza todos os itens recebidos de uma vez só usando uma transação do Prisma
    const transactions = items.map((item) =>
      prisma.game.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );
    
    await prisma.$transaction(transactions);
    
    return NextResponse.json({ success: true, message: "Ordem atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao reordenar jogos:", error);
    return NextResponse.json({ error: "Erro ao atualizar a ordem" }, { status: 500 });
  }
}