const OpenAI = require('openai');
const Student = require('../models/Student');
const Textbook = require('../models/Textbook');
const BrixbeeLog = require('../models/BrixbeeLog');

// OpenRouter uses the OpenAI-compatible API
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'EduVoice - AI Teacher for Tamil Nadu Students',
  },
});

// Build AI Teacher system prompt
const buildSystemPrompt = (student, chapter) => {
  const memoryContext = student
    ? `Student name: ${student.name}. Class: ${student.class || 'not set'}. Weak topics: ${student.weakTopics.join(', ') || 'none yet'}. Last studied: ${student.lastSubject ? `${student.lastSubject} Ch ${student.lastChapter}` : 'first session'}.`
    : 'New student, first session.';

  const chapterContext = chapter
    ? `Chapter Title: "${chapter.title}"\nContent: ${chapter.content}\nKey Points: ${chapter.keyPoints.join('; ')}\nVocabulary: ${chapter.vocabulary.map(v => `${v.word} = ${v.meaning}`).join('; ')}`
    : 'No specific chapter loaded yet. Answer general academic questions.';

  return `You are "Akka", a warm, highly-knowledgeable AI teacher for Tamil Nadu State Board students. You are a MASTER of the curriculum provided in the textbooks.

PERSONALITY:
- Speak like a caring elder sister who is also an expert teacher
- Use VERY simple words a child (age 9-14) can understand but maintain academic accuracy
- Give examples from everyday Tamil Nadu life (idli, coconut tree, auto-rickshaw, paddy field, temple, kolam)
- Be encouraging: "Excellent!", "You are doing great!", "That is a smart question!"
- Ask short follow-up questions to check understanding (e.g., "Can you tell me one example?")
- Never make the child feel bad for wrong answers — always gently correct

TEACHING STYLE:
- You are currently teaching the lesson: ${chapter ? `"${chapter.title}"` : 'a general topic'}
- If a chapter is loaded, focus on its specific content, key points, and vocabulary.
- Explain concepts step-by-step. Don't dump all info at once.
- Use the "Key Points" to structure your explanation.
- Encourage the child to ask about the "Vocabulary" words.

CRITICAL RULES (since response is read aloud):
- Keep responses SHORT: maximum 4-5 sentences per reply
- NEVER use bullet points or markdown — plain conversational sentences ONLY
- If child speaks Tamil words or Tamil-English mix, respond naturally in the same mix
- When generating quiz questions, ask ONE question at a time and wait for child's answer

STUDENT MEMORY:
${memoryContext}

CURRENT LESSON DATA (Use this as your source of truth):
${chapterContext}`;
};

// @route  POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { studentId, message, classLevel, subject, chapterNumber, conversationHistory = [] } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Load student memory
    let student = null;
    if (studentId) {
      student = await Student.findOne({ studentId });
    }

    // Load chapter content
    let chapter = null;
    if (classLevel && subject && chapterNumber) {
      chapter = await Textbook.findOne({
        class: classLevel,
        subject: subject.toLowerCase(),
        chapterNumber: parseInt(chapterNumber),
      });
    } else if (student?.lastSubject && student?.lastChapter && student?.class) {
      chapter = await Textbook.findOne({
        class: student.class,
        subject: student.lastSubject,
        chapterNumber: parseInt(student.lastChapter),
      });
    }

    const systemPrompt = buildSystemPrompt(student, chapter);

    // Build message history (last 10 exchanges for context)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(m => ({
        role: m.role === 'teacher' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: message },
    ];

    // Call DeepSeek via OpenRouter
    const completion = await openrouter.chat.completions.create({
      model: 'deepseek/deepseek-v3.1-terminus',
      messages,
      max_tokens: 350,
      temperature: 0.75,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || 'I am sorry, I could not understand that. Please try again!';

    // Update student memory
    if (student) {
      const weakKeywords = ["don't understand", "confused", "what is", "why", "how", "don't know", "புரியவில்லை"];
      const mightBeWeak = weakKeywords.some(kw => message.toLowerCase().includes(kw));
      if (mightBeWeak && chapter) {
        const topic = `${chapter.title}`;
        if (!student.weakTopics.includes(topic)) {
          student.weakTopics.push(topic);
          if (student.weakTopics.length > 5) student.weakTopics.shift();
        }
      }
      if (classLevel) student.class = classLevel;
      if (subject)    student.lastSubject = subject;
      if (chapterNumber) student.lastChapter = chapterNumber;
      student.lastActiveAt = new Date();
      await student.save();
    }

    res.json({
      response: aiResponse,
      chapterTitle: chapter?.title || null,
      studentName: student?.name || null,
    });
  } catch (error) {
    console.error('AI Chat error:', error?.message || error);
    const errorMsg = error.status === 401
      ? 'API key error. Please check your OpenRouter API key in .env file.'
      : 'Akka is taking a short break. Please try again in a moment!';
    res.status(500).json({ error: errorMsg, details: error?.message });
  }
};

// @route  POST /api/ai/session-end
const endSession = async (req, res) => {
  try {
    const { studentId, subject, chapter, chapterTitle, summary } = req.body;
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.sessionHistory.push({
      date: new Date(),
      subject,
      chapter: chapterTitle || chapter,
      summary: summary || 'Session completed',
    });

    if (student.sessionHistory.length > 20) {
      student.sessionHistory = student.sessionHistory.slice(-20);
    }

    await student.save();
    res.json({ message: 'Session saved!', student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logInteraction = async (req, res) => {
  try {
    const { query, response, type } = req.body;
    const newLog = new BrixbeeLog({ query, response, type });
    await newLog.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Brixbee Logging Error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { chat, endSession, logInteraction };
