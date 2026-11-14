"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "./JogosOnline.css";

export default function JogosOnline() {
  const router = useRouter();

  // Jogos Web Próprios da Gruta
  const grutaPlayableGames = [
    {
      id: "termo-gruta",
      title: "Termo da Gruta",
      image: "/assets/games/termo.jpg",
      status: "playable",
      action: () => router.push("/jogos/termo"),
    },
    {
      id: "cruzadinha-gruta",
      title: "Cruzadinha",
      image: "/assets/games/cruzadinha.jpg",
      status: "playable",
      action: () => router.push("/jogos/cruzadinha"),
    },
    {
      id: "morcegos-gruta",
      title: "Caça Morcegos",
      image: "/assets/games/morcegos.jpg",
      status: "playable",
      action: () => router.push("/jogos/morcegos"),
    },
    {
      id: "dados-gruta",
      title: "Dados",
      image: "/assets/games/d20.jpg",
      status: "playable",
      action: () => router.push("/jogos/dados"),
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

      {/* Seção de Jogos Web (Jogáveis no Site) */}
      <div className="jogos-section-header">
        <div>
          <h2 className="jogos-section-title">Jogos Web da Gruta</h2>
          <p className="jogos-section-tagline">
            Projetos interativos e jogáveis diretamente no seu navegador.
          </p>
        </div>
      </div>

      <div className="playable-games-grid">
        {grutaPlayableGames.map((game) => (
          <div key={game.id} className="playable-card" onClick={game.action}>
            <div className="playable-media-wrapper">
              <img
                src={game.image}
                alt={game.title}
                className="playable-media-img"
                onError={(e) => {
                  e.currentTarget.src = "/assets/logo.png";
                }}
              />
              {game.status !== "playable" && (
                <span className="playable-status-badge status-dev">EM BREVE</span>
              )}
            </div>

            <div className="playable-title-bar">
              <h3>{game.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}