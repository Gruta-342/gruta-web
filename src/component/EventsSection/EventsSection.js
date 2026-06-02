import React, { useRef, useState, useEffect } from "react";
import EventCard from "../EventCard/EventCard";
import { eventsData } from "../../data/events";
import "./EventsSection.css";

export default function EventsSection() {
  const carouselRef = useRef(null);
  
  // Estados para controlar a visibilidade das setas
  const [isAtStart, setIsAtStart] = useState(true); // Começa verdadeiro, pois inicia no topo
  const [isAtEnd, setIsAtEnd] = useState(false);

  const recentEvents = eventsData.slice(0, 5);

  // Função que monitora a rolagem para esconder/mostrar as setas
  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    
    // Se a rolagem for 0, bateu na esquerda
    setIsAtStart(scrollLeft <= 0);
    
    // Se a rolagem atual + o tamanho da tela for igual ao tamanho total, bateu na direita
    // Usamos Math.ceil para evitar bugs de casas decimais em alguns navegadores
    setIsAtEnd(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
  };

  // Garante que o cálculo seja feito assim que a tela carregar
  useEffect(() => {
    handleScroll();
  }, []);

  const getScrollAmount = () => {
    if (!carouselRef.current) return 0;
    const cardWidth = carouselRef.current.children[0].offsetWidth;
    const gap = 20; 
    return ((cardWidth + gap) * 2) - 60;
  };

  const scrollLeftBtn = () => {
    carouselRef.current.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  };

  const scrollRightBtn = () => {
    carouselRef.current.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  };

  return (
    <section className="events-section">
      <h2 className="section-title">ÚLTIMOS EVENTOS</h2>
      
      <div className="carousel-wrapper">
        
        {/* Renderiza a seta esquerda APENAS se não estiver no começo */}
        {!isAtStart && (
          <button className="carousel-arrow left" onClick={scrollLeftBtn}>❮</button>
        )}
        
        {/* Adicionamos o evento onScroll aqui para escutar o movimento */}
        <div className="events-carousel" ref={carouselRef} onScroll={handleScroll}>
          
          {recentEvents.map(event => (
            <EventCard key={event.id} data={event} />
          ))}
          
          <div className="view-all-card">
            <button className="view-all-btn">
              <span className="plus-icon">+</span>
              VER TODOS NO CALENDÁRIO
            </button>
          </div>

        </div>

        {/* Renderiza a seta direita APENAS se não estiver no final */}
        {!isAtEnd && (
          <button className="carousel-arrow right" onClick={scrollRightBtn}>❯</button>
        )}
        
      </div>
    </section>
  );
}