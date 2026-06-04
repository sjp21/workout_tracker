import { PROGRAM } from '../data/program.js';
import { suggestNext } from '../lib/progression.js';
import * as rest from './restTimer.js';
import { ctx } from './ctx.js';

export function renderTabs() {
  const tabs = document.getElementById('dayTabs');
  tabs.innerHTML = PROGRAM.map((d, i) => `
    <button class="day-tab ${i === ctx.state.currentDayIdx ? 'active' : ''}" data-day-idx="${i}">
      <span class="day-num">${i + 1}</span>
      ${d.name}
    </button>
  `).join('');
  tabs.querySelectorAll('.day-tab').forEach((el) => {
    el.addEventListener('click', () => switchDay(parseInt(el.dataset.dayIdx)));
  });
}

function switchDay(i) {
  rest.stop();
  ctx.state.currentDayIdx = i;
  ctx.commit();
  renderTabs();
  renderDay();
  window.scrollTo(0, 0);
}

export function renderDay() {
  const day = PROGRAM[ctx.state.currentDayIdx];
  const view = document.getElementById('dayView');

  day.exercises.forEach((ex) => {
    if (!ctx.state.currentSession[ex.id]) {
      const sug = suggestNext(ex, ctx.state.history[ex.id]);
      ctx.state.currentSession[ex.id] = Array.from({ length: ex.sets }, () => ({
        weight: sug.weight || '',
        reps: '',
        rir: '2',
        done: false
      }));
    }
  });

  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = day.exercises.reduce((a, e) => a + ctx.state.currentSession[e.id].filter((s) => s.done).length, 0);

  view.innerHTML = `
    <div class="day-header">
      <div class="day-title">${day.name}</div>
      <div class="day-subtitle">${day.focus}</div>
      <div class="session-meta">
        <div><div class="label">Exercises</div><div class="val">${day.exercises.length}</div></div>
        <div><div class="label">Total Sets</div><div class="val">${totalSets}</div></div>
        <div><div class="label">Completed</div><div class="val">${doneSets}/${totalSets}</div></div>
      </div>
    </div>
    ${day.exercises.map((ex) => renderExercise(ex)).join('')}
  `;

  view.querySelectorAll('.ex-head').forEach((el) => {
    el.addEventListener('click', () => {
      const exEl = el.closest('.exercise');
      exEl.classList.toggle('open');
    });
  });
  view.querySelectorAll('.set-input').forEach((el) => {
    el.addEventListener('change', () => {
      updateSet(el.dataset.exId, parseInt(el.dataset.setIdx), el.dataset.field, el.value);
    });
  });
  view.querySelectorAll('.rir-select').forEach((el) => {
    el.addEventListener('change', () => {
      updateSet(el.dataset.exId, parseInt(el.dataset.setIdx), 'rir', el.value);
    });
  });
  view.querySelectorAll('.set-check').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSet(el.dataset.exId, parseInt(el.dataset.setIdx));
    });
  });
}

function renderExercise(ex) {
  const sug = suggestNext(ex, ctx.state.history[ex.id]);
  const sets = ctx.state.currentSession[ex.id];
  const allDone = sets.every((s) => s.done);
  const hist = ctx.state.history[ex.id] || [];
  const last = hist[hist.length - 1];

  return `
    <div class="exercise ${allDone ? 'complete' : ''}" id="ex-${ex.id}">
      <div class="ex-head">
        <div>
          <div class="ex-name">${ex.name}</div>
          <div class="ex-tags">
            ${ex.tags.map((t) => `<span class="ex-tag">${t}</span>`).join('')}
            <span class="ex-tag">${ex.sets}×${ex.repLow}–${ex.repHigh}</span>
            <span class="ex-tag">${ex.rest}s rest</span>
          </div>
        </div>
        <div class="ex-suggest">
          <div class="weight">${sug.weight !== null ? sug.weight + ' lb' : '—'}</div>
          <div class="label">${sug.action === 'up' ? '+ progress' : sug.action === 'down' ? '↓ deload' : sug.action === 'hold' ? '→ hold' : 'start here'}</div>
        </div>
      </div>
      <div class="ex-body">
        ${last ? `<div class="last-session">Last: <span>${last.sets.filter((s) => s.done).map((s) => `${s.weight}×${s.reps}`).join(' · ') || 'none logged'}</span></div>` : ''}
        <div class="set-row header">
          <div>Set</div><div>Weight (lb)</div><div>Reps</div><div>RIR</div><div></div>
        </div>
        ${sets.map((s, i) => `
          <div class="set-row ${s.done ? 'done' : ''}" id="set-${ex.id}-${i}">
            <div class="set-num">${i + 1}</div>
            <input type="number" inputmode="decimal" step="2.5" class="set-input" value="${s.weight}"
                   data-ex-id="${ex.id}" data-set-idx="${i}" data-field="weight" placeholder="—" />
            <input type="number" inputmode="numeric" class="set-input" value="${s.reps}"
                   data-ex-id="${ex.id}" data-set-idx="${i}" data-field="reps" placeholder="—" />
            <select class="rir-select" data-ex-id="${ex.id}" data-set-idx="${i}">
              ${[0, 1, 2, 3, 4].map((r) => `<option value="${r}" ${String(s.rir) === String(r) ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            <button class="set-check" data-ex-id="${ex.id}" data-set-idx="${i}" aria-label="Mark set complete">
              <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 5" stroke="#0b0d0c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        `).join('')}
        <div class="progress-suggest ${sug.action === 'up' ? 'up' : sug.action === 'down' ? 'down' : 'hold'}">
          ${sug.message}
        </div>
      </div>
    </div>
  `;
}

function updateSet(exId, setIdx, field, value) {
  const s = ctx.state.currentSession[exId][setIdx];
  s[field] = field === 'weight' ? parseFloat(value) || '' : field === 'reps' ? parseInt(value) || '' : value;
  ctx.commit();
}

function toggleSet(exId, setIdx) {
  const s = ctx.state.currentSession[exId][setIdx];
  s.done = !s.done;
  ctx.commit();
  const row = document.getElementById(`set-${exId}-${setIdx}`);
  row.classList.toggle('done');
  const day = PROGRAM[ctx.state.currentDayIdx];
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = day.exercises.reduce((a, e) => a + ctx.state.currentSession[e.id].filter((set) => set.done).length, 0);
  const metaVals = document.querySelectorAll('.session-meta .val');
  if (metaVals[2]) metaVals[2].textContent = `${doneSets}/${totalSets}`;
  const allDone = ctx.state.currentSession[exId].every((set) => set.done);
  document.getElementById('ex-' + exId).classList.toggle('complete', allDone);
  if (s.done) {
    const ex = day.exercises.find((e) => e.id === exId);
    if (ex) rest.start(exId, setIdx, ex.rest);
  } else if (rest.isAttachedTo(exId, setIdx)) {
    rest.stop();
  }
}

export function saveSession({ onSaved }) {
  rest.stop();
  const day = PROGRAM[ctx.state.currentDayIdx];
  const date = new Date().toISOString().slice(0, 10);
  let saved = 0;
  day.exercises.forEach((ex) => {
    const sets = ctx.state.currentSession[ex.id];
    if (!sets) return;
    if (sets.some((s) => s.done)) {
      if (!ctx.state.history[ex.id]) ctx.state.history[ex.id] = [];
      ctx.state.history[ex.id].push({ date, sets: sets.map((s) => ({ ...s })) });
      saved++;
      ctx.state.currentSession[ex.id] = null;
    }
  });
  ctx.state.currentSession = {};
  ctx.commit();
  renderDay();
  if (onSaved) onSaved(saved);
}
