// Importando as imagens da pasta assets (subindo um nível com ../)
import mentirasImg from "../assets/mentiras.png";
import escapeImg from "../assets/escape.png";
import mafiaImg from "../assets/mafia.png";

export const eventsData = [
  {
    id: 1,
    title: "JOGO DE MENTIRAS",
    tags: ["FESTA TEMÁTICA", "RPG"],
    description: "Aqui colocamos uma breve descrição da campanha. Ao passar o mouse pela foto é mostrado uma segunda foto e um botão para ver mais.",
    image: mentirasImg // Usando a imagem importada
  },
  {
    id: 2,
    title: "ESCAPE THE BACKROOMS",
    tags: ["GAMEPLAY", "NOITE DO TERROR"],
    description: "Aqui colocamos uma breve descrição da campanha. Ao passar o mouse pela foto é mostrado uma segunda foto e um botão para ver mais.",
    image: escapeImg // Usando a imagem importada
  },
  {
    id: 3,
    title: "NOITE DA MÁFIA",
    tags: ["BOARDGAME", "INVESTIGAÇÃO"],
    description: "Aqui colocamos uma breve descrição da campanha. Ao passar o mouse pela foto é mostrado uma segunda foto e um botão para ver mais.",
    image: mafiaImg // Usando a imagem importada
  }
];