"use client";

import React, { useState } from "react";
import HeroSlider from "../component/HeroSlider/HeroSlider";
import EventsSection from "../component/EventsSection/EventsSection";
import "./home.css";

export default function Home() {
  // A HOME AGORA CONTROLA O SLIDER E A LISTA
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderDelay, setSliderDelay] = useState(5000);

  // Função ao clicar em um item da lista
  const handleListClick = (index) => {
    setActiveSlide(index);
    setSliderDelay(30000); // Dá 30 segundos de paz pro usuário ler o evento
  };

  const upcomingEvents = [
    
    {
      id: 1,
      day: "14",
      month: "JUN",
      time: "19:00h",
      title: "Grotta Nostra (Máfia)",
      desc: "Vista-se a caráter, e defenda a sua família! Falcones vs. Leones, qual família triunfará?"
    },
    {
      id: 2,
      day: "27",
      month: "JUN",
      time: "21:30h",
      title: "Copa 2026: Segunda Rodada",
      desc: "Brasil enfrenta o próximo desafio do grupo. Churrasco e caos liberados."
    }
  ];

  return (
    <div className="home-container">
      
      <div className="home-hero-split">
        
        <div className="home-slider-wrapper">
          {/* Passamos o controle para dentro do componente do Slider */}
          <HeroSlider 
            currentSlide={activeSlide} 
            setCurrentSlide={setActiveSlide}
            delay={sliderDelay}
            setDelay={setSliderDelay}
          />
        </div>
        
        <div className="home-events-sidebar">
          <h2 className="sidebar-title">Próximos Eventos</h2>
          
          <div className="sidebar-list">
            {upcomingEvents.map((event, index) => (
              <div 
                key={event.id} 
                // A classe "active" é injetada dinamicamente aqui se o índice bater com o banner!
                className={`sidebar-event-item ${index === activeSlide ? "active" : ""}`}
                onClick={() => handleListClick(index)}
              >
                
                {/* COLUNA DA ESQUERDA: Data */}
                <div className="event-date-col">
                  <span className="date-day">{event.day}</span>
                  <span className="date-month">{event.month}</span>
                </div>

                {/* COLUNA DA DIREITA: Título, Hora e Descrição */}
                <div className="event-content-col">
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <span className="event-time">{event.time}</span>
                  </div>
                  <p className="event-desc">{event.desc}</p>
                </div>
                
              </div>
            ))}
          </div>
          
        </div>
        
      </div>
      
      <EventsSection />

    </div>
  );
}