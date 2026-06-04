import { QUICK_FOODS, FOOD_CATEGORIES, MEAL_BUCKETS } from '../data/foods.js';
import { calculateTargets, totalsForDay, todayKey } from '../lib/nutrition.js';
import { ctx } from './ctx.js';

export function renderFuel({ openHistory }) {
  const view = document.getElementById('nutriView');

  if (!ctx.state.profile) {
    view.innerHTML = renderProfileSetup();
    bindProfileSetup(() => renderFuel({ openHistory }));
    return;
  }

  const targets = calculateTargets(ctx.state.profile);
  const totals = totalsForDay(ctx.state.foodLog, todayKey());
  const remaining = targets.kcal - totals.kcal;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  view.innerHTML = `
    <div class="nutri-hero">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="nutri-date">${dateStr}</div>
        <button id="fuelHistoryBtn" style="background:transparent;border:1px solid var(--line);color:var(--ink-dim);font-family:inherit;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;padding:6px 10px;border-radius:6px;cursor:pointer;">History →</button>
      </div>
      <div class="nutri-kcal">
        ${totals.kcal}<span class="of"> / ${targets.kcal}</span><span class="unit">calories</span>
      </div>
      <div class="nutri-remaining ${remaining < 0 ? 'over' : ''}">
        ${remaining >= 0 ? `${remaining} calories remaining` : `${Math.abs(remaining)} calories over target`}
      </div>
      <div class="macro-grid">
        ${macroCard('protein', 'Protein', totals.protein, targets.protein)}
        ${macroCard('carbs', 'Carbs', totals.carbs, targets.carbs)}
        ${macroCard('fat', 'Fat', totals.fat, targets.fat)}
      </div>
    </div>

    <div class="profile-summary">
      Based on Mifflin-St Jeor: <span>RMR ${targets.rmr}</span> · <span>TDEE ${targets.tdee}</span> · Goal: <span>${ctx.state.profile.goal === 'cut' ? 'Cut (−400 calories, Murphy 2022)' : ctx.state.profile.goal === 'gain' ? 'Lean gain (+250 calories)' : 'Maintain'}</span>
      <div style="margin-top:6px; font-size: 10px;">Per-meal protein target: <span>${Math.round(targets.protein / 4)}g</span> across 4 meals (Schoenfeld & Aragon 2018)</div>
      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="editProfileBtn" style="background:none;border:none;color:var(--accent);font-family:inherit;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;padding:0;">Edit Profile →</button>
        <span style="color:var(--ink-faint);">·</span>
        <button id="backupBtn" style="background:none;border:none;color:var(--accent);font-family:inherit;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;padding:0;">Download backup JSON →</button>
      </div>
    </div>

    <div class="section-title">Quick Add <span class="sub-action" id="jumpCustom">+ custom food</span></div>
    <div class="food-search-wrap">
      <input type="text" class="food-search" id="foodSearch" placeholder="Search ${QUICK_FOODS.length} foods..." autocomplete="off" />
    </div>
    <div id="foodCatList">${renderCategoryList('')}</div>

    <div class="section-title">Custom Food</div>
    <div class="food-form" id="customFoodForm">
      <div class="food-form-row">
        <div>
          <label class="field-label">Food name</label>
          <input type="text" id="cf-name" placeholder="e.g., chicken thigh" />
        </div>
        <div>
          <label class="field-label">Meal</label>
          <select id="cf-meal">${MEAL_BUCKETS.map((m) => `<option value="${m}">${m}</option>`).join('')}</select>
        </div>
      </div>
      <label class="field-label">Macros</label>
      <div class="macros-row">
        <input type="number" inputmode="decimal" id="cf-kcal" placeholder="cal" />
        <input type="number" inputmode="decimal" id="cf-p" placeholder="P (g)" />
        <input type="number" inputmode="decimal" id="cf-c" placeholder="C (g)" />
        <input type="number" inputmode="decimal" id="cf-f" placeholder="F (g)" />
      </div>
      <button class="add-btn" id="addCustomFoodBtn">Add to Log</button>
    </div>

    <div class="section-title">Today's Log</div>
    <div id="foodLog">${renderFoodLog()}</div>
  `;

  document.getElementById('fuelHistoryBtn').addEventListener('click', openHistory);
  document.getElementById('editProfileBtn').addEventListener('click', () => editProfile(() => renderFuel({ openHistory })));
  document.getElementById('backupBtn').addEventListener('click', downloadBackup);
  document.getElementById('jumpCustom').addEventListener('click', () => {
    document.getElementById('customFoodForm').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('addCustomFoodBtn').addEventListener('click', () => addCustomFood(() => renderFuel({ openHistory })));
  document.getElementById('foodSearch').addEventListener('input', (e) => {
    document.getElementById('foodCatList').innerHTML = renderCategoryList(e.target.value);
    bindCategoryList(() => renderFuel({ openHistory }));
  });
  bindCategoryList(() => renderFuel({ openHistory }));
}

function macroCard(cls, label, current, target) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return `
    <div class="macro-card ${cls}">
      <div class="macro-label">${label}</div>
      <div class="macro-val">${Math.round(current)}</div>
      <div class="macro-target">/ ${target}g</div>
      <div class="macro-bar"><div class="macro-bar-fill" style="width: ${pct}%"></div></div>
    </div>
  `;
}

// Collapsible food categories. Open state is persisted per-user in
// state.uiState.openFoodCategories. Default = ['Protein'] (most-used) so the
// screen opens compact. With a search query active, any category containing
// matches is forced open and shows a per-category match count.
function renderCategoryList(query) {
  const q = (query || '').trim().toLowerCase();
  const open = new Set(ctx.state.uiState?.openFoodCategories || []);
  return FOOD_CATEGORIES.map((cat) => {
    const all = QUICK_FOODS.filter((f) => f.cat === cat);
    const matches = q ? all.filter((f) => f.name.toLowerCase().includes(q)) : all;
    if (q && matches.length === 0) return '';
    const isOpen = q ? matches.length > 0 : open.has(cat);
    return `
      <details class="food-cat-group" data-cat="${cat}" ${isOpen ? 'open' : ''}>
        <summary>
          <span>${cat}</span>
          <span class="cat-meta">${q ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : `${all.length} item${all.length === 1 ? '' : 's'}`}</span>
        </summary>
        <div class="cat-body">
          <div class="quick-foods">
            ${matches.map((f) => {
              const realIdx = QUICK_FOODS.indexOf(f);
              return `
                <button class="quick-food" data-food-idx="${realIdx}">
                  <div class="qf-name">${f.name}</div>
                  <div class="qf-macros">${f.kcal} cal · P${f.p} C${f.c} F${f.f}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </details>
    `;
  }).join('');
}

function bindCategoryList(rerender) {
  document.querySelectorAll('.food-cat-group').forEach((el) => {
    el.addEventListener('toggle', () => {
      const open = new Set(ctx.state.uiState?.openFoodCategories || []);
      if (el.open) open.add(el.dataset.cat);
      else open.delete(el.dataset.cat);
      ctx.state.uiState = { ...(ctx.state.uiState || {}), openFoodCategories: [...open] };
      ctx.commit();
    });
  });
  document.querySelectorAll('.quick-food').forEach((el) => {
    el.addEventListener('click', () => {
      addQuickFood(parseInt(el.dataset.foodIdx));
      rerender();
    });
  });
}

function renderFoodLog() {
  const log = ctx.state.foodLog[todayKey()] || [];
  if (log.length === 0) {
    return '<div class="empty">No food logged yet today.<br/>Tap a quick add above or build a custom entry.</div>';
  }
  const byMeal = {};
  MEAL_BUCKETS.forEach((m) => (byMeal[m] = []));
  log.forEach((f) => {
    (byMeal[f.meal] || (byMeal[f.meal] = [])).push(f);
  });

  return MEAL_BUCKETS.filter((m) => byMeal[m] && byMeal[m].length).map((meal) => {
    const items = byMeal[meal];
    const mealKcal = items.reduce((a, f) => a + (f.kcal || 0), 0);
    return `
      <div class="meal-group">
        <div class="meal-header"><span>${meal}</span><span class="meal-kcal">${mealKcal} cal</span></div>
        ${items.map((f) => `
          <div class="food-entry">
            <div style="flex:1; min-width:0;">
              <div class="name">${f.name}</div>
              <div class="breakdown">P${f.protein} · C${f.carbs} · F${f.fat}</div>
            </div>
            <div class="kcal-pill">${f.kcal}</div>
            <button class="delete-btn" data-food-id="${f.id}" aria-label="Delete">×</button>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function renderProfileSetup() {
  return `
    <div class="profile-card">
      <h3>Set up your profile</h3>
      <div class="desc">We calculate your daily calories using the Mifflin-St Jeor equation (the most accurate validated RMR formula), then set protein per Morton 2018 and adjust your deficit per Murphy 2022.</div>
      <div class="profile-grid">
        <div><label>Weight (lb)</label><input type="number" inputmode="decimal" id="p-weight" placeholder="190" /></div>
        <div><label>Height (in)</label><input type="number" inputmode="numeric" id="p-height" placeholder="75" /></div>
        <div><label>Age</label><input type="number" inputmode="numeric" id="p-age" placeholder="26" /></div>
        <div><label>Sex</label><select id="p-sex"><option value="male">Male</option><option value="female">Female</option></select></div>
        <div><label>Activity</label><select id="p-activity"><option value="light">Light (1-3x/wk)</option><option value="moderate" selected>Moderate (3-5x/wk)</option><option value="very">Very active (6+x/wk)</option></select></div>
        <div><label>Goal</label><select id="p-goal"><option value="cut" selected>Cut fat</option><option value="maintain">Maintain</option><option value="gain">Lean gain</option></select></div>
      </div>
      <button class="add-btn" id="saveProfileBtn">Calculate Targets</button>
    </div>
  `;
}

function bindProfileSetup(rerender) {
  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('p-weight').value);
    const height = parseFloat(document.getElementById('p-height').value);
    const age = parseInt(document.getElementById('p-age').value);
    const missing = [];
    if (!weight) missing.push('weight');
    if (!height) missing.push('height');
    if (!age) missing.push('age');
    if (missing.length) return alert('Please enter: ' + missing.join(', '));
    ctx.state.profile = {
      weightLb: weight,
      heightIn: height,
      age,
      sex: document.getElementById('p-sex').value || 'male',
      activity: document.getElementById('p-activity').value || 'moderate',
      goal: document.getElementById('p-goal').value || 'cut'
    };
    ctx.commit();
    rerender();
  });
}

function editProfile(rerender) {
  const p = ctx.state.profile;
  ctx.state.profile = null;
  ctx.commit();
  rerender();
  setTimeout(() => {
    document.getElementById('p-weight').value = p.weightLb;
    document.getElementById('p-height').value = p.heightIn;
    document.getElementById('p-age').value = p.age;
    document.getElementById('p-sex').value = p.sex;
    document.getElementById('p-activity').value = p.activity;
    document.getElementById('p-goal').value = p.goal;
  }, 50);
}

function addQuickFood(idx) {
  const f = QUICK_FOODS[idx];
  const hour = new Date().getHours();
  const meal = hour < 11 ? 'Breakfast' : hour < 15 ? 'Lunch' : hour < 20 ? 'Dinner' : 'Snack';
  logFood({ name: f.name, kcal: f.kcal, protein: f.p, carbs: f.c, fat: f.f, meal });
}

function addCustomFood(rerender) {
  const name = document.getElementById('cf-name').value.trim();
  if (!name) return alert('Add a name for the food.');
  const kcal = parseFloat(document.getElementById('cf-kcal').value) || 0;
  const protein = parseFloat(document.getElementById('cf-p').value) || 0;
  const carbs = parseFloat(document.getElementById('cf-c').value) || 0;
  const fat = parseFloat(document.getElementById('cf-f').value) || 0;
  const meal = document.getElementById('cf-meal').value;
  logFood({ name, kcal, protein, carbs, fat, meal });
  ['cf-name', 'cf-kcal', 'cf-p', 'cf-c', 'cf-f'].forEach((id) => (document.getElementById(id).value = ''));
  rerender();
}

function logFood(food) {
  const key = todayKey();
  if (!ctx.state.foodLog[key]) ctx.state.foodLog[key] = [];
  ctx.state.foodLog[key].push({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    ...food,
    time: new Date().toISOString()
  });
  ctx.commit();
  const logEl = document.getElementById('foodLog');
  if (logEl) logEl.innerHTML = renderFoodLog();
  bindFoodLog();
}

function bindFoodLog() {
  document.querySelectorAll('.food-entry .delete-btn').forEach((el) => {
    el.addEventListener('click', () => deleteFood(el.dataset.foodId));
  });
}

function deleteFood(id) {
  const key = todayKey();
  if (!ctx.state.foodLog[key]) return;
  ctx.state.foodLog[key] = ctx.state.foodLog[key].filter((f) => f.id !== id);
  ctx.commit();
  const logEl = document.getElementById('foodLog');
  if (logEl) logEl.innerHTML = renderFoodLog();
  bindFoodLog();
}

// Download a snapshot of the full app state as JSON. Single user-facing
// escape hatch — no import flow on day 1. Sync to Supabase covers recovery.
export function downloadBackup() {
  const payload = {
    schema: ctx.state.schemaVersion,
    app: 'stimulus',
    exportedAt: new Date().toISOString(),
    state: ctx.state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stimulus-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
