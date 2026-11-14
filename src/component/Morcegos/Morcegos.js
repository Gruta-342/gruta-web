"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Morcegos.css";

const REGION_COLORS = [
  "#1E88E5", // Azul Vivo
  "#43A047", // Verde Vivo
  "#D81B60", // Rosa/Magenta Vivo
  "#8E24AA", // Roxo Profundo
  "#F4511E", // Laranja Escuro
  "#FFB300", // Âmbar/Amarelo Vivo
  "#00ACC1", // Ciano Vivo
  "#7CB342"  // Verde Lima
];

const GAME_MODES = {
  DAILY: { id: "DAILY", size: 8, label: "Diário", dropdownLabel: "DIÁRIO" },
  NORMAL: { id: "NORMAL", size: 6, label: "Normal (6x6)", dropdownLabel: "NORMAL (6X6)" },
  HARD: { id: "HARD", size: 8, label: "Difícil (8x8)", dropdownLabel: "DIFÍCIL (8X8)" }
};

const STATS_STORAGE_KEY = "gruta_morcegos_stats";
const DAILY_STATE_KEY = "gruta_morcegos_daily_state";
const LIVES = 3;

const INITIAL_STATS = {
  DAILY: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, livesDist: { 3: 0, 2: 0, 1: 0 } },
  NORMAL: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, livesDist: { 3: 0, 2: 0, 1: 0 } },
  HARD: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, livesDist: { 3: 0, 2: 0, 1: 0 } }
};

const BatSvg = () => (
  <svg
    viewBox="0 0 256 256"
    width="65%"
    height="65%"
    fill="#ffffff"
    style={{ filter: "drop-shadow(0px 3px 5px rgba(0,0,0,0.6))" }}
  >
    <path d="M239.5,91.8c-1.6-1.5-3.8-2.1-6-1.5c-15.6,4-33.8,4.2-51.5-0.9c-8.9-2.6-18.4-7.4-27.5-13.8c-6.1-4.3-12.7-9.5-19.4-15c-1.9-1.5-4.5-1.5-6.4,0c-6.7,5.5-13.3,10.7-19.4,15c-9.1,6.4-18.6,11.2-27.5,13.8C64.1,94.5,45.9,94.3,30.3,90.3c-2.2-0.6-4.4,0-6,1.5c-1.6,1.5-2.2,3.8-1.5,6c6.2,20.2,16.6,38.1,30.4,52.3c2.7,2.8,7.3,2,9.1-1.6c3.2-6.5,7.3-12.7,12.3-18.5c5.3-6,11.3-11.4,18-16.1c11.9,8,22.6,18.4,30.6,30.5c1.4,2.2,4.2,2.5,6,0.6c1.2-1.3,2.4-2.6,3.6-4.1c1.2,1.5,2.4,2.8,3.6,4.1c1.8,1.9,4.6,1.6,6-0.6c8-12.1,18.7-22.5,30.6-30.5c6.7,4.7,12.7,10.1,18,16.1c5,5.8,9.1,12,12.3,18.5c1.8,3.6,6.4,4.4,9.1,1.6c13.8-14.2,24.2-32.1,30.4-52.3C241.7,95.6,241.1,93.3,239.5,91.8z" />
  </svg>
);

function seededRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash);
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyInfo() {
  const now = new Date();
  const start = new Date(2025, 0, 1);
  const diffDays = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000);
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return { dayNumber: Math.max(1, diffDays), dateKey };
}

function getSecondsUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.floor((tomorrow - now) / 1000));
}

export default function Morcegos() {
  const [activeMode, setActiveMode] = useState(GAME_MODES.DAILY);
  const [dayNumber, setDayNumber] = useState(1);

  const [regions, setRegions] = useState([]);
  const [board, setBoard] = useState([]);
  const [lives, setLives] = useState(LIVES);
  const [gameStatus, setGameStatus] = useState("PLAYING"); // PLAYING, WON, LOST
  const [errorCells, setErrorCells] = useState([]);
  const [toast, setToast] = useState("");

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilMidnight());

  const dropdownRef = useRef(null);
  const isAnimating = useRef(false);
  const solutionRef = useRef([]);
  const validationTimers = useRef({});
  const activeModeRef = useRef(activeMode);
  const livesRef = useRef(lives);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.DAILY) setStats(parsed);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToastMsg = useCallback((msg, duration = 2600) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? "" : curr)), duration);
  }, []);

  const recordGameResult = useCallback((won, remainingLives, modeId) => {
    setStats((prev) => {
      const curr = prev[modeId] || INITIAL_STATS[modeId];
      const newPlayed = curr.played + 1;
      const newWon = won ? curr.won + 1 : curr.won;
      const newStreak = won ? curr.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(curr.maxStreak, newStreak);
      const newLivesDist = { ...curr.livesDist };

      if (won && remainingLives >= 1 && remainingLives <= 3) {
        newLivesDist[remainingLives] = (newLivesDist[remainingLives] || 0) + 1;
      }

      const updated = {
        ...prev,
        [modeId]: {
          played: newPlayed,
          won: newWon,
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          livesDist: newLivesDist
        }
      };

      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setTimeout(() => setShowStatsModal(true), 900);
  }, []);

  const buildPuzzleData = useCallback((currentSize, rng) => {
    let attempts = 0;
    let fallbackRegions = null;
    let fallbackSolution = null;

    while (attempts < 400) {
      attempts++;

      const placeBats = (row, colsUsed, positions) => {
        if (row === currentSize) return positions;
        const cols = Array.from({ length: currentSize }, (_, i) => i).sort(() => rng() - 0.5);
        for (const c of cols) {
          if (colsUsed.includes(c)) continue;
          let conflict = false;
          for (const p of positions) {
            if (Math.abs(p.r - row) <= 1 && Math.abs(p.c - c) <= 1) {
              conflict = true;
              break;
            }
          }
          if (!conflict) {
            const res = placeBats(row + 1, [...colsUsed, c], [...positions, { r: row, c }]);
            if (res) return res;
          }
        }
        return null;
      };

      const batPositions = placeBats(0, [], []);
      if (!batPositions) continue;

      const newRegions = Array(currentSize)
        .fill(null)
        .map(() => Array(currentSize).fill(-1));
      batPositions.forEach((p, idx) => {
        newRegions[p.r][p.c] = idx;
      });

      let unassigned = currentSize * currentSize - currentSize;
      while (unassigned > 0) {
        const candidates = [];
        for (let r = 0; r < currentSize; r++) {
          for (let c = 0; c < currentSize; c++) {
            if (newRegions[r][c] !== -1) {
              const neighbors = [
                [0, 1],
                [1, 0],
                [0, -1],
                [-1, 0]
              ];
              for (const [dr, dc] of neighbors) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < currentSize && nc >= 0 && nc < currentSize && newRegions[nr][nc] === -1) {
                  candidates.push({ nr, nc, region: newRegions[r][c] });
                }
              }
            }
          }
        }
        if (candidates.length === 0) break;
        const chosen = candidates[Math.floor(rng() * candidates.length)];
        newRegions[chosen.nr][chosen.nc] = chosen.region;
        unassigned--;
      }

      const newSol = Array(currentSize)
        .fill(null)
        .map(() => Array(currentSize).fill(false));
      batPositions.forEach((p) => {
        newSol[p.r][p.c] = true;
      });

      if (!fallbackRegions) {
        fallbackRegions = newRegions;
        fallbackSolution = newSol;
      }

      let solutionsCount = 0;
      const countSolutions = (row, colsUsed, regionsUsed, positions) => {
        if (solutionsCount > 1) return;
        if (row === currentSize) {
          solutionsCount++;
          return;
        }
        for (let c = 0; c < currentSize; c++) {
          if (colsUsed.includes(c)) continue;
          const reg = newRegions[row][c];
          if (regionsUsed.includes(reg)) continue;

          let conflict = false;
          for (const p of positions) {
            if (Math.abs(p.r - row) <= 1 && Math.abs(p.c - c) <= 1) {
              conflict = true;
              break;
            }
          }
          if (!conflict) {
            countSolutions(row + 1, [...colsUsed, c], [...regionsUsed, reg], [...positions, { r: row, c }]);
          }
        }
      };

      countSolutions(0, [], [], []);

      if (solutionsCount === 1) {
        return { regions: newRegions, solution: newSol };
      }
    }

    return { regions: fallbackRegions, solution: fallbackSolution };
  }, []);

  const initGame = useCallback(
    (mode) => {
      setActiveMode(mode);
      setIsModeDropdownOpen(false);
      Object.values(validationTimers.current).forEach(clearTimeout);
      validationTimers.current = {};
      isAnimating.current = false;
      setErrorCells([]);

      const { dayNumber: todayNum, dateKey } = getDailyInfo();
      setDayNumber(todayNum);

      const rng = mode.id === "DAILY" ? seededRandom(`morcegos_${dateKey}`) : Math.random;
      const { regions: generatedRegions, solution: generatedSolution } = buildPuzzleData(mode.size, rng);

      setRegions(generatedRegions);
      solutionRef.current = generatedSolution;

      if (mode.id === "DAILY") {
        try {
          const savedDaily = localStorage.getItem(DAILY_STATE_KEY);
          if (savedDaily) {
            const parsed = JSON.parse(savedDaily);
            if (parsed.dateKey === dateKey && parsed.board) {
              setBoard(parsed.board);
              setLives(parsed.lives ?? LIVES);
              setGameStatus(parsed.gameStatus || "PLAYING");
              if (parsed.gameStatus && parsed.gameStatus !== "PLAYING") {
                setTimeout(() => setShowStatsModal(true), 500);
              }
              return;
            }
          }
        } catch (e) {}
      }

      setBoard(
        Array(mode.size)
          .fill(null)
          .map(() => Array(mode.size).fill(0))
      );
      setLives(LIVES);
      setGameStatus("PLAYING");
    },
    [buildPuzzleData]
  );

  useEffect(() => {
    initGame(GAME_MODES.DAILY);
    const timer = setInterval(() => setSecondsRemaining(getSecondsUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, [initGame]);

  const saveDailyProgress = useCallback((updatedBoard, updatedLives, updatedStatus) => {
    if (activeModeRef.current.id !== "DAILY") return;
    const { dateKey } = getDailyInfo();
    try {
      localStorage.setItem(
        DAILY_STATE_KEY,
        JSON.stringify({
          dateKey,
          board: updatedBoard,
          lives: updatedLives,
          gameStatus: updatedStatus
        })
      );
    } catch (e) {}
  }, []);

  const validateMove = useCallback(
    (r, c, valToValidate) => {
      const isBatInSolution = solutionRef.current[r][c];
      let isError = false;

      if (valToValidate === 1 && isBatInSolution) isError = true;
      if (valToValidate === 2 && !isBatInSolution) isError = true;

      if (isError) {
        isAnimating.current = true;
        setErrorCells([{ r, c }]);

        setTimeout(() => {
          const nextLives = Math.max(0, livesRef.current - 1);
          const nextStatus = nextLives <= 0 ? "LOST" : "PLAYING";

          setLives(nextLives);
          if (nextStatus === "LOST") {
            setGameStatus("LOST");
            showToastMsg("Suas vidas acabaram!", 3000);
            recordGameResult(false, 0, activeModeRef.current.id);
          }

          setBoard((currB) => {
            const revertB = currB.map((row) => [...row]);
            revertB[r][c] = 0;
            saveDailyProgress(revertB, nextLives, nextStatus);
            return revertB;
          });

          setErrorCells([]);
          isAnimating.current = false;
        }, 550);
      } else {
        setBoard((currB) => {
          const boardSize = activeModeRef.current.size;
          let batCount = 0;
          currB.forEach((row) =>
            row.forEach((v) => {
              if (v === 2) batCount++;
            })
          );

          if (valToValidate === 2 && batCount === boardSize) {
            setGameStatus("WON");
            showToastMsg("Incrível! A Gruta está limpa!", 2500);
            saveDailyProgress(currB, livesRef.current, "WON");
            recordGameResult(true, livesRef.current, activeModeRef.current.id);
          } else {
            saveDailyProgress(currB, livesRef.current, "PLAYING");
          }
          return currB;
        });
      }
    },
    [recordGameResult, saveDailyProgress, showToastMsg]
  );

  const handleCellClick = (r, c) => {
    if (gameStatus !== "PLAYING" || isAnimating.current || errorCells.length > 0) return;

    setBoard((prev) => {
      const newB = prev.map((row) => [...row]);
      const nextVal = (newB[r][c] + 1) % 3;
      newB[r][c] = nextVal;

      const timerKey = `${r}-${c}`;
      if (validationTimers.current[timerKey]) {
        clearTimeout(validationTimers.current[timerKey]);
      }

      if (nextVal !== 0) {
        validationTimers.current[timerKey] = setTimeout(() => {
          validateMove(r, c, nextVal);
        }, 400);
      } else {
        saveDailyProgress(newB, livesRef.current, "PLAYING");
      }

      return newB;
    });
  };

  const getCellStyles = (r, c) => {
    if (!regions.length) return {};
    const currentReg = regions[r][c];
    const size = activeMode.size;
    return {
      backgroundColor: REGION_COLORS[currentReg % REGION_COLORS.length],
      borderRight:
        c === size - 1
          ? "none"
          : regions[r][c + 1] !== currentReg
          ? "3px solid #051329"
          : "1px solid rgba(0,0,0,0.15)",
      borderBottom:
        r === size - 1
          ? "none"
          : regions[r + 1][c] !== currentReg
          ? "3px solid #051329"
          : "1px solid rgba(0,0,0,0.15)"
    };
  };

  const formatCountdown = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleShare = async () => {
    const heartsStr =
      gameStatus === "WON"
        ? "❤️".repeat(lives) + "🖤".repeat(LIVES - lives)
        : "💀🖤🖤";
    const shareText = `Joguei Caça Morcegos na Gruta\n#${dayNumber} ${heartsStr}\n\ngruta342.app/jogos/morcegos`;

    try {
      await navigator.clipboard.writeText(shareText);
      showToastMsg("Copiado para a área de transferência!", 3000);
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({ title: "Caça Morcegos da Gruta", text: shareText });
      } catch (e) {}
    }
  };

  const currentStats = stats[activeMode.id] || INITIAL_STATS[activeMode.id];
  const winPercentage =
    currentStats.played > 0 ? Math.round((currentStats.won / currentStats.played) * 100) : 0;
  const totalLosses = currentStats.played - currentStats.won;
  const maxDistCount = Math.max(...Object.values(currentStats.livesDist), totalLosses, 1);

  return (
    <div className="morcegos-wrapper">
      {toast && <div className="morcegos-toast">{toast}</div>}

      {/* Cabeçalho Unificado (Padrão Termo) */}
      <header className="morcegos-header">
        <div className="morcegos-header-left">
          <a href="/jogos" className="morcegos-header-btn morcegos-header-back-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="morcegos-hide-mobile">JOGOS</span>
          </a>

          <div className="morcegos-dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              className="morcegos-header-btn"
              onClick={() => setIsModeDropdownOpen((prev) => !prev)}
            >
              <span className="morcegos-hide-mobile">MODO: </span>
              {activeMode.dropdownLabel}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isModeDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s"
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isModeDropdownOpen && (
              <div className="morcegos-dropdown-menu">
                {Object.values(GAME_MODES).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`morcegos-dropdown-item ${activeMode.id === m.id ? "active" : ""}`}
                    onClick={() => initGame(m)}
                  >
                    {m.dropdownLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="morcegos-header-center">
          <h1 className="morcegos-title">CAÇA MORCEGOS</h1>
          <span className="morcegos-day-tag">
            {activeMode.id === "DAILY" ? `#${dayNumber} DA GRUTA` : "MODO INFINITO"}
          </span>
        </div>

        <div className="morcegos-header-right">
          <button
            type="button"
            className="morcegos-icon-btn"
            onClick={() => setShowHelpModal(true)}
            title="Como Jogar"
            aria-label="Como Jogar"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          <button
            type="button"
            className="morcegos-icon-btn"
            onClick={() => setShowStatsModal(true)}
            title="Estatísticas"
            aria-label="Estatísticas"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Área Central do Jogo */}
      <main className="morcegos-main">
        <div className="morcegos-lives">
          {Array.from({ length: LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "heart-active" : "heart-lost"}>
              ❤️
            </span>
          ))}
        </div>

        <div
          className="morcegos-board-container"
          style={{ maxWidth: activeMode.size === 8 ? "440px" : "390px" }}
        >
          {regions.length > 0 && (
            <div
              className={`morcegos-board ${gameStatus !== "PLAYING" ? "board-locked" : ""}`}
              style={{
                gridTemplateColumns: `repeat(${activeMode.size}, 1fr)`,
                gridTemplateRows: `repeat(${activeMode.size}, 1fr)`
              }}
            >
              {board.map((row, r) =>
                row.map((val, c) => {
                  const isError = errorCells.some((e) => e.r === r && e.c === c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`morcegos-cell ${isError ? "error-shake" : ""}`}
                      style={getCellStyles(r, c)}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {val === 1 && <span className="morcegos-cell-x">✕</span>}
                      {val === 2 && <BatSvg />}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Estatísticas */}
      {showStatsModal && (
        <div className="morcegos-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="morcegos-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="morcegos-modal-close-btn"
              onClick={() => setShowStatsModal(false)}
            >
              ✕
            </button>
            <h2 className="morcegos-stats-title">ESTATÍSTICAS - {activeMode.label.toUpperCase()}</h2>

            <h3 className="morcegos-dist-title">PROGRESSO</h3>
            <div className="morcegos-stats-grid">
              <div className="morcegos-stat-box">
                <span className="morcegos-stat-value">{currentStats.played}</span>
                <span className="morcegos-stat-label">jogos</span>
              </div>
              <div className="morcegos-stat-box">
                <span className="morcegos-stat-value">{winPercentage}%</span>
                <span className="morcegos-stat-label">de vitórias</span>
              </div>
              <div className="morcegos-stat-box">
                <span className="morcegos-stat-value">{currentStats.currentStreak}</span>
                <span className="morcegos-stat-label">
                  sequência
                  <br />
                  de vitórias
                </span>
              </div>
              <div className="morcegos-stat-box">
                <span className="morcegos-stat-value">{currentStats.maxStreak}</span>
                <span className="morcegos-stat-label">
                  melhor
                  <br />
                  sequência
                </span>
              </div>
            </div>

            <div className="morcegos-dist-section">
              <h3 className="morcegos-dist-title">VIDAS RESTANTES NAS VITÓRIAS</h3>
              <div className="morcegos-dist-graph">
                {[3, 2, 1].map((lifeNum) => {
                  const count = currentStats.livesDist[lifeNum] || 0;
                  const isHighlight = gameStatus === "WON" && lives === lifeNum;
                  const barWidth =
                    currentStats.played > 0 ? Math.max((count / maxDistCount) * 100, 7) : 7;

                  return (
                    <div key={lifeNum} className="morcegos-dist-row">
                      <span className="morcegos-dist-num">{lifeNum}❤️</span>
                      <div className="morcegos-dist-bar-wrapper">
                        <div
                          className={`morcegos-dist-bar ${isHighlight ? "highlight" : ""}`}
                          style={{ width: `${barWidth}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="morcegos-dist-row">
                  <span className="morcegos-dist-num">💀</span>
                  <div className="morcegos-dist-bar-wrapper">
                    <div
                      className={`morcegos-dist-bar ${
                        gameStatus === "LOST" ? "loss-highlight" : "loss-bar"
                      }`}
                      style={{
                        width:
                          currentStats.played > 0
                            ? Math.max((totalLosses / maxDistCount) * 100, 7) + "%"
                            : "7%"
                      }}
                    >
                      {totalLosses}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeMode.id === "DAILY" ? (
              <div className="morcegos-stats-footer">
                <div className="morcegos-footer-col">
                  <span className="morcegos-next-label">próximo mapa em</span>
                  <div className="morcegos-countdown">{formatCountdown(secondsRemaining)}</div>
                </div>
                {gameStatus !== "PLAYING" && (
                  <div className="morcegos-footer-col align-right">
                    <button type="button" className="morcegos-share-btn" onClick={handleShare}>
                      compartilhe
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              gameStatus !== "PLAYING" && (
                <button
                  type="button"
                  onClick={() => initGame(activeMode)}
                  className="morcegos-play-again-btn"
                >
                  JOGAR NOVAMENTE
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Modal: Como Jogar */}
      {showHelpModal && (
        <div className="morcegos-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="morcegos-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="morcegos-modal-close-btn"
              onClick={() => setShowHelpModal(false)}
            >
              ✕
            </button>
            <h2 className="morcegos-stats-title">COMO JOGAR</h2>
            <div className="morcegos-help-body">
              <p>
                Encontre todos os morcegos escondidos nas regiões coloridas da Gruta usando apenas
                lógica e dedução.
              </p>
              <ul>
                <li>
                  O tabuleiro é dividido em regiões coloridas. Deve haver exatamente{" "}
                  <strong>1 morcego em cada região</strong>.
                </li>
                <li>
                  Cada <strong>linha</strong> e cada <strong>coluna</strong> também deve conter
                  exatamente <strong>1 morcego</strong>.
                </li>
                <li>
                  Os morcegos <strong>não podem se tocar</strong>, nem mesmo na diagonal.
                </li>
                <li>
                  Toque <strong>1x</strong> em uma casa vazia para marcar <strong>✕</strong> (sem
                  morcego) e <strong>2x</strong> rapidamente para posicionar o{" "}
                  <strong>morcego</strong>.
                </li>
                <li>
                  Marcar um <strong>✕</strong> onde há um morcego (ou vice-versa) custa uma vida!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}