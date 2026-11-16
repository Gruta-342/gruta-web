"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import "./Dados.css";

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const HISTORY_STORAGE_KEY = "gruta_dados_history";
const MAX_DICE = 24;
const MAX_HISTORY_ITEMS = 50;

function formatModifierPart(mod) {
  if (!mod) return "";
  return mod > 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`;
}

function formatFormula(diceList, modifier = 0) {
  if (!diceList.length) return "";
  const counts = {};
  DICE_TYPES.forEach((sides) => {
    counts[sides] = 0;
  });
  diceList.forEach((d) => {
    counts[d.sides] = (counts[d.sides] || 0) + 1;
  });

  const base = DICE_TYPES.filter((sides) => counts[sides] > 0)
    .map((sides) => `${counts[sides]}D${sides}`)
    .join(" + ");

  return `${base}${formatModifierPart(modifier)}`;
}

const DieShapeIcon = ({ sides }) => {
  const renderPolygon = () => {
    switch (sides) {
      case 4:
        return <polygon points="32,7 57,53 7,53" />;
      case 6:
        return <rect x="11" y="11" width="42" height="42" rx="8" ry="8" />;
      case 8:
        return <polygon points="32,6 56,32 32,58 8,32" />;
      case 10:
      case 100:
        return <polygon points="32,5 56,28 32,59 8,28" />;
      case 12:
        return <polygon points="32,6 57,24 47,55 17,55 7,24" />;
      case 20:
      default:
        return <polygon points="32,6 55,19 55,45 32,58 9,45 9,19" />;
    }
  };

  return (
    <div className="dados-shape-box">
      <svg
        viewBox="0 0 64 64"
        className="dados-shape-svg"
        aria-hidden="true"
      >
        {renderPolygon()}
      </svg>
      <span className={`dados-shape-label ${sides === 4 ? "is-d4" : ""} ${sides === 100 ? "is-d100" : ""}`}>
        D{sides}
      </span>
    </div>
  );
};

export default function Dados() {
  const [dicePool, setDicePool] = useState([
    { id: "initial-d20", sides: 20, value: 20 }
  ]);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [history, setHistory] = useState([]);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toast, setToast] = useState("");

  const rollIntervalRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {}

    return () => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  const showToastMsg = useCallback((msg, duration = 2400) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? "" : curr)), duration);
  }, []);

  const saveHistory = useCallback((newEntry) => {
    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {}
    showToastMsg("Histórico limpo.");
  }, [showToastMsg]);

  const addDie = useCallback(
    (sides) => {
      if (isRolling) return;
      if (dicePool.length >= MAX_DICE) {
        showToastMsg(`Limite máximo de ${MAX_DICE} dados na mesa.`);
        return;
      }
      const newDie = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sides,
        value: sides
      };
      setDicePool((prev) => [...prev, newDie]);
      setHasRolled(false);
    },
    [isRolling, dicePool.length, showToastMsg]
  );

  const removeOneDieByType = useCallback(
    (sides) => {
      if (isRolling) return;
      setDicePool((prev) => {
        const idx = [...prev].reverse().findIndex((d) => d.sides === sides);
        if (idx === -1) return prev;
        const targetIndex = prev.length - 1 - idx;
        const copy = [...prev];
        copy.splice(targetIndex, 1);
        return copy;
      });
      setHasRolled(false);
    },
    [isRolling]
  );

  const removeDieById = useCallback(
    (id) => {
      if (isRolling) return;
      setDicePool((prev) => prev.filter((d) => d.id !== id));
      setHasRolled(false);
    },
    [isRolling]
  );

  const clearDicePool = useCallback(() => {
    if (isRolling) return;
    setDicePool([]);
    setModifier(0);
    setHasRolled(false);
  }, [isRolling]);

  const handleModifierChange = (e) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
      setModifier(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(-999, Math.min(999, parsed));
      setModifier(clamped);
    }
  };

  const adjustModifier = (delta) => {
    if (isRolling) return;
    setModifier((prev) => Math.max(-999, Math.min(999, prev + delta)));
  };

  const rollDice = useCallback(() => {
    if (isRolling || dicePool.length === 0) return;
    setIsRolling(true);
    setHasRolled(false);

    let ticks = 0;
    rollIntervalRef.current = setInterval(() => {
      setDicePool((prev) =>
        prev.map((die) => ({
          ...die,
          value: Math.floor(Math.random() * die.sides) + 1
        }))
      );
      ticks++;

      if (ticks > 12) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;

        setDicePool((prev) => {
          const finalPool = prev.map((die) => ({
            ...die,
            value: Math.floor(Math.random() * die.sides) + 1
          }));

          const diceSum = finalPool.reduce((acc, d) => acc + d.value, 0);
          const totalWithMod = diceSum + modifier;
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}`;

          saveHistory({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            time: timeStr,
            formula: formatFormula(finalPool, modifier),
            results: finalPool.map((d) => ({ sides: d.sides, value: d.value })),
            modifier,
            total: totalWithMod
          });

          return finalPool;
        });

        setIsRolling(false);
        setHasRolled(true);
      }
    }, 60);
  }, [isRolling, dicePool.length, modifier, saveHistory]);

  const countsByType = useMemo(() => {
    const map = {};
    DICE_TYPES.forEach((s) => {
      map[s] = 0;
    });
    dicePool.forEach((d) => {
      map[d.sides] = (map[d.sides] || 0) + 1;
    });
    return map;
  }, [dicePool]);

  const diceSum = useMemo(() => {
    return dicePool.reduce((acc, d) => acc + d.value, 0);
  }, [dicePool]);

  const totalValue = diceSum + modifier;

  const formulaText = useMemo(
    () => formatFormula(dicePool, modifier),
    [dicePool, modifier]
  );

  const showTotalBanner = dicePool.length > 1 || (dicePool.length === 1 && modifier !== 0);

  return (
    <div className="dados-wrapper">
      {toast && <div className="dados-toast">{toast}</div>}

      {/* Cabeçalho Unificado (Padrão Jogos da Gruta) */}
      <header className="dados-header">
        <div className="dados-header-left">
          <Link href="/jogos" className="dados-header-btn dados-header-back-btn">
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
            <span className="dados-hide-mobile">JOGOS</span>
          </Link>
        </div>

        <div className="dados-header-center">
          <h1 className="dados-title">DADOS</h1>
          <span className="dados-subtitle">ROLADOR DA GRUTA</span>
        </div>

        <div className="dados-header-right">
          <button
            type="button"
            className="dados-icon-btn"
            onClick={() => setShowHelpModal(true)}
            title="Como Usar"
            aria-label="Como Usar"
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
            className="dados-icon-btn"
            onClick={() => setShowHistoryModal(true)}
            title="Histórico de Rolagens"
            aria-label="Histórico de Rolagens"
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Área Central: Exibição dos Dados e Soma Total */}
      <main className="dados-main">
        {showTotalBanner && (
          <div className={`dados-total-banner ${isRolling ? "rolling-total" : ""}`}>
            <span className="dados-total-label">SOMA TOTAL</span>
            <span className="dados-total-value">{isRolling ? "..." : totalValue}</span>
            {!isRolling && modifier !== 0 && (
              <span className="dados-total-breakdown">
                ({diceSum}
                {modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`})
              </span>
            )}
          </div>
        )}

        <div className="dados-arena">
          {dicePool.length === 0 ? (
            <div className="dados-empty-state">
              <span>Nenhum dado selecionado</span>
              <small>Escolha os tipos de dados abaixo para adicionar à mesa.</small>
            </div>
          ) : (
            <div
              className={`dados-cards-grid ${
                dicePool.length === 1
                  ? "single-die"
                  : dicePool.length <= 4
                  ? "few-dice"
                  : "many-dice"
              }`}
            >
              {dicePool.map((die) => (
                <div
                  key={die.id}
                  className={`dados-die-card ${isRolling ? "rolling" : ""} ${
                    hasRolled ? "settled" : ""
                  }`}
                >
                  <span className="dados-die-type">D{die.sides}</span>
                  <button
                    type="button"
                    className="dados-die-remove"
                    onClick={() => removeDieById(die.id)}
                    disabled={isRolling}
                    title={`Remover D${die.sides}`}
                    aria-label={`Remover D${die.sides}`}
                  >
                    ✕
                  </button>
                  <span className="dados-die-value">{die.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Painel Inferior: Seleção de Formas/Quantidades, Modificador e Botão Rolar */}
      <section className="dados-controls-dock">
        <div className="dados-pool-bar">
          <div className="dados-formula-wrap">
            <span className="dados-formula-label">MESA:</span>
            <span className="dados-formula-value">
              {formulaText || "Vazia"}
            </span>
          </div>

          <div className="dados-bar-actions">
            <div className="dados-modifier-box">
              <label htmlFor="dados-modifier-input" className="dados-modifier-label">
                MODIFICADOR
              </label>
              <div className="dados-modifier-controls">
                <button
                  type="button"
                  className="dados-mod-step"
                  onClick={() => adjustModifier(-1)}
                  disabled={isRolling}
                  aria-label="Diminuir modificador"
                >
                  −
                </button>
                <input
                  id="dados-modifier-input"
                  type="number"
                  className="dados-modifier-input"
                  value={modifier === 0 ? "" : modifier}
                  placeholder="0"
                  onChange={handleModifierChange}
                  disabled={isRolling}
                />
                <button
                  type="button"
                  className="dados-mod-step"
                  onClick={() => adjustModifier(1)}
                  disabled={isRolling}
                  aria-label="Aumentar modificador"
                >
                  +
                </button>
              </div>
            </div>

            {(dicePool.length > 0 || modifier !== 0) && (
              <button
                type="button"
                className="dados-clear-btn"
                onClick={clearDicePool}
                disabled={isRolling}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="dados-shapes-grid">
          {DICE_TYPES.map((sides) => {
            const count = countsByType[sides] || 0;
            return (
              <div
                key={sides}
                className={`dados-shape-item ${count > 0 ? "has-count" : ""}`}
              >
                {count > 0 && <span className="dados-shape-badge">{count}</span>}

                <button
                  type="button"
                  className="dados-shape-trigger"
                  onClick={() => addDie(sides)}
                  disabled={isRolling}
                  title={`Adicionar D${sides}`}
                  aria-label={`Adicionar D${sides}`}
                >
                  <DieShapeIcon sides={sides} />
                </button>

                <div className="dados-shape-actions">
                  <button
                    type="button"
                    className="dados-shape-btn minus"
                    onClick={() => removeOneDieByType(sides)}
                    disabled={isRolling || count === 0}
                    aria-label={`Remover um D${sides}`}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="dados-shape-btn plus"
                    onClick={() => addDie(sides)}
                    disabled={isRolling}
                    aria-label={`Adicionar um D${sides}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="dados-roll-btn"
          onClick={rollDice}
          disabled={isRolling || dicePool.length === 0}
        >
          {isRolling
            ? "ROLANDO..."
            : dicePool.length > 1
            ? `ROLAR DADOS (${dicePool.length})`
            : "ROLAR DADO"}
        </button>
      </section>

      {/* Modal: Como Usar */}
      {showHelpModal && (
        <div className="dados-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="dados-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dados-modal-close-btn"
              onClick={() => setShowHelpModal(false)}
            >
              ✕
            </button>
            <h2 className="dados-modal-title">COMO USAR</h2>
            <div className="dados-help-body">
              <p>
                Monte sua combinação personalizada de dados para sessões de RPG e jogos de mesa da
                Gruta.
              </p>
              <ul>
                <li>
                  <strong>Adicionar e remover dados:</strong> Use os botões <strong>+</strong> e{" "}
                  <strong>−</strong> abaixo do formato de cada dado (
                  <strong>D4, D6, D8, D10, D12, D20 ou D100</strong>) ou toque diretamente sobre a
                  forma para adicionar.
                </li>
                <li>
                  <strong>Modificador:</strong> Informe um valor positivo ou negativo no campo{" "}
                  <strong>Modificador</strong> para somá-lo automaticamente ao resultado final.
                </li>
                <li>
                  <strong>Resultado e Soma:</strong> Cada dado exibe seu resultado individual na
                  mesa, enquanto a <strong>Soma Total</strong> aparece no topo sempre que houver
                  mais de um dado ou modificador ativo.
                </li>
                <li>
                  <strong>Histórico:</strong> Toque no ícone de relógio no canto superior direito
                  para consultar suas rolagens recentes.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Histórico de Rolagens */}
      {showHistoryModal && (
        <div className="dados-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="dados-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dados-modal-close-btn"
              onClick={() => setShowHistoryModal(false)}
            >
              ✕
            </button>
            <h2 className="dados-modal-title">HISTÓRICO DE ROLAGENS</h2>

            {history.length === 0 ? (
              <div className="dados-history-empty">Nenhuma rolagem registrada ainda.</div>
            ) : (
              <>
                <div className="dados-history-list">
                  {history.map((item) => (
                    <div key={item.id} className="dados-history-item">
                      <div className="dados-history-top">
                        <span className="dados-history-formula">{item.formula}</span>
                        <span className="dados-history-time">{item.time}</span>
                      </div>
                      <div className="dados-history-bottom">
                        <div className="dados-history-chips">
                          {item.results.map((r, idx) => (
                            <span key={idx} className="dados-history-chip">
                              D{r.sides}: <strong>{r.value}</strong>
                            </span>
                          ))}
                          {item.modifier !== 0 && (
                            <span className="dados-history-chip mod-chip">
                              Mod:{" "}
                              <strong>
                                {item.modifier > 0
                                  ? `+${item.modifier}`
                                  : `−${Math.abs(item.modifier)}`}
                              </strong>
                            </span>
                          )}
                        </div>
                        {(item.results.length > 1 || item.modifier !== 0) && (
                          <div className="dados-history-total">
                            Total: <strong>{item.total}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="dados-history-clear-btn"
                  onClick={clearHistory}
                >
                  Limpar Histórico
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}