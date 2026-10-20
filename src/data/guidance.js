const guides = {
  plastic: {
    preparationSteps: ['Empty the container.', 'Rinse it if your local program requires this.', 'Check the resin type and local acceptance rules.'],
    acceptedMaterials: ['Some clean bottles and rigid containers, depending on local rules.'],
    rejectedMaterials: ['Plastic film, foam, and mixed-material packaging unless specifically accepted.'],
    safetyNotes: ['Do not burn, melt, or heat plastic.'],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  paper: {
    preparationSteps: ['Keep paper clean and dry.', 'Remove non-paper bindings where practical.'],
    acceptedMaterials: ['Clean office paper and newspapers, where locally accepted.'],
    rejectedMaterials: ['Greasy, wet, or heavily food-soiled paper.'],
    safetyNotes: [],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  cardboard: {
    preparationSteps: ['Empty the box.', 'Keep it dry and flatten it.', 'Remove excessive tape if required locally.'],
    acceptedMaterials: ['Clean corrugated cardboard and paperboard, where accepted.'],
    rejectedMaterials: ['Wet, wax-coated, or heavily food-soiled cardboard.'],
    safetyNotes: [],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  glass: {
    preparationSteps: ['Empty containers and check local sorting rules.', 'Keep broken glass separate and contained.'],
    acceptedMaterials: ['Some glass bottles and jars, where accepted.'],
    rejectedMaterials: ['Window glass, ceramics, mirrors, and heat-resistant glass in container-glass bins.'],
    safetyNotes: ['Wear protective gloves when handling broken glass.'],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  metal: {
    preparationSteps: ['Empty containers.', 'Rinse if required by your local service.'],
    acceptedMaterials: ['Some clean steel and aluminum packaging.'],
    rejectedMaterials: ['Pressurized cylinders, batteries, and contaminated metal.'],
    safetyNotes: ['Take care with sharp edges.'],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  organic: {
    preparationSteps: ['Separate food scraps from packaging.', 'Use only materials accepted by your composting service.'],
    acceptedMaterials: ['Fruit and vegetable scraps, where accepted.'],
    rejectedMaterials: ['Meat, dairy, oils, and compostable packaging unless explicitly accepted.'],
    safetyNotes: ['Keep food waste sealed to reduce pests and odors.'],
    source: 'General household guidance; verify with your local waste authority.',
    lastVerifiedAt: null
  },
  electronic: {
    preparationSteps: ['Keep the device intact.', 'Use an authorized e-waste collection point or take-back program.'],
    acceptedMaterials: ['Devices accepted by the specific collection provider.'],
    rejectedMaterials: ['Do not place electronics or batteries in household recycling unless explicitly instructed.'],
    safetyNotes: ['Do not dismantle, puncture, or crush batteries or electronics.'],
    source: 'General safety guidance; contact an authorized local e-waste service.',
    lastVerifiedAt: null
  },
  textile: {
    preparationSteps: ['Check whether the item is clean and dry.', 'Confirm donation or textile recycling acceptance first.'],
    acceptedMaterials: ['Wearable or reusable textiles accepted by a named local program.'],
    rejectedMaterials: ['Wet, moldy, or contaminated textiles unless a service accepts them.'],
    safetyNotes: [],
    source: 'General household guidance; verify with the local service.',
    lastVerifiedAt: null
  },
  hazardous: {
    preparationSteps: ['Keep the item in its original container if safe.', 'Contact an authorized hazardous-waste service for instructions.'],
    acceptedMaterials: ['Only materials expressly accepted by the authorized facility.'],
    rejectedMaterials: ['Do not place in ordinary recycling or household waste without local guidance.'],
    safetyNotes: ['Do not open, mix, heat, burn, or pour contents down a drain.'],
    source: 'Safety guidance; follow local hazardous-waste authority instructions.',
    lastVerifiedAt: null
  }
};

const fallbackGuide = {
  preparationSteps: ['Separate the item from ordinary recycling until you confirm local instructions.', 'Contact your local waste authority or a suitable specialist facility.'],
  acceptedMaterials: [],
  rejectedMaterials: [],
  safetyNotes: ['Do not burn or dismantle items that may be hazardous.'],
  source: 'General safety guidance; verify locally.',
  lastVerifiedAt: null
};

const ideas = [
  { id: 'bottle-planter', title: 'Bottle planter', description: 'Reuse a clean, intact bottle as a simple planter for non-food plants.', category: 'plastic', materials: ['Clean bottle', 'Scissors'], difficulty: 'easy', estimatedTime: '20 minutes', steps: ['Wash and dry the bottle.', 'Ask an adult for help making drainage holes.', 'Add suitable soil and a small plant.'], safetyNotes: ['Avoid sharp edges; do not use for food or drink after modification.'] },
  { id: 'box-organizer', title: 'Cardboard drawer organizer', description: 'Turn clean cardboard into dividers for a drawer or desk.', category: 'cardboard', materials: ['Clean cardboard', 'Ruler', 'Scissors'], difficulty: 'easy', estimatedTime: '15 minutes', steps: ['Flatten and measure the cardboard.', 'Cut strips to fit the drawer.', 'Slot strips together to create compartments.'], safetyNotes: ['Use scissors carefully. Keep cardboard dry.'] },
  { id: 'jar-storage', title: 'Small-item jar storage', description: 'Reuse a clean glass jar to store dry craft supplies.', category: 'glass', materials: ['Clean jar'], difficulty: 'easy', estimatedTime: '5 minutes', steps: ['Wash and dry the jar thoroughly.', 'Check that the rim is not chipped.', 'Use it for dry, non-food craft supplies.'], safetyNotes: ['Do not use chipped jars or repurpose unknown containers for food.'] },
  { id: 'cloth-cleaning', title: 'Cleaning cloth from old fabric', description: 'Give clean, worn-out cotton fabric another use as a household cloth.', category: 'textile', materials: ['Clean cotton textile', 'Scissors'], difficulty: 'easy', estimatedTime: '10 minutes', steps: ['Wash and dry the fabric.', 'Cut into manageable squares.', 'Use for suitable household cleaning and launder after use.'], safetyNotes: ['Do not use contaminated textiles.'] },
  { id: 'scrap-compost', title: 'Compost suitable food scraps', description: 'Add accepted fruit and vegetable scraps to a suitable compost system.', category: 'organic', materials: ['Accepted food scraps', 'Compost system'], difficulty: 'easy', estimatedTime: '5 minutes', steps: ['Check the compost system’s accepted-material list.', 'Remove stickers and packaging.', 'Add scraps as directed by the system.'], safetyNotes: ['Follow local pest and composting guidance.'] }
];

module.exports = { guides, fallbackGuide, ideas };
