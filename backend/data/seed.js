require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Textbook = require('../models/Textbook');

const seedData = [
  // ─────────────── CLASS 5 ───────────────
  {
    class: '5', subject: 'science', chapterNumber: 1,
    title: 'Plants — Our Green Friends',
    content: `Plants are living things that grow on land and in water. They are very important for us because they give us food, oxygen, medicine, and shelter. Plants have roots, stem, leaves, flowers, and fruits. Roots hold the plant in the soil and absorb water and minerals. The stem carries water from roots to leaves. Leaves make food for the plant using sunlight, water, and carbon dioxide — this process is called photosynthesis. Plants give us oxygen when they make food. Without plants, no animals or humans can live on Earth. In Tamil Nadu, we see many types of plants like coconut tree, neem tree, banana plant, paddy (rice plant), and tamarind tree. The coconut tree is called "kalpavriksha" meaning it gives us everything we need — fruit, oil, water, and leaves for thatching roofs.`,
    keyPoints: [
      'Plants make their own food through photosynthesis',
      'Roots absorb water and minerals from soil',
      'Leaves are the food factory of the plant',
      'Plants give us oxygen to breathe',
      'Coconut tree is important in Tamil Nadu',
    ],
    vocabulary: [
      { word: 'Photosynthesis', meaning: 'The process by which plants make food using sunlight, water and carbon dioxide' },
      { word: 'Roots', meaning: 'Underground part of plant that absorbs water' },
      { word: 'Chlorophyll', meaning: 'Green color in leaves that helps in making food' },
    ],
    examples: ['Coconut tree gives us coconut oil and coconut water', 'Rice plant gives us rice — the main food of Tamil Nadu'],
  },
  {
    class: '5', subject: 'science', chapterNumber: 2,
    title: 'Animals Around Us',
    content: `Animals are living beings that move from one place to another. They can be wild animals like lions and elephants, or domestic animals like cow, dog, and hen. Animals living with us at home are called pets or domestic animals. Wild animals live in forests. Animals get their food in different ways — some eat plants (herbivores like cow, deer, rabbit), some eat other animals (carnivores like lion, eagle, snake), and some eat both plants and animals (omnivores like crow, bear, humans). Animals breathe in different ways — some breathe through lungs like us, fish breathe through gills, and insects breathe through tiny pores. In Tamil Nadu, the elephant is the state animal. Cows are very sacred and useful — they give milk, and bulls help farmers plough fields. Many families in Tamil Nadu keep cows, goats, and hens at home.`,
    keyPoints: [
      'Herbivores eat only plants (cow, deer, goat)',
      'Carnivores eat only animals (lion, eagle)',
      'Omnivores eat both plants and animals (crow, human)',
      'Fish breathe through gills, not lungs',
      'Elephant is the state animal of Tamil Nadu',
    ],
    vocabulary: [
      { word: 'Herbivore', meaning: 'Animal that eats only plants' },
      { word: 'Carnivore', meaning: 'Animal that eats only other animals' },
      { word: 'Omnivore', meaning: 'Animal that eats both plants and animals' },
      { word: 'Gills', meaning: 'Part of a fish used to breathe underwater' },
    ],
    examples: ['Cow eats grass — it is a herbivore', 'We humans eat both rice and chicken — we are omnivores'],
  },
  {
    class: '5', subject: 'maths', chapterNumber: 1,
    title: 'Large Numbers',
    content: `We use numbers every day — to count mangoes in a basket, to know how many students are in school, or to find the price of things. In Tamil Nadu, a big mango market can have 1 lakh mangoes! Numbers beyond 999 are called large numbers. One thousand is 1,000 and it has 4 digits. Ten thousand is 10,000. One lakh is 1,00,000 and has 6 digits. Ten lakh is 10,00,000. One crore is 1,00,00,000 and has 8 digits. We use the Indian system of place value — ones, tens, hundreds, thousands, ten thousands, lakhs, ten lakhs, crores. To read large numbers, we put commas after every 2 digits from the right, starting after 3. For example: 5,67,834 is read as "five lakh sixty seven thousand eight hundred and thirty four." Comparing numbers — always the number with more digits is bigger. If digits are same, compare from left to right.`,
    keyPoints: [
      '1000 = One Thousand (4 digits)',
      '1,00,000 = One Lakh (6 digits)',
      '1,00,00,000 = One Crore (8 digits)',
      'Indian system uses commas after 3 digits then every 2 digits',
      'More digits = bigger number',
    ],
    vocabulary: [
      { word: 'Digit', meaning: 'A single number symbol from 0 to 9' },
      { word: 'Place Value', meaning: 'The value of a digit based on its position in a number' },
      { word: 'Lakh', meaning: 'One hundred thousand (1,00,000)' },
    ],
    examples: ['A cricket stadium in Chennai can hold 50,000 people', 'India has more than 140 crore people'],
  },
  {
    class: '5', subject: 'maths', chapterNumber: 2,
    title: 'Fractions',
    content: `When we cut an idli into 2 equal pieces, each piece is half of the idli. This "half" is a fraction — 1/2. A fraction shows a part of a whole thing. The number on top is called the numerator — it tells how many parts we have. The number below is called the denominator — it tells total equal parts the whole is divided into. If you cut a chapati into 4 equal pieces and eat 3 pieces, you ate 3 out of 4 equal parts — that is 3/4. Fractions with same denominator are called like fractions — example 1/5, 2/5, 3/5. To add like fractions just add the numerators — 1/5 + 2/5 = 3/5. To compare fractions with same denominator, the bigger numerator means bigger fraction. A fraction where numerator equals denominator equals 1 whole — like 5/5 = 1.`,
    keyPoints: [
      'Fraction = part of a whole (numerator/denominator)',
      'Numerator = how many parts we have',
      'Denominator = total equal parts',
      'Like fractions have the same denominator',
      'Add like fractions by adding numerators only',
    ],
    vocabulary: [
      { word: 'Numerator', meaning: 'Top number of a fraction — how many parts we have' },
      { word: 'Denominator', meaning: 'Bottom number of a fraction — total equal parts' },
      { word: 'Like Fractions', meaning: 'Fractions with the same denominator' },
    ],
    examples: ['Cutting an idli into 2 equal pieces — each piece is 1/2', 'Eating 2 out of 4 pieces of chapati = 2/4 = 1/2'],
  },
  // ─────────────── CLASS 6 ───────────────
  {
    class: '6', subject: 'science', chapterNumber: 1,
    title: 'Food: Where Does It Come From?',
    content: `Everything we eat is called food. Food gives us energy to study, play, work, and grow. We get food from two main sources — plants and animals. From plants we get rice, wheat, vegetables like brinjal, tomato, drumstick, fruits like mango and banana. From animals we get milk, eggs, meat, fish. In Tamil Nadu, rice is the main food. We make idli, dosa, sambar, rasam from rice and lentils. Leaves of plants are food — we eat drumstick leaves, curry leaves, coriander. We also eat stems (sugarcane, ginger), roots (carrot, radish, groundnut), seeds (rice, wheat, sesame), and flowers (banana flower, cauliflower). Photosynthesis is the process where plants make their own food using sunlight, water, and carbon dioxide from air. Chlorophyll is the green pigment in leaves that helps in photosynthesis. Plants are called producers because they make their own food.`,
    keyPoints: [
      'Food comes from plants and animals',
      'Plants are producers — they make their own food',
      'Photosynthesis uses sunlight + water + CO2 to make food',
      'Chlorophyll (green color in leaves) helps photosynthesis',
      'We eat different parts of plants — roots, stems, leaves, flowers, seeds',
    ],
    vocabulary: [
      { word: 'Photosynthesis', meaning: 'Process by which plants make food using sunlight, water and carbon dioxide' },
      { word: 'Chlorophyll', meaning: 'Green pigment in leaves that captures sunlight for photosynthesis' },
      { word: 'Producer', meaning: 'Living thing that makes its own food — all plants are producers' },
      { word: 'Herbivore', meaning: 'Animal that eats only plant food' },
    ],
    examples: [
      'A mango tree makes its own food using sunlight — it is a producer',
      'Idli is made from rice (seed) and urad dal (seed) — both from plants',
      'We eat carrot which is the root of the carrot plant',
    ],
  },
  {
    class: '6', subject: 'science', chapterNumber: 2,
    title: 'Sorting Materials into Groups',
    content: `Everything around us is made of materials. We can sort or group materials based on their properties. Properties of materials are things like colour, texture, hardness, solubility, transparency, and whether they float or sink. Texture means how a surface feels — rough like sandpaper, or smooth like glass. Hard materials cannot be easily compressed or scratched — like stone, iron, wood. Soft materials can be easily compressed — like sponge, cotton, rubber. Soluble materials dissolve in water — like salt, sugar. Insoluble materials do not dissolve in water — like sand, chalk. Transparent materials let light pass through completely — like glass, clear water. Opaque materials do not let light pass — like wood, stone, metal sheet. We can also group materials by whether they float or sink in water — wood, dry leaf, and plastic bottles float; stone and iron sink. In Tamil Nadu villages, pots made of clay (mud) are used to store water — clay is an earthy material.`,
    keyPoints: [
      'Materials are sorted based on their properties',
      'Hard materials: stone, iron, wood; Soft materials: sponge, cotton',
      'Soluble: salt, sugar dissolve in water; Insoluble: sand, chalk do not',
      'Transparent: glass lets light through; Opaque: wood does not',
      'Float: wood, plastic; Sink: stone, iron',
    ],
    vocabulary: [
      { word: 'Texture', meaning: 'How a surface feels — rough or smooth' },
      { word: 'Soluble', meaning: 'Can dissolve in water (like salt and sugar)' },
      { word: 'Insoluble', meaning: 'Cannot dissolve in water (like sand)' },
      { word: 'Transparent', meaning: 'Lets light pass through completely (like glass)' },
      { word: 'Opaque', meaning: 'Does not let light pass (like wood or a wall)' },
    ],
    examples: [
      'Salt dissolves in water when making rasam — it is soluble',
      'A stone thrown in the river sinks — it is dense and heavy',
      'A mud pot (clay pot) is opaque — you cannot see through it',
    ],
  },
  {
    class: '6', subject: 'maths', chapterNumber: 1,
    title: 'Knowing Our Numbers',
    content: `Numbers are used in our everyday life. In Tamil Nadu, we count how many coconuts fell, how much rice we need for a feast, or how many people are coming for a function. The number system we use has 10 digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9. Every number has a place value. In Indian system, we have ones, tens, hundreds, thousands, ten-thousands, lakhs, ten-lakhs, and crores. In 34,56,789 — the digit 3 is in ten-lakhs place, so its value is 30,00,000. The greatest number using digits 1,5,3,8 without repeating is 8531, and the smallest is 1358. Successor of a number is the number just after it (successor of 99 is 100). Predecessor of a number is just before it (predecessor of 100 is 99). Comparing numbers — the one with more digits is always greater. Roman numerals use letters: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.`,
    keyPoints: [
      'Indian place value: ones, tens, hundreds, thousands, lakhs, crores',
      'Greatest number: arrange digits largest to smallest',
      'Smallest number: arrange digits smallest to largest (never start with 0)',
      'Successor = number just after; Predecessor = number just before',
      'Roman numerals: I=1, V=5, X=10, L=50, C=100',
    ],
    vocabulary: [
      { word: 'Place Value', meaning: 'The value of a digit based on where it sits in the number' },
      { word: 'Successor', meaning: 'The number that comes just after a given number' },
      { word: 'Predecessor', meaning: 'The number that comes just before a given number' },
      { word: 'Roman Numerals', meaning: 'A number system using letters like I, V, X, L, C' },
    ],
    examples: [
      'In a school with 2,345 students, the digit 2 is in thousands place, its place value is 2000',
      'The successor of 9999 is 10000 — a new number of more digits!',
    ],
  },
  {
    class: '6', subject: 'maths', chapterNumber: 2,
    title: 'Whole Numbers',
    content: `Natural numbers are the counting numbers we use from 1, 2, 3, 4... and they go on forever. When we add 0 to natural numbers, we get whole numbers. So whole numbers are 0, 1, 2, 3, 4... The number 0 was a great discovery — it was invented in India! Without zero, we cannot write numbers like 10, 100, or 1000. On a number line, numbers go from left to right in increasing order. Every number on the right is greater than numbers on the left. Adding two whole numbers gives a whole number — this is called closure property. Even if you change the order of addition the answer is same — 3 + 5 = 5 + 3 = 8. This is commutative property. Zero added to any number gives the same number — 7 + 0 = 7. Zero is called the additive identity. Multiplying 1 with any number gives the same number — 7 × 1 = 7. One is called the multiplicative identity.`,
    keyPoints: [
      'Natural numbers: 1, 2, 3... Whole numbers: 0, 1, 2, 3...',
      'Zero was discovered in India — it is a very important number',
      'Number line: numbers increase from left to right',
      'Commutative: 3 + 5 = 5 + 3 (order does not matter in addition)',
      '0 is additive identity; 1 is multiplicative identity',
    ],
    vocabulary: [
      { word: 'Natural Numbers', meaning: 'Counting numbers starting from 1 (1, 2, 3...)' },
      { word: 'Whole Numbers', meaning: 'Natural numbers plus zero (0, 1, 2, 3...)' },
      { word: 'Number Line', meaning: 'A line where numbers are placed in order from left to right' },
      { word: 'Additive Identity', meaning: 'Zero, because adding 0 to any number does not change it' },
    ],
    examples: [
      'If you have 0 idlis and someone gives you 5, you have 5 — that is 0 + 5 = 5',
      'Whether you say 4 + 3 or 3 + 4, you get 7 — commutative property',
    ],
  },
  // ─────────────── CLASS 6 EVS / SOCIAL ───────────────
  {
    class: '6', subject: 'social', chapterNumber: 1,
    title: 'The Earth — Our Home',
    content: `The Earth is the planet where we all live. It is the only planet in our solar system that has life. Earth is round like a ball — this shape is called a sphere. Two imaginary lines are very important — the Equator divides Earth into Northern and Southern hemispheres. The other line is called the Prime Meridian. Earth rotates on its axis — this rotation takes 24 hours and gives us day and night. Earth also revolves around the Sun — this revolution takes 365 and a quarter days, giving us one year and the four seasons. The Moon is Earth's natural satellite. It revolves around Earth and takes about 30 days (one month). Tamil Nadu is located in the southern part of India, close to the Equator, which is why our weather is hot. The Bay of Bengal is to the east of Tamil Nadu and the Arabian Sea is to the west. The Himalayas in the north protect India from cold winds.`,
    keyPoints: [
      'Earth is round (sphere) and only planet with life',
      'Rotation (24 hours) = day and night',
      'Revolution around Sun (365 days) = one year and seasons',
      'Equator divides Earth into Northern and Southern halves',
      'Tamil Nadu is in Southern India, close to Equator',
    ],
    vocabulary: [
      { word: 'Rotation', meaning: 'Earth spinning on its own axis — gives day and night' },
      { word: 'Revolution', meaning: 'Earth moving around the Sun — gives seasons and years' },
      { word: 'Equator', meaning: 'Imaginary line dividing Earth into Northern and Southern halves' },
      { word: 'Satellite', meaning: 'Object that goes around a planet — Moon is Earth\'s satellite' },
    ],
    examples: [
      'During daytime in Chennai, it is night time in America — because Earth rotates',
      'We have summer, rainy season, winter because Earth goes around the Sun',
    ],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eduvoice' });
    console.log('✅ Connected to MongoDB');

    await Textbook.deleteMany({});
    console.log('🗑️  Cleared existing textbook data');

    await Textbook.insertMany(seedData);
    console.log(`✅ Seeded ${seedData.length} chapters into MongoDB`);

    const classes = [...new Set(seedData.map(d => d.class))];
    console.log(`📚 Classes available: ${classes.join(', ')}`);

    await mongoose.disconnect();
    console.log('\n🎓 Seed complete! EduVoice is ready for Tamil Nadu students.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();
