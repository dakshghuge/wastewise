const categories = [
  { id: 'plastic', name: 'Plastic', description: 'Bottles, containers, and other plastic items.', examples: ['Beverage bottles', 'Food tubs'], safety: 'Check local rules; never burn or heat plastic.' },
  { id: 'paper', name: 'Paper', description: 'Clean, dry paper products.', examples: ['Office paper', 'Newspapers'], safety: 'Keep recyclable paper dry and free of food contamination.' },
  { id: 'cardboard', name: 'Cardboard', description: 'Corrugated boxes and clean paperboard.', examples: ['Shipping boxes', 'Cereal boxes'], safety: 'Flatten clean, dry boxes; local acceptance varies.' },
  { id: 'glass', name: 'Glass', description: 'Glass containers and other glass items.', examples: ['Jars', 'Bottles'], safety: 'Handle broken glass carefully; do not put it loose in recycling.' },
  { id: 'metal', name: 'Metal', description: 'Metal packaging and household objects.', examples: ['Drink cans', 'Food tins'], safety: 'Sharp edges can cut; follow local collection rules.' },
  { id: 'organic', name: 'Organic waste', description: 'Food scraps and other compostable organic material.', examples: ['Fruit scraps', 'Coffee grounds'], safety: 'Only compost materials accepted by your local program.' },
  { id: 'electronic', name: 'Electronic waste', description: 'Devices and accessories containing electrical components.', examples: ['Phones', 'Cables'], safety: 'Do not dismantle devices; use an authorized e-waste service.' },
  { id: 'textile', name: 'Textile', description: 'Clothing, linens, and other fabric items.', examples: ['Clothing', 'Towels'], safety: 'Donation or textile acceptance depends on the item and local service.' },
  { id: 'wood', name: 'Wood', description: 'Untreated wood and wood products.', examples: ['Small offcuts', 'Crates'], safety: 'Painted, treated, or engineered wood may need special handling.' },
  { id: 'rubber', name: 'Rubber', description: 'Rubber products and components.', examples: ['Rubber bands', 'Mats'], safety: 'Specialist drop-off may be required.' },
  { id: 'construction', name: 'Construction waste', description: 'Building and renovation materials.', examples: ['Tiles', 'Drywall'], safety: 'Some materials may be hazardous; contact a qualified local service.' },
  { id: 'hazardous', name: 'Hazardous waste', description: 'Items that may pose chemical, fire, or exposure risks.', examples: ['Batteries', 'Chemical containers'], safety: 'Do not open, mix, burn, or place in ordinary recycling.' },
  { id: 'mixed', name: 'Mixed waste', description: 'Items made from multiple materials or difficult to separate.', examples: ['Composite packaging', 'Mixed-material objects'], safety: 'Check with your local waste authority before disposal.' },
  { id: 'unknown', name: 'Unknown', description: 'The item could not be confidently categorized.', examples: [], safety: 'Use cautious handling and seek local guidance.' }
];

const categoryById = new Map(categories.map((category) => [category.id, category]));

function getCategory(id) {
  return categoryById.get(id) || categoryById.get('unknown');
}

module.exports = { categories, getCategory, categoryById };
