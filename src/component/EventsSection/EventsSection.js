"use client";

import React, { useRef, useState, useEffect } from "react";
import EventCard from "../EventCard/EventCard";
// Ajuste no caminho do import para puxar da nova pasta src/data
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

  const getCardScrollAmount = () => {
    if (!carouselRef.current) return 0;
    const cardWidth = carouselRef.current.children[0].offsetWidth;
    const gap = 20; 
    return cardWidth + gap;
  };

  const scrollLeftBtn = () => {
    if (!carouselRef.current) return;
    
    if (window.innerWidth > 768) {
      carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      carouselRef.current.scrollBy({ left: -getCardScrollAmount(), behavior: "smooth" });
    }
  };

  const scrollRightBtn = () => {
    if (!carouselRef.current) return;
    
    if (window.innerWidth > 768) {
      carouselRef.current.scrollTo({ left: carouselRef.current.scrollWidth, behavior: "smooth" });
    } else {
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