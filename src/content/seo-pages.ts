export type SeoFaq = { q: string; a: string }

export type SeoPage = {
  slug: string
  title: string
  description: string
  eyebrow: string
  h1: string
  intro: string[]
  toolHref: string
  toolCta: string
  highlights: { title: string; text: string }[]
  steps: { title: string; text: string }[]
  tips: { title: string; text: string }[]
  faqs: SeoFaq[]
  related: string[]
}

export const seoPages: SeoPage[] = [
  // ---------------------------------------------------------------------------
  {
    slug: "meme-coin-ideas",
    title: "Meme Coin Ideas: Names, Lore & Sites | FunCoin Lab",
    description:
      "Stuck for meme coin ideas? Turn a random thought into a full meme brand with a name, ticker, lore, slogans and a .fun website concept in seconds.",
    eyebrow: "Idea starter",
    h1: "Meme coin ideas that start with one ridiculous thought",
    intro: [
      "Most great meme brands begin as an inside joke: a cat that looks permanently disappointed, a frog who files taxes, a potato with main-character energy. The hard part is turning that spark into something with a name, a voice and a look. FunCoin Lab gives you a playground for meme coin ideas, so you can riff on a concept until it actually feels like a character people would remember.",
      "Type a vibe, an animal, an object or a running joke, and the generator builds a complete brand around it: a punchy name, a ticker-style tag, a short origin story, slogans, social bios, meme captions and a previewable landing page. It is built for creative experimentation, branding practice and website prototyping, not for launching or promoting a real token.",
      "Use it to brainstorm for a comedy project, a design portfolio piece, a hackathon demo or simply to make your group chat laugh. If one of your meme coin ideas sticks, save it, tweak the lore and keep iterating until the character feels unmistakably yours. The more you play, the better you get at spotting which jokes have staying power and which ones fizzle after the first laugh.",
    ],
    toolHref: "/create",
    toolCta: "Generate a meme coin idea",
    highlights: [
      {
        title: "From joke to full concept",
        text: "One prompt becomes a name, tag, lore, slogans, bios and captions that all share the same personality.",
      },
      {
        title: "Endless remixing",
        text: "Regenerate the whole concept, spin up fresh logo concepts, meme batches and social posts, or edit any line by hand in the website builder.",
      },
      {
        title: "Instant website preview",
        text: "See your idea as a .fun landing page to judge whether the concept holds together visually.",
      },
    ],
    steps: [
      {
        title: "Drop in a spark",
        text: "Describe the joke, mascot or mood in a sentence. Weird and specific beats generic every time.",
      },
      {
        title: "Pick a direction",
        text: "Choose a style and tone, from wholesome and cozy to chaotic and absurd, and let the AI draft the brand.",
      },
      {
        title: "Refine and save",
        text: "Reroll the parts that miss, keep the parts that land, then save the concept or preview it as a site.",
      },
    ],
    tips: [
      {
        title: "Start with a character, not a category",
        text: "\"A raccoon who runs a 24-hour diner\" gives the AI far more to work with than \"animal coin\". Specific characters create specific jokes.",
      },
      {
        title: "Give it one flaw",
        text: "Memorable mascots are slightly broken: lazy, dramatic, forgetful, overconfident. A single flaw makes lore and captions write themselves.",
      },
      {
        title: "Test the five-second retell",
        text: "If you cannot explain the idea to a friend in one breath, simplify it. The best meme concepts survive being retold badly.",
      },
      {
        title: "Search before you get attached",
        text: "Quickly check that your favorite name is not already a well-known brand or project, so you are not building on someone else's identity.",
      },
    ],
    faqs: [
      {
        q: "What kind of meme coin ideas can FunCoin Lab generate?",
        a: "Anything you can describe: animal mascots, absurd objects, internet in-jokes, office humor, food characters and more. Each idea comes with a name, a ticker-style tag, lore, slogans, social bios, meme captions and a landing page preview so you can see the whole concept at once.",
      },
      {
        q: "Does FunCoin Lab create or launch a real token?",
        a: "No. FunCoin Lab is a creative and branding tool only. It does not create, deploy, list or trade tokens, connect wallets or offer financial advice. Every concept is a starting point for your brand: name it, design it and build the site.",
      },
      {
        q: "How do I get better results from the idea generator?",
        a: "Be specific and a little strange. Mention a character, a setting and a personality trait, such as \"a sleepy owl who guards a vending machine\". Then try a few personalities and naming styles, save the versions you like, and polish the final wording in the website builder.",
      },
      {
        q: "Can I use a generated idea for my own creative project?",
        a: "Yes, you can use generated concepts in your own creative work, subject to our Terms. Because AI output can resemble existing names or brands, check trademarks and search for similar projects before using a name publicly or commercially.",
      },
      {
        q: "Do I need an account to try it?",
        a: "No. Guest mode lets you generate ideas right away and keeps your work in your browser. Creating an account lets you save projects so you can come back to them later from another device, compare different directions and pick up exactly where you left off.",
      },
    ],
    related: ["meme-coin-name-generator", "meme-brand-generator", "ai-meme-coin-generator", "meme-website-builder"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-name-generator",
    title: "Meme Name Generator for Characters | FunCoin Lab",
    description:
      "Use the meme name generator to invent funny, memorable character names for mascots, running jokes and new brands, each with a personality to match.",
    eyebrow: "Character names",
    h1: "A meme name generator for characters with real personality",
    intro: [
      "A good meme name does a lot of work. It tells you who the character is, how they behave and why they are funny before anyone reads a single caption. Think of names that sound like a person you have met, a pet with a grudge or a cartoon that should exist. That is the territory this meme name generator is built for.",
      "Describe your mascot or joke and FunCoin Lab suggests character-driven names with a quick personality sketch, a catchphrase and a ticker-style tag. Instead of random word mashups, you get names that hint at a backstory, so the lore and captions that follow feel natural. You can also nudge the style toward cute, dramatic, deadpan or chaotic, and the suggestions shift to match the kind of humor you are aiming for.",
      "It is handy for stream mascots, comic characters, Discord personas, sticker packs, new brands and creative prototypes. Generate a batch, shortlist the ones that make you grin, then build out the full character from there. A strong name makes every later step easier, because the lore, logo and captions all have something clear to react to. If a name makes you laugh twice, it is probably a keeper.",
    ],
    toolHref: "/create?style=character",
    toolCta: "Generate character names",
    highlights: [
      {
        title: "Names with a backstory",
        text: "Every suggestion arrives with a one-line personality, so you can picture the character immediately.",
      },
      {
        title: "Tone you control",
        text: "Steer names toward cute, dramatic, deadpan or chaotic depending on the humor you are going for.",
      },
      {
        title: "Ready to expand",
        text: "Turn any name into full lore, slogans, bios and a logo concept with one click.",
      },
    ],
    steps: [
      {
        title: "Describe the character",
        text: "What are they, where do they live and what is their deal? A sentence or two is plenty.",
      },
      {
        title: "Generate a batch",
        text: "Get a list of character-style names, each with a short personality note and tag.",
      },
      {
        title: "Build the world",
        text: "Pick a favorite and expand it into lore, captions and a website concept.",
      },
    ],
    tips: [
      {
        title: "Use human-sounding names",
        text: "Pairing an ordinary first name with an unexpected creature, like \"Gary the Moth\", is a classic formula because it feels oddly personal.",
      },
      {
        title: "Lean on rhythm",
        text: "Alliteration and two-beat names (\"Bonk Bonk\", \"Sir Wobbles\") are easier to remember and fun to say out loud.",
      },
      {
        title: "Let the name imply a trait",
        text: "Titles like \"Chef\", \"Captain\" or \"Lord\" instantly add attitude and give you material for captions.",
      },
      {
        title: "Avoid real people",
        text: "Do not build characters around real individuals or famous brands. Original characters are funnier and safer to use.",
      },
    ],
    faqs: [
      {
        q: "How is a meme name different from a regular brand name?",
        a: "A meme name is built around a character and a joke rather than a product benefit. It should be easy to say, slightly absurd and suggest a personality. The generator focuses on names that feel like they belong to someone with a backstory, which makes captions and lore much easier to write.",
      },
      {
        q: "Can I generate names for a specific animal or object?",
        a: "Yes. Include the creature or object in your prompt, plus a trait or setting if you have one. For example, \"a nervous pigeon who works in finance\" or \"a toaster who thinks it is a DJ\". The more specific you are, the more distinctive the names.",
      },
      {
        q: "Are the generated names unique?",
        a: "The AI aims for original combinations, but it cannot guarantee that a name has never been used. Before using a name publicly, search for existing brands, characters and projects and check trademark databases in the countries where you plan to use it.",
      },
      {
        q: "Is this a tool for launching crypto tokens?",
        a: "No. FunCoin Lab is a creative and branding tool. It does not create, issue, list or trade tokens and does not give financial advice. The names and concepts it generates are starting points for your own brand.",
      },
      {
        q: "Can I save the names I like?",
        a: "Yes. In guest mode your work is kept in your browser, and with a free account you can save projects to come back to later. Saved names keep their personality notes so you can expand them whenever you like.",
      },
    ],
    related: ["meme-coin-name-generator", "meme-brand-generator", "meme-logo-generator", "meme-coin-ideas"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-coin-name-generator",
    title: "Meme Coin Name Generator & Tickers | FunCoin Lab",
    description:
      "Generate short, punchy meme coin names and ticker-style tags for new meme brands. Fast to type, easy to remember and built for creative prototyping only.",
    eyebrow: "Names & tickers",
    h1: "Meme coin name generator for short, punchy names and tickers",
    intro: [
      "In meme culture, short wins. A name you can shout, type with one thumb and fit on a sticker will travel further than a clever phrase nobody can spell. This meme coin name generator focuses on compact, high-energy names and the ticker-style tags that go with them, so your brand feels snappy from the first glance and easy to repeat.",
      "Give FunCoin Lab a theme or mascot and it returns a set of short names with matching three to five letter tags, plus a one-line hook. Switch the naming style (short, one-word, slang, fake brand and more) and regenerate until the pair clicks, saving the ones you like along the way. Every suggestion is designed to be easy to read in a logo, a username and a short domain, so you can picture it in use right away.",
      "Everything here is built for branding, creative experiments and website drafts. Use the meme coin name generator to explore naming patterns, test what reads well in a logo and find the combination that sounds like it already has fans. When you find a winner, carry it straight into the logo, domain and website tools to see the whole identity come together.",
    ],
    toolHref: "/create?style=short",
    toolCta: "Generate names and tickers",
    highlights: [
      {
        title: "Built for brevity",
        text: "Names are tuned to be one or two syllables where possible, easy to read in a logo or a username.",
      },
      {
        title: "Matching tags",
        text: "Each name comes with ticker-style tags that echo the sound of the name rather than random letters.",
      },
      {
        title: "Save and compare",
        text: "Save every concept you like to your dashboard, so you never lose a good find while you keep generating.",
      },
    ],
    steps: [
      {
        title: "Set a theme",
        text: "Enter a mascot, mood or word you want the name to play on.",
      },
      {
        title: "Scan the shortlist",
        text: "Review short names with matching tags and a quick hook for each one.",
      },
      {
        title: "Save your favorite",
        text: "Save the winning pair and expand it into a full brand, logo and site concept.",
      },
    ],
    tips: [
      {
        title: "What makes a memorable ticker",
        text: "Three or four letters that you can pronounce as a word, or that clearly echo the name, stick far better than an arbitrary string of consonants.",
      },
      {
        title: "Say it out loud",
        text: "If a name is awkward to say in a voice note or on a stream, it will not spread. Read your shortlist aloud before choosing.",
      },
      {
        title: "Avoid look-alike letters",
        text: "Combinations like \"rn\" and \"m\" or \"I\" and \"l\" blur together in small text. Pick tags that stay legible at tiny sizes.",
      },
      {
        title: "Check for collisions",
        text: "Short names collide with existing projects and trademarks more often. Search the name and tag before using either publicly.",
      },
    ],
    faqs: [
      {
        q: "What is a ticker-style tag in FunCoin Lab?",
        a: "It is a short, all-caps label of three to five letters that pairs with your name, like a nickname for the brand. In FunCoin Lab it is a branding element for your concept. It is not registered anywhere and has no connection to any exchange or market. Think of it as part of the logo and voice, not a financial identifier.",
      },
      {
        q: "How short should a meme coin name be?",
        a: "Aim for one or two syllables, or a compact two-word name that rolls off the tongue. Short names fit better in logos, usernames and domains. The generator prioritizes brevity, but you can ask for longer, more descriptive options if your concept needs them.",
      },
      {
        q: "Will my name and tag be available to use?",
        a: "FunCoin Lab cannot guarantee that. Short names are popular and may already be used by other brands, projects or trademarks. Search the web and relevant trademark databases, and check any platforms where you want to use the name, before you commit.",
      },
      {
        q: "Does generating a name create a token?",
        a: "No. FunCoin Lab does not create, deploy, list or trade tokens, and it does not provide financial or investment advice. Names and tags are branding concepts for creative experimentation and website prototyping. Using one does not create anything on a blockchain.",
      },
      {
        q: "Can I match the name to a .fun domain?",
        a: "Yes. Once you have a name you like, open the domain tool to get .fun domain ideas based on it. Those are suggestions only, so confirm availability with a domain registrar before buying, and check that the name does not clash with an existing trademark.",
      },
    ],
    related: ["meme-name-generator", "fun-domain-generator", "meme-logo-generator", "meme-coin-ideas"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "fun-domain-generator",
    title: ".fun Domain Name Generator & Ideas | FunCoin Lab",
    description:
      "Brainstorm catchy .fun domain ideas for your meme brand or side project. Get playful name suggestions, then confirm availability with a registrar first.",
    eyebrow: ".fun domains",
    h1: "A .fun domain generator for playful brand names",
    intro: [
      "The .fun extension is made for projects that do not take themselves too seriously, which makes it a natural home for mascots, jokes, games and meme brands. The challenge is finding a combination that is short, readable and still captures the personality of your idea. This .fun domain generator helps you brainstorm dozens of options quickly, without staring at a blank search box.",
      "Enter a name, theme or mascot and FunCoin Lab suggests domain ideas using wordplay, short phrases, character names and action words, all paired with the .fun ending. Each suggestion is designed to read cleanly in a browser bar and on a sticker. Suggestions are grouped by style, from exact-match names to playful phrases where the extension finishes the sentence, so you can compare approaches side by side.",
      "To be clear about what this tool does: it suggests names. Unless a registrar integration is connected, FunCoin Lab does not check live availability or sell domains, so a suggestion may already be taken. Always confirm availability and pricing with a domain registrar before you buy anything. It is also worth searching the name itself, since an unregistered domain can still clash with an existing trademark.",
    ],
    toolHref: "/domains",
    toolCta: "Generate .fun domain ideas",
    highlights: [
      {
        title: "Wordplay that fits .fun",
        text: "Suggestions that read naturally with the extension, like phrases that finish the sentence.",
      },
      {
        title: "Short and readable",
        text: "Ideas are filtered toward short, easy-to-type names without confusing hyphens or numbers.",
      },
      {
        title: "Honest about availability",
        text: "We label suggestions as ideas, not guarantees, so you always know to check with a registrar.",
      },
    ],
    steps: [
      {
        title: "Enter your name or theme",
        text: "Start from a brand name you already have or just a mascot and mood.",
      },
      {
        title: "Browse domain ideas",
        text: "Scan a list of .fun suggestions grouped by style, from exact-match to playful phrases.",
      },
      {
        title: "Verify with a registrar",
        text: "Copy your favorites and check real availability and pricing at the registrar of your choice.",
      },
    ],
    tips: [
      {
        title: "Let the extension finish the joke",
        text: "Names like \"stayweird.fun\" or \"frogtime.fun\" use .fun as part of the phrase, which makes them easier to remember than a bare brand name.",
      },
      {
        title: "Skip hyphens and numbers",
        text: "They are hard to say out loud and easy to mistype. If a name only works with a hyphen, look for an alternative.",
      },
      {
        title: "Keep it under about 15 characters",
        text: "Shorter domains are easier to share in captions, bios and voice chats, and they look cleaner on a landing page.",
      },
      {
        title: "Check the brand, not just the domain",
        text: "An available domain can still clash with an existing trademark. Search the name itself before you register anything.",
      },
    ],
    faqs: [
      {
        q: "Does FunCoin Lab check if a .fun domain is available?",
        a: "Not by default. FunCoin Lab suggests domain names, and unless a registrar API has been connected it does not check live availability. Some suggestions may already be registered. Always confirm availability and price with a domain registrar before making plans around a name.",
      },
      {
        q: "Can I buy a domain through FunCoin Lab?",
        a: "No. FunCoin Lab is not a domain registrar and does not sell or reserve domains. Once you find an idea you like, register it through an accredited registrar of your choice, and review their pricing and renewal terms.",
      },
      {
        q: "Why use a .fun domain for a meme brand?",
        a: "The .fun extension signals a playful, lighthearted project right in the address. It often leaves more short, memorable names open than crowded extensions, and it pairs well with phrases, so the domain itself can carry part of the joke.",
      },
      {
        q: "Is a .fun domain idea safe to use for my brand?",
        a: "A domain being available does not mean the name is free to use. Search for existing brands and check trademark databases in your region, especially if the name is close to a well-known company or character.",
      },
      {
        q: "Is this connected to crypto tokens or trading?",
        a: "No. FunCoin Lab is a creative and branding tool for meme brands. It does not create, list or trade tokens and does not give financial advice. Domain ideas are simply naming suggestions for creative projects and website prototypes.",
      },
    ],
    related: ["meme-website-builder", "meme-coin-name-generator", "meme-brand-generator"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-brand-generator",
    title: "Meme Brand Generator: Lore, Voice & Bios | FunCoin Lab",
    description:
      "Build a complete meme brand with a name, origin lore, brand voice, slogans and social bios that all sound like the same unforgettable character.",
    eyebrow: "Brand kit",
    h1: "Meme brand generator for a complete, consistent identity",
    intro: [
      "A name alone is not a brand. What makes a meme stick is consistency: the same character, the same voice and the same running jokes showing up everywhere, from the bio to the landing page. This meme brand generator builds all of those pieces together so they actually fit, instead of leaving you to stitch them together from separate tools.",
      "Start with a concept and FunCoin Lab assembles a mini brand kit: name and tag, an origin story, a tone-of-voice guide, slogans, social bios sized for different platforms, meme captions, a logo concept and color ideas. Each part references the same lore, so your character never feels like it was written by five different people. Change one detail, like the mascot's job, and you can regenerate the rest to match.",
      "It is a useful sandbox for designers, writers, students and community builders who want to practice brand storytelling with something fun. Treat the output as a first draft: keep what is great, rewrite what is not, and make the meme brand your own. Before using it anywhere public, search for similar names and check trademarks so your character is genuinely original and not stepping on an existing brand.",
    ],
    toolHref: "/create",
    toolCta: "Build a meme brand",
    highlights: [
      {
        title: "One voice everywhere",
        text: "Lore, bios, slogans and captions are generated from the same character profile for a consistent feel.",
      },
      {
        title: "Platform-ready bios",
        text: "Get short and long bio variants so the brand reads well in tight profile spaces and longer about pages.",
      },
      {
        title: "Visual direction included",
        text: "A logo concept and palette suggestions help you see the brand, not just read it.",
      },
    ],
    steps: [
      {
        title: "Describe your concept",
        text: "Share the mascot, the joke and the vibe you want people to feel.",
      },
      {
        title: "Generate the kit",
        text: "Get name, lore, voice, slogans, bios, captions and a logo concept in one pass.",
      },
      {
        title: "Edit and preview",
        text: "Tweak any section, then preview the whole brand on a landing page.",
      },
    ],
    tips: [
      {
        title: "Write three voice rules",
        text: "Decide what your character always does, sometimes does and never does. Those rules keep every caption on-brand.",
      },
      {
        title: "Repeat a signature phrase",
        text: "A catchphrase used consistently across bio, slogan and site becomes the hook people quote back to you.",
      },
      {
        title: "Keep lore short",
        text: "A three-sentence origin story is easier to remember and remix than a long saga. Let the community fill in the gaps.",
      },
      {
        title: "Stay original",
        text: "Do not borrow logos, characters or names from existing brands. Check trademarks before you use the brand outside your own experiments.",
      },
    ],
    faqs: [
      {
        q: "What does the meme brand generator create?",
        a: "It creates a brand kit: a name and ticker-style tag, origin lore, personality traits, a catchphrase, community phrases, slogans, social bios, meme captions, a logo concept with color ideas and a landing page preview. All of the pieces are generated from one shared character profile so they stay consistent.",
      },
      {
        q: "Can I edit the generated brand?",
        a: "Yes. Save the concept, then open it in the website builder to rewrite the headline, about text, lore steps, meme captions and community links, and change colors, fonts and buttons. The logo, meme, social and content tools can each generate fresh variations for the same brand.",
      },
      {
        q: "Who is this tool for?",
        a: "Designers building portfolio pieces, writers practicing brand voice, educators teaching branding, community managers brainstorming mascots and anyone who enjoys turning silly ideas into polished concepts. No design or coding experience is needed. If you can describe a joke in a sentence, you can build a brand concept around it.",
      },
      {
        q: "Does FunCoin Lab help launch or promote a token?",
        a: "No. FunCoin Lab is a creative and branding tool only. It does not create, list, sell or trade tokens, manage wallets or provide financial advice. Generated brands are starting points you can edit and make your own.",
      },
      {
        q: "Can I use the brand commercially?",
        a: "You may use generated content as described in our Terms, but you are responsible for making sure the name, logo and copy do not infringe anyone else's rights. Search for similar brands and check trademarks before any public or commercial use.",
      },
      {
        q: "How many brands can I create?",
        a: "You can generate as many concepts as you like within the app's fair-use limits. Saving projects to an account makes it easy to compare different directions side by side. Guest mode keeps your work in your browser instead, so clearing browser data will remove it.",
      },
    ],
    related: ["meme-coin-ideas", "meme-logo-generator", "meme-name-generator", "meme-website-builder"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-logo-generator",
    title: "Meme Logo Generator: Mascot Badge Ideas | FunCoin Lab",
    description:
      "Get meme logo concepts with mascot direction, colors and type ideas, plus a generated vector badge you can preview. Check trademarks before using a logo.",
    eyebrow: "Logo concepts",
    h1: "Meme logo generator for mascot badges and visual ideas",
    intro: [
      "The best meme logos are simple enough to recognize as a tiny avatar and expressive enough to carry the joke on their own. Think bold shapes, one strong facial expression and a color palette that pops. This meme logo generator helps you get from a vague idea to a clear visual direction fast, even if you have never designed a logo before.",
      "For each concept, FunCoin Lab writes a logo brief describing the mascot, pose, expression, colors and typography, and renders a simple generated vector badge so you can see the idea in context. It is a starting point for your own design work or a brief you can hand to an illustrator, not a finished, trademark-cleared logo. Treat it as a sketchbook page.",
      "Use it to explore styles, compare palettes and quickly test whether your character reads at small sizes. When you find a direction you like, refine it in your favorite design tool and make sure it is original before using it anywhere public. A quick trademark search and a reverse image search go a long way, because AI concepts can sometimes echo existing marks. Getting a designer to polish the final version is always a good idea.",
    ],
    toolHref: "/logo",
    toolCta: "Generate a logo concept",
    highlights: [
      {
        title: "Clear design brief",
        text: "A written concept covering mascot, expression, colors and type that a designer can actually use.",
      },
      {
        title: "Vector badge preview",
        text: "A generated badge shows how the name, colors and shape might work together at a glance.",
      },
      {
        title: "Small-size friendly",
        text: "Concepts favor bold silhouettes that still read as a profile picture or favicon.",
      },
    ],
    steps: [
      {
        title: "Choose a brand or mascot",
        text: "Start from a saved concept or describe a new character and style.",
      },
      {
        title: "Generate concepts",
        text: "Get logo briefs with palette and type suggestions plus a vector badge preview.",
      },
      {
        title: "Refine in your tools",
        text: "Export the badge and brief, then develop the final artwork in your design software.",
      },
    ],
    tips: [
      {
        title: "Design for 32 pixels first",
        text: "If the mascot is unrecognizable as a tiny avatar, simplify it. Detail can come later in larger illustrations.",
      },
      {
        title: "Exaggerate one feature",
        text: "Huge eyes, a tiny hat or an enormous grin gives a mascot instant personality and makes it easy to remember.",
      },
      {
        title: "Limit the palette",
        text: "Two or three colors with strong contrast look bolder and reproduce better on stickers, merch and dark backgrounds.",
      },
      {
        title: "Check for look-alikes",
        text: "Run a reverse image search and a trademark check before using a logo publicly, since AI concepts can resemble existing marks.",
      },
    ],
    faqs: [
      {
        q: "What exactly does the meme logo generator produce?",
        a: "It produces a written logo concept, covering mascot, pose, expression, colors and typography, along with a simple generated vector badge for previewing the idea. It is designed as a creative starting point or designer brief rather than a polished, final logo.",
      },
      {
        q: "Can I use the generated badge as my official logo?",
        a: "You can use it as described in our Terms, but you are responsible for making sure it is original enough and does not infringe existing trademarks or artwork. Run a trademark search and consider having a designer refine it before any public or commercial use.",
      },
      {
        q: "What file format is the badge?",
        a: "The badge is generated as a vector graphic, so it scales cleanly and can be opened in most design tools for further editing. Fonts and colors may need adjusting once you move it into your own workflow.",
      },
      {
        q: "Why does my logo look similar to something else?",
        a: "AI-generated concepts draw on common visual patterns, so they can sometimes resemble existing logos or characters. If you notice a similarity, regenerate or adjust the concept, and always check for look-alike marks before using it.",
      },
      {
        q: "Is FunCoin Lab a crypto launch platform?",
        a: "No. FunCoin Lab is a creative and branding tool only. It does not create, list or trade tokens and does not give financial advice. Logos and other outputs are concepts to refine with a designer before launch.",
      },
    ],
    related: ["meme-brand-generator", "meme-name-generator", "meme-website-builder", "meme-coin-name-generator"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-website-builder",
    title: "Meme Website Builder: Landing Page Mockups | FunCoin Lab",
    description:
      "Turn a meme concept into a previewable landing page with hero copy, lore, sections and visuals. A fast meme website builder for prototyping ideas.",
    eyebrow: "Site prototypes",
    h1: "Meme website builder for instant landing page prototypes",
    intro: [
      "Seeing an idea on a real-looking page changes everything. Suddenly you can tell whether the name works in a headline, whether the colors clash and whether the joke lands in the first three seconds. This meme website builder turns your concept into a previewable landing page so you can judge it the way a visitor would, before writing a line of code.",
      "FunCoin Lab generates a hero section with headline and slogan, an about section with the origin story, a lore timeline, an example token concept block, a meme gallery, community links and a footer, all styled with your concept's palette. Illustrative placeholder sections are clearly labeled, so the page never pretends to be something it is not. You can preview it at desktop and mobile widths to check layout and readability.",
      "It is ideal for pitching a concept to friends, practicing landing page copywriting, building a portfolio mockup or testing a few creative directions side by side. Use the meme website builder to prototype quickly, then take the parts you like into your own site project. Pair it with a few .fun domain ideas to see how the whole thing would feel as a real address, and remember to confirm availability with a registrar.",
    ],
    toolHref: "/create?goal=website",
    toolCta: "Build a landing page preview",
    highlights: [
      {
        title: "Full page in one go",
        text: "Hero, lore, voice, captions and footer are generated together and styled to match your brand.",
      },
      {
        title: "Realistic preview",
        text: "View the page in desktop and mobile widths to check layout and readability.",
      },
      {
        title: "Clearly labeled",
        text: "Placeholder sections are labeled as illustrative, keeping the prototype honest.",
      },
    ],
    steps: [
      {
        title: "Start from a concept",
        text: "Use a saved brand or describe a new idea with a website goal in mind.",
      },
      {
        title: "Generate the page",
        text: "Get a complete landing page layout with copy and visuals based on your concept.",
      },
      {
        title: "Preview and iterate",
        text: "Edit headlines and copy, toggle sections on or off, and tune colors, fonts and animations until the page feels right.",
      },
    ],
    tips: [
      {
        title: "Nail the hero in one line",
        text: "Visitors decide in seconds. Your headline should say who the character is and why they are funny, without needing the rest of the page.",
      },
      {
        title: "Show the mascot early",
        text: "Put the logo or mascot above the fold. A face builds connection faster than any paragraph.",
      },
      {
        title: "Keep claims playful, not promotional",
        text: "Write about the character and the community vibe. Avoid any copy that promises money, value or results.",
      },
      {
        title: "Pair it with a matching domain",
        text: "Preview how the site would feel on a short .fun address, then confirm real availability with a registrar.",
      },
    ],
    faqs: [
      {
        q: "Does the meme website builder publish a live site?",
        a: "The builder creates a previewable landing page inside FunCoin Lab. It is a prototype for exploring and presenting ideas. If you want a live website, you can use the copy and design direction as a starting point in your own hosting or site-building setup.",
      },
      {
        q: "What sections are included on the generated page?",
        a: "Each page includes a hero with an animated mascot, an about section, a lore timeline, an example token concept block with placeholder values like \"Not selected\" (purely illustrative and clearly labeled), a meme gallery, community links and a footer. You can hide any section in the builder.",
      },
      {
        q: "Can I edit the copy on the page?",
        a: "Yes. You can regenerate individual sections or edit text directly, then refresh the preview. This makes it easy to test alternative headlines or tones without rebuilding the whole page. Your edits are kept when you save the project, so you can come back and continue iterating later.",
      },
      {
        q: "Does FunCoin Lab connect the site to a token or wallet?",
        a: "No. FunCoin Lab does not create, list or trade tokens, connect wallets or provide financial advice. Generated sites are drafts you can edit, export or publish. There are no buy buttons, wallet connections or real token details on the page.",
      },
      {
        q: "Can I use the generated copy on my own website?",
        a: "You can use generated content as allowed by our Terms. Review it carefully, make sure it does not resemble existing brands, check trademarks and ensure any real-world use complies with the advertising and consumer laws that apply to you.",
      },
    ],
    related: ["fun-domain-generator", "meme-brand-generator", "meme-logo-generator", "ai-meme-coin-generator"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "meme-generator",
    title: "Meme Generator: Captions for Your Mascot | FunCoin Lab",
    description:
      "Write funny meme captions, post ideas and reaction lines for your mascot or brand character. A meme generator that keeps every joke in a consistent voice.",
    eyebrow: "Captions & posts",
    h1: "Meme generator for on-brand captions and post ideas",
    intro: [
      "Once you have a character, the real fun begins: making it say things. A steady stream of captions, reaction lines and post ideas is what keeps a meme alive, but staying funny and on-voice every day is hard. This meme generator writes captions that match your character's personality, so the jokes feel like they come from the same mascot every time.",
      "Pick a saved concept or describe a character, and FunCoin Lab drafts a batch of meme cards in classic formats like top-and-bottom text, captioned images and post-style memes. Copy any caption, generate a variation of a single card or a whole new batch. Selecting a saved concept gives the AI your mascot, traits and catchphrase, which keeps the humor specific instead of generic.",
      "It works well for community managers, streamers, content creators and anyone running a fun side account. Use the meme generator as a brainstorming partner, then pick the lines that genuinely make you laugh and add your own spin. Review everything before posting, keep jokes kind, and avoid referencing real people or brands in ways that could mislead. The best memes still have a human editor behind them.",
    ],
    toolHref: "/memes",
    toolCta: "Generate meme captions",
    highlights: [
      {
        title: "Character-consistent humor",
        text: "Captions are written in your mascot's voice, using its lore and catchphrases.",
      },
      {
        title: "Multiple formats",
        text: "Top-and-bottom text, reaction lines, short posts and thread openers from the same prompt.",
      },
      {
        title: "Tone dial",
        text: "Shift between wholesome, sarcastic, absurd and deadpan without losing the character.",
      },
    ],
    steps: [
      {
        title: "Choose a character",
        text: "Select a saved brand or describe your mascot and its personality.",
      },
      {
        title: "Pick a format and tone",
        text: "Decide what you are posting and how the joke should feel.",
      },
      {
        title: "Generate and curate",
        text: "Get a batch of captions, keep the best ones and reroll the rest.",
      },
    ],
    tips: [
      {
        title: "Relatable beats random",
        text: "The most shareable memes describe a feeling people already have. Put your mascot in everyday situations like Mondays, deadlines or group chats.",
      },
      {
        title: "Cut every extra word",
        text: "Meme captions hit harder when they are short. If a line still works with half the words, use half the words.",
      },
      {
        title: "Build recurring bits",
        text: "Running jokes, weekly formats and repeated catchphrases turn one-off posts into a recognizable series.",
      },
      {
        title: "Keep it kind and original",
        text: "Avoid punching down, using real people's likeness or copying other creators' templates without permission.",
      },
    ],
    faqs: [
      {
        q: "What kinds of memes can this generator write?",
        a: "It writes text for memes: top-and-bottom captions, reaction lines, short social posts, thread openers and post ideas. You can pair the captions with your own images or with the mascot concepts and badges you create in FunCoin Lab.",
      },
      {
        q: "How does it keep captions on-brand?",
        a: "If you select a saved concept, the generator uses its lore, voice notes and catchphrases as context. That keeps the humor consistent with your character instead of producing generic internet jokes. Without a saved concept, describe the character's personality in your prompt to get a similar effect.",
      },
      {
        q: "Can I use the captions on social media?",
        a: "Yes, within our Terms. Review each caption before posting, make sure it does not reference real people or brands in a misleading way, and follow the rules of the platform you are posting on. You are responsible for anything you publish, so edit freely before it goes live.",
      },
      {
        q: "Will the captions promote a crypto token?",
        a: "No. FunCoin Lab is a creative and branding tool and does not create, list or trade tokens or give financial advice. Captions are meant for entertainment and creative use, and you should never use them to make financial promises or misleading claims.",
      },
      {
        q: "Why are some captions not funny?",
        a: "Humor is personal and AI output varies. Generate in batches, keep the few that land and reroll the rest. Adding specific details about your character and audience usually improves the hit rate a lot. Telling the AI what to avoid, such as puns or certain topics, helps too.",
      },
    ],
    related: ["meme-brand-generator", "meme-name-generator", "meme-coin-ideas"],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "ai-meme-coin-generator",
    title: "AI Meme Coin Generator for New Brands | FunCoin Lab",
    description:
      "An AI meme coin generator for meme brand concepts: names, tickers, lore, logos, captions and a .fun site preview. Creative prototyping, not token launch.",
    eyebrow: "AI concept studio",
    h1: "AI meme coin generator for complete brand concepts",
    intro: [
      "FunCoin Lab is an AI meme coin generator in the creative sense: it uses AI to imagine the brand side of a meme project, end to end. Names, ticker-style tags, lore, slogans, social bios, meme captions, logo concepts, .fun domain ideas and a landing page preview are all generated together and stay in sync, so you do not have to copy details between tools.",
      "Under the hood, your prompt is turned into a character profile and every output draws from it. That is why the name, lore, palette, captions and website copy all feel like the same character. You stay in control the whole time: regenerate, save the versions you like and edit the final wording in the website builder. Nothing is final until you say so.",
      "Just as important is what it does not do. The AI meme coin generator does not create tokens, connect wallets, touch markets or predict anything. It is a studio for brand concepts, creative experimentation and website prototyping. Placeholder sections are labeled as such, and you are encouraged to check names and logos against existing trademarks before using them anywhere.",
    ],
    toolHref: "/create",
    toolCta: "Try the AI generator",
    highlights: [
      {
        title: "Everything in one pass",
        text: "Name, tag, lore, voice, captions, logo concept, domain ideas and site preview from a single prompt.",
      },
      {
        title: "Connected outputs",
        text: "A shared character profile keeps every piece consistent, even as you edit.",
      },
      {
        title: "Transparent by design",
        text: "Placeholder sections are clearly labeled.",
      },
    ],
    steps: [
      {
        title: "Prompt the AI",
        text: "Describe your idea, choose a style and tone, and set any must-have words.",
      },
      {
        title: "Review the concept",
        text: "Explore the full generated brand, from name and lore to logo and landing page.",
      },
      {
        title: "Iterate and save",
        text: "Regenerate until it clicks, then save the concept to your projects and fine-tune it in the builder.",
      },
    ],
    tips: [
      {
        title: "Give the AI constraints",
        text: "Specify tone, audience and words to avoid. Constraints produce sharper, more original results than an open prompt.",
      },
      {
        title: "Iterate in layers",
        text: "Settle the name and lore first, then refine captions and site copy. Changing the foundation last creates more rework.",
      },
      {
        title: "Fact-check and originality-check",
        text: "AI can produce names that already exist or details that are inaccurate. Search names and check trademarks before any public use.",
      },
      {
        title: "Keep promotion out of it",
        text: "Treat outputs as fiction. Do not add financial claims to generated copy or present a concept as something it is not.",
      },
    ],
    faqs: [
      {
        q: "How does the AI meme coin generator work?",
        a: "Your prompt is sent to an AI model, which builds a character profile and then generates each brand element from it: name, tag, lore, slogans, bios, captions, logo concept, domain ideas and landing page copy. You can edit or regenerate any element individually.",
      },
      {
        q: "Does it create a real token or smart contract?",
        a: "No. FunCoin Lab does not create, deploy, issue, list, sell or trade tokens, and it does not custody wallets or funds. It does not provide financial, investment or legal advice. All concepts are starting points for branding and prototyping.",
      },
      {
        q: "What does the token concept section mean?",
        a: "Some generated pages include a token concept block with values like network \"Not selected\" and supply \"Customizable\". These are illustrative placeholders that make the mockup look complete. They are not real settings and do not describe any actual asset.",
      },
      {
        q: "Is the AI output always accurate and original?",
        a: "No. AI output can be inaccurate, repetitive or resemble existing names, logos or brands. Review everything carefully, search for similar projects and check trademarks before using a concept publicly. Treat every result as a draft that still needs a human eye.",
      },
      {
        q: "Which AI providers does FunCoin Lab use?",
        a: "FunCoin Lab sends prompts to third-party AI providers to generate content. Our Privacy Policy explains what is shared and how it is handled. Avoid including personal or sensitive information in your prompts, since they are processed by these providers to produce your results.",
      },
      {
        q: "Is it free to use?",
        a: "You can try the generator in guest mode without an account. Creating an account lets you save projects. Any usage limits or paid features will be clearly shown in the app before they apply, so there are no surprises while you experiment.",
      },
    ],
    related: ["meme-coin-ideas", "meme-brand-generator", "meme-website-builder", "fun-domain-generator"],
  },
]

export function getSeoPage(slug: string): SeoPage | undefined {
  return seoPages.find((page) => page.slug === slug)
}
