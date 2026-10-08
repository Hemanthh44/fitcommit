/**
 * AI Recommendation Engine Facade
 * Delegates directly to the decoupled modular RecommendationService in ./recommendation
 * Aligned with SRS Requirements F5, F6, F15, U4, U5, U10
 */

const recommendationModule = require('./recommendation');

module.exports = {
  ...recommendationModule
};
