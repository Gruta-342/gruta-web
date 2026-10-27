"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./Termo.css";
import {
  getDailyWord,
  getRandomWords,
  normalizeWord,
  getSecondsUntilNextWord,
  VALID_GUESSES
} from "./words";

const STATS_STORAGE_KEY = "gruta_termo_stats";
const STATE_STORAGE_KEY = "gruta_termo_game_state";

const GAME_MODES = {
  DAILY: { id: "DAILY", words: 1, length: 6, attempts: 6, label: "Desafio Diário" },
  NORMAL: { id: "NORMAL", words: 1, length: 5, attempts: 6, label: "Normal (5L)" },
  DOUBLE: { id: "DOUBLE", words: 2, length: 5, attempts: 7, label: "Duplo" },
  QUAD: { id: "QUAD", words: 4, length: 5, attempts: 9, label: "Quarteto" }
};

const INITIAL_STATS = {
  DAILY: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guesses: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 } },
  NORMAL: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guesses: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 } },
  DOUBLE: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guesses: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 } },
  QUAD: { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guesses: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 } }
};

function evaluateGuess(guess, target) {
  const result = Array(guess.length).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");
  const targetCounts = {};

  for (const ch of targetChars) {
    targetCounts[ch] = (targetCounts[ch] || 0) + 1;
  }
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetCounts[guessChars[i]]--;
    }
  }
  for (let i = 0; i < guessChars.length; i++) {
    if (result[i] === "correct") continue;
    const ch = guessChars[i];
    if (targetCounts[ch] && targetCounts[ch] > 0) {
      result[i] = "present";
      targetCounts[ch]--;
    }
  }
  return result;
}

export default function Termo() {
  const [activeMode, setActiveMode] = useState(GAME_MODES.DAILY);
  const [secretWords, setSecretWords] = useState([]);
  const [dayNumber, setDayNumber] = useState(0);
  
  const [guesses, setGuesses] = useState([]);
  const [solvedBoards, setSolvedBoards] = useState([]);
  const [currentGuessArray, setCurrentGuessArray] = useState([]);
  const [activeCol, setActiveCol] = useState(0);
  
  const [gameStatus, setGameStatus] = useState("IN_PROGRESS");
  const [shakeRow, setShakeRow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilNextWord());

  const gameStateRef = useRef({ currentGuessArray, activeCol, guesses, gameStatus, activeMode, secretWords, solvedBoards, dayNumber });
  useEffect(() => {
    gameStateRef.current = { currentGuessArray, activeCol, guesses, gameStatus, activeMode, secretWords, solvedBoards, dayNumber };
  }, [currentGuessArray, activeCol, guesses, gameStatus, activeMode, secretWords, solvedBoards, dayNumber]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg, duration = 2000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
  };

  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        if (parsed.DAILY) setStats(parsed);
      }
    } catch (e) {}
  }, []);

  const initGame = useCallback((mode) => {
    setActiveMode(mode);
    setIsModeDropdownOpen(false);

    if (mode.id === "DAILY") {
      const daily = getDailyWord();
      setSecretWords([daily.word]);
      setDayNumber(daily.dayNumber);

      // Restaura o progresso do desafio diário se já tiver começado
      try {
        const savedState = localStorage.getItem(STATE_STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.dayNumber === daily.dayNumber) {
            setGuesses(parsed.guesses || []);
            setGameStatus(parsed.gameStatus || "IN_PROGRESS");
            setSolvedBoards(parsed.gameStatus === "WON" ? [0] : []);
            setCurrentGuessArray(Array(mode.length).fill(""));
            setActiveCol(0);
            
            if (parsed.gameStatus !== "IN_PROGRESS") {
              setTimeout(() => setShowStatsModal(true), 600);
            }
            return; // Encerra o setup aqui para não zerar as variáveis abaixo
          }
        }
      } catch (e) {}
    } else {
      setSecretWords(getRandomWords(mode.words, mode.length));
    }

    // Configuração do zero para os modos infinitos ou para um novo dia do Diário
    setGuesses([]);
    setSolvedBoards([]);
    setCurrentGuessArray(Array(mode.length).fill(""));
    setActiveCol(0);
    setGameStatus("IN_PROGRESS");
  }, []);

  useEffect(() => {
    initGame(GAME_MODES.DAILY);
    const timer = setInterval(() => setSecondsRemaining(getSecondsUntilNextWord()), 1000);
    return () => clearInterval(timer);
  }, [initGame]);

  const formatCountdown = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleGameEnd = (won, attemptsCount, modeId) => {
    setStats((prev) => {
      const currentModeStats = prev[modeId] || INITIAL_STATS[modeId];
      
      const newPlayed = currentModeStats.played + 1;
      const newWon = won ? currentModeStats.won + 1 : currentModeStats.won;
      const newCurrentStreak = won ? currentModeStats.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(currentModeStats.maxStreak, newCurrentStreak);
      const newGuesses = { ...currentModeStats.guesses };
      
      if (won) newGuesses[attemptsCount] = (newGuesses[attemptsCount] || 0) + 1;
      
      const updatedStats = {
        ...prev,
        [modeId]: { played: newPlayed, won: newWon, currentStreak: newCurrentStreak, maxStreak: newMaxStreak, guesses: newGuesses }
      };

      try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats)); } catch (e) {}
      return updatedStats;
    });

    setTimeout(() => setShowStatsModal(true), 1200);
  };

  const handleShare = async () => {
    const blockEmojis = guesses.map(guess => {
      const evaluation = evaluateGuess(guess, secretWords[0]);
      return evaluation.map(status => {
        if (status === "correct") return "🟩";
        if (status === "present") return "🟨";
        return "⬛";
      }).join("");
    }).join("\n");

    const attemptsText = gameStatus === "WON" ? guesses.length : "X";
    const shareText = `Joguei Termo na Gruta\n#${dayNumber} ${attemptsText}/6\n\n${blockEmojis}\n\ngruta342.app/jogos/termo`;

    try {
      await navigator.clipboard.writeText(shareText);
      showToast("Copiado para a área de transferência!", 3000);
    } catch (err) {}

    if (navigator.share) {
      try { await navigator.share({ title: 'Termo da Gruta', text: shareText }); } catch(e) {}
    }
  };

  const submitGuess = useCallback(() => {
    const { currentGuessArray, guesses, gameStatus, activeMode, secretWords, solvedBoards, dayNumber } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;

    if (currentGuessArray.includes("")) {
      setShakeRow(true);
      showToast(`A palavra precisa de ${activeMode.length} letras`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const currentGuessStr = currentGuessArray.join("");
    const normalized = normalizeWord(currentGuessStr);

    if (!VALID_GUESSES.has(normalized)) {
      setShakeRow(true);
      showToast("Palavra não reconhecida");
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const updatedGuesses = [...guesses, normalized];
    const newSolvedBoards = [...solvedBoards];

    secretWords.forEach((word, idx) => {
      if (normalized === word && !newSolvedBoards.includes(idx)) {
        newSolvedBoards.push(idx);
      }
    });

    let newStatus = "IN_PROGRESS";
    if (newSolvedBoards.length === secretWords.length) {
      newStatus = "WON";
    } else if (updatedGuesses.length >= activeMode.attempts) {
      newStatus = "LOST";
    }

    setGuesses(updatedGuesses);
    setSolvedBoards(newSolvedBoards);
    setCurrentGuessArray(Array(activeMode.length).fill(""));
    setActiveCol(0);
    setGameStatus(newStatus);

    // Salva o estado atual do Desafio Diário a cada jogada
    if (activeMode.id === "DAILY") {
      try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
          dayNumber,
          guesses: updatedGuesses,
          gameStatus: newStatus
        }));
      } catch (e) {}
    }

    if (newStatus === "WON") {
      showToast("Sensacional! Você venceu!", 2500);
      handleGameEnd(true, updatedGuesses.length, activeMode.id);
    } else if (newStatus === "LOST") {
      showToast("Que pena! Fim de jogo.", 3500);
      handleGameEnd(false, updatedGuesses.length, activeMode.id);
    }
  }, []);

  const typeChar = useCallback((char) => {
    const { currentGuessArray, activeCol, gameStatus, activeMode } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;
    const newArr = [...currentGuessArray];
    newArr[activeCol] = char;
    setCurrentGuessArray(newArr);
    if (activeCol < activeMode.length - 1) setActiveCol(activeCol + 1);
  }, []);

  const backspaceChar = useCallback(() => {
    const { currentGuessArray, activeCol, gameStatus } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;
    const newArr = [...currentGuessArray];
    if (newArr[activeCol] !== "") {
      newArr[activeCol] = "";
      setCurrentGuessArray(newArr);
    } else if (activeCol > 0) {
      newArr[activeCol - 1] = "";
      setCurrentGuessArray(newArr);
      setActiveCol(activeCol - 1);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showStatsModal || showHelpModal || isModeDropdownOpen) return;
      if (gameStateRef.current.gameStatus !== "IN_PROGRESS") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); submitGuess(); }
      else if (e.key === "Backspace") { e.preventDefault(); backspaceChar(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setActiveCol(prev => Math.max(0, prev - 1)); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setActiveCol(prev => Math.min(gameStateRef.current.activeMode.length - 1, prev + 1)); }
      else if (/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]$/.test(e.key)) {
        e.preventDefault();
        const norm = normalizeWord(e.key);
        if (norm) typeChar(norm);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStatsModal, showHelpModal, isModeDropdownOpen, submitGuess, typeChar, backspaceChar]);

  const keyStatuses = useMemo(() => {
    const map = {};
    guesses.forEach((guess) => {
      secretWords.forEach((word, idx) => {
        if (solvedBoards.includes(idx) && guesses.indexOf(guess) > guesses.findIndex(g => g === word)) return;
        const evaluation = evaluateGuess(guess, word);
        for (let i = 0; i < guess.length; i++) {
          const letter = guess[i];
          const status = evaluation[i];
          if (status === "correct") map[letter] = "correct";
          else if (status === "present" && map[letter] !== "correct") map[letter] = "present";
          else if (status === "absent" && !map[letter]) map[letter] = "absent";
        }
      });
    });
    return map;
  }, [guesses, secretWords, solvedBoards]);

  const currentModeStats = stats[activeMode.id] || INITIAL_STATS[activeMode.id];
  const winPercentage = currentModeStats.played > 0 ? Math.round((currentModeStats.won / currentModeStats.played) * 100) : 0;
  const maxGuessCount = Math.max(...Object.values(currentModeStats.guesses), 1);
  const totalLosses = currentModeStats.played - currentModeStats.won;

  return (
    <div className="termo-wrapper">
      {toastMessage && <div className="termo-toast">{toastMessage}</div>}

      <header className="termo-header">
        <div className="header-left">
          <a href="/jogos" className="header-btn header-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span className="hide-mobile">JOGOS</span>
          </a>
          <div className="mode-dropdown-container" ref={dropdownRef}>
            <button className="header-btn" onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}>
              <span className="hide-mobile">MODO: </span>
              {activeMode.id === "DAILY" ? "DIÁRIO" : activeMode.label.toUpperCase()}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: isModeDropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s"}}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            {isModeDropdownOpen && (
              <div className="mode-dropdown-menu">
                {Object.values(GAME_MODES).map(m => (
                  <button key={m.id} className={`dropdown-item ${activeMode.id === m.id ? 'active' : ''}`} onClick={() => initGame(m)}>
                    {m.id === "DAILY" ? "DIÁRIO" : m.label.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="header-center">
          <h1 className="termo-title">TERMO</h1>
          <span className="termo-day-tag">{activeMode.id === "DAILY" ? `#${dayNumber} DA GRUTA` : "MODO INFINITO"}</span>
        </div>

        <div className="header-right">
          <button type="button" className="termo-icon-btn" onClick={() => setShowHelpModal(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </button>
          <button type="button" className="termo-icon-btn" onClick={() => setShowStatsModal(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </button>
        </div>
      </header>

      <main className={`termo-boards-container mode-${activeMode.id}`}>
        {secretWords.map((secretWord, boardIdx) => {
          const isSolved = solvedBoards.includes(boardIdx);
          return (
            <div key={boardIdx} className={`termo-board ${isSolved ? 'board-solved' : ''}`}>
              {Array.from({ length: activeMode.attempts }).map((_, rowIndex) => {
                const isCurrentRow = rowIndex === guesses.length;
                const isGuessedRow = rowIndex < guesses.length;
                const guessWord = isGuessedRow ? guesses[rowIndex] : (isCurrentRow && !isSolved ? currentGuessArray : Array(activeMode.length).fill(""));
                const evaluation = isGuessedRow ? evaluateGuess(guessWord, secretWord) : [];

                return (
                  <div key={rowIndex} className={`termo-row len-${activeMode.length} ${isCurrentRow && shakeRow && !isSolved ? "shake" : ""}`}>
                    {Array.from({ length: activeMode.length }).map((_, colIndex) => {
                      const letter = guessWord[colIndex] || "";
                      const status = isGuessedRow ? evaluation[colIndex] : "";
                      const isSelected = isCurrentRow && colIndex === activeCol && gameStatus === "IN_PROGRESS" && !isSolved;
                      return (
                        <div key={colIndex} onClick={() => isCurrentRow && gameStatus === "IN_PROGRESS" && !isSolved && setActiveCol(colIndex)}
                          className={`termo-tile ${status} ${letter && isCurrentRow && !isSolved ? "active" : ""} ${isGuessedRow ? "revealed" : ""} ${isSelected ? "selected-tile" : ""}`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>

      <footer className={`termo-keyboard ${gameStatus !== "IN_PROGRESS" ? "game-over" : ""}`}>
        {[["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["ENTER","Z","X","C","V","B","N","M","BACKSPACE"]].map((row, rIdx) => (
          <div key={rIdx} className="termo-kb-row">
            {row.map(key => {
              const isSpc = key === "ENTER" || key === "BACKSPACE";
              return (
                <button key={key} className={`termo-key ${isSpc ? "key-special" : ""} ${keyStatuses[key] || ""}`}
                  onClick={() => {
                    if(gameStatus !== "IN_PROGRESS") return;
                    if(key === "ENTER") submitGuess();
                    else if(key === "BACKSPACE") backspaceChar();
                    else typeChar(key);
                  }}>
                  {key === "BACKSPACE" ? <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg> : key}
                </button>
              );
            })}
          </div>
        ))}
      </footer>

      {showStatsModal && (
        <div className="termo-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="termo-stats-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="termo-modal-close-btn" onClick={() => setShowStatsModal(false)}>✕</button>
            <h2 className="termo-stats-title">ESTATÍSTICAS - {activeMode.label.toUpperCase()}</h2>
            
            <h3 className="termo-dist-title">PROGRESSO</h3>
            <div className="termo-stats-grid">
              <div className="termo-stat-box"><span className="termo-stat-value">{currentModeStats.played}</span><span className="termo-stat-label">jogos</span></div>
              <div className="termo-stat-box"><span className="termo-stat-value">{winPercentage}%</span><span className="termo-stat-label">de vitórias</span></div>
              <div className="termo-stat-box"><span className="termo-stat-value">{currentModeStats.currentStreak}</span><span className="termo-stat-label">sequência<br/>de vitórias</span></div>
              <div className="termo-stat-box"><span className="termo-stat-value">{currentModeStats.maxStreak}</span><span className="termo-stat-label">melhor<br/>sequência</span></div>
            </div>

            <div className="termo-dist-section">
              <h3 className="termo-dist-title">DISTRIBUIÇÃO DE TENTATIVAS</h3>
              <div className="termo-dist-graph">
                {Array.from({ length: activeMode.attempts }).map((_, i) => {
                  const num = i + 1;
                  const count = currentModeStats.guesses[num] || 0;
                  const isWinningAttempt = gameStatus === "WON" && guesses.length === num;
                  const barWidth = currentModeStats.played > 0 ? Math.max((count / maxGuessCount) * 100, 7) : 7;
                  
                  return (
                    <div key={num} className="termo-dist-row">
                      <span className="termo-dist-num">{num}</span>
                      <div className="termo-dist-bar-wrapper">
                        <div className={`termo-dist-bar ${isWinningAttempt ? "highlight" : ""}`} style={{ width: `${barWidth}%` }}>{count}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="termo-dist-row">
                  <span className="termo-dist-num">💀</span>
                  <div className="termo-dist-bar-wrapper">
                    <div className={`termo-dist-bar ${gameStatus === "LOST" ? "loss-highlight" : "loss-bar"}`} style={{ width: currentModeStats.played > 0 ? Math.max((totalLosses / maxGuessCount) * 100, 7) + "%" : "7%" }}>
                      {totalLosses}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeMode.id === "DAILY" ? (
              <div className="termo-stats-footer">
                <div className="termo-footer-col">
                  <span className="termo-next-label">próxima palavra em</span>
                  <div className="termo-countdown">{formatCountdown(secondsRemaining)}</div>
                </div>
                {gameStatus !== "IN_PROGRESS" && (
                  <div className="termo-footer-col align-right">
                    <button className="termo-share-btn" onClick={handleShare}>
                      compartilhe
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              gameStatus !== "IN_PROGRESS" && (
                <button onClick={() => initGame(activeMode)} className="termo-play-again-btn">
                  JOGAR NOVAMENTE
                </button>
              )
            )}
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="termo-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="termo-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="termo-modal-close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
            <h2 className="termo-stats-title">COMO JOGAR</h2>
            <div className="termo-help-body">
              <p>Descubra a palavra certa. A cada tentativa, as peças mudam de cor para indicar o quão perto você chegou.</p>
              <p><strong>Dica:</strong> Os modos infinitos geram novas palavras automaticamente!</p>
              <div className="termo-help-example">
                <div className="termo-example-row">
                  <div className="termo-example-tile termo-tile correct">G</div>
                  <div className="termo-example-tile termo-tile">R</div>
                  <div className="termo-example-tile termo-tile">U</div>
                  <div className="termo-example-tile termo-tile">T</div>
                  <div className="termo-example-tile termo-tile">A</div>
                </div>
                <span className="termo-example-text">A letra <strong>G</strong> faz parte da palavra e está na posição correta.</span>
              </div>
              <div className="termo-help-example">
                <div className="termo-example-row">
                  <div className="termo-example-tile termo-tile">D</div>
                  <div className="termo-example-tile termo-tile present">A</div>
                  <div className="termo-example-tile termo-tile">D</div>
                  <div className="termo-example-tile termo-tile">O</div>
                  <div className="termo-example-tile termo-tile">S</div>
                </div>
                <span className="termo-example-text">A letra <strong>A</strong> faz parte da palavra mas está em outra posição.</span>
              </div>
              <div className="termo-help-example">
                <div className="termo-example-row">
                  <div className="termo-example-tile termo-tile">N</div>
                  <div className="termo-example-tile termo-tile">O</div>
                  <div className="termo-example-tile termo-tile">I</div>
                  <div className="termo-example-tile termo-tile absent">T</div>
                  <div className="termo-example-tile termo-tile">E</div>
                </div>
                <span className="termo-example-text">A letra <strong>T</strong> não faz parte da palavra.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}