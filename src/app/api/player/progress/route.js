import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";
import { getBrazilDateKey, computeTorchFromProfile } from "../../../../lib/playerDate";

const ALLOWED_GAMES = new Set([
  "termo-gruta",
  "cruzadinha-gruta",
  "morcegos-gruta",
  "dados-gruta",
]);

async function buildProgressPayload(userId) {
  const today = getBrazilDateKey(0);
  const yesterday = getBrazilDateKey(-1);

  const profile = await prisma.playerProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const torch = computeTorchFromProfile(profile, today, yesterday);

  if (torch.streakBroken && profile.torchCurrentDays !== 0) {
    await prisma.playerProfile.update({
      where: { userId },
      data: { torchCurrentDays: 0 },
    });
  }

  const [todayCompletions, allStats] = await Promise.all([
    prisma.dailyCompletion.findMany({
      where: { userId, dateKey: today },
      select: {
        gameId: true,
        won: true,
        attempts: true,
        score: true,
        state: true,
        completedAt: true,
      },
    }),
    prisma.gameStat.findMany({
      where: { userId },
      select: {
        gameId: true,
        played: true,
        wins: true,
        currentStreak: true,
        maxStreak: true,
        extra: true,
      },
    }),
  ]);

  const dailyCompleted = {
    "termo-gruta": false,
    "cruzadinha-gruta": false,
    "morcegos-gruta": false,
  };
  const dailyStates = {};

  for (const item of todayCompletions) {
    dailyCompleted[item.gameId] = true;
    dailyStates[item.gameId] = item;
  }

  const stats = {};
  for (const stat of allStats) {
    stats[stat.gameId] = stat;
  }

  return {
    today,
    level: profile.level,
    xp: profile.xp,
    coins: profile.coins,
    torch: {
      currentDays: torch.currentDays,
      recordDays: torch.recordDays,
      strength: torch.strength,
      isLitToday: torch.isLitToday,
      lastLitDate: torch.lastLitDate,
    },
    dailyCompleted,
    dailyStates,
    stats,
  };
}

// GET /api/player/progress
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { authenticated: false, progress: null },
        { status: 200 }
      );
    }

    const progress = await buildProgressPayload(session.user.id);

    return NextResponse.json(
      { authenticated: true, progress },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar progresso do jogador:", error);
    return NextResponse.json(
      { message: "Erro interno ao carregar progresso." },
      { status: 500 }
    );
  }
}

// POST /api/player/progress
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Faça login para salvar seu progresso." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      gameId,
      mode = "daily",
      dateKey,
      won = true,
      attempts = null,
      score = null,
      state = null,
      extra = null,
    } = body;

    if (!gameId || !ALLOWED_GAMES.has(gameId)) {
      return NextResponse.json(
        { message: "Jogo inválido." },
        { status: 400 }
      );
    }

    const today = getBrazilDateKey(0);
    const yesterday = getBrazilDateKey(-1);
    const effectiveDateKey = mode === "daily" ? dateKey || today : null;

    let alreadyCompleted = false;

    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.playerProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        if (mode === "daily") {
          const existing = await tx.dailyCompletion.findUnique({
            where: {
              userId_gameId_dateKey: {
                userId,
                gameId,
                dateKey: effectiveDateKey,
              },
            },
          });

          if (existing) {
            alreadyCompleted = true;
            if (state && !existing.state) {
              await tx.dailyCompletion.update({
                where: { id: existing.id },
                data: { state },
              });
            }
            return;
          }

          await tx.dailyCompletion.create({
            data: {
              userId,
              gameId,
              dateKey: effectiveDateKey,
              won: Boolean(won),
              attempts: typeof attempts === "number" ? attempts : null,
              score: typeof score === "number" ? score : null,
              state: state ?? undefined,
            },
          });
        }

        // Atualiza estatísticas acumuladas por jogo
        const existingStat = await tx.gameStat.findUnique({
          where: { userId_gameId: { userId, gameId } },
        });

        const nextPlayed = (existingStat?.played || 0) + 1;
        const nextWins = (existingStat?.wins || 0) + (won ? 1 : 0);
        const nextCurrentStreak = won ? (existingStat?.currentStreak || 0) + 1 : 0;
        const nextMaxStreak = Math.max(existingStat?.maxStreak || 0, nextCurrentStreak);

        await tx.gameStat.upsert({
          where: { userId_gameId: { userId, gameId } },
          update: {
            played: nextPlayed,
            wins: nextWins,
            currentStreak: nextCurrentStreak,
            maxStreak: nextMaxStreak,
            ...(extra ? { extra } : {}),
          },
          create: {
            userId,
            gameId,
            played: 1,
            wins: won ? 1 : 0,
            currentStreak: won ? 1 : 0,
            maxStreak: won ? 1 : 0,
            ...(extra ? { extra } : {}),
          },
        });

        // Atualiza Tocha (apenas no modo diário), XP, Nível e Moedas
        let nextTorchCurrent = profile.torchCurrentDays;
        let nextTorchRecord = profile.torchRecordDays;
        let nextTorchLastLit = profile.torchLastLitDate;

        if (mode === "daily" && profile.torchLastLitDate !== effectiveDateKey) {
          if (profile.torchLastLitDate === yesterday) {
            nextTorchCurrent = profile.torchCurrentDays + 1;
          } else {
            nextTorchCurrent = 1;
          }
          nextTorchLastLit = effectiveDateKey;
          nextTorchRecord = Math.max(nextTorchRecord, nextTorchCurrent);
        }

        const gainedXp = mode === "daily" ? (won ? 50 : 20) : won ? 15 : 5;
        const gainedCoins = mode === "daily" ? (won ? 10 : 3) : won ? 3 : 0;

        const nextXp = profile.xp + gainedXp;
        const nextLevel = Math.floor(nextXp / 200) + 1;
        const nextCoins = profile.coins + gainedCoins;

        await tx.playerProfile.update({
          where: { userId },
          data: {
            level: nextLevel,
            xp: nextXp,
            coins: nextCoins,
            torchCurrentDays: nextTorchCurrent,
            torchRecordDays: nextTorchRecord,
            torchLastLitDate: nextTorchLastLit,
          },
        });
      });
    } catch (txError) {
      // Se duas requisições simultâneas colidirem na chave única (P2002), trata como idempotente
      if (txError?.code === "P2002") {
        alreadyCompleted = true;
      } else {
        throw txError;
      }
    }

    const progress = await buildProgressPayload(userId);

    return NextResponse.json(
      {
        authenticated: true,
        alreadyCompleted,
        progress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao salvar progresso do jogador:", error);
    return NextResponse.json(
      { message: "Erro interno ao salvar progresso." },
      { status: 500 }
    );
  }
}