'use strict';

const BLANK = '_';
const WILD = '*';
const MOVES = { L: -1, R: 1, S: 0, N: 0, '<': -1, '>': 1, '-': 0 };
const MOVE_NAMES = { '-1': 'L', 0: 'S', 1: 'R' };
const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 250, 1000, 5000]; // steps per second
const MAX_STEPS_PER_FRAME = 5000;
const RUN_LIMIT = 100_000;
const TRACE_LIMIT = 200;
const STORAGE_KEY = 'turing-bench:v1';

const EXAMPLES = [
  {
    name: 'Binary increment',
    start: 'right',
    accept: 'done',
    reject: '',
    input: '1011',
    program: `; Adds 1 to a binary number.
; Scan right to the end of the input...
right 0 0 R right
right 1 1 R right
right _ _ L carry

; ...then add one, propagating the carry leftwards.
carry 1 0 L carry
carry 0 1 S done
carry _ 1 S done`,
  },
  {
    name: 'Palindrome (a/b)',
    start: 'q0',
    accept: 'accept',
    reject: 'reject',
    input: 'abba',
    program: `; Accepts palindromes over {a, b}.
; Erase the leftmost symbol and remember it in the state.
q0 a _ R haveA
q0 b _ R haveB
q0 _ _ S accept

; Run to the right end of the remaining input.
haveA _ _ L matchA
haveA * * R haveA
haveB _ _ L matchB
haveB * * R haveB

; The rightmost symbol must match the remembered one.
matchA a _ L back
matchA b b S reject
matchA _ _ S accept
matchB b _ L back
matchB a a S reject
matchB _ _ S accept

; Return to the left end and repeat.
back _ _ R q0
back * * L back`,
  },
  {
    name: 'aⁿbⁿ',
    start: 'q0',
    accept: 'accept',
    reject: '',
    input: 'aabb',
    program: `; Accepts a^n b^n (n >= 0) by crossing off matching pairs.
; Missing rules halt the machine, which counts as a reject.
q0 a X R q1
q0 Y Y R q3
q0 _ _ S accept

; Find the first unmatched b and cross it off.
q1 a a R q1
q1 Y Y R q1
q1 b Y L q2

; Walk back to the last crossed-off a.
q2 a a L q2
q2 Y Y L q2
q2 X X R q0

; Every a is matched: only Ys may remain.
q3 Y Y R q3
q3 _ _ S accept`,
  },
  {
    name: 'Unary addition',
    start: 'q0',
    accept: 'done',
    reject: '',
    input: '111+11',
    program: `; Computes m + n in unary: 111+11 becomes 11111.
; Replace the + with a 1...
q0 1 1 R q0
q0 + 1 R q1

; ...then erase one 1 from the end.
q1 1 1 R q1
q1 _ _ L q2
q2 1 _ S done`,
  },
  {
    name: '3-state busy beaver',
    start: 'A',
    accept: 'H',
    reject: '',
    input: '',
    program: `; Starts on a blank tape, halts after 14 steps with six 1s.
A _ 1 R B
A 1 1 R H
B _ _ R C
B 1 1 R B
C _ 1 L C
C 1 1 L A`,
  },
];

/* ---------- Parsing ---------- */

const unique = (xs) => [...new Set(xs)];
const splitStates = (s) => s.split(/[\s,]+/).filter(Boolean);
const ruleKey = (state, sym) => `${state} ${sym}`;

function parseProgram(text) {
  const rules = [];
  const errors = [];
  const index = new Map();

  text.split('\n').forEach((raw, i) => {
    const line = i + 1;
    const content = raw.replace(/;.*$/, '').replace(/->|→|,/g, ' ').trim();
    if (!content) return;

    const parts = content.split(/\s+/);
    if (parts.length !== 5) {
      errors.push({ line, msg: `expected 5 fields (state read write move next), got ${parts.length}` });
      return;
    }

    const [state, read, write, moveRaw, next] = parts;
    const move = moveRaw.toUpperCase();
    const problems = [];
    if (state === WILD) problems.push('"*" cannot be a state name');
    if ([...read].length !== 1) problems.push(`read symbol "${read}" must be a single character`);
    if ([...write].length !== 1) problems.push(`write symbol "${write}" must be a single character`);
    if (!Object.hasOwn(MOVES, move)) problems.push(`move "${moveRaw}" must be L, R or S`);

    const key = ruleKey(state, read);
    if (index.has(key)) problems.push(`duplicate rule for (${state}, ${read}), first defined on line ${index.get(key).line}`);

    if (problems.length) {
      problems.forEach((msg) => errors.push({ line, msg }));
      return;
    }

    const rule = { state, read, write, dir: MOVES[move], next, line };
    rules.push(rule);
    index.set(key, rule);
  });

  return { rules, index, errors };
}

function compile(source) {
  const { rules, index, errors } = parseProgram(source.program);
  const start = source.start.trim();
  if (!start) errors.unshift({ line: 0, msg: 'start state is required' });
  else if (/\s/.test(start)) errors.unshift({ line: 0, msg: 'start state cannot contain spaces' });
  if (errors.length) return { errors };

  const accept = new Set(splitStates(source.accept));
  const reject = new Set(splitStates(source.reject));
  const states = unique([
    start,
    ...rules.map((r) => r.state),
    ...rules.map((r) => r.next).filter((s) => s !== WILD),
    ...accept,
    ...reject,
  ]);
  const symbols = unique([...rules.map((r) => r.read), ...rules.map((r) => r.write)]).filter(
    (s) => s !== WILD && s !== BLANK,
  );
  const columns = [...symbols, BLANK, ...(rules.some((r) => r.read === WILD) ? [WILD] : [])];

  return { errors: [], def: { rules, index, start, accept, reject, states, columns } };
}

/* ---------- Machine ---------- */

const findRule = (def, state, sym) => def.index.get(ruleKey(state, sym)) ?? def.index.get(ruleKey(state, WILD));
const readCell = (m) => m.tape.get(m.head) ?? BLANK;

function describe(rule, state, sym) {
  return {
    write: rule.write === WILD ? sym : rule.write,
    move: MOVE_NAMES[rule.dir],
    next: rule.next === WILD ? state : rule.next,
  };
}

function createMachine(def, input) {
  const tape = new Map();
  [...input].forEach((ch, i) => {
    if (ch !== BLANK && !/\s/.test(ch)) tape.set(i, ch);
  });
  return { def, tape, head: 0, state: def.start, history: [] };
}

function haltInfo(m) {
  const { def, state } = m;
  if (def.accept.has(state)) return { verdict: 'accept', reason: `reached accept state ${state}` };
  if (def.reject.has(state)) return { verdict: 'reject', reason: `reached reject state ${state}` };
  const sym = readCell(m);
  if (findRule(def, state, sym)) return null;
  const reason = `no rule for (${state}, ${sym})`;
  return def.accept.size
    ? { verdict: 'reject', reason: `${reason}, implicit reject` }
    : { verdict: 'halt', reason };
}

function step(m) {
  if (haltInfo(m)) return false;
  const sym = readCell(m);
  const rule = findRule(m.def, m.state, sym);
  const { write, next } = describe(rule, m.state, sym);
  m.history.push({ head: m.head, state: m.state, sym: m.tape.get(m.head), rule });
  if (write === BLANK) m.tape.delete(m.head);
  else m.tape.set(m.head, write);
  m.head += rule.dir;
  m.state = next;
  return true;
}

function undo(m) {
  const entry = m.history.pop();
  if (!entry) return false;
  m.head = entry.head;
  m.state = entry.state;
  if (entry.sym === undefined) m.tape.delete(entry.head);
  else m.tape.set(entry.head, entry.sym);
  return true;
}

/* ---------- App state & persistence ---------- */

const $ = (id) => document.getElementById(id);
const els = {
  input: $('input'),
  tape: $('tape'),
  strip: $('strip'),
  headState: $('head-state'),
  roState: $('ro-state'),
  roStep: $('ro-step'),
  roHead: $('ro-head'),
  roRead: $('ro-read'),
  next: $('next'),
  btnReset: $('btn-reset'),
  btnBackN: $('btn-back-n'),
  btnPrev: $('btn-prev'),
  btnPlay: $('btn-play'),
  btnNext: $('btn-next'),
  btnFwdN: $('btn-fwd-n'),
  btnRun: $('btn-run'),
  stepN: $('step-n'),
  speed: $('speed'),
  speedOut: $('speed-out'),
  examples: $('examples'),
  start: $('start'),
  accept: $('accept'),
  reject: $('reject'),
  program: $('program'),
  gutter: $('gutter'),
  errors: $('errors'),
  dirty: $('dirty'),
  btnLoad: $('btn-load'),
  table: $('table'),
  tableMeta: $('table-meta'),
  trace: $('trace'),
};

const SOURCE_FIELDS = ['start', 'accept', 'reject', 'program'];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const app = {
  saved: loadSaved(),
  def: null,
  machine: null,
  loadedKey: null,
  playing: false,
  raf: 0,
  notice: '',
  tableRows: new Map(),
  tableCells: new Map(),
  highlighted: [],
};

function exampleSource(ex) {
  return { start: ex.start, accept: ex.accept, reject: ex.reject, program: ex.program, input: ex.input };
}

function loadSaved() {
  const fallback = { ...exampleSource(EXAMPLES[0]), speed: 3, stepN: 10 };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object') return fallback;
    const merged = { ...fallback };
    for (const key of [...SOURCE_FIELDS, 'input']) {
      if (typeof stored[key] === 'string') merged[key] = stored[key];
    }
    if (Number.isInteger(stored.speed) && SPEEDS[stored.speed]) merged.speed = stored.speed;
    if (Number.isInteger(stored.stepN) && stored.stepN > 0) merged.stepN = stored.stepN;
    return merged;
  } catch {
    return fallback;
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.saved));
  } catch {
    // Storage can be unavailable (private mode, file:// quirks); the app still works.
  }
}

const sourceKey = (s) => JSON.stringify(SOURCE_FIELDS.map((f) => s[f]));
const fmt = (n) => n.toLocaleString('en-US');
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function stepN() {
  const n = Number.parseInt(els.stepN.value, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 1_000_000) : 1;
}

/* ---------- Loading ---------- */

function loadMachine() {
  const { def, errors } = compile(app.saved);
  if (errors.length) {
    validate();
    return;
  }
  pause();
  app.def = def;
  app.loadedKey = sourceKey(app.saved);
  renderTable();
  resetMachine();
  validate();
}

function resetMachine() {
  pause();
  app.notice = '';
  if (app.def) app.machine = createMachine(app.def, app.saved.input);
  render();
}

/* ---------- Actions ---------- */

function act(fn) {
  pause();
  app.notice = '';
  fn();
}

function next() {
  const m = app.machine;
  const from = m.head;
  if (step(m)) render({ from, touched: from });
}

function prev() {
  const m = app.machine;
  const from = m.head;
  if (undo(m)) render({ from, touched: m.head });
}

function forward(n) {
  const m = app.machine;
  for (let i = 0; i < n && step(m); i++);
  render();
}

function back(n) {
  const m = app.machine;
  for (let i = 0; i < n && undo(m); i++);
  render();
}

function jumpTo(target) {
  const m = app.machine;
  while (m.history.length > target && undo(m));
  render();
}

function runToHalt() {
  const m = app.machine;
  let i = 0;
  while (i < RUN_LIMIT && step(m)) i++;
  if (!haltInfo(m)) app.notice = `Paused after ${fmt(RUN_LIMIT)} steps: this machine may never halt.`;
  render();
}

function play() {
  const m = app.machine;
  if (!m || haltInfo(m)) return;
  app.playing = true;
  app.notice = '';
  let last = performance.now();
  let budget = 1; // take the first step immediately

  const tick = (now) => {
    const rate = SPEEDS[app.saved.speed];
    budget += (Math.max(0, now - last) / 1000) * rate;
    last = now;
    const due = Math.floor(budget);
    budget -= due;

    const from = m.head;
    let done = 0;
    while (done < Math.min(due, MAX_STEPS_PER_FRAME) && step(m)) done++;
    if (done === 1 && rate <= 15) render({ from, touched: from, duration: Math.min(220, 700 / rate) });
    else if (done) render();

    if (haltInfo(m)) pause();
    else app.raf = requestAnimationFrame(tick);
  };

  app.raf = requestAnimationFrame(tick);
  render();
}

function pause() {
  if (!app.playing) return;
  app.playing = false;
  cancelAnimationFrame(app.raf);
  render();
}

const togglePlay = () => (app.playing ? pause() : play());

/* ---------- Rendering ---------- */

function render(anim = {}) {
  const m = app.machine;
  const halt = m && haltInfo(m);
  renderReadout(m);
  renderTape(m, halt, anim);
  renderNext(m, halt);
  renderTableHighlight(m, halt);
  renderTrace(m);
  renderControls(m, halt);
}

function renderReadout(m) {
  els.roState.textContent = m ? m.state : '—';
  els.roStep.textContent = m ? fmt(m.history.length) : '0';
  els.roHead.textContent = m ? m.head : '0';
  els.roRead.textContent = m ? readCell(m) : BLANK;
}

function renderTape(m, halt, { from, touched, duration = 220 }) {
  els.tape.dataset.verdict = halt?.verdict ?? '';
  els.headState.textContent = m ? m.state : '—';
  if (!m) {
    els.strip.innerHTML = '';
    return;
  }

  const width = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 56;
  const radius = Math.ceil(els.tape.clientWidth / width / 2) + 2;
  let html = '';
  for (let i = m.head - radius; i <= m.head + radius; i++) {
    const sym = m.tape.get(i);
    const cls = ['cell', i === m.head && 'is-head', sym === undefined && 'is-blank', i === touched && 'is-touched']
      .filter(Boolean)
      .join(' ');
    html += `<div class="${cls}"><span class="sym">${esc(sym ?? BLANK)}</span><span class="idx">${i}</span></div>`;
  }
  els.strip.innerHTML = html;

  // Slide from the previous head position so the tape visibly moves under the head.
  if (from !== undefined && from !== m.head && !reducedMotion.matches) {
    const dx = (m.head - from) * width;
    els.strip.animate(
      [{ transform: `translateX(calc(-50% + ${dx}px))` }, { transform: 'translateX(-50%)' }],
      { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  }
}

function renderNext(m, halt) {
  const notice = app.notice ? `<span class="notice">${esc(app.notice)}</span>` : '';
  if (!m) {
    els.next.innerHTML = '<span class="muted">Fix the program errors, then load the machine.</span>';
    return;
  }
  if (halt) {
    const label = { accept: 'ACCEPTED', reject: 'REJECTED', halt: 'HALTED' }[halt.verdict];
    els.next.innerHTML = `<span class="verdict ${halt.verdict}">${label}</span>
      <span>${esc(halt.reason)} after ${fmt(m.history.length)} step${m.history.length === 1 ? '' : 's'}</span>${notice}`;
    return;
  }
  const sym = readCell(m);
  const rule = findRule(m.def, m.state, sym);
  const d = describe(rule, m.state, sym);
  els.next.innerHTML = `<span class="label">Next</span>
    <code class="pill">(<b>${esc(m.state)}</b>, <b>${esc(sym)}</b>)</code>
    <span aria-hidden="true">→</span>
    <code class="pill">write <b>${esc(d.write)}</b></code>
    <code class="pill">move <b>${d.move}</b></code>
    <code class="pill">go to <b>${esc(d.next)}</b></code>
    <span class="line-ref">line ${rule.line}</span>${notice}`;
}

function renderTable() {
  const { states, columns, index, start, accept, reject, rules } = app.def;
  els.tableMeta.textContent = `${states.length} states · ${rules.length} rules`;

  if (!rules.length) {
    els.table.innerHTML = '<p class="empty-state">No rules yet.</p>';
    app.tableRows = new Map();
    app.tableCells = new Map();
    return;
  }

  const headCells = columns.map((s) => `<th scope="col">${esc(s)}</th>`).join('');
  const body = states
    .map((st) => {
      const tags = [
        st === start && '<span class="tag start">start</span>',
        accept.has(st) && '<span class="tag accept">accept</span>',
        reject.has(st) && '<span class="tag reject">reject</span>',
      ]
        .filter(Boolean)
        .join('');
      const cells = columns
        .map((sym) => {
          const r = index.get(ruleKey(st, sym));
          if (!r) return '<td class="empty">·</td>';
          return `<td data-key="${esc(ruleKey(st, sym))}" title="line ${r.line}"><span class="w">${esc(r.write)}</span> <span class="mv">${MOVE_NAMES[r.dir]}</span> <span class="nx">${esc(r.next)}</span></td>`;
        })
        .join('');
      return `<tr data-state="${esc(st)}"><th scope="row">${esc(st)}${tags}</th>${cells}</tr>`;
    })
    .join('');

  els.table.innerHTML = `<table><thead><tr><th scope="col">state \\ read</th>${headCells}</tr></thead><tbody>${body}</tbody></table>`;
  app.tableRows = new Map([...els.table.querySelectorAll('tr[data-state]')].map((tr) => [tr.dataset.state, tr]));
  app.tableCells = new Map([...els.table.querySelectorAll('td[data-key]')].map((td) => [td.dataset.key, td]));
}

function renderTableHighlight(m, halt) {
  app.highlighted.forEach((el) => el.classList.remove('is-current', 'is-next'));
  app.highlighted = [];
  if (!m) return;

  const row = app.tableRows.get(m.state);
  if (row) {
    row.classList.add('is-current');
    app.highlighted.push(row);
  }
  if (halt) return;
  const rule = findRule(m.def, m.state, readCell(m));
  const cell = app.tableCells.get(ruleKey(rule.state, rule.read));
  if (cell) {
    cell.classList.add('is-next');
    app.highlighted.push(cell);
  }
}

function renderTrace(m) {
  if (!m) {
    els.trace.innerHTML = '';
    return;
  }
  const h = m.history;
  const first = Math.max(0, h.length - TRACE_LIMIT);
  let html = '';
  for (let i = h.length - 1; i >= first; i--) {
    const e = h[i];
    const sym = e.sym ?? BLANK;
    const d = describe(e.rule, e.state, sym);
    html += `<li><button type="button" class="trace-row${i === h.length - 1 ? ' is-current' : ''}" data-step="${i + 1}">
      <span class="n">${fmt(i + 1)}</span>
      <span>(${esc(e.state)}, ${esc(sym)}) → (${esc(d.write)}, ${d.move}, ${esc(d.next)})</span>
      <span class="ln">line ${e.rule.line}</span></button></li>`;
  }
  if (first > 0) html += `<li class="trace-more">… ${fmt(first)} earlier steps</li>`;
  html += `<li><button type="button" class="trace-row${h.length === 0 ? ' is-current' : ''}" data-step="0">
    <span class="n">0</span><span>start in ${esc(m.def.start)} at cell 0</span><span class="ln"></span></button></li>`;
  els.trace.innerHTML = html;
}

function renderControls(m, halt) {
  const canBack = !!m && m.history.length > 0;
  const canForward = !!m && !halt;
  els.btnReset.disabled = !m;
  els.btnPrev.disabled = !canBack;
  els.btnBackN.disabled = !canBack;
  els.btnNext.disabled = !canForward;
  els.btnFwdN.disabled = !canForward;
  els.btnRun.disabled = !canForward;
  els.btnPlay.disabled = !canForward && !app.playing;
  els.btnPlay.textContent = app.playing ? 'Pause' : 'Play';
  const n = fmt(stepN());
  els.btnBackN.textContent = `−${n}`;
  els.btnFwdN.textContent = `+${n}`;
  els.speedOut.textContent = `${fmt(SPEEDS[app.saved.speed])}/s`;
}

/* ---------- Editor ---------- */

function fillEditor() {
  for (const f of SOURCE_FIELDS) els[f].value = app.saved[f];
  els.input.value = app.saved.input;
  els.speed.value = app.saved.speed;
  els.stepN.value = app.saved.stepN;
}

function validate() {
  const { errors } = compile(app.saved);
  const errorLines = new Set(errors.map((e) => e.line));
  const lineCount = els.program.value.split('\n').length;
  let gutter = '';
  for (let i = 1; i <= lineCount; i++) gutter += `<div${errorLines.has(i) ? ' class="err"' : ''}>${i}</div>`;
  els.gutter.innerHTML = gutter;
  els.gutter.scrollTop = els.program.scrollTop;

  els.errors.innerHTML = errors
    .map((e) => `<li>${e.line ? `<b>line ${e.line}:</b> ` : ''}${esc(e.msg)}</li>`)
    .join('');

  const dirty = sourceKey(app.saved) !== app.loadedKey;
  els.btnLoad.disabled = errors.length > 0;
  els.dirty.dataset.state = errors.length ? 'error' : dirty ? 'dirty' : 'ok';
  els.dirty.textContent = errors.length
    ? `${errors.length} error${errors.length === 1 ? '' : 's'}`
    : dirty
      ? 'Edited: load to apply (resets the run)'
      : 'Loaded';
}

/* ---------- Events ---------- */

els.examples.innerHTML =
  '<option value="">Load example…</option>' +
  EXAMPLES.map((ex, i) => `<option value="${i}">${esc(ex.name)}</option>`).join('');

els.examples.addEventListener('change', () => {
  const ex = EXAMPLES[els.examples.value];
  els.examples.value = '';
  if (!ex) return;
  const isUnmodifiedExample = EXAMPLES.some((x) => sourceKey(x) === sourceKey(app.saved));
  if (!isUnmodifiedExample && !confirm('Replace your current program with this example?')) return;
  Object.assign(app.saved, exampleSource(ex));
  save();
  fillEditor();
  loadMachine();
});

for (const f of SOURCE_FIELDS) {
  els[f].addEventListener('input', () => {
    app.saved[f] = els[f].value;
    save();
    validate();
  });
}

els.program.addEventListener('scroll', () => {
  els.gutter.scrollTop = els.program.scrollTop;
});

for (const el of [els.program, els.start, els.accept, els.reject]) {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || el !== els.program)) {
      e.preventDefault();
      loadMachine();
    }
  });
}

els.btnLoad.addEventListener('click', loadMachine);

els.input.addEventListener('input', () => {
  app.saved.input = els.input.value;
  save();
  resetMachine();
});

els.speed.addEventListener('input', () => {
  app.saved.speed = Number(els.speed.value);
  save();
  renderControls(app.machine, app.machine && haltInfo(app.machine));
});

els.stepN.addEventListener('input', () => {
  app.saved.stepN = stepN();
  save();
  renderControls(app.machine, app.machine && haltInfo(app.machine));
});

els.btnReset.addEventListener('click', () => act(resetMachine));
els.btnPrev.addEventListener('click', () => act(prev));
els.btnNext.addEventListener('click', () => act(next));
els.btnBackN.addEventListener('click', () => act(() => back(stepN())));
els.btnFwdN.addEventListener('click', () => act(() => forward(stepN())));
els.btnRun.addEventListener('click', () => act(runToHalt));
els.btnPlay.addEventListener('click', togglePlay);

els.trace.addEventListener('click', (e) => {
  const row = e.target.closest('[data-step]');
  if (row && app.machine) act(() => jumpTo(Number(row.dataset.step)));
});

document.addEventListener('keydown', (e) => {
  if (!app.machine || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === ' ' && e.target.closest('button')) return; // let buttons handle their own activation

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      act(() => (e.shiftKey ? forward(stepN()) : next()));
      break;
    case 'ArrowLeft':
      e.preventDefault();
      act(() => (e.shiftKey ? back(stepN()) : prev()));
      break;
    case ' ':
      e.preventDefault();
      togglePlay();
      break;
    case 'r':
    case 'R':
      act(resetMachine);
      break;
  }
});

window.addEventListener('resize', () => render());

/* ---------- Boot ---------- */

fillEditor();
loadMachine();
if (!app.def) render();
