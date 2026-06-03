/**
 * Fix category labels in questions.json to align with official Life in the UK test structure
 * Official topics: UK Values, Geography, History, Government & Law, Culture & Society
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping old categories to new standardized categories
const categoryMapping = {
  // UK Values & Principles - Keep as is, rename to UK Values & Rights
  'UK Values & Principles': 'UK Values & Rights',

  // History mapping
  'History': 'British History & Heritage',
  'Science & Innovation': 'British History & Heritage', // Science questions likely about scientific history

  // Geography & Institutions
  'Geography': 'Geography & Institutions',

  // Government & Law - Keep as is
  'Government & Law': 'Government & Law',

  // Culture & Society (consolidate overlapping categories)
  'Architecture': 'Culture & Heritage',
  'Arts & Culture': 'Culture & Heritage',
  'Society & Culture': 'Culture & Heritage',
  'Sport & Recreation': 'Culture & Heritage',

  // Economy & Employment
  'Economy & Industry': 'Economy & Employment',

  // General Knowledge - Redistribute based on content
  // Will be handled on a per-question basis
  'General Knowledge': 'Culture & Heritage', // Default fallback
};

// Official category order and display names
const OFFICIAL_CATEGORIES = [
  'UK Values & Rights',
  'British History & Heritage',
  'Geography & Institutions',
  'Government & Law',
  'Culture & Heritage',
  'Economy & Employment',
];

const questionsPath = path.join(__dirname, '../src/data/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

console.log('📋 Analyzing current categories...\n');

// Count questions by current category
const currentCounts = {};
questions.forEach(q => {
  currentCounts[q.category] = (currentCounts[q.category] || 0) + 1;
});

console.log('Current category distribution:');
Object.entries(currentCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

// Apply mapping
console.log('\n🔄 Applying new category mapping...\n');

let changedCount = 0;
questions.forEach((q, idx) => {
  const oldCategory = q.category;
  const newCategory = categoryMapping[oldCategory] || oldCategory;

  if (oldCategory !== newCategory) {
    q.category = newCategory;
    changedCount++;
  }
});

// Count new categories
const newCounts = {};
questions.forEach(q => {
  newCounts[q.category] = (newCounts[q.category] || 0) + 1;
});

console.log('✅ New category distribution:\n');
OFFICIAL_CATEGORIES.forEach(cat => {
  const count = newCounts[cat] || 0;
  console.log(`  ${cat}: ${count}`);
});

// Write updated questions back
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
console.log('\n💾 Updated questions.json successfully!');
console.log(`📊 Total questions: ${questions.length}`);
console.log(`🔄 Categories remapped: ${changedCount}`);
