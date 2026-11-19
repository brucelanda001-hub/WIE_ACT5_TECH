// Synthetic grade 3–6 curriculum notes (written by the team, no personal data).
// Used by RAG to narrow what the model sees before it answers. Keywords include FR/AR/Darija terms.

export type Note = {
  id: string;
  subject: "Math" | "Science" | "Language" | "Space" | "History";
  title: string;
  keywords: string[];
  facts: string;
  analogy: string;
  example: string;
  hint: string;
  quiz: { q: string; a: string; b: string; correct: "A" | "B" };
};

export const NOTES: Note[] = [
  {
    id: "math-fractions", subject: "Math", title: "Fractions",
    keywords: ["fraction", "fractions", "half", "quarter", "numerator", "denominator", "moitié", "quart", "كسر", "كسور", "الكسور", "نصف", "ربع", "kesr", "ksour", "kosour", "kesr", "nos", "rbo3"],
    facts: "A fraction is a part of a whole. The bottom number (denominator) says how many equal parts the whole is cut into. The top number (numerator) says how many parts we take. 1/2 means 1 of 2 equal parts.",
    analogy: "A fraction is like sharing a pizza: the bottom number is how many equal slices, the top is how many slices you eat.",
    example: "A melon is cut into 4 equal slices. You eat 3. You ate 3/4 of the melon.",
    hint: "Count how many equal pieces there are in total first. That number goes on the bottom.",
    quiz: { q: "A cake is cut into 8 equal slices and you eat 2. Which fraction did you eat?", a: "2/8", b: "8/2", correct: "A" },
  },
  {
    id: "math-multiplication", subject: "Math", title: "Multiplication",
    keywords: ["multiply", "multiplication", "times", "table", "fois", "multiplier", "ضرب", "جدول الضرب", "dhareb", "darb", "dharb", "nadhrab", "nedhreb"],
    facts: "Multiplication is fast adding of equal groups. 4 × 3 means 4 groups of 3, which is 3 + 3 + 3 + 3 = 12. The order does not change the answer: 4 × 3 = 3 × 4.",
    analogy: "Multiplying is like counting eggs in boxes: count one box, then jump by that number for each box.",
    example: "There are 5 rows of chairs with 6 chairs in each row. 5 × 6 = 30 chairs.",
    hint: "Try drawing the groups as dots, then count by jumps.",
    quiz: { q: "What is 7 × 3?", a: "21", b: "24", correct: "A" },
  },
  {
    id: "math-division", subject: "Math", title: "Division",
    keywords: ["divide", "division", "share", "remainder", "diviser", "partager", "reste", "قسمة", "باقي", "9asma", "qasma", "9sem", "na9sem", "9esma", "nkassem"],
    facts: "Division shares a number into equal groups. 12 ÷ 3 = 4 means 12 shared into 3 equal groups gives 4 in each group. What is left over is the remainder.",
    analogy: "Dividing is like dealing cards to friends one by one until none are left.",
    example: "15 dates shared between 4 friends: each gets 3, and 3 dates are left (remainder 3).",
    hint: "Ask yourself: which times-table fact uses these numbers?",
    quiz: { q: "What is 20 ÷ 4?", a: "5", b: "6", correct: "A" },
  },
  {
    id: "math-perimeter-area", subject: "Math", title: "Perimeter and area",
    keywords: ["perimeter", "area", "rectangle", "square", "périmètre", "aire", "surface", "محيط", "مساحة", "مستطيل", "mo7it", "mou7it", "misa7a", "mesa7a"],
    facts: "Perimeter is the distance all the way around a shape: add all sides. Area is the space inside: for a rectangle, length × width, measured in square units.",
    analogy: "Perimeter is the fence around a garden; area is the grass inside.",
    example: "A rectangle 5 m long and 3 m wide: perimeter = 5+3+5+3 = 16 m, area = 5 × 3 = 15 m².",
    hint: "Fence or grass? Decide if you go around the shape or fill it.",
    quiz: { q: "A square has sides of 4 cm. What is its perimeter?", a: "16 cm", b: "8 cm", correct: "A" },
  },
  {
    id: "sci-volcano", subject: "Science", title: "Volcanoes and magma",
    keywords: ["volcano", "volcanoes", "magma", "lava", "eruption", "volcan", "lave", "بركان", "براكين", "البراكين", "تثور", "حمم", "صهارة", "borkan", "bourkan", "brakin", "barakin"],
    facts: "Deep under the Earth's crust it is hot enough to melt rock into magma. When magma comes out of a volcano it is called lava. Pressure from gas pushes magma up, causing an eruption.",
    analogy: "A volcano is like a shaken fizzy drink: gas pressure builds up, then everything bursts out.",
    example: "Mount Etna in Sicily, close to Tunisia, is one of the most active volcanoes in the world.",
    hint: "Think about where the rock is when it is called magma, and where it is when it is called lava.",
    quiz: { q: "What do we call magma once it comes out of a volcano?", a: "Lava", b: "Steam", correct: "A" },
  },
  {
    id: "sci-water-cycle", subject: "Science", title: "The water cycle",
    keywords: ["water cycle", "evaporation", "condensation", "rain", "cloud", "cycle de l'eau", "pluie", "nuage", "دورة الماء", "تبخر", "مطر", "سحاب", "yetbakher", "tbakher", "tabakhor", "tbakhar", "chta", "mtar", "s7ab", "sa7ab", "bou5ar", "bkhar"],
    facts: "The sun heats water so it evaporates into vapour. High up the vapour cools and condenses into clouds. When drops get heavy they fall as rain (precipitation) and flow back to seas and rivers.",
    analogy: "It's like a steamy bathroom: hot water rises as steam, then turns into drops on the cold mirror.",
    example: "A puddle in the schoolyard is gone after a sunny afternoon: the water evaporated.",
    hint: "Follow one drop: what does the sun do to it first?",
    quiz: { q: "What makes water evaporate?", a: "Heat from the sun", b: "The wind only", correct: "A" },
  },
  {
    id: "sci-photosynthesis", subject: "Science", title: "How plants make food",
    keywords: ["photosynthesis", "plant", "leaf", "chlorophyll", "photosynthèse", "plante", "feuille", "تركيب ضوئي", "نبتة", "ورقة", "nabta", "nbet", "war9a", "chajra", "chjar"],
    facts: "Plants make their own food in their leaves using sunlight, water from the roots and carbon dioxide from the air. This is photosynthesis. It gives off oxygen that we breathe.",
    analogy: "A leaf is a tiny solar kitchen: sunlight is the stove, water and air are the ingredients, sugar is the meal.",
    example: "An olive tree in Sfax grows more leaves in spring when there is more sunlight.",
    hint: "List what a plant needs from the sky, the ground and the air.",
    quiz: { q: "Which gas do plants give off that we breathe?", a: "Oxygen", b: "Carbon dioxide", correct: "A" },
  },
  {
    id: "sci-states-matter", subject: "Science", title: "Solids, liquids and gases",
    keywords: ["solid", "liquid", "gas", "melt", "freeze", "solide", "liquide", "gaz", "fondre", "صلب", "سائل", "غاز", "ذوبان", "tetdheb", "dheb", "thalj", "jamed", "sayel"],
    facts: "Matter can be solid (keeps its shape), liquid (takes the shape of its container) or gas (spreads everywhere). Heating can melt a solid into a liquid; cooling can freeze a liquid into a solid.",
    analogy: "Particles are like children: in a solid they hold hands tightly, in a liquid they walk around, in a gas they run everywhere.",
    example: "An ice cube (solid) melts into water (liquid), and boiling water turns into steam (gas).",
    hint: "Ask: does it keep its own shape, or take the shape of the cup?",
    quiz: { q: "Water vapour is a…", a: "Gas", b: "Solid", correct: "A" },
  },
  {
    id: "sci-food-chain", subject: "Science", title: "Food chains",
    keywords: ["food chain", "predator", "prey", "producer", "consumer", "chaîne alimentaire", "prédateur", "سلسلة غذائية", "مفترس", "yekel", "yeklou", "fris"],
    facts: "A food chain shows who eats whom. It starts with a plant (producer), then an animal that eats plants (herbivore), then animals that eat other animals (carnivores).",
    analogy: "A food chain is like passing energy hand to hand, starting from the sun.",
    example: "Grass → grasshopper → bird → fox.",
    hint: "Always start with what makes its own food.",
    quiz: { q: "What starts almost every food chain?", a: "A plant", b: "A lion", correct: "A" },
  },
  {
    id: "space-solar-system", subject: "Space", title: "The solar system",
    keywords: ["planet", "planets", "solar system", "sun", "earth", "mars", "jupiter", "planète", "soleil", "système solaire", "كوكب", "كواكب", "الكواكب", "شمس", "مجموعة شمسية", "planètes", "kawkeb", "kwakeb", "kawakib"],
    facts: "The solar system has the Sun and 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Earth takes about 365 days to go around the Sun. Jupiter is the biggest planet.",
    analogy: "The planets go around the Sun like runners on different lanes of a track.",
    example: "Mars looks red because its ground has a lot of rusty iron.",
    hint: "Think about which planet we live on and count outward from the Sun.",
    quiz: { q: "Which is the biggest planet?", a: "Jupiter", b: "Mars", correct: "A" },
  },
  {
    id: "space-moon", subject: "Space", title: "Moon phases",
    keywords: ["moon", "phase", "crescent", "full moon", "lune", "croissant", "قمر", "هلال", "بدر", "9mar", "9amra", "kamra", "hlel", "hlal"],
    facts: "The Moon does not make light; it reflects sunlight. As it goes around Earth (about 29.5 days) we see different lit parts: new moon, crescent, half, full moon.",
    analogy: "Like a ball lit by a lamp while you walk around it: you see more or less of the bright side.",
    example: "The crescent (hilal) seen at the start of a lunar month is a thin lit edge of the Moon.",
    hint: "Where does the Moon's light really come from?",
    quiz: { q: "Where does moonlight come from?", a: "The Sun", b: "The Moon itself", correct: "A" },
  },
  {
    id: "lang-nouns-verbs", subject: "Language", title: "Nouns, verbs and adjectives",
    keywords: ["noun", "verb", "adjective", "grammar", "nom", "verbe", "adjectif", "grammaire", "اسم", "فعل", "صفة", "نحو", "fe3l", "fi3l"],
    facts: "A noun names a person, place or thing (cat, Tunis). A verb is an action or state (run, is). An adjective describes a noun (big, blue).",
    analogy: "In a sentence, nouns are the actors, verbs are what they do, adjectives are their costumes.",
    example: "In 'The small cat jumps', cat is the noun, jumps is the verb, small is the adjective.",
    hint: "Ask: is it a thing, an action, or a description?",
    quiz: { q: "In 'The bird sings', which word is the verb?", a: "sings", b: "bird", correct: "A" },
  },
  {
    id: "lang-reading", subject: "Language", title: "Finding the main idea",
    keywords: ["main idea", "summary", "story", "reading", "idée principale", "résumé", "lecture", "الفكرة الرئيسية", "قراءة", "ملخص"],
    facts: "The main idea is what a text is mostly about. Details support it. A good check: can you say it in one short sentence?",
    analogy: "The main idea is the umbrella; the details are the people standing under it.",
    example: "A text about camels storing fat, walking on sand and going days without water: main idea = camels are made for the desert.",
    hint: "Look at the title and the first sentence of each paragraph.",
    quiz: { q: "Details in a text…", a: "support the main idea", b: "are always the title", correct: "A" },
  },
  {
    id: "hist-carthage", subject: "History", title: "Ancient Carthage",
    keywords: ["carthage", "phoenician", "hannibal", "punic", "carthage", "قرطاج", "حنبعل", "فينيقي", "9artaj", "kartaj", "9ertaj"],
    facts: "Carthage was founded by Phoenician sailors near today's Tunis, traditionally in 814 BC. It became a great trading city with a famous round harbour. Hannibal was a Carthaginian general who crossed the Alps with elephants.",
    analogy: "Carthage was like a giant port-market where ships from all over the Mediterranean met.",
    example: "Visitors can still see the Punic ports and ruins of Carthage today.",
    hint: "Think of the sea: what were the Phoenicians famous for?",
    quiz: { q: "Who crossed the Alps with elephants?", a: "Hannibal", b: "Julius Caesar", correct: "A" },
  },
  {
    id: "hist-pyramids", subject: "History", title: "Egyptian pyramids",
    keywords: ["pyramid", "egypt", "pharaoh", "pyramide", "égypte", "pharaon", "هرم", "مصر", "فرعون", "ahramat", "ahram", "masr"],
    facts: "The pyramids of Giza were built more than 4,500 years ago as tombs for pharaohs. Thousands of skilled workers moved huge stone blocks using ramps, sledges and levers.",
    analogy: "Building a pyramid was like a giant team puzzle: every block had its exact place.",
    example: "The Great Pyramid was the tallest building made by people for almost 4,000 years.",
    hint: "Ask: who were these huge buildings made for?",
    quiz: { q: "Pyramids were built as…", a: "tombs for pharaohs", b: "schools", correct: "A" },
  },
  {
    id: "sci-body-heart", subject: "Science", title: "The heart and blood",
    keywords: ["heart", "blood", "pulse", "body", "cœur", "sang", "قلب", "دم", "جسم", "9alb", "dem", "9leb"],
    facts: "The heart is a muscle that pumps blood around the body. Blood carries oxygen and food to every part of the body. You can feel the beats as your pulse.",
    analogy: "The heart is like a pump in a water system, sending water through pipes to every house.",
    example: "After running at recess your heart beats faster to send more oxygen to your muscles.",
    hint: "What does your body need more of when you run?",
    quiz: { q: "What does blood carry to the body?", a: "Oxygen", b: "Sand", correct: "A" },
  },
];
