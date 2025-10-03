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
};

const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

// Function to remove leading articles like "a" or "an"
const stripArticle = (text: string): string => {
  return text.replace(/^(a|an)\s+/i, '').trim();
};


export const parseCommand = (command: string): ParsedCommand[] | null => {
  const cmd = command.toLowerCase().trim();

  // Split command by "and" or "add" to handle chained commands
  const commandSegments = cmd.split(/\s+(?:and|add)\s+/i);
  
  const parsedCommands: ParsedCommand[] = [];

  // Always prepend "add" to the first segment if it's not a special command
  const firstSegment = commandSegments[0].trim();
  if (!/^(remove|delete|cancel|clear|reset|save|total|kanak)/.test(firstSegment)) {
      if (!firstSegment.startsWith('add')) {
        commandSegments[0] = 'add ' + firstSegment;
      }
  }


  for (let segment of commandSegments) {
    segment = segment.trim();
    if (!segment) continue;

    // Re-add "add" if it was stripped by the split, for subsequent segments
    if (!/^(add|remove|delete|cancel|clear|reset|save|total|kanak)/.test(segment)) {
      segment = 'add ' + segment;
    }

    // Rule: "remove <item>"
    const removeRegex = /^(?:remove|delete|cancel)\s+(.+)$/i;
    const removeMatch = segment.match(removeRegex);
    if (removeMatch) {
      parsedCommands.push({
        action: 'remove',
        payload: {
          item: stripArticle(removeMatch[1].trim()),
        },
      });
      continue;
    }

    // Rule: "clear bill" or "reset bill"
    if (segment.includes('clear bill') || segment.includes('reset bill')) {
      parsedCommands.push({ action: 'reset', payload: null });
      continue;
    }

    // Rule: "save bill"
    if (segment.includes('save bill')) {
      parsedCommands.push({ action: 'save', payload: null });
      continue;
    }

    // Rule: "What's the total?" or "kanak"
    if (segment.includes('total') || segment.includes('kanak')) {
      parsedCommands.push({ action: 'calculate', payload: null });
      continue;
    }

    const addRegex = /^add\s+(.+)/i;
    const addMatch = segment.match(addRegex);
    if (addMatch) {
      let content = addMatch[1];
      let price: number | null = null;
      let quantity: number | null = null;
      let unit: string = '';

      const priceRegex = /(?:(\d+(\.\d+)?)\s*(?:rs|rupees))/i;
      const priceMatch = content.match(priceRegex);

      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        content = content.replace(priceRegex, '').trim();
      }
      
      // Regex to capture a number and an optional following word (as the unit)
      const qtyUnitRegex = /(\d+(\.\d+)?)\s*([a-zA-Z]+)?\b/i;
      const qtyUnitMatch = content.match(qtyUnitRegex);
      
      if (qtyUnitMatch) {
        quantity = parseFloat(qtyUnitMatch[1]);
        if (qtyUnitMatch[3]) {
          unit = normalizeUnit(qtyUnitMatch[3]);
        }
        content = content.replace(qtyUnitRegex, '').trim();
      }

      if (quantity === null) {
        const standaloneQtyRegex = /^\s*(\d+(\.\d+)?)\b/;
        const standaloneQtyMatch = content.match(standaloneQtyRegex);
        if (standaloneQtyMatch) {
          quantity = parseFloat(standaloneQtyMatch[1]);
          content = content.replace(standaloneQtyRegex, '').trim();
        }
      }
      
      if (price === null) {
        const standalonePriceRegex = /(\d+(\.\d+)?)\s*$/;
        const standalonePriceMatch = content.match(standalonePriceRegex);
        if(standalonePriceMatch){
          price = parseFloat(standalonePriceMatch[1]);
          content = content.replace(standalonePriceRegex, '').trim();
        }
      }
      
      const rawItemName = content.replace(/\s+/g, ' ').trim();
      const itemName = stripArticle(rawItemName);

      if (itemName && quantity !== null && price !== null) {
        parsedCommands.push({
          action: 'add',
          payload: {
            item: itemName,
            quantity: quantity,
            unit: unit || 'pcs', 
            price: price, // price is now unitPrice
          },
        });
        continue;
      }
    }
  }

  return parsedCommands.length > 0 ? parsedCommands : null;
};