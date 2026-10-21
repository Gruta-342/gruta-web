// ========================================================
// TERMO DA GRUTA - DICIONÁRIO E REGRAS DE TEMPO
// ========================================================
import { DICIONARIO_COMPLETO } from './dicionario';

// 1. MODO DE TESTE 
// Mude para "false" quando for lançar o jogo. Em "true", toda vez que a página recarregar,
// uma palavra aleatória será sorteada e o bloqueio de 24 horas será desativado para testes.
export const TEST_MODE = true;

// Normaliza strings removendo acentos, espaços e caracteres especiais
export function normalizeWord(str) {
  if (!str) return "";
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^A-Z]/g, "");         
}

// 2. PALAVRAS DIÁRIAS (As respostas do jogo - sem dicas)
// Adicione suas 900 palavras escolhidas dentro deste array
export const DAILY_WORDS = [
  // 5 letras
  "GRUTA", "AMIGO", "FESTA", "PORTA", "TEMPO", "MUNDO", "LIVRO", "NOITE", "MAGIA", "BARCO",
  "COSTA", "CARTA", "CORTE", "REINO", "TREVO", "COROA", "VAPOR", "GOLPE", "FAROL", "PODER",
  "PEDRA",  "HEROI", "PLANO", "RISCO", "CINZA", "NAVIO", "AREIA", "SABER", "VENTO", "UIVAR",
  "ASTRO", "FORCA", "HONRA", "SONHO", "TERRA", "FOGO", "SIGNO", "DADOS", "BLEFE", "MESA",
  "JUSTO", "LUGAR", "VALOR", "CRIAR", "IDEIA", "SORTE", "FORTE", "FELIZ", "CLARO", "NOBRE",
  "VERDE", "PRECO", "PRAZO", "CHAVE", "LINHA", "FUNDO", "BOMBA", "TEXTO", "MOTOR", "FRASE",
  "REGRA", "PASSO", "PAPEL", "MARCA", "LOCAL", "FORMA", "GRUPO", "TURMA", "PLACA", "CARRO",
  "AVIAO", "PRAIA", "CALOR", "MANHA", "TARDE", "FALAR", "FAZER", "JOGAR", "BEBER", "COMER",
  "OUVIR", "PEDIR", "SINAL", "SAUDE", "CORPO", "MENTE", "VISAO", "UNICO", "PROVA", "PONTO",

  // 6 letras
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

// 3. DICIONÁRIO COMPLETO DE TENTATIVAS ACEITAS (Mesclando o arquivo dicionario.js)
const dicionarioLimpo = DICIONARIO_COMPLETO.filter(Boolean);
const RAW_VALID_GUESSES = [
  ...DAILY_WORDS,
  ...dicionarioLimpo
];

// O Set aplica a normalização (maiúsculas e sem acentos) instantaneamente em todas as palavras
export const VALID_GUESSES = new Set(RAW_VALID_GUESSES.map(normalizeWord));

// ========================================================
// CONTROLE DE TEMPO E DATA (À PROVA DE FUSO HORÁRIO)
// ========================================================

// Retorna a data em Brasília
export function getBrasiliaDate() {
  const spTimeString = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spTimeString);
}

// Retorna o índice do dia atual (ou índice aleatório se estiver em TEST_MODE)
export function getTodayGameIndex() {
  if (TEST_MODE) {
    // Sorteia um número aleatório correspondente ao tamanho da lista de respostas
    return Math.floor(Math.random() * DAILY_WORDS.length);
  }

  const bDate = getBrasiliaDate();
  const midnightBrasilia = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate()).getTime();
  const diffTime = midnightBrasilia - new Date("2026-01-01T00:00:00").getTime();
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  
  return Math.abs(diffDays);
}

// Retorna a palavra de hoje com base no dia
export function getDailyWord() {
  const dayIndex = getTodayGameIndex();
  
  if (!DAILY_WORDS || DAILY_WORDS.length === 0) {
    return { word: "GRUTA", displayWord: "GRUTA", length: 5, dayNumber: dayIndex + 1 };
  }

  const index = dayIndex % DAILY_WORDS.length;
  const wordString = DAILY_WORDS[index];
  
  return {
    word: normalizeWord(wordString),
    displayWord: wordString,
    length: normalizeWord(wordString).length,
    // No modo teste, geramos um número de dia irreal aleatório para não travar o localStorage
    dayNumber: TEST_MODE ? Math.floor(Math.random() * 9000) + 1000 : dayIndex + 1
  };
}

// Retorna o tempo restante até as 00:00:00 do próximo dia
export function getSecondsUntilNextWord() {
  if (TEST_MODE) return 0;

  const bDate = getBrasiliaDate();
  const tomorrowMidnight = new Date(bDate);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  tomorrowMidnight.setHours(0, 0, 0, 0);
  
  const diff = tomorrowMidnight.getTime() - bDate.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}