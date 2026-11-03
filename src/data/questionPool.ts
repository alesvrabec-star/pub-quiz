import { QuizQuestion, QuizRound } from '../types/quiz';

// Fisher-Yates náhodné míchání pole
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Zamíchání možností otázky (A, B, C, D) se zachováním správné odpovědi
export function shuffleQuestionOptions(q: QuizQuestion): QuizQuestion {
  const correctText = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    correctAnswer: correctText,
  };
}

// =========================================================================
// VELKÁ DATABÁZE HOSPODSKÝCH OTÁZEK PRO NÁHODNÉ GENEROVÁNÍ NOVÝCH KVÍZŮ
// =========================================================================

export const MASTER_QUESTION_POOL: Record<string, QuizQuestion[]> = {
  cesko: [
    {
      id: 'c-1',
      category: 'cesko',
      categoryLabel: 'České reálie',
      question: 'Ve kterém roce byl položen základní kámen Karlova mostu v Praze podle astrologické posloupnosti 1-3-5-7-9-7-5-3-1?',
      options: ['1348', '1357', '1378', '1410'],
      correctIndex: 1,
      correctAnswer: '1357',
      explanation: 'Karel IV. položil základní kámen 9. července 1357 v 5:31 ráno (1357 9. 7. 5:31), což tvoří dokonalý číselný palindrom.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-2',
      category: 'cesko',
      categoryLabel: 'Zeměpis ČR',
      question: 'Která česká řeka je historicky i oficiálně nejdelší na území České republiky?',
      options: ['Labe', 'Vltava', 'Morava', 'Odra'],
      correctIndex: 1,
      correctAnswer: 'Vltava',
      explanation: 'Vltava měří na našem území úctyhodných 430 km. Labe je celkově delší, ale v ČR má pouze 370 km.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-3',
      category: 'cesko',
      categoryLabel: 'České vynálezy',
      question: 'Ve kterém moravském městě vznikl v roce 1843 první kostkový cukr na světě?',
      options: ['Dačice', 'Olomouc', 'Litovel', 'Kroměříž'],
      correctIndex: 0,
      correctAnswer: 'Dačice',
      explanation: 'Ředitel dačického cukrovaru Jakub Kryštof Rad vynalezl lis na kostky poté, co se jeho žena Juliana řízla při sekání homole cukru.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'c-4',
      category: 'cesko',
      categoryLabel: 'Hrady a zámky',
      question: 'Který český hrad je podle legendy postaven nad bezednou průrvou do samotného pekla?',
      options: ['Kost', 'Křivoklát', 'Houska', 'Bezděz'],
      correctIndex: 2,
      correctAnswer: 'Houska',
      explanation: 'Hrad Houska na Kokořínsku nemá obvodové opevnění proti vnějšímu nepříteli – podle pověstí byla hradní kaple postavena přímo nad puklinou do pekla.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-5',
      category: 'cesko',
      categoryLabel: 'Historie',
      question: 'Jak se jmenoval první volený československý prezident, který působil jako profesor filozofie?',
      options: ['Edvard Beneš', 'Tomáš Garrigue Masaryk', 'Milan Rastislav Štefánik', 'Alois Rašín'],
      correctIndex: 1,
      correctAnswer: 'Tomáš Garrigue Masaryk',
      explanation: 'TGM přijal prostřední jméno po své americké manželce Charlotte Garrigue na znamení celoživotní úcty.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-6',
      category: 'cesko',
      categoryLabel: 'Zeměpisné rekordy',
      question: 'Která je nejhlubší zatopená sladkovodní propast na světě, nacházející se na Moravě?',
      options: ['Macocha', 'Hranická propast', 'Punkva', 'Chýnovská jeskyně'],
      correctIndex: 1,
      correctAnswer: 'Hranická propast',
      explanation: 'Hranická propast má dosud naměřenou hloubku zatopené části přes 450 metrů bez dosažení dna.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'c-7',
      category: 'cesko',
      categoryLabel: 'České osobnosti',
      question: 'Který český vědec vynalezl měkké kontaktní čočky a sestrojil první výrobní stroj z Merkuru?',
      options: ['Jaroslav Heyrovský', 'Otto Wichterle', 'Jan Evangelista Purkyně', 'Prokop Diviš'],
      correctIndex: 1,
      correctAnswer: 'Otto Wichterle',
      explanation: 'První čočkostroj sestavil doma na Štědrý den roku 1961 ze stavebnice Merkur a dynama z jízdního kola své dcery.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-8',
      category: 'cesko',
      categoryLabel: 'Historické kuriozity',
      question: 'Kolik defenestrací v pražské historii označujeme jako oficiální dějinné defenestrace?',
      options: ['Jednu', 'Dvě', 'Tři', 'Čtyři'],
      correctIndex: 1,
      correctAnswer: 'Dvě',
      explanation: 'Oficiální jsou dvě: První (1419, Novoměstská radnice – husitství) a Druhá (1618, Pražský hrad – třicetiletá válka). Událost z roku 1483 bývá někdy zvána druhou pražskou, ale historický kánon drží dvě hlavní.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'c-9',
      category: 'cesko',
      categoryLabel: 'Česká nej',
      question: 'Které české město se pyšní největším historickým čtvercovým náměstím v ČR o rozměrech 133 × 133 metrů?',
      options: ['České Budějovice', 'Jihlava', 'Pardubice', 'Kroměříž'],
      correctIndex: 0,
      correctAnswer: 'České Budějovice',
      explanation: 'Náměstí Přemysla Otakara II. v Českých Budějovicích má rozlohu přesně 1 hektar a uprostřed stojí slavná Samsonova kašna.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'c-10',
      category: 'cesko',
      categoryLabel: 'Symboly a pověsti',
      question: 'Podle Starých pověstí českých měla kněžna Libuše dvě moudré sestry. Jak se jmenovaly?',
      options: ['Kazi a Teta', 'Vlasta a Šárka', 'Radka a Milada', 'Božena a Doubravka'],
      correctIndex: 0,
      correctAnswer: 'Kazi a Teta',
      explanation: 'Kazi byla léčitelka a kouzelnice, Teta učila lid uctívat bůžky a Libuše věštila slávu Prahy.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-11',
      category: 'cesko',
      categoryLabel: 'České hory',
      question: 'Jak se jmenuje druhá nejvyšší hora České republiky po Sněžce?',
      options: ['Praděd', 'Luční hora', 'Králický Sněžník', 'Klínovec'],
      correctIndex: 1,
      correctAnswer: 'Luční hora',
      explanation: 'Luční hora v Krkonoších měří 1555 metrů, čímž těsně poráží moravský Praděd (1491 m).',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'c-12',
      category: 'cesko',
      categoryLabel: 'Česká literatura',
      question: 'Kdo napsal slavný román Osudy dobrého vojáka Švejka za světové války?',
      options: ['Karel Čapek', 'Jaroslav Hašek', 'Bohumil Hrabal', 'Vladislav Vančura'],
      correctIndex: 1,
      correctAnswer: 'Jaroslav Hašek',
      explanation: 'Jaroslav Hašek psal Švejka v hospodách a v Lipnici nad Sázavou, dílo bylo přeloženo do téměř 60 jazyků.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-13',
      category: 'cesko',
      categoryLabel: 'České památky',
      question: 'Ve kterém městě stojí slavná vila Tugendhat zapsaná na seznamu UNESCO?',
      options: ['V Brně', 'V Olomouci', 'V Praze', 'V Plzni'],
      correctIndex: 0,
      correctAnswer: 'V Brně',
      explanation: 'Funkcionalistickou vilu navrhl architekt Ludwig Mies van der Rohe a dokončena byla v roce 1930.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-14',
      category: 'cesko',
      categoryLabel: 'Historie',
      question: 'V jaké bitvě v roce 1620 padly české stavovské naděje a začalo pobělohorské období?',
      options: ['U Lipan', 'Na Bílé hoře', 'U Slavkova', 'U Kolína'],
      correctIndex: 1,
      correctAnswer: 'Na Bílé hoře',
      explanation: 'Bitva na Bílé hoře trvala jen necelé dvě hodiny 8. listopadu 1620, ale změnila osud českých zemí na staletí.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'c-15',
      category: 'cesko',
      categoryLabel: 'České kuriozity',
      question: 'Který český panovník byl známý svou vášní pro alchymii, umění a přenesl sídlo habsburské monarchie do Prahy?',
      options: ['Karel IV.', 'Rudolf II.', 'Ferdinand I.', 'Jiří z Poděbrad'],
      correctIndex: 1,
      correctAnswer: 'Rudolf II.',
      explanation: 'Císař Rudolf II. vytvořil v Praze světové centrum umění a vědy, kde působili i Tycho Brahe a Johannes Kepler.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  film: [
    {
      id: 'f-1',
      category: 'film',
      categoryLabel: 'Hlášky z komedií',
      question: 'Ze kterého filmu pochází hláška: „Hliník se odstěhoval do Humpolce!“?',
      options: ['Marečku, podejte mi pero!', 'Vesničko má středisková', 'Jáchyme, hoď ho do stroje!', 'Slavnosti sněženek'],
      correctIndex: 0,
      correctAnswer: 'Marečku, podejte mi pero!',
      explanation: 'Hlášku pronesl Zdeněk Srstka jako žák Mužík při sčítání docházky večerní průmyslovky.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-2',
      category: 'film',
      categoryLabel: 'Kultovní filmy',
      question: 'Co ve filmu Pelíšky představoval nepovedený plastový dárek od strýce z Ameriky?',
      options: ['Nerozbitné skleničky', 'Lžičky z NDR', 'Svítící plastové těžítko', 'Plastové vidličky na buřty'],
      correctIndex: 1,
      correctAnswer: 'Lžičky z NDR',
      explanation: 'Soudruzi v NDR udělali chybu, protože se lžičky v horké kávě okamžitě zkroutily.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-3',
      category: 'film',
      categoryLabel: 'Filmové hlášky',
      question: 'Kdo hrál věčně opilého a svérázného dědu Komárka ve filmu Na samotě u lesa?',
      options: ['Josef Kemr', 'Rudolf Hrušínský', 'Lubomír Lipský', 'Vlastimil Brodský'],
      correctIndex: 0,
      correctAnswer: 'Josef Kemr',
      explanation: 'Josef Kemr exceloval v roli dědy Komárka se slavnou větou „To neděláte dobře s tou pilkou, pane Lavička...“.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-4',
      category: 'film',
      categoryLabel: 'České pohádky',
      question: 'Který český herec propůjčil nezapomenutelný hlas a tělo princi Radovanovi v Princezně se zlatou hvězdou?',
      options: ['Pavel Trávníček', 'Josef Zíma', 'Vladimír Ráž', 'Jan Tříska'],
      correctIndex: 1,
      correctAnswer: 'Josef Zíma',
      explanation: 'Josef Zíma v roce 1959 zazářil jako princ Radovan a dodnes je označován za krále české dechovky a pohádek.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'f-5',
      category: 'film',
      categoryLabel: 'Komedie',
      question: 'Jaké povolání vykonával doktor Skružný (Rudolf Hrušínský) ve filmu Vesničko má středisková při kochání se krajinou?',
      options: ['Zvěrolékař', 'Obvodní lékař', 'Zubař', 'Lékárník'],
      correctIndex: 1,
      correctAnswer: 'Obvodní lékař',
      explanation: 'Jako obvodní lékař se neustále kochal krásou české krajiny, což většinou skončilo jeho škodovkou v příkopu.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-6',
      category: 'film',
      categoryLabel: 'Oscarové filmy',
      question: 'Který český celovečerní film získal v roce 1996 prestižního amerického Oscara za nejlepší cizojazyčný film?',
      options: ['Ostře sledované vlaky', 'Obecná škola', 'Kolja', 'Musíme si pomáhat'],
      correctIndex: 2,
      correctAnswer: 'Kolja',
      explanation: 'Snímek Jana Svěráka podle scénáře Zdeňka Svěráka dojal akademiky po celém světě příběhem starého mládence a ruského chlapce.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-7',
      category: 'film',
      categoryLabel: 'Hlášky',
      question: 'Ve kterém filmu zazní legendární hospodský spor: „Se šípkovou! – Se zelím!“?',
      options: ['Slavnosti sněženek', 'Postřižiny', 'Vesničko má středisková', 'Báječná léta pod psa'],
      correctIndex: 0,
      correctAnswer: 'Slavnosti sněženek',
      explanation: 'Slavná hádka dvou mysliveckých spolků o uloveného divočáka v Hrabalově Kersku patří k vrcholům české kinematografie.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-8',
      category: 'film',
      categoryLabel: 'Sci-fi komedie',
      question: 'Jaké příjmení měli dva nerozluční cestovatelé v čase ve filmu Zítra vstanu a opařím se čajem?',
      options: ['Kroupa a Kroupa', 'Bureš a Kraus', 'Bureš a Jan', 'Lavička a Lavička'],
      correctIndex: 1,
      correctAnswer: 'Bureš a Kraus (Jan Kraus a Petr Kostka v dvojroli Jana a Karla Bureše)',
      explanation: 'Petr Kostka hrál dvojčata Jana a Karla Burešovy, kteří pilotovali raketu s turisty do minulosti.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'f-9',
      category: 'film',
      categoryLabel: 'Filmové postavy',
      question: 'Jak se jmenovala hospoda ve filmu Čtyři vraždy stačí, drahoušku, kde učitel George Camel čelil gangům?',
      options: ['U Zeleného stromu', 'San Bonanza', 'U Utrženého ucha', 'Penzion Růžová zahrada'],
      correctIndex: 1,
      correctAnswer: 'San Bonanza (fiktivní město a stát Springwater)',
      explanation: 'Kultovní komedie Oldřicha Lipského s kresbami Káji Saudka baví diváky už od roku 1970.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'f-10',
      category: 'film',
      categoryLabel: 'Hlášky z pohádek',
      question: 'Který čert ve slavné pohádce S čerty nejsou žerty neuměl ani správně hodit peříčko do mlýna?',
      options: ['Lucifer', 'Janek', 'Kacafírek', 'Belzebub'],
      correctIndex: 1,
      correctAnswer: 'Janek (Ondřej Vetchý)',
      explanation: '„Je to rebel! Při zatýkání zranil dva mé vojáky – jednoho škrábl a druhému řekl, že je trouba!“',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-11',
      category: 'film',
      categoryLabel: 'České komedie',
      question: 'V komedii Samotáři říká Jiří Macháček legendární větu: „Tady je ale...“ Co?',
      options: ['zima', 'krásně', 'husto', 'klid'],
      correctIndex: 2,
      correctAnswer: 'husto',
      explanation: 'Role zhuleného Jakuba vynesla Jiřímu Macháčkovi Českého lva za nejlepší mužský herecký výkon ve vedlejší roli.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'f-12',
      category: 'film',
      categoryLabel: 'Zahraniční klasika',
      question: 'Který britský agent Jejího Veličenstva pije martini „protřepat, nemíchat“ a má kód 007?',
      options: ['Austin Powers', 'James Bond', 'Johnny English', 'Jason Bourne'],
      correctIndex: 1,
      correctAnswer: 'James Bond',
      explanation: 'Postavu vytvořil spisovatel Ian Fleming v roce 1953, prvním filmovým představitelem byl Sean Connery.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  veda: [
    {
      id: 'v-1',
      category: 'veda',
      categoryLabel: 'Přírodní vědy',
      question: 'Který chemický prvek je nejrozšířenějším prvkem v celém známém vesmíru?',
      options: ['Kyslík', 'Helium', 'Uhlík', 'Vodík'],
      correctIndex: 3,
      correctAnswer: 'Vodík',
      explanation: 'Vodík tvoří přibližně 75 % veškeré baryonové hmoty ve vesmíru a je hlavním palivem hvězd.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-2',
      category: 'veda',
      categoryLabel: 'Sluneční soustava',
      question: 'Která planeta naší sluneční soustavy má nejvyšší naměřenou povrchovou teplotu (přes 460 °C)?',
      options: ['Merkur', 'Venuše', 'Mars', 'Jupiter'],
      correctIndex: 1,
      correctAnswer: 'Venuše',
      explanation: 'I když je Merkur blíže Slunci, Venuše má extrémní skleníkový efekt díky atmosféře z oxidu uhličitého.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'v-3',
      category: 'veda',
      categoryLabel: 'Biologie',
      question: 'Který savec je považován za největšího žijícího tvora, jaký kdy na Zemi žil?',
      options: ['Slon africký', 'Plejtvák obrovský', 'Žralok velrybí', 'Mamut srstnatý'],
      correctIndex: 1,
      correctAnswer: 'Plejtvák obrovský',
      explanation: 'Plejtvák obrovský může dosahovat délky přes 30 metrů a váhy téměř 200 tun, což překonává i největší dinosaury.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-4',
      category: 'veda',
      categoryLabel: 'Lidské tělo',
      question: 'Která je nejdelší a zároveň nejpevnější kost v lidském těle?',
      options: ['Kost holenní', 'Kost pažní', 'Kost stehenní', 'Kost lýtková'],
      correctIndex: 2,
      correctAnswer: 'Kost stehenní',
      explanation: 'Kost stehenní (femur) unese několikanásobek hmotnosti lidského těla a tvoří zhruba čtvrtinu výšky člověka.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-5',
      category: 'veda',
      categoryLabel: 'Fyzika & Objevy',
      question: 'Kdo formuloval gravitační zákon poté, co mu podle slavné legendy spadlo na hlavu jablko?',
      options: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Nikola Tesla'],
      correctIndex: 1,
      correctAnswer: 'Isaac Newton',
      explanation: 'Sir Isaac Newton popsal univerzální gravitační zákon ve svém stěžejním díle Philosophiae Naturalis Principia Mathematica roku 1687.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-6',
      category: 'veda',
      categoryLabel: 'Geografie',
      question: 'Který oceán na naší planetě je největší a pokrývá více než 30 % povrchu Země?',
      options: ['Atlantský oceán', 'Indický oceán', 'Tichý oceán', 'Severní ledový oceán'],
      correctIndex: 2,
      correctAnswer: 'Tichý oceán (Pacifik)',
      explanation: 'Pacifik má rozlohu přes 165 milionů km² a jeho plocha je větší než veškerá souš na Zemi dohromady.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-7',
      category: 'veda',
      categoryLabel: 'Světové rekordy',
      question: 'Jak se jmenuje nejvyšší činná sopka Evropy nacházející se na italském ostrově Sicílie?',
      options: ['Vesuv', 'Stromboli', 'Etna', 'Santorini'],
      correctIndex: 2,
      correctAnswer: 'Etna',
      explanation: 'Etna se tyčí do výšky přes 3350 metrů a její sopečná činnost je doložena nepřetržitě už od starověku.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-8',
      category: 'veda',
      categoryLabel: 'Přírodní zajímavosti',
      question: 'Který pták je známý tím, že dokáže jako jediný létat pozpátku a má křídla mávající až 80× za sekundu?',
      options: ['Kolibřík', 'Vlaštovka', 'Ledňáček', 'Rorýs'],
      correctIndex: 0,
      correctAnswer: 'Kolibřík',
      explanation: 'Díky unikátní anatomii ramenních kloubů může kolibřík rotovat křídly v obrazci osmičky a stát bez hnutí ve vzduchu.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-9',
      category: 'veda',
      categoryLabel: 'Chemie',
      question: 'Jakou chemickou značku má zlato v periodické tabulce prvků?',
      options: ['Ag', 'Au', 'Fe', 'Pt'],
      correctIndex: 1,
      correctAnswer: 'Au (z latinského Aurum)',
      explanation: 'Latinské slovo Aurum původně znamenalo „zářící úsvit“. Značka stříbra je Ag (Argentum).',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'v-10',
      category: 'veda',
      categoryLabel: 'Zeměpis světa',
      question: 'Která africká řeka je tradičně považována za nejdelší řeku afrického kontinentu?',
      options: ['Kongo', 'Nil', 'Niger', 'Zambezi'],
      correctIndex: 1,
      correctAnswer: 'Nil',
      explanation: 'Nil měří přibližně 6650 km a protéká 11 africkými státy před ústím do Středozemního moře.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  sport: [
    {
      id: 's-1',
      category: 'sport',
      categoryLabel: 'Zlaté Nagano 1998',
      question: 'Kdo vstřelil jediný a vítězný gól českého hokejového týmu ve finále ZOH v Naganu 1998 proti Rusku?',
      options: ['Jaromír Jágr', 'Petr Svoboda', 'Robert Reichel', 'Martin Ručinský'],
      correctIndex: 1,
      correctAnswer: 'Petr Svoboda',
      explanation: 'Obránce Petr Svoboda v čase 48:08 napřáhl od modré čáry a vstřelil nejslavnější gól v historii českého sportu (1:0).',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-2',
      category: 'sport',
      categoryLabel: 'Atletické legendy',
      question: 'Který český oštěpař drží od roku 1996 nepřekonaný světový rekord v hodu oštěpem výkonem 98,48 m?',
      options: ['Vítězslav Veselý', 'Jan Železný', 'Jakub Vadlejch', 'Petr Frydrych'],
      correctIndex: 1,
      correctAnswer: 'Jan Železný',
      explanation: 'Jan Železný hodil 98,48 m v německé Jeně dne 25. května 1996 a vyhrál 3 olympijská zlata.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-3',
      category: 'sport',
      categoryLabel: 'Fotbalové Euro',
      question: 'Jakým slavným způsobem zakončil Antonín Panenka rozhodující penaltu ve finále ME 1976 v Bělehradu?',
      options: ['Tvrdou ranou do šibenice', 'Střelou po zemi k tyči', 'Lehkým obloučkem doprostřed branky („vršovický dloubák“)', 'Přízemní střelou pod padajícím brankářem'],
      correctIndex: 2,
      correctAnswer: 'Lehkým obloučkem doprostřed branky („vršovický dloubák“)',
      explanation: 'Německý brankář Sepp Maier skočil k tyči, zatímco Panenkův jemný padáček doplachtil doprostřed branky. Ve světě se tento kop nazývá Panenka kick.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-4',
      category: 'sport',
      categoryLabel: 'Olympijská historie',
      question: 'Na kterých olympijských hrách vyhrál Emil Zátopek nevídaná 3 zlata (5 km, 10 km i maraton)?',
      options: ['Londýn 1948', 'Helsinky 1952', 'Melbourne 1956', 'Řím 1960'],
      correctIndex: 1,
      correctAnswer: 'Helsinky 1952',
      explanation: 'Maraton běžel Emil Zátopek v Helsinkách úplně poprvé v životě a jeho manželka Dana Zátopková navíc ve stejný den vyhrála zlato v oštěpu!',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 's-5',
      category: 'sport',
      categoryLabel: 'Tenisové legendy',
      question: 'Která česká tenistka vyhrála Wimbledon celkem devětkrát ve dvouhře, což je absolutní světový rekord?',
      options: ['Hana Mandlíková', 'Martina Navrátilová', 'Petra Kvitová', 'Jana Novotná'],
      correctIndex: 1,
      correctAnswer: 'Martina Navrátilová',
      explanation: 'Martina Navrátilová kralovala wimbledonské trávě a celkem ve dvouhře, čtyřhře a mixu posbírala neuvěřitelných 59 grandslamových titulů.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-6',
      category: 'sport',
      categoryLabel: 'Fotbalová liga',
      question: 'Který český fotbalový klub získal v historii samostatné české ligy (od roku 1993) nejvíce mistrovských titulů?',
      options: ['Slavia Praha', 'Sparta Praha', 'Viktoria Plzeň', 'Slovan Liberec'],
      correctIndex: 1,
      correctAnswer: 'Sparta Praha',
      explanation: 'AC Sparta Praha je historicky nejúspěšnějším klubem české nejvyšší fotbalové soutěže.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-7',
      category: 'sport',
      categoryLabel: 'Hokejové rekordy',
      question: 'Jaké číslo dresu nosil celou svou kariéru Jaromír Jágr na památku Pražského jara?',
      options: ['16', '68', '88', '99'],
      correctIndex: 1,
      correctAnswer: '68',
      explanation: 'Číslo 68 nosil na památku roku 1968, kdy do Československa vtrhla vojska Varšavské smlouvy a jeho dědeček skončil ve vězení.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-8',
      category: 'sport',
      categoryLabel: 'Zimní sporty',
      question: 'Která česká sportovkyně šokovala svět na ZOH 2018 v Pchjongčchangu, když vyhrála zlato v lyžování i na snowboardu?',
      options: ['Ester Ledecká', 'Eva Samková (Adamczyková)', 'Martina Sáblíková', 'Šárka Strachová'],
      correctIndex: 0,
      correctAnswer: 'Ester Ledecká',
      explanation: 'Ester Ledecká vyhrála super-G na vypůjčených lyžích Mikaely Shiffrinové o 0,01 sekundy a následně triumfovala v paralelním obřím slalomu na snowboardu.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-9',
      category: 'sport',
      categoryLabel: 'Světový fotbal',
      question: 'Která země vyhrála v historii mistrovství světa ve fotbale nejvíce titulů (celkem 5×)?',
      options: ['Německo', 'Itálie', 'Brazílie', 'Argentina'],
      correctIndex: 2,
      correctAnswer: 'Brazílie',
      explanation: 'Brazílie (Seleção) vyhrála MS v letech 1958, 1962, 1970, 1994 a 2002.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 's-10',
      category: 'sport',
      categoryLabel: 'Olympijské hry',
      question: 'Jak dlouhý je oficiální maratonský běh podle standardu zavedeného na OH 1908 v Londýně?',
      options: ['40,000 km', '42,195 km', '45,000 km', '41,500 km'],
      correctIndex: 1,
      correctAnswer: '42,195 km',
      explanation: 'Vzdálenost byla v Londýně 1908 upravena z hradu Windsor k královské lóži na stadionu White City.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  pivo: [
    {
      id: 'b-1',
      category: 'pivo',
      categoryLabel: 'Historie plzeňského piva',
      question: 'Ve kterém roce uvařil sládek Josef Groll v Plzni první várku světlého spodně kvašeného ležáku na světě?',
      options: ['1838', '1842', '1869', '1895'],
      correctIndex: 1,
      correctAnswer: '1842',
      explanation: 'První várka byla uvařena 5. října 1842 v Měšťanském pivovaru a dala vzniknout celosvětové kategorii Pilsner.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-2',
      category: 'pivo',
      categoryLabel: 'Pivní styly',
      question: 'Co znamená v českém hospodském slangu styl čepování zvaný „Šnyt“?',
      options: ['Pivo načepované bez pěny až po okraj', 'Malé pivo načepované do velkého půllitru s bohatou pěnou', 'Směs světlého a tmavého piva', 'Rychlý panák piva vypitý na stojáka'],
      correctIndex: 1,
      correctAnswer: 'Malé pivo načepované do velkého půllitru s bohatou pěnou',
      explanation: 'Šnyt si dávali hospodští při koštování nebo hosté před odchodem domů. Má 2 prsty piva, 3 prsty pěny a prst vzduchu.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-3',
      category: 'pivo',
      categoryLabel: 'Pivní statistiky',
      question: 'Která země světa se už více než 30 let nepřetržitě drží na 1. místě ve spotřebě piva na jednoho obyvatele?',
      options: ['Německo', 'Česká republika', 'Belgie', 'Irsko'],
      correctIndex: 1,
      correctAnswer: 'Česká republika',
      explanation: 'Češi vypijí průměrně kolem 130 až 140 litrů piva na hlavu ročně, což je světový unikát.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-4',
      category: 'pivo',
      categoryLabel: 'Suroviny',
      question: 'Která česká oblast je po staletí světově proslulá pěstováním nejjemnějšího aromatického poloraného červeňáku?',
      options: ['Žatecko', 'Třeboňsko', 'Haná', 'Chodsko'],
      correctIndex: 0,
      correctAnswer: 'Žatecko',
      explanation: 'Žatecký poloraný červeňák (Saaz hop) je chráněn značkou UNESCO a je považován za celosvětový etalon pivovarského chmele.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-5',
      category: 'pivo',
      categoryLabel: 'Pivní stupňovitost',
      question: 'Co přesně udává číslo stupňovitosti u piva (např. 10°, 11° nebo 12°)?',
      options: ['Procento alkoholu v hotovém pivu', 'Hmotnostní procento extraktu původní mladiny před kvašením', 'Teplotu, při které se má pivo servírovat', 'Dobu ležení piva v týdnech'],
      correctIndex: 1,
      correctAnswer: 'Hmotnostní procento extraktu původní mladiny před kvašením',
      explanation: 'Označuje podíl cukrů a dalších látek vylouhovaných ze sladu do mladiny. Dvanáctka tedy neznamená 12 % alkoholu!',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'b-6',
      category: 'pivo',
      categoryLabel: 'Čepování piva',
      question: 'Jak se nazývá způsob načepování piva na jeden zátah s krémovou mokrou pěnou v rovině s hranou skla?',
      options: ['Hladinka', 'Mlíko', 'Čochtan', 'Řezané'],
      correctIndex: 0,
      correctAnswer: 'Hladinka',
      explanation: 'Hladinka je královský způsob čepování – pivo si zachovává svěžest, jemný říz a krémová pěna chrání pivo před oxidací.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-7',
      category: 'pivo',
      categoryLabel: 'Pivovarnictví',
      question: 'Který je nejstarší doložený pivovar v Praze, kde se nepřetržitě vaří pivo od roku 1499?',
      options: ['U Fleků', 'Břevnovský klášterní pivovar', 'Strahovský pivovar', 'Novoměstský pivovar'],
      correctIndex: 0,
      correctAnswer: 'U Fleků',
      explanation: 'Pivovar a restaurace U Fleků v Křemencově ulici vaří své slavné Flekovské tmavé nepřetržitě více než 525 let!',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'b-8',
      category: 'pivo',
      categoryLabel: 'Hospodská etiketa',
      question: 'Co v české hospodě tradičně signalizuje pivní tácek položený NA vršek půllitru?',
      options: [
        '„Už další pivo nechci, zaplatím.“',
        '„Mám pivo zkažené, vyměňte mi ho.“',
        '„Jsem jen na toaletě / na cigaretě, neodnášejte mi ho.“',
        '„Mám narozeniny, platím celému stolu.“'
      ],
      correctIndex: 2,
      correctAnswer: '„Jsem jen na toaletě / na cigaretě, neodnášejte mi ho.“',
      explanation: 'Tácek na sklenici je v českých hospodách univerzální znamení pro obsluhu: pivo je stále dopíjené, host se vrátí za okamžik.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'b-9',
      category: 'pivo',
      categoryLabel: 'České hospody',
      question: 'Jak se v hospodském slangu nazývá pivo načepované zcela bez pěny, které má nejvyšší obsah přírodního CO₂?',
      options: ['Čochtan', 'Šnyt', 'Mlíko', 'Hladinka'],
      correctIndex: 0,
      correctAnswer: 'Čochtan',
      explanation: 'Čochtan je pivo bez pěny, plné přírodního oxidu uhličitého. Musí se vypít rychle, protože bez pěny rychle oxiduje.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'b-10',
      category: 'pivo',
      categoryLabel: 'Suroviny',
      question: 'Z čeho se vyrábí tradiční pivovarský slad pro výrobu českého ležáku?',
      options: ['Z naklíčených a usušených zrn ječmene', 'Z kukuřičného šrotu', 'Z chmelových šištic', 'Z pšeničných otrub'],
      correctIndex: 0,
      correctAnswer: 'Z naklíčených a usušených zrn ječmene',
      explanation: 'Sladování přeměňuje škroby v ječném zrnu na zkvasitelné cukry, které kvasinky přeměňují na alkohol a CO₂.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  hudba: [
    {
      id: 'm-1',
      category: 'hudba',
      categoryLabel: 'Český rock & pop',
      question: 'Která česká rocková kapela z Teplic v čele s Pepou Vojtkem vyhrála anketu Český slavík a zpívá hit Pohoda?',
      options: ['Kabát', 'Lucie', 'Olympic', 'Arakain'],
      correctIndex: 0,
      correctAnswer: 'Kabát',
      explanation: 'Skupina Kabát hraje v nezměněné sestavě od roku 1990 a jejich koncerty na Vypichu navštívilo přes 70 tisíc diváků.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'm-2',
      category: 'hudba',
      categoryLabel: 'Legendární hity',
      question: 'Kolikrát v životě vyhrál Karel Gott anketu Zlatý / Český slavík?',
      options: ['22×', '32×', '42×', '52×'],
      correctIndex: 2,
      correctAnswer: '42×',
      explanation: 'Božský Karel Gott získal svého prvního Slavíka v roce 1963 a posledního dvaačtyřicátého v roce 2017.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'm-3',
      category: 'hudba',
      categoryLabel: 'Světový rock',
      question: 'Která britská skupina nahrála legendární album Abbey Road se slavnou fotkou na přechodu pro chodce?',
      options: ['The Rolling Stones', 'The Beatles', 'Queen', 'Pink Floyd'],
      correctIndex: 1,
      correctAnswer: 'The Beatles',
      explanation: 'Abbey Road vyšlo v roce 1969 a fotografie Johna, Ringa, Paula a George na přechodu se stala ikonou popkultury.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'm-4',
      category: 'hudba',
      categoryLabel: 'České kapely',
      question: 'Kdo nazpíval slavné hity Černí andělé, Amerika nebo Medvídek?',
      options: ['Lucie', 'Chinaski', 'Kryštof', 'Wanastowi Vjecy'],
      correctIndex: 0,
      correctAnswer: 'Lucie',
      explanation: 'Kapela Lucie (David Koller, Robert Kodym, P.B.CH. a Michal Dvořák) byla zvolena českou hudební skupinou dvacetiletí.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'm-5',
      category: 'hudba',
      categoryLabel: 'Hudební skladatelé',
      question: 'Který český hudební skladatel složil slavnou Novosvětskou symfonii (Z Nového světa) během pobytu v USA?',
      options: ['Bedřich Smetana', 'Antonín Dvořák', 'Leoš Janáček', 'Bohuslav Martinů'],
      correctIndex: 1,
      correctAnswer: 'Antonín Dvořák',
      explanation: 'Novosvětská symfonie zazněla i na Měsíci – astronaut Neil Armstrong si její nahrávku vzal v roce 1969 na palubu Apolla 11.',
      difficulty: 'lehka',
      points: 1
    }
  ],

  svet: [
    {
      id: 'w-1',
      category: 'svet',
      categoryLabel: 'Světová geografie',
      question: 'Který stát na světě má největší rozlohu území?',
      options: ['Kanada', 'USA', 'Čína', 'Rusko'],
      correctIndex: 3,
      correctAnswer: 'Rusko',
      explanation: 'Rusko zabírá více než 17 milionů km² a rozkládá se přes 11 časových pásem.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'w-2',
      category: 'svet',
      categoryLabel: 'Hlavní města',
      question: 'Které město je oficiálním hlavním městem Austrálie?',
      options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
      correctIndex: 2,
      correctAnswer: 'Canberra',
      explanation: 'Canberra byla vybrána jako kompromisní město v roce 1908 kvůli dlouholeté rivalitě mezi Sydney a Melbourne.',
      difficulty: 'stredni',
      points: 1
    },
    {
      id: 'w-3',
      category: 'svet',
      categoryLabel: 'Divy světa',
      question: 'Ve které jihoamerické zemi se nachází slavné incké město v oblacích Machu Picchu?',
      options: ['V Chile', 'V Peru', 'V Bolívii', 'V Kolumbii'],
      correctIndex: 1,
      correctAnswer: 'V Peru',
      explanation: 'Machu Picchu leží v Andách v nadmořské výšce 2430 metrů a pro západní svět ho znovuobjevil Hiram Bingham roku 1911.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'w-4',
      category: 'svet',
      categoryLabel: 'Zeměpisné kuriozity',
      question: 'Který evropský ostrovní stát je známý jako „země ledu a ohně“ s desítkami gejzírů a sopek?',
      options: ['Irsko', 'Island', 'Grónsko', 'Špicberky'],
      correctIndex: 1,
      correctAnswer: 'Island',
      explanation: 'Island leží přímo na středooceánském hřbetu, kde se od sebe vzdalují euroasijská a severoamerická litosférická deska.',
      difficulty: 'lehka',
      points: 1
    },
    {
      id: 'w-5',
      category: 'svet',
      categoryLabel: 'Světové rekordy',
      question: 'Které jezero na světě je nejhlubší (dosahuje hloubky 1642 m) a obsahuje pětinu veškeré kapalné sladké vody planety?',
      options: ['Kaspické moře', 'Viktoriino jezero', 'Bajkal', 'Hořejší jezero'],
      correctIndex: 2,
      correctAnswer: 'Bajkal',
      explanation: 'Sibiřský Bajkal je nejhlubším i nejstarším jezerem na Zemi (stáří cca 25 milionů let).',
      difficulty: 'lehka',
      points: 1
    }
  ]
};

// =========================================================================
// GENERÁTOR NÁHODNÉHO KVÍZU S NOVÝMI OTÁZKAMI PRO KAŽDOU HRU
// =========================================================================

export interface RandomQuizOptions {
  roundsCount?: number;
  questionsPerRound?: number;
  shuffleOptions?: boolean;
}

/**
 * Vytvoří kompletně nový, náhodně namíchaný hospodský kvíz.
 * Zaručuje, že při každé nové hře dostanou hráči jiný výběr i jiné pořadí otázek a možností.
 */
export function generateRandomQuizRounds(options: RandomQuizOptions = {}): QuizRound[] {
  const {
    roundsCount = 5,
    questionsPerRound = 5,
    shuffleOptions = true,
  } = options;

  const categories = Object.keys(MASTER_QUESTION_POOL);
  const shuffledCategories = shuffleArray(categories);

  const roundMetaMap: Record<string, { title: string; description: string }> = {
    cesko: {
      title: 'České luhy, háje a historie',
      description: 'Zajímavosti od praotce Čecha přes Karla IV. až po české rekordy a památky.',
    },
    film: {
      title: 'Český i světový film & hlášky',
      description: 'Nezapomenutelné komedie, kultovní hlášky, slavní herci a filmové perličky.',
    },
    veda: {
      title: 'Všeobecný rozhled, věda & příroda',
      description: 'Přírodní zákonitosti, vesmírné rekordy, lidské tělo a slavné vynálezy.',
    },
    sport: {
      title: 'Sportovní legendy a rekordy',
      description: 'Zlaté Nagano, olympijští šampioni, fotbalové turnaje a slavné momenty.',
    },
    pivo: {
      title: 'Pivo, hospody a zlatý mok',
      description: 'Tradiční pivovarnictví, hospodská kultura, styly čepování a pivní kuriozity.',
    },
    hudba: {
      title: 'Hudební hity, rock & popkultura',
      description: 'Česká i světová hudební scéna, zlaté slavíky, kapely a slavné melodie.',
    },
    svet: {
      title: 'Světová geografie & divy světa',
      description: 'Zeměpisné zajímavosti, exotické kouty planety, památky a rekordy.',
    },
  };

  const generatedRounds: QuizRound[] = [];
  const selectedCategoryList = shuffledCategories.slice(0, Math.min(roundsCount, shuffledCategories.length));

  selectedCategoryList.forEach((catKey, roundIdx) => {
    const pool = MASTER_QUESTION_POOL[catKey] || [];
    const randomizedQuestions = shuffleArray(pool);
    const chosenQuestions = randomizedQuestions.slice(0, questionsPerRound);

    const processedQuestions: QuizQuestion[] = chosenQuestions.map((origQ, qIdx) => {
      const qInstance: QuizQuestion = {
        ...origQ,
        id: `rnd-q-${roundIdx + 1}-${qIdx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      };
      return shuffleOptions ? shuffleQuestionOptions(qInstance) : qInstance;
    });

    const meta = roundMetaMap[catKey] || {
      title: `Kolo ${roundIdx + 1}: ${catKey}`,
      description: `Soutěžní otázky z kategorie ${catKey}`,
    };

    generatedRounds.push({
      id: `round-${roundIdx + 1}-${catKey}-${Date.now().toString(36)}`,
      roundNumber: roundIdx + 1,
      title: meta.title,
      description: meta.description,
      category: catKey as any,
      questions: processedQuestions,
    });
  });

  return generatedRounds;
}
