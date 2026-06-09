"use client";

import React, { useState } from "react";
import EventCard from "../EventCard/EventCard";
import { eventsData } from "../../data/events"; 
import "./EventsSection.css";

export default function EventsSection() {
  const [showAll, setShowAll] = useState(false);

  const displayedEvents = showAll ? eventsData : eventsData.slice(0, 4);

  return (
    <section className="events-section">
      <h2 className="section-title">ÚLTIMOS EVENTOS</h2>
      
      <div className="events-grid">
        {displayedEvents.map(event => (
          <EventCard key={event.id} data={event} />
        ))}
      </div>

      {/* Botão Dinâmico: Alterna entre Ver mais e Ver menos */}
      {eventsData.length > 4 && (
        <div className="view-more-container">
          <button 
            className="view-more-btn" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Ver menos" : "Ver mais"}
          </button>
        </div>
      )}
      
    </section>
  );
}