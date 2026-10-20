"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

// Avaliação exata padrão Wordle (lida com letras repetidas com precisão)
function evaluateGuess(guess, target) {
  const result = Array(guess.length).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");
  const targetCounts = {};

  for (const ch of targetChars) {
    targetCounts[ch] = (targetCounts[ch] || 0) + 1;
  }

  // Passo 1: Letras no lugar correto (Verde)
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetCounts[guessChars[i]]--;
    }
  }

  // Passo 2: Letras presentes na palavra, mas no lugar errado (Amarelo)
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
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState("IN_PROGRESS"); // 'IN_PROGRESS' | 'WON' | 'LOST'
  const [shakeRow, setShakeRow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Modais
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState({
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  });

  // Temporizador para a próxima palavra
  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilNextWord());

  const showToast = (msg, duration = 2000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, duration);
  };

  // Carrega estatísticas do localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (e) {
      console.error("Erro ao carregar estatísticas:", e);
    }
  }, []);

  // Carrega ou inicializa o estado do dia
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

  // Contagem regressiva até 00:00 de Brasília
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(getSecondsUntilNextWord());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Grava estatísticas após vitória/derrota
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

      const updated = {
        played: newPlayed,
        won: newWon,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        guesses: newGuesses
      };

      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar estatísticas:", e);
      }
      return updated;
    });

    setTimeout(() => {
      setShowStatsModal(true);
    }, 1200);
  };

  // Salva estado diário
  const saveDailyState = (updatedGuesses, status) => {
    try {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({
          dayNumber,
          guesses: updatedGuesses,
          gameStatus: status
        })
      );
    } catch (e) {
      console.error("Erro ao salvar estado diário:", e);
    }
  };

  // Enviar tentativa (Enter)
  const submitGuess = useCallback(() => {
    if (gameStatus !== "IN_PROGRESS") return;

    if (currentGuess.length !== wordLength) {
      setShakeRow(true);
      showToast(`A palavra precisa de ${wordLength} letras`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const normalized = normalizeWord(currentGuess);

    // Valida se a palavra existe na lista de tentativas aceitas
    if (!VALID_GUESSES.has(normalized)) {
      setShakeRow(true);
      showToast("Palavra não reconhecida");
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const updatedGuesses = [...guesses, normalized];
    setGuesses(updatedGuesses);
    setCurrentGuess("");

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
  }, [currentGuess, gameStatus, guesses, secretWord, wordLength, dayNumber, dailyData]);

  // Tecla digitada
  const handleCharInput = useCallback(
    (char) => {
      if (gameStatus !== "IN_PROGRESS") return;
      if (currentGuess.length < wordLength) {
        setCurrentGuess((prev) => (prev + char).toUpperCase());
      }
    },
    [currentGuess, gameStatus, wordLength]
  );

  // Backspace
  const handleBackspace = useCallback(() => {
    if (gameStatus !== "IN_PROGRESS") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  // Captura teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showStatsModal || showHelpModal) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]$/.test(e.key)) {
        e.preventDefault();
        const norm = normalizeWord(e.key);
        if (norm) handleCharInput(norm);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitGuess, handleBackspace, handleCharInput, showStatsModal, showHelpModal]);

  // Calcula cores das teclas do teclado virtual
  const keyStatuses = useMemo(() => {
    const map = {};
    guesses.forEach((guess) => {
      const evaluation = evaluateGuess(guess, secretWord);
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const status = evaluation[i];
        if (status === "correct") {
          map[letter] = "correct";
        } else if (status === "present") {
          if (map[letter] !== "correct") {
            map[letter] = "present";
          }
        } else if (status === "absent") {
          if (!map[letter]) {
            map[letter] = "absent";
          }
        }
      }
    });
    return map;
  }, [guesses, secretWord]);

  // Layout do teclado QWERTY em Português
  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  // Cálculo da % de vitórias
  const winPercentage = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  // Maior valor na distribuição para proporcionalidade visual das barras
  const maxGuessCount = Math.max(...Object.values(stats.guesses), 1);

  return (
    <div className="termo-wrapper">
      {/* Toast flutuante */}
      {toastMessage && <div className="termo-toast">{toastMessage}</div>}

      {/* Cabeçalho */}
      <header className="termo-header">
        <div className="termo-header-actions">
          <button
            type="button"
            className="termo-icon-btn"
            onClick={() => setShowHelpModal(true)}
            aria-label="Como jogar"
            title="Como jogar"
          >
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
          <button
            type="button"
            className="termo-icon-btn"
            onClick={() => setShowStatsModal(true)}
            aria-label="Estatísticas"
            title="Estatísticas"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Grid de 6 tentativas */}
      <main className="termo-board-container">
        <div className="termo-board">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const isGuessedRow = rowIndex < guesses.length;
            const guessWord = isGuessedRow
              ? guesses[rowIndex]
              : isCurrentRow
              ? currentGuess
              : "";
            const evaluation = isGuessedRow ? evaluateGuess(guessWord, secretWord) : [];

            return (
              <div
                key={rowIndex}
                className={`termo-row len-${wordLength} ${isCurrentRow && shakeRow ? "shake" : ""}`}
              >
                {Array.from({ length: wordLength }).map((_, colIndex) => {
                  const letter = guessWord[colIndex] || "";
                  const status = isGuessedRow ? evaluation[colIndex] : "";
                  const isActive = isCurrentRow && letter !== "";

                  return (
                    <div
                      key={colIndex}
                      className={`termo-tile ${status} ${isActive ? "active" : ""} ${isGuessedRow ? "revealed" : ""}`}
                      style={{
                        animationDelay: isGuessedRow ? `${colIndex * 100}ms` : "0ms"
                      }}
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

      {/* Teclado Virtual */}
      <footer className="termo-keyboard">
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
                  onClick={() => {
                    if (isEnter) submitGuess();
                    else if (isBack) handleBackspace();
                    else handleCharInput(key);
                  }}
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

      {/* MODAL DE ESTATÍSTICAS (Exato como solicitado, sem botão de compartilhar) */}
      {showStatsModal && (
        <div className="termo-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="termo-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="termo-modal-close-btn"
              onClick={() => setShowStatsModal(false)}
              aria-label="Fechar estatísticas"
            >
              ✕
            </button>

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
                  const isWinningAttempt =
                    gameStatus === "WON" && guesses.length === num;
                  const barWidth = stats.played > 0 ? Math.max((count / maxGuessCount) * 100, 7) : 7;

                  return (
                    <div key={num} className="termo-dist-row">
                      <span className="termo-dist-num">{num}</span>
                      <div className="termo-dist-bar-wrapper">
                        <div
                          className={`termo-dist-bar ${isWinningAttempt ? "highlight" : ""}`}
                          style={{ width: `${barWidth}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="termo-stats-footer">
              <span className="termo-next-label">PRÓXIMA PALAVRA</span>
              <div className="termo-countdown">
                {formatCountdown(secondsRemaining)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMO JOGAR */}
      {showHelpModal && (
        <div className="termo-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="termo-stats-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="termo-modal-close-btn"
              onClick={() => setShowHelpModal(false)}
              aria-label="Fechar"
            >
              ✕
            </button>

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
                <span className="termo-example-text">
                  A letra <strong>G</strong> faz parte da palavra e está na posição correta.
                </span>
              </div>

              <div className="termo-help-example">
                <div className="termo-example-row">
                  <div className="termo-example-tile termo-tile">D</div>
                  <div className="termo-example-tile termo-tile present">A</div>
                  <div className="termo-example-tile termo-tile">D</div>
                  <div className="termo-example-tile termo-tile">O</div>
                  <div className="termo-example-tile termo-tile">S</div>
                </div>
                <span className="termo-example-text">
                  A letra <strong>A</strong> faz parte da palavra mas está em outra posição.
                </span>
              </div>

              <div className="termo-help-example">
                <div className="termo-example-row">
                  <div className="termo-example-tile termo-tile">N</div>
                  <div className="termo-example-tile termo-tile">O</div>
                  <div className="termo-example-tile termo-tile">I</div>
                  <div className="termo-example-tile termo-tile absent">T</div>
                  <div className="termo-example-tile termo-tile">E</div>
                </div>
                <span className="termo-example-text">
                  A letra <strong>T</strong> não faz parte da palavra.
                </span>
              </div>

              <p style={{ marginTop: "15px", fontSize: "12px", color: "#8a9fc4", textAlign: "center" }}>
                Uma nova palavra é revelada todos os dias às 00:00 (Horário de Brasília).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
