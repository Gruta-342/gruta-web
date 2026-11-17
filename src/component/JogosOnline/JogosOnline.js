"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./JogosOnline.css";

const SHARED_DAILY_LOG_KEY = "gruta_daily_completed_log";

function getTodayIsoKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function JogosOnline() {
  const router = useRouter();
  const [dailyCompleted, setDailyCompleted] = useState({
    "termo-gruta": false,
    "cruzadinha-gruta": false,
    "morcegos-gruta": false
  });

  const refreshDailyStatus = useCallback(() => {
    if (typeof window === "undefined") return;
    const today = getTodayIsoKey();

    try {
      const rawLog = localStorage.getItem(SHARED_DAILY_LOG_KEY);
      const log = rawLog ? JSON.parse(rawLog) : {};

      // Também verifica a chave específica da Cruzadinha como fallback
      let cruzadinhaDone = log["cruzadinha-gruta"] === today;
      if (!cruzadinhaDone) {
        const czRaw = localStorage.getItem("gruta_cruzadinha_daily_state");
        if (czRaw) {
          const czParsed = JSON.parse(czRaw);
          if (czParsed?.dateKey === today && czParsed?.isGameOver) {
            cruzadinhaDone = true;
          }
        }
      }

      setDailyCompleted({
        "termo-gruta": log["termo-gruta"] === today,
        "cruzadinha-gruta": cruzadinhaDone,
        "morcegos-gruta": log["morcegos-gruta"] === today
      });
    } catch (e) {
      console.error("Erro ao verificar status diário:", e);
    }
  }, []);

  useEffect(() => {
    refreshDailyStatus();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshDailyStatus();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("storage", refreshDailyStatus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", refreshDailyStatus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [refreshDailyStatus]);

  const grutaPlayableGames = [
    {
      id: "termo-gruta",
      title: "Termo da Gruta",
      image: "/assets/games/termo.jpg",
      status: "playable",
      hasDaily: true,
      action: () => router.push("/jogos/termo")
    },
    {
      id: "cruzadinha-gruta",
      title: "Cruzadinha",
      image: "/assets/games/cruzadinha.jpg",
      status: "playable",
      hasDaily: true,
      action: () => router.push("/jogos/cruzadinha")
    },
    {
      id: "morcegos-gruta",
      title: "Caça Morcegos",
      image: "/assets/games/morcegos.jpg",
      status: "playable",
      hasDaily: true,
      action: () => router.push("/jogos/morcegos")
    },
    {
      id: "dados-gruta",
      title: "Dados",
      image: "/assets/games/d20.jpg",
      status: "playable",
      hasDaily: false,
      action: () => router.push("/jogos/dados")
    }
  ];

  return (
    <section className="jogos-online-page">
      <div className="jogos-online-header">
        <h1 className="jogos-online-title">Jogos da Gruta</h1>
        <p className="jogos-online-intro">
          Aqui a competição também acontece online. Divirta-se com nossos minigames.
        </p>
      </div>

      <div className="playable-games-grid">
        {grutaPlayableGames.map((game) => {
          const isDailyDone = game.hasDaily && dailyCompleted[game.id];

          return (
            <div key={game.id} className="playable-card" onClick={game.action}>
              <div className="playable-media-wrapper">
                <img
                  src={game.image}
                  alt={game.title}
                  className="playable-media-img"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/logo.png";
                  }}
                />

                {isDailyDone && (
                  <span
                    className="playable-daily-done-badge"
                    title="Desafio Diário de hoje concluído"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>DIÁRIO FEITO</span>
                  </span>
                )}

                {game.status !== "playable" && (
                  <span className="playable-status-badge status-dev">EM BREVE</span>
                )}
              </div>

              <div className="playable-title-bar">
                <h3>{game.title}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}