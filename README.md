# Diário Pessoal: mapa do projeto

PWA pessoal para leitura, hábitos e treino, com gamificação (XP, nível, sequência, medalhas) e lembretes por push.
HTML + JS puro, sem build, mesma arquitetura do Diário do Bebê. Publicado pelo GitHub Pages.
Dados no Supabase (login por e-mail e senha, tabela `docs` por usuário). Sem `SB_URL` em `js/00-config.js`, roda em modo local.
Toda a interface em português do Brasil.

| Arquivo | Responsabilidade |
|---|---|
| `js/00-config.js` | URL e chave anon do Supabase, VAPID pública (só valores públicos) |
| `js/01-base.js` | utilidades, datas, ícones `ic()`, estado `S`, registros `ACT`/`FORMS` |
| `js/02-dados.js` | `store` (cache local + fila + sync), atalhos `cfg()`, `books()`, `habits()`, `workouts()` |
| `js/03-jogo.js` | XP, nível, sequência, missão do dia, medalhas |
| `js/04-inicio.js` | Início (lendo agora, selo da sequência, missão, semana de treino, estante) |
| `js/05-leitura.js` | livros, registro de páginas |
| `js/06-habitos.js` | hábitos, grade de 28 dias, sequência por hábito |
| `js/07-treino.js` | registro e histórico de treinos |
| `js/08-ajustes.js` | metas, lembretes, conquistas, conta, backup |
| `js/09-boot.js` | `render()`, login, modal, eventos, início (sempre o último) |
| `sw.js` | offline e notificações |
| `supabase/schema.sql` | tabelas e RLS |
| `supabase/functions/lembretes` | lembretes push (pg_cron a cada 15 min) |

## Padrões
- Caminhos: `config/main`, `books/<id>`, `reading/<data>`, `habits/<id>`, `habitlog/<data>`, `workouts/<id>`.
- Gravar sempre por `store.set/merge/del`. Nunca chamar o Supabase direto para documentos.
- Botão: `data-act="nome"` + `ACT.nome=(id,el)=>{}`. Formulário: `data-form="nome"` + `FORMS.nome=(valores,form)=>{}`.
- Página nova: `VIEWS.nome` + item em `NAV` (09-boot.js).
- Arquivo novo: incluir em `index.html` **e** em `SHELL` de `sw.js`, e subir `CACHE`.
- Texto do usuário sempre por `esc()`. Nenhum arquivo passa de 350 linhas.
- Segredos (service role, VAPID privada, segredo do cron) só no Supabase.
