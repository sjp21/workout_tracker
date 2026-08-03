import { PROGRAM, MUSCLE_GROUPS } from '../data/program.js';
import { calculateTargets, totalsForDay, todayKey } from '../lib/nutrition.js';
import { weeklyVolume, volumeStatus, mondayOf } from '../lib/volume.js';
import { weekStats, rollTargets, suggestWeek, vigorousOffer, VIGOROUS_OFFER_COPY, SESSION_FLOOR } from '../lib/cardio.js';
import { defaultCardio } from '../storage/migrations.js';
import { ctx } from './ctx.js';
import { openCardioLog, openCardioHistory } from './modals.js';

export function renderToday({ goTrain, goFuel }) {
  const rerender = () => renderToday({ goTrain, goFuel });

  // Roll the cardio target ledger up to the current week (Monday boundary).
  // The migration guarantees state.cardio exists; the guard covers a remote
  // blob that predates v2 sneaking past it.
  if (!ctx.state.cardio) ctx.state.cardio = defaultCardio();
  const roll = rollTargets(ctx.state.cardio, new Date());
  if (roll.changed) {
    ctx.state.cardio.weeklyTargetMin = roll.weeklyTargetMin;
    ctx.state.cardio.targetHistory = roll.targetHistory;
    ctx.commit();
  }

  const view = document.getElementById('todayView');
  view.innerHTML = `
    ${renderBodyweightCard()}
    ${renderTrainingCard()}
    ${renderCardioCard()}
    ${renderFuelCard()}
    ${renderVolumeCard()}
  `;

  view.querySelectorAll('[data-action="goTrain"]').forEach((el) => el.addEventListener('click', goTrain));
  view.querySelectorAll('[data-action="goFuel"]').forEach((el) => el.addEventListener('click', goFuel));

  view.querySelectorAll('[data-action="logCardio"]').forEach((el) =>
    el.addEventListener('click', () => openCardioLog({ onSaved: rerender })));
  view.querySelectorAll('[data-action="cardioHistory"]').forEach((el) =>
    el.addEventListener('click', openCardioHistory));
  view.querySelectorAll('[data-action="unlockVigorous"]').forEach((el) =>
    el.addEventListener('click', () => {
      ctx.state.cardio.vigorousUnlocked = true;
      ctx.commit();
      rerender();
    }));

  // Start the rotation over at Day 1 — Push. Resets only the "next workout"
  // cursor; logged history stays untouched ("save the current week as is").
  view.querySelectorAll('[data-action="resetWeek"]').forEach((el) => el.addEventListener('click', () => {
    if (!confirm('Start the week over at Day 1 — Push?\n\nYour logged history is kept; this only resets which workout comes next.')) return;
    ctx.state.currentDayIdx = 0;
    ctx.commit();
    renderToday({ goTrain, goFuel });
  }));

  const bwBtn = view.querySelector('#logBwBtn');
  if (bwBtn) bwBtn.addEventListener('click', () => {
    const input = view.querySelector('#bwInput');
    const lb = parseFloat(input.value);
    if (!lb || lb < 50 || lb > 600) return alert('Enter a weight between 50 and 600 lb.');
    const today = todayKey();
    if (!Array.isArray(ctx.state.bodyweight)) ctx.state.bodyweight = [];
    // Replace any existing entry for the same calendar week.
    const week = mondayOf(today);
    ctx.state.bodyweight = ctx.state.bodyweight.filter((e) => mondayOf(e.date) !== week);
    ctx.state.bodyweight.push({ date: today, lb });
    ctx.state.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
    ctx.commit();
    renderToday({ goTrain, goFuel });
  });
}

// Weekly bodyweight card. Single number per week, Mon-anchored. Quiet tile
// when this week's entry is already logged. Prompts on Monday and stays
// visible until the user records something. Spot-reducing fat isn't a thing,
// so we never promise the spot — just track the trend.
function renderBodyweightCard() {
  const bw = Array.isArray(ctx.state.bodyweight) ? ctx.state.bodyweight : [];
  const today = todayKey();
  const week = mondayOf(today);
  const thisWeek = bw.find((e) => mondayOf(e.date) === week);
  const last = bw.length > 0 ? bw[bw.length - 1] : null;

  if (thisWeek) {
    // Show last + prior delta if available
    let trend = '';
    if (bw.length >= 2) {
      const prior = bw[bw.length - 2];
      const delta = thisWeek.lb - prior.lb;
      const sign = delta > 0 ? '+' : '';
      trend = `<span style="color: var(--ink-dim); font-size: 11px; margin-left: 8px;">${sign}${delta.toFixed(1)} lb vs ${prior.date}</span>`;
    }
    return `
      <div class="today-card quiet">
        <div class="tc-head">
          <div class="tc-title">Bodyweight</div>
          <div class="tc-sub">This week</div>
        </div>
        <div class="tc-stat">${thisWeek.lb}<span class="unit">lb</span>${trend}</div>
      </div>
    `;
  }

  // No entry yet this week
  return `
    <div class="today-card">
      <div class="tc-head">
        <div class="tc-title">Weekly weigh-in</div>
        <div class="tc-sub">${last ? `last: ${last.lb} lb · ${last.date}` : 'no log yet'}</div>
      </div>
      <div class="tc-body">Log once a week, morning before food. Trend &gt; daily noise.</div>
      <div class="bw-row">
        <input type="number" inputmode="decimal" step="0.1" class="bw-input" id="bwInput" placeholder="lb" />
        <button class="tc-action primary" id="logBwBtn">Log</button>
      </div>
    </div>
  `;
}

function renderTrainingCard() {
  const day = PROGRAM[ctx.state.currentDayIdx];
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const session = ctx.state.currentSession || {};
  const doneSets = day.exercises.reduce(
    (a, e) => a + ((session[e.id] || []).filter((s) => s.done).length || 0),
    0
  );
  return `
    <div class="today-card">
      <div class="tc-head">
        <div class="tc-title">Today's training</div>
        <div class="tc-sub">Day ${ctx.state.currentDayIdx + 1} · ${day.name}</div>
      </div>
      <div class="tc-body">${day.focus}</div>
      <div class="tc-stat" style="margin-top:8px;">${doneSets}<span class="unit">/ ${totalSets} sets</span></div>
      <button class="tc-action primary" data-action="goTrain">${doneSets > 0 ? 'Continue session' : 'Start session'}</button>
      <button class="tc-action" data-action="resetWeek">Start week over</button>
    </div>
  `;
}

// Cardio card: weekly zone-2 minutes vs the engine-managed target, Mon-anchored.
// Tap the headline for the recent-weeks history; the engine's target-change
// message shows all week, citation included, like lifting's suggestNext.
function renderCardioCard() {
  const cardio = ctx.state.cardio;
  const week = mondayOf(todayKey());
  const { minutes, count } = weekStats(cardio.sessions, week);
  const target = cardio.weeklyTargetMin;
  // Plan: surface the engine's message when it CHANGES the target (plus the
  // starting message). A plain hold stays quiet — the headline carries it.
  const s = suggestWeek(cardio, new Date());
  const suggestion = s && s.action !== 'hold' ? s : null;
  const offer = vigorousOffer(cardio, new Date());

  return `
    <div class="today-card">
      <div class="tc-head" data-action="cardioHistory" style="cursor:pointer;">
        <div class="tc-title">Cardio</div>
        <div class="tc-sub">zone 2 · talk-test pace${cardio.vigorousUnlocked ? ' · 4×4 ok' : ''}</div>
      </div>
      <div class="tc-stat" data-action="cardioHistory" style="cursor:pointer;">${minutes}<span class="unit">/ ${target} min · ${count} of ${SESSION_FLOOR} sessions</span></div>
      ${suggestion ? `<div class="cardio-suggest">${suggestion.message}</div>` : ''}
      ${offer ? `
        <div class="cardio-suggest">${VIGOROUS_OFFER_COPY}</div>
        <button class="tc-action" data-action="unlockVigorous">Add 4×4 as an option</button>
      ` : ''}
      <button class="tc-action primary" data-action="logCardio">Log session</button>
    </div>
  `;
}

function renderFuelCard() {
  if (!ctx.state.profile) {
    return `
      <div class="today-card">
        <div class="tc-head">
          <div class="tc-title">Fuel</div>
          <div class="tc-sub">setup needed</div>
        </div>
        <div class="tc-body">Set up your profile to see calorie + macro targets.</div>
        <button class="tc-action primary" data-action="goFuel">Open Fuel →</button>
      </div>
    `;
  }
  const t = calculateTargets(ctx.state.profile);
  const totals = totalsForDay(ctx.state.foodLog, todayKey());
  const remaining = Math.max(0, t.kcal - totals.kcal);
  const proteinPct = Math.min(100, Math.round((totals.protein / t.protein) * 100));
  return `
    <div class="today-card">
      <div class="tc-head">
        <div class="tc-title">Fuel</div>
        <div class="tc-sub">${totals.kcal} / ${t.kcal} kcal</div>
      </div>
      <div class="tc-body">
        Protein: <strong style="color:var(--accent)">${Math.round(totals.protein)}g</strong> / ${t.protein}g
        (${proteinPct}%)<br/>
        ${remaining > 0 ? `${remaining} kcal remaining` : 'budget hit'}
      </div>
      <button class="tc-action" data-action="goFuel">Log a meal →</button>
    </div>
  `;
}

// Weekly volume strip: 8 muscles + core, primary-mover credit. Mon-anchored
// week. Bars color-graded by Schoenfeld 2017 dose-response thresholds.
function renderVolumeCard() {
  const v = weeklyVolume(ctx.state.history || {}, new Date());
  return `
    <div class="today-card">
      <div class="tc-head">
        <div class="tc-title">Weekly volume</div>
        <div class="tc-sub">target 10+ sets · primary mover credit</div>
      </div>
      <div class="volume-strip">
        ${MUSCLE_GROUPS.map((m) => {
          const count = v[m] || 0;
          const status = volumeStatus(count);
          const pct = Math.min(100, (count / 12) * 100);
          return `
            <div class="volume-row">
              <div class="volume-label">${m}</div>
              <div class="volume-bar"><div class="volume-bar-fill ${status}" style="width:${pct}%"></div></div>
              <div class="volume-count">${count}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
