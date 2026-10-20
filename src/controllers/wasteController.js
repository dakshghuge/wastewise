const { categories, categoryById } = require('../config/categories');
const { recognizeWaste } = require('../services/ai/wasteRecognitionService');
const { getIdeas } = require('../services/recommendationService');
const { getGuideAsync } = require('../services/recyclingService');
const { getDisposalGuidance } = require('../services/disposalService');

async function analyze(req, res, next) {
  try {
    const providedCategory = req.body.category;
    if (!req.file && !providedCategory) return res.status(400).json({ error: 'Choose an image or select a category for manual mode.' });
    let recognition;
    let mode = 'ai';

    if (req.file) {
      try {
        recognition = await recognizeWaste(req.file.buffer, req.imageMimeType);
      } catch (error) {
        if (error.code === 'AI_NOT_CONFIGURED') {
          return res.status(503).json({
            error: 'AI image recognition is not enabled for this deployment. Set OPENAI_API_KEY in the Render service environment and redeploy. To get guidance without AI, remove the photo and select a category manually.',
            code: error.code
          });
        }
        return next(error);
      }
    } else if (providedCategory) {
      if (!categoryById.has(providedCategory)) return res.status(400).json({ error: 'Select a valid waste category.' });
      mode = 'manual';
      recognition = {
        objectName: 'Waste category selected manually',
        category: providedCategory,
        material: 'not assessed',
        confidence: null,
        needsConfirmation: false
      };
    }

    const category = recognition.category;
    const result = {
      recognition,
      mode,
      categoryInfo: categoryById.get(category),
      reuseIdeas: getIdeas({ category }),
      recycling: await getGuideAsync(category),
      disposal: getDisposalGuidance(category)
    };

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function listCategories(req, res) {
  return res.json({ categories });
}

module.exports = { analyze, listCategories };
