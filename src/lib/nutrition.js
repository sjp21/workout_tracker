// Pure nutrition math. All numbers come from peer-reviewed equations cited in
// src/data/evidence.js. No DOM, no storage — testable in isolation.

// Mifflin-St Jeor RMR (PMID: 2305711)
//   Men:   10*kg + 6.25*cm - 5*age + 5
//   Women: 10*kg + 6.25*cm - 5*age - 161
export function calculateRMR(profile) {
  const kg = profile.weightLb / 2.205;
  const cm = profile.heightIn * 2.54;
  const base = 10 * kg + 6.25 * cm - 5 * profile.age;
  return Math.round(profile.sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(profile) {
  const rmr = calculateRMR(profile);
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };
  return Math.round(rmr * (multipliers[profile.activity] || 1.55));
}

// Cut: -400 kcal (Murphy 2022 — under the ~500 kcal threshold that impairs LM)
// Maintain: 0  |  Lean gain: +250
// Protein: 2.2 g/kg in a cut (Helms upper-CI), else 1.8 g/kg (Morton 2018)
// Fat: 0.35 g/lb minimum for hormonal health; carbs fill the rest.
export function calculateTargets(profile) {
  const tdee = calculateTDEE(profile);
  const goalAdjust = { cut: -400, maintain: 0, gain: 250 };
  const targetKcal = tdee + goalAdjust[profile.goal];
  const kg = profile.weightLb / 2.205;
  const proteinPerKg = profile.goal === 'cut' ? 2.2 : 1.8;
  const proteinG = Math.round(kg * proteinPerKg);
  const fatG = Math.round(profile.weightLb * 0.35);
  const carbKcal = targetKcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(carbKcal / 4));
  return { kcal: targetKcal, protein: proteinG, carbs: carbsG, fat: fatG, rmr: calculateRMR(profile), tdee };
}

export function totalsForDay(foodLog, dateKey) {
  const log = foodLog[dateKey] || [];
  return log.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (f.kcal || 0),
      protein: acc.protein + (f.protein || 0),
      carbs: acc.carbs + (f.carbs || 0),
      fat: acc.fat + (f.fat || 0)
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
