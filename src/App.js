import React, { useState } from "react";
import Header from "./component/Header/Header";
import HeroSlider from "./component/HeroSlider/HeroSlider";
import EventsSection from "./component/EventsSection/EventsSection";
import Footer from "./component/Footer/Footer";
import FloatingSocials from "./component/FloatingSocials/FloatingSocials";
import "./styles.css"; // Assumindo que você tem um CSS global

export default function App() {
  // O estado "0" significa que a primeira aba (Home) começa ativa
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="App">
      {/* Passamos o estado e a função como propriedades para o Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        
        {/* LÓGICA CONDICIONAL DAS ABAS */}
        {activeTab === 0 ? (
          // O que aparece na aba 0 (Home)
          <>
            <HeroSlider />
            <EventsSection />
          </>
        ) : (
          // O que aparece nas outras abas (1, 2, 3...)
          <div className="construction-container">
            <h2 className="construction-title">ÁREA EM CONSTRUÇÃO</h2>
            <p className="construction-text">
              Os goblins da Gruta estão trabalhando duro para liberar esta página. 
              Volte mais tarde para rolar os dados!
            </p>
          </div>
        )}

      </main>

      <Footer />
      <FloatingSocials />
    </div>
  );
}