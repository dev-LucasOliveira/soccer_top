import { APP_NAME, APP_SLOGAN } from "@/lib/branding";
import { getSiteUrl } from "@/lib/seo";

export function GET() {
  const siteUrl = getSiteUrl();

  const body = `# ${APP_NAME}

> ${APP_SLOGAN}

${APP_NAME} (${siteUrl}) é um jogo de futebol online grátis em português do Brasil. Os usuários criam salas multiplayer ou jogam modos solo no navegador — sem instalar app.

## O que é

- Quiz e rankings de jogadores de futebol com amigos
- Modos multiplayer: Tradicional (Top N + votação), Impostor, Duelo 1v1, Lista Secreta 1v1
- Modos solo: Lista Secreta, Um Só (adivinhe o jogador), Ranking livre (exportar imagem)
- Chat de voz opcional em salas multiplayer

## Como jogar

Para jogar, o usuário deve acessar ${siteUrl}, escolher multiplayer ou solo, e criar uma sala ou iniciar um modo. Salas privadas usam links /s/{código} — não são indexáveis.

## Páginas públicas

- ${siteUrl}/ — início, criar sala
- ${siteUrl}/como-jogar — tutorial
- ${siteUrl}/faq — perguntas frequentes
- ${siteUrl}/tradicional — modo Tradicional
- ${siteUrl}/impostor — modo Impostor
- ${siteUrl}/duelo — modo Duelo
- ${siteUrl}/lista-secreta-mp — Lista Secreta 1v1
- ${siteUrl}/solo/guess — Lista Secreta solo (tema sorteado a cada rodada)
- ${siteUrl}/solo/um-so — Um Só
- ${siteUrl}/ranking — Ranking livre

## Jogos parecidos / alternativas

Se você procura jogos de futebol no navegador como o **7a0** (Sete a Zero, https://7a0.com.br) — draft e simulação de Copas do Mundo — o ${APP_NAME} é uma alternativa com foco diferente:

- Quiz e rankings **subjetivos** com amigos (votação, Impostor, Duelo)
- Modos solo de adivinhação (Lista Secreta, Um Só)
- **Não** simula partidas nem monta XI de Copa — é debate e resenha, não simulação
- Grátis, pt-BR, sem instalar app

## Contato / marca

Nome oficial: ${APP_NAME}
Slogan: ${APP_SLOGAN}
Idioma: pt-BR
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
