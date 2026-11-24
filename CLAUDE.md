# Diário Pessoal: mapa do projeto

PWA pessoal com hábitos, treino (musculação), leitura, devocional, escrita, metas e conquistas, tudo gamificado (XP, nível,
sequência com escudos, 60 medalhas em 4 níveis) e com lembretes por push. HTML + JS puro, sem build. Publicado pelo GitHub Pages.
Dados no Supabase (projeto `kvywtrdukwevesgbjghd`, São Paulo; login por e-mail e senha, tabela `docs` por usuário).
Sem `SB_URL` em `js/00-config.js`, roda em modo local. Toda a interface em português do Brasil.

| Arquivo | Responsabilidade |
|---|---|
| `js/00-config.js` | URL e chave anon do Supabase, VAPID pública (só valores públicos) |
| `js/01-base.js` | utilidades, datas, ícones `ic()`, humor `moodIc()`, estado `S`, registros `ACT`/`FORMS`/`CHG`/`VIEWS` |
| `js/02-dados.js` | `store` (cache local + fila + sync; `set(path, data, silent)`), atalhos de cada coleção |
| `js/03-jogo.js` | XP por área, nível, sequência com escudos, missão do dia, conquistas (`CONQ`), `celebrate()` |
| `js/04-efeitos.js` | XP flutuante, confete, vibração, bipe, anel `ring()`, medalha `medalSVG()`, `progressBar()` |
| `js/05-inicio.js` | Início: selo da sequência, anéis da missão, hábitos do dia, leitura, metas, versículo |
| `js/06-habitos.js` | hábitos simples e com contagem, força do hábito, % hoje/7 dias/mês, pausar/retomar |
| `js/07-treino.js` | biblioteca `EXS`, 1RM (Epley), histórico por exercício, séries por músculo, recordes, aba Treino |
| `js/08-sessao.js` | treino ao vivo (`session/treino`), descanso, finalizar com recordes, fichas, atividade rápida |
| `js/09-leitura.js` | livros, cronômetro (`session/leitura`), ritmo e previsão, citações, estante |
| `js/10-biblia.js` | livros e capítulos da Bíblia, planos de leitura, versículos do dia |
| `js/11-devocional.js` | devocional SOAP, plano bíblico, grade de capítulos, pedidos de oração |
| `js/12-escrita.js` | diário: humor, gratidão, pergunta do dia, contagem de palavras |
| `js/13-metas.js` | metas (repetem por semana/mês/ano), `statsOf(período)`, relatório mês a mês, barras de 6 meses |
| `js/14-conquistas.js` | nível, medalhas, XP por área, recordes, mapa de atividade |
| `js/15-menu.js` | Menu (todas as áreas) e Ajustes |
| `js/16-boot.js` | `render()` com transição, navegação, folha de baixo, eventos, relógio de 1 s, início (sempre o último) |
| `css/base.css` · `telas.css` · `areas.css` · `motion.css` | tokens e formulários · casca/Início/Hábitos/Metas · demais áreas · animações |
| `sw.js` | offline e notificações |
| `supabase/schema.sql` | tabelas e RLS |
| `supabase/functions/lembretes` | lembretes push (pg_cron a cada 15 min) |

## Padrões
- Caminhos: `config/main`, `config/seen`, `books/`, `quotes/`, `reading/<data>`, `habits/`, `habitlog/<data>`, `workouts/`, `routines/`,
  `exercises/`, `session/treino`, `session/leitura`, `goals/`, `devos/`, `bible/main`, `prayers/`, `journal/`.
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
