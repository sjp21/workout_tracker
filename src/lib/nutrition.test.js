import { describe, it, expect } from 'vitest';
import { calculateRMR, calculateTDEE, calculateTargets, totalsForDay } from './nutrition.js';

const sampleProfile = { weightLb: 200, heightIn: 72, age: 30, sex: 'male', activity: 'moderate', goal: 'cut' };

describe('nutrition', () => {
  it('Mifflin-St Jeor RMR sanity', () => {
    const rmr = calculateRMR(sampleProfile);
    // Roughly 1900±100 for this profile
    expect(rmr).toBeGreaterThan(1800);
    expect(rmr).toBeLessThan(2000);
  });

  it('TDEE > RMR for active profile', () => {
    expect(calculateTDEE(sampleProfile)).toBeGreaterThan(calculateRMR(sampleProfile));
  });

  it('Cut target is below TDEE by 400 kcal', () => {
    const t = calculateTargets(sampleProfile);
    expect(t.kcal).toBe(calculateTDEE(sampleProfile) - 400);
  });

  it('Cut protein uses 2.2 g/kg', () => {
    const t = calculateTargets(sampleProfile);
    const expected = Math.round((200 / 2.205) * 2.2);
    expect(t.protein).toBe(expected);
  });

  it('Maintain goal uses 1.8 g/kg protein', () => {
    const t = calculateTargets({ ...sampleProfile, goal: 'maintain' });
    expect(t.protein).toBe(Math.round((200 / 2.205) * 1.8));
  });

  it('totalsForDay sums entries', () => {
    const log = {
      '2026-05-28': [
        { kcal: 100, protein: 20, carbs: 5, fat: 2 },
        { kcal: 50, protein: 10, carbs: 0, fat: 0 }
      ]
    };
    expect(totalsForDay(log, '2026-05-28')).toEqual({ kcal: 150, protein: 30, carbs: 5, fat: 2 });
  });

  it('totalsForDay tolerates missing key', () => {
    expect(totalsForDay({}, '2026-05-28')).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
