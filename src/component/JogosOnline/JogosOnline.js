"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importado para fazer o redirecionamento
import "./JogosOnline.css";
import { gamesData } from "../../data/games";

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

export default function JogosOnline() {
  const router = useRouter(); // Roteador para navegação de página inteira
  
  const [communityGames, setCommunityGames] = useState([]);
  const [activeMinigame, setActiveMinigame] = useState(null); 

  // Minigame D20 State
  const [diceValue, setDiceValue] = useState(20);
  const [isRolling, setIsRolling] = useState(false);
  const [diceFeedback, setDiceFeedback] = useState("Clique no botão para rolar o destino.");

  // Minigame Roleta State
  const rouletteChallenges = [
    "Conte a mentira mais descarada que você já contou para alguém da Gruta.",
    "Beba um gole de água (ou da sua bebida) em silêncio absoluto até o próximo turno.",
    "Imite a risca um dos membros da Gruta até que alguém adivinhe quem é.",
    "Você foi eleito o xerife da rodada: faça uma acusação sem motivo contra alguém da chamada.",
    "Mostre a foto mais aleatória da sua galeria de memes.",
    "Passe a vez! A sorte sorriu para a sua dignidade hoje.",
    "Defina a Gruta em 3 palavras que não podem ser repetidas por ninguém.",
    "Faça uma declaração dramática como se estivesse no leito de morte da Máfia."
  ];
  const [currentChallenge, setCurrentChallenge] = useState("Gire a roleta para sortear o desafio da rodada!");
  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);

  useEffect(() => {
    const loadCommunityGames = async () => {
      try {
        const response = await fetch("/api/games");
        if (response.ok) {
          const data = await response.json();
          const online = data.filter(g => g.category === "Online" && g.is_visible !== false);
          if (online.length > 0) {
            setCommunityGames(online);
          } else {
            setCommunityGames(gamesData.filter(g => g.category === "Online"));
          }
        } else {
          setCommunityGames(gamesData.filter(g => g.category === "Online"));
        }
      } catch (e) {
        setCommunityGames(gamesData.filter(g => g.category === "Online"));
      }
    };
    loadCommunityGames();
  }, []);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setDiceFeedback("Rolando os dados...");

    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 20) + 1);
      rolls++;
      if (rolls > 12) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 20) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        if (finalVal === 20) {
          setDiceFeedback("💥 20 NATURAL! ACERTO CRÍTICO! O universo conspira a seu favor!");
        } else if (finalVal === 1) {
          setDiceFeedback("💀 1 NATURAL! FALHA CRÍTICA! Nem a sorte pode te salvar agora.");
        } else if (finalVal >= 15) {
          setDiceFeedback("⚔️ Sucesso impressionante! Você passou com louvor.");
        } else if (finalVal <= 6) {
          setDiceFeedback("⚠️ Quase um desastre... O destino não foi amigável.");
        } else {
          setDiceFeedback(`Rolagem concluída com valor ${finalVal}.`);
        }
      }
    }, 60);
  };

  const spinRoulette = () => {
    if (isSpinningRoulette) return;
    setIsSpinningRoulette(true);
    let count = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * rouletteChallenges.length);
      setCurrentChallenge(rouletteChallenges[randIdx]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * rouletteChallenges.length);
        setCurrentChallenge(rouletteChallenges[finalIdx]);
        setIsSpinningRoulette(false);
      }
    }, 70);
  };

  // Jogos Web Próprios da Gruta
  const grutaPlayableGames = [
    {
      id: "termo-gruta",
      title: "Termo da Gruta",
      description: "O clássico jogo de adivinhar palavras com o tempero da nossa comunidade. Uma palavra por dia para testar seu vocabulário!",
      image: "/assets/games/termo.jpg", // Lembre-se de adicionar uma imagem ou ícone para o Termo nesta pasta
      tags: ["WEB GAME", "DISPONÍVEL", "DIÁRIO"],
      status: "playable",
      statusText: "Jogar Agora",
      action: () => router.push("/jogos/termo"), // Redireciona para a página criada no Passo 1
    },
    {
      id: "cruzadinha-gruta",
      title: "Cruzadinha da Gruta",
      description: "Palavras cruzadas inteligentes com 17 temas variados e 3 níveis de dificuldade. Teste seu vocabulário e raciocínio lógico!",
      image: "/assets/games/cruzadinha.jpg",
      tags: ["WEB GAME", "DISPONÍVEL", "17 TEMAS"],
      status: "playable",
      statusText: "Jogar Agora",
      action: () => router.push("/jogos/cruzadinha"),
    },
    {
      id: "d20-gruta",
      title: "Rolador de Críticos D20",
      description: "Utilitário interativo de dados para campanhas de RPG e decisões que exigem a intervenção dos deuses da sorte.",
      image: "/assets/mafia.jpg",
      tags: ["RPG & DADOS", "DISPONÍVEL", "WEB UTILITY"],
      status: "playable",
      statusText: "Jogar Agora",
      action: () => setActiveMinigame("d20"),
    },
  ];

  return (
    <section className="jogos-online-page">
      {/* Header */}
      <div className="jogos-online-header">
        <h1 className="jogos-online-title">Jogos da Gruta</h1>
        <p className="jogos-online-intro">
          Aqui a competição acontece online. Jogue nossos minigames diretamente pelo site.
        </p>
      </div>

      {/* 1. SEÇÃO DE JOGOS WEB (JOGÁVEIS NO SITE) */}
      <div className="jogos-section-header">
        <div>
          <h2 className="jogos-section-title">Jogos Web da Gruta</h2>
          <p className="jogos-section-tagline">Projetos interativos e jogáveis diretamente no seu navegador.</p>
        </div>
      </div>

      <div className="playable-games-grid">
        {grutaPlayableGames.map((game) => (
          <div key={game.id} className="playable-card">
            <div className="playable-media-wrapper">
              <img 
                src={game.image} 
                alt={game.title} 
                className="playable-media-img"
                onError={(e) => { e.currentTarget.src = "/assets/logo.png"; }}
              />
              <span className={`playable-status-badge ${game.status === "playable" ? "status-playable" : game.status === "dev" ? "status-dev" : "status-soon"}`}>
                {game.status === "playable" ? "● DISPONÍVEL" : "⚙️ EM PRODUÇÃO"}
              </span>
            </div>

            <div className="playable-content">
              <div className="playable-meta-tags">
                {game.tags.map((tag, idx) => (
                  <span key={idx} className="playable-tag">{tag}</span>
                ))}
              </div>

              <h3 className="playable-title">{game.title}</h3>
              <p className="playable-desc">{game.description}</p>

              <button
                type="button"
                className={`playable-action-btn ${game.status === "playable" ? "btn-play-now" : "btn-dev-soon"}`}
                onClick={game.action}
              >
                {game.status === "playable" ? "▶ " + game.statusText : "ℹ️ Detalhes do Projeto"}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* MODAL: D20 ROLLER */}
      {activeMinigame === "d20" && (
        <div className="game-modal-overlay" onClick={() => setActiveMinigame(null)}>
          <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h3>🎲 Rolador de Críticos D20</h3>
              <button type="button" className="game-modal-close" onClick={() => setActiveMinigame(null)}>×</button>
            </div>
            <div className="game-modal-body">
              <div className="dice-roller-container">
                <div className={`dice-display ${isRolling ? "rolling" : ""}`}>
                  {diceValue}
                </div>
                <div className={`dice-result-text ${diceValue === 20 ? "critical-success" : diceValue === 1 ? "critical-failure" : ""}`}>
                  {diceFeedback}
                </div>
                <button type="button" className="dice-roll-btn" onClick={rollDice} disabled={isRolling}>
                  {isRolling ? "Rolando..." : "Rolar o Dado (D20)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROLETA DO DESTINO */}
      {activeMinigame === "roleta" && (
        <div className="game-modal-overlay" onClick={() => setActiveMinigame(null)}>
          <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h3>🎡 Roleta do Destino da Gruta</h3>
              <button type="button" className="game-modal-close" onClick={() => setActiveMinigame(null)}>×</button>
            </div>
            <div className="game-modal-body">
              <div className="roulette-container">
                <p style={{ color: "#8a9fc4", fontSize: "14px", margin: 0 }}>
                  Gire a roleta em grupo na chamada do Discord e cumpra o desafio sorteado!
                </p>
                <div className="roulette-box">
                  {currentChallenge}
                </div>
                <button type="button" className="dice-roll-btn" onClick={spinRoulette} disabled={isSpinningRoulette}>
                  {isSpinningRoulette ? "Sorteando..." : "Girar Roleta!"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INFO MÁFIA */}
      {activeMinigame === "info-mafia" && (
        <div className="game-modal-overlay" onClick={() => setActiveMinigame(null)}>
          <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h3>🕵️ Máfia Italiana (Cidade Dorme Online)</h3>
              <button type="button" className="game-modal-close" onClick={() => setActiveMinigame(null)}>×</button>
            </div>
            <div className="game-modal-body" style={{ textAlign: "left" }}>
              <p style={{ color: "#00d2ff", fontWeight: 700, marginBottom: "10px" }}>
                🚀 Próximo Grande Lançamento Web da Gruta
              </p>
              <p style={{ color: "#c7d4e5", lineHeight: "1.6", marginBottom: "15px" }}>
                Estamos construindo um sistema de salas online multiplayer para jogar Máfia diretamente pelo navegador com a galera da Gruta.
              </p>
              <ul style={{ color: "#a0aab5", paddingLeft: "20px", lineHeight: "1.8", marginBottom: "20px" }}>
                <li>Distribuição secreta de papéis (Don Falcone, Detetive, Médico, Cidadãos);</li>
                <li>Votações secretas e fases diurnas/noturnas automatizadas;</li>
                <li>Integração com chamadas de voz para blefes e acusações sem moderação manual.</li>
              </ul>
              <button type="button" className="playable-action-btn btn-play-now" onClick={() => setActiveMinigame(null)}>
                Entendido! Ficarei de Olho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INFO DETETIVE */}
      {activeMinigame === "info-detetive" && (
        <div className="game-modal-overlay" onClick={() => setActiveMinigame(null)}>
          <div className="game-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h3>🔍 Detective Night: Casos da Gruta</h3>
              <button type="button" className="game-modal-close" onClick={() => setActiveMinigame(null)}>×</button>
            </div>
            <div className="game-modal-body" style={{ textAlign: "left" }}>
              <p style={{ color: "#00d2ff", fontWeight: 700, marginBottom: "10px" }}>
                🎲 Projeto em Desenvolvimento
              </p>
              <p style={{ color: "#c7d4e5", lineHeight: "1.6", marginBottom: "15px" }}>
                Um jogo de cartas e dedução web onde pistas, blefes e acusações cômicas sobre a história real da Gruta são resolvidos a cada turno.
              </p>
              <button type="button" className="playable-action-btn btn-play-now" onClick={() => setActiveMinigame(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}