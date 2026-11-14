"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Morcegos.css";

// Cores vivas para a estética da Gruta (suporta até 8 regiões)
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

// SVG Vetorizado do Morcego
const BatSvg = () => (
  <svg viewBox="0 0 256 256" width="65%" height="65%" fill="#ffffff" style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.6))' }}>
    <path d="M239.5,91.8c-1.6-1.5-3.8-2.1-6-1.5c-15.6,4-33.8,4.2-51.5-0.9c-8.9-2.6-18.4-7.4-27.5-13.8c-6.1-4.3-12.7-9.5-19.4-15c-1.9-1.5-4.5-1.5-6.4,0c-6.7,5.5-13.3,10.7-19.4,15c-9.1,6.4-18.6,11.2-27.5,13.8C64.1,94.5,45.9,94.3,30.3,90.3c-2.2-0.6-4.4,0-6,1.5c-1.6,1.5-2.2,3.8-1.5,6c6.2,20.2,16.6,38.1,30.4,52.3c2.7,2.8,7.3,2,9.1-1.6c3.2-6.5,7.3-12.7,12.3-18.5c5.3-6,11.3-11.4,18-16.1c11.9,8,22.6,18.4,30.6,30.5c1.4,2.2,4.2,2.5,6,0.6c1.2-1.3,2.4-2.6,3.6-4.1c1.2,1.5,2.4,2.8,3.6,4.1c1.8,1.9,4.6,1.6,6-0.6c8-12.1,18.7-22.5,30.6-30.5c6.7,4.7,12.7,10.1,18,16.1c5,5.8,9.1,12,12.3,18.5c1.8,3.6,6.4,4.4,9.1,1.6c13.8-14.2,24.2-32.1,30.4-52.3C241.7,95.6,241.1,93.3,239.5,91.8z" />
  </svg>
);

// Gerador de número com semente (Mulberry32) para o Modo Diário determinístico
function seededRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash);
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const LIVES = 3;

export default function Morcegos() {
  const [gameMode, setGameMode] = useState(null); // null, 'normal', 'hard', 'daily'
  const [size, setSize] = useState(6);
  
  const [regions, setRegions] = useState([]);
  const [board, setBoard] = useState([]); 
  const [lives, setLives] = useState(LIVES);
  const [gameStatus, setGameStatus] = useState("PLAYING"); // PLAYING, WON, LOST, ALREADY_PLAYED
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState("");
  const [errorCells, setErrorCells] = useState([]);
  
  const isAnimating = useRef(false);
  const solutionRef = useRef([]);
  const validationTimers = useRef({});

  const getTodayKey = () => {
    const d = new Date();
    return `morcegos_daily_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const generateMap = useCallback((mode) => {
    const currentSize = mode === 'normal' ? 6 : 8;
    setSize(currentSize);

    // Verificar Modo Diário
    const dailyKey = getTodayKey();
    if (mode === 'daily') {
      const completed = localStorage.getItem(dailyKey);
      if (completed === 'won') {
        setGameStatus("ALREADY_PLAYED");
        return;
      }
    }

    let rng = Math.random;
    if (mode === 'daily') {
      rng = seededRandom(dailyKey);
    }

    let mapFound = false;
    let finalRegions = [];
    let finalSolution = [];

    while (!mapFound) {
      // 1. Backtracking com suporte ao RNG customizado
      const placeBats = (row, colsUsed, positions) => {
        if (row === currentSize) return positions;
        let cols = Array.from({ length: currentSize }, (_, i) => i).sort(() => rng() - 0.5);
        for (let c of cols) {
          if (colsUsed.includes(c)) continue;
          let conflict = false;
          for (let p of positions) {
            if (Math.abs(p.r - row) <= 1 && Math.abs(p.c - c) <= 1) {
              conflict = true; break;
            }
          }
          if (!conflict) {
            let res = placeBats(row + 1, [...colsUsed, c], [...positions, { r: row, c: c }]);
            if (res) return res;
          }
        }
        return null;
      };

      let batPositions = placeBats(0, [], []);
      if (!batPositions) continue;

      // 2. Expandir regiões
      let newRegions = Array(currentSize).fill().map(() => Array(currentSize).fill(-1));
      batPositions.forEach((p, idx) => { newRegions[p.r][p.c] = idx; });

      let unassigned = currentSize * currentSize - currentSize;
      while (unassigned > 0) {
        let candidates = [];
        for (let r = 0; r < currentSize; r++) {
          for (let c = 0; c < currentSize; c++) {
            if (newRegions[r][c] !== -1) {
              const neighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]];
              for (let [dr, dc] of neighbors) {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < currentSize && nc >= 0 && nc < currentSize && newRegions[nr][nc] === -1) {
                  candidates.push({ nr, nc, region: newRegions[r][c] });
                }
              }
            }
          }
        }
        if (candidates.length === 0) break;
        let chosen = candidates[Math.floor(rng() * candidates.length)];
        newRegions[chosen.nr][chosen.nc] = chosen.region;
        unassigned--;
      }

      // 3. Validador de Solução Única
      let solutionsCount = 0;
      const countSolutions = (row, colsUsed, regionsUsed, positions) => {
        if (solutionsCount > 1) return;
        if (row === currentSize) {
          solutionsCount++;
          return;
        }
        for (let c = 0; c < currentSize; c++) {
          if (colsUsed.includes(c)) continue;
          let reg = newRegions[row][c];
          if (regionsUsed.includes(reg)) continue;

          let conflict = false;
          for (let p of positions) {
            if (Math.abs(p.r - row) <= 1 && Math.abs(p.c - c) <= 1) {
              conflict = true; break;
            }
          }
          if (!conflict) {
            countSolutions(row + 1, [...colsUsed, c], [...regionsUsed, reg], [...positions, {r: row, c: c}]);
          }
        }
      };

      countSolutions(0, [], [], []);

      if (solutionsCount === 1) {
        mapFound = true;
        finalRegions = newRegions;
        let newSol = Array(currentSize).fill().map(() => Array(currentSize).fill(false));
        batPositions.forEach(p => { newSol[p.r][p.c] = true; });
        finalSolution = newSol;
      }
    }

    setRegions(finalRegions);
    solutionRef.current = finalSolution;
    setBoard(Array(currentSize).fill().map(() => Array(currentSize).fill(0)));
    setLives(LIVES);
    setGameStatus("PLAYING");
    setErrorCells([]);
    isAnimating.current = false;
    
    Object.values(validationTimers.current).forEach(clearTimeout);
    validationTimers.current = {};
  }, []);

  const selectMode = (mode) => {
    setGameMode(mode);
    generateMap(mode);
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const validateMove = useCallback((r, c, valToValidate) => {
    const isBatInSolution = solutionRef.current[r][c];
    let isError = false;

    if (valToValidate === 1 && isBatInSolution) isError = true;
    if (valToValidate === 2 && !isBatInSolution) isError = true;

    if (isError) {
      isAnimating.current = true;
      setErrorCells([{r, c}]);

      setTimeout(() => {
        setLives(l => {
          const newL = l - 1;
          if (newL <= 0) setGameStatus("LOST");
          return newL;
        });
        setBoard(currB => {
          let revertB = currB.map(row => [...row]);
          revertB[r][c] = 0;
          return revertB;
        });
        setErrorCells([]);
        isAnimating.current = false;
      }, 600);
    } else {
      if (valToValidate === 2) {
        setBoard(currB => {
           let batCount = 0;
           currB.forEach(row => row.forEach(v => { if (v === 2) batCount++; }));
           if (batCount === size) {
             setGameStatus("WON");
             showToastMsg("Incrível! A Gruta está limpa!");
             if (gameMode === 'daily') {
               localStorage.setItem(getTodayKey(), 'won');
             }
           }
           return currB;
        });
      }
    }
  }, [gameMode, size]);

  const handleCellClick = (r, c) => {
    if (gameStatus !== "PLAYING" || isAnimating.current || errorCells.length > 0) return;

    setBoard(prev => {
      let newB = prev.map(row => [...row]);
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
      }

      return newB;
    });
  };

  const getCellStyles = (r, c) => {
    if (!regions.length) return {};
    const currentReg = regions[r][c];
    return {
      backgroundColor: REGION_COLORS[currentReg % REGION_COLORS.length],
      borderRight: c === size - 1 ? 'none' : (regions[r][c + 1] !== currentReg ? '3px solid #051329' : '1px solid rgba(0,0,0,0.15)'),
      borderBottom: r === size - 1 ? 'none' : (regions[r + 1][c] !== currentReg ? '3px solid #051329' : '1px solid rgba(0,0,0,0.15)')
    };
  };

  // TELA DE SELEÇÃO DE MODO
  if (!gameMode) {
    return (
      <div className="morcegos-wrapper">
        <header className="morcegos-header">
          <a href="/jogos" className="btn-action">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </a>
          <h1 className="morcegos-title">Caça Morcegos</h1>
          <button className="btn-action" onClick={() => setShowHelp(true)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
        </header>

        <div className="mode-selection-container">
          <p style={{ color: "#8a9fc4", marginBottom: "30px", textAlign: "center" }}>
            Escolha o modo de jogo para iniciar a caçada na Gruta:
          </p>

          <button className="mode-card-btn mode-normal" onClick={() => selectMode('normal')}>
            <div className="mode-title">Modo Normal</div>
            <div className="mode-desc">Tabuleiro 6x6 • Sem limite de tentativas</div>
          </button>

          <button className="mode-card-btn mode-hard" onClick={() => selectMode('hard')}>
            <div className="mode-title">Modo Difícil</div>
            <div className="mode-desc">Tabuleiro 8x8 • Maior complexidade</div>
          </button>

          <button className="mode-card-btn mode-daily" onClick={() => selectMode('daily')}>
            <div className="mode-title">🌟 Desafio Diário</div>
            <div className="mode-desc">Tabuleiro 8x8 • Um desafio único por dia</div>
          </button>
        </div>

        {showHelp && (
          <div className="morcegos-modal-overlay" onClick={() => setShowHelp(false)}>
            <div className="morcegos-modal" onClick={e => e.stopPropagation()}>
              <h2>Regras do Jogo</h2>
              <ul>
                <li>O puzzle é dividido em regiões coloridas. Coloque exatamente <strong>um 🦇 em cada região</strong>.</li>
                <li>Cada <strong>linha</strong> e <strong>coluna</strong> também deve conter exatamente um 🦇.</li>
                <li>Os 🦇 <strong>não podem se tocar</strong>, nem mesmo na diagonal.</li>
                <li>Toque 1x para <strong>✕</strong> e 2x rapidamente para o <strong>🦇</strong>. Erros custam vidas!</li>
              </ul>
              <button className="morcegos-btn-play" onClick={() => setShowHelp(false)}>Entendi</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="morcegos-wrapper">
      {toast && <div className="toast-msg">{toast}</div>}

      <header className="morcegos-header">
        <button className="btn-action" onClick={() => setGameMode(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h1 className="morcegos-title">
          {gameMode === 'normal' && 'Normal (6x6)'}
          {gameMode === 'hard' && 'Difícil (8x8)'}
          {gameMode === 'daily' && 'Desafio Diário'}
        </h1>
        <button className="btn-action" onClick={() => setShowHelp(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </header>

      {gameStatus !== "ALREADY_PLAYED" && (
        <div className="morcegos-lives">
          {Array.from({ length: LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "heart-active" : "heart-lost"}>❤️</span>
          ))}
        </div>
      )}

      <div className="morcegos-board-container" style={{ maxWidth: size === 8 ? '450px' : '400px' }}>
        {regions.length > 0 && gameStatus !== "ALREADY_PLAYED" && (
          <div className="morcegos-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
            {board.map((row, r) =>
              row.map((val, c) => {
                const isError = errorCells.some(e => e.r === r && e.c === c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`morcegos-cell ${isError ? 'error-shake' : ''}`}
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

        {gameStatus === "ALREADY_PLAYED" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ color: "#00d2ff", marginBottom: "15px" }}>🌟 Desafio Concluído!</h2>
            <p style={{ color: "#c7d4e5", marginBottom: "25px", lineHeight: "1.6" }}>
              Você já completou o Desafio Diário de hoje. Volte amanhã para um novo puzzle exclusivo da Gruta!
            </p>
            <button className="morcegos-btn-play" onClick={() => setGameMode(null)}>Voltar ao Menu</button>
          </div>
        )}
      </div>

      {showHelp && (
        <div className="morcegos-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="morcegos-modal" onClick={e => e.stopPropagation()}>
            <h2>Regras do Jogo</h2>
            <ul>
              <li>O puzzle é dividido em regiões coloridas. Coloque exatamente <strong>um 🦇 em cada região</strong>.</li>
              <li>Cada <strong>linha</strong> e <strong>coluna</strong> também deve conter exatamente um 🦇.</li>
              <li>Os 🦇 <strong>não podem se tocar</strong>, nem mesmo na diagonal.</li>
              <li>Toque 1x para <strong>✕</strong> e 2x rapidamente para o <strong>🦇</strong>. Erros custam vidas!</li>
            </ul>
            <button className="morcegos-btn-play" onClick={() => setShowHelp(false)}>Entendi</button>
          </div>
        </div>
      )}

      {(gameStatus === "WON" || gameStatus === "LOST") && (
        <div className="morcegos-modal-overlay">
          <div className="morcegos-modal" style={{ textAlign: "center" }}>
            <h2>{gameStatus === "WON" ? "🏆 Você Venceu!" : "💀 Fim de Jogo"}</h2>
            <p style={{ color: "#c7d4e5", marginBottom: "20px" }}>
              {gameStatus === "WON" 
                ? (gameMode === 'daily' ? "Parabéns! Desafio Diário concluído com sucesso." : "Parabéns! Todos os morcegos foram localizados com sucesso.") 
                : "As suas vidas acabaram. Os morcegos dominaram a região!"}
            </p>
            <button className="morcegos-btn-play" onClick={() => generateMap(gameMode)}>Jogar Novamente</button>
            <button 
              onClick={() => setGameMode(null)} 
              style={{ background: 'none', border: 'none', color: '#8a9fc4', marginTop: '15px', cursor: 'pointer', fontSize: '14px', width: '100%' }}
            >
              Escolher Outro Modo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}