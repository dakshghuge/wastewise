const safetyByCategory = {
  hazardous: 'Keep the item isolated and intact. Do not open, mix, burn, or pour out its contents. Contact an authorized hazardous-waste service for handling and disposal instructions.',
  electronic: 'Do not dismantle the device, remove batteries, burn, or crush it. Use an authorized e-waste collection or take-back service.',
  glass: 'For broken glass, avoid direct contact, contain it securely, and follow local disposal instructions.',
  organic: 'Use a local organics collection or composting system only for materials it accepts.',
  unknown: 'The item could not be confidently identified. Keep it separate and consult your local waste authority.'
};

function getDisposalGuidance(category) {
  return {
    category,
    handling: safetyByCategory[category] || 'Keep the item clean and separate while checking local collection instructions.',
    channel: ['hazardous', 'electronic'].includes(category)
      ? 'Use an authorized local specialist or take-back service; availability is not verified by this application.'
      : 'Check with your local waste authority or recycling facility before disposal.',
    locationSpecific: false
  };
}

module.exports = { getDisposalGuidance };
