import mentirasImg from "../assets/mentiras.png";
import escapeImg from "../assets/escape.png";
import mafiaImg from "../assets/mafia.png";
import joaoImg from "../assets/joao.png";
import dbdImg from "../assets/dbd.png";
import deceptionImg from "../assets/deception.png";

export const eventsData = [
  {
    id: 5,
    title: "ESCAPE THE BACKROOMS",
    tags: ["CINEMA", "GAMEPLAY"],
    description: "Após horas de angústia em gameplay foi lançado o filme para que a gente pudesse se angustiar assistindo também.",
    image: escapeImg
  },
  {
    id: 4,
    title: "DEAD BY DAYLIGHT",
    tags: ["BOARDGAME", "SOBREVIVÊNCIA"],
    description: "Todo mundo tinha um plano, mas nada saiu como planejado... como sempre!",
    image: dbdImg
  },
  {
    id: 3,
    title: "DETECTIVE NIGHT",
    tags: ["INVESTIGAÇÃO", "RPG"],
    description: "Nossa equipe de detetives precisou investigar o caso de João Picadinho, mas talvez nós não tivéssemos todas as informações",
    image: joaoImg
  },
  {
    id: 2,
    title: "DECEPTION",
    tags: ["BOARDGAME", "INVESTIGAÇÃO"],
    description: "O assassino monta a cena do crime, o mediador tenta induzir os detetives à solução do caso e Samuel sempre é suspeito",
    image: deceptionImg
  },
  {
    id: 1,
    title: "JOGO DE MENTIRAS",
    tags: ["FESTA TEMÁTICA", "INVESTIGAÇÃO"],
    description: "Uma festa com cassino, um homem morto e uma certeza: o assassino está presente entre nós. Será que nós o descobrimos o verdadeiro culpado?",
    image: mentirasImg
  }
];