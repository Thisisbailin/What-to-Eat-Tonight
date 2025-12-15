import { NutritionData } from '../types';

export interface PredefinedRecipe extends Omit<NutritionData, 'feedback' | 'suggestion'> {
  name: string;
  keywords: string[]; // Keywords for fuzzy matching
  defaultFeedback: string;
}

export const RECIPE_DATABASE: PredefinedRecipe[] = [
  {
    name: "番茄炒蛋",
    keywords: ["番茄", "西红柿", "炒蛋", "鸡蛋"],
    calories: 220,
    protein: "14g",
    carbs: "10g",
    fat: "16g",
    tags: ["家常菜", "国民菜", "高蛋白"],
    healthScore: 88,
    defaultFeedback: "经典的国民下饭菜，酸甜开胃，蛋白质和维生素都不错哦！",
  },
  {
    name: "水煮鸡胸肉",
    keywords: ["鸡胸", "水煮", "减肥"],
    calories: 165,
    protein: "31g",
    carbs: "0g",
    fat: "3.6g",
    tags: ["减脂", "高蛋白", "低碳"],
    healthScore: 95,
    defaultFeedback: "减脂期的黄金搭档，蛋白质满满，记得多喝水帮助代谢哦。",
  },
  {
    name: "宫保鸡丁",
    keywords: ["宫保", "鸡丁", "花生"],
    calories: 320,
    protein: "22g",
    carbs: "14g",
    fat: "20g",
    tags: ["川菜", "下饭", "微辣"],
    healthScore: 75,
    defaultFeedback: "鸡肉提供了优质蛋白，不过酱汁热量略高，配饭要控制量哦。",
  },
  {
    name: "清炒时蔬",
    keywords: ["青菜", "菠菜", "油麦菜", "炒青菜", "素菜"],
    calories: 80,
    protein: "2g",
    carbs: "5g",
    fat: "6g",
    tags: ["高纤维", "维生素", "清淡"],
    healthScore: 92,
    defaultFeedback: "补充膳食纤维的好选择，肠道会感谢你的！",
  },
  {
    name: "红烧牛肉面",
    keywords: ["牛肉面", "面条", "红烧"],
    calories: 550,
    protein: "25g",
    carbs: "75g",
    fat: "18g",
    tags: ["碳水满足", "暖胃", "主食"],
    healthScore: 65,
    defaultFeedback: "热腾腾的很满足，但碳水和钠含量较高，建议下一餐多吃点蔬菜平衡一下。",
  },
  {
    name: "鲜肉水饺 (10个)",
    keywords: ["饺子", "水饺"],
    calories: 450,
    protein: "18g",
    carbs: "50g",
    fat: "20g",
    tags: ["传统美食", "碳水+蛋白"],
    healthScore: 70,
    defaultFeedback: "好吃不过饺子！注意蘸料里的油和盐不要太多哦。",
  },
  {
    name: "燕麦牛奶粥",
    keywords: ["燕麦", "牛奶", "早饭", "粥"],
    calories: 280,
    protein: "12g",
    carbs: "35g",
    fat: "8g",
    tags: ["低GI", "早餐", "膳食纤维"],
    healthScore: 90,
    defaultFeedback: "非常健康的早餐选择！低GI碳水能提供持久的饱腹感。",
  },
  {
    name: "麻辣烫 (含肉菜)",
    keywords: ["麻辣烫", "冒菜"],
    calories: 600,
    protein: "20g",
    carbs: "40g",
    fat: "45g",
    tags: ["重口味", "高油高盐"],
    healthScore: 40,
    defaultFeedback: "虽然解馋，但油脂和盐分很容易超标，汤尽量少喝哦，多喝水！",
  },
  {
    name: "蔬菜沙拉 (低脂酱)",
    keywords: ["沙拉", "轻食", "草"],
    calories: 150,
    protein: "5g",
    carbs: "12g",
    fat: "8g",
    tags: ["轻食", "维生素", "减脂"],
    healthScore: 92,
    defaultFeedback: "清爽无负担，感觉身体都变轻盈了呢！",
  },
  {
    name: "米饭 (一碗)",
    keywords: ["米饭", "白饭"],
    calories: 220,
    protein: "4g",
    carbs: "48g",
    fat: "0.5g",
    tags: ["主食", "精制碳水"],
    healthScore: 60,
    defaultFeedback: "基础能量来源，如果能换成杂粮饭就更完美啦。",
  }
];

export const searchRecipes = (query: string): PredefinedRecipe[] => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return RECIPE_DATABASE.filter(r => 
    r.name.includes(query) || r.keywords.some(k => k.includes(lowerQuery))
  );
};

export const getExactRecipeMatch = (query: string): PredefinedRecipe | undefined => {
  if (!query) return undefined;
  const lowerQuery = query.toLowerCase();
  // Try exact name match first
  let match = RECIPE_DATABASE.find(r => r.name === query);
  
  // Try matching keyword exactly if name match fails
  if (!match) {
      match = RECIPE_DATABASE.find(r => r.keywords.includes(lowerQuery));
  }
  
  return match;
}