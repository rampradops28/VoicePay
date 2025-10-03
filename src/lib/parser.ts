export type ParsedCommand =
  | { action: 'add'; payload: { item: string; quantity: number; unit: string; price: number } }
  | { action: 'remove'; payload: { item: string } }
  | { action: 'calculate' | 'reset'; payload: null };

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
};

const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

export const parseCommand = (command: string): ParsedCommand | null => {
  const cmd = command.toLowerCase().trim();

  // Flexible "add" command parsing
  // Supports formats like:
  // "add tomato 2kg 50rs"
  // "add 2kg tomato 50rs"
  // "add tomato 50rs 2kg"
  const addRegex = /add\s+(.+)/i;
  const addMatch = cmd.match(addRegex);

  if (addMatch) {
    const parts = addMatch[1].split(/\s+/).filter(p => p.length > 0);
    
    let itemParts: string[] = [];
    let quantity: number | null = null;
    let unit: string | null = null;
    let price: number | null = null;

    const quantityUnitRegex = /^(\d+(\.\d+)?)\s*(kg|kilo|kilogram|kilograms|pcs|piece|pieces|g|gram|grams|ltr|litre|liters)?$/i;
    const priceRegex = /^(\d+(\.\d+)?)\s*r?s?$/i;

    for (const part of parts) {
      // Is it a price? (e.g., "50rs", "50")
      if (price === null) {
        const priceMatch = part.match(priceRegex);
        if (priceMatch && !part.match(quantityUnitRegex)) { // Make sure it's not also a quantity like "2kg"
            // Let's check if the next part is also a number without unit, if so, this part is likely part of the item name
            const nextPartIndex = parts.indexOf(part) + 1;
            if (nextPartIndex < parts.length) {
                const nextPart = parts[nextPartIndex];
                if (!nextPart.match(priceRegex) && !nextPart.match(quantityUnitRegex)) {
                    price = parseFloat(priceMatch[1]);
                    continue;
                }
            } else {
                 price = parseFloat(priceMatch[1]);
                 continue;
            }
        }
      }

      // Is it a quantity and unit? (e.g., "2kg", "5")
       if (quantity === null) {
        const quantityUnitMatch = (addMatch[1]).match(/(\d+(\.\d+)?)\s*(kg|kilo|kilogram|kilograms|pcs|piece|pieces|g|gram|grams|ltr|litre|liters)/i);
        if(quantityUnitMatch){
            quantity = parseFloat(quantityUnitMatch[1]);
            unit = normalizeUnit(quantityUnitMatch[3]);
            addMatch[1] = addMatch[1].replace(quantityUnitMatch[0], '').trim();
            continue;
        }
      }

    }
    
    // The rest is the item name
    const remainingParts = addMatch[1].split(/\s+/).filter(p => p.length > 0);
    let itemPrice : number | null = null;
    for(const part of remainingParts){
        const priceMatch = part.match(priceRegex);
        if(priceMatch){
            itemPrice = parseFloat(priceMatch[1]);
        } else {
            itemParts.push(part);
        }
    }
    if(!price) price = itemPrice;


    if (itemParts.length > 0 && quantity !== null && price !== null) {
      return {
        action: 'add',
        payload: {
          item: itemParts.join(' '),
          quantity,
          unit: unit || '',
          price,
        },
      };
    }
  }

  // Rule: "remove <item>"
  const removeRegex = /^remove\s+(.+)$/i;
  const removeMatch = cmd.match(removeRegex);
  if (removeMatch) {
    return {
      action: 'remove',
      payload: {
        item: removeMatch[1].trim(),
      },
    };
  }

  // Rule: "calculate total" or "kanak" or "total"
  if (cmd === 'calculate total' || cmd === 'kanak' || cmd === 'total') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill" or "reset"
  if (cmd === 'reset bill' || cmd === 'reset') {
    return { action: 'reset', payload: null };
  }

  return null;
};
