"use client";

import React, { useState, useEffect, useMemo } from "react";
import "./Acervo.css";
import { gamesData as staticGamesData } from "../../data/games";

// Sub-componente para não repetirmos código na hora de desenhar a grade
function GameGrid({ title, tagline, games, isLoading }) {
  return (
    <div className="game-category-section">
      <h2 className="section-subtitle">{title}</h2>
      {tagline && <p className="section-tagline">{tagline}</p>}
      
      {/* Caso a categoria ainda não tenha jogos cadastrados/visíveis */}
      {games.length === 0 && !isLoading ? (
        <p style={{ color: "#8a9fc4", marginTop: "15px", fontStyle: "italic" }}>
          Nenhum jogo disponível nesta categoria no momento.
        </p>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className="game-card">
              <img 
                src={game.image} 
                alt={game.title} 
                className="game-cover" 
                loading="lazy" 
                onError={(e) => { e.currentTarget.src = "/assets/logo.png"; }}
              />
              <div className="game-overlay">
                <h3 className="game-title">{game.title}</h3>
                {game.badge && <span className="game-badge">{game.badge}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Acervo() {
  const [gamesData, setGamesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Busca os jogos diretamente da API
    const loadGames = async () => {
      try {
        const response = await fetch("/api/games");
        if (response.ok) {
          const data = await response.json();
          // Filtramos para exibir apenas os jogos visíveis
          const visibleGames = data.filter(game => game.is_visible !== false);
          if (visibleGames.length > 0) {
            setGamesData(visibleGames);
          } else {
            setGamesData(staticGamesData);
          }
        } else {
          setGamesData(staticGamesData);
        }
      } catch (error) {
        console.error("Erro ao carregar o acervo:", error);
        setGamesData(staticGamesData);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGames();
  }, []);

  // Filtramos os jogos por categoria para criar as seções (com base nos dados do Banco ou fallback)
  const tabuleiros = useMemo(() => gamesData.filter(g => g.category === "Tabuleiros"), [gamesData]);
  const online = useMemo(() => gamesData.filter(g => g.category === "Online"), [gamesData]);
  const proprios = useMemo(() => gamesData.filter(g => g.category === "Próprios" || g.category === "Próprio / Evento"), [gamesData]);

  return (
    <section className="jogos-page">
      <div className="jogos-header">
        <h1 className="jogos-main-title">Acervo de Jogos da Gruta</h1>
        {isLoading ? (
          <p className="jogos-intro">Carregando nosso acervo...</p>
        ) : (
          <p className="jogos-intro">
            De dados rolados a servidores crashados. Escolha seu veneno.
          </p>
        )}
      </div>

      {!isLoading && (
        <>
          <GameGrid 
            title="Jogos de Tabuleiro" 
            tagline="Onde amizades terminam e acusações começam." 
            games={tabuleiros} 
            isLoading={isLoading}
          />
          
          <div className="jogos-separator"></div>

          <GameGrid 
            title="Jogos Online" 
            tagline="Desculpas de lag, calls confusas e sobrevivência duvidosa." 
            games={online} 
            isLoading={isLoading}
          />

          <div className="jogos-separator"></div>

          <GameGrid 
            title="Gruta Produções" 
            tagline="Código nosso, bugs nossos também." 
            games={proprios} 
            isLoading={isLoading}
          />
        </>
      )}
    </section>
  );
}
