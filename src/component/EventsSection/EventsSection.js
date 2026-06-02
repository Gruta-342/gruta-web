import React, { useRef } from "react";
import EventCard from "../EventCard/EventCard";
import { eventsData } from "../../data/events";
import "./EventsSection.css";

export default function EventsSection() {
  // O useRef é a nossa "âncora" para controlar a rolagem da div
  const carouselRef = useRef(null);

  // Pega estritamente os 5 primeiros eventos da lista
  const recentEvents = eventsData.slice(0, 5);

  // Função que calcula a distância exata do pulo
  const getScrollAmount = () => {
    // Medida de segurança caso o carrossel ainda não tenha carregado
    if (!carouselRef.current) return 0;

    // Pega a largura exata do primeiro card que está na tela
    const cardWidth = carouselRef.current.children[0].offsetWidth;
    const gap = 20; // O espaço entre os cards que definimos no CSS
    
    // A MÁGICA: Largura de 2 cards + gaps, subtraindo 60px.
    // Esse recuo de 60px é o que faz o card anterior (2º) ficar preso na borda esquerda,
    // o que naturalmente empurra o 5º card para aparecer um pouco mais na direita!
    return ((cardWidth + gap) * 2) - 80;
  };

  const scrollLeft = () => {
    carouselRef.current.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  };

  const scrollRight = () => {
    carouselRef.current.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  };

  return (
    <section className="events-section">
      <h2 className="section-title">ÚLTIMOS EVENTOS</h2>
      
      <div className="carousel-wrapper">
        {/* Seta Esquerda */}
        <button className="carousel-arrow left" onClick={scrollLeft}>❮</button>
        
        {/* A pista por onde os cards vão deslizar */}
        <div className="events-carousel" ref={carouselRef}>
          
          {recentEvents.map(event => (
            <EventCard key={event.id} data={event} />
          ))}
          
          {/* O Card final estático para "Ver Todos" */}
          <div className="view-all-card">
            <button className="view-all-btn">
              <span className="plus-icon">+</span>
              VER TODOS NO CALENDÁRIO
            </button>
          </div>

        </div>

        {/* Seta Direita */}
        <button className="carousel-arrow right" onClick={scrollRight}>❯</button>
      </div>
    </section>
  );
}