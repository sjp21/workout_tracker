// Single global rest timer. Auto-starts when a set is marked done; beeps and
// vibrates at zero. Schoenfeld 2016 (PMID 26605807): 2–3 min rest > short rest
// for hypertrophy. Re-uses the DOM node across ticks (don't rebuild on each
// 250ms render, because mobile touch synthesis races against re-render and
// destroys the click target before the synthesized click fires).

let state = {
  exId: null,
  setIdx: null,
  endsAt: 0,
  intervalId: null,
  beeped: false
};

export function start(exId, setIdx, seconds) {
  stop();
  state.exId = exId;
  state.setIdx = setIdx;
  state.endsAt = Date.now() + seconds * 1000;
  state.beeped = false;
  render();
  state.intervalId = setInterval(render, 250);
}

export function stop() {
  if (state.intervalId) clearInterval(state.intervalId);
  const old = document.getElementById('rest-timer-el');
  if (old) old.remove();
  state = { exId: null, setIdx: null, endsAt: 0, intervalId: null, beeped: false };
}

export function add(deltaSeconds) {
  if (!state.intervalId) return;
  state.endsAt += deltaSeconds * 1000;
  if (state.endsAt - Date.now() > 0) state.beeped = false;
  render();
}

export function isAttachedTo(exId, setIdx) {
  return state.exId === exId && state.setIdx === setIdx;
}

function render() {
  const { exId, setIdx, endsAt } = state;
  if (!exId) return;
  const remainingMs = endsAt - Date.now();
  const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;

  const setRow = document.getElementById(`set-${exId}-${setIdx}`);
  if (!setRow) {
    stop();
    return;
  }

  let timerEl = document.getElementById('rest-timer-el');
  const done = remaining === 0;

  if (!timerEl) {
    timerEl = document.createElement('div');
    timerEl.id = 'rest-timer-el';
    timerEl.className = 'rest-timer';
    timerEl.innerHTML = `
      <div class="rt-left">
        <div class="rt-label"></div>
        <div class="rt-time"></div>
      </div>
      <div class="rt-controls">
        <button type="button" class="rt-add">+15s</button>
        <button type="button" class="rt-skip danger">Skip</button>
      </div>
    `;
    const addBtn = timerEl.querySelector('.rt-add');
    const skipBtn = timerEl.querySelector('.rt-skip');
    const bind = (el, handler) => {
      let handled = false;
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handled = true;
        handler();
        setTimeout(() => { handled = false; }, 500);
      }, { passive: false });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (handled) return;
        handler();
      });
    };
    bind(addBtn, () => add(15));
    bind(skipBtn, () => stop());
    setRow.insertAdjacentElement('afterend', timerEl);
  } else if (timerEl.previousElementSibling !== setRow) {
    setRow.insertAdjacentElement('afterend', timerEl);
  }

  timerEl.classList.toggle('done', done);
  const labelEl = timerEl.querySelector('.rt-label');
  const timeEl = timerEl.querySelector('.rt-time');
  const addBtn = timerEl.querySelector('.rt-add');
  const skipBtn = timerEl.querySelector('.rt-skip');
  const newLabel = done ? 'Rest complete · next set' : 'Rest timer';
  if (labelEl.textContent !== newLabel) labelEl.textContent = newLabel;
  if (timeEl.textContent !== display) timeEl.textContent = display;
  if (done) {
    addBtn.style.display = 'none';
    if (skipBtn.textContent !== 'Dismiss') {
      skipBtn.textContent = 'Dismiss';
      skipBtn.classList.remove('danger');
    }
  } else {
    addBtn.style.display = '';
    if (skipBtn.textContent !== 'Skip') {
      skipBtn.textContent = 'Skip';
      skipBtn.classList.add('danger');
    }
  }

  if (done && !state.beeped) {
    state.beeped = true;
    playRestComplete();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
}

function playRestComplete() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beepAt = (when, freq, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + when);
      o.stop(ctx.currentTime + when + dur + 0.05);
    };
    beepAt(0, 880, 0.18);
    beepAt(0.22, 1320, 0.22);
  } catch {
    // iOS may block AudioContext without user gesture; silent fail is fine.
  }
}
