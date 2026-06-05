import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./component/Header/Header";
import HeroSlider from "./component/HeroSlider/HeroSlider";
import EventsSection from "./component/EventsSection/EventsSection";
import About from "./component/About/About";
import Footer from "./component/Footer/Footer";
import FloatingSocials from "./component/FloatingSocials/FloatingSocials";
import "./styles.css"; 

export default function App() {
  return (
    // O Router precisa envolver todo o site
    <Router>
      <div className="App">
        <Header />

        <main className="main-content">
          <Routes>
            
            <Route path="/" element={<><HeroSlider /><EventsSection /></>} />
            <Route path="/sobre" element={<About />} />
            <Route path="/calendario" element={<EmConstrucao />} />
            <Route path="/jogos" element={<EmConstrucao />} />
            <Route path="/galeria" element={<EmConstrucao />} />
            
            {/* 2. ADICIONE ESTA NOVA ROTA AQUI NO FINAL */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Routes>
        </main>

        <Footer />
        <FloatingSocials />
      </div>
    </Router>
  );
}

// Mini componente para reaproveitar a tela de "Em Construção"
function EmConstrucao() {
  return (
    <div className="construction-container">
      <h2 className="construction-title">ÁREA EM CONSTRUÇÃO</h2>
      <p className="construction-text">
        Os goblins da Gruta estão trabalhando duro para liberar esta página. 
        Volte mais tarde para rolar os dados!
      </p>
    </div>
  );
}