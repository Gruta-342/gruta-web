import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route"; 
import { prisma } from "../../../../../lib/prisma";

// EDITAR EVENTO (PUT)
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { id } = params; // Pega o ID da URL
    const data = await req.json();

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        category: data.category,
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao atualizar evento." }, { status: 500 });
  }
}

// EXCLUIR EVENTO (DELETE)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { id } = params;

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Evento excluído com sucesso." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao excluir evento." }, { status: 500 });
  }
}