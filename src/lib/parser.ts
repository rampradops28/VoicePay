
export type ParsedCommand =
  | { action: 'add'; payload: { item: string; quantity: number; unit: string; price: number } }
  | { action: 'remove'; payload: { item: string } }
  | { action: 'calculate' | 'reset' | 'save'; payload: null };

const unitMap: { [key: string]: string } = {
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  piece: 'pcs',
  pieces: 'pcs',
  litre: 'ltr',
  liter: 'ltr',
  liters: 'ltr',
  gram: 'g',
  grams: 'g',
  ml: 'ml',
  millilitre: 'ml',
  milliliter: 'ml',
  packet: 'pkt',
  packets: 'pkt',
};

const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

// Function to remove leading articles and noise words
const stripLeadingNoise = (text: string): string => {
  // Matches words like "a", "an", "add", "at", "had" at the start of the string
  return text.replace(/^(a|an|add|at|had)\s+/i, '').trim();
};


export const parseCommand = (command: string): ParsedCommand[] | null => {
  const cmd = command.toLowerCase().trim();

  // Split command by "and" to handle chained commands
  const commandSegments = cmd.split(/\s+and\s+/i);
  
  const parsedCommands: ParsedCommand[] = [];

  for (let segment of commandSegments) {
    segment = segment.trim();
    if (!segment) continue;

    // Rule: "remove <item>", "delete <item>"
    const removeRegex = /^(?:remove|delete|cancel)\s+(.+)$/i;
    const removeMatch = segment.match(removeRegex);
    if (removeMatch) {
      parsedCommands.push({
        action: 'remove',
        payload: {
          item: stripLeadingNoise(removeMatch[1].trim()),
        },
      });
      continue;
    }

    // Rule: "clear bill" or "reset bill" or just "reset"
    if (segment.includes('clear') || segment.includes('reset')) {
      parsedCommands.push({ action: 'reset', payload: null });
      continue;
    }

    // Rule: "save bill" or just "save"
    if (segment.includes('save')) {
      parsedCommands.push({ action: 'save', payload: null });
      continue;
    }

    // Rule: "What's the total?" or "kanak"
    if (segment.includes('total') || segment.includes('kanak')) {
      parsedCommands.push({ action: 'calculate', payload: null });
      continue;
    }

    // If it's not a special command, assume it's an "add" command.
    let content = segment;
    let price: number | null = null;
    let quantity: number | null = null;
    let unit: string = '';

    // Regex to find price like "50rs", "50 rupees", "at 50"
    const priceRegex = /(?:(\d+(\.\d+)?)\s*(?:rs|rupees)|at\s+(\d+(\.\d+)?))/i;
    const priceMatch = content.match(priceRegex);

    if (priceMatch) {
      price = parseFloat(priceMatch[1] || priceMatch[3]);
      content = content.replace(priceRegex, '').trim();
    }
    
    // Regex to find quantity and unit like "2kg", "2 kg", "2"
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*([a-zA-Z]+)?/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    
    if (qtyUnitMatch) {
      quantity = parseFloat(qtyUnitMatch[1]);
      if (qtyUnitMatch[3]) {
        unit = normalizeUnit(qtyUnitMatch[3]);
      }
      content = content.replace(qtyUnitRegex, '').trim();
    }
    
    // Fallback if price is at the end without "rs"
    if (price === null) {
      const standalonePriceRegex = /(\d+(\.\d+)?)\s*$/;
      const standalonePriceMatch = content.match(standalonePriceRegex);
      if(standalonePriceMatch){
        price = parseFloat(standalonePriceMatch[1]);
        content = content.replace(standalonePriceRegex, '').trim();
      }
    }
    
    const rawItemName = content.replace(/\s+/g, ' ').trim();
    const itemName = stripLeadingNoise(rawItemName);

    // Only create an 'add' command if we have all the necessary parts
    if (itemName && quantity !== null && price !== null) {
      parsedCommands.push({
        action: 'add',
        payload: {
          item: itemName,
          quantity: quantity,
          unit: unit || 'pcs', 
          price: price,
        },
      });
      continue;
    }
  }

  return parsedCommands.length > 0 ? parsedCommands : null;
};
