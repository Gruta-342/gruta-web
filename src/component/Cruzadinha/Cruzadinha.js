"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import "./Cruzadinha.css";
import {
  generateCrosswordPuzzle,
  DIFFICULTY_CONFIG,
  THEME_LABELS,
  normalizeCrosswordWord,
} from "../../lib/cruzadinhaGenerator.js";

const STATS_STORAGE_KEY = "gruta_cruzadinha_stats";

export default function Cruzadinha() {
  const [theme, setTheme] = useState("random");
  const [difficulty, setDifficulty] = useState("easy");
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [selectedDirection, setSelectedDirection] = useState("H"); // 'H' | 'V'
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);

  // Timer & Game Status
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const giveUpTimeoutRef = useRef(null);

  // Modals
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    played: 0,
    won: 0,
    bestTime: null,
  });

  // Reference for container focus & auto-scrolling
  const boardRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Erro ao carregar estatísticas", e);
    }
  }, []);

  // Save stats helper
  const updateStats = useCallback((won, timeTaken) => {
    setStats((prev) => {
      const newPlayed = prev.played + 1;
      const newWon = won ? prev.won + 1 : prev.won;
      let newBest = prev.bestTime;
      if (won) {
        newBest = newBest === null ? timeTaken : Math.min(newBest, timeTaken);
      }
      const newStats = {
        played: newPlayed,
        won: newWon,
        bestTime: newBest,
      };
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
      } catch (e) {}
      return newStats;
    });
  }, []);

  // Show temporary toast message
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Initialize a new game
  const startNewGame = useCallback(
    (newTheme = theme, newDiff = difficulty) => {
      try {
        const p = generateCrosswordPuzzle(newTheme, newDiff);
        setPuzzle(p);

        // Grid do usuário preenchido com strings vazias
        const emptyUserGrid = Array(p.rows)
          .fill(null)
          .map(() => Array(p.cols).fill(""));
        setUserGrid(emptyUserGrid);

        // Seleciona a primeira palavra
        if (p.words.length > 0) {
          const firstWord = p.words[0];
          setSelectedCell({ r: firstWord.r, c: firstWord.c });
          setSelectedDirection(firstWord.dir);
          setSelectedWordIndex(0);
        } else {
          setSelectedCell(null);
          setSelectedWordIndex(0);
        }

        setTimer(0);
        setIsTimerRunning(true);
        setIsGameOver(false);
        setGameWon(false);
        setSurrendered(false);
        setConfirmGiveUp(false);
        setShowWinModal(false);
      } catch (err) {
        console.error("Erro ao inicializar jogo:", err);
        showToast("Erro ao gerar cruzadinha. Tentando novamente...");
      }
    },
    [theme, difficulty, showToast]
  );

  // Inicializa o primeiro jogo ao montar o componente
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cronômetro
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && !isGameOver) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGameOver]);

  // Formata tempo (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fecha dropdown de tema ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Palavra ativa atual
  const currentWord = useMemo(() => {
    if (!puzzle || !puzzle.words.length) return null;
    return puzzle.words[selectedWordIndex] || puzzle.words[0];
  }, [puzzle, selectedWordIndex]);

  // Encontra a palavra para uma dada célula e direção
  const findWordForCellAndDir = useCallback(
    (r, c, dir) => {
      if (!puzzle) return null;
      return puzzle.words.find((w) => {
        if (w.dir !== dir) return false;
        if (dir === "H") {
          return w.r === r && c >= w.c && c < w.c + w.word.length;
        } else {
          return w.c === c && r >= w.r && r < w.r + w.word.length;
        }
      });
    },
    [puzzle]
  );

  // Seleciona uma célula ao clicar
  const handleCellClick = useCallback(
    (r, c) => {
      if (isGameOver || !puzzle) return;
      const cell = puzzle.grid[r][c];
      if (cell.isBlock) return;

      // Se já estava selecionada a mesma célula
      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        // Se ela tem palavras em ambas as direções, alterna
        if (cell.dirs && cell.dirs.includes("H") && cell.dirs.includes("V")) {
          const nextDir = selectedDirection === "H" ? "V" : "H";
          setSelectedDirection(nextDir);
          const w = findWordForCellAndDir(r, c, nextDir);
          if (w) setSelectedWordIndex(w.index);
          return;
        }
      }

      // Nova célula selecionada
      setSelectedCell({ r, c });

      // Mantém a direção atual se a célula suportar, caso contrário usa a direção disponível
      let targetDir = selectedDirection;
      if (!cell.dirs.includes(targetDir)) {
        targetDir = cell.dirs[0] || "H";
      }
      setSelectedDirection(targetDir);

      const w = findWordForCellAndDir(r, c, targetDir);
      if (w) {
        setSelectedWordIndex(w.index);
      }
    },
    [isGameOver, puzzle, selectedCell, selectedDirection, findWordForCellAndDir]
  );

  // Alterna direção da palavra ativa (se estiver em interseção)
  const toggleDirection = useCallback(() => {
    if (!selectedCell || !puzzle) return;
    const cell = puzzle.grid[selectedCell.r][selectedCell.c];
    if (cell.dirs && cell.dirs.includes("H") && cell.dirs.includes("V")) {
      const nextDir = selectedDirection === "H" ? "V" : "H";
      setSelectedDirection(nextDir);
      const w = findWordForCellAndDir(selectedCell.r, selectedCell.c, nextDir);
      if (w) setSelectedWordIndex(w.index);
    }
  }, [selectedCell, puzzle, selectedDirection, findWordForCellAndDir]);

  // Navega para a palavra anterior ou próxima
  const navigateWord = useCallback(
    (delta) => {
      if (!puzzle || !puzzle.words.length) return;
      let nextIndex = selectedWordIndex + delta;
      if (nextIndex < 0) nextIndex = puzzle.words.length - 1;
      if (nextIndex >= puzzle.words.length) nextIndex = 0;

      const w = puzzle.words[nextIndex];
      setSelectedWordIndex(nextIndex);
      setSelectedDirection(w.dir);

      // Encontra a primeira casa vazia dessa palavra ou a primeira casa
      let targetCell = { r: w.r, c: w.c };
      for (let i = 0; i < w.word.length; i++) {
        const curR = w.dir === "V" ? w.r + i : w.r;
        const curC = w.dir === "H" ? w.c + i : w.c;
        if (!userGrid[curR][curC]) {
          targetCell = { r: curR, c: curC };
          break;
        }
      }
      setSelectedCell(targetCell);
    },
    [puzzle, selectedWordIndex, userGrid]
  );

  // Seleciona uma palavra a partir da lista de dicas
  const selectWordFromClue = useCallback(
    (wordObj) => {
      if (isGameOver) return;
      setSelectedWordIndex(wordObj.index);
      setSelectedDirection(wordObj.dir);

      // Procura primeira célula vazia da palavra
      let targetCell = { r: wordObj.r, c: wordObj.c };
      for (let i = 0; i < wordObj.word.length; i++) {
        const curR = wordObj.dir === "V" ? wordObj.r + i : wordObj.r;
        const curC = wordObj.dir === "H" ? wordObj.c + i : wordObj.c;
        if (!userGrid[curR][curC]) {
          targetCell = { r: curR, c: curC };
          break;
        }
      }
      setSelectedCell(targetCell);
    },
    [isGameOver, userGrid]
  );

  // Verifica se o tabuleiro inteiro está preenchido e confere vitória
  const checkVictoryCondition = useCallback(
    (currentUserGrid) => {
      if (!puzzle) return;
      let allFilled = true;
      let allCorrect = true;

      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.grid[r][c];
          if (!cell.isBlock) {
            const userChar = currentUserGrid[r][c];
            if (!userChar) {
              allFilled = false;
            } else if (userChar !== cell.solution) {
              allCorrect = false;
            }
          }
        }
      }

      if (allFilled) {
        if (allCorrect) {
          setIsGameOver(true);
          setGameWon(true);
          setIsTimerRunning(false);
          setShowWinModal(true);
          updateStats(true, timer);
        } else {
          showToast("A grade está completa, mas ainda há letras incorretas!");
        }
      }
    },
    [puzzle, timer, updateStats, showToast]
  );

  // Preenche caractere na célula atual e avança cursor
  const handleInputCharacter = useCallback(
    (rawChar) => {
      if (isGameOver || !puzzle || !selectedCell || !currentWord) return;
      const char = rawChar.toUpperCase();
      if (!/^[A-Z]$/.test(char)) return;

      const { r, c } = selectedCell;
      const cell = puzzle.grid[r][c];
      if (cell.isBlock) return;

      // Atualiza o grid
      const newGrid = userGrid.map((row) => [...row]);
      newGrid[r][c] = char;
      setUserGrid(newGrid);

      // Avança para a próxima célula da palavra atual
      const wordLen = currentWord.word.length;
      const wordStartR = currentWord.r;
      const wordStartC = currentWord.c;
      const isVert = currentWord.dir === "V";

      // Calcula a posição do caractere dentro da palavra atual
      const charIdxInWord = isVert ? r - wordStartR : c - wordStartC;

      // Procura a próxima casa vazia na palavra
      let nextTarget = null;
      for (let step = charIdxInWord + 1; step < wordLen; step++) {
        const nextR = isVert ? wordStartR + step : wordStartR;
        const nextC = isVert ? wordStartC : wordStartC + step;
        if (!newGrid[nextR][nextC]) {
          nextTarget = { r: nextR, c: nextC };
          break;
        }
      }

      // Se não achou uma casa vazia à frente, avança simplesmente para a próxima casa adjacente se existir
      if (!nextTarget && charIdxInWord + 1 < wordLen) {
        nextTarget = {
          r: isVert ? wordStartR + charIdxInWord + 1 : wordStartR,
          c: isVert ? wordStartC : wordStartC + charIdxInWord + 1,
        };
      }

      // Se a palavra chegou ao fim ou está totalmente preenchida, pula para a próxima palavra com casas vazias
      if (!nextTarget) {
        // Encontra próxima palavra incompleta
        for (let i = 1; i <= puzzle.words.length; i++) {
          const candidateIdx = (currentWord.index + i) % puzzle.words.length;
          const candidateWord = puzzle.words[candidateIdx];
          for (let k = 0; k < candidateWord.word.length; k++) {
            const candR = candidateWord.dir === "V" ? candidateWord.r + k : candidateWord.r;
            const candC = candidateWord.dir === "H" ? candidateWord.c + k : candidateWord.c;
            if (!newGrid[candR][candC]) {
              setSelectedWordIndex(candidateIdx);
              setSelectedDirection(candidateWord.dir);
              setSelectedCell({ r: candR, c: candC });
              checkVictoryCondition(newGrid);
              return;
            }
          }
        }
      } else {
        setSelectedCell(nextTarget);
      }

      // Checa se finalizou o jogo
      checkVictoryCondition(newGrid);
    },
    [isGameOver, puzzle, selectedCell, currentWord, userGrid, checkVictoryCondition]
  );

  // Apaga letra (Backspace)
  const handleBackspace = useCallback(() => {
    if (isGameOver || !puzzle || !selectedCell || !currentWord) return;
    const { r, c } = selectedCell;

    const newGrid = userGrid.map((row) => [...row]);
    if (newGrid[r][c] !== "") {
      // Se a célula já tinha letra, limpa e permanece nela
      newGrid[r][c] = "";
      setUserGrid(newGrid);
      return;
    }

    // Se já estava vazia, recua uma casa na palavra atual e limpa a anterior
    const isVert = currentWord.dir === "V";
    const charIdxInWord = isVert ? r - currentWord.r : c - currentWord.c;
    if (charIdxInWord > 0) {
      const prevR = isVert ? r - 1 : r;
      const prevC = isVert ? c : c - 1;
      newGrid[prevR][prevC] = "";
      setUserGrid(newGrid);
      setSelectedCell({ r: prevR, c: prevC });
    }
  }, [isGameOver, puzzle, selectedCell, currentWord, userGrid]);

  // Movimentação por setas
  const handleArrowMove = useCallback(
    (dr, dc) => {
      if (!puzzle || !selectedCell) return;
      const newR = selectedCell.r + dr;
      const newC = selectedCell.c + dc;

      if (
        newR >= 0 &&
        newR < puzzle.rows &&
        newC >= 0 &&
        newC < puzzle.cols &&
        !puzzle.grid[newR][newC].isBlock
      ) {
        setSelectedCell({ r: newR, c: newC });
        // Se andou na vertical, prioriza vertical; se horizontal, prioriza horizontal
        const cell = puzzle.grid[newR][newC];
        if (dr !== 0 && cell.dirs.includes("V")) {
          setSelectedDirection("V");
          const w = findWordForCellAndDir(newR, newC, "V");
          if (w) setSelectedWordIndex(w.index);
        } else if (dc !== 0 && cell.dirs.includes("H")) {
          setSelectedDirection("H");
          const w = findWordForCellAndDir(newR, newC, "H");
          if (w) setSelectedWordIndex(w.index);
        }
      }
    },
    [puzzle, selectedCell, findWordForCellAndDir]
  );

  // Listener de teclado físico
  useEffect(() => {
    function handleKeyDown(e) {
      if (showHelpModal || showStatsModal || showWinModal) return;

      if (e.key === "Tab") {
        e.preventDefault();
        navigateWord(e.shiftKey ? -1 : 1);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        navigateWord(1);
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        toggleDirection();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleArrowMove(-1, 0);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleArrowMove(1, 0);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleArrowMove(0, -1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleArrowMove(0, 1);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleInputCharacter(e.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showHelpModal,
    showStatsModal,
    showWinModal,
    navigateWord,
    toggleDirection,
    handleBackspace,
    handleArrowMove,
    handleInputCharacter,
  ]);

  // Desistir do jogo (revela soluções)
  const handleGiveUp = useCallback(() => {
    if (isGameOver) return;
    if (!confirmGiveUp) {
      setConfirmGiveUp(true);
      if (giveUpTimeoutRef.current) clearTimeout(giveUpTimeoutRef.current);
      giveUpTimeoutRef.current = setTimeout(() => {
        setConfirmGiveUp(false);
      }, 3500);
      return;
    }

    // Confirmou desistência: revela todas as respostas no grid
    setConfirmGiveUp(false);
    setIsGameOver(true);
    setSurrendered(true);
    setIsTimerRunning(false);

    const revealedGrid = puzzle.grid.map((row) =>
      row.map((cell) => (cell.isBlock ? "" : cell.solution))
    );
    setUserGrid(revealedGrid);
    updateStats(false, timer);
    showToast("Respostas reveladas. Mais sorte na próxima!");
  }, [isGameOver, confirmGiveUp, puzzle, timer, updateStats, showToast]);

  // Verifica se uma célula pertence à palavra atualmente ativa
  const isCellInActiveWord = useCallback(
    (r, c) => {
      if (!currentWord) return false;
      if (currentWord.dir === "H") {
        return (
          r === currentWord.r &&
          c >= currentWord.c &&
          c < currentWord.c + currentWord.word.length
        );
      } else {
        return (
          c === currentWord.c &&
          r >= currentWord.r &&
          r < currentWord.r + currentWord.word.length
        );
      }
    },
    [currentWord]
  );

  // Verifica se uma dada palavra está 100% preenchida pelo jogador
  const isWordFilled = useCallback(
    (w) => {
      if (!userGrid.length) return false;
      for (let i = 0; i < w.word.length; i++) {
        const curR = w.dir === "V" ? w.r + i : w.r;
        const curC = w.dir === "H" ? w.c + i : w.c;
        if (!userGrid[curR] || !userGrid[curR][curC]) return false;
      }
      return true;
    },
    [userGrid]
  );

  // Separa as dicas em Horizontais e Verticais
  const horizontalWords = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.words
      .filter((w) => w.dir === "H")
      .sort((a, b) => a.number - b.number);
  }, [puzzle]);

  const verticalWords = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.words
      .filter((w) => w.dir === "V")
      .sort((a, b) => a.number - b.number);
  }, [puzzle]);

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", "BKSP"],
  ];

  return (
    <div className="cz-game-wrapper">
      {/* Toast Notification */}
      {toastMessage && <div className="cz-toast">{toastMessage}</div>}

      {/* Header Principal da Cruzadinha */}
      <header className="cz-header">
        <div className="cz-header-left">
          <Link href="/jogos" className="cz-btn-back" title="Voltar aos Jogos">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Jogos</span>
          </Link>

          {/* Dificuldade */}
          <div className="cz-diff-selector">
            {["easy", "medium", "hard"].map((diffKey) => (
              <button
                key={diffKey}
                type="button"
                className={`cz-diff-btn ${difficulty === diffKey ? "active" : ""}`}
                onClick={() => {
                  setDifficulty(diffKey);
                  startNewGame(theme, diffKey);
                }}
              >
                {DIFFICULTY_CONFIG[diffKey].name}
              </button>
            ))}
          </div>
        </div>

        <div className="cz-header-center">
          <h1 className="cz-title">CRUZADINHA</h1>
          <span className="cz-subtitle">Palavras Cruzadas da Gruta</span>
        </div>

        <div className="cz-header-actions">
          <button
            type="button"
            className="cz-btn-new-game"
            onClick={() => startNewGame()}
            title="Começar Novo Jogo"
          >
            Novo Jogo
          </button>

          <div className="cz-timer-pill" title="Tempo da Partida">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(timer)}</span>
          </div>

          <button
            type="button"
            className="cz-icon-btn"
            onClick={() => setShowHelpModal(true)}
            title="Como Jogar"
            aria-label="Como Jogar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>

          <button
            type="button"
            className="cz-icon-btn"
            onClick={() => setShowStatsModal(true)}
            title="Estatísticas"
            aria-label="Estatísticas"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Toolbar: Seletor de Tema e Botão Desistir */}
      <div className="cz-toolbar">
        <div className="cz-theme-selector-wrap" ref={dropdownRef}>
          <label className="cz-theme-label">TEMA:</label>
          <button
            type="button"
            className="cz-theme-btn"
            onClick={() => setThemeDropdownOpen((prev) => !prev)}
            aria-expanded={themeDropdownOpen}
          >
            <span>{THEME_LABELS[theme]?.label || "🎲 Aleatório"}</span>
            <svg
              className={`cz-chevron ${themeDropdownOpen ? "open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {themeDropdownOpen && (
            <div className="cz-theme-menu">
              {Object.entries(THEME_LABELS).map(([k, item]) => (
                <button
                  key={k}
                  type="button"
                  className={`cz-theme-option ${theme === k ? "selected" : ""}`}
                  onClick={() => {
                    setTheme(k);
                    setThemeDropdownOpen(false);
                    startNewGame(k, difficulty);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cz-toolbar-right">
          <button
            type="button"
            className={`cz-btn-giveup ${confirmGiveUp ? "confirming" : ""}`}
            onClick={handleGiveUp}
            disabled={isGameOver}
          >
            {confirmGiveUp ? "Confirmar Desistência?" : "Desistir"}
          </button>
        </div>
      </div>

      {/* Barra de Dica Ativa (fixa em cima do tabuleiro) */}
      <div className="cz-active-clue-bar">
        <button
          type="button"
          className="cz-clue-nav-btn"
          onClick={() => navigateWord(-1)}
          title="Palavra Anterior"
          aria-label="Palavra Anterior"
        >
          ‹
        </button>

        <div
          className="cz-active-clue-content"
          onClick={toggleDirection}
          title="Clique para alternar entre Horizontal e Vertical"
        >
          {currentWord ? (
            <>
              <span className="cz-clue-badge">
                #{currentWord.number} {currentWord.dir === "H" ? "HORIZONTAL" : "VERTICAL"}
              </span>
              <p className="cz-clue-text">{currentWord.clue}</p>
            </>
          ) : (
            <p className="cz-clue-text">Selecione uma casa para ver a dica.</p>
          )}
        </div>

        <button
          type="button"
          className="cz-clue-nav-btn"
          onClick={() => navigateWord(1)}
          title="Próxima Palavra"
          aria-label="Próxima Palavra"
        >
          ›
        </button>
      </div>

      {/* Layout Principal: Tabuleiro + Painel de Dicas */}
      <main className="cz-main-area">
        <div className="cz-board-section">
          {puzzle && (
            <div
              className="cz-grid-container"
              ref={boardRef}
              style={{
                gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
              }}
            >
              {puzzle.grid.map((row, r) =>
                row.map((cell, c) => {
                  if (cell.isBlock) {
                    return <div key={`${r}-${c}`} className="cz-cell cz-cell-block" />;
                  }

                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const isInWord = isCellInActiveWord(r, c);
                  const userVal = userGrid[r]?.[c] || "";
                  const isCorrect = surrendered || (isGameOver && userVal === cell.solution);
                  const isWrong = isGameOver && !gameWon && userVal !== cell.solution;

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={`cz-cell cz-cell-letter ${isInWord ? "in-word" : ""} ${
                        isSelected ? "focused" : ""
                      } ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {cell.number && <span className="cz-cell-number">{cell.number}</span>}
                      <span className="cz-cell-value">{userVal}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Painel Lateral com Dicas */}
        <aside className="cz-clues-aside">
          <div className="cz-clues-column">
            <h3 className="cz-clues-heading">
              <span className="cz-clues-icon">➡️</span> Horizontais
            </h3>
            <div className="cz-clues-list">
              {horizontalWords.map((w) => {
                const filled = isWordFilled(w);
                const isActive = currentWord?.index === w.index;
                return (
                  <button
                    key={`H-${w.number}-${w.word}`}
                    type="button"
                    className={`cz-clue-item ${isActive ? "active" : ""} ${
                      filled ? "completed" : ""
                    }`}
                    onClick={() => selectWordFromClue(w)}
                  >
                    <span className="cz-clue-item-number">{w.number}</span>
                    <span className="cz-clue-item-text">{w.clue}</span>
                    <span className="cz-clue-item-len">({w.word.length})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cz-clues-column">
            <h3 className="cz-clues-heading">
              <span className="cz-clues-icon">⬇️</span> Verticais
            </h3>
            <div className="cz-clues-list">
              {verticalWords.map((w) => {
                const filled = isWordFilled(w);
                const isActive = currentWord?.index === w.index;
                return (
                  <button
                    key={`V-${w.number}-${w.word}`}
                    type="button"
                    className={`cz-clue-item ${isActive ? "active" : ""} ${
                      filled ? "completed" : ""
                    }`}
                    onClick={() => selectWordFromClue(w)}
                  >
                    <span className="cz-clue-item-number">{w.number}</span>
                    <span className="cz-clue-item-text">{w.clue}</span>
                    <span className="cz-clue-item-len">({w.word.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Teclado Virtual Mobile */}
      <div className="cz-keyboard">
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="cz-keyboard-row">
            {row.map((key) => {
              const isBksp = key === "BKSP";
              return (
                <button
                  key={key}
                  type="button"
                  className={`cz-key ${isBksp ? "cz-key-backspace" : ""}`}
                  onClick={() => {
                    if (isBksp) handleBackspace();
                    else handleInputCharacter(key);
                  }}
                >
                  {isBksp ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* MODAL: VITÓRIA */}
      {showWinModal && (
        <div className="cz-modal-overlay" onClick={() => setShowWinModal(false)}>
          <div className="cz-modal-card win-card" onClick={(e) => e.stopPropagation()}>
            <div className="cz-win-trophy">🏆</div>
            <h2 className="cz-modal-title">Parabéns!</h2>
            <p className="cz-modal-desc">Você desvendou toda a cruzadinha com maestria!</p>

            <div className="cz-win-stats-grid">
              <div className="cz-win-stat-box">
                <span className="cz-win-stat-val">{formatTime(timer)}</span>
                <span className="cz-win-stat-lbl">Tempo</span>
              </div>
              <div className="cz-win-stat-box">
                <span className="cz-win-stat-val">{puzzle?.words.length || 0}</span>
                <span className="cz-win-stat-lbl">Palavras</span>
              </div>
              <div className="cz-win-stat-box">
                <span className="cz-win-stat-val">
                  {DIFFICULTY_CONFIG[difficulty]?.name}
                </span>
                <span className="cz-win-stat-lbl">Nível</span>
              </div>
            </div>

            <button
              type="button"
              className="cz-btn-modal-action"
              onClick={() => {
                setShowWinModal(false);
                startNewGame();
              }}
            >
              🔄 Jogar Novamente
            </button>
          </div>
        </div>
      )}

      {/* MODAL: COMO JOGAR */}
      {showHelpModal && (
        <div className="cz-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="cz-modal-card help-card" onClick={(e) => e.stopPropagation()}>
            <div className="cz-modal-header">
              <h3>Como Jogar Cruzadinha</h3>
              <button
                type="button"
                className="cz-modal-close"
                onClick={() => setShowHelpModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="cz-help-list">
              <div className="cz-help-item">
                <div className="cz-help-icon">1</div>
                <div>
                  <strong>Preencha as letras:</strong>
                  <p>
                    Clique numa casa e digite a resposta. O cursor avança automaticamente para a
                    próxima casa vazia da palavra.
                  </p>
                </div>
              </div>
              <div className="cz-help-item">
                <div className="cz-help-icon">2</div>
                <div>
                  <strong>Alternar direção:</strong>
                  <p>
                    Clique duas vezes na mesma célula ou pressione <kbd>Espaço</kbd> para alternar
                    entre Horizontal e Vertical.
                  </p>
                </div>
              </div>
              <div className="cz-help-item">
                <div className="cz-help-icon">3</div>
                <div>
                  <strong>Navegação de palavras:</strong>
                  <p>
                    Use as setas ‹ e › na barra de dicas ou pressione <kbd>Tab</kbd> /{" "}
                    <kbd>Enter</kbd> no teclado para ir à próxima palavra.
                  </p>
                </div>
              </div>
              <div className="cz-help-item">
                <div className="cz-help-icon">4</div>
                <div>
                  <strong>Temas e Dificuldades:</strong>
                  <p>
                    Escolha entre 17 temas variados e teste seus conhecimentos em Fácil (10x10),
                    Médio (14x14) ou Difícil (18x18).
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cz-btn-modal-action"
              onClick={() => setShowHelpModal(false)}
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ESTATÍSTICAS */}
      {showStatsModal && (
        <div className="cz-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="cz-modal-card stats-card" onClick={(e) => e.stopPropagation()}>
            <div className="cz-modal-header">
              <h3>Suas Estatísticas</h3>
              <button
                type="button"
                className="cz-modal-close"
                onClick={() => setShowStatsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="cz-stats-row">
              <div className="cz-stat-box">
                <span className="cz-stat-num">{stats.played}</span>
                <span className="cz-stat-label">Jogadas</span>
              </div>
              <div className="cz-stat-box">
                <span className="cz-stat-num">{stats.won}</span>
                <span className="cz-stat-label">Vitórias</span>
              </div>
              <div className="cz-stat-box">
                <span className="cz-stat-num">
                  {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
                </span>
                <span className="cz-stat-label">% Vitórias</span>
              </div>
              <div className="cz-stat-box">
                <span className="cz-stat-num">
                  {stats.bestTime !== null ? formatTime(stats.bestTime) : "--:--"}
                </span>
                <span className="cz-stat-label">Melhor Tempo</span>
              </div>
            </div>
            <button
              type="button"
              className="cz-btn-modal-action"
              onClick={() => setShowStatsModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
