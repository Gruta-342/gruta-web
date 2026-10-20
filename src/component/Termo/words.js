// Lista de palavras diárias e dicionário de validação para o Termo da Gruta
// Palavras selecionadas de 5 e 6 letras em Português (PT-BR) com toques temáticos da Gruta

export const DAILY_WORDS = [
  // 5 letras
  { word: "GRUTA", hint: "O refúgio sagrado onde tudo acontece" },
  { word: "DADOS", hint: "Peça indispensável para rolar o destino" },
  { word: "BLEFE", hint: "A melhor arma em jogos de intriga" },
  { word: "MESA", hint: "Onde as amizades são testadas" },
  { word: "NOITE", hint: "Momento oficial das resenhas" },
  { word: "MAGIA", hint: "Essência de grandes aventuras de RPG" },
  { word: "BARCO", hint: "Navegação em mares misteriosos" },
  { word: "COSTA", hint: "Litoral e refúgio" },
  { word: "FESTA", hint: "Celebração que nunca tem hora para acabar" },
  { word: "AMIGO", hint: "Quem está ao seu lado até o blefe final" },
  { word: "CARTA", hint: "O que você tem na manga" },
  { word: "CORTE", hint: "A nobreza e os traidores" },
  { word: "REINO", hint: "Território a ser conquistado" },
  { word: "TREVO", hint: "Símbolo dos que contam com a sorte" },
  { word: "COROA", hint: "Para quem triunfar na rodada" },
  { word: "VAPOR", hint: "Névoa e mistério" },
  { word: "GOLPE", hint: "A jogada surpresa da noite" },
  { word: "FAROL", hint: "A luz na escuridão" },
  { word: "LIVRO", hint: "Manual de regras que ninguém lê" },
  { word: "MUNDO", hint: "Cenário de infinitas histórias" },
  { word: "TEMPO", hint: "O que passa voando na Gruta" },
  { word: "PODER", hint: "O que corrompe qualquer aliança" },
  { word: "PEDRA", hint: "Base sólida ou obstáculo" },
  { word: "TREINO", hint: "Preparação antes da partida" },
  { word: "HEROI", hint: "Quem arrisca a vida pelo grupo" },
  { word: "PLANO", hint: "O que sempre dá errado na primeira rodada" },
  { word: "RISCO", hint: "A essência de toda aposta" },
  { word: "CINZA", hint: "O que sobra após o confronto" },
  { word: "NAVIO", hint: "Embarcação em alto mar" },
  { word: "AREIA", hint: "Grãos do tempo que escorrem" },
  { word: "FOGO", hint: "A chama que aquece a lareira" },
  { word: "PORTA", hint: "A passagem para o desconhecido" },
  { word: "SIGNO", hint: "Marca mística de proteção" },
  { word: "TERRA", hint: "Chão firme sob os pés" },
  { word: "SABER", hint: "Conhecimento que vale vitória" },
  { word: "VENTO", hint: "Sussurros na calada da noite" },
  { word: "ASTRO", hint: "Guia celestial dos viajantes" },
  { word: "FORCA", hint: "Determinação e poder bruto" },
  { word: "HONRA", hint: "O que alguns esquecem no jogo" },
  { word: "SONHO", hint: "Mundos criados pela imaginação" },

  // 6 letras
  { word: "CARTAS", hint: "Nas mãos dos melhores estrategistas" },
  { word: "MESTRE", hint: "Aquele que controla o destino do RPG" },
  { word: "AMIGOS", hint: "A razão de nos reunirmos toda semana" },
  { word: "ESCAPE", hint: "A única saída quando tudo desmorona" },
  { word: "DADOS", hint: "Rolares que decidem vidas" },
  { word: "CASTELO", hint: "Fortaleza impenetrável" },
  { word: "SOMBRA", hint: "Onde os conspiradores se escondem" },
  { word: "BLEFES", hint: "A arte de enganar sorrindo" },
  { word: "DUELOS", hint: "Quando a conversa não resolve mais" },
  { word: "ESCUDO", hint: "Defesa contra a traição" },
  { word: "CACADA", hint: "A busca pelos segredos da mesa" },
  { word: "TAVERNA", hint: "O ponto de encontro dos aventureiros" },
  { word: "DRAGAO", hint: "O chefe final da campanha" },
  { word: "PORTAL", hint: "A entrada para outros reinos" },
  { word: "FALCAO", hint: "Olhos atentos a cada movimento" },
  { word: "HISTOR", hint: "Contos que ficam para sempre" },
  { word: "PERIGO", hint: "A emoção de cada turno" },
  { word: "VITORI", hint: "A doce glória do vencedor" },
  { word: "CORAGEM", hint: "O que não falta aos membros da Gruta" },
  { word: "DESTINO", hint: "Escrito pelas decisões da mesa" },
  { word: "TESOURO", hint: "A recompensa no fim da masmorra" },
  { word: "MAGICO", hint: "Truques e surpresas inesperadas" },
  { word: "LEGADO", hint: "O que construímos juntos" },
  { word: "SEGREDO", hint: "O que ninguém pode revelar" },
  { word: "GUERRA", hint: "Quando a amizade dá uma pausa" },
  { word: "CORONA", hint: "O símbolo do ápice real" },
  { word: "CHAMAS", hint: "O calor de noites inesquecíveis" },
  { word: "CRITIC", hint: "O lendário 20 natural no dado" },
  { word: "AVANTE", hint: "O comando para seguir adiante" }
].filter(item => item.word.length === 5 || item.word.length === 6);

// Lista estendida de palavras válidas de 5 e 6 letras aceitas para tentativas
export const VALID_GUESSES = new Set([
  ...DAILY_WORDS.map(d => d.word),
  // Palavras comuns de 5 letras
  "AMIGO", "AMPLA", "ANDAR", "ANIMA", "ANJOS", "ANTES", "APELO", "APOIO", "AREIA", "AROMA",
  "ARTES", "ASILO", "ASTRO", "ATRAS", "AUTOR", "AVIAO", "AVISO", "BAIXO", "BALAO", "BANCO",
  "BARCO", "BARRA", "BATOM", "BEIJO", "BEBER", "BICHO", "BLOCO", "BOMBA", "BORDA", "BRACO",
  "BRAVO", "BRIGA", "BRISA", "BRUTO", "BUCHA", "CABRA", "CACAU", "CAIXA", "CALOR", "CAMPO",
  "CANAL", "CANTO", "CAPAZ", "CARGA", "CARRO", "CARTA", "CASAL", "CASCA", "CERTO", "CHAPA",
  "CHAVE", "CHEFE", "CHORO", "CHUVA", "CINCO", "CINZA", "CIRCO", "CLARO", "CLUBE", "COBRA",
  "CORDA", "CORPO", "CORTE", "COSTA", "CRAVO", "CREME", "CRIAR", "CRIME", "CRISE", "CUIDA",
  "CURTO", "DADOS", "DANCA", "DEIXA", "DENSO", "DENTE", "DORME", "DUPLA", "DURO", "FALAR",
  "FALHA", "FALTA", "FAROL", "FATOR", "FAVOR", "FAZER", "FEBRE", "FELIZ", "FERRO", "FESTA",
  "FIBRA", "FILHO", "FILME", "FINAL", "FIRME", "FIXAR", "FLORA", "FOCAR", "FOGAO", "FORCA",
  "FORMA", "FORNO", "FORTE", "FOSSO", "FRUIR", "FRUTA", "FUGIR", "FUNDO", "FUROR", "GATO",
  "GELAR", "GENTE", "GESTO", "GLOBO", "GOLPE", "GOSTO", "GRADE", "GRAFO", "GRAMA", "GRATO",
  "GRAVE", "GREVE", "GRITO", "GRUPO", "GRUTA", "GUIA", "HABIL", "HASTE", "HEROI", "HORA",
  "HOTEL", "HUMOR", "IDEIA", "IDOLO", "IGUAL", "IMPAR", "IRMAO", "JESUS", "JOGAR", "JOGOS",
  "JOVEM", "JUIZO", "JUNHO", "JUNTO", "JUSTO", "LABOR", "LACRE", "LAGOA", "LARGA", "LASCA",
  "LAUDO", "LEITE", "LEMBR", "LENTO", "LEQUE", "LIDER", "LIMPO", "LINDA", "LINHA", "LIVRO",
  "LOCAL", "LONGE", "LOUCO", "LUGAR", "LUZES", "MAGIA", "MAIOR", "MANHA", "MANTO", "MARCA",
  "MASSA", "MATAR", "MEDAL", "MEDIR", "MENOR", "MENTE", "MERTO", "MESAS", "METRO", "MINHA",
  "MISTO", "MOLDE", "MONTE", "MORAL", "MORTE", "MOTOR", "MUITO", "MUNDO", "MURAL", "MUSEU",
  "MUDAR", "NACAO", "NARIZ", "NATAL", "NAVIO", "NEGAR", "NOBRE", "NOITE", "NORMA", "NOTAR",
  "NUVEM", "OBTER", "ODIAO", "OLHAR", "ONDAS", "OPCAO", "ORDEM", "ORGAO", "OTICA", "OUTRO",
  "PADRE", "PAGAR", "PAIEL", "PALCO", "PAPEL", "PARAR", "PARDO", "PASSO", "PAUSA", "PEDRA",
  "PEIXE", "PERDA", "PERTO", "PIANO", "PINTO", "PISTA", "PLANO", "PLENA", "PODER", "POEMA",
  "PONTE", "PONTO", "PORTA", "PORTO", "POSSE", "POSTO", "PRAIA", "PRATA", "PRAZO", "PRECO",
  "PRESO", "PRIMA", "PROVA", "PULSO", "PUNHO", "QUASE", "QUEDA", "QUERO", "QUOTA", "RADIO",
  "RAIOS", "RAIVA", "RAMAL", "RAPTO", "RAZAO", "REGRA", "REINO", "RENDA", "RESTO", "RIVAL",
  "ROCHA", "RODAR", "ROSTO", "ROUPA", "RUIDO", "RURAL", "SABER", "SABOR", "SALTO", "SANTO",
  "SAUDE", "SEGUE", "SENHA", "SENSO", "SERIE", "SERRA", "SIGLA", "SINAL", "SOBRE", "SOCIO",
  "SOLAR", "SONHO", "SOPRO", "SORTE", "SUAVE", "SUSTO", "TABUA", "TARDE", "TEMPO", "TENOR",
  "TERMO", "TERRA", "TEXTO", "TIGRE", "TINTA", "TITIO", "TOCAR", "TORRE", "TOTAL", "TRACO",
  "TRAMA", "TRENO", "TREVO", "TRIGO", "TROCA", "TROFE", "TRONO", "TURBA", "TURMA", "UNIAO",
  "UNICO", "USINA", "VALOR", "VAPOR", "VASTO", "VENTO", "VERBO", "VERDE", "VETOR", "VIDEO",
  "VINHO", "VIRAL", "VISAO", "VITAL", "VIVER", "VOLTA", "VOTOS", "ZEBRA",

  // Palavras de 6 letras
  "ABRIGO", "ABRANG", "ACASO", "ACERVO", "AFETOS", "AGILID", "AGUDAS", "ALERTA", "ALIANC",
  "ALTURA", "ALUNOS", "AMANTE", "AMARGO", "AMEACA", "AMIGAS", "AMIGOS", "ANCORA", "ANDAME",
  "ANGULO", "ANIMAL", "APENAS", "APELOS", "APOIOS", "APRESS", "ARDIDO", "AROMAS", "ARREIO",
  "ARRANJ", "ARTIGO", "ASAS", "ASPECT", "ASTROS", "ATACAR", "ATAQUE", "ATENTO", "ATERRO",
  "ATORES", "ATRITO", "AUDACR", "AUREOS", "AUTORA", "AVANCO", "AVANTE", "AVENID", "AVIAO",
  "BAIRRO", "BALOES", "BANCOS", "BANDAS", "BANHO", "BARCOS", "BARRA", "BATIDA", "BEBIDA",
  "BEIJOS", "BICHOS", "BLOCOS", "BONECO", "BONITA", "BORDAS", "BRACOS", "BRANCO", "BRASIL",
  "BRAVOS", "BREVES", "BRILHO", "BRINCO", "BRISAS", "BRUTOS", "BUCAL", "CABANA", "CABELO",
  "CADEIA", "CADERNO", "CALADO", "CALCULO", "CALOR", "CAMARA", "CAMELO", "CAMISA", "CAMPOS",
  "CANCAO", "CANHÃO", "CANTOS", "CAPELA", "CAPITA", "CARGAS", "CARINHO", "CARROS", "CARTAS",
  "CASAIS", "CASCAS", "CASTELO", "CAVALO", "CENTRO", "CEREJA", "CERTO", "CHANCE", "CHAVES",
  "CHEGOU", "CHEIROS", "CHOROS", "CHUVAS", "CIDADE", "CINEMA", "CINZAS", "CIRCOS", "CIUDAD",
  "CLAROS", "CLASSES", "CLINIC", "COBERT", "COBRAS", "COELHO", "COFRE", "COLEGA", "COLUNA",
  "COMETA", "COMIDA", "COMPRA", "CONTOS", "CORAÇÃ", "CORDAO", "CORPOS", "CORRET", "CORTES",
  "COSTAS", "CRAVOS", "CREMES", "CRIADO", "CRIANC", "CRIMES", "CRISES", "CRISTO", "CRITIC",
  "CUIDAR", "CULTURA", "CURSOS", "CURTOS", "DADOS", "DANÇAS", "DEBATE", "DECISA", "DEDOS",
  "DEFESA", "DEGRAU", "DEIXAR", "DELITO", "DEMAIS", "DENTES", "DENTRO", "DEPOIS", "DESEJO",
  "DESERT", "DESPES", "DESTIN", "DESVIO", "DETALH", "DIANTE", "DIARIO", "DIRETO", "DISCUR",
  "DIVIDA", "DOENTE", "DORMIR", "DOUTOR", "DUELOS", "DUVIDA", "ECOAR", "EDICAO", "EFEITO",
  "EMBLEM", "ENFREN", "ENIGMA", "ENORME", "ENSINO", "ENTRA", "EPIDEM", "EQUIPE", "ERRADO",
  "ESCADA", "ESCALA", "ESCAPE", "ESCOLA", "ESCUDO", "ESCURA", "ESFERA", "ESMERO", "ESPACO",
  "ESPADA", "ESPELH", "ESPERA", "ESPORTE", "ESPUMA", "ESTADO", "ESTILO", "ESTREI", "ESTREL",
  "ESTUDO", "ETAPAS", "EVENTO", "EXAME", "EXEMPL", "EXIGIR", "EXISTE", "EXODOS", "EXOTIC",
  "FABRIC", "FACIL", "FALHAS", "FALTAS", "FAMILIA", "FANTAS", "FARDAS", "FAROFA", "FATIAS",
  "FATORES", "FAVORES", "FEITOS", "FELIZ", "FERIAS", "FERROS", "FESTAS", "FIBRAS", "FIGURA",
  "FILHOS", "FILMES", "FINAIS", "FIRMES", "FISICO", "FLAMBO", "FLECHA", "FLORES", "FOLHAS",
  "FONEMA", "FONTES", "FORCAS", "FORMAS", "FORNOS", "FORTES", "FOSSOS", "FOTOS", "FRACTU",
  "FRATUR", "FRENTE", "FRESCO", "FRIOS", "FRUTAS", "FUMAÇA", "FUNDOS", "FURIA", "FUTURO",
  "GALERA", "GANHAR", "GAROTA", "GAVETA", "GELADO", "GEMEOS", "GENERO", "GENTES", "GESTOS",
  "GIRAR", "GLORIA", "GOLPES", "GORDIN", "GOSTOS", "GRADES", "GRAMAS", "GRANDE", "GRATOS",
  "GRAVES", "GREVES", "GRITOS", "GRUPOS", "GRUTA", "GUARD", "GUERRA", "HABITO", "HARMON",
  "HEROIS", "HIERAR", "HISTOR", "HOMENS", "HORAS", "HORTAS", "HUMANO", "HUMILD", "HUMOR",
  "IDOLOS", "IGUAIS", "ILUSTRE", "IMAGEM", "IMENSO", "IMPACT", "IMPAR", "INICIO", "INSANO",
  "INSTAN", "INTEIR", "IRMAOS", "ISOLAD", "JANELA", "JARDIM", "JOGADA", "JOGADO", "JOGOS",
  "JOVENS", "JUIZES", "JUNTOS", "JUSTOS", "LABIOS", "LADRAO", "LAGOAS", "LANCAR", "LARGOS",
  "LATADA", "LEGIÃO", "LEMBRA", "LENTOS", "LETRAS", "LIBERD", "LIDER", "LIMITE", "LIMPOS",
  "LINDOS", "LINHAS", "LIVRES", "LIVROS", "LOCAIS", "LOUCOS", "LUGARES", "LUMIN", "LUSTRE",
  "MÁFIA", "MÁFIAS", "MAGICO", "MAGROS", "MAIORES", "MALETA", "MANHAS", "MANTOS", "MARCAS",
  "MARES", "MARCHA", "MASSAS", "MESTRE", "METROS", "MINUTO", "MISTOS", "MODELO", "MOLHOS",
  "MOMENT", "MONTES", "MORAIS", "MORTES", "MOTIVO", "MOTORES", "MUITOS", "MUNDOS", "MURAIS",
  "MUSICA", "NAVEGAR", "NAVIO", "NOBRES", "NOITES", "NORMAS", "NUVENS", "OBJETO", "OBRAS",
  "OFICIO", "OLHARES", "OMBRO", "ONDAS", "OPCOES", "OPINIA", "ORDENS", "ORIGEM", "OUTROS",
  "PADRAO", "PADRES", "PAINEIS", "PALAVR", "PALCOS", "PAPEIS", "PARADA", "PASSOS", "PATRIA",
  "PAUSAS", "PEDRAS", "PEIXES", "PERDAS", "PERIGO", "PERFUM", "PERNAS", "PESSOA", "PIANOS",
  "PILOTO", "PINTOR", "PISTAS", "PLANOS", "PLANTAS", "PODERES", "POEMAS", "PONTES", "PONTOS",
  "PORTAS", "PORTOS", "POSSES", "POSTOS", "POUCOS", "PRAIAS", "PRATAS", "PRAZOS", "PRECOS",
  "PREDIO", "PREMIO", "PRESOS", "PRINCE", "PROVAS", "PULSOS", "PUNHOS", "QUARTO", "QUASE",
  "QUEDAS", "RAIZES", "RAZOES", "REBOJO", "RECADO", "REDE", "REGRAS", "REINOS", "RELATO",
  "RENDAS", "REPETI", "RESINA", "RESTOS", "REUNIA", "RIVAIS", "ROCHAS", "RODADA", "RODAS",
  "ROSTOS", "ROUPAS", "RUIDOS", "RURAIS", "SABIDO", "SABORES", "SALTOS", "SANTOS", "SAUDES",
  "SECTOR", "SECULO", "SEGREDO", "SEGRED", "SEGUIR", "SENHAS", "SENSOS", "SERIES", "SERRAS",
  "SINAIS", "SOBRES", "SOCIOS", "SOLARES", "SOMBRA", "SONHOS", "SOPROS", "SORTES", "SUAVES",
  "SUSTOS", "TABUAS", "TALENT", "TARDES", "TAVERNA", "TEMPLO", "TEMPOS", "TENORES", "TERCEI",
  "TERMOS", "TERRAS", "TESOURO", "TEXTOS", "TIGRES", "TINTAS", "TOQUES", "TORRES", "TOTAIS",
  "TRACOS", "TRAMAS", "TRAVEC", "TRENOS", "TREVOS", "TRIGOS", "TROCAS", "TRONOS", "TURMAS",
  "ULTIMO", "UNIAO", "UNICOS", "URBANO", "USINAS", "VALORES", "VAPORES", "VASTOS", "VEICUL",
  "VELHOS", "VENTOS", "VERBOS", "VERDES", "VERDADE", "VIAGEM", "VIDEOS", "VINHOS", "VIRAIS",
  "VISOES", "VITAIS", "VITORI", "VOLTAS", "ZEBRAS"
]);

// Normaliza strings removendo acentos e caracteres especiais para comparação
export function normalizeWord(str) {
  if (!str) return "";
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

// Retorna o dia em Brasília (UTC-3)
export function getBrasiliaDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // UTC - 3h
  return new Date(utc - (3 * 3600000));
}

// Data base da Gruta para cálculo determinístico do dia
const BASE_EPOCH = new Date("2026-01-01T00:00:00-03:00").getTime();

export function getTodayGameIndex() {
  const bDate = getBrasiliaDate();
  // Zera horas em Brasília para ter a contagem exata de dias
  const midnightBrasilia = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate()).getTime();
  const diffDays = Math.floor((midnightBrasilia - BASE_EPOCH) / (24 * 60 * 60 * 1000));
  return Math.abs(diffDays);
}

// Retorna a palavra de hoje com base no dia de Brasília
export function getDailyWord() {
  const dayIndex = getTodayGameIndex();
  const index = dayIndex % DAILY_WORDS.length;
  const entry = DAILY_WORDS[index];
  return {
    word: normalizeWord(entry.word),
    displayWord: entry.word,
    hint: entry.hint,
    length: normalizeWord(entry.word).length,
    dayNumber: dayIndex + 1
  };
}

// Retorna o tempo restante até as 00:00:00 do próximo dia em Brasília
export function getSecondsUntilNextWord() {
  const bDate = getBrasiliaDate();
  const tomorrowMidnight = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate() + 1, 0, 0, 0);
  const diff = tomorrowMidnight.getTime() - bDate.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}
