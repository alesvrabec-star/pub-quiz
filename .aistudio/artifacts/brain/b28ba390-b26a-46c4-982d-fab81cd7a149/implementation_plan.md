# Hospodský kvíz (Česká pivní vědomostní hra)

Interaktivní webová aplikace pro pořádání i hraní pravého českého hospodského kvízu. Nabízí velkoplošný prezentační mód pro **Kvízmistra** (moderátora s bodovací tabulkou a časovačem), plnohodnotný **Herní mód pro týmy a jednotlivce u stolu**, bohatou předpřipravenou databázi autentických českých otázek a možnost generovat nová tematická kola na přání.

## Uživatelské volby & Klíčová rozhodnutí

> [!IMPORTANT]
> Na základě vašich odpovědí byl zvolen hybridní model: aplikace podporuje jak roli Kvízmistra řídícího hru na plátně/TV, tak interaktivní hraní pro týmy u stolu, stylizované do vizuálu české pivnice (tmavé dřevo, tabule, jantarové světlo, pivní čárky).

- **Formát a využití**: Duální režim – **Kvízmistr & Promítání** (moderátorský pult + bodovací listina týmů + projektor) a **Týmová hra u stolu** (interaktivní kvíz s časovačem a volitelnými odpověďmi).
- **Tematické okruhy v základu**:
  1. České reálie, historie a zeměpis (česká města, památky, významné milníky)
  2. Český film, seriály a popkultura (kultovní hlášky, herci, hudba)
  3. Všeobecný přehled a věda (příroda, vynálezy, zajímavosti)
  4. Český sport (hokejové a fotbalové legendy, olympiády)
  5. Hospodský & pivní speciál (pivovary, chmel, gastronomie, hospodská tradice)
- **Vizuální styl**: Útulná česká hospoda – tmavý dubový masiv, břidlicová tabule s křídovým písmem, zlatavá pěna a jantarové tóny, počítání bodů formou pivních účtenek s čárkami, autentické Web Audio zvukové efekty (cinknutí půllitrů, hospodský zvonec).

---

## 1. Přehled & Hlavní koncept

- **Co aplikace dělá**: Poskytuje kompletní zázemí pro hospodské kvízy v češtině. Umožňuje moderátorovi plynule odřídit večerní kvíz pro libovolný počet týmů (včetně promítání otázek bez nápověd, spouštění hospodské časomíry a zapisování bodů) a současně nabízí okamžitou interaktivní hru pro partu přátel nebo jednotlivce přímo u stolu s okamžitým vyhodnocením.
- **Cílová skupina**: Hospodští kvízmistři, organizátoři teambuildingů, party přátel v hospodě nebo doma u piva, rodinné večery a milovníci vědomostních soutěží.
- **Klíčová hodnota**: Žádná registrace, 100% v češtině, autentické české otázky bez strojových překladů, pohlcující atmosféra české pivnice a nulové zpoždění.

---

## 2. Uživatelská zkušenost & Vizuální design

### Uživatelské toky (Flows)

1. **Vstupní rozcestník (Pivní lístek)**:
   - Rychlá volba režimu: **„Kvízmistr & Moderátor“** vs. **„Hra u stolu (Týmy & Jednotlivci)“**.
   - Rychlý přehled kol, počet otázek a výběr témat.
   - Tlačítko pro vygenerování nového kola na míru (pomocí Gemini AI).

2. **Režim Kvízmistr (Host & Presentation Mode)**:
   - **Moderátorský ovládací pult**: Kvízmistr vidí otázku, skrytou správnou odpověď, zajímavost/rozšiřující fakt pro okomentování, tlačítko pro spuštění časomíry (30 s / 60 s) s hospodským gongem a tlačítko pro přepnutí na další otázku.
   - **Prezentační okno / pohled pro hráče**: Čistý, velkoformátový pohled vhodný na projektor nebo TV, kde je otázka zobrazena velkým křídovým písmem bez odpovědi, s velkým odpočtem a hospodskou grafikou.
   - **Hospodská bodovací tabule (Účtenka)**: Seznam týmů u stolu s rychlým přidáváním bodů (`+1`, `+2`, bonus za správný tip, možnost žolíků).

3. **Režim Hra u stolu (Interactive Team Game)**:
   - Výběr 1 až 5 kol, zadání názvů soutěžících týmů.
   - Prezentace otázek s možností výběru odpovědi (A/B/C/D) nebo textového zápisu odpovědi.
   - Zvuková odezva (cinknutí půllitru při správné odpovědi, tlumené klepnutí na dřevo při chybě).
   - Mezistav po každém kole (výsledková tabule ve stylu hospodského tácku a účtenky).
   - Finální vyhlášení vítězů s hospodským diplomem a statistikou úspěšnosti.

### Vizuální identita & Téma

- **Barevná paleta (60-30-10)**:
  - `60% Neutrální pozadí`: Hluboké dřevo a tmavá břidlice (`#18120C`, `#24180E`, `#1B221E`).
  - `30% Struktury & Panely`: Karty v odstínu starého dubu a křídové tabule s jemnými dřevěnými lemy (`#2E1E13`, `#1E2621`), pergamenové účtenky (`#F7F3E8`).
  - `10% Akcenty`: Zlatavý ležák a jantarové světlo (`#E59819`, `#F5A623`, `#D97706`), hospodská křídová bílá (`#F3F4F6`), pivní zelená pro správné odpovědi (`#16A34A`).
- **Typografie**:
  - Nadpisy a stylizované texty: Výrazný, rustikální display font evokující hospodské tabule a vývěsní štíty.
  - Tělo a otázky: Vysoce čitelný sans-serif pro rychlé čtení i z dálky s tabular-nums pro časy a body.
- **Zvukové efekty (Web Audio API)**:
  - Čistě syntetizované bez externích závislostí: hospodský zvonec na začátek kola, cinknutí sklenic / půllitrů, tikot hodin a gong při vypršení limitu. Vše s možností okamžitého ztlumení (Mute).

---

## 3. Klíčová produktová rozhodnutí & Kompromisy

- **Předpřipravené české otázky vs. AI generování**:
  - *Rozhodnutí*: Aplikace obsahuje bohatou offline knihovnu více než 80 precizně napsaných a fakticky ověřených českých otázek s vysvětlením a nápovědou pro Kvízmistra. Navíc je integrováno tlačítko pro okamžité vygenerování dalších unikátních kol pomocí Gemini na libovolné zadané téma (např. „Písničky z 90. let“, „Mendel a brněnská historie“, „České vynálezy“).
  - *Proč*: Hra funguje 100% okamžitě a spolehlivě bez latence a zároveň nabízí neomezenou znovuhratelnost.
- **Lokální perzistence (localStorage)**:
  - *Rozhodnutí*: Všechny rozpracované hry, týmy, body i uživatelsky vytvořené otázky se ukládají v prohlížeči. Při náhodném obnovení stránky uprostřed kvízu se nic neztratí.
- **Zvukový doprovod**:
  - *Rozhodnutí*: Využití nativního `AudioContext` prohlížeče pro syntézu zvuků (půllitry, zvon, odpočet), aby nedocházelo k chybám stahování externích MP3 souborů.

---

## 4. Technická architektura & Datová strategie

```
┌─────────────────────────────────────────────────────────────┐
│                       Hospodský Kvíz                        │
│             React 19 + TypeScript + Tailwind CSS            │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Kvízmistr   │       │  Hra u stolu │       │   Knihovna   │
│ (Moderátor & │       │   (Týmový    │       │  & Generátor │
│  Projektor)  │       │  interaktivní│       │   (80+ v ČJ  │
│              │       │    mód)      │       │  + Gemini AI)│
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Sdílený herní stav & Bodovací systém               │
│  - Týmy, kola, otázky, skóre, časomíra, historie kol        │
│  - Web Audio syntetizátor zvuků (půllitry, zvon, gong)       │
│  - LocalStorage perzistence (ochrana před reloadem)         │
└─────────────────────────────────────────────────────────────┘
```

### Datový model

```typescript
export interface QuizQuestion {
  id: string;
  category: 'cesko' | 'kultura' | 'prehled' | 'sport' | 'pivo' | 'vlastni';
  categoryLabel: string;
  question: string;
  options?: string[]; // A, B, C, D (pro herní mód)
  correctAnswer: string;
  explanation: string; // Rozšiřující zajímavost pro Kvízmistra
  difficulty: 'lehka' | 'stredni' | 'hospodska_vyzva';
  points: number;
}

export interface QuizRound {
  id: string;
  title: string;
  description: string;
  iconName: string;
  questions: QuizQuestion[];
}

export interface TeamScore {
  id: string;
  name: string;
  tableNumber?: number;
  totalScore: number;
  roundScores: Record<string, number>;
  jokerUsed?: boolean;
}
```

---

## Plán kroků realizace (Execution Steps)

1. **Příprava aktiv a stylů**: Nastavení hospodské palety v Tailwindu, vytvoření tematických SVG/CSS hospodských prvků (pivní tácek, břidlicová tabule, pivní účtenka).
2. **Knihovna českých otázek**: Sestavení 5 ucelených kol s 80+ kvalitními otázkami z českých luhů a hájů (reálie, filmy, sport, věda a pivo).
3. **Zvukový modul (Web Audio)**: Implementace syntetizéru hospodských zvuků (cinknutí sklenic, zvonec, odpočet, gong).
4. **Režim Kvízmistr**:
   - Ovládací rozhraní moderátora s nápovědami a odpověďmi.
   - Velkoformátový pohled na projektor s velkým odpočtem času.
   - Tabulka týmů a rychlé sčítání bodů.
5. **Režim Hra u stolu**:
   - Interaktivní hra s volbou týmů, okamžitou zpětnou vazbou, nápovědami a mezikolovým vyhodnocením.
   - Závěrečné vyhlášení hospodských šampionů.
6. **AI Generátor nových kol**:
   - Připojení server-side endpointu s Gemini pro bleskové vytvoření nových kol na jakékoliv zadané téma v češtině.
7. **Verifikace a ladění**: Kontrola typů, sestavení (`compile_applet`) a ověření responzivity na mobilu i na velkém monitoru.
