const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBJECT_CONFIG = {
  math: {
    name: 'מתמטיקה',
    prompt: (grade) => `Generate ${5} math quiz questions for an Israeli child in grade ${grade}. Questions must be real math calculations (arithmetic, fractions, algebra, geometry etc. appropriate for grade ${grade}). All text in Hebrew. Mix word problems and direct calculations.`,
  },
  hebrew: {
    name: 'עברית',
    prompt: (grade) => `Generate ${5} Hebrew language quiz questions for an Israeli child in grade ${grade}. Topics: grammar, spelling, vocabulary, sentence structure, parts of speech (דקדוק, כתיב, אוצר מילים, תחביר). All text in Hebrew.`,
  },
  english: {
    name: 'אנגלית',
    prompt: (grade) => `Generate ${5} English language learning questions for an Israeli child in grade ${grade}. Test English vocabulary, grammar, and basic phrases. Questions and answer options should be in ENGLISH. Only the question intro can be in Hebrew. Make it engaging for Hebrew-speaking kids learning English.`,
  },
  science: {
    name: 'מדעים',
    prompt: (grade) => `Generate ${5} science quiz questions for an Israeli child in grade ${grade}. Topics: biology, physics, chemistry, nature, human body, environment (appropriate for grade ${grade}). All text in Hebrew.`,
  },
  bible: {
    name: 'תנ"ך',
    prompt: (grade) => `Generate ${5} Bible (Tanakh) quiz questions for an Israeli child in grade ${grade}. Topics: Torah stories, prophets, key figures, commandments, Jewish holidays origins. All text in Hebrew.`,
  },
  history: {
    name: 'היסטוריה',
    prompt: (grade) => `Generate ${5} history quiz questions for an Israeli child in grade ${grade}. Mix Israeli history and world history appropriate for the grade level. All text in Hebrew.`,
  },
  geography: {
    name: 'גיאוגרפיה',
    prompt: (grade) => `Generate ${5} geography quiz questions for an Israeli child in grade ${grade}. Topics: Israel geography, world countries, capitals, continents, nature (appropriate for grade ${grade}). All text in Hebrew.`,
  },
  general: {
    name: 'ידע כללי',
    prompt: (grade) => `Generate ${5} general knowledge quiz questions for an Israeli child in grade ${grade}. Fun, engaging mix of topics: animals, space, sports, culture, technology. All text in Hebrew.`,
  },
};

app.post('/api/generate-quiz', async (req, res) => {
  const { subject = 'math', difficulty = 'easy', grade = 4, count = 5 } = req.body;

  const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
  const difficultyMap = { easy: 'easy (basic, straightforward)', medium: 'medium (requires some thinking)', hard: 'hard (challenging, multi-step)' };
  const difficultyDesc = difficultyMap[difficulty] || 'medium';

  const subjectPrompt = config.prompt(grade);

  const prompt = [
    subjectPrompt,
    `Difficulty level: ${difficultyDesc}`,
    `Generate exactly ${count} questions.`,
    '',
    'Each question must have exactly 4 answer options with ONE correct answer.',
    'correctAnswer is the 0-based index of the correct option.',
    '',
    'Return ONLY this JSON with no markdown or explanation:',
    '{"questions":[{"question":"...","options":["a","b","c","d"],"correctAnswer":0}]}',
  ].join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format');
    }

    res.json({
      success: true,
      subject,
      subjectName: config.name,
      difficulty,
      grade,
      questions: parsed.questions.slice(0, count),
    });
  } catch (err) {
    console.error('Error generating quiz:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Task Suggestions endpoint
app.post('/api/suggest-tasks', async (req, res) => {
  const { grade = 4, age = 10, childName = 'הילד', category = 'all' } = req.body;

  const categoryFilter = {
    chores: 'household chores and cleaning tasks',
    homework: 'educational and homework tasks',
    behavior: 'behavior improvement and social tasks',
    all: 'a mix of household chores, educational tasks, and behavior improvement',
  }[category] || 'a mix of tasks';

  const prompt = [
    `You are an Israeli parenting expert. Suggest 6 creative, age-appropriate punishment tasks for an Israeli child named ${childName}, age ${age}, grade ${grade}.`,
    `Task category focus: ${categoryFilter}`,
    `Each task should:`,
    `- Be achievable in 30-60 minutes`,
    `- Be educational or productive (not just punishment)`,
    `- Feel fair and motivating, not humiliating`,
    `- Be specific and clear (not vague)`,
    ``,
    `Return ONLY this JSON with no markdown:`,
    `{"tasks":[{"title":"...","description":"...","type":"chore|homework|behavior","emoji":"...","estimatedMinutes":30}]}`,
    `All text must be in Hebrew. type must be one of: chore, homework, behavior.`,
  ].join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) throw new Error('Invalid response format');

    res.json({ success: true, tasks: parsed.tasks });
  } catch (err) {
    console.error('Error suggesting tasks:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3031;
app.listen(PORT, () => console.log('AI Quiz API running on port ' + PORT));
