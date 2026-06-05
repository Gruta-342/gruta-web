import React, { useRef, useState, useEffect } from "react";
import EventCard from "../EventCard/EventCard";
// Certifique-se de que o caminho do seu data está correto!
import { eventsData } from "../../data/events"; 
import "./EventsSection.css";

export default function EventsSection() {
  const carouselRef = useRef(null);
  
  const [isAtStart, setIsAtStart] = useState(true); 
  const [isAtEnd, setIsAtEnd] = useState(false);

  const recentEvents = eventsData.slice(0, 5);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    
    setIsAtStart(scrollLeft <= 0);
    setIsAtEnd(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
  };

  useEffect(() => {
    handleScroll();
  }, []);

  // Função simplificada: calcula apenas a largura de 1 card + o gap (para o mobile)
  const getCardScrollAmount = () => {
    if (!carouselRef.current) return 0;
    const cardWidth = carouselRef.current.children[0].offsetWidth;
    const gap = 20; 
    return cardWidth + gap;
  };

  // --- LÓGICA INTELIGENTE DE ROLAGEM ---
  const scrollLeftBtn = () => {
    if (!carouselRef.current) return;
    
    if (window.innerWidth > 768) {
      // DESKTOP: Rola tudo para a posição 0 (início absoluto)
      carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      // MOBILE: Volta a largura exata de 1 card
      carouselRef.current.scrollBy({ left: -getCardScrollAmount(), behavior: "smooth" });
    }
  };

  const scrollRightBtn = () => {
    if (!carouselRef.current) return;
    
    if (window.innerWidth > 768) {
      // DESKTOP: Rola tudo para o tamanho máximo da caixa (final absoluto)
      carouselRef.current.scrollTo({ left: carouselRef.current.scrollWidth, behavior: "smooth" });
    } else {
      // MOBILE: Avança a largura exata de 1 card
      carouselRef.current.scrollBy({ left: getCardScrollAmount(), behavior: "smooth" });
    }
  };

  return (
    <section className="events-section">
      <h2 className="section-title">ÚLTIMOS EVENTOS</h2>
      
      <div className="carousel-wrapper">
        
        {!isAtStart && (
          <button className="carousel-arrow left" onClick={scrollLeftBtn}>❮</button>
        )}
        
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

        {!isAtEnd && (
          <button className="carousel-arrow right" onClick={scrollRightBtn}>❯</button>
        )}
        
      </div>
    </section>
  );
}