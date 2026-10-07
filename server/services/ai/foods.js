// Prototype food catalogue (rough illustrative values per typical school-meal portion).
// These are NOT clinical data.
const F = (en, ar, pen, par, carbs, protein, fat, fiber, extra = {}) => ({
  name: { en, ar }, portion: { en: pen, ar: par }, carbs, protein, fat, fiber, ...extra,
});

export const FOODS = {
  grilled_chicken: F('Grilled chicken', 'دجاج مشوي', '1 breast (~120 g)', 'صدر واحد (~120 غ)', 0, 25, 6, 0),
  rice: F('White rice', 'أرز أبيض', '¾ cup cooked', '¾ كوب مطبوخ', 40, 4, 1, 1),
  salad: F('Green salad', 'سلطة خضراء', '1 bowl', 'وعاء واحد', 8, 2, 5, 5),
  water: F('Water', 'ماء', '1 bottle', 'زجاجة', 0, 0, 0, 0, { drink: true }),
  pizza: F('Pizza', 'بيتزا', '2 slices', 'شريحتان', 60, 22, 22, 3),
  orange_juice: F('Orange juice', 'عصير برتقال', '1 cup (250 ml)', 'كوب (250 مل)', 26, 1, 0, 0, { drink: true, sugary: true }),
  fruit: F('Fruit (apple)', 'فاكهة (تفاحة)', '1 medium', 'حبة متوسطة', 19, 1, 0, 3),
  sandwich: F('Turkey & cheese sandwich', 'ساندويتش ديك رومي وجبن', '1 sandwich', 'ساندويتش واحد', 32, 18, 9, 3),
  yogurt: F('Plain yogurt', 'زبادي سادة', '1 cup', 'كوب', 12, 9, 4, 0),
  apple: F('Apple', 'تفاحة', '1 medium', 'حبة متوسطة', 19, 1, 0, 3),
  banana: F('Banana', 'موز', '1 medium', 'حبة متوسطة', 27, 1, 0, 3),
  pasta: F('Pasta', 'معكرونة', '1 cup cooked', 'كوب مطبوخ', 43, 8, 1, 3),
  burger: F('Burger', 'برجر', '1 burger', 'قطعة واحدة', 35, 25, 20, 2),
  fries: F('French fries', 'بطاطس مقلية', '1 small serving', 'حصة صغيرة', 36, 3, 15, 3),
  soda: F('Soft drink', 'مشروب غازي', '1 can (330 ml)', 'علبة (330 مل)', 35, 0, 0, 0, { drink: true, sugary: true }),
  milk: F('Milk', 'حليب', '1 cup', 'كوب', 12, 8, 5, 0, { drink: true }),
  boiled_egg: F('Boiled egg', 'بيض مسلوق', '2 eggs', 'بيضتان', 1, 12, 10, 0),
  whole_bread: F('Whole-wheat bread', 'خبز أسمر', '2 slices', 'شريحتان', 24, 8, 2, 4),
  hummus: F('Hummus', 'حمص', '¼ cup', '¼ كوب', 9, 4, 6, 3),
  cucumber: F('Cucumber & carrots', 'خيار وجزر', '1 cup', 'كوب', 6, 1, 0, 2),
  dates: F('Dates', 'تمر', '3 dates', '3 حبات', 54, 1, 0, 5),
  cake: F('Cake slice', 'قطعة كيك', '1 slice', 'شريحة', 45, 4, 16, 1, { sweet: true }),
  nuts: F('Mixed nuts', 'مكسرات', '1 small handful', 'حفنة صغيرة', 6, 6, 15, 3),
  chocolate_milk: F('Chocolate milk', 'حليب بنكهة الشوكولاتة', '1 carton', 'علبة', 28, 8, 5, 1, { drink: true, sugary: true }),
};

export const DEMO_MEALS = [
  { id: 'demo_1', title: { en: 'Grilled chicken, rice, salad & water', ar: 'دجاج مشوي وأرز وسلطة وماء' }, foods: ['grilled_chicken', 'rice', 'salad', 'water'] },
  { id: 'demo_2', title: { en: 'Pizza, juice & fruit', ar: 'بيتزا وعصير وفاكهة' }, foods: ['pizza', 'orange_juice', 'fruit'] },
  { id: 'demo_3', title: { en: 'Sandwich, yogurt & apple', ar: 'ساندويتش وزبادي وتفاحة' }, foods: ['sandwich', 'yogurt', 'apple'] },
];

export const foodCatalog = () => Object.entries(FOODS).map(([key, f]) => ({ key, name: f.name, portion: f.portion, carbs: f.carbs }));
