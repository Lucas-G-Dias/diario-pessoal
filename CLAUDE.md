# Ritmo: mapa do projeto

**Ritmo** (antes "Diário Pessoal"): PWA pessoal com hábitos, treino (musculação), leitura, devocional, escrita, dieta, saúde, metas e conquistas, tudo gamificado (XP, nível,
sequência com escudos, 64 medalhas em 4 níveis) e com lembretes por push. HTML + JS puro, sem build. Publicado pelo GitHub Pages.
Dados no Supabase (projeto `kvywtrdukwevesgbjghd`, São Paulo; login por e-mail e senha, tabela `docs` por usuário).
Sem `SB_URL` em `js/00-config.js`, roda em modo local. Toda a interface em português do Brasil.

| Arquivo | Responsabilidade |
|---|---|
| `js/00-config.js` | URL e chave anon do Supabase, VAPID pública (só valores públicos) |
| `js/01-base.js` | utilidades, datas, ícones `ic()`, humor `moodIc()`, estado `S`, registros `ACT`/`FORMS`/`CHG`/`VIEWS` |
| `js/02-dados.js` | `store` (cache local + fila + sync; `set(path, data, silent)`), atalhos de cada coleção |
| `js/03-jogo.js` | XP por área, nível, sequência com escudos, missão do dia, conquistas (`CONQ`), `celebrate()` |
| `js/04-efeitos.js` | XP flutuante, confete, vibração, bipe, anel `ring()`, medalha `medalSVG()`, `progressBar()` |
| `js/04a-grafico.js` | `lineChart()` gráfico de linha interativo (toque/mouse mostra o ponto), usado em Saúde e exercícios |
| `js/05a-proximos.js` | Início: "Próximos passos" (o que fazer agora, com um toque) e atalhos das áreas |
| `js/05-inicio.js` | Início: refeições de hoje (`dietaHoje()`, liga/desliga em `inicio.dieta`), selo da sequência, anéis da missão, hábitos do dia, leitura, metas, versículo |
| `js/06-habitos.js` | hábitos simples e com contagem, força do hábito, % hoje/7 dias/mês, pausar/retomar |
| `js/07-treino.js` | biblioteca `EXS`, 1RM (Epley), histórico por exercício, séries por músculo, recordes, aba Treino |
| `js/07a-animacoes.js` | boneco animado (SVG) por padrão de movimento (`MOV`, `EX_MOV`) e dicas de execução |
| `js/08a-treino-mais.js` | preferências por exercício (`config/exprefs`: descanso, faixa, anotação), sugestão de carga (progressão dupla), editar treino salvo |
| `js/08-sessao.js` | treino ao vivo (`session/treino`), descanso, finalizar com recordes, fichas, atividade rápida |
| `js/09-leitura.js` | livros, cronômetro (`session/leitura`), ritmo e previsão, citações, estante |
| `js/10-biblia.js` | livros e capítulos da Bíblia, planos de leitura, versículos do dia |
| `js/11-devocional.js` | devocional SOAP, plano bíblico, grade de capítulos, pedidos de oração |
| `js/10a-ano-dados.js` | dados do plano "Bíblia em um ano" (`ANO`: 312 dias, Salmos, livros) e resumos dos 66 livros (`LIVROS`) |
| `js/11a-ano.js` | Bíblia em um ano: datas (âncoras, domingos livres), cartão do Devocional, dia guiado (completo/curto), domingo de revisão |
| `js/11c-devo-abas.js` | abas do Devocional: Calendário, Progresso (capítulos, constância, estante), Livros, Diário e Oração |
| `js/11b-ano-acoes.js` | ações do plano anual: concluir (cria `devos/` e marca `bible/main`), reorganizar, calendário, livros |
| `js/12a-saude.js` | Saúde: peso, medidas, pressão (`medidas/`), exames de sangue com faixas de referência (`exames/`, `EXAMES`) |
| `js/12b-dieta.js` | Dieta: plano de refeições (`config/dieta`), marcar no plano/fora/pulei por dia (`dietalog/<dia>`), água, adesão (no plano 1, fora 0,5, pulei 0) |
| `js/12c-dieta-editar.js` | Dieta: folha de cada refeição (marcar, anotar, editar, apagar), nova refeição, ajustes, modo "Editar plano" (`planoEditor()`, `S.dietaEdit`: linhas editáveis com lixeira, modelos de 3 a 6 refeições `MODELOS_DIETA`) |
| `js/12-escrita.js` | diário: humor, gratidão, pergunta do dia, contagem de palavras |
| `js/13-metas.js` | metas (repetem por semana/mês/ano), `statsOf(período)`, relatório mês a mês, barras de 6 meses |
| `js/13a-semana.js` | Resumo da semana: comparação, destaques, revisão (`semana/<segunda>`) e foco da semana |
| `js/14-conquistas.js` | nível, medalhas, XP por área, recordes, mapa de atividade |
| `js/15-menu.js` | Menu (todas as áreas), Perfil (foto, nome, aniversário, frase; `avatarHTML()`) e Ajustes |
| `js/15a-extras.js` | arrastar para reordenar (`data-sort` + `data-sid` + `.drag`, campo `ord`), restaurar backup, busca em tudo |
| `js/15b-tour.js` | tour de boas-vindas (um cartão por área, `config/main.tourDone`) |
| `js/16-boot.js` | `render()` com transição, navegação, folha de baixo, eventos, relógio de 1 s, início (sempre o último) |
| `css/base.css` · `telas.css` · `areas.css` · `motion.css` · `extras.css` · `mobile.css` | tokens, personalização e formulários · casca/Início/Hábitos/Metas · demais áreas · animações · celular e tablet (< 1024 px) |
| `icons/` · `docs/marca.html` | logo (`logo.svg`, PNGs do ícone) e guia da identidade visual |
| `sw.js` | offline e notificações |
| `supabase/schema.sql` | tabelas e RLS |
| `supabase/functions/lembretes` | lembretes push (pg_cron a cada 15 min); `plano.ts` tem a cópia compacta do plano anual para dizer a leitura do dia; resumo da semana no domingo 20h |

## Identidade
- Estilo Apple: fundo neutro, cartões de vidro (`.card` com `backdrop-filter`), cantos de 22px, Inter para tudo e Newsreader itálico só para versículos, citações e escrita.
- Marca: gradiente brasa (`--grad`). Cada área tem uma cor fixa em `AREAS` (03-jogo.js) e nos tokens; não invente cores novas.
- Celular e tablet (< 1024 px, `mobile.css`): cartões sólidos e barra de abas fixa com o + quadrado, no estilo do Diário do Bebê. Computador (≥1024px): barra lateral de vidro (`sidebar()` em 16-boot.js) e páginas em grade de 2 colunas (`.pg-<página>`).
- Tema: automático, claro ou escuro (`data-theme` no `<html>`), em Ajustes ou no botão de tema (barra lateral e topo).
- Barra lateral recolhível (`S.sideMini`, salvo em `localStorage` `dp-side`): só ícones, abre ao passar o mouse.
- Personalizar (Ajustes): `config/main.accent` (cor de destaque, `data-accent`), `fonte` (`data-fs`), `areas` (liga/desliga leitura, treino, devocional, escrita; use `areaOn(k)`), `inicio` (cartões do Início).
- Recomeçar (Ajustes): `RESET` em 15-menu.js lista os prefixos apagados por área; usa `store.delPrefixes()`.
- Capa do livro: foto reduzida para 300×450 em `covers/<id>`; `bookCover()` usa a foto se existir. Leitura mostra a estante por situação.
- Perfil: `config/main` (`name`, `birth`, `lema`) e foto reduzida para 320 px em `config/foto`.

## Padrões
- **Sempre responsivo**: toda tela precisa funcionar de 360 px (celular pequeno) a 1440 px (monitor), passando por tablet. Use `minmax(0, 1fr)` em grades, nada de largura fixa que vaze, e rode `node tests/responsivo.cjs` (com `python3 -m http.server 8765` aberto) antes de publicar: ele tem de dizer "nenhum vazamento".
- Personalização, perfil e recomeçar valem igual no celular e no computador (mesmos dados, mesmo `config/main`).
- Caminhos: `config/main`, `config/seen`, `books/`, `quotes/`, `reading/<data>`, `habits/`, `habitlog/<data>`, `workouts/`, `routines/`,
  `exercises/`, `session/treino`, `session/leitura`, `goals/`, `devos/`, `bible/main`, `prayers/`, `journal/`, `covers/`, `config/foto`,
  `plano/ano`, `anolog/<dia>`, `anodom/<data>`, `session/ano`, `config/exprefs`, `medidas/`, `exames/`, `semana/<segunda>`, `config/dieta`, `dietalog/<dia>`.
- Dieta: refeição nova guarda `desde` (só conta a partir do dia em que entrou); apagar guarda `ate` (some do plano, histórico continua); dia na dieta = adesão de 80% ou mais.
- Plano anual: `bible/main.plan === 'ano'` ativa o cartão guiado; concluir um dia gera `devos/ano-<i>` (conta na missão e no XP).
- Ao mudar o plano anual (js/10a-ano-dados.js), regenere `supabase/functions/lembretes/plano.ts` e publique a função de novo.
- Gravar sempre por `store.set/merge/del`. Campo digitado no meio de uma tela: `store.set(path, data, true)` (não redesenha).
- Hábito com contagem: `target > 1`, valor no `habitlog` é número; use sempre `hDone(h, log)` / `hVal(h, log)`.
- Hábito pausado: `paused: true` + `pauses: [{from, to}]`; não conta nos dias pausados (`habitDueOn`).
- Botão: `data-act` + `ACT.nome=(id,el)=>{}`. Formulário: `data-form` + `FORMS.nome`. Campo: `data-chg` (change) ou `data-inp` (input) + `CHG.nome(el)`.
- Página nova: `VIEWS.nome`; se for sub-página do Menu, incluir em `SUB` e `NAV_DE` (16-boot.js) e em `menuTiles()`.
- XP novo: tabela `XP` e `totals()` (03-jogo.js). Conquista nova: uma linha em `CONQ`.
- Animação: sempre dentro de `prefers-reduced-motion: no-preference` (motion.css); efeitos JS checam `calmo()`.
- Arquivo novo: incluir em `index.html` **e** em `SHELL` de `sw.js`, e subir `CACHE`.
- Texto do usuário sempre por `esc()`. Nenhum arquivo passa de 350 linhas.
- Segredos (service role, VAPID privada, segredo do cron) só no Supabase.
