/* ============ Treino: animação de cada padrão de movimento (boneco em SVG) e dicas de execução ============
   Cada padrão é um desenho de traços; os pontos com "a;b" se movem de a para b e voltam (SMIL, sem biblioteca). */
const MOV = {
  supino: { nome: 'Empurrar deitado', partes: [['r', 14, 70, 60, 6], ['l', 24, 64, 66, 64], ['c', 17, 62, 6], ['l', 66, 64, 78, 74], ['l', 78, 74, 80, 90], ['l', 32, 64, '32;32', '58;36'], ['p', '32;32', '58;36', 6]],
    dica: 'Escápulas encaixadas no banco, pés firmes no chão. Desça a barra até a linha do peito, controlando, e empurre sem tirar o quadril do banco.' },
  press: { nome: 'Empurrar acima da cabeça', partes: [['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 42, 90], ['l', 50, 58, 58, 90], ['l', 48, 28, '34;34', '30;8'], ['l', 52, 28, '66;66', '30;8'], ['l', '28;28', '30;8', '72;72', '30;8']],
    dica: 'Abdômen e glúteos contraídos, sem arquear a lombar. Empurre a carga em linha reta até estender os braços e desça até a altura do queixo.' },
  puxada: { nome: 'Puxar de cima', partes: [['c', 50, 26, 7], ['l', 50, 34, 50, 64], ['l', 50, 64, 66, 66], ['l', 66, 66, 68, 88], ['l', 48, 38, '34;36', '8;28'], ['l', 52, 38, '66;64', '8;28'], ['l', '24;26', '8;28', '76;74', '8;28']],
    dica: 'Peito para cima e ombros longe das orelhas. Puxe levando os cotovelos para baixo e para trás, até a barra chegar perto do peito.' },
  remada: { nome: 'Puxar na horizontal', partes: [['c', 34, 30, 7], ['l', 38, 36, 52, 62], ['l', 52, 62, 70, 64], ['l', 70, 64, 72, 88], ['l', 42, 42, '76;54', '50;48'], ['p', '80;58', '50;48', 5]],
    dica: 'Coluna neutra e peito aberto. Puxe trazendo os cotovelos para trás e junte as escápulas no fim; volte devagar, sem balançar o tronco.' },
  agacha: { nome: 'Agachar', partes: [['c', '50;44', '14;34', 7], ['l', '50;45', '22;42', '50;38', '56;72'], ['l', '50;38', '56;72', '56;66', '72;74'], ['l', '56;66', '72;74', 52, 92], ['l', '36;30', '30;48', '64;58', '30;48']],
    dica: 'Pés na largura dos ombros, joelhos na direção dos pés. Desça como quem senta numa cadeira, peito alto, até a coxa ficar paralela ao chão.' },
  afundo: { nome: 'Afundo', partes: [['c', 50, '14;26', 7], ['l', 50, '22;34', 50, '54;66'], ['l', 50, '54;66', 66, '72;76'], ['l', 66, '72;76', 68, 92], ['l', 50, '54;66', 38, '74;86'], ['l', 38, '74;86', 28, 92]],
    dica: 'Passo largo, tronco reto. Desça até o joelho de trás quase tocar o chão e suba empurrando com o calcanhar da perna da frente.' },
  terra: { nome: 'Dobrar o quadril', partes: [['c', '50;72', '14;40', 7], ['l', '50;66', '22;44', 50, 56], ['l', 50, 56, 54, 74], ['l', 54, 74, 50, 92], ['l', '50;66', '26;46', '50;62', '56;76'], ['p', '50;62', '58;78', 5]],
    dica: 'Barra perto das pernas e costas retas o tempo todo. O movimento vem do quadril: leve o quadril para trás e suba contraindo os glúteos.' },
  rosca: { nome: 'Flexionar o cotovelo', partes: [['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 44, 90], ['l', 50, 58, 56, 90], ['l', 52, 28, 54, 48], ['l', 54, 48, '56;66', '70;34'], ['p', '56;66', '72;34', 4]],
    dica: 'Cotovelos colados ao corpo e parados. Suba contraindo o bíceps sem balançar o tronco e desça devagar até quase estender.' },
  triceps: { nome: 'Estender o cotovelo', partes: [['c', 46, 14, 7], ['l', 46, 22, 46, 58], ['l', 46, 58, 40, 90], ['l', 46, 58, 52, 90], ['l', 48, 28, 52, 46], ['l', 52, 46, '66;54', '38;68'], ['l', '66;54', '38;68', 66, 4]],
    dica: 'Cotovelos fixos ao lado do corpo. Estenda o braço até o fim, segure um instante e volte controlando, sem deixar os cotovelos abrirem.' },
  eleva: { nome: 'Elevar os braços', partes: [['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 44, 90], ['l', 50, 58, 56, 90], ['l', 46, 28, '40;22', '56;30'], ['l', 54, 28, '60;78', '56;30']],
    dica: 'Cotovelos levemente dobrados. Suba até a altura dos ombros, sem impulso, e desça devagar. Carga leve e controle valem mais que peso.' },
  crucifixo: { nome: 'Abrir e fechar os braços', partes: [['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 44, 90], ['l', 50, 58, 56, 90], ['l', 46, 30, '16;42', '38;32'], ['l', 54, 30, '84;58', '38;32']],
    dica: 'Braços quase estendidos, como num abraço grande. Abra até sentir o peito alongar e feche contraindo, sem bater as mãos.' },
  extensora: { nome: 'Estender o joelho', partes: [['r', 30, 64, 36, 6], ['l', 34, 30, 40, 62], ['c', 32, 22, 7], ['l', 40, 62, 66, 62], ['l', 66, 62, '68;88', '88;62']],
    dica: 'Costas apoiadas e mãos nas alças. Estenda o joelho até o fim, segure um segundo contraindo a coxa e desça devagar.' },
  flexora: { nome: 'Flexionar o joelho', partes: [['r', 16, 58, 70, 6], ['c', 14, 50, 6], ['l', 20, 54, 56, 54], ['l', 56, 54, '84;66', '54;28']],
    dica: 'Quadril colado no banco. Traga os calcanhares em direção aos glúteos e volte devagar, sem soltar o peso.' },
  quadril: { nome: 'Elevar o quadril', partes: [['r', 6, 50, 22, 6], ['c', 16, 42, 6], ['l', 22, 46, '50;50', '64;48'], ['l', '50;50', '64;48', 66, '66;62'], ['l', 66, '66;62', 68, 84]],
    dica: 'Costas apoiadas no banco, queixo para baixo. Suba o quadril contraindo os glúteos até o corpo ficar reto, sem arquear a lombar.' },
  abdominal: { nome: 'Flexionar o tronco', partes: [['l', 10, 84, 90, 84], ['l', 50, 82, 62, 64], ['l', 62, 64, 74, 82], ['l', 50, 82, '22;36', '82;62'], ['c', '15;30', '80;56', 6]],
    dica: 'Lombar no chão e queixo afastado do peito. Suba enrolando o tronco, soltando o ar, e desça sem largar o peso de uma vez.' },
  prancha: { nome: 'Segurar parado', partes: [['l', 10, 86, 90, 86], ['c', 20, '62;64', 6], ['l', 26, '66;68', 80, '76;77'], ['l', 26, '66;68', 26, 84], ['l', 80, '76;77', 84, 84]],
    dica: 'Corpo reto da cabeça aos calcanhares, abdômen e glúteos contraídos. Respire normalmente e não deixe o quadril cair.' },
  pernas: { nome: 'Elevar as pernas', partes: [['l', 10, 86, 90, 86], ['c', 14, 80, 6], ['l', 20, 82, 50, 82], ['l', 50, 82, '84;60', '82;48']],
    dica: 'Lombar colada no chão, mãos ao lado do corpo. Suba as pernas juntas, sem impulso, e desça devagar sem encostar no chão.' },
  panturrilha: { nome: 'Subir na ponta dos pés', partes: [['g', '0 0;0 -7'], ['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 46, 88], ['l', 50, 58, 54, 88], ['l', 46, 88, 42, 92], ['l', 54, 88, 58, 92], ['/g']],
    dica: 'Suba o máximo que conseguir, segure um segundo no alto e desça até alongar bem a panturrilha. Amplitude completa faz a diferença.' },
  perna: { nome: 'Levar a perna', partes: [['c', 50, 14, 7], ['l', 50, 22, 50, 58], ['l', 50, 58, 44, 90], ['l', 50, 58, '58;76', '90;76'], ['l', 50, 30, 64, 46]],
    dica: 'Tronco firme e quadril parado. Leve a perna até o fim do movimento contraindo o glúteo e volte controlando.' },
};
const EX_MOV = {
  'supino-reto': 'supino', 'supino-inclinado': 'supino', 'supino-halter': 'supino', 'supino-inc-halter': 'supino', flexao: 'supino', paralelas: 'triceps',
  crucifixo: 'crucifixo', crossover: 'crucifixo', 'peck-deck': 'crucifixo', 'crucifixo-inverso': 'crucifixo',
  'barra-fixa': 'puxada', puxada: 'puxada', pulldown: 'puxada', 'remada-curvada': 'remada', 'remada-baixa': 'remada', 'remada-unilateral': 'remada',
  terra: 'terra', stiff: 'terra', desenvolvimento: 'press', 'desenv-halter': 'press', 'elev-lateral': 'eleva', 'elev-frontal': 'eleva', encolhimento: 'panturrilha',
  'rosca-direta': 'rosca', 'rosca-alternada': 'rosca', 'rosca-martelo': 'rosca', 'rosca-scott': 'rosca', 'triceps-pulley': 'triceps', 'triceps-testa': 'triceps', 'triceps-frances': 'triceps', 'mergulho-banco': 'triceps',
  agachamento: 'agacha', 'leg-press': 'agacha', hack: 'agacha', afundo: 'afundo', bulgaro: 'afundo', extensora: 'extensora', flexora: 'flexora',
  'elev-pelvica': 'quadril', abdutora: 'perna', 'gluteo-cabo': 'perna', 'pant-pe': 'panturrilha', 'pant-sentado': 'panturrilha',
  abdominal: 'abdominal', 'abd-cabo': 'abdominal', prancha: 'prancha', 'elev-pernas': 'pernas',
};
const GRUPO_MOV = { Peito: 'supino', Costas: 'remada', Ombros: 'press', 'Bíceps': 'rosca', 'Tríceps': 'triceps', Pernas: 'agacha', 'Glúteos': 'quadril', Panturrilha: 'panturrilha', 'Abdômen': 'abdominal' };
const movDe = (exId) => MOV[EX_MOV[exId] || GRUPO_MOV[exById(exId).g] || 'press'];

/* desenha o boneco; valores "a;b" viram animação de ida e volta */
function exAnim(exId, size = 56) {
  const m = movDe(exId), dur = '1.8s', anim = (attr, v) => (String(v).includes(';') ? `<animate attributeName="${attr}" values="${v};${String(v).split(';')[0]}" dur="${dur}" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>` : '');
  const ini = (v) => String(v).split(';')[0];
  const svg = m.partes.map((p) => {
    if (p[0] === 'l') { const [, x1, y1, x2, y2] = p; return `<line x1="${ini(x1)}" y1="${ini(y1)}" x2="${ini(x2)}" y2="${ini(y2)}">${anim('x1', x1)}${anim('y1', y1)}${anim('x2', x2)}${anim('y2', y2)}</line>`; }
    if (p[0] === 'c') { const [, cx, cy, r] = p; return `<circle class="cab" cx="${ini(cx)}" cy="${ini(cy)}" r="${r}">${anim('cx', cx)}${anim('cy', cy)}</circle>`; }
    if (p[0] === 'p') { const [, cx, cy, r] = p; return `<circle class="peso" cx="${ini(cx)}" cy="${ini(cy)}" r="${r}">${anim('cx', cx)}${anim('cy', cy)}</circle>`; }
    if (p[0] === 'r') { const [, x, y, w, h] = p; return `<rect class="apoio" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`; }
    if (p[0] === 'g') return `<g><animateTransform attributeName="transform" type="translate" values="${p[1]};${p[1].split(';')[0]}" dur="${dur}" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;
    return '</g>';
  }).join('');
  return `<svg class="ex-anim" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Animação: ${m.nome}">${svg}</svg>`;
}
