import { PROGRAM, MUSCLE_GROUPS } from '../data/program.js';
import { calculateTargets, totalsForDay, todayKey } from '../lib/nutrition.js';
import { weeklyVolume, volumeStatus, mondayOf } from '../lib/volume.js';
import { ctx } from './ctx.js';

export function renderToday({ goTrain, goFuel }) {
  const view = document.getElementById('todayView');
  view.innerHTML = `
    ${renderBodyweightCard()}
    ${renderTrainingCard()}
    ${renderFuelCard()}
    ${renderVolumeCard()}
  `;

  view.querySelectorAll('[data-action="goTrain"]').forEach((el) => el.addEventListener('click', goTrain));
  view.querySelectorAll('[data-action="goFuel"]').forEach((el) => el.addEventListener('click', goFuel));

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
