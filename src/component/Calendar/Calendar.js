"use client";

import React, { useState } from "react";
import "./Calendar.css";
import EventCard from "../EventCard/EventCard";
// O caminho do import de dados subiu um nível
import { eventsData } from "../../data/events";

export default function Calendar() {
  const upcomingEvents = [
    {
      id: "up-1",
      title: "Brasil x Marrocos",
      date: "13 JUN",
      description: "A abertura da Seleção Brasileira na Copa do Mundo de 2026 pede cerveja e bons amigos.",
      image: "/assets/copa-mob.jpg" 
    },
    {
      id: "up-2",
      title: "Festa-temática: Mafia Italiana",
      date: "14 JUN",
      description: "Vista-se a caráter, e defenda a sua família! Falcones vs. Leones, qual família triunfará?.",
      image: "/assets/mafia-mob.jpg" 
    },
    {
      id: "up-3",
      title: "Brasil x Haiti",
      date: "19 JUN",
      description: "O primeiro jogo já passou, mas ainda queremos cerveja e bons amigos. Tamo junto de novo!",
      image: "/assets/copa2-mob.jpg" 
    }
  ];

  const [activeEvent, setActiveEvent] = useState(upcomingEvents[0]);

  return (
    <section className="calendar-page">
      
      <div className="upcoming-section">
        <h2 className="section-subtitle">Próximos Eventos</h2>
        <p className="section-tagline">Marque na agenda. Ou não, a gente te cobra no WhatsApp.</p>
        
        <div className="upcoming-layout">
          
          <div className="upcoming-list">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id} 
                className={`upcoming-list-item ${activeEvent.id === event.id ? "active" : ""}`}
                onClick={() => setActiveEvent(event)}
              >
                <div className="upcoming-list-date">{event.date}</div>
                <div className="upcoming-list-info">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="upcoming-banner-container">
            <img 
              src={activeEvent.image} 
              alt={activeEvent.title} 
              className="upcoming-banner-img fade-in" 
              key={activeEvent.id} 
            />
            <div className="upcoming-banner-overlay">
              <span className="banner-badge">EM BREVE</span>
            </div>
          </div>

        </div>
      </div>

      <div className="calendar-separator"></div>

      <div className="all-events-section">
        <h2 className="section-subtitle">Histórico da Gruta</h2>
        <p className="section-tagline">Tudo que já rolou (e sobrevivemos para contar).</p>
        
        <div className="all-events-grid">
          {eventsData.map((event) => (
            <EventCard key={event.id} data={event} />
          ))}
        </div>
      </div>

    </section>
  );
}