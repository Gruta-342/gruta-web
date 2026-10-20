import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  // Verificação de segurança
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Consulta leve para registrar atividade no Supabase
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { message: 'Supabase da Gruta está ativo!' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao conectar no banco' },
      { status: 500 }
    );
  }
}