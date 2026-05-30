import React from "react";
import EventCard from "../EventCard/EventCard";
import { eventsData } from "../../data/events";
import "./EventsSection.css";

export default function EventsSection() {
  return (
    <section className="events-section">
      <h2 className="section-title">ÚLTIMOS EVENTOS</h2>
      <div className="events-background">
        <div className="events-grid">
          {eventsData.map((event) => (
            <EventCard key={event.id} data={event} />
          ))}
        </div>
      </div>
    </section>
  );
}