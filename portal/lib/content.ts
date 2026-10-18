/**
 * All learning content for the portal. Pages, the 3D world and the XP system
 * are driven from this file, so lessons can be edited without touching code.
 */

export type ModuleId = "lab" | "workshop" | "council";

export type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "list"; items: string[] }
  | { t: "callout"; title: string; text: string };

export type Question = { q: string; options: string[]; answer: number; explain: string };

export type SortSkin = "tubes" | "bench" | "scale" | "vault" | "holo";

export type Interactive =
  | {
      kind: "sort";
      skin: SortSkin;
      prompt: string;
      bins: { id: string; label: string }[];
      items: { id: string; label: string; bin: string; explain: string }[];
    }
  | {
      kind: "select";
      prompt: string;
      statements: { id: string; text: string; isFalse: boolean; explain: string }[];
    }
  | {
      kind: "sequence";
      prompt: string;
      rounds: { context: string; options: { word: string; p: number }[]; note: string }[];
    }
  | { kind: "train"; prompt: string }
  | { kind: "weights"; prompt: string }
  | { kind: "bias"; prompt: string }
  | {
      kind: "builder";
      prompt: string;
      slots: { id: string; label: string; options: { text: string; quality: 0 | 1 | 2; feedback: string }[] }[];
    }
  | {
      kind: "inspect";
      prompt: string;
      tools: { id: string; name: string; examples: string; goodAt: string; watchOut: string }[];
    };

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  learn: Block[];
  interactive: Interactive;
  quiz: Question[];
};

export type Module = {
  id: ModuleId;
  number: number;
  title: string;
  place: string;
  tagline: string;
  color: string;
  lessons: Lesson[];
};

/* ======================================================================= */

export const MODULES: Module[] = [
  {
    id: "lab",
    number: 1,
    title: "How AI Works",
    place: "The Lab",
    tagline: "What AI is, how machines learn, and what's really happening inside a chatbot.",
    color: "#5ee7ff",
    lessons: [
      {
        id: "what-is-ai",
        title: "What is AI?",
        summary: "AI, machine learning and deep learning, and why every AI today is 'narrow'.",
        minutes: 6,
        learn: [
          {
            t: "p",
            text: "Artificial intelligence (AI) is the field of building computer systems that do tasks we usually connect with human thinking: recognising images, understanding language, making predictions and decisions.",
          },
          {
            t: "p",
            text: "Traditional software follows rules a programmer writes by hand: “if the password matches, let the user in.” Many AI systems instead learn their own rules from examples. Show a system thousands of labelled photos of cats and dogs, and it works out the patterns that tell them apart.",
          },
          { t: "h", text: "AI, machine learning, deep learning" },
          {
            t: "list",
            items: [
              "Artificial intelligence: the whole field. Any technique that makes computers act intelligently.",
              "Machine learning (ML): a part of AI where systems learn patterns from data instead of following hand-written rules.",
              "Deep learning: a part of ML that uses large neural networks with many layers. It powers today's image recognition, voice assistants and chatbots.",
            ],
          },
          { t: "h", text: "Narrow vs. general" },
          {
            t: "p",
            text: "Every AI you can use today is narrow AI: good at a certain range of tasks. A chess engine can't drive a car, and a chatbot can't fold laundry. Artificial general intelligence (AGI), a system as flexible as a person across any task, does not exist yet, and experts disagree about when or whether it will.",
          },
          {
            t: "callout",
            title: "Big idea",
            text: "AI is not magic and it is not a mind. It is maths and data, built by people, and it reflects the choices those people make.",
          },
        ],
        interactive: {
          kind: "sort",
          skin: "tubes",
          prompt: "Drag each technology into the right tube. Does it learn from data, or just follow fixed rules?",
          bins: [
            { id: "ai", label: "Uses AI" },
            { id: "rules", label: "Fixed rules" },
          ],
          items: [
            { id: "spam", label: "Spam filter that learns from emails you mark as junk", bin: "ai", explain: "It learns new spam patterns from examples you give it." },
            { id: "calc", label: "Calculator app", bin: "rules", explain: "It follows fixed maths rules. Nothing is learned." },
            { id: "face", label: "Phone face unlock", bin: "ai", explain: "It recognises your face using patterns learned from images." },
            { id: "recs", label: "'Recommended for you' on a streaming app", bin: "ai", explain: "It predicts what you'll like from what you and similar viewers watched." },
            { id: "alarm", label: "Digital alarm clock", bin: "rules", explain: "It rings at the time you set. No learning involved." },
            { id: "voice", label: "Voice assistant understanding your question", bin: "ai", explain: "Speech recognition and language understanding are learned from data." },
            { id: "dict", label: "Spell-check that flags words not in its dictionary", bin: "rules", explain: "A basic spell-checker looks words up in a list. (Newer tools that suggest rewrites often do use AI.)" },
            { id: "micro", label: "Microwave timer", bin: "rules", explain: "It counts down. Fixed rules only." },
          ],
        },
        quiz: [
          {
            q: "Which best describes machine learning?",
            options: [
              "A program that only follows rules written by a programmer",
              "A way for computers to learn patterns from data",
              "A robot with a human-like body",
              "Any software that runs on the internet",
            ],
            answer: 1,
            explain: "Machine learning systems learn patterns from data instead of relying only on hand-written rules.",
          },
          {
            q: "Deep learning is…",
            options: [
              "The same thing as all of AI",
              "A type of machine learning that uses neural networks with many layers",
              "Learning a computer does while it's switched off",
              "A way of storing more data",
            ],
            answer: 1,
            explain: "Deep learning is a subset of machine learning built on neural networks with many layers.",
          },
          {
            q: "A chess program that beats grandmasters but can't do anything else is an example of…",
            options: ["Narrow AI", "General AI (AGI)", "Not AI at all", "A deepfake"],
            answer: 0,
            explain: "It's excellent at one kind of task, which makes it narrow AI.",
          },
          {
            q: "Which statement is true?",
            options: [
              "AI systems understand the world the way people do",
              "AI reflects the data and choices of the people who build it",
              "AGI is already built into most phones",
              "AI never makes mistakes",
            ],
            answer: 1,
            explain: "AI is built by people from data, so it carries their choices, and their mistakes.",
          },
        ],
      },
      {
        id: "how-machines-learn",
        title: "How machines learn",
        summary: "Training data, labels, features, and why we test on examples the model has never seen.",
        minutes: 7,
        learn: [
          {
            t: "p",
            text: "Machine learning works in two phases. In training, a model is shown lots of examples, called training data, and adjusts itself to fit the patterns in them. In inference, the trained model makes predictions about new examples it has never seen.",
          },
          { t: "h", text: "Labels and features" },
          {
            t: "p",
            text: "In supervised learning, each training example comes with the right answer, called a label (“cat” or “dog”). The model looks at features, measurable properties such as ear shape or body size, and learns which features go with which label.",
          },
          { t: "h", text: "Testing" },
          {
            t: "p",
            text: "To find out whether a model really learned, we test it on examples it did not train on and measure its accuracy: the share of predictions it gets right. A model that only memorised its training data will do badly on new data. This is called overfitting.",
          },
          {
            t: "callout",
            title: "Garbage in, garbage out",
            text: "A model can only be as good as its data. Wrong labels, too few examples, or examples that don't represent the real world all lead to a worse model.",
          },
          { t: "h", text: "Other ways machines learn" },
          {
            t: "list",
            items: [
              "Unsupervised learning finds groups and patterns in data that has no labels.",
              "Reinforcement learning learns by trial and error, earning rewards for good actions. Many game-playing AIs are trained this way.",
            ],
          },
        ],
        interactive: {
          kind: "train",
          prompt:
            "You're training a cat-vs-dog classifier. Label each training example. The model learns from your labels and is scored on 16 test animals it has never seen. Reach 90% test accuracy. Then try mislabelling one on purpose and watch what happens.",
        },
        quiz: [
          {
            q: "What is training data?",
            options: [
              "The examples a model learns from",
              "The final answers a model gives",
              "The computer's memory chips",
              "A list of rules written by programmers",
            ],
            answer: 0,
            explain: "Training data is the set of examples the model adjusts itself to fit.",
          },
          {
            q: "Why do we test a model on data it has never seen?",
            options: [
              "To make training faster",
              "To check it learned patterns instead of just memorising",
              "Because test data is cheaper",
              "We don't. We test on the training data",
            ],
            answer: 1,
            explain: "New data reveals whether the model generalises or has just memorised (overfitting).",
          },
          {
            q: "In supervised learning, a label is…",
            options: [
              "The name of the model",
              "The correct answer attached to a training example",
              "A sticker on the computer",
              "A feature like size or colour",
            ],
            answer: 1,
            explain: "Labels are the right answers the model learns to predict.",
          },
          {
            q: "A model trained on lots of mislabelled examples will most likely…",
            options: ["Fix the labels itself", "Make worse predictions", "Run faster", "Become general AI"],
            answer: 1,
            explain: "Garbage in, garbage out: wrong labels teach wrong patterns.",
          },
        ],
      },
      {
        id: "neural-networks",
        title: "Neural networks",
        summary: "Neurons, weights and layers, and what 'training' a network actually changes.",
        minutes: 8,
        learn: [
          {
            t: "p",
            text: "A neural network is a kind of machine learning model loosely inspired by the brain. It is made of simple units called neurons, arranged in layers: an input layer, one or more hidden layers, and an output layer.",
          },
          { t: "h", text: "What one neuron does" },
          {
            t: "list",
            items: [
              "Multiply each input by a weight: how much that input matters, and whether it pushes the answer up or down.",
              "Add the results together, plus a bias: a starting nudge.",
              "Pass the total through an activation function, which decides how strongly the neuron “fires”.",
            ],
          },
          {
            t: "p",
            text: "Training a network means adjusting all of its weights and biases, often millions or billions of them, so its outputs match the right answers. An algorithm called backpropagation works out which way to nudge each weight to reduce the error, and the network repeats this over many examples.",
          },
          {
            t: "callout",
            title: "“Deep” means many layers",
            text: "Deep learning simply means neural networks with many hidden layers. Each layer builds on the one before: in an image model, early layers detect edges, later layers detect shapes, and the last layers recognise whole objects.",
          },
        ],
        interactive: {
          kind: "weights",
          prompt:
            "This single neuron decides: bring an umbrella? It fires when (inputs × weights) + bias is above 0. Tune the weights and bias until it gets all four days right. You're doing by hand what training does automatically.",
        },
        quiz: [
          {
            q: "A neuron's weight controls…",
            options: [
              "How heavy the computer is",
              "How much an input matters to the neuron's output",
              "How many layers the network has",
              "The colour of the output",
            ],
            answer: 1,
            explain: "Weights scale each input: bigger weights mean that input matters more.",
          },
          {
            q: "What happens during training?",
            options: [
              "The weights are adjusted to reduce errors",
              "The network is unplugged",
              "New neurons are added by hand",
              "The inputs are deleted",
            ],
            answer: 0,
            explain: "Training nudges weights and biases so the outputs move closer to the right answers.",
          },
          {
            q: "“Deep” in deep learning means…",
            options: [
              "The network is very important",
              "The network has many hidden layers",
              "The data is stored underground",
              "The model is hard to understand",
            ],
            answer: 1,
            explain: "Depth refers to the number of layers.",
          },
          {
            q: "In an image model, early layers tend to detect ___, later layers ___.",
            options: [
              "whole objects; edges",
              "simple features like edges; more complex shapes and objects",
              "colours; sounds",
              "nothing; everything",
            ],
            answer: 1,
            explain: "Layers build up from simple patterns to complex ones.",
          },
        ],
      },
      {
        id: "how-chatbots-work",
        title: "How chatbots work",
        summary: "Large language models, tokens, next-word prediction, and why chatbots 'hallucinate'.",
        minutes: 7,
        learn: [
          {
            t: "p",
            text: "Chatbots like ChatGPT, Claude and Gemini are built on large language models (LLMs): very large neural networks trained on huge amounts of text.",
          },
          { t: "h", text: "Tokens and prediction" },
          {
            t: "p",
            text: "An LLM reads and writes text as tokens: chunks that are often a word or part of a word. At its core it does one thing again and again: given the text so far, predict a likely next token. Repeat that thousands of times and you get paragraphs, essays and code.",
          },
          {
            t: "p",
            text: "After that first training, models are usually fine-tuned with human feedback so they follow instructions, stay helpful and decline harmful requests.",
          },
          { t: "h", text: "Why chatbots “hallucinate”" },
          {
            t: "p",
            text: "Because a model generates text that is likely, not text that is checked, it can produce statements that sound confident and are completely wrong: fake quotes, made-up statistics, citations to papers that don't exist. This is called a hallucination. Some chatbots can search the web or read documents to ground their answers. That helps, but it doesn't remove the need to check.",
          },
          {
            t: "callout",
            title: "Remember",
            text: "A fluent answer is not the same as a true answer. Treat chatbot output like a draft from a fast, well-read helper who sometimes makes things up.",
          },
        ],
        interactive: {
          kind: "sequence",
          prompt: "Be the language model. For each sentence, pick the next word, then see how likely the model thinks each option is.",
          rounds: [
            {
              context: "Peanut butter and",
              options: [
                { word: "jelly", p: 0.62 },
                { word: "toast", p: 0.14 },
                { word: "bananas", p: 0.11 },
                { word: "rocks", p: 0.01 },
              ],
              note: "The model picks words that often follow this phrase in its training text. It's pattern, not taste.",
            },
            {
              context: "The capital of France is",
              options: [
                { word: "Paris", p: 0.93 },
                { word: "Lyon", p: 0.02 },
                { word: "beautiful", p: 0.02 },
                { word: "Berlin", p: 0.01 },
              ],
              note: "When a fact appears very often in the training text, the likely answer is usually also the right one.",
            },
            {
              context: "The first person to walk on Mars was",
              options: [
                { word: "Neil", p: 0.31 },
                { word: "Buzz", p: 0.18 },
                { word: "an", p: 0.09 },
                { word: "nobody", p: 0.04 },
              ],
              note: "No one has walked on Mars yet. But a name usually follows this kind of sentence, so the model predicts one confidently. That's a hallucination.",
            },
          ],
        },
        quiz: [
          {
            q: "At its core, a large language model generates text by…",
            options: [
              "Looking up every answer in a database",
              "Predicting a likely next token over and over",
              "Copying a single website",
              "Asking a human in real time",
            ],
            answer: 1,
            explain: "LLMs repeatedly predict a likely next token.",
          },
          {
            q: "A token is…",
            options: [
              "A coin used to pay for AI",
              "A chunk of text, such as a word or part of a word",
              "A type of computer chip",
              "A password",
            ],
            answer: 1,
            explain: "Tokens are the pieces of text a model reads and writes.",
          },
          {
            q: "A chatbot gives you a quote with a book title and page number. What should you do?",
            options: [
              "Use it. Chatbots don't make up sources",
              "Check that the book and quote really exist",
              "Ask the chatbot if it's sure, and trust its answer",
              "Cite the chatbot as the author",
            ],
            answer: 1,
            explain: "Chatbots can invent realistic-looking sources. Always verify.",
          },
          {
            q: "Why can chatbots hallucinate?",
            options: [
              "They generate likely-sounding text rather than checking facts",
              "They get tired",
              "They're on the wrong Wi-Fi",
              "They never hallucinate",
            ],
            answer: 0,
            explain: "Likely text isn't the same as checked text.",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------------------- */

  {
    id: "workshop",
    number: 2,
    title: "AI Tools & Techniques",
    place: "The Workshop",
    tagline: "Pick the right tool, write prompts that work, study smarter, and check everything.",
    color: "#ffb547",
    lessons: [
      {
        id: "ai-toolbox",
        title: "The AI toolbox",
        summary: "Chatbots, image generators, speech, translation, coding and research tools: what each is good and bad at.",
        minutes: 6,
        learn: [
          {
            t: "p",
            text: "“AI” isn't one tool. Different tools are built for different jobs, and each has strengths and blind spots. Knowing which tool fits the task is the first skill.",
          },
          { t: "h", text: "The main kinds of tool" },
          {
            t: "list",
            items: [
              "Chatbots: conversation, explanation, brainstorming and feedback.",
              "Image generators: pictures from text descriptions.",
              "Speech tools: captions, dictation and read-aloud.",
              "Translation tools: text from one language to another.",
              "Coding assistants: explaining, writing and fixing code.",
              "AI search and research tools: answers with links to sources.",
            ],
          },
          {
            t: "callout",
            title: "Check the rules first",
            text: "Many schools have policies on which AI tools you can use and when. Many tools also have age requirements, commonly 13 or older, with parental permission under 18. Read them before you sign up.",
          },
        ],
        interactive: {
          kind: "inspect",
          prompt: "Each hologram on the workbench is a kind of AI tool. Inspect all six to learn what each is good at, and what to watch out for.",
          tools: [
            {
              id: "chat",
              name: "Chatbots",
              examples: "ChatGPT, Claude, Gemini, Copilot",
              goodAt: "Explaining ideas in different ways, brainstorming, giving feedback on your writing, quizzing you.",
              watchOut: "Can state false facts confidently. Never use one as your only source.",
            },
            {
              id: "image",
              name: "Image generators",
              examples: "DALL·E, Midjourney, Adobe Firefly",
              goodAt: "Concept art, mood boards, visual brainstorming.",
              watchOut: "Can imitate artists' styles and create misleading fakes. Always label AI images.",
            },
            {
              id: "speech",
              name: "Speech tools",
              examples: "Live captions, dictation, text-to-speech",
              goodAt: "Taking notes, accessibility, studying by listening.",
              watchOut: "Makes mistakes with names, accents and technical words.",
            },
            {
              id: "translate",
              name: "Translation",
              examples: "Google Translate, DeepL",
              goodAt: "Understanding the gist of text in another language.",
              watchOut: "Can miss tone and idioms. On language-class assignments it may count as cheating.",
            },
            {
              id: "code",
              name: "Coding assistants",
              examples: "GitHub Copilot, Claude Code",
              goodAt: "Explaining code, finding bugs, suggesting fixes.",
              watchOut: "Can write code that looks right but has bugs or security holes. Understand it before you use it.",
            },
            {
              id: "research",
              name: "AI search",
              examples: "Perplexity, Google AI Overviews",
              goodAt: "Finding starting points, with links to sources.",
              watchOut: "Summaries can misread their sources. Open and read the actual links.",
            },
          ],
        },
        quiz: [
          {
            q: "You need a picture for the background of a poster. Which tool fits?",
            options: ["Translation tool", "Image generator", "Speech-to-text", "Calculator"],
            answer: 1,
            explain: "Image generators create pictures from text descriptions.",
          },
          {
            q: "What's a common weakness of AI search summaries?",
            options: [
              "They never include links",
              "They can misread or misrepresent their sources",
              "They only work in French",
              "They can't answer questions",
            ],
            answer: 1,
            explain: "Always open the linked sources to confirm what they actually say.",
          },
          {
            q: "Before using a new AI tool for school, you should check…",
            options: [
              "Your school's AI policy and the tool's age requirements",
              "Only whether it's free",
              "Whether your friends use it",
              "Nothing. All tools are allowed",
            ],
            answer: 0,
            explain: "School policies and terms of use decide what's allowed.",
          },
          {
            q: "Which task suits a coding assistant best?",
            options: ["Explaining what a piece of code does", "Writing your history essay", "Taking your photo", "Replacing your teacher"],
            answer: 0,
            explain: "Coding assistants are built to read, explain and write code.",
          },
        ],
      },
      {
        id: "prompt-engineering",
        title: "Prompt engineering",
        summary: "Role, context, task and format: the four blocks of a prompt that works.",
        minutes: 8,
        learn: [
          {
            t: "p",
            text: "A prompt is what you type to an AI tool. The same tool can give a weak answer or a brilliant one depending on how you ask. Prompt engineering is the skill of asking well.",
          },
          { t: "h", text: "The four building blocks" },
          {
            t: "list",
            items: [
              "Role: who the AI should act as. “Act as a patient chemistry tutor.”",
              "Context: the background it needs. “I'm in 10th grade and we just started covalent bonds.”",
              "Task: exactly what you want, with a clear verb. “Quiz me with five questions.”",
              "Format: how the answer should look. “One question at a time; wait for my answer.”",
            ],
          },
          { t: "h", text: "More techniques" },
          {
            t: "list",
            items: [
              "Show an example of what you want.",
              "Ask it to explain its reasoning step by step.",
              "Iterate: if the first answer misses, say what to change (“shorter”, “simpler words”, “focus on part 2”).",
              "For a big task, ask it to ask you questions first.",
            ],
          },
          {
            t: "callout",
            title: "Keep private info out",
            text: "Your full name, address, passwords and other people's details don't belong in a prompt. More on that in Module 3.",
          },
        ],
        interactive: {
          kind: "builder",
          prompt:
            "Your biology test on photosynthesis is on Friday. Snap together the strongest block for each slot to build the best study prompt. Score 6 or more to pass. Score 8 for a perfect prompt.",
          slots: [
            {
              id: "role",
              label: "Role",
              options: [
                { text: "(no role)", quality: 0, feedback: "With no role, the AI has to guess what kind of help you want." },
                { text: "Act as a biology teacher.", quality: 1, feedback: "Better, but how should that teacher behave?" },
                { text: "Act as a patient biology tutor who checks my understanding.", quality: 2, feedback: "Great: the AI knows exactly how to behave." },
              ],
            },
            {
              id: "context",
              label: "Context",
              options: [
                { text: "(no context)", quality: 0, feedback: "The AI doesn't know your level, so the answer may be too basic or too advanced." },
                { text: "I'm in high school.", quality: 1, feedback: "Helps, but what do you already know, and what's confusing?" },
                { text: "I'm in 9th grade, my test is Friday, and I get confused about where the energy comes from.", quality: 2, feedback: "Specific context means targeted help." },
              ],
            },
            {
              id: "task",
              label: "Task",
              options: [
                { text: "Tell me about photosynthesis.", quality: 0, feedback: "Too vague. You'll get a generic essay." },
                { text: "Explain photosynthesis.", quality: 1, feedback: "Clearer, but reading an explanation is passive, not studying." },
                { text: "Quiz me with 5 questions on photosynthesis, starting easy and getting harder.", quality: 2, feedback: "Active practice beats rereading." },
              ],
            },
            {
              id: "format",
              label: "Format",
              options: [
                { text: "(no format)", quality: 0, feedback: "It may dump every question and answer at once." },
                { text: "Keep it short.", quality: 1, feedback: "Useful, but it doesn't control the flow." },
                { text: "Ask one question at a time and wait for my answer before explaining.", quality: 2, feedback: "Now it's a real back-and-forth study session." },
              ],
            },
          ],
        },
        quiz: [
          {
            q: "Which part of a prompt tells the AI who to act as?",
            options: ["Format", "Role", "Task", "Context"],
            answer: 1,
            explain: "The role sets who the AI should be.",
          },
          {
            q: "Which prompt is most likely to get useful study help?",
            options: [
              "“Photosynthesis”",
              "“Explain photosynthesis”",
              "“Act as a tutor. I'm in 9th grade. Quiz me on photosynthesis one question at a time.”",
              "“Do my homework”",
            ],
            answer: 2,
            explain: "It has a role, context, a clear task and a format.",
          },
          {
            q: "The first answer is too complicated. What's the best next step?",
            options: [
              "Give up",
              "Ask it to explain again in simpler words for a 9th grader",
              "Copy it anyway",
              "Switch to a different tool straight away",
            ],
            answer: 1,
            explain: "Iterating, telling the AI what to change, is part of prompting.",
          },
          {
            q: "Which of these should NOT go in a prompt?",
            options: ["The topic you're studying", "Your grade level", "Your home address and password", "The format you want"],
            answer: 2,
            explain: "Personal and security details stay out of prompts.",
          },
        ],
      },
      {
        id: "study-partner",
        title: "AI as a study partner",
        summary: "Use AI to help you think, not to think for you.",
        minutes: 6,
        learn: [
          {
            t: "p",
            text: "Used well, AI can be a tireless study partner. Used badly, it does your thinking for you: you learn nothing, and you may break your school's rules.",
          },
          {
            t: "callout",
            title: "The golden rule",
            text: "Use AI to help you think, not to think for you. If the AI did the part of the work your teacher is grading, you've crossed the line.",
          },
          { t: "h", text: "Strong ways to use it" },
          {
            t: "list",
            items: [
              "Quiz yourself before a test.",
              "Ask for a different explanation when your textbook isn't clicking.",
              "Get feedback on a draft you wrote: “What's unclear in my second paragraph?”",
              "Brainstorm topics, then choose and research one yourself.",
              "Plan a study schedule.",
            ],
          },
          { t: "h", text: "Ways that backfire" },
          {
            t: "list",
            items: [
              "Generating an essay and handing it in.",
              "Pasting test questions into a chatbot during the test.",
              "Using AI answers you haven't checked.",
              "Reading an AI summary instead of the book you were assigned.",
            ],
          },
        ],
        interactive: {
          kind: "sort",
          skin: "bench",
          prompt: "Sort each situation onto the right workbench. Does it help you learn, or does it cross the line?",
          bins: [
            { id: "help", label: "Helps you learn" },
            { id: "line", label: "Crosses the line" },
          ],
          items: [
            { id: "vocab", label: "Asking AI to quiz you on vocab the night before a test", bin: "help", explain: "Active recall is one of the best ways to study." },
            { id: "report", label: "Having AI write your book report and submitting it", bin: "line", explain: "That's handing in work that isn't yours." },
            { id: "explain", label: "Asking for a simpler explanation of a maths concept", bin: "help", explain: "A new explanation can make an idea click." },
            { id: "test", label: "Pasting take-home test questions into a chatbot", bin: "line", explain: "Unless your teacher allows it, using AI on a test is cheating." },
            { id: "feedback", label: "Getting feedback on the clarity of an essay you wrote", bin: "help", explain: "You did the writing; the AI is a reviewer." },
            { id: "summary", label: "Reading an AI summary instead of the assigned novel", bin: "line", explain: "You skip the learning the assignment is for, and summaries can be wrong." },
            { id: "brainstorm", label: "Brainstorming science fair topics, then researching one yourself", bin: "help", explain: "AI sparks ideas; the research is yours." },
            { id: "copy", label: "Copying an AI answer without checking it", bin: "line", explain: "Unchecked AI answers can be wrong, and copying isn't learning." },
          ],
        },
        quiz: [
          {
            q: "What's the golden rule of studying with AI?",
            options: [
              "Use AI to help you think, not to think for you",
              "Use AI for every assignment",
              "Never use AI for anything",
              "Only use AI on weekends",
            ],
            answer: 0,
            explain: "AI should support your thinking, not replace it.",
          },
          {
            q: "Which is a strong way to use AI?",
            options: [
              "Generating an essay to submit",
              "Asking it to quiz you on a chapter you've read",
              "Using it during a closed-book test",
              "Having it write your lab report",
            ],
            answer: 1,
            explain: "Self-quizzing is active studying.",
          },
          {
            q: "Your teacher allows AI for brainstorming only. You use it to write your thesis statement. Is that OK?",
            options: [
              "Yes, a thesis is part of brainstorming",
              "No, it goes beyond what was allowed",
              "Yes, if nobody notices",
              "Yes, teachers can't tell",
            ],
            answer: 1,
            explain: "Writing the thesis is the graded thinking, not brainstorming.",
          },
          {
            q: "Why is reading an AI summary instead of the assigned book a problem?",
            options: [
              "Summaries are too long",
              "You skip the learning, and the summary may be wrong",
              "AI can't read books",
              "It isn't a problem",
            ],
            answer: 1,
            explain: "The reading is the point, and AI summaries can contain errors.",
          },
        ],
      },
      {
        id: "fact-checking",
        title: "Fact-checking AI",
        summary: "Spot the claims, cross-check them, open the sources, and read laterally.",
        minutes: 7,
        learn: [
          {
            t: "p",
            text: "Every AI answer is a claim, not a fact, until you check it. Fact-checking is the habit that turns AI from risky to useful.",
          },
          { t: "h", text: "The checking routine" },
          {
            t: "list",
            items: [
              "Spot the claims: names, dates, numbers, quotes and sources.",
              "Cross-check: find the same claim in at least one reliable source, such as an encyclopedia, a textbook, a government or university site, or a reputable news outlet.",
              "Open the sources: if the AI gives links or citations, open them. Make sure they exist and actually say what the AI claims.",
              "Watch for red flags: very precise numbers with no source, quotes you can't find anywhere, “studies show” with no study named.",
            ],
          },
          { t: "h", text: "Lateral reading" },
          {
            t: "p",
            text: "Professional fact-checkers don't just read one page carefully. They open new tabs and check what other sources say about the claim, and about the source itself. This is called lateral reading, and it works on AI answers too.",
          },
          {
            t: "callout",
            title: "A source a chatbot names might not exist",
            text: "Chatbots have invented realistic-looking book titles, court cases and research papers. Search for any source before you cite it.",
          },
        ],
        interactive: {
          kind: "select",
          prompt: "An AI was asked: “Tell me about the Great Wall of China.” Target every false sentence with your scanner, then check your answer.",
          statements: [
            { id: "dyn", text: "The Great Wall was built and rebuilt over many centuries by several Chinese dynasties.", isFalse: false, explain: "True. Walls were built and extended over roughly two thousand years." },
            { id: "moon", text: "It is easily visible from the Moon with the naked eye.", isFalse: true, explain: "False, and a famous myth. It's very hard to see even from low orbit, and it can't be seen from the Moon." },
            { id: "ming", text: "Much of the wall that tourists visit today was built during the Ming dynasty.", isFalse: false, explain: "True. The best-preserved sections are Ming-era." },
            { id: "single", text: "It is a single, unbroken wall.", isFalse: true, explain: "False. It's a network of many walls, trenches and natural barriers built at different times." },
            { id: "unesco", text: "It became a UNESCO World Heritage Site in 1987.", isFalse: false, explain: "True. It was inscribed in 1987." },
            { id: "1923", text: "Construction was officially completed in 1923.", isFalse: true, explain: "False. This date is invented. Confident, specific and wrong is a classic hallucination." },
          ],
        },
        quiz: [
          {
            q: "Until you've checked it, an AI answer is best treated as…",
            options: ["A proven fact", "A claim that needs checking", "A primary source", "Your teacher's opinion"],
            answer: 1,
            explain: "AI output is a claim until verified.",
          },
          {
            q: "What is lateral reading?",
            options: [
              "Reading a page very slowly",
              "Checking what other sources say about a claim and its source",
              "Reading sideways on your phone",
              "Skipping to the conclusion",
            ],
            answer: 1,
            explain: "Lateral reading means leaving the page to see what others say.",
          },
          {
            q: "A chatbot cites “Johnson et al., 2019, Journal of Ocean Science.” What should you do before citing it?",
            options: [
              "Cite it. It looks official",
              "Search for the paper and confirm it exists and says that",
              "Ask the chatbot to promise it's real",
              "Change the year",
            ],
            answer: 1,
            explain: "Realistic-looking citations can be invented.",
          },
          {
            q: "Which is a red flag in an AI answer?",
            options: [
              "A claim that matches your textbook",
              "A very precise statistic with no source",
              "A link that opens to the cited article",
              "A clear explanation",
            ],
            answer: 1,
            explain: "Precise, unsourced numbers are a common sign of a hallucination.",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------------------- */

  {
    id: "council",
    number: 3,
    title: "Using AI Ethically",
    place: "The Council",
    tagline: "Academic integrity, bias, privacy and deepfakes: using AI in a way you can stand behind.",
    color: "#b48cff",
    lessons: [
      {
        id: "academic-integrity",
        title: "Academic integrity",
        summary: "When AI use is help and when it's cheating, and how to disclose it.",
        minutes: 7,
        learn: [
          {
            t: "p",
            text: "Academic integrity means the work you hand in honestly shows what you know and can do. AI doesn't change that rule, but it makes it easier to break, sometimes by accident.",
          },
          { t: "h", text: "It depends on the assignment" },
          {
            t: "p",
            text: "The same action can be fine in one class and cheating in another. Using AI to check grammar might be welcome in history and banned in an English class that grades grammar. Your teacher's instructions decide.",
          },
          { t: "h", text: "Before using AI on schoolwork, ask:" },
          {
            t: "list",
            items: [
              "Did my teacher say AI is allowed for this, and for which parts?",
              "Am I still doing the part that's being graded?",
              "Could I explain and defend this work without the AI?",
              "Have I disclosed how I used it?",
            ],
          },
          { t: "h", text: "Disclose and cite" },
          {
            t: "p",
            text: "When AI use is allowed, say how you used it. MLA and APA both publish formats for citing AI tools. A simple note works too: “I used Claude to brainstorm topics and check my grammar. All writing is my own.”",
          },
          {
            t: "callout",
            title: "AI detectors aren't proof",
            text: "AI-writing detectors are known to make mistakes, including flagging writing done by people. Keep your drafts and notes: they show your process.",
          },
        ],
        interactive: {
          kind: "sort",
          skin: "scale",
          prompt: "Place each situation on the scale of justice. Is it usually OK (when allowed and disclosed), or academic dishonesty?",
          bins: [
            { id: "ok", label: "Usually OK" },
            { id: "cheat", label: "Dishonest" },
          ],
          items: [
            { id: "grammar", label: "Using AI to check grammar when allowed, and noting that you did", bin: "ok", explain: "Allowed and disclosed. That's honest use." },
            { id: "essay", label: "Submitting an AI-written essay as your own", bin: "cheat", explain: "Presenting AI work as yours is dishonest." },
            { id: "practice", label: "Asking AI to explain a homework problem, then solving similar ones yourself", bin: "ok", explain: "You're learning the skill yourself." },
            { id: "paraphrase", label: "Using AI to reword a classmate's essay so it looks different", bin: "cheat", explain: "That's plagiarism with extra steps." },
            { id: "cited", label: "Brainstorming with AI, then writing everything yourself and citing the tool", bin: "ok", explain: "Transparent and your own work." },
            { id: "fake", label: "Having AI generate sources for your bibliography that you never read", bin: "cheat", explain: "Citing sources you haven't read, which may not even exist, is dishonest." },
            { id: "device", label: "Using AI during a test when the teacher said no devices", bin: "cheat", explain: "It breaks the test rules." },
            { id: "cards", label: "Asking AI to make practice flashcards from your own notes", bin: "ok", explain: "A study aid built from your own work." },
          ],
        },
        quiz: [
          {
            q: "Who decides whether AI is allowed on an assignment?",
            options: ["The AI tool", "Your teacher and school policy", "Your friends", "Nobody. It's always allowed"],
            answer: 1,
            explain: "Your teacher's instructions and school policy decide.",
          },
          {
            q: "AI use is allowed for brainstorming. What should you do?",
            options: ["Hide that you used it", "Disclose or cite how you used it", "Let it write the whole thing", "Only use it at night"],
            answer: 1,
            explain: "Transparency keeps allowed use honest.",
          },
          {
            q: "Why keep your drafts and notes?",
            options: [
              "They show your own process if your work is questioned",
              "They're required by law",
              "The AI needs them",
              "No reason",
            ],
            answer: 0,
            explain: "Drafts are evidence of your own thinking.",
          },
          {
            q: "Which is academic dishonesty?",
            options: [
              "Asking AI to explain a concept, then practising yourself",
              "Making flashcards from your own notes with AI",
              "Submitting AI-generated work as your own",
              "Disclosing AI use when it's allowed",
            ],
            answer: 2,
            explain: "Passing off AI work as your own is dishonest.",
          },
        ],
      },
      {
        id: "bias",
        title: "Bias in AI",
        summary: "How unbalanced data makes AI work better for some people than others.",
        minutes: 8,
        learn: [
          {
            t: "p",
            text: "AI learns from data, and data comes from our world, including its unfairness. When training data over-represents some people and under-represents others, an AI can work well for some groups and badly for others. This is called algorithmic bias.",
          },
          { t: "h", text: "A real example" },
          {
            t: "p",
            text: "In 2018, researchers Joy Buolamwini and Timnit Gebru tested commercial facial-analysis systems in a study called Gender Shades. The systems were most accurate for lighter-skinned men and least accurate for darker-skinned women: error rates reached about 35% for darker-skinned women, compared with under 1% for lighter-skinned men. Unbalanced data was a major cause.",
          },
          { t: "h", text: "Where bias sneaks in" },
          {
            t: "list",
            items: [
              "Data: who is and isn't in it.",
              "Labels: human labellers bring their own assumptions.",
              "Design: what the system is built to optimise.",
              "Use: applying a model to people or situations it wasn't built for.",
            ],
          },
          {
            t: "callout",
            title: "What you can do",
            text: "Ask who an AI tool might not work well for. Notice when outputs stereotype people, such as an image generator that always draws doctors as men. Don't repeat it in your own work, and report it when you can.",
          },
        ],
        interactive: {
          kind: "bias",
          prompt:
            "A photo-recognition model is trained on 1,000 photos of two groups of people. Right now 90% come from Group A. Adjust the training mix and watch each group's accuracy. Get the two within 5 points of each other.",
        },
        quiz: [
          {
            q: "Algorithmic bias often comes from…",
            options: [
              "Training data that under-represents some groups",
              "Computers having opinions",
              "Too much electricity",
              "Using dark mode",
            ],
            answer: 0,
            explain: "Unbalanced data is one of the most common causes.",
          },
          {
            q: "The Gender Shades study found facial-analysis systems were least accurate for…",
            options: ["Lighter-skinned men", "Darker-skinned women", "Children's drawings", "Everyone equally"],
            answer: 1,
            explain: "Error rates were highest for darker-skinned women.",
          },
          {
            q: "Adding more balanced training data usually…",
            options: [
              "Makes bias worse",
              "Helps reduce differences in accuracy between groups",
              "Has no effect",
              "Deletes the model",
            ],
            answer: 1,
            explain: "Better representation tends to narrow accuracy gaps.",
          },
          {
            q: "An image generator always shows engineers as men. What's a good response?",
            options: [
              "Assume that's accurate",
              "Notice the stereotype and don't repeat it in your work",
              "Use it more often",
              "Never use any AI again",
            ],
            answer: 1,
            explain: "Spotting bias and not amplifying it is the responsible move.",
          },
        ],
      },
      {
        id: "privacy",
        title: "Privacy and your data",
        summary: "What happens to what you type, and what never belongs in a prompt.",
        minutes: 6,
        learn: [
          {
            t: "p",
            text: "When you type into an AI tool, your words travel to a company's servers. Depending on the tool and your settings, they may be stored, read by reviewers, or used to train future models. Treat a chatbot like a public space, not a diary.",
          },
          { t: "h", text: "Keep these out of prompts" },
          {
            t: "list",
            items: [
              "Passwords and login codes.",
              "Your full name together with your address, phone number or school.",
              "Other people's personal information or photos, without their permission.",
              "Health, money or other sensitive details.",
              "Private school records, like grades or ID numbers.",
            ],
          },
          { t: "h", text: "Protect yourself" },
          {
            t: "list",
            items: [
              "Check privacy settings: some tools let you turn off training on your chats or delete your history.",
              "Use school-approved tools when your school provides them.",
              "Remove names and details before pasting text in.",
              "Think twice before uploading photos of people.",
            ],
          },
          {
            t: "callout",
            title: "Rule of thumb",
            text: "If you wouldn't post it publicly online, don't paste it into an AI tool.",
          },
        ],
        interactive: {
          kind: "sort",
          skin: "vault",
          prompt: "Lock private information in the vault. Send what's safe to share through the portal.",
          bins: [
            { id: "private", label: "Vault: keep private" },
            { id: "share", label: "Portal: fine to share" },
          ],
          items: [
            { id: "password", label: "Your email password", bin: "private", explain: "Never share passwords with any tool." },
            { id: "topic", label: "The topic of your history project", bin: "share", explain: "General topics are safe." },
            { id: "friendphone", label: "Your friend's phone number", bin: "private", explain: "It's not your information to share." },
            { id: "paragraph", label: "A paragraph you wrote, with names removed", bin: "share", explain: "Anonymised work is fine to get feedback on." },
            { id: "address", label: "Your home address", bin: "private", explain: "Location details stay private." },
            { id: "volcano", label: "A general question about how volcanoes work", bin: "share", explain: "Nothing personal here." },
            { id: "photo", label: "A photo of a classmate, without asking them", bin: "private", explain: "Other people's images need their permission." },
            { id: "grade", label: "Your grade level, to get the right difficulty", bin: "share", explain: "Helpful context that doesn't identify you." },
          ],
        },
        quiz: [
          {
            q: "Which is safest to include in a prompt?",
            options: ["Your password", "Your friend's address", "The topic you're studying", "Your student ID number"],
            answer: 2,
            explain: "A study topic reveals nothing personal.",
          },
          {
            q: "What can happen to what you type into an AI tool?",
            options: [
              "It may be stored or used to train future models",
              "It always disappears instantly",
              "It's printed and mailed to you",
              "Nothing at all",
            ],
            answer: 0,
            explain: "Depending on the tool and settings, prompts can be kept and used.",
          },
          {
            q: "A good rule of thumb for prompts:",
            options: [
              "Share anything. It's private",
              "If you wouldn't post it publicly, don't paste it in",
              "Only share passwords with trusted bots",
              "Use your full name for better answers",
            ],
            answer: 1,
            explain: "Treat AI tools like public spaces.",
          },
          {
            q: "Before pasting a group-project draft into AI, you should…",
            options: [
              "Remove classmates' names and personal details",
              "Add everyone's phone numbers",
              "Include their passwords too",
              "Nothing",
            ],
            answer: 0,
            explain: "Protect other people's information as well as your own.",
          },
        ],
      },
      {
        id: "deepfakes",
        title: "Deepfakes and misinformation",
        summary: "How AI fakes are made, why they spread, and the habits that catch them.",
        minutes: 7,
        learn: [
          {
            t: "p",
            text: "A deepfake is realistic fake media (video, image or audio) made with AI. It can put words in someone's mouth or show events that never happened. AI also makes it fast and cheap to produce fake articles and posts at scale.",
          },
          { t: "h", text: "Why it matters" },
          {
            t: "list",
            items: [
              "Misinformation spreads faster than corrections.",
              "Cloned voices of family members are used in scams.",
              "Fake images of real people, including students, are used to bully and harass, and many places now have laws against making or sharing them.",
            ],
          },
          { t: "h", text: "How to check" },
          {
            t: "list",
            items: [
              "Look for glitches: odd hands or teeth, warped backgrounds, mismatched earrings, lighting that doesn't match.",
              "Listen for robotic pacing or strange breathing in audio.",
              "Check the source: who posted it first? Do trusted news outlets report it?",
              "Search for the original with a reverse image search.",
              "Pause before you share, especially if it makes you angry or shocked. That's what fakes are designed to do.",
            ],
          },
          {
            t: "callout",
            title: "Clues fade, habits don't",
            text: "AI fakes keep improving and visual glitches are disappearing. Checking the source is the habit that will still work next year.",
          },
        ],
        interactive: {
          kind: "sort",
          skin: "holo",
          prompt: "Scan each hologram. Is it suspicious, or are there no red flags?",
          bins: [
            { id: "fake", label: "Suspicious" },
            { id: "real", label: "No red flags" },
          ],
          items: [
            { id: "earring", label: "A celebrity video where their earrings change shape between frames", bin: "fake", explain: "Inconsistent details between frames are a classic sign." },
            { id: "newaccount", label: "A 'breaking news' photo from an account created yesterday, with no outlet reporting it", bin: "fake", explain: "A brand-new account and no confirmation from news outlets are strong red flags." },
            { id: "outlets", label: "A news clip that appears on several trusted outlets' official sites", bin: "real", explain: "Independent, reputable confirmation is a good sign." },
            { id: "fingers", label: "A photo of a person with six fingers on one hand", bin: "fake", explain: "Hands are a common weak spot for image generators." },
            { id: "voice", label: "A voice message from 'your cousin' urgently asking for gift-card codes", bin: "fake", explain: "Urgent money requests are a classic voice-clone scam. Call back on a number you know." },
            { id: "school", label: "A team photo posted on your school's official website", bin: "real", explain: "A known, official source with no warning signs." },
          ],
        },
        quiz: [
          {
            q: "A deepfake is…",
            options: ["A very deep pool", "Realistic fake media made with AI", "A type of password", "A real photo with a filter"],
            answer: 1,
            explain: "Deepfakes are AI-generated fake video, images or audio.",
          },
          {
            q: "Which is the most reliable long-term habit for spotting fakes?",
            options: [
              "Only looking for odd hands",
              "Checking the original source and whether trusted outlets confirm it",
              "Trusting anything with lots of likes",
              "Sharing first, checking later",
            ],
            answer: 1,
            explain: "Visual glitches fade as AI improves. Source-checking keeps working.",
          },
          {
            q: "A relative sends a voice message urgently asking for money. What should you do?",
            options: [
              "Send money quickly",
              "Call them back on a number you already know",
              "Reply with your bank details",
              "Forward it to friends",
            ],
            answer: 1,
            explain: "Verify through a channel you trust. Voices can be cloned.",
          },
          {
            q: "Why do fakes often try to make you angry or shocked?",
            options: [
              "Strong emotions make people share before they check",
              "It's a coincidence",
              "Anger improves image quality",
              "They don't",
            ],
            answer: 0,
            explain: "Emotion short-circuits checking, which helps fakes spread.",
          },
        ],
      },
    ],
  },
];

/* ======================================================================= */

export const FINAL_QUESTIONS: Question[] = [
  {
    q: "Machine learning is best described as…",
    options: ["Computers learning patterns from data", "Robots with feelings", "Only following hand-written rules", "A type of keyboard"],
    answer: 0,
    explain: "ML systems learn patterns from data.",
  },
  {
    q: "Training a neural network means…",
    options: ["Adjusting its weights to reduce errors", "Teaching it to walk", "Adding more screens", "Deleting its layers"],
    answer: 0,
    explain: "Training tunes weights and biases.",
  },
  {
    q: "Why can chatbots give false answers confidently?",
    options: [
      "They predict likely text instead of checking facts",
      "They lie on purpose",
      "They're broken",
      "They never do",
    ],
    answer: 0,
    explain: "Likely text isn't checked text.",
  },
  {
    q: "Which prompt includes a role, context, task and format?",
    options: [
      "“Help”",
      "“Explain gravity”",
      "“Act as a physics tutor. I'm in 11th grade. Explain gravity with one everyday example, in under 100 words.”",
      "“Gravity???”",
    ],
    answer: 2,
    explain: "Role, context, task and format are all there.",
  },
  {
    q: "An AI cites a study you can't find anywhere. You should…",
    options: ["Cite it anyway", "Not use it until you find a real source", "Make up a page number", "Trust it because AI said so"],
    answer: 1,
    explain: "Unverifiable sources may be invented.",
  },
  {
    q: "Lateral reading means…",
    options: ["Checking what other sources say about a claim", "Reading one page very closely", "Reading faster", "Reading only headlines"],
    answer: 0,
    explain: "Leave the page and see what others say.",
  },
  {
    q: "Your teacher allowed AI for grammar checks only. You used it to rewrite whole paragraphs. That is…",
    options: ["Fine", "Beyond what was allowed, so it's academic dishonesty", "Required", "Brainstorming"],
    answer: 1,
    explain: "Going beyond the permitted use breaks the rules.",
  },
  {
    q: "A model trained mostly on photos of one group of people will likely…",
    options: ["Work equally well for everyone", "Be less accurate for groups it saw less", "Refuse to run", "Become AGI"],
    answer: 1,
    explain: "Under-represented groups get worse accuracy.",
  },
  {
    q: "Which belongs in a prompt?",
    options: ["Your password", "Your friend's phone number", "The essay topic you need help understanding", "Your home address"],
    answer: 2,
    explain: "Only non-personal, task-related information.",
  },
  {
    q: "A shocking video is spreading from an unknown account. The best first step is…",
    options: ["Share it so friends know", "Check whether trusted sources confirm it", "Comment angrily", "Download and repost it"],
    answer: 1,
    explain: "Verify before you amplify.",
  },
];

export const FINAL_PASS_MARK = 8;

/* ======================================================================= */

export type BadgeShape = "star" | "hex" | "diamond" | "bolt" | "ring" | "shield";

export type Badge = { id: string; name: string; description: string; shape: BadgeShape; color: string };

export const BADGES: Badge[] = [
  { id: "first-spark", name: "First Spark", description: "Complete your first lesson.", shape: "bolt", color: "#ffe07a" },
  { id: "lab-graduate", name: "Lab Graduate", description: "Complete Module 1: How AI Works.", shape: "hex", color: "#5ee7ff" },
  { id: "toolsmith", name: "Toolsmith", description: "Complete Module 2: AI Tools & Techniques.", shape: "hex", color: "#ffb547" },
  { id: "guardian", name: "Guardian", description: "Complete Module 3: Using AI Ethically.", shape: "shield", color: "#b48cff" },
  { id: "prompt-master", name: "Prompt Master", description: "Build a perfect 8/8 prompt in the Workshop.", shape: "diamond", color: "#ffb547" },
  { id: "fact-checker", name: "Fact Checker", description: "Find every false sentence on your first check.", shape: "ring", color: "#7dffc4" },
  { id: "bias-buster", name: "Bias Buster", description: "Balance the training data so both groups are treated fairly.", shape: "diamond", color: "#b48cff" },
  { id: "deepfake-detective", name: "Deepfake Detective", description: "Sort every hologram correctly on your first check.", shape: "ring", color: "#ff8fd0" },
  { id: "perfectionist", name: "Perfectionist", description: "Score 100% on three lesson quizzes.", shape: "star", color: "#ffe07a" },
  { id: "on-fire", name: "On Fire", description: "Complete lessons on three days in a row.", shape: "bolt", color: "#ff7a45" },
  { id: "explorer", name: "Explorer", description: "Visit every location in the world.", shape: "star", color: "#5ee7ff" },
  { id: "core-online", name: "Core Online", description: "Pass the final challenge and power up the core.", shape: "star", color: "#ffffff" },
];

/* ======================================================================= */

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Accuracy", def: "The share of a model's predictions that are correct." },
  { term: "Activation function", def: "The part of a neuron that decides how strongly it 'fires' based on its total input." },
  { term: "Algorithm", def: "A step-by-step set of instructions for solving a problem." },
  { term: "Algorithmic bias", def: "When an AI system works better or worse for some groups of people, often because of unbalanced data." },
  { term: "Artificial general intelligence (AGI)", def: "A hypothetical AI as flexible as a person across any task. It does not exist yet." },
  { term: "Artificial intelligence (AI)", def: "The field of building computer systems that do tasks associated with human thinking." },
  { term: "Backpropagation", def: "The algorithm that works out how to adjust each weight in a neural network to reduce its error." },
  { term: "Bias (neuron)", def: "A number added to a neuron's weighted inputs, acting as a starting nudge." },
  { term: "Chatbot", def: "A program you talk to in natural language. Modern chatbots are built on large language models." },
  { term: "Dataset", def: "A collection of examples used to train or test a model." },
  { term: "Deep learning", def: "Machine learning with neural networks that have many layers." },
  { term: "Deepfake", def: "Realistic fake video, image or audio made with AI." },
  { term: "Feature", def: "A measurable property of an example, such as size or colour, that a model uses to make predictions." },
  { term: "Fine-tuning", def: "Extra training that adapts a model to a task or to follow instructions." },
  { term: "Generative AI", def: "AI that creates new content: text, images, audio, video or code." },
  { term: "Hallucination", def: "A confident but false statement produced by an AI model." },
  { term: "Inference", def: "Using a trained model to make predictions on new data." },
  { term: "Label", def: "The correct answer attached to a training example in supervised learning." },
  { term: "Large language model (LLM)", def: "A very large neural network trained on huge amounts of text to predict the next token." },
  { term: "Lateral reading", def: "Checking a claim by seeing what other sources say about it and about its source." },
  { term: "Machine learning (ML)", def: "A part of AI where systems learn patterns from data instead of following only hand-written rules." },
  { term: "Model", def: "The trained system that turns inputs into predictions." },
  { term: "Narrow AI", def: "AI that is good at a particular task or range of tasks. All AI today is narrow." },
  { term: "Neural network", def: "A model made of layers of simple connected units called neurons." },
  { term: "Overfitting", def: "When a model memorises its training data and does badly on new data." },
  { term: "Prompt", def: "The instruction or question you give an AI tool." },
  { term: "Prompt engineering", def: "The skill of writing prompts that get useful results." },
  { term: "Reinforcement learning", def: "Learning by trial and error, guided by rewards." },
  { term: "Supervised learning", def: "Learning from examples that come with correct labels." },
  { term: "Token", def: "A chunk of text, often a word or part of a word, that a language model reads and writes." },
  { term: "Training data", def: "The examples a model learns from." },
  { term: "Unsupervised learning", def: "Finding patterns or groups in data without labels." },
  { term: "Weight", def: "A number that sets how much an input matters to a neuron." },
];

export const SOURCES: { title: string; by: string; url: string }[] = [
  { title: "Five Big Ideas in Artificial Intelligence", by: "AI4K12 Initiative (AAAI & CSTA)", url: "https://ai4k12.org" },
  { title: "Elements of AI (free online course)", by: "University of Helsinki & MinnaLearn", url: "https://www.elementsofai.com" },
  { title: "Machine Learning Crash Course", by: "Google for Developers", url: "https://developers.google.com/machine-learning/crash-course" },
  { title: "Neural Networks (video series)", by: "3Blue1Brown", url: "https://www.3blue1brown.com/topics/neural-networks" },
  {
    title: "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification (2018)",
    by: "Joy Buolamwini & Timnit Gebru, Proceedings of Machine Learning Research 81",
    url: "http://gendershades.org",
  },
  {
    title: "Guidance for Generative AI in Education and Research (2023)",
    by: "UNESCO",
    url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research",
  },
  { title: "AI Risk Management Framework (AI RMF 1.0, 2023)", by: "NIST", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
  { title: "Civic Online Reasoning: lateral reading lessons", by: "Digital Inquiry Group (formerly Stanford History Education Group)", url: "https://cor.inquirygroup.org" },
  { title: "How do I cite generative AI in MLA style?", by: "MLA Style Center", url: "https://style.mla.org/citing-generative-ai/" },
  { title: "How to cite ChatGPT", by: "APA Style", url: "https://apastyle.apa.org/blog/how-to-cite-chatgpt" },
  { title: "Prompt engineering overview", by: "Anthropic", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
  { title: "The Great Wall (World Heritage List)", by: "UNESCO World Heritage Centre", url: "https://whc.unesco.org/en/list/438" },
  {
    title: "Scammers use AI to enhance their family emergency schemes (2023)",
    by: "U.S. Federal Trade Commission",
    url: "https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes",
  },
];

/* ---------- Lookups ---------- */

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function getLesson(moduleId: string, lessonId: string) {
  const mod = getModule(moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return mod && lesson ? { module: mod, lesson } : undefined;
}

/** Stable key for a lesson across the app, e.g. "lab/what-is-ai" */
export const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}/${lessonId}`;

export function lessonHref(moduleId: string, lessonId: string) {
  return `/modules/${moduleId}/${lessonId}`;
}
