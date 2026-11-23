"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchPlayerProgress, PLAYER_PROGRESS_EVENT } from "../../lib/playerClient";
import "./Header.css";
import AuthButton from "../AuthButton/AuthButton";

const DEFAULT_TORCH = {
  currentDays: 0,
  recordDays: 0,
  strength: 1,
  isLitToday: false,
};

export default function Header() {
  const { status } = useSession();
  const isGuest = status === "unauthenticated";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [torchData, setTorchData] = useState(DEFAULT_TORCH);
  const [showTorchModal, setShowTorchModal] = useState(false);
  const [headerToast, setHeaderToast] = useState(null);

  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, "") || "";
  const isJogosHub = normalizedPath === "/jogos";
  const isSobre = normalizedPath.includes("/sobre");

  const syncPlayerHeader = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setLevel(1);
      setCoins(0);
      setTorchData(DEFAULT_TORCH);
      return;
    }

    try {
      const data = await fetchPlayerProgress();
      if (data?.authenticated && data?.progress) {
        const p = data.progress;
        setLevel(p.level || 1);
        setCoins(p.coins || 0);
        setTorchData({
          ...DEFAULT_TORCH,
          ...(p.torch || {}),
        });
      }
    } catch (e) {
      console.error("Erro ao sincronizar indicadores no Header:", e);
    }
  }, [status]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isJogosHub) return;
    syncPlayerHeader();

    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        syncPlayerHeader();
      }
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener(PLAYER_PROGRESS_EVENT, syncPlayerHeader);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener(PLAYER_PROGRESS_EVENT, syncPlayerHeader);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [isJogosHub, syncPlayerHeader]);

  // Oculta o cabeçalho completamente nas subpáginas de jogos (/jogos/termo, etc.)
  if (normalizedPath.startsWith("/jogos/")) return null;

  const showQuickToast = (msg) => {
    setHeaderToast(msg);
    setTimeout(() => {
      setHeaderToast((curr) => (curr === msg ? null : curr));
    }, 2400);
  };

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "ACERVO", path: "/acervo" },
    { name: "JOGOS", path: "/jogos" },
    { name: "GALERIA", path: "/galeria" },
    { name: "SOBRE", path: "/sobre" },
  ];

  const headerClass = `header-container ${
    isScrolled && !isSobre && !isJogosHub ? "scrolled" : ""
  } ${isSobre ? "is-sobre-page" : ""} ${isJogosHub ? "is-jogos-page" : ""}`;

  const nextMilestone = torchData.strength === 1 ? 30 : torchData.strength === 2 ? 60 : 60;
  const progressPercent =
    torchData.strength === 3
      ? 100
      : Math.min(100, Math.round((torchData.currentDays / nextMilestone) * 100));

  return (
    <>
      {headerToast && <div className="gruta-header-toast">{headerToast}</div>}

      <header className={headerClass}>
        <div className="top-bar">
          <div className="left-section">
            {isJogosHub ? (
              <div className="desktop-profile-left">
                <AuthButton />
              </div>
            ) : (
              <p className="header-slogan desktop-slogan">
                Onde o caos vira história
                <br />e a zoeira é tradição.
              </p>
            )}

            <div className="mobile-profile-left">
              <AuthButton />
            </div>
          </div>

          <div className="center-section">
            <Link href="/" className="header-logo-link">
              <img src="/assets/logo.png" alt="Logo Gruta" className="desktop-logo" />
              <img src="/assets/logo.png" alt="Logo Gruta" className="mobile-logo" />
            </Link>
          </div>

          <div className="right-section">
            {isJogosHub ? (
              <div className="desktop-jogos-indicators">
                {/* 1. Nível */}
                <button
                  type="button"
                  className="gruta-ind-pill ind-level"
                  onClick={() =>
                    isGuest
                      ? showQuickToast("Faça login para evoluir seu nível!")
                      : showQuickToast("Sistema de Nível em breve!")
                  }
                  title="Nível do Jogador"
                >
                  <span className="gruta-ind-icon-circle">
                    <svg
                      width="15"
                      height="15"
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
                  <span className="gruta-ind-value">Nv. {level}</span>
                </button>

                {/* 2. Tocha */}
                <button
                  type="button"
                  className={`gruta-ind-pill ind-torch ${torchData.isLitToday ? "lit" : ""}`}
                  onClick={() => {
                    syncPlayerHeader();
                    setShowTorchModal(true);
                  }}
                  title="Tocha da Gruta — Clique para ver detalhes"
                >
                  <span className="gruta-ind-icon-circle">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M13.5 2.2c.3 2.5-.8 4.6-2.3 6.2-1.1 1.2-1.9 2.4-1.9 4.1 0 1.4.9 2.6 2.2 3-.6-1.3-.3-2.9.8-3.9.5 1.5 1.8 2.4 2.1 4 .2 1.2-.2 2.4-1 3.2 2.6-.7 4.6-3.1 4.6-6 0-3.3-2-6.4-4.5-10.6zM9.2 11.4C7.3 13 6 15.2 6 17.6 6 20.6 8.7 23 12 23c1.1 0 2.1-.3 3-.8-1.9-.3-3.4-1.9-3.4-3.9 0-1.5.8-2.6 1.6-3.6-1.6-.4-3.2-1.6-4-3.3z" />
                    </svg>
                  </span>
                  <span className="gruta-ind-value">{torchData.currentDays}</span>
                </button>

                {/* 3. Moedas */}
                <button
                  type="button"
                  className="gruta-ind-pill ind-coins"
                  onClick={() =>
                    isGuest
                      ? showQuickToast("Faça login para acumular moedas!")
                      : showQuickToast("Sistema de Moedas em breve!")
                  }
                  title="Moedas da Gruta"
                >
                  <span className="gruta-ind-icon-circle">
                    <svg
                      width="15"
                      height="15"
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
                  <span className="gruta-ind-value">{coins}</span>
                </button>
              </div>
            ) : (
              <div className="desktop-profile">
                <AuthButton />
              </div>
            )}

            <button
              className="hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="separator"></div>

        <nav className={`bottom-nav ${isMobileMenuOpen ? "open" : ""}`}>
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.path}
                  className={pathname === item.path ? "active" : ""}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Modal de Detalhes da Tocha (Desktop) */}
      {isJogosHub && showTorchModal && (
        <div
          className="gruta-torch-modal-overlay"
          onClick={() => setShowTorchModal(false)}
        >
          <div className="gruta-torch-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gruta-torch-close-btn"
              onClick={() => setShowTorchModal(false)}
              aria-label="Fechar"
            >
              ✕
            </button>

            <div className="gruta-torch-modal-header">
              <div className={`gruta-torch-big-flame ${torchData.isLitToday ? "lit" : ""}`}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 2.2c.3 2.5-.8 4.6-2.3 6.2-1.1 1.2-1.9 2.4-1.9 4.1 0 1.4.9 2.6 2.2 3-.6-1.3-.3-2.9.8-3.9.5 1.5 1.8 2.4 2.1 4 .2 1.2-.2 2.4-1 3.2 2.6-.7 4.6-3.1 4.6-6 0-3.3-2-6.4-4.5-10.6zM9.2 11.4C7.3 13 6 15.2 6 17.6 6 20.6 8.7 23 12 23c1.1 0 2.1-.3 3-.8-1.9-.3-3.4-1.9-3.4-3.9 0-1.5.8-2.6 1.6-3.6-1.6-.4-3.2-1.6-4-3.3z" />
                </svg>
              </div>
              <h2 className="gruta-torch-modal-title">TOCHA DA GRUTA</h2>
              <span className={`gruta-torch-status-tag ${torchData.isLitToday ? "lit" : ""}`}>
                {isGuest
                  ? "FAÇA LOGIN PARA ACENDER A TOCHA"
                  : torchData.isLitToday
                  ? "ACESA HOJE"
                  : "APAGADA HOJE • COMPLETE UM DIÁRIO"}
              </span>
            </div>

            {isGuest && (
              <div className="gruta-torch-guest-box">
                <p>
                  Entre na sua conta para salvar sua sequência de dias e sincronizar entre seus dispositivos.
                </p>
                <Link
                  href="/login"
                  className="gruta-torch-login-btn"
                  onClick={() => setShowTorchModal(false)}
                >
                  Fazer login
                </Link>
              </div>
            )}

            <div className="gruta-torch-stats-row">
              <div className="gruta-torch-stat-card">
                <span className="gruta-torch-stat-num">{torchData.currentDays}</span>
                <span className="gruta-torch-stat-label">
                  {torchData.currentDays === 1 ? "dia acesa" : "dias acesa"}
                </span>
              </div>

              <div className="gruta-torch-stat-card">
                <span className="gruta-torch-stat-num">{torchData.recordDays}</span>
                <span className="gruta-torch-stat-label">recorde de dias acesa</span>
              </div>
            </div>

            <div className="gruta-torch-strength-box">
              <div className="gruta-torch-strength-header">
                <span className="gruta-torch-strength-title">FORÇA DA TOCHA</span>
                <span className="gruta-torch-strength-badge">
                  Força {torchData.strength} de 3
                </span>
              </div>

              <div className="gruta-torch-strength-segments">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`gruta-torch-segment ${
                      torchData.strength >= lvl ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="gruta-torch-progress-track">
                <div
                  className="gruta-torch-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="gruta-torch-milestone-text">
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
    </>
  );
}