require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Textbook = require('../models/Textbook');

const seedData = [
  // ─────────────── CLASS 6 SCIENCE (Term 1 - 2024) ───────────────
  {
    class: '6', subject: 'science', chapterNumber: 1,
    title: 'Measurements',
    content: `Measurement is the comparison of an unknown quantity with some known quantity. This known constant quantity is called a unit. In ancient times, people used hand-span, cubit, and foot to measure length, but these varied from person to person. To have uniformity, scientists all over the world have accepted a common set of units called the International System of Units (SI Units). The SI unit of length is Metre (m), mass is Kilogram (kg), time is Second (s), and temperature is Kelvin (K). We use instruments like a meter scale to measure length, an electronic balance for mass, and a clock for time. Parallax error is a common mistake made while reading a scale; we must always keep our eye vertically above the point of measurement. Volume is the space occupied by an object. Multiples and sub-multiples of units are used for very large or very small measurements, like kilometers for distance or millimeters for tiny objects.`,
    keyPoints: [
      'Definition of Measurement and Unit',
      'Need for SI Units (International System)',
      'Basic SI Units: Metre, Kilogram, Second, Kelvin',
      'Instruments: Meter Scale, Electronic Balance, Stop Clock',
      'Avoiding Parallax Error in measurement',
      'Understanding Multiples and Sub-multiples'
    ],
    vocabulary: [
      { word: 'Measurement', meaning: 'Comparison of unknown quantity with a known unit' },
      { word: 'SI Unit', meaning: 'Standard international system of measurement units' },
      { word: 'Parallax', meaning: 'Apparent shift in position of an object when viewed from different angles' }
    ],
    examples: ['Measuring your height in centimeters', 'Buying 2 kilograms of rice from a shop', 'Measuring the time taken to run 100 meters']
  },
  {
    class: '6', subject: 'science', chapterNumber: 2,
    title: 'Force and Motion',
    content: `Push or pull results in motion. When an object changes its position with respect to time, it is said to be in motion; otherwise, it is at rest. Forces are of two types: Contact forces (like hitting a ball) and Non-contact forces (like gravity or magnetism). Forces can change the state of rest or motion, change the speed, or even change the shape of an object. Motion can be classified into several types: Linear motion (moving in a straight line), Curvilinear motion (moving in a curve), Rotary motion (spinning like a top), Oscillatory motion (swinging like a pendulum), and Zig-zag motion (irregular path). Speed is the distance traveled by an object in unit time (Speed = Distance / Time). If an object covers equal distances in equal intervals of time, it is in Uniform motion. Robotics is an advanced field where machines (robots) are designed to perform complex tasks mimicking human motion.`,
    keyPoints: [
      'Definition of Motion and Rest',
      'Types of Forces: Contact and Non-contact',
      'Effects of Force on objects',
      'Classification of Motion (Linear, Rotary, etc.)',
      'Calculating Speed (Distance / Time)',
      'Uniform and Non-uniform motion'
    ],
    vocabulary: [
      { word: 'Force', meaning: 'A push or pull that produces or stops motion' },
      { word: 'Friction', meaning: 'A force that opposes motion between two surfaces' },
      { word: 'Oscillatory', meaning: 'To-and-fro motion like a swing' }
    ],
    examples: ['A falling apple is linear motion due to gravity', 'A ceiling fan shows rotary motion', 'A grandfather clock pendulum shows oscillatory motion']
  },
  {
    class: '6', subject: 'science', chapterNumber: 3,
    title: 'Matter Around Us',
    content: `Matter is anything that has mass and occupies space. All matter is made up of tiny particles called atoms. Matter exists in three main states: Solid, Liquid, and Gas. In solids, particles are very tightly packed, so they have a fixed shape and volume. In liquids, particles are loosely packed, so they have volume but take the shape of the container. In gases, particles are far apart and move freely, so they have no fixed shape or volume. Pure substances are made of only one type of particle (elements or compounds), while mixtures contain two or more different substances (like salt water or air). We use various methods to separate mixtures, such as Hand-picking, Sifting, Decantation, and Filtration. Food adulteration is the practice of adding harmful or cheaper substances to food, which we must be careful about.`,
    keyPoints: [
      'Definition of Matter and Atoms',
      'Three States of Matter: Solid, Liquid, Gas',
      'Properties of particles in different states',
      'Pure substances vs Mixtures',
      'Separation methods: Sifting, Winnowing, Filtration',
      'Dangers of Food Adulteration'
    ],
    vocabulary: [
      { word: 'Matter', meaning: 'Anything that has mass and takes up space' },
      { word: 'Atom', meaning: 'Tiny building block of all matter' },
      { word: 'Adulteration', meaning: 'Mixing impure substances into pure food' }
    ],
    examples: ['Ice (solid) turns to Water (liquid) when heated', 'Air is a mixture of many gases', 'Separating stones from rice by hand-picking']
  },
  {
    class: '6', subject: 'science', chapterNumber: 4,
    title: 'The World of Plants',
    content: `Plants are the primary producers on Earth. A plant body consists of two main systems: the Root system and the Shoot system. The root system grows underground and helps in absorption of water and minerals. There are two types of root systems: Taproot (single thick root like hibiscus) and Fibrous root (cluster of roots like grass). The shoot system grows above ground and includes the stem, leaves, flower, and fruit. Leaves perform photosynthesis to make food using sunlight and chlorophyll. They also perform transpiration (losing water vapor) and exchange gases through tiny pores called stomata. Plants adapt to their environment; for example, desert plants have spines instead of leaves to save water, and aquatic plants have air spaces to float. Some plants even climb using tendrils (Twiners) like pea plants.`,
    keyPoints: [
      'Root System: Taproot and Fibrous roots',
      'Shoot System: Stem, Leaves, Flowers',
      'Functions of Leaves: Photosynthesis and Stomata',
      'Plant Adaptations: Desert, Aquatic, Terrestrial',
      'Climbers and Twiners (Tendrils)',
      'Importance of plants as Producers'
    ],
    vocabulary: [
      { word: 'Photosynthesis', meaning: 'Process of making food using sunlight' },
      { word: 'Stomata', meaning: 'Tiny pores on leaves for breathing' },
      { word: 'Transpiration', meaning: 'Loss of water from leaves as vapor' }
    ],
    examples: ['Cactus in the desert has spines', 'Lotus has air-filled stems to float on water', 'Money plant uses its stem to climb']
  },

  // ─────────────── CLASS 6 MATHEMATICS (Term 1 - 2024) ───────────────
  {
    class: '6', subject: 'maths', chapterNumber: 1,
    title: 'Numbers',
    content: `Numbers are the foundation of mathematics. We use large numbers to represent population, distance between planets, or large sums of money. In the Indian system, we use place values: Ones, Tens, Hundreds, Thousands, Ten Thousands, Lakhs, Ten Lakhs, Crores. In the International system, we use Millions and Billions. For example, 10 Lakhs is equal to 1 Million. Comparing numbers is easy — the number with more digits is always larger. Estimation or rounding off helps us get a quick "nearby" value for complex calculations. BODMAS rule (Brackets, Off, Division, Multiplication, Addition, Subtraction) is essential for solving expressions with multiple operations correctly. Whole numbers start from 0 (0, 1, 2, 3...) while Natural numbers start from 1. Zero is a special number discovered by Indian mathematicians.`,
    keyPoints: [
      'Indian vs International Number Systems',
      'Place Value and Face Value',
      'Comparison and Ordering of Numbers',
      'Estimation and Rounding Off',
      'BODMAS Rule for combined operations',
      'Natural Numbers vs Whole Numbers'
    ],
    vocabulary: [
      { word: 'BODMAS', meaning: 'The order of operations in math' },
      { word: 'Magnitude', meaning: 'The size or value of a number' },
      { word: 'Estimation', meaning: 'Finding a value close to the correct answer' }
    ],
    examples: ['Rounding 48 to the nearest ten gives 50', 'Using BODMAS: (2+3)x4 = 20', 'One Million is 10,00,000 in Indian system']
  },
  {
    class: '6', subject: 'maths', chapterNumber: 2,
    title: 'Introduction to Algebra',
    content: `Algebra is a branch of mathematics where we use letters (like x, y, a, b) to represent unknown numbers or values that can change. These letters are called Variables. Constants are values that never change (like 5, 100, -2). Expressions are formed by combining variables and constants using arithmetic operations (e.g., x + 5 or 2y). Algebra helps us find patterns and create formulas. For example, if the price of one pen is 'p', the price of 10 pens is 10p. We can solve equations to find the value of the unknown variable. Equations are like balanced scales; whatever we do to one side, we must do to the other to keep them equal. Algebra is used in science, engineering, and everyday counting where values are not fixed.`,
    keyPoints: [
      'Variables (letters) and Constants (fixed numbers)',
      'Formation of Algebraic Expressions',
      'Using Algebra for patterns and rules',
      'Introduction to Equations',
      'Solving simple linear equations',
      'Everyday applications of Variables'
    ],
    vocabulary: [
      { word: 'Variable', meaning: 'A symbol used for a number we don\'t know yet' },
      { word: 'Constant', meaning: 'A fixed value that does not change' },
      { word: 'Expression', meaning: 'A mathematical phrase containing numbers and variables' }
    ],
    examples: ['If x=2, then x+10 is 12', 'The perimeter of a square with side s is 4s', 'Age of a person after 5 years is (age + 5)']
  },
  {
    class: '6', subject: 'maths', chapterNumber: 3,
    title: 'Ratio and Proportion',
    content: `Ratio is a way of comparing two quantities of the same kind by division. It is expressed using a colon symbol (:). For example, if there are 2 boys and 3 girls, the ratio of boys to girls is 2:3. Ratios do not have units. Two ratios are said to be in Proportion if they are equal (a:b = c:d). We use the "Product of Extremes = Product of Means" rule to check if four numbers are in proportion. The Unitary Method is a very useful technique where we first find the value of one unit and then use it to find the value of the required number of units. This is used in shopping, traveling (speed), and cooking recipes. Proportions help us scale things up or down while keeping the balance the same.`,
    keyPoints: [
      'Meaning and representation of Ratio (:)',
      'Simplifying Ratios to lowest terms',
      'Comparison of Ratios',
      'Definition of Proportion',
      'The Unitary Method (finding value of one)',
      'Proportionality constants'
    ],
    vocabulary: [
      { word: 'Ratio', meaning: 'Comparison of two quantities by division' },
      { word: 'Proportion', meaning: 'Equality of two ratios' },
      { word: 'Unitary Method', meaning: 'Method of finding the value of one unit' }
    ],
    examples: ['If 5 chocolates cost 50, then 1 costs 10 (Unitary Method)', 'A ratio of 2:4 is same as 1:2', 'Mixing milk and water in 3:1 ratio']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eduvoice' });
    console.log('✅ Connected to MongoDB');

    await Textbook.deleteMany({});
    console.log('🗑️  Cleared existing textbook data');

    await Textbook.insertMany(seedData);
    console.log(`✅ Seeded ${seedData.length} chapters into MongoDB (2024 Edition Aligned)`);

    await mongoose.disconnect();
    console.log('\n🎓 Seed complete! EduVoice is perfectly aligned with the 2024 Books.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();
