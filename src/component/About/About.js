import React from "react";
import "./About.css";

export default function About() {
  const members = [
    { id: 1, name: "Elmi - O Guardião", img: "/assets/card-Elmi.jpeg" },
    { id: 2, name: "Guilherme - O Artesão", img: "/assets/card-Guilherme.jpeg" },
    { id: 3, name: "Jamilly - A Juíza", img: "/assets/card-Jamilly.jpeg" },
    { id: 4, name: "Noronha - O Erudito", img: "/assets/card-Noronha.jpeg" },
    { id: 5, name: "Samuel - O Sonhador", img: "/assets/card-Samuel.jpeg" },
    { id: 6, name: "Yasmin - A Naturalista", img: "/assets/card-Yasmin.jpeg" },
  ];

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
      
      <h1 className="about-title mobile-only-title">
        Entre, jogue um dado e aceite o seu destino.
      </h1>

      <div className="about-hero">
        
        <div className="about-text-container">
          <h1 className="about-title desktop-only-title">
            Entre, jogue um dado e aceite o seu destino.
          </h1>
          <p>
            A Gruta é onde a gente discute teorias, resolve mistério, inventa história,<br/> 
            joga conversa fora e ri alto sem medo de ser feliz.
          </p>
          <p className="highlight-text">
            Aqui a gente leva a zoeira a sério — mas só ela mesmo.
          </p>
          <p>
            Na Gruta, nada é planejado... mas tudo faz parte do plano, as vezes do B, do C ou do D.
          </p>
        </div>

        <div className="about-media-container">
          <img src="/assets/about.png" alt="Sobre a Gruta" className="about-media" />
        </div>

      </div>

      <div className="about-separator"></div>

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