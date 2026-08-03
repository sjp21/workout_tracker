import { EVIDENCE } from '../data/evidence.js';
import { PROGRAM } from '../data/program.js';
import { calculateTargets, totalsForDay, todayKey } from '../lib/nutrition.js';
import { weekStats, feltBetterRate } from '../lib/cardio.js';
import { ctx } from './ctx.js';
import { isConfigured } from '../sync/supabase.js';
import { isLocalOnly } from './auth.js';

function open(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}

function close() {
  document.getElementById('modal').classList.remove('open');
}

export function setupModal() {
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') close();
  });
}

export function openGuide({ onReconnect } = {}) {
  // Offer a way back into cloud sync, but only when it's actually actionable:
  // Supabase is configured and the user previously chose "Continue without
  // account". Signed-in users and pure local builds don't see it.
  const showReconnect = onReconnect && isConfigured() && isLocalOnly();
  const reconnectSection = showReconnect ? `
    <h2 style="margin-top: 24px;">Sync</h2>
    <div class="sub">You're using this device-only</div>
    <p style="color: var(--ink-dim); font-size: 12px; line-height: 1.6; margin-bottom: 12px;">
      Your data lives on this device. Sign in to back it up and sync across devices.
    </p>
    <button class="nav-btn primary" style="width: 100%;" id="reconnectBtn">Sign in / sync</button>
  ` : '';
  open(`
    <h2>How To Use This App</h2>
    <div class="sub">An evidence-aligned 8-week protocol</div>
    <div class="guide-intro">
      This app is built around the principle that <strong>consistency with the right inputs</strong> produces growth — not heroic individual workouts. Each instruction below maps to a specific peer-reviewed finding. Read once, then refer back when in doubt.
    </div>
    <div class="guide-callout">
      <div class="heading">Before you start</div>
      Open the <strong>Fuel tab</strong> and complete your profile (weight, height, age, sex, activity, goal). The app uses the Mifflin-St Jeor equation to set your calorie target and macro split. Without this, the Fuel side won't work.
    </div>
    <div class="guide-section">
      <h3><span class="guide-num">1</span>Train 4 days per week</h3>
      <p>The program cycles Push → Pull → Legs → Upper. Hit each session once per week.</p>
      <div class="why"><strong>Why 4 days:</strong> Schoenfeld 2019's meta-analysis showed frequency doesn't change hypertrophy when volume is equated. 4 sessions is the lowest frequency that still hits the 10+ sets/muscle/week threshold.</div>
    </div>
    <div class="guide-section">
      <h3><span class="guide-num">2</span>Log every set with honest RIR</h3>
      <p>Target RIR is 2 on your first work set, 1 on your last. The auto-progression depends on it.</p>
      <div class="why"><strong>Why RIR matters:</strong> Refalo 2022 found RIR 1–3 matches failure-training for muscle growth with less burnout.</div>
    </div>
    <div class="guide-section">
      <h3><span class="guide-num">3</span>Rest the full prescribed time</h3>
      <p>When you mark a set complete, a countdown auto-starts under that set. Beeps + vibrates at zero.</p>
      <div class="why"><strong>Why long rest:</strong> Schoenfeld 2016 — 3-min rest beat 1-min rest for hypertrophy in trained men.</div>
    </div>
    <div class="guide-section">
      <h3><span class="guide-num">4</span>Hit protein every day</h3>
      <p>Distribute it across 4 meals with roughly equal amounts each.</p>
      <div class="why"><strong>Why distributed protein:</strong> Schoenfeld & Aragon 2018 — 0.4 g/kg per meal across ≥4 meals optimizes MPS.</div>
    </div>

    <h2 style="margin-top: 24px;">Citations</h2>
    <div class="sub">Every protocol decision · peer-reviewed only</div>
    ${EVIDENCE.map((e) => `
      <div class="citation">
        <div class="study">${e.study}</div>
        <div class="finding">${e.finding}</div>
        <div class="ref">${e.ref}</div>
      </div>
    `).join('')}
    ${reconnectSection}
    <button class="nav-btn primary" style="width: 100%; margin-top: 16px;" id="closeBtn">Got it</button>
  `);
  document.getElementById('closeBtn').addEventListener('click', close);
  if (showReconnect) {
    document.getElementById('reconnectBtn').addEventListener('click', () => {
      close();
      onReconnect();
    });
  }
}

// Quick-log for a cardio session. Save requires only duration + RPE; distance,
// mood, and note are optional and skipping them never blocks. Distance is
// display-only — the engine never reads it.
export function openCardioLog({ onSaved } = {}) {
  const MOODS = [
    { key: 'worse', label: 'worse' },
    { key: 'same', label: 'same' },
    { key: 'better', label: 'better' },
    { key: 'much_better', label: 'much better' }
  ];
  open(`
    <h2>Log cardio</h2>
    <div class="sub">zone 2 — you can speak full sentences</div>
    <div class="food-form" style="margin-bottom:0;">
      <div class="food-form-row">
        <div>
          <label class="field-label">Duration (min) — required</label>
          <input type="number" inputmode="numeric" id="cdMin" placeholder="e.g. 25" />
        </div>
        <div>
          <label class="field-label">RPE 0–10 — required · zone 2 ≈ 3–4 (full sentences ok)</label>
          <input type="number" inputmode="numeric" id="cdRpe" min="0" max="10" placeholder="3" />
        </div>
        <div>
          <label class="field-label">Distance (km) — optional, display only</label>
          <input type="number" inputmode="decimal" step="0.1" id="cdKm" placeholder="—" />
        </div>
        <div>
          <label class="field-label">Mood after — optional</label>
          <div class="mood-row">
            ${MOODS.map((m) => `<button type="button" class="mood-btn" data-mood="${m.key}">${m.label}</button>`).join('')}
          </div>
        </div>
        <div>
          <label class="field-label">Note — optional</label>
          <input type="text" id="cdNote" placeholder="" />
        </div>
      </div>
      <button class="add-btn" id="cdSave">Save session</button>
    </div>
  `);

  let mood = null;
  document.querySelectorAll('.mood-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.mood === mood ? null : btn.dataset.mood;
      mood = next;
      document.querySelectorAll('.mood-btn').forEach((b) =>
        b.classList.toggle('sel', b.dataset.mood === mood));
    });
  });

  document.getElementById('cdSave').addEventListener('click', () => {
    const minutes = parseInt(document.getElementById('cdMin').value, 10);
    const rpe = parseInt(document.getElementById('cdRpe').value, 10);
    if (!minutes || minutes < 1 || minutes > 600) return alert('Enter a duration between 1 and 600 minutes.');
    if (Number.isNaN(rpe) || rpe < 0 || rpe > 10) return alert('Enter an RPE from 0 to 10. Zone 2 feels like 3–4 — you can speak full sentences.');
    const km = parseFloat(document.getElementById('cdKm').value);
    const note = document.getElementById('cdNote').value.trim();

    const session = { date: todayKey(), minutes, rpe };
    if (km > 0) session.distanceKm = km;
    if (mood) session.mood = mood;
    if (note) session.note = note;

    ctx.state.cardio.sessions.push(session);
    ctx.commit();
    close();
    if (onSaved) onSaved();
  });
}

// Recent weeks: engine target vs actual minutes + session count, newest first,
// plus the personal felt-better rate once enough mood taps exist (labeled as
// the user's own pattern — never a mechanism claim).
export function openCardioHistory() {
  const cardio = ctx.state.cardio || { targetHistory: [], sessions: [] };
  const weeks = (cardio.targetHistory || []).slice(-8).reverse();
  const rate = feltBetterRate(cardio.sessions);

  if (weeks.length === 0 && (cardio.sessions || []).length === 0) {
    open(`
      <h2>Cardio</h2>
      <div class="sub">No sessions yet</div>
      <p style="color: var(--ink-dim); font-size: 12px; line-height: 1.6;">
        Log walks or runs from the Today card. Weekly minutes vs target will show here once you have history.
      </p>
      <button class="nav-btn primary" style="width:100%; margin-top:16px;" id="closeBtn">Close</button>
    `);
    document.getElementById('closeBtn').addEventListener('click', close);
    return;
  }

  open(`
    <h2>Cardio History</h2>
    <div class="sub">weekly minutes vs target · Mon-anchored</div>
    ${rate ? `
      <div style="background: var(--panel-2); padding: 12px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 12px; line-height: 1.5;">
        You tapped "better" or "much better" after <strong style="color: var(--accent);">${rate.pct}%</strong> of ${rate.n} rated sessions — your own logged pattern.
      </div>
    ` : ''}
    ${weeks.map(({ week, target }) => {
      const { minutes, count } = weekStats(cardio.sessions, week);
      const label = new Date(week + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `<div class="hist-row">
        <div class="date">wk of ${label}</div>
        <div class="data">${minutes} / ${target} min · ${count} session${count === 1 ? '' : 's'}</div>
      </div>`;
    }).join('')}
    <button class="nav-btn primary" style="width: 100%; margin-top: 16px;" id="closeBtn">Close</button>
  `);
  document.getElementById('closeBtn').addEventListener('click', close);
}

export function openHistory() {
  if (ctx.state.mode === 'fuel') {
    openNutritionHistory();
    return;
  }
  openTrainingHistory();
}

function openTrainingHistory() {
  const exWithHist = [];
  PROGRAM.forEach((d) => d.exercises.forEach((ex) => {
    if (ctx.state.history[ex.id] && ctx.state.history[ex.id].length > 0) {
      exWithHist.push({ ex, hist: ctx.state.history[ex.id] });
    }
  }));

  if (exWithHist.length === 0) {
    open(`
      <h2>History</h2>
      <div class="sub">No saved sessions yet</div>
      <p style="color: var(--ink-dim); font-size: 12px; line-height: 1.6;">
        Complete sets and tap "Save Session" to start building your training log. Once you have 2+ sessions per exercise, you'll see week-over-week trends here.
      </p>
      <button class="nav-btn primary" style="width:100%; margin-top:16px;" id="closeBtn">Close</button>
    `);
    document.getElementById('closeBtn').addEventListener('click', close);
    return;
  }

  open(`
    <h2>Training History</h2>
    <div class="sub">${exWithHist.length} exercises tracked</div>
    ${exWithHist.map(({ ex, hist }) => {
      const rows = hist.slice().reverse().map((entry, i, arr) => {
        const sets = entry.sets.filter((s) => s.done);
        const vol = sets.reduce((a, s) => a + s.weight * s.reps, 0);
        const prev = arr[i + 1];
        let trend = '';
        if (prev) {
          const prevVol = prev.sets.filter((s) => s.done).reduce((a, s) => a + s.weight * s.reps, 0);
          if (vol > prevVol) trend = `<span class="up">▲ +${Math.round(vol - prevVol)}</span>`;
          else if (vol < prevVol) trend = `<span class="down">▼ ${Math.round(vol - prevVol)}</span>`;
          else trend = '— flat';
        }
        return `<div class="hist-row">
          <div class="date">${entry.date}</div>
          <div class="data">${sets.map((s) => `${s.weight}×${s.reps}`).join(' · ')} · ${Math.round(vol)} vol ${trend}</div>
        </div>`;
      }).join('');
      return `<div class="hist-ex"><h3>${ex.name}</h3>${rows}</div>`;
    }).join('')}
    <button class="nav-btn primary" style="width: 100%; margin-top: 8px;" id="closeBtn">Close</button>
  `);
  document.getElementById('closeBtn').addEventListener('click', close);
}

function openNutritionHistory() {
  if (!ctx.state.profile) {
    open(`<h2>Nutrition History</h2><div class="sub">Set up your profile first</div><button class="nav-btn primary" style="width:100%;margin-top:16px;" id="closeBtn">Close</button>`);
    document.getElementById('closeBtn').addEventListener('click', close);
    return;
  }
  const targets = calculateTargets(ctx.state.profile);
  const dates = Object.keys(ctx.state.foodLog).sort().reverse();
  if (dates.length === 0) {
    open(`
      <h2>Nutrition History</h2>
      <div class="sub">No logged days yet</div>
      <p style="color:var(--ink-dim);font-size:12px;line-height:1.6;">
        Log meals throughout the day. The totals are saved automatically so you can review week-over-week trends.
      </p>
      <button class="nav-btn primary" style="width:100%;margin-top:16px;" id="closeBtn">Close</button>
    `);
    document.getElementById('closeBtn').addEventListener('click', close);
    return;
  }
  const last14 = dates.slice(0, 14).reverse();
  let avgKcal = 0, avgP = 0, avgC = 0, avgF = 0;
  last14.forEach((d) => {
    const t = totalsForDay(ctx.state.foodLog, d);
    avgKcal += t.kcal;
    avgP += t.protein;
    avgC += t.carbs;
    avgF += t.fat;
  });
  const n = last14.length;
  avgKcal = Math.round(avgKcal / n);
  avgP = Math.round(avgP / n);
  avgC = Math.round(avgC / n);
  avgF = Math.round(avgF / n);

  open(`
    <h2>Nutrition History</h2>
    <div class="sub">${dates.length} day${dates.length === 1 ? '' : 's'} logged · ${n}-day average shown</div>
    <div style="background: var(--panel-2); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
      <div style="font-size:10px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">${n}-day average vs target</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;">
        <div>calories: <strong style="color:var(--accent);">${avgKcal}</strong> / ${targets.kcal}</div>
        <div>protein: <strong style="color:var(--accent);">${avgP}g</strong> / ${targets.protein}g</div>
        <div>carbs: <strong style="color:var(--warn);">${avgC}g</strong> / ${targets.carbs}g</div>
        <div>fat: <strong style="color:var(--accent-2);">${avgF}g</strong> / ${targets.fat}g</div>
      </div>
    </div>
    <div style="font-size:10px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Daily log</div>
    ${dates.map((date) => {
      const totals = totalsForDay(ctx.state.foodLog, date);
      const log = ctx.state.foodLog[date] || [];
      const diff = totals.kcal - targets.kcal;
      const isToday = date === todayKey();
      const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const proteinPct = Math.round((totals.protein / targets.protein) * 100);
      return `
        <div style="padding:12px 0;border-bottom:1px dashed var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
            <div style="font-family:'Fraunces',serif;font-size:14px;font-weight:600;">${dateLabel}${isToday ? ' · today' : ''}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${diff > 100 ? 'var(--accent-2)' : diff < -100 ? 'var(--warn)' : 'var(--ok)'};">
              ${diff >= 0 ? '+' : ''}${diff} cal
            </div>
          </div>
          <div style="font-size:11px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace;">
            ${totals.kcal} cal · P${totals.protein} (${proteinPct}%) · C${totals.carbs} · F${totals.fat} · ${log.length} item${log.length === 1 ? '' : 's'}
          </div>
        </div>
      `;
    }).join('')}
    <button class="nav-btn primary" style="width: 100%; margin-top: 8px;" id="closeBtn">Close</button>
  `);
  document.getElementById('closeBtn').addEventListener('click', close);
}
