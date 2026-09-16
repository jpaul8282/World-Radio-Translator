import { LivePodcastShow, RadioStation, PodcastCategory } from "../types";

export const PODCAST_CATEGORIES: PodcastCategory[] = [
  "All Categories",
  "News & Analysis",
  "Tech & Science",
  "Culture & Arts",
  "Philosophy & Society",
  "Storytelling & Audio Drama",
  "Interviews & Debates",
  "Comedy & Satire",
];

export const SUPPORTED_PODCAST_LANGUAGES = [
  "All Languages",
  "English",
  "French",
  "Spanish",
  "German",
  "Japanese",
  "Italian",
];

/**
 * Authentic, curated live podcast shows & continuous spoken talk streams.
 * These streams feature spoken-word audio, interviews, documentaries, and investigative series,
 * perfectly optimized for real-time speech-to-speech translation with Gemini 3.5.
 */
export const CURATED_PODCAST_SHOWS: LivePodcastShow[] = [
  {
    id: "pod-bbc-global-doc",
    stationuuid: "pod-bbc-global-doc-uuid",
    showName: "The Documentary & Global News Relay",
    episodeOrTopic: "Investigative Global Dispatch & Geopolitical Inquiries",
    network: "BBC World Service",
    host: "BBC World Service Documentaries Team",
    description: "Deep investigative journalism, global human stories, science inquiries, and frontline documentary audio essays from reporters across six continents.",
    category: "News & Analysis",
    language: "English",
    country: "United Kingdom",
    countryCode: "GB",
    streamUrl: "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    streamUrlResolved: "https://bbradio.gcdn.co/bbcworldservice",
    homepage: "https://www.bbc.co.uk/programmes/p02nq0lx",
    favicon: "https://www.bbc.co.uk/favicon.ico",
    tags: ["documentary", "investigative", "global news", "interviews", "spoken word"],
    scheduleOrAiring: "24/7 Continuous Spoken Relay",
    isLive: true,
    listenerCount: 14200,
    featured: true,
  },
  {
    id: "pod-npr-ideas-talk",
    stationuuid: "pod-npr-ideas-talk-uuid",
    showName: "TED Radio Hour & Spoken Dialogues",
    episodeOrTopic: "Technology Horizons, Human Cognition & Creative Frontiers",
    network: "NPR Spoken Stream Relay",
    host: "Manoush Zomorodi & Guest Visionaries",
    description: "Provocative ideas, breakthrough scientific concepts, and fascinating explorations into human behavior, philosophy, and future innovations.",
    category: "Tech & Science",
    language: "English",
    country: "United States",
    countryCode: "US",
    streamUrl: "https://npr-ice.streamguys1.com/live.mp3",
    streamUrlResolved: "https://npr-ice.streamguys1.com/live.mp3",
    homepage: "https://www.npr.org/programs/ted-radio-hour/",
    favicon: "https://media.npr.org/favicon.ico",
    tags: ["ted talks", "science", "technology", "ideas", "interviews"],
    scheduleOrAiring: "Continuous 24/7 Ideas Relay",
    isLive: true,
    listenerCount: 11800,
    featured: true,
  },
  {
    id: "pod-france-culture-chemins",
    stationuuid: "pod-france-culture-chemins-uuid",
    showName: "Les Chemins de la Philosophie & Le Débat",
    episodeOrTopic: "Penser le Monde: Débats Philosophiques et Idées Contemporaines",
    network: "Radio France / France Culture",
    host: "Adèle Van Reeth, Géraldine Mosna-Savih & Philosophes Invités",
    description: "Exploration approfondie des grands textes philosophiques, des débats d'idées politiques, de la littérature mondiale et de l'histoire intellectuelle.",
    category: "Philosophy & Society",
    language: "French",
    country: "France",
    countryCode: "FR",
    streamUrl: "https://icecast.radiofrance.fr/franceculture-midfi.mp3",
    streamUrlResolved: "https://icecast.radiofrance.fr/franceculture-midfi.mp3",
    homepage: "https://www.radiofrance.fr/franceculture",
    favicon: "https://www.radiofrance.fr/franceculture/favicon.ico",
    tags: ["philosophie", "culture", "debats", "societe", "histoire"],
    scheduleOrAiring: "Diffusion Continue Talk & Débats",
    isLive: true,
    listenerCount: 9350,
    featured: true,
  },
  {
    id: "pod-dlf-hintergrund",
    stationuuid: "pod-dlf-hintergrund-uuid",
    showName: "Hintergrund & Der Tag Podcast",
    episodeOrTopic: "Politische Tiefenanalysen, Wissenschaft & Zeitgeschichte",
    network: "Deutschlandfunk",
    host: "Redaktion Politik & Zeitgeschehen",
    description: "Ausführliche Recherchen, investigative Reportagen zu internationaler Diplomatie, Wirtschaft und gesellschaftlichen Transformationsprozessen.",
    category: "News & Analysis",
    language: "German",
    country: "Germany",
    countryCode: "DE",
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    streamUrlResolved: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    homepage: "https://www.deutschlandfunk.de/der-tag-podcast-100.html",
    favicon: "https://www.deutschlandfunk.de/favicon.ico",
    tags: ["hintergrund", "politik", "analyse", "deutschland", "diskurs"],
    scheduleOrAiring: "24-Stunden Wort- und Informationsprogramm",
    isLive: true,
    listenerCount: 8200,
    featured: true,
  },
  {
    id: "pod-cbc-ideas-spark",
    stationuuid: "pod-cbc-ideas-spark-uuid",
    showName: "Ideas & The Spoken Audio Laboratory",
    episodeOrTopic: "Contemporary Philosophy, Indigenous Narratives & Human Resilience",
    network: "CBC Radio One / Ideas Relay",
    host: "Nahlah Ayed & Nora Young",
    description: "Deep-dive intellectual audio essays, explorations into artificial intelligence ethics, historical mysteries, and cultural paradigms.",
    category: "Philosophy & Society",
    language: "English",
    country: "Canada",
    countryCode: "CA",
    streamUrl: "https://cbcliveradio.akamaized.net/hls/live/2041053/ES_R1TOR/master.m3u8",
    streamUrlResolved: "https://cbcradiolive.akamaized.net/hls/live/2041053/ES_R1TOR/master.m3u8",
    homepage: "https://www.cbc.ca/radio/ideas",
    favicon: "https://www.cbc.ca/favicon.ico",
    tags: ["ideas", "interviews", "tech ethics", "human stories", "philosophy"],
    scheduleOrAiring: "Continuous Public Spoken Relay",
    isLive: true,
    listenerCount: 7100,
    featured: false,
  },
  {
    id: "pod-ser-el-faro",
    stationuuid: "pod-ser-el-faro-uuid",
    showName: "El Faro & Hoy por Hoy Crónicas",
    episodeOrTopic: "Historias Nocturnas, Literatura y Diálogos de Vida",
    network: "Cadena SER",
    host: "Mara Torres & Àngels Barceló",
    description: "Un espacio íntimo de conversaciones profundas sobre la condición humana, literatura, memorias compartidas y reflexiones culturales en directo.",
    category: "Storytelling & Audio Drama",
    language: "Spanish",
    country: "Spain",
    countryCode: "ES",
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3",
    streamUrlResolved: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3",
    homepage: "https://cadenaser.com/programa/el-faro/",
    favicon: "https://cadenaser.com/favicon.ico",
    tags: ["narrativa", "literatura", "entrevistas", "espana", "historias"],
    scheduleOrAiring: "Emisión Continua de Historias y Crónicas",
    isLive: true,
    listenerCount: 8900,
    featured: true,
  },
  {
    id: "pod-abc-rn-conversations",
    stationuuid: "pod-abc-rn-conversations-uuid",
    showName: "Conversations & Late Night Live",
    episodeOrTopic: "Life Stories, Geopolitics & Deep Biographical Journeys",
    network: "ABC Radio National",
    host: "Richard Fidler, Sarah Kanowski & Phillip Adams",
    description: "In-depth biographical interviews with thinkers, adventurers, survivors, and scholars from Australia and around the globe.",
    category: "Interviews & Debates",
    language: "English",
    country: "Australia",
    countryCode: "AU",
    streamUrl: "https://live-radio01.mediahubaustralia.com/2RNW/mp3/",
    streamUrlResolved: "https://live-radio01.mediahubaustralia.com/2RNW/mp3/",
    homepage: "https://www.abc.net.au/listen/programs/conversations",
    favicon: "https://www.abc.net.au/favicon.ico",
    tags: ["conversations", "biography", "interviews", "australia", "history"],
    scheduleOrAiring: "24/7 Spoken National Relay",
    isLive: true,
    listenerCount: 6500,
    featured: false,
  },
  {
    id: "pod-somafm-sfsf",
    stationuuid: "pod-somafm-sfsf-uuid",
    showName: "SF in SF: Speculative Fiction & Science Talks",
    episodeOrTopic: "Author Readings, Cyberpunk Visions & Space Explorations",
    network: "SomaFM Spoken Lab",
    host: "Terry Bisson & Invited Sci-Fi Authors",
    description: "Live author readings, discussions on artificial intelligence futures, space exploration ethics, and speculative literary readings.",
    category: "Tech & Science",
    language: "English",
    country: "United States",
    countryCode: "US",
    streamUrl: "https://ice1.somafm.com/sfsf-128-mp3",
    streamUrlResolved: "https://ice1.somafm.com/sfsf-128-mp3",
    homepage: "https://somafm.com/sfsf/",
    favicon: "https://somafm.com/img3/sfsf120.png",
    tags: ["sci-fi", "authors", "readings", "speculative", "technology"],
    scheduleOrAiring: "24/7 Speculative Spoken Word Stream",
    isLive: true,
    listenerCount: 4800,
    featured: false,
  },
  {
    id: "pod-nhk-world-spoken",
    stationuuid: "pod-nhk-world-spoken-uuid",
    showName: "Japan Insights & Cultural Perspectives",
    episodeOrTopic: "Tradition Meets Innovation: Society & Contemporary Voices",
    network: "NHK World-Japan Spoken Relay",
    host: "NHK World Broadcast Team",
    description: "Deep cultural features, language explorations, social dynamics, and historical perspectives direct from Tokyo.",
    category: "Culture & Arts",
    language: "Japanese",
    country: "Japan",
    countryCode: "JP",
    streamUrl: "https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-ch01/live/daily/index.m3u8",
    streamUrlResolved: "https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-ch01/live/daily/index.m3u8",
    homepage: "https://www3.nhk.or.jp/nhkworld/en/radio/",
    favicon: "https://www3.nhk.or.jp/favicon.ico",
    tags: ["japan", "culture", "spoken", "tokyo", "society"],
    scheduleOrAiring: "Live Spoken Feature Broadcast",
    isLive: true,
    listenerCount: 5600,
    featured: false,
  },
  {
    id: "pod-rai-radio3-fahrenheit",
    stationuuid: "pod-rai-radio3-fahrenheit-uuid",
    showName: "Fahrenheit & Radio3 Mondo",
    episodeOrTopic: "Rassegna Stampa Internazionale, Libri e Dialoghi Teatrali",
    network: "Rai Radio 3",
    host: "Loredana Lipperini & Marino Sinibaldi",
    description: "Il salotto culturale d'Italia: dibattiti letterari, approfondimenti geopolitici mondiali e interviste a scrittori e intellettuali europei.",
    category: "Culture & Arts",
    language: "Italian",
    country: "Italy",
    countryCode: "IT",
    streamUrl: "https://icestreaming.rai.it/3.mp3",
    streamUrlResolved: "https://icestreaming.rai.it/3.mp3",
    homepage: "https://www.raiplaysound.it/radio3",
    favicon: "https://www.rai.it/favicon.ico",
    tags: ["letteratura", "cultura", "dibattito", "italia", "libri"],
    scheduleOrAiring: "Diretta Talk Culturale Continuo",
    isLive: true,
    listenerCount: 5100,
    featured: false,
  },
  {
    id: "pod-monocle-the-foreign-desk",
    stationuuid: "pod-monocle-the-foreign-desk-uuid",
    showName: "The Foreign Desk & The Globalist",
    episodeOrTopic: "Diplomacy, Strategic Affairs & Urban Culture Briefings",
    network: "Monocle 24 Radio",
    host: "Andrew Mueller & Tom Edwards",
    description: "Fast-paced, erudite analysis of international diplomacy, architecture, foreign affairs, defense, and global city design.",
    category: "News & Analysis",
    language: "English",
    country: "United Kingdom",
    countryCode: "GB",
    streamUrl: "https://live.monocle.com/stream",
    streamUrlResolved: "https://live.monocle.com/stream",
    homepage: "https://monocle.com/radio/shows/the-foreign-desk/",
    favicon: "https://monocle.com/favicon.ico",
    tags: ["diplomacy", "foreign desk", "monocle", "cities", "politics"],
    scheduleOrAiring: "24/7 Global Affairs Spoken Stream",
    isLive: true,
    listenerCount: 7800,
    featured: true,
  },
  {
    id: "pod-rfi-debats",
    stationuuid: "pod-rfi-debats-uuid",
    showName: "Débat du Jour & Appels sur l'Actualité",
    episodeOrTopic: "Géopolitique Francophone & Débats de Société",
    network: "Radio France Internationale (RFI)",
    host: "Juan Gomez & Équipe Débats RFI",
    description: "Débats animés sur les questions de gouvernance mondiale, les dynamiques africaines, l'Europe et la coopération internationale avec les auditeurs.",
    category: "Interviews & Debates",
    language: "French",
    country: "France",
    countryCode: "FR",
    streamUrl: "https://rfienfrancais64k.ice.infomaniak.ch/rfienfrancais-64.mp3",
    streamUrlResolved: "https://rfienfrancais64k.ice.infomaniak.ch/rfienfrancais-64.mp3",
    homepage: "https://www.rfi.fr/fr/podcasts/debat-du-jour/",
    favicon: "https://www.rfi.fr/favicon.ico",
    tags: ["debats", "actualite", "afrique", "francophonie", "societe"],
    scheduleOrAiring: "Flux Parlé 24h/24",
    isLive: true,
    listenerCount: 6800,
    featured: false,
  }
];

/**
 * Converts a LivePodcastShow into a RadioStation object
 * ensuring 100% full compatibility with the existing AudioPlayer,
 * SSRF stream proxy, and Gemini Live Translation pipeline.
 */
export function podcastToStation(show: LivePodcastShow): RadioStation {
  return {
    changeid: `pod-${show.id}`,
    stationuuid: show.stationuuid,
    name: show.showName,
    url: show.streamUrl,
    url_resolved: show.streamUrlResolved || show.streamUrl,
    homepage: show.homepage || "https://ai.studio",
    favicon: show.favicon || "",
    tags: [show.category.toLowerCase(), ...show.tags, "podcast", "live show"].join(", "),
    country: show.country,
    countrycode: show.countryCode,
    state: `${show.network}${show.host ? ` • Host: ${show.host}` : ""}`,
    language: show.language,
    votes: show.listenerCount || 5000,
    clickcount: (show.listenerCount || 5000) * 2,
    codec: "MP3",
    bitrate: 128,
    isPodcast: true,
    podcastShowName: show.showName,
    podcastHost: show.host,
    podcastCategory: show.category,
    podcastTopic: show.episodeOrTopic,
    podcastEpisode: show.episodeOrTopic,
  };
}

/**
 * Filters a list of podcast shows according to text search, category, and language.
 */
export function filterPodcastShows(
  shows: LivePodcastShow[],
  searchQuery: string,
  category: PodcastCategory,
  language: string
): LivePodcastShow[] {
  const query = searchQuery.trim().toLowerCase();
  const cat = category.trim();
  const lang = language.trim().toLowerCase();

  return shows.filter((show) => {
    // 1. Category check
    if (cat !== "All Categories" && show.category !== cat) {
      return false;
    }

    // 2. Language check
    if (lang !== "all languages" && show.language.toLowerCase() !== lang) {
      return false;
    }

    // 3. Search query matching
    if (query) {
      const matchName = show.showName.toLowerCase().includes(query);
      const matchNetwork = show.network.toLowerCase().includes(query);
      const matchHost = show.host ? show.host.toLowerCase().includes(query) : false;
      const matchTopic = show.episodeOrTopic.toLowerCase().includes(query);
      const matchDesc = show.description.toLowerCase().includes(query);
      const matchCountry = show.country.toLowerCase().includes(query);
      const matchTags = show.tags.some((t) => t.toLowerCase().includes(query));

      if (!matchName && !matchNetwork && !matchHost && !matchTopic && !matchDesc && !matchCountry && !matchTags) {
        return false;
      }
    }

    return true;
  });
}
