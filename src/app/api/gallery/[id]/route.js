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
    
    const photo = await prisma.gallery.update({
      where: { id },
      data: {
        img: data.img,
        caption: data.caption,
        date: data.date,
        tags: data.tags,
        isHallOfFame: data.isHallOfFame,
        aspect: data.aspect,
        is_visible: data.is_visible,
      }
    });
    return NextResponse.json(photo);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar foto" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const { id } = await params;
    await prisma.gallery.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar foto" }, { status: 500 });
  }
}