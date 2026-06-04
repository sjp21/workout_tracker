import { describe, it, expect, beforeEach } from 'vitest';
import { ctx } from './ctx.js';
import { defaultState } from '../storage/migrations.js';
import { renderToday } from './today.js';
import { renderFuel } from './fuel.js';
import { renderTabs, renderDay } from './train.js';

// Smoke tests: render each tab with default state and verify expected sentinel
// text is in the DOM. Doesn't simulate clicks — just guards against import-
// time errors and dumb template typos.

beforeEach(() => {
  document.body.innerHTML = `
    <div id="syncStatus"></div>
    <div id="todayView"></div>
    <div id="trainView" style="display:none;"><div id="dayTabs"></div><div id="dayView"></div></div>
    <div id="nutriView" style="display:none;"></div>
    <button id="navHistory"></button>
    <button id="navGuide"></button>
    <button id="navSave"></button>
    <div id="modal"><div id="modalContent"></div></div>
  `;
  ctx.bind(defaultState(), () => {});
});

describe('renderers smoke', () => {
  it('renderToday produces all four cards with no profile', () => {
    renderToday({ goTrain: () => {}, goFuel: () => {} });
    const html = document.getElementById('todayView').innerHTML;
    expect(html).toContain('Weekly weigh-in');
    expect(html).toContain("Today's training");
    expect(html).toContain('Fuel');
    expect(html).toContain('Weekly volume');
  });

  it('renderToday shows fueled card when profile set', () => {
    ctx.state.profile = { weightLb: 190, heightIn: 72, age: 30, sex: 'male', activity: 'moderate', goal: 'cut' };
    renderToday({ goTrain: () => {}, goFuel: () => {} });
    const html = document.getElementById('todayView').innerHTML;
    expect(html).toContain('Protein');
    expect(html).toContain('kcal');
  });

  it('renderTabs + renderDay produces program day', () => {
    renderTabs();
    renderDay();
    expect(document.getElementById('dayTabs').children.length).toBe(4);
    expect(document.getElementById('dayView').innerHTML).toContain('Push');
  });

  it('renderFuel shows profile setup when no profile', () => {
    renderFuel({ openHistory: () => {} });
    const html = document.getElementById('nutriView').innerHTML;
    expect(html).toContain('Set up your profile');
  });

  it('renderFuel shows collapsible food categories when profile set', () => {
    ctx.state.profile = { weightLb: 190, heightIn: 72, age: 30, sex: 'male', activity: 'moderate', goal: 'cut' };
    renderFuel({ openHistory: () => {} });
    const html = document.getElementById('nutriView').innerHTML;
    expect(html).toContain('food-cat-group');
    expect(html).toContain('Protein');
    expect(html).toContain('Carbs');
  });

  it('weekly bodyweight log updates state', () => {
    let committed = null;
    ctx.bind(defaultState(), (s) => { committed = s; });
    renderToday({ goTrain: () => {}, goFuel: () => {} });
    const input = document.getElementById('bwInput');
    input.value = '195.5';
    document.getElementById('logBwBtn').click();
    expect(ctx.state.bodyweight.length).toBe(1);
    expect(ctx.state.bodyweight[0].lb).toBe(195.5);
    expect(committed).not.toBeNull();
  });
});
