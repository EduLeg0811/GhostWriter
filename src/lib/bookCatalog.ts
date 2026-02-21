export type BookCode =
  | "PC"
  | "PROJ"
  | "EXP"
  | "CCG"
  | "TNP"
  | "MP"
  | "MDE"
  | "MRC"
  | "MMT"
  | "TC"
  | "TEAT"
  | "NE"
  | "HSR"
  | "HSP"
  | "DNC"
  | "DAC"
  | "LO"
  | "EC";

export const BOOK_LABELS: Record<BookCode, string> = {
  PC: "Projecoes da Consciencia",
  PROJ: "Projeciologia",
  EXP: "700 Experimentos da Conscienciologia",
  CCG: "Conscienciograma",
  TNP: "Manual da Tenepes",
  MP: "Manual da Proexis",
  MDE: "Manual da Dupla Evolutiva",
  MRC: "Manual de Redacao da Conscienciologia",
  MMT: "Manual dos Megapensenes Trivocabulares",
  TC: "Temas da Conscienciologia",
  TEAT: "200 Teaticas da Conscienciologia",
  NE: "Nossa Evolucao",
  HSR: "Homo sapiens reurbanisatus",
  HSP: "Homo sapiens pacificus",
  DNC: "Dicionario de Neologismos da Conscienciologia",
  DAC: "Dicionario de Argumentos da Conscienciologia",
  LO: "Lexico de Ortopensatas",
  EC: "Enciclopedia da Conscienciologia",
};

export const BOOK_ORDER: BookCode[] = [
  "PC",
  "PROJ",
  "EXP",
  "CCG",
  "TNP",
  "MP",
  "MDE",
  "MRC",
  "MMT",
  "TC",
  "TEAT",
  "NE",
  "HSR",
  "HSP",
  "DNC",
  "DAC",
  "LO",
  "EC",
];
