
export interface GroceryItem {
  en: string;
  ta: string;
}

export const groceryCategories: { [key: string]: GroceryItem[] } = {
    "Staples & Grains (தானியங்கள்)": [
        { en: 'rice', ta: 'அரிசி' },
        { en: 'sugar', ta: 'சர்க்கரை' },
        { en: 'salt', ta: 'உப்பு' },
        { en: 'dal', ta: 'பருப்பு' },
        { en: 'wheat', ta: 'கோதுமை' },
        { en: 'flour', ta: 'மாவு' },
        { en: 'oil', ta: 'எண்ணெய்' },
        { en: 'ghee', ta: 'நெய்' },
        { en: 'milk', ta: 'பால்' },
        { en: 'yogurt', ta: 'தயிர்' },
        { en: 'tea', ta: 'தேயிலை' },
        { en: 'coffee', ta: 'காபி' },
        { en: 'biscuit', ta: 'பிஸ்கட்' },
        { en: 'bread', ta: 'ரொட்டி' },
        { en: 'eggs', ta: 'முட்டை' },
        { en: 'jaggery', ta: 'வெல்லம்' },
    ],
    "Vegetables (காய்கறிகள்)": [
        { en: 'tomato', ta: 'தக்காளி' },
        { en: 'potato', ta: 'உருளைக்கிழங்கு' },
        { en: 'onion', ta: 'வெங்காயம்' },
        { en: 'garlic', ta: 'பூண்டு' },
        { en: 'ginger', ta: 'இஞ்சி' },
        { en: 'chilli', ta: 'மிளகாய்' },
        { en: 'lemon', ta: 'எலுமிச்சை' },
        { en: 'carrot', ta: 'கேரட்' },
        { en: 'cabbage', ta: 'முட்டைக்கோஸ்' },
        { en: 'cauliflower', ta: 'காலிபிளவர்' },
        { en: 'spinach', ta: 'கீரை' },
        { en: 'coriander', ta: 'கொத்துமல்லி' },
        { en: 'mint', ta: 'புதினா' },
        { en: 'brinjal', ta: 'கத்திரிக்காய்' },
        { en: 'beans', ta: 'பீன்ஸ்' },
        { en: 'peas', ta: 'பட்டாணி' },
        { en: 'cucumber', ta: 'வெள்ளரிக்காய்' },
        { en: 'capsicum', ta: 'குடைமிளகாய்' },
        { en: 'beetroot', ta: 'பீட்ரூட்' },
        { en: 'radish', ta: 'முள்ளங்கி' },
        { en: 'okra', ta: 'வெண்டைக்காய்' },
        { en: 'pumpkin', ta: 'பூசணிக்காய்' },
        { en: 'drumstick', ta: 'முருங்கைக்காய்' },
    ],
    "Fruits (பழங்கள்)": [
        { en: 'apple', ta: 'ஆப்பிள்' },
        { en: 'banana', ta: 'வாழைப்பழம்' },
        { en: 'orange', ta: 'ஆரஞ்சு' },
        { en: 'mango', ta: 'மாம்பழம்' },
        { en: 'grapes', ta: 'திராட்சை' },
        { en: 'watermelon', ta: 'தர்பூசணி' },
        { en: 'pineapple', ta: 'அன்னாசி' },
        { en: 'papaya', ta: 'பப்பாளி' },
        { en: 'guava', ta: 'கொய்யா' },
        { en: 'pomegranate', ta: 'மாதுளை' },
        { en: 'coconut', ta: 'தேங்காய்' },
    ],
    "Spices & Masalas (மசாலாப் பொருட்கள்)": [
        { en: 'turmeric', ta: 'மஞ்சள்' },
        { en: 'cumin', ta: 'சீரகம்' },
        { en: 'mustard', ta: 'கடுகு' },
        { en: 'pepper', ta: 'மிளகு' },
        { en: 'cardamom', ta: 'ஏலக்காய்' },
        { en: 'cloves', ta: 'கிராம்பு' },
        { en: 'cinnamon', ta: 'இலவங்கப்பட்டை' },
        { en: 'fennel', ta: 'சோம்பு' },
    ],
    "Meats (இறைச்சி)": [
        { en: 'chicken', ta: 'கோழி' },
        { en: 'mutton', ta: 'ஆட்டிறைச்சி' },
        { en: 'fish', ta: 'மீன்' },
        { en: 'prawns', ta: 'இறால்' },
        { en: 'crab', ta: 'நண்டு' },
    ],
    "Household & Packaged Goods (வீட்டு உபயோகப் பொருட்கள்)": [
        { en: 'soap', ta: 'சோப்பு' },
        { en: 'shampoo', ta: 'ஷாம்பு' },
        { en: 'toothpaste', ta: 'பற்பசை' },
        { en: 'detergent', ta: 'சலவைத்தூள்' },
        { en: 'water', ta: 'தண்ணீர்' },
    ]
};

// A flat set of all English and Tamil grocery item names for quick lookups in the parser
export const groceryItems = new Set(
  Object.values(groceryCategories).flat().flatMap(item => [item.en.toLowerCase(), item.ta.toLowerCase()])
);

// A map from any name (English or Tamil) to the canonical English name
export const groceryNameMapping: Map<string, string> = new Map();
Object.values(groceryCategories).flat().forEach(item => {
    groceryNameMapping.set(item.en.toLowerCase(), item.en);
    groceryNameMapping.set(item.ta.toLowerCase(), item.en);
});
