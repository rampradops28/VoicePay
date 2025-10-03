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

const tamilNumberMap: { [key: string]: string } = {
    'ஒன்று': '1', 'இரண்டு': '2', 'மூன்று': '3', 'நான்கு': '4', 'ஐந்து': '5',
    'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9', 'பத்து': '10',
    'இருபது': '20', 'முப்பது': '30', 'நாற்பது': '40', 'ஐம்பது': '50',
    'அறுபது': '60', 'எழுபது': '70', 'என்பது': '80', 'தொண்ணூறு': '90',
    'நூறு': '100', 'ஆயிரம்': '1000'
};

const convertTamilNumbers = (text: string): string => {
    let convertedText = text;
    for (const tamil in tamilNumberMap) {
        const regex = new RegExp(tamil, 'g');
        convertedText = convertedText.replace(regex, tamilNumberMap[tamil]);
    }
    return convertedText;
};


const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

const stripLeadingNoise = (text: string): string => {
  return text.replace(/^(a|an|add|at|had|remove|delete|cancel)\s+/i, '').trim();
};


export const parseCommand = (command: string): ParsedCommand[] | null => {
  const tamilConvertedCommand = convertTamilNumbers(command);
  const cmd = tamilConvertedCommand.toLowerCase().trim();

  const commandSegments = cmd.split(/\s+(?:and|మరియు|ಮತ್ತು|കൂടാതെ)\s+/i);
  
  const parsedCommands: ParsedCommand[] = [];

  for (let segment of commandSegments) {
    segment = segment.trim();
    if (!segment) continue;

    const removeRegex = /^(?:remove|delete|cancel|நீக்கு)\s+(.+)$/i;
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

    if (segment.includes('clear') || segment.includes('reset') || segment.includes('அழி')) {
      parsedCommands.push({ action: 'reset', payload: null });
      continue;
    }

    if (segment.includes('save') || segment.includes('சேமி')) {
      parsedCommands.push({ action: 'save', payload: null });
      continue;
    }

    if (segment.includes('total') || segment.includes('kanak') || segment.includes('மொத்தம்')) {
      parsedCommands.push({ action: 'calculate', payload: null });
      continue;
    }

    let content = segment;
    let price: number | null = null;
    let quantity: number | null = null;
    let unit: string = '';

    const priceRegex = /(?:(\d+(\.\d+)?)\s*(?:rs|rupees|ரூ)|at\s+(\d+(\.\d+)?))/i;
    const priceMatch = content.match(priceRegex);

    if (priceMatch) {
      price = parseFloat(priceMatch[1] || priceMatch[3]);
      content = content.replace(priceRegex, '').trim();
    }
    
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*([a-zA-Z]+)?/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    
    if (qtyUnitMatch) {
      quantity = parseFloat(qtyUnitMatch[1]);
      if (qtyUnitMatch[3]) {
        unit = normalizeUnit(qtyUnitMatch[3]);
      }
      content = content.replace(qtyUnitRegex, '').trim();
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
    const itemName = stripLeadingNoise(rawItemName);

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
