"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./About.css";

function decodeLZW(minCodeSize, data, pixelCount) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;

  const prefix = new Int32Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4096);

  for (let i = 0; i < clearCode; i++) {
    prefix[i] = -1;
    suffix[i] = i;
  }

  const output = new Uint8Array(pixelCount);
  let outPos = 0;
  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let bytePos = 0;
  let prevCode = -1;

  const readCode = () => {
    while (bitsInBuffer < codeSize) {
      if (bytePos >= data.length) return -1;
      bitBuffer |= data[bytePos++] << bitsInBuffer;
      bitsInBuffer += 8;
    }
    const code = bitBuffer & ((1 << codeSize) - 1);
    bitBuffer >>= codeSize;
    bitsInBuffer -= codeSize;
    return code;
  };

  while (outPos < pixelCount) {
    const code = readCode();
    if (code < 0 || code === eoiCode) break;

    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prevCode = -1;
      continue;
    }

    if (prevCode === -1) {
      output[outPos++] = suffix[code];
      prevCode = code;
      continue;
    }

    const inCode = code;
    let stackTop = 0;
    let cur = code;

    if (cur >= nextCode) {
      let temp = prevCode;
      while (prefix[temp] !== -1) temp = prefix[temp];
      stack[stackTop++] = suffix[temp];
      cur = prevCode;
    }

    while (cur >= clearCode) {
      stack[stackTop++] = suffix[cur];
      cur = prefix[cur];
    }

    const firstChar = suffix[cur];
    stack[stackTop++] = firstChar;

    while (stackTop > 0 && outPos < pixelCount) {
      output[outPos++] = stack[--stackTop];
    }

    if (nextCode < 4096) {
      prefix[nextCode] = prevCode;
      suffix[nextCode] = firstChar;
      nextCode++;
      if (nextCode === 1 << codeSize && codeSize < 12) {
        codeSize++;
      }
    }

    prevCode = inCode;
  }

  return output;
}

function parseGifFramesFallback(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let pos = 6; // Pula "GIF87a" / "GIF89a"

  const readU16 = () => {
    const val = bytes[pos] | (bytes[pos + 1] << 8);
    pos += 2;
    return val;
  };

  const screenWidth = readU16();
  const screenHeight = readU16();
  const packed = bytes[pos++];
  pos += 2; // bgColorIndex + pixelAspectRatio

  let globalColorTable = null;
  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 0x07) + 1));
    globalColorTable = bytes.subarray(pos, pos + gctSize);
    pos += gctSize;
  }

  const compCanvas = document.createElement("canvas");
  compCanvas.width = screenWidth;
  compCanvas.height = screenHeight;
  const compCtx = compCanvas.getContext("2d");

  const frames = [];
  let disposalMethod = 0;
  let hasTransparency = false;
  let transparentIndex = -1;

  const skipSubBlocks = () => {
    while (pos < bytes.length) {
      const blockSize = bytes[pos++];
      if (blockSize === 0) break;
      pos += blockSize;
    }
  };

  while (pos < bytes.length) {
    const blockType = bytes[pos++];
    if (blockType === 0x3b) break; // Trailer

    if (blockType === 0x21) {
      const label = bytes[pos++];
      if (label === 0xf9) {
        const blockSize = bytes[pos++];
        const gcePacked = bytes[pos++];
        pos += 2; // delayTime
        transparentIndex = bytes[pos++];
        disposalMethod = (gcePacked >> 2) & 0x07;
        hasTransparency = (gcePacked & 0x01) !== 0;
        if (blockSize > 4) pos += blockSize - 4;
        pos++; // Terminador 0x00
      } else {
        skipSubBlocks();
      }
    } else if (blockType === 0x2c) {
      const left = readU16();
      const top = readU16();
      const width = readU16();
      const height = readU16();
      const imgPacked = bytes[pos++];

      let colorTable = globalColorTable;
      if (imgPacked & 0x80) {
        const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
        colorTable = bytes.subarray(pos, pos + lctSize);
        pos += lctSize;
      }

      const interlaced = (imgPacked & 0x40) !== 0;
      const minCodeSize = bytes[pos++];

      const chunks = [];
      let totalLen = 0;
      while (pos < bytes.length) {
        const subLen = bytes[pos++];
        if (subLen === 0) break;
        chunks.push(bytes.subarray(pos, pos + subLen));
        totalLen += subLen;
        pos += subLen;
      }

      const compressed = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      const indexedPixels = decodeLZW(minCodeSize, compressed, width * height);

      let prevImageData = null;
      if (disposalMethod === 3) {
        prevImageData = compCtx.getImageData(0, 0, screenWidth, screenHeight);
      }

      const patchCanvas = document.createElement("canvas");
      patchCanvas.width = width;
      patchCanvas.height = height;
      const patchCtx = patchCanvas.getContext("2d");
      const imgData = patchCtx.createImageData(width, height);
      const out = imgData.data;

      const passStarts = [0, 4, 2, 1];
      const passSteps = [8, 8, 4, 2];
      let srcIdx = 0;

      if (interlaced) {
        for (let p = 0; p < 4; p++) {
          for (let y = passStarts[p]; y < height; y += passSteps[p]) {
            for (let x = 0; x < width; x++) {
              const colorIdx = indexedPixels[srcIdx++];
              const dst = (y * width + x) * 4;
              if (hasTransparency && colorIdx === transparentIndex) {
                out[dst + 3] = 0;
              } else if (colorTable) {
                const cOff = colorIdx * 3;
                out[dst] = colorTable[cOff];
                out[dst + 1] = colorTable[cOff + 1];
                out[dst + 2] = colorTable[cOff + 2];
                out[dst + 3] = 255;
              }
            }
          }
        }
      } else {
        for (let i = 0; i < width * height; i++) {
          const colorIdx = indexedPixels[i];
          const dst = i * 4;
          if (hasTransparency && colorIdx === transparentIndex) {
            out[dst + 3] = 0;
          } else if (colorTable) {
            const cOff = colorIdx * 3;
            out[dst] = colorTable[cOff];
            out[dst + 1] = colorTable[cOff + 1];
            out[dst + 2] = colorTable[cOff + 2];
            out[dst + 3] = 255;
          }
        }
      }

      patchCtx.putImageData(imgData, 0, 0);
      compCtx.drawImage(patchCanvas, left, top);

      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = screenWidth;
      frameCanvas.height = screenHeight;
      frameCanvas.getContext("2d").drawImage(compCanvas, 0, 0);
      frames.push(frameCanvas);

      if (disposalMethod === 2) {
        compCtx.clearRect(left, top, width, height);
      } else if (disposalMethod === 3 && prevImageData) {
        compCtx.putImageData(prevImageData, 0, 0);
      }

      disposalMethod = 0;
      hasTransparency = false;
      transparentIndex = -1;
    } else {
      skipSubBlocks();
    }
  }

  return frames;
}

async function decodeGifToCanvases(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  if (typeof window !== "undefined" && "ImageDecoder" in window) {
    try {
      const decoder = new window.ImageDecoder({
        data: buffer.slice(0),
        type: "image/gif"
      });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const frameCount = track?.frameCount || 0;

      if (frameCount > 0) {
        const canvases = [];
        for (let i = 0; i < frameCount; i++) {
          const { image } = await decoder.decode({ frameIndex: i });
          const c = document.createElement("canvas");
          c.width = image.displayWidth || image.codedWidth;
          c.height = image.displayHeight || image.codedHeight;
          c.getContext("2d").drawImage(image, 0, 0);
          image.close();
          canvases.push(c);
        }
        decoder.close();
        return canvases;
      }
    } catch (e) {
      // Fallback para o parser GIF89a em JS puro
    }
  }

  return parseGifFramesFallback(buffer);
}

export default function About() {
  const [activeCard, setActiveCard] = useState(null);
  const [showEstatuto, setShowEstatuto] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [gifReady, setGifReady] = useState(false);

  const introTrackRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(null);

  const drawFrame = useCallback((frameIdx) => {
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || !frames.length) return;

    const safeIdx = Math.max(0, Math.min(frames.length - 1, frameIdx));
    const frame = frames[safeIdx];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // Equivalente a object-fit: cover no canvas
    const scale = Math.max(targetW / frame.width, targetH / frame.height);
    const drawW = frame.width * scale;
    const drawH = frame.height * scale;
    const offsetX = (targetW - drawW) / 2;
    const offsetY = (targetH - drawH) / 2;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(frame, offsetX, offsetY, drawW, drawH);
  }, []);

  // Carrega e decodifica /assets/gruta.gif parado no primeiro frame
  useEffect(() => {
    let cancelled = false;

    decodeGifToCanvases("/assets/gruta.gif")
      .then((frames) => {
        if (cancelled || !frames.length) return;
        framesRef.current = frames;
        currentFrameRef.current = 0;
        setGifReady(true);
        drawFrame(0);
      })
      .catch((err) => {
        console.error("Erro ao decodificar /assets/gruta.gif:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [drawFrame]);

  // Atualiza o frame do GIF conforme o usuário rola para baixo ou para cima
  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        const trackEl = introTrackRef.current;
        if (!trackEl) return;

        const rect = trackEl.getBoundingClientRect();
        const scrollableHeight = Math.max(1, trackEl.offsetHeight - window.innerHeight);

        let progress = 0;
        if (rect.top <= 0) {
          progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));
        }

        setScrollProgress(progress);

        const totalFrames = framesRef.current.length;
        if (totalFrames > 0) {
          const targetFrame = Math.min(
            totalFrames - 1,
            Math.floor(progress * (totalFrames - 1))
          );
          if (targetFrame !== currentFrameRef.current) {
            currentFrameRef.current = targetFrame;
            drawFrame(targetFrame);
          }
        }
      });
    };

    const handleResize = () => {
      drawFrame(currentFrameRef.current);
      handleScroll();
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [drawFrame]);

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

  // Suaviza a saída do texto apenas nos últimos 20% do scroll da introdução
  const textFade =
    scrollProgress <= 0.78
      ? 1
      : Math.max(0, 1 - (scrollProgress - 0.78) / 0.22);

  return (
    <section className="about-section" onClick={() => setActiveCard(null)}>
      
      {/* --- NOVA INTRODUÇÃO COM GIF CONTROLADO PELO SCROLL --- */}
      <div className="about-scroll-intro" ref={introTrackRef}>
        <div className="about-sticky-stage">
          {!gifReady && (
            <img
              src="/assets/gruta.gif"
              alt="Entrada da Gruta"
              className="about-gif-fallback"
            />
          )}
          <canvas
            ref={canvasRef}
            className={`about-gif-canvas ${gifReady ? "ready" : ""}`}
          />

          <div className="about-stage-vignette" />

          <div
            className="about-hero-overlay"
            style={{
              opacity: textFade,
              transform: `translateY(${-scrollProgress * 28}px)`
            }}
          >
            <div className="about-hero-card">
              <h1 className="about-title">
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
          </div>

          <div
            className="about-scroll-cue"
            style={{ opacity: Math.max(0, 1 - scrollProgress * 6) }}
          >
            <span>Role para explorar a Gruta</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        
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
                <p className="character-flavor">{activeCard.flavor}</p>
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