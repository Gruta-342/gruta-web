"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./JogosOnline.css";

const SHARED_DAILY_LOG_KEY = "gruta_daily_completed_log";
const TORCH_STORAGE_KEY = "gruta_player_torch";

function getIsoDateOffset(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayIsoKey() {
  return getIsoDateOffset(0);
}

function computeTorchState() {
  const today = getIsoDateOffset(0);
  const yesterday = getIsoDateOffset(-1);

  let completedToday = false;
  try {
    const rawLog = localStorage.getItem(SHARED_DAILY_LOG_KEY);
    const log = rawLog ? JSON.parse(rawLog) : {};
    if (
      log["termo-gruta"] === today ||
      log["cruzadinha-gruta"] === today ||
      log["morcegos-gruta"] === today
    ) {
      completedToday = true;
    }
    if (!completedToday) {
      const czRaw = localStorage.getItem("gruta_cruzadinha_daily_state");
      if (czRaw) {
        const czParsed = JSON.parse(czRaw);
        if (czParsed?.dateKey === today && czParsed?.isGameOver) {
          completedToday = true;
        }
      }
    }
  } catch (e) {}

  let stored = { currentDays: 0, recordDays: 0, lastLitDate: null };
  try {
    const raw = localStorage.getItem(TORCH_STORAGE_KEY);
    if (raw) {
      stored = { ...stored, ...JSON.parse(raw) };
    }
  } catch (e) {}

  let currentDays = Number(stored.currentDays) || 0;
  let recordDays = Number(stored.recordDays) || 0;
  let lastLitDate = stored.lastLitDate || null;
  let isLitToday = false;

  if (lastLitDate === today) {
    currentDays = Math.max(1, currentDays);
    isLitToday = true;
  } else if (completedToday) {
    if (lastLitDate === yesterday) {
      currentDays = currentDays + 1;
    } else {
      currentDays = 1;
    }
    lastLitDate = today;
    isLitToday = true;
  } else if (lastLitDate === yesterday) {
    isLitToday = false;
  } else {
    currentDays = 0;
    isLitToday = false;
  }

  if (currentDays > recordDays) {
    recordDays = currentDays;
  }

  const strength = currentDays >= 60 ? 3 : currentDays >= 30 ? 2 : 1;

  try {
    localStorage.setItem(
      TORCH_STORAGE_KEY,
      JSON.stringify({ currentDays, recordDays, lastLitDate })
    );
  } catch (e) {}

  return {
    currentDays,
    recordDays,
    strength,
    isLitToday
  };
}

export default function JogosOnline() {
  const router = useRouter();
  const [dailyCompleted, setDailyCompleted] = useState({
    "termo-gruta": false,
    "cruzadinha-gruta": false,
    "morcegos-gruta": false
  });
  const [torchData, setTorchData] = useState({
    currentDays: 0,
    recordDays: 0,
    strength: 1,
    isLitToday: false
  });
  const [showTorchModal, setShowTorchModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  const refreshStatus = useCallback(() => {
    if (typeof window === "undefined") return;
    const today = getTodayIsoKey();

    try {
      const rawLog = localStorage.getItem(SHARED_DAILY_LOG_KEY);
      const log = rawLog ? JSON.parse(rawLog) : {};

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

    setTorchData(computeTorchState());
  }, []);

  useEffect(() => {
    refreshStatus();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshStatus();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("storage", refreshStatus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", refreshStatus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [refreshStatus]);

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

  const nextMilestone = torchData.strength === 1 ? 30 : torchData.strength === 2 ? 60 : 60;
  const progressPercent =
    torchData.strength === 3
      ? 100
      : Math.min(100, Math.round((torchData.currentDays / nextMilestone) * 100));

  return (
    <section className="jogos-online-page">
      {toastMsg && <div className="jogos-toast">{toastMsg}</div>}

      {/* Barra de 3 Indicadores (Mobile — abaixo do cabeçalho) */}
      <div className="jogos-mobile-indicators-bar">
        {/* 1. Nível */}
        <button
          type="button"
          className="jogos-mob-ind-card ind-level"
          onClick={() => showToast("Sistema de Nível em breve!")}
        >
          <span className="jogos-mob-ind-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span className="jogos-mob-ind-value">Nv. 1</span>
        </button>

        {/* 2. Tocha */}
        <button
          type="button"
          className={`jogos-mob-ind-card ind-torch ${torchData.isLitToday ? "lit" : ""}`}
          onClick={() => {
            refreshStatus();
            setShowTorchModal(true);
          }}
        >
          <span className="jogos-mob-ind-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.5 2.2c.3 2.5-.8 4.6-2.3 6.2-1.1 1.2-1.9 2.4-1.9 4.1 0 1.4.9 2.6 2.2 3-.6-1.3-.3-2.9.8-3.9.5 1.5 1.8 2.4 2.1 4 .2 1.2-.2 2.4-1 3.2 2.6-.7 4.6-3.1 4.6-6 0-3.3-2-6.4-4.5-10.6zM9.2 11.4C7.3 13 6 15.2 6 17.6 6 20.6 8.7 23 12 23c1.1 0 2.1-.3 3-.8-1.9-.3-3.4-1.9-3.4-3.9 0-1.5.8-2.6 1.6-3.6-1.6-.4-3.2-1.6-4-3.3z" />
            </svg>
          </span>
          <span className="jogos-mob-ind-value">{torchData.currentDays}</span>
        </button>

        {/* 3. Moedas */}
        <button
          type="button"
          className="jogos-mob-ind-card ind-coins"
          onClick={() => showToast("Sistema de Moedas em breve!")}
        >
          <span className="jogos-mob-ind-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" />
            </svg>
          </span>
          <span className="jogos-mob-ind-value">0</span>
        </button>
      </div>

      {/* Grid de Jogos */}
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

      {/* Modal de Detalhes da Tocha (Mobile) */}
      {showTorchModal && (
        <div
          className="jogos-torch-modal-overlay"
          onClick={() => setShowTorchModal(false)}
        >
          <div className="jogos-torch-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="jogos-torch-close-btn"
              onClick={() => setShowTorchModal(false)}
              aria-label="Fechar"
            >
              ✕
            </button>

            <div className="jogos-torch-modal-header">
              <div className={`jogos-torch-big-flame ${torchData.isLitToday ? "lit" : ""}`}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 2.2c.3 2.5-.8 4.6-2.3 6.2-1.1 1.2-1.9 2.4-1.9 4.1 0 1.4.9 2.6 2.2 3-.6-1.3-.3-2.9.8-3.9.5 1.5 1.8 2.4 2.1 4 .2 1.2-.2 2.4-1 3.2 2.6-.7 4.6-3.1 4.6-6 0-3.3-2-6.4-4.5-10.6zM9.2 11.4C7.3 13 6 15.2 6 17.6 6 20.6 8.7 23 12 23c1.1 0 2.1-.3 3-.8-1.9-.3-3.4-1.9-3.4-3.9 0-1.5.8-2.6 1.6-3.6-1.6-.4-3.2-1.6-4-3.3z" />
                </svg>
              </div>
              <h2 className="jogos-torch-modal-title">TOCHA DA GRUTA</h2>
              <span className={`jogos-torch-status-tag ${torchData.isLitToday ? "lit" : ""}`}>
                {torchData.isLitToday
                  ? "ACESA HOJE"
                  : "APAGADA HOJE • COMPLETE UM DIÁRIO"}
              </span>
            </div>

            <div className="jogos-torch-stats-row">
              <div className="jogos-torch-stat-card">
                <span className="jogos-torch-stat-num">{torchData.currentDays}</span>
                <span className="jogos-torch-stat-label">
                  {torchData.currentDays === 1 ? "dia acesa" : "dias acesa"}
                </span>
              </div>

              <div className="jogos-torch-stat-card">
                <span className="jogos-torch-stat-num">{torchData.recordDays}</span>
                <span className="jogos-torch-stat-label">recorde de dias acesa</span>
              </div>
            </div>

            <div className="jogos-torch-strength-box">
              <div className="jogos-torch-strength-header">
                <span className="jogos-torch-strength-title">FORÇA DA TOCHA</span>
                <span className="jogos-torch-strength-badge">
                  Força {torchData.strength} de 3
                </span>
              </div>

              <div className="jogos-torch-strength-segments">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`jogos-torch-segment ${
                      torchData.strength >= lvl ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="jogos-torch-progress-track">
                <div
                  className="jogos-torch-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="jogos-torch-milestone-text">
                {torchData.strength === 1 &&
                  `Inicial: Força 1 • Complete 30 dias para Força 2 (${torchData.currentDays}/30)`}
                {torchData.strength === 2 &&
                  `Força 2 ativa • Complete 60 dias para Força 3 (${torchData.currentDays}/60)`}
                {torchData.strength === 3 &&
                  "Força 3 máxima alcançada (60+ dias com a tocha acesa)!"}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}