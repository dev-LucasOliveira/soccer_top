import type { Metadata } from "next";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";
import { getGameModeConfig, type HomeModeId } from "@/lib/game-modes";

export const DEFAULT_SITE_URL = "https://semcriterio.vercel.app";

export const SITE_KEYWORDS = [
  "sem critério",
  "sem criterio",
  "sem critério jogo futebol",
  "quiz de futebol",
  "quiz futebol online",
  "jogo de futebol online",
  "ranking de jogadores",
  "multiplayer futebol",
  "adivinhe o jogador",
  "jogo de futebol com amigos",
  "top jogadores futebol",
  "jogo online futebol grátis",
] as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
}: BuildPageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const mergedKeywords = keywords ?? [...SITE_KEYWORDS];

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: APP_NAME,
      title: `${title} | ${APP_NAME}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${APP_NAME}`,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function buildRootMetadata(): Metadata {
  const description = `${APP_SLOGAN}. ${APP_NAME} é um jogo de futebol online grátis: monte rankings com amigos, vote nas melhores listas, jogue Impostor, Duelo e modos solo como Lista Secreta e Um Só.`;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: `${APP_NAME} — ${APP_SLOGAN}`,
      template: `%s | ${APP_NAME}`,
    },
    description,
    keywords: [...SITE_KEYWORDS],
    alternates: {
      canonical: getSiteUrl(),
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: getSiteUrl(),
      siteName: APP_NAME,
      title: `${APP_NAME} — ${APP_SLOGAN}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${APP_NAME} — ${APP_SLOGAN}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    description: APP_SLOGAN,
    url: getSiteUrl(),
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: APP_NAME,
    description: APP_SLOGAN,
    url: getSiteUrl(),
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    inLanguage: "pt-BR",
  };
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

const MODE_SEO_TITLES: Partial<Record<HomeModeId, string>> = {
  tradicional: "Quiz de futebol multiplayer — modo Tradicional",
  impostor: "Jogo Impostor de futebol online — descubra quem blefa",
  duelo: "Duelo 1v1 de futebol online — adivinhe o jogador",
  "lista-secreta-1v1": "Lista Secreta 1v1 — quiz de futebol para dois jogadores",
};

export function getModeSeoTitle(modeId: HomeModeId): string {
  return MODE_SEO_TITLES[modeId] ?? getGameModeConfig(modeId).label;
}

export function getModeSeoParagraphs(modeId: HomeModeId): string[] {
  const mode = getGameModeConfig(modeId);
  const paragraphs = [mode.panelDescription];

  if (mode.rules && mode.rules.length > 0) {
    paragraphs.push(
      `Como funciona: ${mode.rules.slice(0, 3).join(". ")}.`
    );
  }

  paragraphs.push(
    `${APP_NAME} roda no navegador, sem instalar nada. Crie uma sala grátis, convide amigos pelo link e escolha o modo no lobby.`
  );

  return paragraphs;
}

export function buildModeLandingMetadata(modeId: HomeModeId): Metadata {
  const mode = getGameModeConfig(modeId);
  const seoTitle = getModeSeoTitle(modeId);

  return buildPageMetadata({
    title: seoTitle,
    description: `${mode.panelDescription} ${mode.cardDescription}`,
    path: mode.landingPath,
    keywords: [
      ...SITE_KEYWORDS,
      mode.label.toLowerCase(),
      `modo ${mode.label.toLowerCase()} futebol`,
    ],
  });
}

export const PUBLIC_STATIC_PATHS = [
  "/",
  "/como-jogar",
  "/faq",
  "/tradicional",
  "/impostor",
  "/duelo",
  "/lista-secreta-mp",
  "/solo/lobby",
  "/solo/guess",
  "/solo/um-so",
  "/ranking",
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "O Sem Critério é grátis?",
    answer:
      "Sim. Você pode criar salas, jogar com amigos e usar os modos solo sem pagar. Basta acessar o site no navegador.",
  },
  {
    question: "Quantos jogadores podem participar?",
    answer:
      "Depende do modo: Tradicional e Impostor aceitam grupos (mínimo 2 no Tradicional, 4 no Impostor). Duelo e Lista Secreta 1v1 exigem exatamente 2 jogadores. Nos modos solo você joga sozinho.",
  },
  {
    question: "Preciso instalar algum aplicativo?",
    answer:
      "Não. O Sem Critério funciona no navegador, no celular ou no computador. Compartilhe o link da sala e todos entram direto.",
  },
  {
    question: "O Sem Critério é parecido com o 7a0?",
    answer:
      "Se você curte jogos de futebol no navegador como o 7a0 (Sete a Zero), o Sem Critério é outra opção — mas com foco diferente. O 7a0 monta seleções históricas de Copa e simula torneios; aqui você monta rankings subjetivos, vota nas listas dos amigos, joga Impostor e adivinha jogadores secretos. É mais resenha e debate do que simulação de partida.",
  },
  {
    question: "Como funciona o modo Tradicional?",
    answer:
      "Um jogador cria a sala e configura rodadas com tema e filtros. Cada participante monta seu Top N de jogadores; depois todos votam na melhor lista. Os pontos se acumulam ao longo das rodadas.",
  },
  {
    question: "O que é o modo Impostor?",
    answer:
      "Todos montam a mesma lista Top 5, exceto um jogador sorteado que não vê o tema. Vocês debatem e votam para eliminar quem está blefando.",
  },
  {
    question: "Quais modos posso jogar sozinho?",
    answer:
      "Lista Secreta, Um Só e Ranking livre. Em Lista Secreta você descobre jogadores secretos pelas dicas de clube; em Um Só chuta um jogador misterioso com pistas progressivas.",
  },
  {
    question: "Tem chat de voz na sala?",
    answer:
      "Sim, salas multiplayer podem usar chat de voz integrado. O microfone pede permissão do navegador e funciona melhor em HTTPS (por exemplo semcriterio.vercel.app).",
  },
  {
    question: "Posso exportar meu ranking como imagem?",
    answer:
      "Sim. No modo Ranking livre e nos resultados de partidas você pode gerar uma imagem para compartilhar nas redes.",
  },
  {
    question: "De onde vêm os jogadores do jogo?",
    answer:
      "O catálogo combina lendas do futebol e jogadores das principais ligas europeias e brasileiras, curados para funcionar bem nos filtros e nos temas da Lista Secreta.",
  },
  {
    question: "Como convido amigos para a minha sala?",
    answer:
      "Depois de criar a sala você recebe um código e um link. Envie o link /s/{código} — seus amigos entram com o nome e entram no lobby.",
  },
  {
    question: "Meus dados de sessão ficam públicos?",
    answer:
      "Não. Salas e partidas em andamento não são indexadas em buscadores. Apenas páginas informativas e modos de jogo públicos aparecem no site.",
  },
];
