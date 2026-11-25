/* ============ Bíblia: livros e capítulos, versículos do dia, planos de leitura ============ */
const BIBLIA = [
  ['Gn', 'Gênesis', 50], ['Êx', 'Êxodo', 40], ['Lv', 'Levítico', 27], ['Nm', 'Números', 36], ['Dt', 'Deuteronômio', 34], ['Js', 'Josué', 24], ['Jz', 'Juízes', 21], ['Rt', 'Rute', 4],
  ['1Sm', '1 Samuel', 31], ['2Sm', '2 Samuel', 24], ['1Rs', '1 Reis', 22], ['2Rs', '2 Reis', 25], ['1Cr', '1 Crônicas', 29], ['2Cr', '2 Crônicas', 36], ['Ed', 'Esdras', 10], ['Ne', 'Neemias', 13],
  ['Et', 'Ester', 10], ['Jó', 'Jó', 42], ['Sl', 'Salmos', 150], ['Pv', 'Provérbios', 31], ['Ec', 'Eclesiastes', 12], ['Ct', 'Cânticos', 8], ['Is', 'Isaías', 66], ['Jr', 'Jeremias', 52],
  ['Lm', 'Lamentações', 5], ['Ez', 'Ezequiel', 48], ['Dn', 'Daniel', 12], ['Os', 'Oseias', 14], ['Jl', 'Joel', 3], ['Am', 'Amós', 9], ['Ob', 'Obadias', 1], ['Jn', 'Jonas', 4],
  ['Mq', 'Miqueias', 7], ['Na', 'Naum', 3], ['Hc', 'Habacuque', 3], ['Sf', 'Sofonias', 3], ['Ag', 'Ageu', 2], ['Zc', 'Zacarias', 14], ['Ml', 'Malaquias', 4],
  ['Mt', 'Mateus', 28], ['Mc', 'Marcos', 16], ['Lc', 'Lucas', 24], ['Jo', 'João', 21], ['At', 'Atos', 28], ['Rm', 'Romanos', 16], ['1Co', '1 Coríntios', 16], ['2Co', '2 Coríntios', 13],
  ['Gl', 'Gálatas', 6], ['Ef', 'Efésios', 6], ['Fp', 'Filipenses', 4], ['Cl', 'Colossenses', 4], ['1Ts', '1 Tessalonicenses', 5], ['2Ts', '2 Tessalonicenses', 3], ['1Tm', '1 Timóteo', 6],
  ['2Tm', '2 Timóteo', 4], ['Tt', 'Tito', 3], ['Fm', 'Filemom', 1], ['Hb', 'Hebreus', 13], ['Tg', 'Tiago', 5], ['1Pe', '1 Pedro', 5], ['2Pe', '2 Pedro', 3], ['1Jo', '1 João', 5],
  ['2Jo', '2 João', 1], ['3Jo', '3 João', 1], ['Jd', 'Judas', 1], ['Ap', 'Apocalipse', 22],
];
const NT_START = 39;
const bookName = (ab) => (BIBLIA.find((b) => b[0] === ab) || [ab, ab])[1];
const capKey = (ab, n) => `${ab}:${n}`;
const capLabel = (k) => { const [ab, n] = k.split(':'); return `${bookName(ab)} ${n}`; };

const PLANOS = {
  biblia: ['Bíblia inteira', BIBLIA],
  nt: ['Novo Testamento', BIBLIA.slice(NT_START)],
  evangelhos: ['Evangelhos e Atos', BIBLIA.slice(NT_START, NT_START + 5)],
  sabedoria: ['Salmos e Provérbios', BIBLIA.filter((b) => ['Sl', 'Pv'].includes(b[0]))],
  at: ['Antigo Testamento', BIBLIA.slice(0, NT_START)],
};
const planCaps = (id) => (PLANOS[id] || PLANOS.nt)[1].flatMap(([ab, , n]) => Array.from({ length: n }, (_, i) => capKey(ab, i + 1)));
function planInfo() {
  if (store.doc('bible/main')?.plan === 'ano' && anoCfg()) return anoInfo();
  const id = store.doc('bible/main')?.plan || 'nt', caps = planCaps(id), read = bibleRead(), lidos = caps.filter((k) => read[k]).length;
  return { id, nome: PLANOS[id][0], total: caps.length, lidos, next: caps.find((k) => !read[k]) };
}

/* versículos curtos para o dia (rodam pela data) */
const VERSOS = [
  ['Salmos 119:105', 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.'],
  ['Josué 1:9', 'Seja forte e corajoso. Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.'],
  ['Filipenses 4:13', 'Tudo posso naquele que me fortalece.'],
  ['Provérbios 3:5-6', 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça-o em todos os seus caminhos, e ele endireitará as suas veredas.'],
  ['Isaías 40:31', 'Os que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.'],
  ['Mateus 6:33', 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.'],
  ['Romanos 8:28', 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam.'],
  ['Salmos 23:1', 'O Senhor é o meu pastor; de nada terei falta.'],
  ['Jeremias 29:11', 'Porque sou eu que conheço os planos que tenho para vocês, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.'],
  ['Lamentações 3:22-23', 'As misericórdias do Senhor são a causa de não sermos consumidos; elas se renovam cada manhã. Grande é a tua fidelidade!'],
  ['2 Timóteo 1:7', 'Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.'],
  ['Mateus 11:28', 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.'],
  ['Gálatas 6:9', 'E não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desanimarmos.'],
  ['Colossenses 3:23', 'Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.'],
  ['Salmos 46:1', 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.'],
  ['Filipenses 4:6-7', 'Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus.'],
  ['Provérbios 16:3', 'Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.'],
  ['Romanos 12:2', 'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente.'],
  ['1 Pedro 5:7', 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.'],
  ['João 15:5', 'Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dará muito fruto.'],
  ['Salmos 37:5', 'Entregue o seu caminho ao Senhor; confie nele, e ele agirá.'],
  ['Hebreus 12:1', 'Corramos com perseverança a corrida que nos é proposta, tendo os olhos fitos em Jesus.'],
  ['Tiago 1:22', 'Sejam praticantes da palavra, e não apenas ouvintes.'],
  ['Salmos 90:12', 'Ensina-nos a contar os nossos dias para que o nosso coração alcance sabedoria.'],
  ['Provérbios 4:23', 'Acima de tudo, guarde o seu coração, pois dele depende toda a sua vida.'],
  ['Isaías 41:10', 'Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei.'],
  ['João 14:27', 'Deixo-lhes a paz; a minha paz lhes dou. Não se perturbe o seu coração, nem tenham medo.'],
  ['2 Coríntios 5:17', 'Se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!'],
  ['Mateus 5:16', 'Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai.'],
  ['Salmos 51:10', 'Cria em mim um coração puro, ó Deus, e renova dentro de mim um espírito estável.'],
  ['Miqueias 6:8', 'O que o Senhor exige de você: que pratique a justiça, ame a fidelidade e ande humildemente com o seu Deus.'],
  ['Romanos 15:13', 'Que o Deus da esperança os encha de toda alegria e paz, por sua confiança nele.'],
  ['Salmos 34:8', 'Provem e vejam como o Senhor é bom. Como é feliz o homem que nele se refugia!'],
  ['Tiago 1:5', 'Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente.'],
  ['1 Coríntios 10:31', 'Quer comam, quer bebam, quer façam qualquer outra coisa, façam tudo para a glória de Deus.'],
  ['Mateus 6:34', 'Não se preocupem com o amanhã, pois o amanhã trará as suas próprias preocupações. Basta a cada dia o seu próprio mal.'],
  ['Hebreus 11:1', 'A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.'],
  ['Salmos 1:3', 'É como árvore plantada à beira de águas correntes: dá fruto no tempo certo e suas folhas não murcham.'],
  ['Efésios 2:10', 'Somos criação de Deus realizada em Cristo Jesus para fazermos boas obras, as quais Deus preparou antes para nós as praticarmos.'],
  ['Provérbios 21:5', 'Os planos bem elaborados levam à fartura; mas o apressado sempre acaba na miséria.'],
];
const verseOfDay = (iso = today()) => VERSOS[(dayOfYear(iso) + Number(iso.slice(0, 4))) % VERSOS.length];
