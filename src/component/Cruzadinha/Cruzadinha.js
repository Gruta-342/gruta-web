"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchPlayerProgress, saveGameCompletion } from "../../lib/playerClient";
import { getBrazilDateKey } from "../../lib/playerDate";
import "./Cruzadinha.css";
import {
  generateCrosswordPuzzle,
  THEME_LABELS,
} from "../../lib/cruzadinhaGenerator.js";

const MODE_LABELS = {
  daily: "Diário",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const INITIAL_MODE_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  bestTime: null,
  lastTime: null,
};

const INITIAL_STATS = {
  daily: { ...INITIAL_MODE_STATS },
  easy: { ...INITIAL_MODE_STATS },
  medium: { ...INITIAL_MODE_STATS },
  hard: { ...INITIAL_MODE_STATS },
};

function mergeWithInitialStats(savedExtra) {
  if (!savedExtra || typeof savedExtra !== "object") return INITIAL_STATS;
  return {
    daily: { ...INITIAL_MODE_STATS, ...(savedExtra.daily || {}) },
    easy: { ...INITIAL_MODE_STATS, ...(savedExtra.easy || {}) },
    medium: { ...INITIAL_MODE_STATS, ...(savedExtra.medium || {}) },
    hard: { ...INITIAL_MODE_STATS, ...(savedExtra.hard || {}) },
  };
}

function getTodayKey() {
  return getBrazilDateKey(0);
}

function getDailyPuzzleNumber() {
  const dateKey = getBrazilDateKey(0);
  const [y, m, d] = dateKey.split("-").map(Number);
  const epoch = Date.UTC(2026, 0, 1);
  const todayUtc = Date.UTC(y, m - 1, d);
  const diffDays = Math.floor((todayUtc - epoch) / 86400000);
  return Math.max(1, diffDays + 1);
}

function getSecondsUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.floor((tomorrow - now) / 1000));
}

function createSeededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDeterministicDailyPuzzle(dateKey) {
  const seededRng = createSeededRandom(`GRUTA_CRUZADINHA_${dateKey}`);
  const originalRandom = Math.random;
  Math.random = seededRng;
  try {
    return generateCrosswordPuzzle("random", "hard");
  } finally {
    Math.random = originalRandom;
  }
}

export default function Cruzadinha() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isGuest = status === "unauthenticated";

  const [gameMode, setGameMode] = useState("daily"); // "daily" | "easy" | "medium" | "hard"
  const [theme, setTheme] = useState("random");
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState("H");
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);

  // Timer & Game Status
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const giveUpTimeoutRef = useRef(null);

  // Modals & Dropdowns
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMobileCluesModal, setShowMobileCluesModal] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [diffDropdownOpen, setDiffDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Stats & Countdown
  const [stats, setStats] = useState(INITIAL_STATS);
  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilMidnight());

  const boardRef = useRef(null);
  const cluesAsideRef = useRef(null);
  const clueItemRefs = useRef({});
  const themeDropdownRef = useRef(null);
  const diffDropdownRef = useRef(null);

  const timerRef = useRef(0);
  const gameModeRef = useRef(gameMode);
  const statsRef = useRef(stats);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const dailyCompletionCacheRef = useRef(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const isDaily = gameMode === "daily";

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  const recordGameResult = useCallback(
    async (won, timeTaken, modeKey, finalGrid, wordsCount) => {
      const prevStats = statsRef.current;
      const curr = prevStats[modeKey] || INITIAL_MODE_STATS;
      const newPlayed = curr.played + 1;
      const newWon = won ? curr.won + 1 : curr.won;
      const newCurrentStreak = won ? curr.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(curr.maxStreak, newCurrentStreak);
      const prevBest = curr.bestTime ?? null;
      const newBest = won
        ? prevBest === null
          ? timeTaken
          : Math.min(prevBest, timeTaken)
        : prevBest;

      const updatedStats = {
        ...prevStats,
        [modeKey]: {
          played: newPlayed,
          won: newWon,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          bestTime: newBest,
          lastTime: timeTaken,
        },
      };

      setStats(updatedStats);
      statsRef.current = updatedStats;

      if (modeKey === "daily") {
        dailyCompletionCacheRef.current = {
          won,
          score: timeTaken,
          state: {
            userGrid: finalGrid,
            timer: timeTaken,
            isGameOver: true,
            gameWon: won,
            surrendered: !won,
          },
        };
      }

      if (isAuthenticatedRef.current) {
        const todayKey = getTodayKey();
        try {
          const res = await saveGameCompletion({
            gameId: "cruzadinha-gruta",
            mode: modeKey === "daily" ? "daily" : "infinite",
            dateKey: modeKey === "daily" ? todayKey : undefined,
            won,
            attempts: wordsCount,
            score: timeTaken,
            state:
              modeKey === "daily"
                ? {
                    userGrid: finalGrid,
                    timer: timeTaken,
                    isGameOver: true,
                    gameWon: won,
                    surrendered: !won,
                  }
                : null,
            extra: updatedStats,
          });

          if (res?.progress?.stats?.["cruzadinha-gruta"]?.extra) {
            const serverStats = mergeWithInitialStats(
              res.progress.stats["cruzadinha-gruta"].extra
            );
            setStats(serverStats);
            statsRef.current = serverStats;
          }
        } catch (err) {
          console.error("Erro ao salvar progresso da Cruzadinha:", err);
        }
      }

      setTimeout(() => setShowStatsModal(true), 900);
    },
    []
  );

  const startNewGame = useCallback(
    (targetMode = gameMode, targetTheme = theme, overrideDailyEntry = undefined) => {
      try {
        const dailyMode = targetMode === "daily";
        const resolvedTheme = dailyMode ? "random" : targetTheme;
        const resolvedDiff = dailyMode ? "hard" : targetMode;

        if (dailyMode) {
          setTheme("random");
        }

        const todayKey = getTodayKey();
        const p = dailyMode
          ? generateDeterministicDailyPuzzle(todayKey)
          : generateCrosswordPuzzle(resolvedTheme, resolvedDiff);

        setPuzzle(p);
        clueItemRefs.current = {};

        let restoredDaily = null;
        if (dailyMode && isAuthenticatedRef.current) {
          const entry =
            overrideDailyEntry !== undefined
              ? overrideDailyEntry
              : dailyCompletionCacheRef.current;

          if (entry) {
            const savedState = entry.state || {};
            if (
              Array.isArray(savedState.userGrid) &&
              savedState.userGrid.length === p.rows &&
              savedState.userGrid[0]?.length === p.cols
            ) {
              restoredDaily = {
                userGrid: savedState.userGrid,
                timer: savedState.timer ?? entry.score ?? 0,
                isGameOver: true,
                gameWon: Boolean(savedState.gameWon ?? entry.won),
                surrendered: Boolean(savedState.surrendered ?? !entry.won),
              };
            } else {
              const fallbackGrid = p.grid.map((row) =>
                row.map((cell) => (cell.isBlock ? "" : cell.solution))
              );
              restoredDaily = {
                userGrid: fallbackGrid,
                timer: entry.score ?? 0,
                isGameOver: true,
                gameWon: Boolean(entry.won),
                surrendered: !entry.won,
              };
            }
          }
        }

        if (restoredDaily) {
          setUserGrid(restoredDaily.userGrid);
          setTimer(restoredDaily.timer);
          setIsGameOver(true);
          setGameWon(restoredDaily.gameWon);
          setSurrendered(restoredDaily.surrendered);
          setIsTimerRunning(false);
          setTimeout(() => setShowStatsModal(true), 500);
        } else {
          const emptyUserGrid = Array(p.rows)
            .fill(null)
            .map(() => Array(p.cols).fill(""));
          setUserGrid(emptyUserGrid);
          setTimer(0);
          setIsTimerRunning(true);
          setIsGameOver(false);
          setGameWon(false);
          setSurrendered(false);
        }

        if (p.words.length > 0) {
          const firstWord = p.words[0];
          setSelectedCell({ r: firstWord.r, c: firstWord.c });
          setSelectedDirection(firstWord.dir);
          setSelectedWordIndex(0);
        } else {
          setSelectedCell(null);
          setSelectedWordIndex(0);
        }

        setConfirmGiveUp(false);
        setShowMobileCluesModal(false);
      } catch (err) {
        console.error("Erro ao inicializar jogo:", err);
        showToast("Erro ao gerar cruzadinha. Tentando novamente...");
      }
    },
    [gameMode, theme, showToast]
  );

  // Inicializa assim que o estado da sessão estiver definido
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function bootstrap() {
      if (status === "authenticated") {
        try {
          const data = await fetchPlayerProgress();
          if (cancelled) return;

          if (data?.authenticated && data?.progress) {
            const p = data.progress;
            const serverStats = mergeWithInitialStats(p.stats?.["cruzadinha-gruta"]?.extra);
            setStats(serverStats);
            statsRef.current = serverStats;

            const todayCompletion = p.dailyStates?.["cruzadinha-gruta"] || null;
            dailyCompletionCacheRef.current = todayCompletion;
            startNewGame("daily", "random", todayCompletion);
            return;
          }
        } catch (err) {
          console.error("Erro ao carregar progresso da Cruzadinha:", err);
        }
      } else {
        setStats(INITIAL_STATS);
        statsRef.current = INITIAL_STATS;
        dailyCompletionCacheRef.current = null;
      }

      if (!cancelled) {
        startNewGame("daily", "random", null);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [status, startNewGame]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setSecondsRemaining(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && !isGameOver) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGameOver]);

  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatCountdown = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
      if (diffDropdownRef.current && !diffDropdownRef.current.contains(e.target)) {
        setDiffDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentWord = useMemo(() => {
    if (!puzzle || !puzzle.words.length) return null;
    return puzzle.words[selectedWordIndex] || puzzle.words[0];
  }, [puzzle, selectedWordIndex]);

  // Rola automaticamente a lista lateral de dicas (Web) sempre que a dica ativa mudar e estiver fora da área visível
  useEffect(() => {
    if (!currentWord || !cluesAsideRef.current) return;
    const clueEl = clueItemRefs.current[currentWord.index];
    if (!clueEl) return;

    const container = cluesAsideRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = clueEl.getBoundingClientRect();

    const isOutOfView =
      itemRect.top < containerRect.top + 8 || itemRect.bottom > containerRect.bottom - 8;

    if (isOutOfView) {
      clueEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentWord]);

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

  // Conjunto de coordenadas (r-c) pertencentes a qualquer palavra já acertada
  const solvedCellsSet = useMemo(() => {
    const set = new Set();
    if (!puzzle || !userGrid.length) return set;

    for (const w of puzzle.words) {
      let wordCorrect = true;
      for (let i = 0; i < w.word.length; i++) {
        const curR = w.dir === "V" ? w.r + i : w.r;
        const curC = w.dir === "H" ? w.c + i : w.c;
        const userChar = userGrid[curR]?.[curC];
        const expectedChar = puzzle.grid[curR]?.[curC]?.solution;
        if (!userChar || userChar !== expectedChar) {
          wordCorrect = false;
          break;
        }
      }
      if (wordCorrect) {
        for (let i = 0; i < w.word.length; i++) {
          const curR = w.dir === "V" ? w.r + i : w.r;
          const curC = w.dir === "H" ? w.c + i : w.c;
          set.add(`${curR}-${curC}`);
        }
      }
    }
    return set;
  }, [puzzle, userGrid]);

  const handleCellClick = useCallback(
    (r, c) => {
      if (isGameOver || !puzzle) return;
      const cell = puzzle.grid[r][c];
      if (cell.isBlock) return;

      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        if (cell.dirs && cell.dirs.includes("H") && cell.dirs.includes("V")) {
          const nextDir = selectedDirection === "H" ? "V" : "H";
          setSelectedDirection(nextDir);
          const w = findWordForCellAndDir(r, c, nextDir);
          if (w) setSelectedWordIndex(w.index);
          return;
        }
      }

      setSelectedCell({ r, c });

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

  const navigateWord = useCallback(
    (delta) => {
      if (!puzzle || !puzzle.words.length) return;
      let nextIndex = selectedWordIndex + delta;
      if (nextIndex < 0) nextIndex = puzzle.words.length - 1;
      if (nextIndex >= puzzle.words.length) nextIndex = 0;

      const w = puzzle.words[nextIndex];
      setSelectedWordIndex(nextIndex);
      setSelectedDirection(w.dir);

      let targetCell = { r: w.r, c: w.c };
      for (let i = 0; i < w.word.length; i++) {
        const curR = w.dir === "V" ? w.r + i : w.r;
        const curC = w.dir === "H" ? w.c + i : w.c;
        if (!userGrid[curR]?.[curC]) {
          targetCell = { r: curR, c: curC };
          break;
        }
      }
      setSelectedCell(targetCell);
    },
    [puzzle, selectedWordIndex, userGrid]
  );

  const selectWordFromClue = useCallback(
    (wordObj, closeMobileMenu = false) => {
      if (!isGameOver) {
        setSelectedWordIndex(wordObj.index);
        setSelectedDirection(wordObj.dir);

        let targetCell = { r: wordObj.r, c: wordObj.c };
        for (let i = 0; i < wordObj.word.length; i++) {
          const curR = wordObj.dir === "V" ? wordObj.r + i : wordObj.r;
          const curC = wordObj.dir === "H" ? wordObj.c + i : wordObj.c;
          if (!userGrid[curR]?.[curC]) {
            targetCell = { r: curR, c: curC };
            break;
          }
        }
        setSelectedCell(targetCell);
      }

      if (closeMobileMenu) {
        setShowMobileCluesModal(false);
      }
    },
    [isGameOver, userGrid]
  );

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
          const elapsedTime = timerRef.current;
          setIsGameOver(true);
          setGameWon(true);
          setIsTimerRunning(false);
          recordGameResult(
            true,
            elapsedTime,
            gameModeRef.current,
            currentUserGrid,
            puzzle.words.length
          );
          showToast("Sensacional! Você desvendou a cruzadinha!");
        } else {
          showToast("A grade está completa, mas ainda há letras incorretas!");
        }
      }
    },
    [puzzle, recordGameResult, showToast]
  );

  const handleInputCharacter = useCallback(
    (rawChar) => {
      if (isGameOver || !puzzle || !selectedCell || !currentWord) return;
      const char = rawChar.toUpperCase();
      if (!/^[A-Z]$/.test(char)) return;

      const { r, c } = selectedCell;
      const cell = puzzle.grid[r][c];
      if (cell.isBlock) return;

      const wordLen = currentWord.word.length;
      const wordStartR = currentWord.r;
      const wordStartC = currentWord.c;
      const isVert = currentWord.dir === "V";
      const charIdxInWord = isVert ? r - wordStartR : c - wordStartC;

      const newGrid = userGrid.map((row) => [...row]);
      const isCellLocked = solvedCellsSet.has(`${r}-${c}`);

      // Só altera o valor da célula se ela NÃO pertencer a uma palavra já acertada
      if (!isCellLocked) {
        newGrid[r][c] = char;
        setUserGrid(newGrid);
      }

      // Procura a próxima célula não preenchida e não travada na palavra atual
      let nextTarget = null;
      for (let step = charIdxInWord + 1; step < wordLen; step++) {
        const nextR = isVert ? wordStartR + step : wordStartR;
        const nextC = isVert ? wordStartC : wordStartC + step;
        if (!newGrid[nextR][nextC] && !solvedCellsSet.has(`${nextR}-${nextC}`)) {
          nextTarget = { r: nextR, c: nextC };
          break;
        }
      }

      // Se todas à frente já estiverem preenchidas, avança para a próxima célula editável (não verde)
      if (!nextTarget) {
        for (let step = charIdxInWord + 1; step < wordLen; step++) {
          const nextR = isVert ? wordStartR + step : wordStartR;
          const nextC = isVert ? wordStartC : wordStartC + step;
          if (!solvedCellsSet.has(`${nextR}-${nextC}`)) {
            nextTarget = { r: nextR, c: nextC };
            break;
          }
        }
      }

      // Verifica se a palavra atual acabou de ficar 100% correta
      let currentWordJustSolved = true;
      for (let k = 0; k < wordLen; k++) {
        const checkR = isVert ? wordStartR + k : wordStartR;
        const checkC = isVert ? wordStartC : wordStartC + k;
        if (newGrid[checkR][checkC] !== puzzle.grid[checkR][checkC].solution) {
          currentWordJustSolved = false;
          break;
        }
      }

      // Se chegou ao fim da palavra ou acabou de completá-la corretamente, salta para a próxima palavra pendente
      if (!nextTarget || currentWordJustSolved) {
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
      }

      if (nextTarget) {
        setSelectedCell(nextTarget);
      }

      checkVictoryCondition(newGrid);
    },
    [
      isGameOver,
      puzzle,
      selectedCell,
      currentWord,
      userGrid,
      solvedCellsSet,
      checkVictoryCondition,
    ]
  );

  const handleBackspace = useCallback(() => {
    if (isGameOver || !puzzle || !selectedCell || !currentWord) return;
    const { r, c } = selectedCell;
    const isVert = currentWord.dir === "V";
    const charIdxInWord = isVert ? r - currentWord.r : c - currentWord.c;
    const isCurrentLocked = solvedCellsSet.has(`${r}-${c}`);

    const newGrid = userGrid.map((row) => [...row]);

    // Se a célula atual tem letra e NÃO está travada (verde), apenas apaga ela
    if (newGrid[r][c] !== "" && !isCurrentLocked) {
      newGrid[r][c] = "";
      setUserGrid(newGrid);
      return;
    }

    // Caso contrário (célula vazia ou célula verde bloqueada), recua pulando células verdes
    for (let step = charIdxInWord - 1; step >= 0; step--) {
      const prevR = isVert ? currentWord.r + step : currentWord.r;
      const prevC = isVert ? currentWord.c : currentWord.c + step;

      if (solvedCellsSet.has(`${prevR}-${prevC}`)) {
        continue;
      }

      if (newGrid[prevR][prevC] !== "") {
        newGrid[prevR][prevC] = "";
        setUserGrid(newGrid);
      }
      setSelectedCell({ r: prevR, c: prevC });
      return;
    }
  }, [isGameOver, puzzle, selectedCell, currentWord, userGrid, solvedCellsSet]);

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

  useEffect(() => {
    function handleKeyDown(e) {
      if (
        showHelpModal ||
        showStatsModal ||
        showMobileCluesModal ||
        diffDropdownOpen ||
        themeDropdownOpen
      )
        return;

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
    showMobileCluesModal,
    diffDropdownOpen,
    themeDropdownOpen,
    navigateWord,
    toggleDirection,
    handleBackspace,
    handleArrowMove,
    handleInputCharacter,
  ]);

  const handleGiveUp = useCallback(() => {
    if (isGameOver || !puzzle) return;
    if (!confirmGiveUp) {
      setConfirmGiveUp(true);
      if (giveUpTimeoutRef.current) clearTimeout(giveUpTimeoutRef.current);
      giveUpTimeoutRef.current = setTimeout(() => {
        setConfirmGiveUp(false);
      }, 3500);
      return;
    }

    const elapsedTime = timerRef.current;
    setConfirmGiveUp(false);
    setIsGameOver(true);
    setSurrendered(true);
    setIsTimerRunning(false);

    const revealedGrid = puzzle.grid.map((row) =>
      row.map((cell) => (cell.isBlock ? "" : cell.solution))
    );
    setUserGrid(revealedGrid);
    recordGameResult(
      false,
      elapsedTime,
      gameModeRef.current,
      revealedGrid,
      puzzle.words.length
    );
    showToast("Respostas reveladas. Mais sorte na próxima!");
  }, [isGameOver, confirmGiveUp, puzzle, recordGameResult, showToast]);

  const handleShare = async () => {
    const dayNum = getDailyPuzzleNumber();
    const totalWords = puzzle?.words.length || 0;
    const outcomeText = gameWon
      ? `🏆 ${formatTime(timer)} (${totalWords}/${totalWords} palavras)`
      : `💀 Desistiu • ${formatTime(timer)}`;
    const shareText = `Joguei Cruzadinha na Gruta\n#${dayNum} ${outcomeText}\n\ngruta342.app/jogos/cruzadinha`;

    try {
      await navigator.clipboard.writeText(shareText);
      showToast("Copiado para a área de transferência!");
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({ title: "Cruzadinha da Gruta", text: shareText });
      } catch (e) {}
    }
  };

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

  // Verifica se todas as letras da palavra estão corretas
  const isWordSolved = useCallback(
    (w) => {
      if (!puzzle || !userGrid.length || !w) return false;
      for (let i = 0; i < w.word.length; i++) {
        const curR = w.dir === "V" ? w.r + i : w.r;
        const curC = w.dir === "H" ? w.c + i : w.c;
        const userChar = userGrid[curR]?.[curC];
        const expectedChar = puzzle.grid[curR]?.[curC]?.solution;
        if (!userChar || userChar !== expectedChar) return false;
      }
      return true;
    },
    [puzzle, userGrid]
  );

  const isCurrentWordSolved = useMemo(() => {
    return currentWord ? isWordSolved(currentWord) : false;
  }, [currentWord, isWordSolved]);

  const horizontalWords = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.words.filter((w) => w.dir === "H").sort((a, b) => a.number - b.number);
  }, [puzzle]);

  const verticalWords = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.words.filter((w) => w.dir === "V").sort((a, b) => a.number - b.number);
  }, [puzzle]);

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["CLUES", "Z", "X", "C", "V", "B", "N", "M", "BKSP"],
  ];

  const currentModeStats = stats[gameMode] || INITIAL_MODE_STATS;
  const winPercentage =
    currentModeStats.played > 0
      ? Math.round((currentModeStats.won / currentModeStats.played) * 100)
      : 0;
  const totalLosses = Math.max(0, currentModeStats.played - currentModeStats.won);
  const maxResultCount = Math.max(currentModeStats.won, totalLosses, 1);

  const matchTimeToShow = isGameOver
    ? timer > 0
      ? timer
      : (currentModeStats.lastTime ?? null)
    : (currentModeStats.lastTime ?? null);

  const renderCluesColumns = (closeOnSelect = false) => (
    <>
      <div className="cz-clues-column">
        <h3 className="cz-clues-heading">
          <span className="cz-clues-icon">➡️</span> Horizontais
        </h3>
        <div className="cz-clues-list">
          {horizontalWords.map((w) => {
            const solved = isWordSolved(w);
            const isActive = currentWord?.index === w.index;
            return (
              <button
                key={`H-${w.number}-${w.word}`}
                ref={(el) => {
                  if (!closeOnSelect) {
                    clueItemRefs.current[w.index] = el;
                  }
                }}
                type="button"
                className={`cz-clue-item ${isActive ? "active" : ""} ${solved ? "completed" : ""}`}
                onClick={() => selectWordFromClue(w, closeOnSelect)}
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
            const solved = isWordSolved(w);
            const isActive = currentWord?.index === w.index;
            return (
              <button
                key={`V-${w.number}-${w.word}`}
                ref={(el) => {
                  if (!closeOnSelect) {
                    clueItemRefs.current[w.index] = el;
                  }
                }}
                type="button"
                className={`cz-clue-item ${isActive ? "active" : ""} ${solved ? "completed" : ""}`}
                onClick={() => selectWordFromClue(w, closeOnSelect)}
              >
                <span className="cz-clue-item-number">{w.number}</span>
                <span className="cz-clue-item-text">{w.clue}</span>
                <span className="cz-clue-item-len">({w.word.length})</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="cz-page-shell">
      <div className="cz-game-wrapper">
        {toastMessage && <div className="cz-toast">{toastMessage}</div>}

        {/* Cabeçalho Unificado (Padrão Termo) */}
        <header className="cz-header">
          <div className="cz-header-left">
            <Link href="/jogos" className="cz-header-btn cz-header-back-btn">
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
              <span className="cz-hide-mobile">JOGOS</span>
            </Link>

            <div className="cz-mode-dropdown-container" ref={diffDropdownRef}>
              <button
                type="button"
                className="cz-header-btn"
                onClick={() => setDiffDropdownOpen((prev) => !prev)}
              >
                <span className="cz-hide-mobile">MODO: </span>
                {(MODE_LABELS[gameMode] || "Diário").toUpperCase()}
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
                    transform: diffDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {diffDropdownOpen && (
                <div className="cz-mode-dropdown-menu">
                  {["daily", "easy", "medium", "hard"].map((modeKey) => (
                    <button
                      key={modeKey}
                      type="button"
                      className={`cz-dropdown-item ${gameMode === modeKey ? "active" : ""}`}
                      onClick={() => {
                        setGameMode(modeKey);
                        setDiffDropdownOpen(false);
                        startNewGame(modeKey, modeKey === "daily" ? "random" : theme);
                      }}
                    >
                      {MODE_LABELS[modeKey].toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cz-header-center">
            <h1 className="cz-title">CRUZADINHA</h1>
            <span className="cz-subtitle">
              {isDaily
                ? `DESAFIO DIÁRIO #${getDailyPuzzleNumber()} DA GRUTA`
                : "PALAVRAS CRUZADAS DA GRUTA"}
            </span>
          </div>

          <div className="cz-header-right">
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
                strokeWidth="2.5"
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
                strokeWidth="2.5"
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

        {/* Toolbar: Seletor de Tema (oculto no Diário), Novo Jogo (oculto no Diário) e Desistir */}
        <div className="cz-toolbar">
          <div className="cz-theme-selector-wrap" ref={themeDropdownRef}>
            {isDaily ? (
              <div className="cz-daily-badge-pill">
                <span>🎲 Aleatório • Grade 18x18</span>
              </div>
            ) : (
              <>
                <label className="cz-theme-label cz-hide-mobile">TEMA:</label>
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
                          startNewGame(gameMode, k);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="cz-toolbar-right">
            {!isDaily && (
              <button
                type="button"
                className="cz-btn-new-game"
                onClick={() => startNewGame(gameMode, theme)}
                title="Começar Novo Jogo"
              >
                Novo Jogo
              </button>
            )}

            <button
              type="button"
              className={`cz-btn-giveup ${confirmGiveUp ? "confirming" : ""}`}
              onClick={handleGiveUp}
              disabled={isGameOver}
            >
              {confirmGiveUp ? "Confirmar?" : "Desistir"}
            </button>
          </div>
        </div>

        {/* Layout Principal: Tabuleiro + Painel de Dicas (Desktop) */}
        <main className="cz-main-area">
          <div className="cz-board-section">
            {puzzle && (
              <div
                className="cz-grid-container"
                ref={boardRef}
                style={{
                  "--cz-cols": puzzle.cols,
                  "--cz-rows": puzzle.rows,
                  gridTemplateColumns: `repeat(${puzzle.cols}, var(--cell-size))`,
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
                    const isInSolvedWord = solvedCellsSet.has(`${r}-${c}`);
                    const isCorrect =
                      surrendered ||
                      isInSolvedWord ||
                      (isGameOver && userVal === cell.solution);
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

          {/* Painel de dicas lateral fixo na versão Web */}
          <aside className="cz-clues-aside" ref={cluesAsideRef}>
            {renderCluesColumns(false)}
          </aside>
        </main>

        {/* Dock Inferior Mobile: Barra de Dica Ativa + Teclado Fixo */}
        <div className="cz-mobile-bottom-dock">
          <div className={`cz-active-clue-bar ${isCurrentWordSolved ? "solved" : ""}`}>
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
              title="Toque para alternar entre Horizontal e Vertical"
            >
              {currentWord ? (
                <>
                  <span className="cz-clue-badge">
                    #{currentWord.number} {currentWord.dir === "H" ? "HORIZONTAL" : "VERTICAL"}
                  </span>
                  <div className="cz-clue-text-wrap">
                    <p className={`cz-clue-text ${isCurrentWordSolved ? "completed" : ""}`}>
                      {currentWord.clue}
                    </p>
                  </div>
                </>
              ) : (
                <div className="cz-clue-text-wrap">
                  <p className="cz-clue-text">Selecione uma casa para ver a dica.</p>
                </div>
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

          <div className={`cz-keyboard ${isGameOver ? "game-over" : ""}`}>
            {keyboardRows.map((row, rowIdx) => (
              <div key={rowIdx} className="cz-keyboard-row">
                {row.map((key) => {
                  const isBksp = key === "BKSP";
                  const isCluesBtn = key === "CLUES";
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`cz-key ${isBksp ? "cz-key-backspace" : ""} ${
                        isCluesBtn ? "cz-key-clues" : ""
                      }`}
                      title={
                        isBksp
                          ? "Apagar"
                          : isCluesBtn
                          ? "Ver todas as dicas"
                          : undefined
                      }
                      aria-label={
                        isBksp
                          ? "Apagar"
                          : isCluesBtn
                          ? "Ver todas as dicas"
                          : key
                      }
                      onClick={() => {
                        if (isBksp) handleBackspace();
                        else if (isCluesBtn) setShowMobileCluesModal(true);
                        else handleInputCharacter(key);
                      }}
                    >
                      {isBksp ? (
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
                          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <line x1="18" y1="9" x2="12" y2="15" />
                          <line x1="12" y1="9" x2="18" y2="15" />
                        </svg>
                      ) : isCluesBtn ? (
                        <>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                          <span>DICAS</span>
                        </>
                      ) : (
                        key
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* MODAL SOBREPOSTO DE TODAS AS DICAS (MOBILE) */}
        {showMobileCluesModal && (
          <div className="cz-modal-overlay" onClick={() => setShowMobileCluesModal(false)}>
            <div
              className="cz-modal-card cz-mobile-clues-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cz-modal-header">
                <h3>TODAS AS DICAS</h3>
                <button
                  type="button"
                  className="cz-modal-close"
                  onClick={() => setShowMobileCluesModal(false)}
                  aria-label="Fechar dicas"
                >
                  ✕
                </button>
              </div>
              <div className="cz-mobile-clues-scroll">{renderCluesColumns(true)}</div>
            </div>
          </div>
        )}

        {/* MODAL: COMO JOGAR */}
        {showHelpModal && (
          <div className="cz-modal-overlay" onClick={() => setShowHelpModal(false)}>
            <div className="cz-modal-card help-card" onClick={(e) => e.stopPropagation()}>
              <div className="cz-modal-header">
                <h3>COMO JOGAR</h3>
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
                      Clique em qualquer dica na lista ou pressione <kbd>Tab</kbd> /{" "}
                      <kbd>Enter</kbd> no teclado para ir à próxima palavra.
                    </p>
                  </div>
                </div>
                <div className="cz-help-item">
                  <div className="cz-help-icon">4</div>
                  <div>
                    <strong>Modos de Jogo:</strong>
                    <p>
                      Desafie-se no <strong>Diário</strong> (grade 18x18 aleatória igual para todos
                      a cada dia) ou jogue livremente em Fácil (10x10), Médio (14x14) ou Difícil
                      (18x18) com 17 temas.
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

        {/* MODAL: ESTATÍSTICAS (PADRÃO CAÇA MORCEGOS & TERMO) */}
        {showStatsModal && (
          <div className="cz-modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="cz-stats-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cz-modal-close-btn"
                onClick={() => setShowStatsModal(false)}
              >
                ✕
              </button>
              <h2 className="cz-stats-title">
                ESTATÍSTICAS - {(MODE_LABELS[gameMode] || "Diário").toUpperCase()}
              </h2>

              {isGuest && (
                <div className="cz-guest-save-box">
                  <p>
                    Faça login para salvar seu progresso, estatísticas e acender a Tocha da Gruta.
                  </p>
                  <Link href="/login" className="cz-guest-login-btn">
                    Fazer login para salvar
                  </Link>
                </div>
              )}

              <h3 className="cz-dist-title">PROGRESSO</h3>
              <div className="cz-stats-grid">
                <div className="cz-stat-box">
                  <span className="cz-stat-value">{currentModeStats.played}</span>
                  <span className="cz-stat-label">jogos</span>
                </div>
                <div className="cz-stat-box">
                  <span className="cz-stat-value">{winPercentage}%</span>
                  <span className="cz-stat-label">de vitórias</span>
                </div>
                <div className="cz-stat-box">
                  <span className="cz-stat-value">{currentModeStats.currentStreak}</span>
                  <span className="cz-stat-label">
                    sequência
                    <br />
                    de vitórias
                  </span>
                </div>
                <div className="cz-stat-box">
                  <span className="cz-stat-value">{currentModeStats.maxStreak}</span>
                  <span className="cz-stat-label">
                    melhor
                    <br />
                    sequência
                  </span>
                </div>
              </div>

              <div className="cz-time-stats-row">
                <div className="cz-time-stat-pill">
                  <span className="cz-time-stat-label">
                    {isGameOver ? "tempo da partida" : "última partida"}
                  </span>
                  <span className="cz-time-stat-value">{formatTime(matchTimeToShow)}</span>
                </div>
                <div className="cz-time-stat-pill">
                  <span className="cz-time-stat-label">melhor tempo</span>
                  <span className="cz-time-stat-value">
                    {formatTime(currentModeStats.bestTime ?? null)}
                  </span>
                </div>
              </div>

              <div className="cz-dist-section">
                <h3 className="cz-dist-title">HISTÓRICO DE RESULTADOS</h3>
                <div className="cz-dist-graph">
                  <div className="cz-dist-row">
                    <span className="cz-dist-num">🏆</span>
                    <div className="cz-dist-bar-wrapper">
                      <div
                        className={`cz-dist-bar ${isGameOver && gameWon ? "highlight" : ""}`}
                        style={{
                          width:
                            currentModeStats.played > 0
                              ? `${Math.max((currentModeStats.won / maxResultCount) * 100, 7)}%`
                              : "7%",
                        }}
                      >
                        {currentModeStats.won}
                      </div>
                    </div>
                  </div>
                  <div className="cz-dist-row">
                    <span className="cz-dist-num">💀</span>
                    <div className="cz-dist-bar-wrapper">
                      <div
                        className={`cz-dist-bar ${
                          isGameOver && !gameWon ? "loss-highlight" : "loss-bar"
                        }`}
                        style={{
                          width:
                            currentModeStats.played > 0
                              ? `${Math.max((totalLosses / maxResultCount) * 100, 7)}%`
                              : "7%",
                        }}
                      >
                        {totalLosses}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isDaily ? (
                <div className="cz-stats-footer">
                  <div className="cz-footer-col">
                    <span className="cz-next-label">próxima cruzadinha em</span>
                    <div className="cz-countdown">{formatCountdown(secondsRemaining)}</div>
                  </div>
                  {isGameOver && (
                    <div className="cz-footer-col align-right">
                      <button type="button" className="cz-share-btn" onClick={handleShare}>
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
                isGameOver && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatsModal(false);
                      startNewGame(gameMode, theme);
                    }}
                    className="cz-play-again-btn"
                  >
                    JOGAR NOVAMENTE
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}