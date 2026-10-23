import { cruzadinhaThemes } from "../data/cruzadinhaThemes.js";

export const DIFFICULTY_CONFIG = {
  easy: { name: "Fácil", maxCols: 10, maxRows: 10, maxWords: 8 },
  medium: { name: "Médio", maxCols: 14, maxRows: 14, maxWords: 14 },
  hard: { name: "Difícil", maxCols: 18, maxRows: 18, maxWords: 20 },
};

export const THEME_LABELS = {
  random: { label: "🎲 Aleatório", icon: "🎲" },
  all: { label: "🌪️ Tudo Misturado", icon: "🌪️" },
  animais: { label: "🐶 Animais", icon: "🐶" },
  comidas: { label: "🍕 Comidas & Bebidas", icon: "🍕" },
  tecnologia: { label: "💻 Tecnologia", icon: "💻" },
  escola: { label: "📚 Escola & Estudos", icon: "📚" },
  objetos: { label: "📦 Objetos do Cotidiano", icon: "📦" },
  cinema: { label: "🎬 Filmes & Séries", icon: "🎬" },
  geografia: { label: "🌍 Países & Capitais", icon: "🌍" },
  jogos: { label: "🎮 Games & Jogos", icon: "🎮" },
  musica: { label: "🎵 Música & Instrumentos", icon: "🎵" },
  esportes: { label: "⚽ Esportes & Atletas", icon: "⚽" },
  viagem: { label: "✈️ Viagem & Turismo", icon: "✈️" },
  natureza: { label: "🌿 Natureza & Plantas", icon: "🌿" },
  espaco: { label: "🚀 Astronomia & Espaço", icon: "🚀" },
  corpo: { label: "🫀 Corpo Humano", icon: "🫀" },
  profissoes: { label: "💼 Profissões & Carreiras", icon: "💼" },
  roupas: { label: "👕 Moda & Vestuário", icon: "👕" },
  cores: { label: "🎨 Cores & Tons", icon: "🎨" },
};

/**
 * Normaliza palavras: maiúsculas, sem acentos e espaços.
 */
export function normalizeCrosswordWord(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

/**
 * Gera o tabuleiro de Cruzadinha e posiciona as palavras de forma conexa.
 */
export function generateCrosswordPuzzle(themeKey = "random", difficulty = "easy") {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
  const lado = Math.max(cfg.maxCols, cfg.maxRows) * 2 + 1;

  let pool = [];
  let effectiveTheme = themeKey;

  if (themeKey === "all") {
    Object.values(cruzadinhaThemes).forEach((list) => {
      pool = pool.concat(list);
    });
  } else if (themeKey === "random" || !cruzadinhaThemes[themeKey]) {
    const keys = Object.keys(cruzadinhaThemes);
    effectiveTheme = keys[Math.floor(Math.random() * keys.length)];
    pool = [...(cruzadinhaThemes[effectiveTheme] || [])];
  } else {
    pool = [...(cruzadinhaThemes[themeKey] || [])];
  }

  // Sanitiza e filtra por tamanho
  const maxLen = Math.max(cfg.maxCols, cfg.maxRows);
  pool = pool
    .map((item) => ({
      ...item,
      word: normalizeCrosswordWord(item.word),
    }))
    .filter((item) => item.word.length >= 3 && item.word.length <= maxLen);

  if (!pool.length) {
    // Fallback básico caso o pool esteja vazio
    pool = (cruzadinhaThemes.animais || []).map((item) => ({
      ...item,
      word: normalizeCrosswordWord(item.word),
    }));
  }

  function canPlace(grid, word, r, c, dir) {
    if (r < 0 || c < 0) return false;
    if (dir === "H" && c + word.length > lado) return false;
    if (dir === "V" && r + word.length > lado) return false;

    for (let t = 0; t < word.length; t++) {
      const curR = dir === "V" ? r + t : r;
      const curC = dir === "H" ? c + t : c;
      const cell = grid[curR][curC];

      if (cell.char !== "" && cell.char !== word[t]) return false;
      if (cell.char !== "" && (cell.dirs || [cell.dir]).includes(dir)) return false;

      if (cell.char === "") {
        if (dir === "H") {
          if (curR > 0 && grid[curR - 1][curC].char !== "") return false;
          if (curR < lado - 1 && grid[curR + 1][curC].char !== "") return false;
        } else {
          if (curC > 0 && grid[curR][curC - 1].char !== "") return false;
          if (curC < lado - 1 && grid[curR][curC + 1].char !== "") return false;
        }
      }
    }

    if (dir === "H") {
      if (c > 0 && grid[r][c - 1].char !== "") return false;
      if (c + word.length < lado && grid[r][c + word.length].char !== "") return false;
    } else {
      if (r > 0 && grid[r - 1][c].char !== "") return false;
      if (r + word.length < lado && grid[r + word.length][c].char !== "") return false;
    }

    return true;
  }

  function fitsInBounds(bbox, r, c, dir, len) {
    const endR = dir === "V" ? r + len - 1 : r;
    const endC = dir === "H" ? c + len - 1 : c;
    const minR = bbox ? Math.min(bbox.minR, r) : r;
    const maxR = bbox ? Math.max(bbox.maxR, endR) : endR;
    const minC = bbox ? Math.min(bbox.minC, c) : c;
    const maxC = bbox ? Math.max(bbox.maxC, endC) : endC;
    return maxR - minR + 1 <= cfg.maxRows && maxC - minC + 1 <= cfg.maxCols;
  }

  function placeWord(grid, placedWords, bboxHolder, item, r, c, dir) {
    const word = item.word;
    const wordIdx = placedWords.length;
    for (let i = 0; i < word.length; i++) {
      const curR = dir === "V" ? r + i : r;
      const curC = dir === "H" ? c + i : c;
      const prev = grid[curR][curC];
      grid[curR][curC] = {
        char: word[i],
        dir: dir,
        dirs: [...(prev.dirs || (prev.dir ? [prev.dir] : [])), dir],
        wordIndices: [...(prev.wordIndices || []), wordIdx],
      };
    }
    const endR = dir === "V" ? r + word.length - 1 : r;
    const endC = dir === "H" ? c + word.length - 1 : c;
    const b = bboxHolder.bbox;
    bboxHolder.bbox = b
      ? {
          minR: Math.min(b.minR, r),
          maxR: Math.max(b.maxR, endR),
          minC: Math.min(b.minC, c),
          maxC: Math.max(b.maxC, endC),
        }
      : { minR: r, maxR: endR, minC: c, maxC: endC };

    placedWords.push({
      ...item,
      r,
      c,
      dir,
      number: 0,
      index: wordIdx,
    });
  }

  function tryPlaceIntersecting(grid, placedWords, bboxHolder, item) {
    const word = item.word;
    if (placedWords.some((w) => w.word === word)) return true;

    const b = bboxHolder.bbox;
    if (!b) return false;

    const matches = [];
    for (let r = b.minR; r <= b.maxR; r++) {
      for (let c = b.minC; c <= b.maxC; c++) {
        const ch = grid[r][c].char;
        if (!ch) continue;
        let idx = -1;
        while ((idx = word.indexOf(ch, idx + 1)) !== -1) {
          matches.push({ r, c, charIdx: idx });
        }
      }
    }
    matches.sort(() => Math.random() - 0.5);

    for (const m of matches) {
      const existingDir = grid[m.r][m.c].dir || "H";
      const tryDirs = existingDir === "H" ? ["V", "H"] : ["H", "V"];
      for (const d of tryDirs) {
        const startR = d === "V" ? m.r - m.charIdx : m.r;
        const startC = d === "H" ? m.c - m.charIdx : m.c;
        if (
          fitsInBounds(bboxHolder.bbox, startR, startC, d, word.length) &&
          canPlace(grid, word, startR, startC, d)
        ) {
          placeWord(grid, placedWords, bboxHolder, item, startR, startC, d);
          return true;
        }
      }
    }
    return false;
  }

  let bestGrid = null;
  let bestWords = [];
  let bestScore = -Infinity;

  // Realiza tentativas para obter o melhor arranjo denso
  for (let attempt = 0; attempt < 30; attempt++) {
    const grid = Array(lado)
      .fill(null)
      .map(() =>
        Array(lado)
          .fill(null)
          .map(() => ({ char: "", wordIndices: [] }))
      );
    const placedWords = [];
    const bboxHolder = { bbox: null };

    const candidates = [...pool].sort(() => Math.random() - 0.5).slice(0, cfg.maxWords * 3);
    candidates.sort((a, b) => b.word.length - a.word.length);

    if (!candidates.length) break;
    const first = candidates.shift();
    const firstDir = first.word.length <= cfg.maxCols ? "H" : "V";
    const mid = Math.floor(lado / 2);
    const firstR = firstDir === "V" ? mid - Math.floor(first.word.length / 2) : mid;
    const firstC = firstDir === "H" ? mid - Math.floor(first.word.length / 2) : mid;

    placeWord(grid, placedWords, bboxHolder, first, firstR, firstC, firstDir);

    let remaining = candidates;
    for (let pass = 0; pass < 3 && remaining.length > 0; pass++) {
      const nextRemaining = [];
      for (const item of remaining) {
        if (placedWords.length >= cfg.maxWords) break;
        if (!tryPlaceIntersecting(grid, placedWords, bboxHolder, item)) {
          nextRemaining.push(item);
        }
      }
      remaining = nextRemaining;
    }

    const b = bboxHolder.bbox;
    const area = b ? (b.maxR - b.minR + 1) * (b.maxC - b.minC + 1) : 0;
    const score = placedWords.length * 1000 - area;

    if (score > bestScore) {
      bestScore = score;
      bestGrid = grid;
      bestWords = placedWords;
    }

    if (placedWords.length >= cfg.maxWords) break;
  }

  if (!bestGrid || !bestWords.length) {
    throw new Error("Não foi possível gerar a cruzadinha com as palavras fornecidas.");
  }

  // Calcula bounding box exata
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity;
  for (let r = 0; r < lado; r++) {
    for (let c = 0; c < lado; c++) {
      if (bestGrid[r][c].char !== "") {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  // Numera as palavras ordenadas por posição da célula inicial (linha, depois coluna)
  const coordKey = (r, c) => r + "," + c;
  const uniqueStarts = [...new Set(bestWords.map((w) => coordKey(w.r, w.c)))]
    .map((k) => k.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const numMap = new Map();
  uniqueStarts.forEach(([r, c], idx) => {
    numMap.set(coordKey(r, c), idx + 1);
  });

  const rowsCount = maxR - minR + 1;
  const colsCount = maxC - minC + 1;

  // Ajusta coordenadas das palavras para o grid recortado
  const adjustedWords = bestWords.map((w, idx) => ({
    ...w,
    index: idx,
    number: numMap.get(coordKey(w.r, w.c)),
    r: w.r - minR,
    c: w.c - minC,
  }));

  // Cria o grid recortado final
  const trimmedGrid = Array(rowsCount)
    .fill(null)
    .map((_, rIdx) => {
      const origR = minR + rIdx;
      return Array(colsCount)
        .fill(null)
        .map((_, cIdx) => {
          const origC = minC + cIdx;
          const cell = bestGrid[origR][origC];
          const cellNum = numMap.get(coordKey(origR, origC)) || null;

          // Mapeia os índices das palavras correspondentes aos novos índices
          const activeWordIndices = cell.char !== "" ? cell.wordIndices || [] : [];

          return {
            r: rIdx,
            c: cIdx,
            solution: cell.char || null,
            number: cellNum,
            isBlock: cell.char === "",
            wordIndices: activeWordIndices,
            dirs: cell.dirs || (cell.dir ? [cell.dir] : []),
          };
        });
    });

  return {
    rows: rowsCount,
    cols: colsCount,
    grid: trimmedGrid,
    words: adjustedWords,
    theme: effectiveTheme,
    difficulty,
  };
}
