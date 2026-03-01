const OpenAI = require('openai');
const Student = require('../models/Student');
const Textbook = require('../models/Textbook');
const BrixbeeLog = require('../models/BrixbeeLog');
const mongoose = require('mongoose');

const BookFile = mongoose.models.BookFile || mongoose.model('BookFile', new mongoose.Schema({ 
  filename: String, 
  subject: String, 
  class: String,
  gridFsId: mongoose.Schema.Types.ObjectId,
  extractedTextPreview: String 
}, { collection: 'bookfiles' }));

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
const buildSystemPrompt = (student, chapter, learningMode, bookPdfText = '', isNewSession = false) => {
  const memoryContext = student
    ? `Student: ${student.name}. Weak topics: ${student.weakTopics.join(', ') || 'none'}. Mastered: ${student.masteredTopics.join(', ') || 'none'}.`
    : 'New student.';

  const chapterContext = chapter
    ? `DATABASE SOURCE (Use this ONLY):
CHAPTER: "${chapter.title}"
CONTENT: ${chapter.content}
SUBTOPICS (Key Points): ${chapter.keyPoints.join(', ')}
VOCABULARY: ${chapter.vocabulary.map(v => `${v.word}=${v.meaning}`).join('; ')}
FULL PDF BOOK CONTENTS:
${bookPdfText}`
    : 'No chapter data found in database.';

  let modeInstruction = '';
  // ... (switch block for modes)
  switch (learningMode) {
    case 'teaching':
      modeInstruction = `
MODE: TEACHING CONCEPTS (Mandatory Flow)
1. FIRST: You MUST list all the "SUBTOPICS" provided in the database.
2. SECOND: Ask the student which subtopic they want to hear about first.
3. THIRD: When they pick one, explain it using the "CONTENT" from the database. Use local Tamil Nadu examples to make it easy.
4. FOURTH: After explaining, ask one simple question to check if they understood.
5. Repeat for other subtopics.`;
      break;
    case 'doubts':
      modeInstruction = `
MODE: CLEARING DOUBTS
1. Ask the student for their specific confusion.
2. Refer to the DATABASE "CONTENT" and "SUBTOPICS" to provide a precise, simple answer.
3. Finish by asking "Does this help you understand?"`;
      break;
    case 'assessment':
      modeInstruction = `
MODE: ASSESSMENT
1. Ask 5 short questions based strictly on the CHAPTER CONTENT.
2. Ask one by one. Wait for answer.
3. At the end, calculate a score and tell them which SUBTOPICS they need to practice more based on their wrong answers.`;
      break;
    default:
      modeInstruction = 'Warmly assist the student with the lesson content provided below.';
  }

  return `You are "Akka", a warm AI teacher for Tamil Nadu students. Brixbee is your companion.
You MUST act as a mediator between the student and the provided DATABASE.

STRICT RULES:
- If a student asks to learn, you MUST list the subtopics first.
- ALWAYS use the provided DATABASE SOURCE for information. Do not use outside knowledge.
- Personality: Eldest sister (Akka), very patient, uses Tanglish (Tamil+English).
- Response format: Plain text only. Do NOT use markdown headers (###), bold (**text**), or italic (*text*). Use simple numbered or bullet lists if needed. Responses will be read aloud. Do NOT use emojis.
- Response length: Give a complete, well-structured explanation. NEVER cut off mid-sentence. Aim for 4-8 sentences.
- Ask ONLY one question at a time.
- NEVER re-introduce yourself or ask "How are you today?" during an ongoing lesson. Only greet at the very beginning of a brand new session.

${modeInstruction}

STUDENT HISTORY:
${memoryContext}

${chapterContext}

(End of database source)`;
};

// @route  POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { studentId, message, classLevel, subject, chapterNumber, learningMode, conversationHistory = [] } = req.body;

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

    let bookPdfText = '';
    if (chapter) {
      const bookFile = await BookFile.findOne({ class: chapter.class, subject: chapter.subject });
      if (bookFile && bookFile.extractedTextPreview) {
         bookPdfText = bookFile.extractedTextPreview;
      }
    }

    // --- Page Navigation Logic ---
    let bookPdfTextTruncated = bookPdfText.substring(0, 1500); 
    const pageMatch = message.match(/page(?:\s+number)?\s+(\d+)/i);
    let pageInstructions = "";

    if (pageMatch && bookPdfText) {
      const pageNum = pageMatch[1];
      // Markers in our text files look like "\n14\n"
      const pageMarker = `\n${pageNum}\n`;
      let pageIndex = bookPdfText.indexOf(pageMarker);
      
      // Fallback: sometimes text extraction might not have perfect newlines
      if (pageIndex === -1) pageIndex = bookPdfText.indexOf(` ${pageNum} `);

      if (pageIndex !== -1) {
        console.log(`🎯 Navigating to Page ${pageNum}...`);
        bookPdfTextTruncated = `[SHOWING CONTENT STARTING FROM PAGE ${pageNum}]:\n` + bookPdfText.substring(pageIndex, pageIndex + 4000); 
        // We use a larger chunk here (4000) but we MUST be careful of the 909 token limit.
        // Let's stick to 2000 chars to be safe for 909 token limit.
        bookPdfTextTruncated = bookPdfTextTruncated.substring(0, 2000);
        pageInstructions = `\nThe student specifically asked to learn from Page ${pageNum}. Focus your explanation on the text labeled "[SHOWING CONTENT STARTING FROM PAGE ${pageNum}]" below.`;
      }
    }

    // isNewSession is explicitly sent from the client (true only for the very first message of a session)
    const isNewSession = req.body.isNewSession === true;
    const systemPrompt = buildSystemPrompt(student, chapter, learningMode, bookPdfTextTruncated, isNewSession) + pageInstructions;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(m => ({
        role: m.role === 'teacher' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o',
      messages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    let aiResponse = completion.choices[0]?.message?.content?.trim() || 'I am sorry, I could not understand that. Please try again!';
    
    // Strip all emojis from response so TTS doesn't read them aloud
    aiResponse = aiResponse.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    aiResponse = aiResponse.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols and Pictographs
    aiResponse = aiResponse.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
    aiResponse = aiResponse.replace(/[\u{1F700}-\u{1F77F}]/gu, ''); // Alchemical Symbols
    aiResponse = aiResponse.replace(/[\u{1F780}-\u{1F7FF}]/gu, ''); // Geometric Shapes Extended
    aiResponse = aiResponse.replace(/[\u{1F800}-\u{1F8FF}]/gu, ''); // Supplemental Arrows-C
    aiResponse = aiResponse.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
    aiResponse = aiResponse.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
    aiResponse = aiResponse.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A
    aiResponse = aiResponse.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
    aiResponse = aiResponse.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats

    // Update student memory — only weak topics are tracked mid-session.
    // lastSubject / lastChapter are saved in endSession() when "Back to Hub" is clicked.
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
      student.lastActiveAt = new Date();
      await student.save();
    }

    res.json({
      response: aiResponse,
      chapterTitle: chapter?.title || null,
      studentName: student?.name || null,
    });
  } catch (error) {
    console.error('AI Chat Error Detail:', JSON.stringify(error, null, 2));
    console.error('AI Chat error:', error?.message || error);
    const errorMsg = error.status === 401
      ? 'API key error. Please check your OpenRouter API key in .env file.'
      : 'Akka is taking a short break. Please try again in a moment!';
    res.status(500).json({ error: errorMsg, details: error?.message || error });
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

    // Save last subject/chapter HERE (on session end) so the welcome-back greeting
    // only fires on the NEXT separate session, not mid-lesson.
    if (subject)  student.lastSubject = subject;
    if (chapter)  student.lastChapter = chapterTitle || chapter;

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
