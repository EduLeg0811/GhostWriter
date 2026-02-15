import { useMemo } from "react";

export interface TextStats {
  words: number;
  characters: number;
  paragraphs: number;
  sentences: number;
  readingTime: string;
  sesquipedal: number;
  logiaWords: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-záàâãéèêíïóôõúüç]/g, "");
  if (w.length <= 2) return 1;
  // Portuguese vowel groups (each group = 1 syllable approx)
  const vowels = w.match(/[aáàâãeéèêiíïoóôõuúü]+/g);
  return vowels ? vowels.length : 1;
}

export function useTextStats(text: string, refreshKey = 0): TextStats {
  return useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, characters: 0, paragraphs: 0, sentences: 0, readingTime: "0 min", sesquipedal: 0, logiaWords: 0 };
    }

    const wordList = trimmed.split(/\s+/).filter(Boolean);
    const words = wordList.length;
    const characters = trimmed.length;
    const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean).length;
    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim()).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    const readingTime = `${minutes} min`;

    let sesquipedal = 0;
    let logiaWords = 0;
    for (const w of wordList) {
      if (countSyllables(w) > 10) sesquipedal++;
      if (/logia$/i.test(w.replace(/[^a-záàâãéèêíïóôõúüç]/gi, ""))) logiaWords++;
    }

    return { words, characters, paragraphs, sentences, readingTime, sesquipedal, logiaWords };
  }, [text, refreshKey]);
}
