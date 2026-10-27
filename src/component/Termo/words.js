// ========================================================
// TERMO DA GRUTA - DICIONÁRIO E REGRAS DE TEMPO
// ========================================================
import { DICIONARIO_COMPLETO } from './dicionario';

// Desligado o modo de teste para o timer funcionar e fixar a palavra do dia
export const TEST_MODE = false;

export function normalizeWord(str) {
  if (!str) return "";
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^A-Z]/g, "");         
}

export const DAILY_WORDS = [
  "GRUTA", "AMIGO", "FESTA", "PORTA", "TEMPO", "MUNDO", "LIVRO", "NOITE", "MAGIA", "BARCO",
  "COSTA", "CARTA", "CORTE", "REINO", "TREVO", "COROA", "VAPOR", "GOLPE", "FAROL", "PODER",
  "PEDRA",  "HEROI", "PLANO", "RISCO", "CINZA", "NAVIO", "AREIA", "SABER", "VENTO", "UIVAR",
  "ASTRO", "FORCA", "HONRA", "SONHO", "TERRA", "FOGO", "SIGNO", "DADOS", "BLEFE", "MESA",
  "JUSTO", "LUGAR", "VALOR", "CRIAR", "IDEIA", "SORTE", "FORTE", "FELIZ", "CLARO", "NOBRE",
  "VERDE", "PRECO", "PRAZO", "CHAVE", "LINHA", "FUNDO", "BOMBA", "TEXTO", "MOTOR", "FRASE",
  "REGRA", "PASSO", "PAPEL", "MARCA", "LOCAL", "FORMA", "GRUPO", "TURMA", "PLACA", "CARRO",
  "AVIAO", "PRAIA", "CALOR", "MANHA", "TARDE", "FALAR", "FAZER", "JOGAR", "BEBER", "COMER",
  "OUVIR", "PEDIR", "SINAL", "SAUDE", "CORPO", "MENTE", "VISAO", "UNICO", "PROVA", "PONTO",

  "CARTAS", "MESTRE", "AMIGOS", "ESCAPE", "RODADA", "DEFESA", "SOMBRA", "BLEFES", "DUELOS",
  "ESCUDO", "CACADA", "BALCAO", "DRAGAO", "PORTAL", "FALCAO", "CONTOS", "PERIGO", "GLORIA",
  "FUTURO", "MAGICO", "LEGADO", "OCULTO", "GUERRA", "COROAS", "CHAMAS", "JULGAR", "AVANTE",
  "BRANCO", "VIAGEM", "CIDADE", "COMPRA", "CENTRO", "SEMANA", "PESSOA", "PREDIO", "MEDICO",
  "SANGUE", "MUSICA", "CINEMA", "JARDIM", "ABRIGO", "DEBATE", "ESPACO", "ESTADO", "FRENTE",
  "GRANDE", "INICIO", "JOGADA", "MAXIMO", "MINUTO", "NUMERO", "PADRAO", "PAIXAO", "QUARTO",
  "RAPIDO", "SEGUIR", "TRATAR", "ENTRAR", "PENSAR", "ACABAR", "CHEGAR", "PASSAR", "VENCER",
  "PRONTO", "SEMPRE", "DENTRO", "DEPOIS", "CONTRA", "QUANDO", "MOTIVO", "ORIGEM", "SENTIR",
  "CABECA", "BRASIL", "MUNDOS", "PONTOS", "PARTES", "FORMAS", "TEMPOS", "LIVROS", "RAZOES",
  "JOGADO", "JUNTOS", "APENAS", "MUITOS", "OUTROS", "POUCOS", "QUEDAS", "TOTAIS", "RUIVAS",
].filter(w => w.length === 5 || w.length === 6);

const dicionarioLimpo = DICIONARIO_COMPLETO.filter(Boolean);
const RAW_VALID_GUESSES = [
  ...DAILY_WORDS,
  ...dicionarioLimpo
];

export const VALID_GUESSES = new Set(RAW_VALID_GUESSES.map(normalizeWord));

export function getBrasiliaDate() {
  const spTimeString = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spTimeString);
}

export function getTodayGameIndex() {
  if (TEST_MODE) {
    return Math.floor(Math.random() * 1000);
  }
  const bDate = getBrasiliaDate();
  const midnightBrasilia = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate()).getTime();
  // Data inicial fixa para contar o dia #1
  const diffTime = midnightBrasilia - new Date("2025-01-01T00:00:00").getTime();
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  return Math.abs(diffDays);
}

export function getDailyWord() {
  const dayIndex = getTodayGameIndex();
  // Diário usa sempre palavra de 6 letras conforme seu layout original
  const words6 = DAILY_WORDS.filter(w => w.length === 6);
  const wordString = words6[dayIndex % words6.length] || "GRUTAS";
  
  return {
    word: normalizeWord(wordString),
    displayWord: wordString,
    length: 6,
    dayNumber: TEST_MODE ? Math.floor(Math.random() * 9000) + 1000 : dayIndex + 1
  };
}

export function getRandomWords(count, length) {
  // Pega palavras aleatórias do banco completo para os modos infinitos
  const filteredWords = RAW_VALID_GUESSES.filter(w => w.length === length);
  const words = [];
  for (let i = 0; i < count; i++) {
    const randomIdx = Math.floor(Math.random() * filteredWords.length);
    words.push(normalizeWord(filteredWords[randomIdx]));
  }
  return words;
}

export function getSecondsUntilNextWord() {
  if (TEST_MODE) return 0;
  const bDate = getBrasiliaDate();
  const tomorrowMidnight = new Date(bDate);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  tomorrowMidnight.setHours(0, 0, 0, 0);
  const diff = tomorrowMidnight.getTime() - bDate.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}