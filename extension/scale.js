// Přepis tabulky a otázek z accountability.md. Zdrojem pravdy je dokument; sem se změny jen kopírují.

export const BASE_URL = "https://kutsosp.github.io/skala-ai-odpovednosti/";

export const LEVELS = [
  {
    n: 0, name: "PŘEPOSLÁNO", slug: "0-preposlano",
    responsibility: "Za nic. Neprováděl/a jsem zásadní změny nebo jsem to nečetl/a.",
    when: "Příjemce nemá přístup k LLM nástrojům. V opačném případě si to mohl/a vygenerovat sám/a.",
  },
  {
    n: 1, name: "NÁSTŘEL", slug: "1-nastrel",
    responsibility: "Popsaný směr je relevantní. Každé větě rozumím a umím ji říct vlastními slovy.",
    when: "Prosím o reakci na směr, ještě než se pustím do ladění detailů.",
  },
  {
    n: 2, name: "OVĚŘENO", slug: "2-overeno",
    responsibility: "Znám původ každého čísla a souhlasím s každým tvrzením i závěrem.",
    when: "Prosím o reakci na tvrzení a argumenty, ještě než se pustím do ladění formulací, vzhledu a struktury.",
  },
  {
    n: 3, name: "PODEPSÁNO", slug: "3-podepsano",
    responsibility: "Za vzhled, strukturu i každou formulaci.",
    when: "Pod dokument se podepisuji a považuji ho za hotový.",
  },
];

// Tři otázky na každý postup o úroveň výš. První NE určuje úroveň: Math.floor(index / 3).
export const QUESTIONS = [
  "Přečetli jste vše?",
  "Je směr dokumentu relevantní?",
  "Rozumíte každé větě a umíte ji říct vlastními slovy?",

  "Znáte původ každého čísla?",
  "Souhlasíte s každým tvrzením?",
  "Souhlasíte s každým závěrem? Plynou závěry z tvrzení?",

  "Je každá věta formulovaná tak, jak byste ji formulovali sami?",
  "Je struktura dokumentu logická a srozumitelná?",
  "Je vzhled dokumentu reprezentativní?",
];
