// Common foods database — calories, protein, carbs, fat per typical serving.
// Values sourced from USDA FoodData Central and standard nutrition labels.
// Each item rounded to nearest whole gram/calorie for clarity.
export const QUICK_FOODS = [
  // PROTEIN — animal
  { cat: 'Protein', name: 'Chicken breast, cooked (6 oz)', kcal: 280, p: 53, c: 0, f: 6 },
  { cat: 'Protein', name: 'Chicken thigh, skinless (6 oz)', kcal: 310, p: 44, c: 0, f: 14 },
  { cat: 'Protein', name: 'Ground beef 93/7, cooked (6 oz)', kcal: 280, p: 44, c: 0, f: 12 },
  { cat: 'Protein', name: 'Ground beef 80/20, cooked (6 oz)', kcal: 430, p: 42, c: 0, f: 28 },
  { cat: 'Protein', name: 'Sirloin steak, cooked (6 oz)', kcal: 340, p: 50, c: 0, f: 14 },
  { cat: 'Protein', name: 'Pork tenderloin, cooked (6 oz)', kcal: 240, p: 46, c: 0, f: 6 },
  { cat: 'Protein', name: 'Bacon, pan-fried (2 slices)', kcal: 80, p: 6, c: 0, f: 6 },
  { cat: 'Protein', name: 'Salami, hard (1 oz, ~3 slices)', kcal: 120, p: 6, c: 1, f: 10 },
  { cat: 'Protein', name: 'Deli turkey, sliced (3 oz)', kcal: 90, p: 18, c: 2, f: 1 },
  { cat: 'Protein', name: 'Deli ham, sliced (3 oz)', kcal: 100, p: 16, c: 2, f: 3 },
  { cat: 'Protein', name: 'Salmon, cooked (6 oz)', kcal: 330, p: 40, c: 0, f: 18 },
  { cat: 'Protein', name: 'Tuna, canned in water (1 can, 5 oz)', kcal: 110, p: 25, c: 0, f: 1 },
  { cat: 'Protein', name: 'Tilapia, cooked (6 oz)', kcal: 200, p: 40, c: 0, f: 4 },
  { cat: 'Protein', name: 'Shrimp, cooked (6 oz)', kcal: 170, p: 33, c: 1, f: 2 },
  { cat: 'Protein', name: 'Cod, cooked (6 oz)', kcal: 180, p: 39, c: 0, f: 1 },
  { cat: 'Protein', name: '2 large eggs', kcal: 140, p: 12, c: 1, f: 10 },
  { cat: 'Protein', name: '3 large eggs', kcal: 215, p: 19, c: 1, f: 15 },
  { cat: 'Protein', name: '4 egg whites', kcal: 70, p: 14, c: 1, f: 0 },

  // PROTEIN — dairy & supplements
  { cat: 'Dairy', name: 'Whey protein (1 scoop)', kcal: 120, p: 25, c: 3, f: 1 },
  { cat: 'Dairy', name: 'Casein protein (1 scoop)', kcal: 120, p: 24, c: 3, f: 1 },
  { cat: 'Dairy', name: 'Whole milk (1 cup)', kcal: 149, p: 8, c: 12, f: 8 },
  { cat: 'Dairy', name: '2% milk (1 cup)', kcal: 122, p: 8, c: 12, f: 5 },
  { cat: 'Dairy', name: 'Skim milk (1 cup)', kcal: 83, p: 8, c: 12, f: 0 },
  { cat: 'Dairy', name: 'Greek yogurt, 0% plain (1 cup)', kcal: 130, p: 22, c: 9, f: 0 },
  { cat: 'Dairy', name: 'Greek yogurt, 2% plain (1 cup)', kcal: 160, p: 20, c: 8, f: 5 },
  { cat: 'Dairy', name: 'Cottage cheese, 1% (1 cup)', kcal: 165, p: 28, c: 6, f: 2 },
  { cat: 'Dairy', name: 'Cottage cheese, 4% (1 cup)', kcal: 220, p: 25, c: 9, f: 9 },
  { cat: 'Dairy', name: 'Cheddar cheese (1 oz)', kcal: 115, p: 7, c: 0, f: 9 },
  { cat: 'Dairy', name: 'Mozzarella, whole milk (1 oz)', kcal: 85, p: 6, c: 1, f: 6 },
  { cat: 'Dairy', name: 'Parmesan, grated (1 tbsp)', kcal: 22, p: 2, c: 0, f: 1 },
  { cat: 'Dairy', name: 'Feta cheese (1 oz)', kcal: 75, p: 4, c: 1, f: 6 },
  { cat: 'Dairy', name: 'Cream cheese (1 tbsp)', kcal: 50, p: 1, c: 1, f: 5 },
  { cat: 'Dairy', name: 'Butter (1 tbsp)', kcal: 100, p: 0, c: 0, f: 11 },
  { cat: 'Dairy', name: 'String cheese (1 stick)', kcal: 80, p: 7, c: 1, f: 6 },

  // CARBS — grains & starches
  { cat: 'Carbs', name: 'White rice, cooked (1 cup)', kcal: 205, p: 4, c: 45, f: 0 },
  { cat: 'Carbs', name: 'Brown rice, cooked (1 cup)', kcal: 215, p: 5, c: 45, f: 2 },
  { cat: 'Carbs', name: 'Jasmine rice, cooked (1 cup)', kcal: 200, p: 4, c: 45, f: 0 },
  { cat: 'Carbs', name: 'Oatmeal, dry (1/2 cup)', kcal: 150, p: 5, c: 27, f: 3 },
  { cat: 'Carbs', name: 'Quinoa, cooked (1 cup)', kcal: 220, p: 8, c: 39, f: 4 },
  { cat: 'Carbs', name: 'Pasta, cooked (1 cup)', kcal: 220, p: 8, c: 43, f: 1 },
  { cat: 'Carbs', name: 'Whole wheat bread (1 slice)', kcal: 80, p: 4, c: 14, f: 1 },
  { cat: 'Carbs', name: 'White bread (1 slice)', kcal: 75, p: 2, c: 14, f: 1 },
  { cat: 'Carbs', name: 'Bagel, plain (1 medium)', kcal: 270, p: 11, c: 53, f: 2 },
  { cat: 'Carbs', name: 'English muffin (1)', kcal: 130, p: 5, c: 25, f: 1 },
  { cat: 'Carbs', name: 'Tortilla, flour (1, 8")', kcal: 140, p: 4, c: 24, f: 4 },
  { cat: 'Carbs', name: 'Sweet potato, baked (1 medium)', kcal: 115, p: 2, c: 27, f: 0 },
  { cat: 'Carbs', name: 'White potato, baked (1 medium)', kcal: 160, p: 4, c: 37, f: 0 },
  { cat: 'Carbs', name: 'Black beans, cooked (1/2 cup)', kcal: 115, p: 8, c: 20, f: 0 },
  { cat: 'Carbs', name: 'Chickpeas, cooked (1/2 cup)', kcal: 135, p: 7, c: 22, f: 2 },
  { cat: 'Carbs', name: 'Lentils, cooked (1/2 cup)', kcal: 115, p: 9, c: 20, f: 0 },

  // FRUITS
  { cat: 'Fruit', name: 'Banana, medium', kcal: 105, p: 1, c: 27, f: 0 },
  { cat: 'Fruit', name: 'Apple, medium', kcal: 95, p: 0, c: 25, f: 0 },
  { cat: 'Fruit', name: 'Orange, medium', kcal: 65, p: 1, c: 16, f: 0 },
  { cat: 'Fruit', name: 'Blueberries (1 cup)', kcal: 85, p: 1, c: 21, f: 0 },
  { cat: 'Fruit', name: 'Strawberries (1 cup)', kcal: 50, p: 1, c: 12, f: 0 },
  { cat: 'Fruit', name: 'Grapes (1 cup)', kcal: 105, p: 1, c: 27, f: 0 },
  { cat: 'Fruit', name: 'Pineapple, chunks (1 cup)', kcal: 80, p: 1, c: 22, f: 0 },
  { cat: 'Fruit', name: 'Mango, sliced (1 cup)', kcal: 100, p: 1, c: 25, f: 1 },
  { cat: 'Fruit', name: 'Watermelon (1 cup)', kcal: 45, p: 1, c: 11, f: 0 },
  { cat: 'Fruit', name: 'Avocado (1/2 medium)', kcal: 160, p: 2, c: 9, f: 15 },

  // VEG
  { cat: 'Veg', name: 'Broccoli, cooked (1 cup)', kcal: 55, p: 4, c: 11, f: 1 },
  { cat: 'Veg', name: 'Spinach, raw (1 cup)', kcal: 7, p: 1, c: 1, f: 0 },
  { cat: 'Veg', name: 'Spinach, cooked (1 cup)', kcal: 40, p: 5, c: 7, f: 0 },
  { cat: 'Veg', name: 'Asparagus, cooked (1 cup)', kcal: 40, p: 4, c: 7, f: 0 },
  { cat: 'Veg', name: 'Carrots, raw (1 cup)', kcal: 50, p: 1, c: 12, f: 0 },
  { cat: 'Veg', name: 'Bell pepper, raw (1 medium)', kcal: 25, p: 1, c: 6, f: 0 },
  { cat: 'Veg', name: 'Cucumber (1 cup)', kcal: 15, p: 1, c: 4, f: 0 },
  { cat: 'Veg', name: 'Mixed salad greens (2 cups)', kcal: 20, p: 1, c: 4, f: 0 },
  { cat: 'Veg', name: 'Tomato, medium', kcal: 22, p: 1, c: 5, f: 0 },
  { cat: 'Veg', name: 'Cauliflower, cooked (1 cup)', kcal: 30, p: 2, c: 5, f: 1 },

  // FATS & NUTS
  { cat: 'Fats', name: 'Almonds (1 oz, ~23 nuts)', kcal: 165, p: 6, c: 6, f: 14 },
  { cat: 'Fats', name: 'Walnuts (1 oz, ~14 halves)', kcal: 185, p: 4, c: 4, f: 18 },
  { cat: 'Fats', name: 'Cashews (1 oz)', kcal: 155, p: 5, c: 9, f: 12 },
  { cat: 'Fats', name: 'Pistachios (1 oz, ~49 nuts)', kcal: 160, p: 6, c: 8, f: 13 },
  { cat: 'Fats', name: 'Peanut butter (2 tbsp)', kcal: 190, p: 7, c: 7, f: 16 },
  { cat: 'Fats', name: 'Almond butter (2 tbsp)', kcal: 195, p: 7, c: 6, f: 18 },
  { cat: 'Fats', name: 'Olive oil (1 tbsp)', kcal: 120, p: 0, c: 0, f: 14 },
  { cat: 'Fats', name: 'Coconut oil (1 tbsp)', kcal: 120, p: 0, c: 0, f: 14 },
  { cat: 'Fats', name: 'Chia seeds (1 tbsp)', kcal: 60, p: 2, c: 5, f: 4 },
  { cat: 'Fats', name: 'Flax seeds, ground (1 tbsp)', kcal: 37, p: 1, c: 2, f: 3 },
  { cat: 'Fats', name: 'Dark chocolate, 70% (1 oz)', kcal: 170, p: 2, c: 13, f: 12 },

  // QUICK / CONVENIENCE
  { cat: 'Quick', name: 'Protein bar (Quest-style, ~60g)', kcal: 190, p: 21, c: 22, f: 8 },
  { cat: 'Quick', name: 'Rice cake, plain (1)', kcal: 35, p: 1, c: 7, f: 0 },
  { cat: 'Quick', name: 'Beef jerky (1 oz)', kcal: 115, p: 9, c: 3, f: 7 },
  { cat: 'Quick', name: 'Hummus (2 tbsp)', kcal: 70, p: 2, c: 4, f: 5 },
  { cat: 'Quick', name: 'Honey (1 tbsp)', kcal: 65, p: 0, c: 17, f: 0 },
  { cat: 'Quick', name: 'Maple syrup (1 tbsp)', kcal: 52, p: 0, c: 13, f: 0 }
];

export const FOOD_CATEGORIES = ['Protein', 'Dairy', 'Carbs', 'Fruit', 'Veg', 'Fats', 'Quick'];
export const MEAL_BUCKETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
