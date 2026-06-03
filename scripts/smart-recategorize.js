import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsPath = path.join(__dirname, '../src/data/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

/**
 * Intelligent categorization based on question content and intent
 */

// Keywords for each official category
const categoryKeywords = {
  'UK Values & Rights': {
    keywords: ['tolerance', 'belief', 'equal', 'discrimination', 'rights', 'responsibilities', 'values', 'citizens', 'residents', 'fundamental', 'freedom', 'diversity'],
    weight: 1.0,
  },
  'British History & Heritage': {
    keywords: ['king', 'queen', 'monarch', 'elizabeth', 'henry', 'charles', 'victoria', 'war', 'battle', 'empire', 'revolution', 'conquest', 'scotland', 'wales', 'historical', 'past', 'century', 'era', 'tudor', 'stuart', 'george', 'napoleon', 'civil war', 'restoration', 'plague', 'fire', 'reform', 'act', 'succession', 'union', 'independence', 'jacobite', 'uprising', 'ireland', 'norman', 'saxon', 'viking', 'roman', 'celts', 'churchill', 'thatcher', 'macmillan', 'attlee', 'baldwin', 'chamberlain'],
    weight: 1.0,
  },
  'Geography & Institutions': {
    keywords: ['capital', 'city', 'region', 'country', 'continent', 'island', 'sea', 'ocean', 'border', 'location', 'where', 'place', 'map', 'scottish parliament', 'welsh assembly', 'northern ireland', 'devolution', 'devolved', 'parliament', 'westminster', 'house of commons', 'house of lords', 'seat', 'located', 'found', 'situated', 'scotland', 'wales', 'northern ireland', 'england', 'uk', 'great britain', 'british isles'],
    weight: 1.0,
  },
  'Government & Law': {
    keywords: ['parliament', 'law', 'legal', 'court', 'judge', 'jury', 'right', 'duty', 'vote', 'vote', 'election', 'prime minister', 'government', 'minister', 'cabinet', 'mp', 'mp', 'legislation', 'act', 'bill', 'member', 'speaker', 'lord', 'commons', 'lords', 'representative', 'voting', 'constituency', 'election', 'magistrate', 'lawyer', 'barrister', 'solicitor', 'brexit', 'eu', 'european', 'parliament', 'commons', 'lords'],
    weight: 1.0,
  },
  'Culture & Heritage': {
    keywords: ['sport', 'music', 'art', 'artist', 'painter', 'author', 'writer', 'literature', 'theatre', 'theatre', 'film', 'cinema', 'culture', 'tradition', 'festival', 'celebration', 'christmas', 'easter', 'halloween', 'bonfire', 'sport', 'football', 'cricket', 'rugby', 'tennis', 'horse racing', 'grand national', 'wimbledon', 'architect', 'building', 'cathedral', 'abbey', 'castle', 'palace', 'monument', 'heritage', 'landmark', 'historic', 'national trust', 'museum', 'gallery', 'shakespeare', 'dickens', 'jane austen', 'wordsworth', 'keats', 'byron', 'poet', 'poetry', 'novel', 'novel', 'drama', 'play', 'english', 'literature', 'tradition', 'ceremony'],
    weight: 1.0,
  },
  'Economy & Employment': {
    keywords: ['economy', 'economic', 'business', 'industry', 'employment', 'job', 'work', 'worker', 'trade', 'commerce', 'market', 'export', 'import', 'steel', 'coal', 'agriculture', 'farming', 'manufacturing', 'production', 'wage', 'salary', 'income', 'tax', 'union', 'labour', 'factory', 'enterprise'],
    weight: 1.0,
  },
};

/**
 * Analyze question and assign best category
 */
function categorizeQuestion(question) {
  const text = (question.question_detail + ' ' + question.possible_answers.join(' ')).toLowerCase();

  let scores = {};
  let matches = {};

  // Score each category based on keyword matches
  for (const [category, data] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    matches[category] = [];

    for (const keyword of data.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matchCount = (text.match(regex) || []).length;
      if (matchCount > 0) {
        scores[category] += matchCount * data.weight;
        matches[category].push(`${keyword}(${matchCount})`);
      }
    }
  }

  // Get category with highest score
  let bestCategory = 'Culture & Heritage'; // default fallback
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return {
    category: bestCategory,
    score: bestScore,
    matches: matches[bestCategory],
  };
}

// Analyze and recategorize all questions
console.log('🔬 Analyzing ALL questions by content and intent...\n');

let changeCount = 0;
let correctionLog = [];

questions.forEach((q, idx) => {
  const analysis = categorizeQuestion(q);
  const oldCategory = q.category;
  const newCategory = analysis.category;

  if (oldCategory !== newCategory && analysis.score > 0) {
    q.category = newCategory;
    changeCount++;

    correctionLog.push({
      id: q.question_id,
      question: q.question_detail.substring(0, 60),
      from: oldCategory,
      to: newCategory,
      keywords: analysis.matches,
    });
  }
});

// Sort corrections by category change
correctionLog.sort((a, b) => {
  if (a.to !== b.to) return a.to.localeCompare(b.to);
  return a.id - b.id;
});

console.log(`📊 RECATEGORIZATION RESULTS:\n`);
console.log(`Total questions analyzed: ${questions.length}`);
console.log(`Questions recategorized: ${changeCount}\n`);

// Show corrections by new category
const correctionsByCategory = {};
correctionLog.forEach(corr => {
  if (!correctionsByCategory[corr.to]) {
    correctionsByCategory[corr.to] = [];
  }
  correctionsByCategory[corr.to].push(corr);
});

console.log('📋 SAMPLE CORRECTIONS BY NEW CATEGORY:\n');
for (const [category, corrections] of Object.entries(correctionsByCategory)) {
  console.log(`\n${category} (${corrections.length} corrections):`);
  corrections.slice(0, 3).forEach(corr => {
    console.log(
      `  Q${corr.id}: "${corr.question}" | ${corr.from} → ${corr.to}`
    );
    console.log(`    Keywords: ${corr.keywords.slice(0, 3).join(', ')}`);
  });
  if (corrections.length > 3) {
    console.log(`  ... and ${corrections.length - 3} more`);
  }
}

// Calculate new distribution
const newCounts = {};
questions.forEach(q => {
  newCounts[q.category] = (newCounts[q.category] || 0) + 1;
});

console.log('\n✅ FINAL CATEGORY DISTRIBUTION:\n');
const CATEGORY_ORDER = [
  'UK Values & Rights',
  'British History & Heritage',
  'Geography & Institutions',
  'Government & Law',
  'Culture & Heritage',
  'Economy & Employment',
];

CATEGORY_ORDER.forEach(cat => {
  const count = newCounts[cat] || 0;
  console.log(`  ${cat}: ${count}`);
});

// Save corrected questions
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
console.log('\n💾 Updated questions.json with intelligent categorization!');
