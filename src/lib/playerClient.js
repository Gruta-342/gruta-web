export const PLAYER_PROGRESS_EVENT = "gruta-player-updated";

export async function fetchPlayerProgress() {
  const res = await fetch("/api/player/progress", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Falha ao carregar progresso do jogador.");
  }

  return res.json();
}

export async function saveGameCompletion({
  gameId,
  mode = "daily",
  dateKey,
  won = true,
  attempts = null,
  score = null,
  state = null,
  extra = null,
}) {
  const res = await fetch("/api/player/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameId,
      mode,
      dateKey,
      won,
      attempts,
      score,
      state,
      extra,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Erro ao salvar progresso.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PLAYER_PROGRESS_EVENT));
  }

  return data;
}