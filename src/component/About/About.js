"use client";

import React, { useState } from "react";
import "./About.css";

export default function About() {
  const [activeCard, setActiveCard] = useState(null);
  const [showEstatuto, setShowEstatuto] = useState(false);
  const [modalType, setModalType] = useState(null); 
  
  const members = [
    { id: 1, name: "Elmi", alias: "O Guardião", color: "#2196F3", img: "/assets/card-Elmi.jpeg", flavor: "O Supremo Tribunal das Regras. É a ele que todos recorrem em caso de dúvida, mas que, curiosamente, sofre de amnésia seletiva quando a regra joga contra ele." },
    { id: 2, name: "Guilherme", alias: "O Artesão", color: "#2196F3", img: "/assets/card-Guilherme.jpeg", flavor: "Transforma qualquer ideia caótica em um projeto incrível e bem apresentável... Só não peça prazos, porque a inspiração dele trabalha no próprio fuso horário." },
    { id: 3, name: "Jamilly", alias: "A Juíza", color: "#2196F3", img: "/assets/card-Jamilly.jpeg", flavor: "O radar de julgamento que nunca desliga. Nada escapa do seu olhar crítico. Ela julga as suas atitudes, as atitudes do mestre, a si mesma antes de dormir... ninguém está a salvo.." },
    { id: 4, name: "Noronha", alias: "O Erudito", color: "#2196F3", img: "/assets/card-Noronha.jpeg", flavor: "O sorriso mais amigável do grupo escondendo uma sabedoria que vai desde a elétrica até a relatividade geral. O único mistério não decifrado é a sua dicção que raramente acompanha a velocidade do raciocínio." },
    { id: 5, name: "Samuel", alias: "O Sonhador", color: "#2196F3", img: "/assets/card-Samuel.jpeg", flavor: "A arma secreta do caos. Passa 90% do tempo habitando o mundo da lua. Nos outros 10%, ele transcende a realidade com uma estratégia genial que humilha todo mundo de surpresa." },
    { id: 6, name: "Yasmin", alias: "A Naturalista", color: "#2196F3", img: "/assets/card-Yasmin.jpeg", flavor: "Estuda para medicina com a mesma intensidade que domina o mundo espiritual. Tem uma personalidade forte e não aceita desaforos, afinal, ela sabe exatamente onde dói, tanto no plano físico quanto no astral." },
  ];

  const spread6 = [
    { tx: -275, ty: 30, rot: -20 },
    { tx: -165, ty: 10, rot: -12 },
    { tx: -55,  ty: 0,  rot: -4 },
    { tx: 55,   ty: 0,  rot: 4 },
    { tx: 165,  ty: 10, rot: 12 },
    { tx: 275,  ty: 30, rot: 20 },
  ];

  const spread5 = [
    { tx: -220, ty: 25, rot: -16 },
    { tx: -110, ty: 6,  rot: -8 },
    { tx: 0,    ty: 0,  rot: 0 }, 
    { tx: 110,  ty: 6,  rot: 8 },
    { tx: 220,  ty: 25, rot: 16 },
  ];

  const activities = [
    { icon: "🎲", title: "Jogos de Tabuleiro", desc: "De blefes absurdos a alianças duvidosas. A amizade é testada a cada rodada e a paz nunca é uma opção." },
    { icon: "🎮", title: "Jogos Online", desc: "Aqui o único objetivo é sobreviver. Mas a gente sabe que ninguém vai." },
    { icon: "🎉", title: "Festas Temáticas", desc: "Uma desculpa perfeita pra usar roupas diferentes por uma noite." },
    { icon: "🕵️", title: "Detective Night", desc: "Onde ninguém sabe nada, mas alguém sempre acerta sem querer." },
    { icon: "♣️", title: "Cassino da Gruta", desc: "Apostamos dinheiro? Não. Apostamos nossa dignidade." },
    { icon: "🐉", title: "RPG & Campanhas", desc: "Todo mundo tem um plano... até o mestre começar a sorrir." },
    { icon: "🍿", title: "Noite do Cinema", desc: "A gente escolhe o filme com a melhor das intenções, mas acabamos julgando roteiro, personagens e direção a sessão inteira." },
    { icon: "🍺", title: "Resenha da Gruta", desc: "De debates filosóficos profundos às piadas mais quinta-série possíveis. Tudo resolvido em volta da mesa com uma cervejinha gelada." },
    { icon: "💡", title: "Projetos Infinitos", desc: "Ideias geniais, várias linhas de código e artes refeitas. A gente está sempre criando algo incrível, só não perguntem quando vai ficar pronto." }
  ];

  const confirmOpenEstatuto = () => {
    setShowEstatuto(true);
    setModalType(null);
  };

  const confirmCloseEstatuto = () => {
    setShowEstatuto(false);
    setModalType(null);
  };

  return (
    <section className="about-section" onClick={() => setActiveCard(null)}>
      
      <div className="content-wrapper">
        
        {/* --- INTRODUÇÃO ORIGINAL --- */}
        <h1 className="about-title mobile-only-title">
          Entre, jogue um dado e aceite o seu destino.
        </h1>

        <div className="about-hero">
          <div className="about-text-container">
            <h1 className="about-title desktop-only-title">
              Entre, jogue um dado e aceite o seu destino.
            </h1>
            <p>
              A Gruta é onde a gente discute teorias, resolve mistério, inventa história, 
              joga conversa fora e ri alto sem medo de ser feliz.
            </p>
            <p className="highlight-text">
              Aqui a gente leva a zoeira a sério — mas só ela mesmo.
            </p>
            <p>
              Na Gruta, nada é planejado... mas tudo faz parte do plano, as vezes do B, do C ou do D.
            </p>
          </div>

          <div className="about-media-container">
            <img src="/assets/about.png" alt="Sobre a Gruta" className="about-media" />
          </div>
        </div>

        <div className="about-separator"></div>

        {/* --- DECK DE MEMBROS --- */}
        <div className="members-section">
          <h2 className="section-subtitle center">Membros da Gruta</h2>
          <p className="section-tagline center">Escolha sua carta. As mentes brilhantes (e altamente questionáveis) por trás da mesa.</p>
          
          <div className={`members-deck-container ${activeCard ? 'has-active' : ''}`}>
            {members.map((member, index) => {
              const isActive = activeCard?.id === member.id;
              let transformVars = {};
              let zIndex = index + 1; 

              if (!activeCard) {
                transformVars = spread6[index];
              } else if (isActive) {
                transformVars = { tx: 0, ty: 170, rot: 0 };
                zIndex = 20; 
              } else {
                const unselectedIdx = members.filter(m => m.id !== activeCard.id).findIndex(m => m.id === member.id);
                transformVars = spread5[unselectedIdx];
              }

              return (
                <div 
                  key={member.id} 
                  className={`deck-card ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setActiveCard(isActive ? null : member);
                  }}
                  style={{ 
                    '--theme-color': member.color,
                    '--tx': transformVars.tx,    
                    '--ty': transformVars.ty,    
                    '--rot': transformVars.rot,  
                    '--idx': index,              
                    zIndex: zIndex
                  }}
                >
                  <img src={member.img} alt={member.name} className="member-image" />
                </div>
              );
            })}
          </div>

          <div className={`character-panel ${activeCard ? 'visible' : ''}`}>
            {activeCard && (
              <div className="holographic-scroll" style={{ '--theme-color': activeCard.color }}>
                <h3 className="character-title" style={{ color: activeCard.color }}>
                  {activeCard.name} <span className="character-alias">— {activeCard.alias}</span>
                </h3>
                <p className="character-flavor">\"{activeCard.flavor}\"</p>
              </div>
            )}
          </div>
        </div>

        <div className="about-separator"></div>

        {/* --- ATIVIDADES --- */}
        <div className="activities-section">
          <h2 className="section-subtitle">O Que Fazemos</h2>
          <p className="section-tagline">Um brinde ao que deu certo. E outro ao que deu errado.</p>
          <div className="activities-grid">
            {activities.map((activity, index) => (
              <div key={index} className="activity-card">
                <div className="activity-icon">{activity.icon}</div>
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-desc">{activity.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-separator"></div>

        {/* --- ESTATUTO --- */}
        <div className="manifesto-section">
          <h2 className="section-subtitle">O Estatuto Oficial da Gruta 342</h2>
          <p className="section-tagline">Nossa legislação interna. Você aceita os termos e condições?</p>
          
          {!showEstatuto ? (
            <div className="estatuto-closed">
              <button className="estatuto-btn" onClick={() => setModalType('open')}>
                Ler o Estatuto Oficial da Gruta
              </button>
            </div>
          ) : (
            <div className="estatuto-open">
              
              <div className="estatuto-header">
                <h2>ESTATUTO OFICIAL DA GRUTA 342</h2>
                <span>Versão 1.0 — Onde a lei do mais esperto impera.</span>
              </div>

              <div className="estatuto-body">
                
                <div className="estatuto-capitulo">
                  <h3>CAPÍTULO I — DA NATUREZA E DOS OBJETIVOS</h3>
                  <p><strong>Art. 1º</strong> — A Gruta 342 é uma entidade de direito caótico, sem fins lucrativos (mas com altas chances de perda financeira em apostas ridículas), autônoma e soberana, dedicada exclusivamente ao lazer questionável, jogatinas duvidosas e à zoeira sem limites entre os seus membros.</p>
                  
                  <p><strong>Art. 2º</strong> — São objetivos fundamentais da Gruta:</p>
                  <ul>
                    <li><strong>I.</strong> Garantir que nenhuma amizade saia intacta de uma partida de tabuleiro ou videogame.</li>
                    <li><strong>II.</strong> Prover um ambiente seguro para teorias da conspiração absurdas e piadas de péssimo gosto.</li>
                    <li><strong>III.</strong> Manter o site da Gruta ativo e alimentado com lore suficiente para confundir qualquer visitante de fora.</li>
                  </ul>
                </div>

                <div className="estatuto-capitulo">
                  <h3>CAPÍTULO II — DAS REGRAS DE OURO (E DE OURO FALSO)</h3>
                  <h4>Seção I — Das Regras de Convivência Interna</h4>
                  <p><strong>Art. 3º</strong> — A Primeira Regra da Gruta: Você DEVE falar sobre a Gruta. Quanto mais gente souber que a gente existe, melhor. Porém, fica estritamente estabelecido que conhecer a Gruta é bem diferente de fazer parte dela. Espalhar a palavra é dever de todos; permitir que qualquer um entre no recinto é um luxo concedido a pouquíssimos.</p>
                  <p><strong>Art. 4º</strong> — A Segunda Regra da Gruta: Se é dia de jogatina, desmarque compromissos importantes. Casamentos, aniversários de avós e reuniões de trabalho são secundários diante de um board game mal explicado ou uma partida online perdida.</p>
                  <p><strong>Art. 5º</strong> — A Terceira Regra da Gruta: Atrasos superiores a 15 minutos sem justificativa aceitável (como indicação ao Óscar ou abdução alienígena comprovada) resultarão em constrangimento público durante toda sessão.</p>

                  <h4>Seção II — Da Ética nas Jogatinas (e Fora delas)</h4>
                  <p><strong>Art. 6º</strong> — É estritamente permitido e encorajado mentir, blefar, enganar, trapacear psicologicamente, chantagear emocionalmente e manipular todos os presentes durante qualquer jogatina.</p>
                  <p className="paragrafo-unico"><strong>Parágrafo único:</strong> Ganhar na base da honestidade pura é considerado falta de estilo; ganhar fazendo todo mundo brigar entre si é uma obra de arte.</p>
                </div>

                <div className="estatuto-capitulo">
                  <h3>CAPÍTULO III — DOS DIREITOS E DEVERES DOS MEMBROS</h3>
                  <p><strong>Art. 7º</strong> — São direitos do membro da Gruta:</p>
                  <ul>
                    <li><strong>I.</strong> Reclamar da sorte nos dados, mesmo quando a probabilidade matemática provar que a culpa foi exclusivamente burrice tática sua.</li>
                    <li><strong>II.</strong> Comer a última fatia de pizza desde que arque com as consequências morais e os olhares de ódio dos demais.</li>
                    <li><strong>III.</strong> Vetar por puro capricho e sem nenhuma justificativa lógica qualquer jogo escolhido pelos outros membros, apenas para manter a tradição do caos democrático.</li>
                  </ul>

                  <p><strong>Art. 8º</strong> — São deveres do membro:</p>
                  <ul>
                    <li><strong>I.</strong> Trazer petiscos ou bebidas para as reuniões presenciais.</li>
                    <li><strong>II.</strong> Nunca, sob hipótese alguma, admitir que perdeu por incompetência; a culpa é sempre dos dados, da Meta, do sol batendo na tela ou do alinhamento dos planetas.</li>
                    <li><strong>III.</strong> Acessar o site da Gruta pelo menos uma vez por semana para garantir que o algoritmo não ache que a gente morreu.</li>
                  </ul>
                </div>

                <div className="estatuto-capitulo">
                  <h3>CAPÍTULO IV — DAS SANÇÕES E PENALIDADES</h3>
                  <p><strong>Art. 9º</strong> — O descumprimento deste Estatuto sujeitará o infrator a penalidades severas aplicadas pelo Supremo Tribunal da Gruta (composto por quem estiver gritando mais alto no momento).</p>
                  <ul>
                    <li><strong>I. Advertência Verbal:</strong> Para infrações leves (ex: demorar muito para jogar o turno).</li>
                    <li><strong>II. O Exílio do Banquinho:</strong> O infrator perde o direito de sentar nos lugares confortáveis e é sumariamente relegado à cadeira mais desconfortável da sala (aquela que deixa a coluna em formato de interrogação) ou ao chão.</li>
                    <li><strong>III. O Veto de Voz (Modo Espectador):</strong> Durante a próxima rodada, o infrator é proibido de dar palpites, gritar dicas erradas ou tentar influenciar os outros jogadores. Ficará em completo silêncio, sob pena de extensão da pena por mais duas rodadas.</li>
                  </ul>
                </div>

                <div className="estatuto-capitulo">
                  <h3>CAPÍTULO V — DAS DISPOSIÇÕES FINAIS</h3>
                  <p><strong>Art. 10º</strong> — Este estatuto entra em vigor na data de sua publicação no site da Gruta 342, revogando todas as disposições em contrário (ou seja, qualquer regra sensata que alguém tenha tentado impor antes).</p>
                  <p><strong>Art. 11º</strong> — Os casos omissos neste estatuto serão resolvidos no grito, no par-ou-ímpar ou em 2 minutinhos de murro sem perder a amizade.</p>
                  
                  <p className="aprovacao-text"><em>Aprovado por unanimidade entre os membros presentes (e os que estavam dormindo no sofá também).</em></p>
                </div>

              </div>
              
              <div className="estatuto-footer">
                <button className="estatuto-btn" onClick={() => setModalType('close')}>
                  Fechar Estatuto
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* --- MODAIS CUSTOMIZADOS --- */}
      {modalType && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box">
            
            {modalType === 'open' ? (
              <>
                <p className="modal-text">Você tem certeza que deseja ler? Ninguém lê isso.</p>
                <div className="modal-buttons">
                  <button className="estatuto-btn" onClick={confirmOpenEstatuto}>Ler mesmo assim</button>
                  <button className="estatuto-btn cancel" onClick={() => setModalType(null)}>Deixa pra lá</button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-text">Não acredito que você leu mesmo, prefiro acreditar que só rolou até o final.</p>
                <div className="modal-buttons center-btn">
                  <button className="estatuto-btn" onClick={confirmCloseEstatuto}>Entendido</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
