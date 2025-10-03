export type ParsedCommand =
  | { action: 'add'; payload: { quantity: number; unit: string; item: string; price: number } }
  | { action: 'remove'; payload: { item: string } }
  | { action: 'calculate' | 'reset'; payload: null };

const unitMap: { [key: string]: string } = {
  kilo: 'kg',
  kilogram: 'kg',
  piece: 'pcs',
  pieces: 'pcs',
  litre: 'ltr',
  liter: 'ltr',
  gram: 'g',
  grams: 'g',
};

const normalizeUnit = (unit: string): string => {
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

export const parseCommand = (command: string): ParsedCommand | null => {
  const cmd = command.toLowerCase().trim();

  // Rule: "add <quantity> <unit> <item> for <price>"
  const addRegex = /^add\s+(\d+(\.\d+)?)\s+(kg|kilo|kilogram|pcs|piece|pieces|g|gram|grams|ltr|litre|liter)\s+(.+?)\s+for\s+(\d+(\.\d+)?)$/i;
  const addMatch = cmd.match(addRegex);
  if (addMatch) {
    return {
      action: 'add',
      payload: {
        quantity: parseFloat(addMatch[1]),
        unit: normalizeUnit(addMatch[3]),
        item: addMatch[4].trim(),
        price: parseFloat(addMatch[5]),
      },
    };
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

  // Rule: "calculate total" or "kanak"
  if (cmd === 'calculate total' || cmd === 'kanak') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill"
  if (cmd === 'reset bill') {
    return { action: 'reset', payload: null };
  }

  return null;
};
