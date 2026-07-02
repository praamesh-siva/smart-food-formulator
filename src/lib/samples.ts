export interface SampleRecipe {
  id: string;
  label: string;
  description: string;
  content: string;
}

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    id: "cookies",
    label: "Chocolate Chip Cookies",
    description: "Classic bakery-style cookies",
    content: `Classic Chocolate Chip Cookies

2¼ cups all-purpose flour
1 tsp baking soda
1 cup butter, softened
¾ cup granulated sugar
¾ cup brown sugar
2 large eggs
2 cups chocolate chips
1 tsp vanilla extract`,
  },
  {
    id: "muffins",
    label: "Blueberry Muffins",
    description: "Tender breakfast muffins",
    content: `Blueberry Muffins

2 cups all-purpose flour
½ cup granulated sugar
2 tsp baking powder
½ tsp salt
½ cup butter, melted
2 large eggs
¾ cup whole milk
1½ cups fresh blueberries
1 tsp vanilla extract`,
  },
  {
    id: "pancakes",
    label: "Buttermilk Pancakes",
    description: "Fluffy weekend pancakes",
    content: `Buttermilk Pancakes

1½ cups all-purpose flour
3 tbsp sugar
2 tsp baking powder
½ tsp salt
1¼ cups buttermilk
2 tbsp butter, melted
1 large egg
1 tsp vanilla extract`,
  },
];

export const PANTRY_STAPLES = [
  "Cooking oil",
  "Salt",
  "Onions",
  "Garlic",
  "Eggs",
  "Rice",
  "Pasta",
  "Canned tomatoes",
  "Butter",
  "Flour",
  "Chicken or vegetable broth",
  "Lemons",
] as const;
