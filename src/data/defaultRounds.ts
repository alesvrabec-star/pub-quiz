import { QuizRound } from '../types/quiz';

export const DEFAULT_QUIZ_ROUNDS: QuizRound[] = [
  {
    id: 'round-1-cesko',
    roundNumber: 1,
    title: 'České luhy, háje a historie',
    description: 'Od praotce Čecha přes Karla IV. až po české hrady, řeky a kuriozity.',
    category: 'cesko',
    questions: [
      {
        id: 'c-1',
        category: 'cesko',
        categoryLabel: 'České reálie',
        question: 'Ve kterém roce byl položen základní kámen Karlova mostu v Praze podle slavné astrologické posloupnosti 1-3-5-7-9-7-5-3-1?',
        options: ['1348', '1357', '1378', '1410'],
        correctIndex: 1,
        correctAnswer: '1357',
        explanation: 'Karel IV. položil základní kámen 9. července 1357 v 5 hodin a 31 minut ráno (1357 9. 7. 5:31), což tvoří dokonalý číselný palindrom.',
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
        explanation: 'Vltava měří na našem území úctyhodných 430 km. Labe je sice celkově delší, ale v ČR má pouze 370 km.',
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
        explanation: 'Ředitel dačického cukrovaru Jakub Kryštof Rad vynalezl lis na kostky cukru poté, co se jeho manželka Juliana řízla při sekání homole cukru.',
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
        explanation: 'Hrad Houska na Kokořínsku nemá obvodové opevnění proti vnějšímu nepříteli – podle pověstí byla hradní kaple postavena přímo nad puklinou do pekla, aby zlo neproniklo ven.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'c-5',
        category: 'cesko',
        categoryLabel: 'Historie',
        question: 'Jak se jmenoval první volený československý prezident před vznikem Československa, který působil jako profesor na Karlově univerzitě?',
        options: ['Edvard Beneš', 'Tomáš Garrigue Masaryk', 'Milan Rastislav Štefánik', 'Alois Rašín'],
        correctIndex: 1,
        correctAnswer: 'Tomáš Garrigue Masaryk',
        explanation: 'TGM přijal prostřední jméno po své americké manželce Charlotte Garrigue na znamení celoživotní úcty a rovnoprávnosti.',
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
        explanation: 'Hranická propast má dosud naměřenou hloubku zatopené části přes 450 metrů (robotický průzkum dosáhl 450 m bez dosažení dna).',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'c-7',
        category: 'cesko',
        categoryLabel: 'České osobnosti',
        question: 'Který český vědec vynalezl měkké kontaktní čočky a zkonstruoval první výrobní stroj ze stavebnice Merkur?',
        options: ['Jaroslav Heyrovský', 'Otto Wichterle', 'Jan Evangelista Purkyně', 'Prokop Diviš'],
        correctIndex: 1,
        correctAnswer: 'Otto Wichterle',
        explanation: 'První čočkostroj sestavil doma na Štědrý den roku 1961 z dětské stavebnice Merkur a dynama z jízdního kola své dcery.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'c-8',
        category: 'cesko',
        categoryLabel: 'Historické kuriozity',
        question: 'Kolik defenestrací (vyhození konšelů či místodržících z okna) v pražské historii označujeme jako oficiální?',
        options: ['Jednu', 'Dvě', 'Tři', 'Čtyři'],
        correctIndex: 2,
        correctAnswer: 'Tři',
        explanation: 'Oficiálně se uznávají tři: 1419 (Novoměstská radnice), 1483 (Staroměstská radnice) a slavná 1618 (Pražský hrad – Martinic a Slavata).',
        difficulty: 'hospodska_vyzva',
        points: 2
      },
      {
        id: 'c-9',
        category: 'cesko',
        categoryLabel: 'Česká města',
        question: 'Které české krajské město je známé jako „Město automobilů“ a sídlo nejstarší dosud fungující automobilky v ČR?',
        options: ['Kopřivnice', 'Mladá Boleslav', 'Kvasiny', 'Kolín'],
        correctIndex: 1,
        correctAnswer: 'Mladá Boleslav',
        explanation: 'Václav Laurin a Václav Klement zde v roce 1895 založili původně dílnu na jízdní kola Slavia, ze které vyrostla Škoda Auto.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'c-10',
        category: 'cesko',
        categoryLabel: 'Příroda ČR',
        question: 'Jaký je nejvyšší vrchol pohoří Šumava ležící na českém území?',
        options: ['Velký Javor', 'Plechý', 'Boubín', 'Poledník'],
        correctIndex: 1,
        correctAnswer: 'Plechý',
        explanation: 'Plechý měří 1378 m n. m. Velký Javor (1456 m) je sice nejvyšší horou Šumavy, ale leží na bavorské straně hranice.',
        difficulty: 'stredni',
        points: 1
      }
    ]
  },
  {
    id: 'round-2-film',
    roundNumber: 2,
    title: 'Zlatý fond českého filmu & seriálů',
    description: 'Kultovní české komedie, hlášky, Pelíšky, Cimrman a nezapomenutelné scény.',
    category: 'film',
    questions: [
      {
        id: 'f-1',
        category: 'film',
        categoryLabel: 'Filmové hlášky',
        question: 'Ze kterého filmu pochází nesmrtelná hláška: „Proletáři všech zemí, vyližte si prdel!“?',
        options: ['Černí baroni', 'Pelíšky', 'Dědictví aneb Kurvahošigutntag', 'Tankový prapor'],
        correctIndex: 1,
        correctAnswer: 'Pelíšky',
        explanation: 'Tuto hlášku vykřikne Jiří Kodet v roli cholerického odbojáře Krauze z balkónu v pražských Košířích.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-2',
        category: 'film',
        categoryLabel: 'Komedie',
        question: 'Jaké povolání měl ve filmu „Na samotě u lesa“ pan Komárek, kterého ztvárnil Josef Kemr?',
        options: ['Hrobník', 'Cihlář', 'Mlynář', 'Truhlář'],
        correctIndex: 1,
        correctAnswer: 'Cihlář',
        explanation: 'Pan Komárek říká: „Já jsem vyučený cihlář... Cihla, to je poctivá práce!“',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'f-3',
        category: 'film',
        categoryLabel: 'Jára Cimrman',
        question: 'Jak se jmenovala hospoda ve hře Divadla Járy Cimrmana, jejíž majitel si otevřel hospodu, ale chodili mu tam lidi?',
        options: ['Na Mýtince', 'U Sirotků', 'Na Růžku', 'U Zlatého soudku'],
        correctIndex: 0,
        correctAnswer: 'Na Mýtince',
        explanation: 'Hostinský v podání Ladislava Smoljaka si stěžuje: „Chtěl jsem mít klidnou hospůdku, ale začali mi sem chodit lidi!“',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-4',
        category: 'film',
        categoryLabel: 'Seriál Hospoda',
        question: 'Jak se jmenoval štamgast a kotelník z kultovního seriálu Hospoda, kterého hrál Jiří Menzel?',
        options: ['Docent Cachter', 'Prášek', 'Novák', 'Václav Novák'],
        correctIndex: 0,
        correctAnswer: 'Docent Cachter',
        explanation: 'Jiří Menzel hrál vzdělaného psychiatra docenta Cachtera, který trávil volný čas u piva debatováním se zubařem a kotelníkem Babulou.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'f-5',
        category: 'film',
        categoryLabel: 'Filmové hlášky',
        question: 'Co podle pana Hliníka ve filmu „Marečku, podejte mi pero!“ dělal Hliník?',
        options: ['Odstěhoval se do Humpolce', 'Ležel v nemocnici', 'Měl noční směnu', 'Zapomněl omluvenku'],
        correctIndex: 0,
        correctAnswer: 'Odstěhoval se do Humpolce',
        explanation: '„Hliník se odstěhoval do Humpolce!“ Tato replika byla tak slavná, že v Humpolci Hliníkovi skutečně odhalili pamětní desku a muzeum Hliníkárium.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-6',
        category: 'film',
        categoryLabel: 'Oskarové filmy',
        question: 'Který z těchto českých filmů získal prestižní sošku Oscara za nejlepší cizojazyčný film v roce 1996?',
        options: ['Pelíšky', 'Kolja', 'Musíme si pomáhat', 'Vesničko má středisková'],
        correctIndex: 1,
        correctAnswer: 'Kolja',
        explanation: 'Snímek Jana Svěráka podle scénáře Zdeňka Svěráka vyhrál Oscara i Zlatý glóbus v roce 1996.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-7',
        category: 'film',
        categoryLabel: 'Bohuš a Dědictví',
        question: 'Jakou barvu měl slavný kolotoč, který si Bohuš v podání Bolka Polívky koupil v Dědictví?',
        options: ['Červeno-bílý', 'Zlato-modrý', 'Fialový', 'Žluto-zelený'],
        correctIndex: 0,
        correctAnswer: 'Červeno-bílý',
        explanation: 'Bohuš přijel s cirkusem a kolotočem se slovy: „Dívajte sa, to je moje! To sem si kúpil za svý!“',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'f-8',
        category: 'film',
        categoryLabel: 'Pohádky',
        question: 'Jak se jmenoval kůň Popelky v legendární pohádce Tři oříšky pro Popelku s Libuší Šafránkovou?',
        options: ['Jurášek', 'Šemík', 'Grošák', 'Blesk'],
        correctIndex: 0,
        correctAnswer: 'Jurášek',
        explanation: 'Popelčin věrný bělouš se jmenoval Jurášek, pes byl Tajtrlík a sova Rozárka.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-9',
        category: 'film',
        categoryLabel: 'Zdeněk Troška',
        question: 'V jaké jihočeské vsi se odehrává slavná trilogie Slunce, seno...?',
        options: ['Hoštice', 'Babovřesky', 'Kameňák', 'Putim'],
        correctIndex: 0,
        correctAnswer: 'Hoštice',
        explanation: 'Vesnice Hoštice u Volyně je rodnou obcí režiséra Zdeňka Trošky, který do filmu obsadil i místní usedlíky.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'f-10',
        category: 'film',
        categoryLabel: 'České hlášky',
        question: 'Jakou polévku vařil pan Karfík v podání Petra Nárožného ve filmu „Jáchyme, hoď ho do stroje!“?',
        options: ['Kyselici', 'Dršťkovou', 'Gulášovou', 'Hrachovou'],
        correctIndex: 1,
        correctAnswer: 'Dršťkovou',
        explanation: '„Nenechte se vyvést z míry, to je jenom dršťková polívka!“ uklidňoval docent Chocholoušek personál.',
        difficulty: 'hospodska_vyzva',
        points: 2
      }
    ]
  },
  {
    id: 'round-3-prehled',
    roundNumber: 3,
    title: 'Všeobecný přehled, věda a kuriozity',
    description: 'Příroda, vynálezy, zeměpisné rekordy a otázky, které prověří vaši partu.',
    category: 'prehled',
    questions: [
      {
        id: 'p-1',
        category: 'prehled',
        categoryLabel: 'Světové rekordy',
        question: 'Která země na světě vypije v přepočtu na jednoho obyvatele ročně nejvíce piva?',
        options: ['Německo', 'Irsko', 'Česká republika', 'Belgie'],
        correctIndex: 2,
        correctAnswer: 'Česká republika',
        explanation: 'Češi s přehledem drží světový rekord již více než 30 let v řadě s průměrnou spotřebou kolem 130–140 litrů na hlavu ročně.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'p-2',
        category: 'prehled',
        categoryLabel: 'Věda a chemie',
        question: 'Který chemický prvek má v periodické soustavě značku Au?',
        options: ['Stříbro', 'Zlato', 'Hliník', 'Měď'],
        correctIndex: 1,
        correctAnswer: 'Zlato',
        explanation: 'Značka Au pochází z latinského slova „Aurum“, což znamená zářící úsvit.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'p-3',
        category: 'prehled',
        categoryLabel: 'Vesmír',
        question: 'Která planeta sluneční soustavy má největší počet potvrzených měsíců a je známá svými výraznými prstenci?',
        options: ['Jupiter', 'Saturn', 'Uran', 'Neptun'],
        correctIndex: 1,
        correctAnswer: 'Saturn',
        explanation: 'Saturn má v současnosti potvrzeno přes 140 měsíců a jeho prstence jsou tvořeny miliardami ledových a prachových částic.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'p-4',
        category: 'prehled',
        categoryLabel: 'Lidské tělo',
        question: 'Který sval v lidském těle vyvíjí v poměru ke své váze největší sílu při stisku?',
        options: ['Jazyk', 'Žvýkací sval (Masseter)', 'Čtyřhlavý sval stehenní', 'Srdce'],
        correctIndex: 1,
        correctAnswer: 'Žvýkací sval (Masseter)',
        explanation: 'Žvýkací sval dokáže při skusu vyvinout tlak odpovídající síle až 90 kilogramů na stoličky.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'p-5',
        category: 'prehled',
        categoryLabel: 'Světový zeměpis',
        question: 'Které hlavní město na světě je nejseverněji položené?',
        options: ['Helsinky', 'Oslo', 'Reykjavík', 'Nuuk'],
        correctIndex: 2,
        correctAnswer: 'Reykjavík',
        explanation: 'Islandský Reykjavík leží na 64° severní šířky, což z něj činí nejsevernější hlavní město suverénního státu.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'p-6',
        category: 'prehled',
        categoryLabel: 'Zvířecí říše',
        question: 'Jaké zvíře má modrou krev a celkem 3 srdce?',
        options: ['Chobotnice', 'Žralok bílý', 'Krokodýl nilský', 'Medúza talířovka'],
        correctIndex: 0,
        correctAnswer: 'Chobotnice',
        explanation: 'Krev chobotnic obsahuje hemocyanin s obsahem mědi namísto železa, proto je modrá. Dvě srdce pumpují krev do žaber a jedno do zbytku těla.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'p-7',
        category: 'prehled',
        categoryLabel: 'Nobelovy ceny',
        question: 'Který slavný český básník obdržel v roce 1984 Nobelovu cenu za literaturu?',
        options: ['Bohumil Hrabal', 'Jaroslav Seifert', 'Milan Kundera', 'Vítězslav Nezval'],
        correctIndex: 1,
        correctAnswer: 'Jaroslav Seifert',
        explanation: 'Jaroslav Seifert je dosud jediným českým nositelem Nobelovy ceny za literaturu.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'p-8',
        category: 'prehled',
        categoryLabel: 'Jazykové zajímavosti',
        question: 'Z jakého jazyka pochází mezinárodní slovo „Robot“, které poprvé použil Karel Čapek ve hře R.U.R.?',
        options: ['Z latiny', 'Z češtiny (od slova robota)', 'Z němčiny', 'Z řečtiny'],
        correctIndex: 1,
        correctAnswer: 'Z češtiny (od slova robota)',
        explanation: 'Slovo Robot vymyslel malíř a spisovatel Josef Čapek, když mu jeho bratr Karel řekl, že potřebuje název pro umělé dělníky.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'p-9',
        category: 'prehled',
        categoryLabel: 'Kulinářské kuriozity',
        question: 'Jaké je nejdražší koření na světě, které se sklízí ručně z pestíků květů fialového krokusu?',
        options: ['Vanilka pravá', 'Kardamom', 'Šafrán', 'Lanýžový prach'],
        correctIndex: 2,
        correctAnswer: 'Šafrán',
        explanation: 'Na 1 kilogram šafránu je potřeba ručně posbírat a usušit pestíky z více než 150 000 až 200 000 květů!',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'p-10',
        category: 'prehled',
        categoryLabel: 'Vynálezy',
        question: 'Kdo je považován za vynálezce lodního šroubu, kterému byl patent uznán v roce 1827 v Terstu?',
        options: ['Josef Ressel', 'František Křižík', 'Viktor Kaplan', 'Jan Perner'],
        correctIndex: 0,
        correctAnswer: 'Josef Ressel',
        explanation: 'Josef Ressel byl český lesník a vynálezce narozený v Chrudimi, který zdokonalil lodní pohon a vyzkoušel jej na parníku Civetta.',
        difficulty: 'lehka',
        points: 1
      }
    ]
  },
  {
    id: 'round-4-sport',
    roundNumber: 4,
    title: 'Zlaté české ručičky & Sport',
    description: 'Nagano 1998, zlatí hoši, olympijské triumfy a slavné fotbalové momenty.',
    category: 'sport',
    questions: [
      {
        id: 's-1',
        category: 'sport',
        categoryLabel: 'Turnaj století',
        question: 'Kdo vstřelil jediný a vítězný gól českého týmu ve finále hokejového turnaje v Naganu 1998 proti Rusku (1:0)?',
        options: ['Jaromír Jágr', 'Petr Svoboda', 'Robert Reichel', 'Martin Ručinský'],
        correctIndex: 1,
        correctAnswer: 'Petr Svoboda',
        explanation: 'Obránce Petr Svoboda prostřelil v 49. minutě zápasu ruského brankáře Štallenka dělovkou od modré čáry a zajistil historické zlato.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 's-2',
        category: 'sport',
        categoryLabel: 'Běžecké legendy',
        question: 'Kolik zlatých medailí vyhrál Emil Zátopek na jedněch olympijských hrách v Helsinkách 1952?',
        options: ['Dvě', 'Tři', 'Čtyři', 'Pět'],
        correctIndex: 1,
        correctAnswer: 'Tři',
        explanation: 'Vyhrál 5 000 m, 10 000 m a maraton, který běžel poprvé v životě! Tento trojitý triumf se v historii OH již nikomu nepodařilo zopakovat.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 's-3',
        category: 'sport',
        categoryLabel: 'Fotbalová historie',
        question: 'Jakým legendárním kopem rozhodl Antonín Panenka penaltový rozstřel finále ME 1976 v Bělehradě?',
        options: ['Dělovkou pod břevno', 'Vršovickým dloubákem do středu brány', 'Přízemní střelou k tyči', 'Technickou střelou s faleší'],
        correctIndex: 1,
        correctAnswer: 'Vršovickým dloubákem do středu brány',
        explanation: 'Jeho pomalý oblouček doprostřed brány bezmocně ležícího německého brankáře Seppa Maiera se stal světovým fenoménem známým jako „Panenka kick“.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 's-4',
        category: 'sport',
        categoryLabel: 'Zimní sporty',
        question: 'Na kterých ZOH vyhrála Ester Ledecká zlatou medaili v superobřím slalomu na lyžích i v paralelním obřím slalomu na snowboardu?',
        options: ['Soči 2014', 'Pchjongčchang 2018', 'Peking 2022', 'Vancouver 2010'],
        correctIndex: 1,
        correctAnswer: 'Pchjongčchang 2018',
        explanation: 'Ledecká šokovala svět, když vyhrála Super-G na půjčených lyžích s náskokem jedné setiny sekundy, a poté dominovala i na prkně.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 's-5',
        category: 'sport',
        categoryLabel: 'Světové rekordy',
        question: 'Jaká česká atletka drží nejdéle platný světový rekord v atletice na trati 800 metrů s časem 1:53,28 z roku 1983?',
        options: ['Jarmila Kratochvílová', 'Barbora Špotáková', 'Zuzana Hejnová', 'Ludmila Formanová'],
        correctIndex: 0,
        correctAnswer: 'Jarmila Kratochvílová',
        explanation: 'Jarmila Kratochvílová zaběhla tento neuvěřitelný čas v Mnichově 26. července 1983 a rekord odolává již více než 40 let.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 's-6',
        category: 'sport',
        categoryLabel: 'Čísla dresů',
        question: 'S jakým legendárním číslem na dresu odehrál většinu své kariéry Jaromír Jágr?',
        options: ['66', '68', '88', '99'],
        correctIndex: 1,
        correctAnswer: '68',
        explanation: 'Číslo 68 nosil na počest svého dědečka, který zemřel v komunistickém vězení během Pražského jara 1968.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 's-7',
        category: 'sport',
        categoryLabel: 'Fotbalová reprezentace',
        question: 'Kdo byl hlavním trenérem české fotbalové reprezentace při zisku stříbrných medailí na Euru 1996 v Anglii?',
        options: ['Karel Brückner', 'Dušan Uhrin st.', 'Jozef Chovanec', 'Petr Rada'],
        correctIndex: 1,
        correctAnswer: 'Dušan Uhrin st.',
        explanation: 'Dušan Uhrin starší dovedl mladý tým okolo Nedvěda, Poborského a Šmicera až do finále ve Wembley proti Německu.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 's-8',
        category: 'sport',
        categoryLabel: 'Tenisové legendy',
        question: 'Kolik grandslamových titulů ve dvouhře vyhrála Martina Navrátilová na posvátné trávě ve Wimbledonu?',
        options: ['6', '7', '8', '9'],
        correctIndex: 3,
        correctAnswer: '9',
        explanation: 'Martina Navrátilová je historickou rekordmankou Wimbledonu s 9 singlovými tituly (a celkem 20 wimbledonskými trofejemi celkem).',
        difficulty: 'hospodska_vyzva',
        points: 2
      },
      {
        id: 's-9',
        category: 'sport',
        categoryLabel: 'Oštěp',
        question: 'Jaký je dosud nepřekonaný světový rekord Jana Železného v hodu oštěpem z roku 1996 v Jeně?',
        options: ['94,80 m', '98,48 m', '101,24 m', '96,12 m'],
        correctIndex: 1,
        correctAnswer: '98,48 m',
        explanation: 'Jan Železný hodil 98,48 m 25. května 1996 a jeho rekord je považován za jeden z nejodolnějších v historii moderního sportu.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 's-10',
        category: 'sport',
        categoryLabel: 'Hokejová extraliga',
        question: 'Který moravský hokejový klub získal v 90. letech v éře sponzorství Petry rekordních 5 mistrovských titulů v řadě?',
        options: ['HC Vítkovice', 'HC Vsetín', 'HC Zlín', 'HC Oceláři Třinec'],
        correctIndex: 1,
        correctAnswer: 'HC Vsetín',
        explanation: 'Vsetín pod vedením Romana Čechmánka, Jiřího Dopity a Pavla Patery dominoval českému hokeji v letech 1995 až 1999 (a znovu 2001).',
        difficulty: 'stredni',
        points: 1
      }
    ]
  },
  {
    id: 'round-5-pivo',
    roundNumber: 5,
    title: 'Pivní & hospodský speciál',
    description: 'Pivovary, chmel, stupňovitost, hospodská jídla a pravidla správného štamgasta.',
    category: 'pivo',
    questions: [
      {
        id: 'b-1',
        category: 'pivo',
        categoryLabel: 'Pivní historie',
        question: 'Ve kterém roce uvařil bavorský sládek Josef Groll v Plzni první várku světoznámého světlého ležáku Pilsner Urquell?',
        options: ['1842', '1869', '1895', '1918'],
        correctIndex: 0,
        correctAnswer: '1842',
        explanation: 'První várka byla uvařena 5. října 1842 a 11. listopadu 1842 poprvé narazena v plzeňských hostincích U Bílé růže a U Zlatého orla.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'b-2',
        category: 'pivo',
        categoryLabel: 'Chmelařství',
        question: 'Která odrůda chmele pěstovaná v ČR je považována za celosvětový zlatý standard jemného aromatického chmele?',
        options: ['Žatecký poloraný červeňák (Saaz)', 'Sládek', 'Premiant', 'Kazbek'],
        correctIndex: 0,
        correctAnswer: 'Žatecký poloraný červeňák (Saaz)',
        explanation: 'Žatecký červeňák je mezinárodně chráněné označení původu a tvoří nezaměnitelnou chuť českých plzeňských ležáků po celém světě.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'b-3',
        category: 'pivo',
        categoryLabel: 'Pivní stupňovitost',
        question: 'Co přesně znamená, když se o pivu řekne, že je to „dvanáctka“ (12°)?',
        options: [
          'Obsahuje 12 % alkoholu',
          'Má 12 % hmotnostních extraktu původní mladiny (cukry ze sladu)',
          'Zrálo v ležáckém tanku přesně 12 týdnů',
          'Bylo uvařeno při teplotě 12 stupňů Celsia'
        ],
        correctIndex: 1,
        correctAnswer: 'Má 12 % hmotnostních extraktu původní mladiny (cukry ze sladu)',
        explanation: 'Stupňovitost (podle Ballinga či Plató) udává podíl zkvasitelných látek ze sladu v nezkvašené mladině před zahájením kvašení. Hotová 12° má obvykle cca 4,8–5,2 % alkoholu.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'b-4',
        category: 'pivo',
        categoryLabel: 'Hospodská gastronomie',
        question: 'Jaké uzenině naložené s cibulí, octem a kořením se v českých hospodách tradičně říká „Utopenec“?',
        options: ['Naložený špekáček', 'Ostravská klobása', 'Debrecínka', 'Liberecký párek'],
        correctIndex: 0,
        correctAnswer: 'Naložený špekáček',
        explanation: 'Vynález utopenců je připisován hospodskému a mlynáři Šamánkovi z Berounska, který se podle legendy později sám utopil při opravě mlýnského kola.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'b-5',
        category: 'pivo',
        categoryLabel: 'Čepování piva',
        question: 'Jak se v české hospodské hantýrce nazývá způsob načepování piva, kdy je půllitr naplněn téměř výhradně hustou krémovou pěnou?',
        options: ['Hladinka', 'Šnyt', 'Mlíko', 'Čochtan'],
        correctIndex: 2,
        correctAnswer: 'Mlíko',
        explanation: 'Mlíko se pije ihned po načepování na ex – chutná sladce, krémově a má plnou chuť chmele a sladu bez vysokého nasycení CO2.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'b-6',
        category: 'pivo',
        categoryLabel: 'Hospodská kultura',
        question: 'Co znamená v tradiční české hospodě čepování „na hladinku“?',
        options: [
          'Pivo načepované na jeden zátah pod úhlem 45° s mokrou pěnou v rovině s okrajem skla',
          'Pivo bez pěny pro okamžité uhašení žízně',
          'Pivo ze dvou třetin tvořené pěnou a z jedné pivem',
          'Pivo čepované z výšky pro co největší bubliny'
        ],
        correctIndex: 0,
        correctAnswer: 'Pivo načepované na jeden zátah pod úhlem 45° s mokrou pěnou v rovině s okrajem skla',
        explanation: 'Hladinka je královský způsob čepování – pivo si zachovává maximální svěžest, říz a mikroskopická krémová pěna chrání pivo před oxidací.',
        difficulty: 'stredni',
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
        explanation: 'Pivovar a restaurace U Fleků v Křemencově ulici vaří své slavné Flekovské tmavé 13° nepřetržitě více než 525 let!',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'b-8',
        category: 'pivo',
        categoryLabel: 'Pivní sklo',
        question: 'Jak se odborně a lidově nazývá těžký skleněný půllitr s uchem a typickými prohlubněmi („oky“)?',
        options: ['Krušnohor', 'Třetinka', 'Tuplák', 'Tulec či Šoufek'],
        correctIndex: 2,
        correctAnswer: 'Tuplák (nebo lidově tlustostěnný půllitr / okáč)',
        explanation: 'Typický tlustostěnný půllitr s prohlubněmi pomáhá udržet pivo déle studené, protože ruka nezahřívá tenké sklo.',
        difficulty: 'stredni',
        points: 1
      },
      {
        id: 'b-9',
        category: 'pivo',
        categoryLabel: 'Pivní suroviny',
        question: 'Které čtyři základní suroviny tvoří podle tradičního zákona o čistotě piva (Reinheitsgebot) pravé pivo?',
        options: [
          'Voda, slad, chmel a kvasnice',
          'Voda, ječmen, pšenice a cukr',
          'Voda, med, chmel a kvasinky',
          'Pramenitá voda, chmel, líh a byliny'
        ],
        correctIndex: 0,
        correctAnswer: 'Voda, slad, chmel a kvasnice',
        explanation: 'V původním zákonu z roku 1516 v Bavorsku ještě kvasinky nebyly zmíněny (nevědělo se přesně, jak kvašení probíhá), dnes jsou však tyto 4 suroviny svatým grálem ležáků.',
        difficulty: 'lehka',
        points: 1
      },
      {
        id: 'b-10',
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
      }
    ]
  }
];

export { generateRandomQuizRounds, MASTER_QUESTION_POOL, shuffleQuestionOptions, shuffleArray } from './questionPool';
import { generateRandomQuizRounds } from './questionPool';

/**
 * Vygeneruje čerstvý náhodný hospodský kvíz s náhodným výběrem otázek z databáze
 * a promíchaným pořadím možností (A, B, C, D)
 */
export function getRandomQuizRounds(options?: { roundsCount?: number; questionsPerRound?: number; shuffleOptions?: boolean }): QuizRound[] {
  return generateRandomQuizRounds({
    roundsCount: 5,
    questionsPerRound: 5,
    shuffleOptions: true,
    ...options,
  });
}


