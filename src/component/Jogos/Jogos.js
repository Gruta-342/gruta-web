import React from "react";
import "./Jogos.css";
import { gamesData } from "../../data/games";

export default function Jogos() {
  // Filtramos os jogos por categoria para criar as seções
  const tabuleiros = gamesData.filter(g => g.category === "Tabuleiros");
  const online = gamesData.filter(g => g.category === "Online");
  const proprios = gamesData.filter(g => g.category === "Próprios");

  // Sub-componente para não repetirmos código na hora de desenhar a grade
  const GameGrid = ({ title, tagline, games }) => (
    <div className="game-category-section">
      <h2 className="section-subtitle">{title}</h2>
      {tagline && <p className="section-tagline">{tagline}</p>}
      
      <div className="games-grid">
        {games.map(game => (
          <div key={game.id} className="game-card">
            {/* Se a imagem ainda não existir, o alt-text aparece */}
            <img src={game.image} alt={game.title} className="game-cover" />
            <div className="game-overlay">
              <h3 className="game-title">{game.title}</h3>
              {game.badge && <span className="game-badge">{game.badge}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="jogos-page">
      <div className="jogos-header">
        <h1 className="jogos-main-title">Acervo da Gruta</h1>
        <p className="jogos-intro">
          De dados rolados a servidores crashados. Escolha seu veneno.
        </p>
      </div>

      <GameGrid 
        title="Jogos de Tabuleiro" 
        tagline="Onde amizades terminam e acusações começam." 
        games={tabuleiros} 
      />
      
      <div className="jogos-separator"></div>

      <GameGrid 
        title="Jogos Online" 
        tagline="Desculpas de lag, calls confusas e sobrevivência duvidosa." 
        games={online} 
      />

        <div className="jogos-separator"></div>

        <GameGrid 
        title="Gruta Produções" 
        tagline="Código nosso, bugs nossos também." 
        games={proprios} 
      />

    </section>
  );
}