"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./Termo.css";
import {
  getDailyWord,
  normalizeWord,
  getSecondsUntilNextWord,
  VALID_GUESSES
} from "./words";

const MAX_ATTEMPTS = 6;
const STATS_STORAGE_KEY = "gruta_termo_stats";
const STATE_STORAGE_KEY = "gruta_termo_game_state";

// Avaliação exata padrão Wordle
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
    } else {
      result[i] = "absent";
    }
  }

  return result;
}

export default function Termo() {
  const dailyData = useMemo(() => getDailyWord(), []);
  const secretWord = dailyData.word;
  const wordLength = dailyData.length;
  const dayNumber = dailyData.dayNumber;

  const [guesses, setGuesses] = useState([]);
  
  // Agora a tentativa atual é um Array para permitir a edição em posições específicas
  const [currentGuessArray, setCurrentGuessArray] = useState(() => Array(wordLength).fill(""));
  const [activeCol, setActiveCol] = useState(0); // Controla qual quadrado está selecionado
  
  const [gameStatus, setGameStatus] = useState("IN_PROGRESS");
  const [shakeRow, setShakeRow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [stats, setStats] = useState({
    played: 0, won: 0, currentStreak: 0, maxStreak: 0,
    guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  });

  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilNextWord());

  // Ref para acessar o estado mais recente nos event listeners sem causar re-renders desnecessários
  const gameStateRef = useRef({ currentGuessArray, activeCol, guesses, gameStatus });
  useEffect(() => {
    gameStateRef.current = { currentGuessArray, activeCol, guesses, gameStatus };
  }, [currentGuessArray, activeCol, guesses, gameStatus]);

  const showToast = (msg, duration = 2000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), duration);
  };

  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (e) {
      console.error("Erro ao carregar estatísticas:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STATE_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.dayNumber === dayNumber) {
          setGuesses(parsed.guesses || []);
          setGameStatus(parsed.gameStatus || "IN_PROGRESS");
          if (parsed.gameStatus === "WON" || parsed.gameStatus === "LOST") {
            setTimeout(() => setShowStatsModal(true), 600);
          }
          return;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar estado do jogo:", e);
    }
  }, [dayNumber]);

  useEffect(() => {
    const timer = setInterval(() => setSecondsRemaining(getSecondsUntilNextWord()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleGameEnd = (won, attemptsCount) => {
    setStats((prev) => {
      const newPlayed = prev.played + 1;
      const newWon = won ? prev.won + 1 : prev.won;
      const newCurrentStreak = won ? prev.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newCurrentStreak);
      const newGuesses = { ...prev.guesses };

      if (won && attemptsCount >= 1 && attemptsCount <= 6) {
        newGuesses[attemptsCount] = (newGuesses[attemptsCount] || 0) + 1;
      }

      const updated = { played: newPlayed, won: newWon, currentStreak: newCurrentStreak, maxStreak: newMaxStreak, guesses: newGuesses };
      try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setTimeout(() => setShowStatsModal(true), 1200);
  };

  const saveDailyState = (updatedGuesses, status) => {
    try { localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ dayNumber, guesses: updatedGuesses, gameStatus: status })); } catch (e) {}
  };

  const submitGuess = useCallback(() => {
    const { currentGuessArray, guesses, gameStatus } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;

    if (currentGuessArray.includes("")) {
      setShakeRow(true);
      showToast(`A palavra precisa de ${wordLength} letras`);
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
    setGuesses(updatedGuesses);
    
    // Reseta a linha para a próxima tentativa
    setCurrentGuessArray(Array(wordLength).fill(""));
    setActiveCol(0);

    if (normalized === secretWord) {
      setGameStatus("WON");
      saveDailyState(updatedGuesses, "WON");
      showToast("Sensacional! Palavra correta!", 2500);
      handleGameEnd(true, updatedGuesses.length);
    } else if (updatedGuesses.length >= MAX_ATTEMPTS) {
      setGameStatus("LOST");
      saveDailyState(updatedGuesses, "LOST");
      showToast(`Que pena! A palavra era ${dailyData.displayWord}`, 3500);
      handleGameEnd(false, updatedGuesses.length);
    } else {
      saveDailyState(updatedGuesses, "IN_PROGRESS");
    }
  }, [secretWord, wordLength, dayNumber, dailyData]);

  const handleShare = async () => {
    const blockEmojis = guesses.map(guess => {
      const evaluation = evaluateGuess(guess, secretWord);
      return evaluation.map(status => {
        if (status === "correct") return "🟩";
        if (status === "present") return "🟨";
        return "⬛";
      }).join("");
    }).join("\n");

    const attemptsText = gameStatus === "WON" ? guesses.length : "X";
    const shareText = `Joguei Termo na Gruta 342\n#${dayNumber} ${attemptsText}/6\n\n${blockEmojis}\n\ngruta342.app/jogos/termo`;

    // Copia para a área de transferência primeiro
    try {
      await navigator.clipboard.writeText(shareText);
      showToast("Copiado para a área de transferência!", 3000);
    } catch (err) {
      console.error("Falha ao copiar", err);
    }

    // Chama o modal de compartilhamento nativo em celulares
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Termo da Gruta',
          text: shareText,
        });
      } catch(e) {}
    }
  };

  const typeChar = useCallback((char) => {
    const { currentGuessArray, activeCol, gameStatus } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;

    const newArr = [...currentGuessArray];
    newArr[activeCol] = char;
    setCurrentGuessArray(newArr);

    if (activeCol < wordLength - 1) {
      setActiveCol(activeCol + 1);
    }
  }, [wordLength]);

  const backspaceChar = useCallback(() => {
    const { currentGuessArray, activeCol, gameStatus } = gameStateRef.current;
    if (gameStatus !== "IN_PROGRESS") return;

    const newArr = [...currentGuessArray];
    
    // Se houver letra na casa atual, apenas apaga. Se não, volta uma casa e apaga.
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
      if (showStatsModal || showHelpModal) return;
      if (gameStateRef.current.gameStatus !== "IN_PROGRESS") return; // Bloqueio total pós-jogo
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspaceChar();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveCol(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveCol(prev => Math.min(wordLength - 1, prev + 1));
      } else if (/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]$/.test(e.key)) {
        e.preventDefault();
        const norm = normalizeWord(e.key);
        if (norm) typeChar(norm);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStatsModal, showHelpModal, wordLength, submitGuess, typeChar, backspaceChar]);

  const handleVirtualKey = (key) => {
    if (gameStatus !== "IN_PROGRESS") return;
    if (key === "ENTER") submitGuess();
    else if (key === "BACKSPACE") backspaceChar();
    else typeChar(key);
  };

  const keyStatuses = useMemo(() => {
    const map = {};
    guesses.forEach((guess) => {
      const evaluation = evaluateGuess(guess, secretWord);
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const status = evaluation[i];
        if (status === "correct") map[letter] = "correct";
        else if (status === "present" && map[letter] !== "correct") map[letter] = "present";
        else if (status === "absent" && !map[letter]) map[letter] = "absent";
      }
    });
    return map;
  }, [guesses, secretWord]);

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  const winPercentage = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const maxGuessCount = Math.max(...Object.values(stats.guesses), 1);

  return (
    <div className="termo-wrapper">
      {toastMessage && <div className="termo-toast">{toastMessage}</div>}

      <header className="termo-header">
        <div className="termo-header-actions">
          <button type="button" className="termo-icon-btn" onClick={() => setShowHelpModal(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>

        <div className="termo-title-container">
          <h1 className="termo-title">TERMO</h1>
          <span className="termo-day-tag">#{dayNumber} DA GRUTA</span>
        </div>

        <div className="termo-header-actions">
          <button type="button" className="termo-icon-btn" onClick={() => setShowStatsModal(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
        </div>
      </header>

      <main className="termo-board-container">
        <div className="termo-board">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const isGuessedRow = rowIndex < guesses.length;
            
            // Renderiza string já jogada, ou Array da linha ativa, ou Array vazio pro restante
            const guessWord = isGuessedRow
              ? guesses[rowIndex]
              : isCurrentRow
              ? currentGuessArray
              : Array(wordLength).fill("");
              
            const evaluation = isGuessedRow ? evaluateGuess(guessWord, secretWord) : [];

            return (
              <div key={rowIndex} className={`termo-row len-${wordLength} ${isCurrentRow && shakeRow ? "shake" : ""}`}>
                {Array.from({ length: wordLength }).map((_, colIndex) => {
                  const letter = guessWord[colIndex] || "";
                  const status = isGuessedRow ? evaluation[colIndex] : "";
                  const isSelected = isCurrentRow && colIndex === activeCol && gameStatus === "IN_PROGRESS";
                  const isActiveChar = isCurrentRow && letter !== "";

                  return (
                    <div
                      key={colIndex}
                      onClick={() => isCurrentRow && gameStatus === "IN_PROGRESS" && setActiveCol(colIndex)}
                      className={`termo-tile ${status} ${isActiveChar ? "active" : ""} ${isGuessedRow ? "revealed" : ""} ${isSelected ? "selected-tile" : ""}`}
                      style={{ animationDelay: isGuessedRow ? `${colIndex * 100}ms` : "0ms" }}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </main>

      <footer className={`termo-keyboard ${gameStatus !== "IN_PROGRESS" ? "game-over" : ""}`}>
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="termo-kb-row">
            {row.map((key) => {
              const isEnter = key === "ENTER";
              const isBack = key === "BACKSPACE";
              const keyStatus = keyStatuses[key] || "";

              return (
                <button
                  key={key}
                  type="button"
                  className={`termo-key ${isEnter || isBack ? "key-special" : ""} ${keyStatus}`}
                  onClick={() => handleVirtualKey(key)}
                  aria-label={key}
                >
                  {isBack ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </footer>

      {/* MODAL ESTATÍSTICAS */}
      {showStatsModal && (
        <div className="termo-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="termo-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="termo-modal-close-btn" onClick={() => setShowStatsModal(false)}>✕</button>
            <h2 className="termo-stats-title">ESTATÍSTICAS</h2>

            <div className="termo-stats-grid">
              <div className="termo-stat-box">
                <span className="termo-stat-value">{stats.played}</span>
                <span className="termo-stat-label">Jogados</span>
              </div>
              <div className="termo-stat-box">
                <span className="termo-stat-value">{winPercentage}</span>
                <span className="termo-stat-label">% Vitórias</span>
              </div>
              <div className="termo-stat-box">
                <span className="termo-stat-value">{stats.currentStreak}</span>
                <span className="termo-stat-label">Vitórias Seguidas</span>
              </div>
              <div className="termo-stat-box">
                <span className="termo-stat-value">{stats.maxStreak}</span>
                <span className="termo-stat-label">Máximo Seguidas</span>
              </div>
            </div>

            <div className="termo-dist-section">
              <h3 className="termo-dist-title">TENTATIVAS</h3>
              <div className="termo-dist-graph">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const count = stats.guesses[num] || 0;
                  const isWinningAttempt = gameStatus === "WON" && guesses.length === num;
                  const barWidth = stats.played > 0 ? Math.max((count / maxGuessCount) * 100, 7) : 7;
                  return (
                    <div key={num} className="termo-dist-row">
                      <span className="termo-dist-num">{num}</span>
                      <div className="termo-dist-bar-wrapper">
                        <div className={`termo-dist-bar ${isWinningAttempt ? "highlight" : ""}`} style={{ width: `${barWidth}%` }}>{count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="termo-stats-footer">
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span className="termo-next-label">PRÓXIMA PALAVRA</span>
                <div className="termo-countdown">{formatCountdown(secondsRemaining)}</div>
              </div>
              
              {gameStatus !== "IN_PROGRESS" && (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginTop: '16px', borderTop: '1px solid rgba(0, 210, 255, 0.2)', paddingTop: '16px', width: '100%' }}>
                  <button onClick={handleShare} style={{ backgroundColor: '#2e9e5b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(46, 158, 91, 0.4)', transition: 'transform 0.2s, background-color 0.2s' }}>
                    COMPARTILHAR
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          </div>
        </div>
      )}

      {/* MODAL COMO JOGAR */}
      {showHelpModal && (
        <div className="termo-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="termo-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="termo-modal-close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
            <h2 className="termo-stats-title">COMO JOGAR</h2>
            <div className="termo-help-body">
              <p>Descubra a palavra certa em <strong>6 tentativas</strong>. A cada tentativa, as peças mudam de cor para indicar o quão perto você chegou.</p>
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