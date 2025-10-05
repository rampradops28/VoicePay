
export const groceryCategories: { [key: string]: string[] } = {
    "Staples & Grains (தானியங்கள்)": [
        'rice', 'sugar', 'salt', 'dal', 'lentils', 'wheat', 'flour', 'oil',
        'ghee', 'milk', 'yogurt', 'curd', 'cheese', 'paneer', 'butter',
        'tea', 'coffee', 'biscuit', 'bread', 'eggs', 'atta', 'maida', 'sooji', 'rava',
        'poha', 'jaggery', 'vermicelli', 'pasta', 'noodles', 'oats', 'semolina',
        'basmati', 'sona masuri', 'idli rice',
        'arisi', 'sarkarai', 'sakkarai', 'uppu', 'paruppu', 'gothumai', 'maavu', 'ennai',
        'nei', 'paal', 'thayir', 'vennai', 'semiya', 'godhumai',
        'vellam', 'karupatti',
    ],
    "Vegetables (காய்கறிகள்)": [
        'tomato', 'potato', 'onion', 'garlic', 'ginger', 'chilli', 'lemon',
        'carrot', 'cabbage', 'cauliflower', 'spinach', 'coriander', 'mint',
        'brinjal', 'eggplant', 'beans', 'peas', 'cucumber', 'capsicum',
        'beetroot', 'radish', 'ladyfinger', 'okra', 'pumpkin', 'bottle gourd',
        'ridge gourd', 'snake gourd', 'drumstick', 'broccoli', 'mushroom',
        'sweet potato', 'corn', 'lettuce', 'celery', 'bell pepper',
        'thakkali', 'urulaikilangu', 'vengayam', 'poondu', 'inji', 'milagai', 'elumichai',
        'karattu', 'muttakosu', 'kalipilavar', 'pasalai', 'kothamalli', 'pudhina',
        'kathirikai', 'keerai', 'avarakkai', 'pattani', 'vellarikkai', 'kodaimilagai',
        'vendakkai', 'murungakkai', 'peerkangai', 'pudalangai', 'poosanikai',
        'sakaravalli kizhangu', 'kalan',
    ],
    "Fruits (பழங்கள்)": [
        'apple', 'banana', 'orange', 'mango', 'grapes', 'watermelon', 'pineapple',
        'papaya', 'guava', 'pomegranate', 'strawberry', 'chickoo', 'sapota',
        'muskmelon', 'coconut',
        'appil', 'vazhaipazham', 'aranju', 'mampazham', 'thiratchai', 'tharpoosani',
        'pappali', 'annasi', 'koyya', 'madhulai', 'thengai',
    ],
    "Spices & Masalas (மசாலாப் பொருட்கள்)": [
        'turmeric', 'cumin', 'mustard', 'pepper', 'cardamom', 'cloves', 'cinnamon',
        'asafoetida', 'fenugreek', 'bay leaf', 'coriander powder', 'chilli powder',
        'garam masala', 'sambar powder', 'rasam powder', 'fennel',
        'manjal', 'jeeragam', 'kadugu', 'milagu', 'elakkai', 'kirambu', 'lavangam',
        'pattai', 'perungayam', 'vendhayam', 'birinji ilai', 'sombu',
    ],
    "Meats (இறைச்சி)": [
        'chicken', 'mutton', 'fish', 'prawns', 'crab',
        'koli', 'kari', 'meen', 'eral', 'nandu',
    ],
    "Household & Packaged Goods (வீட்டு உபயோகப் பொருட்கள்)": [
        'soap', 'shampoo', 'toothpaste', 'detergent', 'water', 'soda', 'juice',
        'chips', 'nuts', 'cashews', 'almonds', 'raisins', 'dates', 'ketchup',
        'jam', 'pickle', 'honey', 'vinegar',
        'soppu', 'shampu', 'palpod', 'salavai', 'thanni'
    ]
};

// A flat set for quick lookups in the parser
export const groceryItems = new Set(Object.values(groceryCategories).flat());
