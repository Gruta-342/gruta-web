import React from "react";
import "./About.css";

import aboutImg from "../../assets/about.png";
// Importando as artes dos membros
import yasminImg from "../../assets/card-Yasmin.jpeg";
import elmiImg from "../../assets/card-Elmi.jpeg";
import guilhermeImg from "../../assets/card-Guilherme.jpeg";
import jamillyImg from "../../assets/card-Jamilly.jpeg";
import noronhaImg from "../../assets/card-Noronha.jpeg";
import samuelImg from "../../assets/card-Samuel.jpeg";

export default function About() {
  // Array com as artes (já que o nome e classe já estão desenhados na própria imagem)
  const members = [
    { id: 1, name: "Elmi - O Guardião", img: elmiImg },
    { id: 2, name: "Guilherme - O Artesão", img: guilhermeImg },
    { id: 3, name: "Jamilly - A Juíza", img: jamillyImg },
    { id: 4, name: "Noronha - O Erudito", img: noronhaImg },
    { id: 5, name: "Samuel - O Sonhador", img: samuelImg },
    { id: 6, name: "Yasmin - A Naturalista", img: yasminImg },
  ];

  // Array com as atividades da Gruta
  const activities = [
    {
      icon: "🕵️",
      title: "Noite do Detetive",
      desc: "Onde ninguém sabe nada, mas alguém sempre acerta sem querer."
    },
    {
      icon: "🎲",
      title: "Board Games",
      desc: "Aqui o único objetivo é sobreviver. Mas a gente sabe que ninguém vai."
    },
    {
      icon: "♣️",
      title: "Cassino da Gruta",
      desc: "Apostamos dinheiro? Não. Apostamos nossa dignidade."
    },
    {
      icon: "🎉",
      title: "Festas Temáticas",
      desc: "Uma desculpa perfeita pra usar roupas diferentes por uma noite."
    },
    {
      icon: "🐉",
      title: "RPG & Campanhas",
      desc: "Todo mundo tem um plano... até o mestre começar a sorrir."
    },
    {
      icon: "👻",
      title: "Noite do Terror",
      desc: "Filme de terror e aquele grito que vem do nada (às vezes é do filme)."
    }
  ];

  return (
    <section className="about-section">
      
      {/* 1. INTRODUÇÃO */}
      <div className="about-hero">
        
        {/* Lado Esquerdo: Textos */}
        <div className="about-text-container">
          <h1 className="about-title">
            Entre, jogue um dado e aceite seu destino.
          </h1>
          <p>
            A Gruta é onde a gente discute teorias, resolve mistério, inventa história, 
            joga conversa fora e ri alto sem medo de ser feliz.
          </p>
          <p className="highlight-text">
            Aqui a gente leva a zoeira a sério — mas só ela mesmo.
          </p>
          <p>
            Na Gruta, nada é planejado... mas tudo faz parte do plano, as vezes <br/>do B, do C ou do D.
          </p>
        </div>

        {/* Lado Direito: Mídia (Foto/Vídeo) */}
        <div className="about-media-container">
          <img src={aboutImg} alt="Sobre a Gruta" className="about-media" />
          {/* DICA: Futuramente, você só precisará trocar a tag <img> acima por:
              <video src={seuVideo} className="about-media" autoPlay loop muted playsInline /> 
          */}
        </div>

      </div>

      <div className="about-separator"></div>

      {/* 2. OS MEMBROS */}
      <div className="members-section">
        <h2 className="section-subtitle">Membros da Gruta</h2>
        <p className="section-tagline">As mentes brilhantes (e altamente questionáveis) por trás de cada história.</p>
        <div className="members-grid">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <img src={member.img} alt={member.name} className="member-image" />
            </div>
          ))}
        </div>
      </div>

      <div className="about-separator"></div>

      {/* 3. O QUE FAZEMOS */}
      <div className="activities-section">
        <h2 className="section-subtitle">O Que Fazemos</h2>
        <p className="section-tagline">Um brinde ao que deu certo. E outro ao que deu errado</p>
        <div className="activities-grid">
          {activities.map((activity, index) => (
            <div key={index} className="activity-card">
              <div className="activity-icon">{activity.icon}</div>
              <h3 className="activity-title">{activity.title}</h3>
              <p className="activity-desc">{activity.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}