<script lang="ts">
  import { onMount } from "svelte";
  import { KeyRound, Copy, Check, RefreshCw, Download, Shield, ShieldAlert, ShieldCheck, ShieldX } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type StrengthLevel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

  let password = $state("");
  let passwords = $state<string[]>([]);
  let length = $state(16);
  let count = $state(5);
  let useUppercase = $state(true);
  let useLowercase = $state(true);
  let useDigits = $state(true);
  let useSymbols = $state(false);
  let excludeAmbiguous = $state(true);
  let passphraseMode = $state(false);
  let passphraseWordCount = $state(4);
  let passphraseSeparator = $state("-");
  let copied = $state(false);
  let copiedIndex = $state<number | null>(null);

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const ambiguous = "0O1lI";

  // Word list for passphrases
  const wordList = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
    "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
    "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
    "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
    "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
    "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
    "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
    "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
    "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor",
    "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact",
    "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume",
    "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
    "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado",
    "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis",
    "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball",
    "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base",
    "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
    "beef", "before", "begin", "behave", "behind", "believe", "below", "belt",
    "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle",
    "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black",
    "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood",
    "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
    "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring",
    "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain",
    "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief",
    "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother",
    "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
    "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus",
    "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable",
    "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can",
    "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable",
    "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
    "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog",
    "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling",
    "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion",
    "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check",
    "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney",
    "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon",
    "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw",
    "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb",
    "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown",
    "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code",
    "coffee", "coil", "coin", "collect", "color", "column", "combine", "come",
    "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress",
    "connect", "consider", "consume", "contact", "contain", "content", "contest", "context",
    "control", "convert", "cookie", "cool", "copper", "copy", "coral", "core",
    "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course",
    "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane",
    "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew",
    "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd",
    "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal",
    "cube", "culture", "cup", "curious", "current", "curtain", "curve", "cushion",
    "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger",
    "dare", "dark", "dart", "dash", "data", "date", "dawn", "day",
    "dead", "deal", "debate", "debris", "decade", "december", "decide", "decline",
    "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay",
    "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend",
    "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk",
    "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram",
    "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital",
    "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover",
    "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide",
    "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain",
    "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft",
    "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill",
    "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb",
    "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager",
    "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo",
    "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight",
    "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator",
    "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ",
    "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy",
    "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough",
    "enrich", "enroll", "ensure", "enter", "entire", "entrance", "entry", "envelope",
    "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error",
    "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence",
    "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite",
    "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist",
    "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express",
    "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade",
    "faint", "faith", "fall", "false", "fame", "family", "famous", "fan",
    "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue",
    "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel",
    "female", "fence", "festival", "fever", "few", "fiber", "fiction", "field",
    "figure", "file", "film", "filter", "final", "find", "fine", "finger",
    "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness",
    "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight",
    "flip", "float", "flock", "flood", "floor", "flower", "fluid", "flush",
    "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food",
    "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward",
    "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh",
    "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit",
    "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain",
    "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic",
    "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general",
    "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift",
    "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare",
    "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow",
    "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel",
    "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape",
    "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery",
    "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar",
    "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand",
    "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk",
    "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello",
    "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint",
    "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday",
    "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse",
    "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human",
    "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt",
    "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore",
    "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact",
    "impose", "improve", "impulse", "inch", "include", "income", "increase", "index",
    "indicate", "indoor", "industry", "infant", "inflict", "informal", "injury", "inner",
    "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install",
    "intact", "interest", "into", "invest", "invite", "involve", "iron", "island",
    "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz",
    "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey",
    "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just",
    "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney",
    "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi",
    "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder",
    "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin",
    "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy",
    "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal",
    "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson",
    "letter", "level", "liar", "liberty", "library", "license", "life", "lift",
    "light", "like", "limb", "limit", "link", "lion", "liquid", "list",
    "little", "live", "lizard", "load", "loan", "lobster", "local", "lock",
    "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love",
    "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics",
    "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major",
    "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual",
    "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask",
    "mass", "master", "match", "material", "math", "matrix", "matter", "maximum",
    "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media",
    "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge",
    "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight",
    "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle",
    "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile",
    "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month",
    "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor",
    "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply",
    "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery",
    "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature",
    "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve",
    "nest", "net", "network", "neutral", "never", "news", "next", "nice",
    "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose",
    "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number",
    "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe",
    "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer",
    "often", "oil", "okay", "old", "olive", "olympic", "omit", "once",
    "one", "onion", "online", "only", "open", "opera", "opinion", "oppose",
    "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient",
    "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside",
    "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone",
    "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel",
    "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party",
    "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave",
    "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty",
    "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone",
    "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig",
    "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch",
    "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge",
    "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole",
    "police", "pond", "pony", "pool", "popular", "portion", "position", "possible",
    "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise",
    "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride",
    "primary", "print", "priority", "prison", "private", "prize", "problem", "process",
    "produce", "profit", "program", "project", "promote", "proof", "property", "prosper",
    "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse",
    "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse",
    "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question",
    "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack",
    "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch",
    "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw",
    "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive",
    "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region",
    "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain",
    "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair",
    "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource",
    "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review",
    "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge",
    "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual",
    "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance",
    "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route",
    "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural",
    "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon",
    "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce",
    "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene",
    "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen",
    "script", "scrub", "sea", "search", "season", "seat", "second", "secret",
    "section", "security", "seed", "seek", "segment", "select", "sell", "seminar",
    "senior", "sense", "sentence", "series", "service", "session", "settle", "setup",
    "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff",
    "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot",
    "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shut",
    "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk",
    "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister",
    "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin",
    "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide",
    "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart",
    "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow",
    "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier",
    "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort",
    "soul", "sound", "soup", "source", "south", "space", "spare", "spatial",
    "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice",
    "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon",
    "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze",
    "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand",
    "start", "state", "stay", "steak", "steel", "stem", "step", "stereo",
    "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story",
    "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff",
    "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden",
    "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset",
    "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround",
    "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear",
    "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom",
    "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk",
    "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach",
    "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test",
    "text", "thank", "that", "theme", "then", "theory", "there", "they",
    "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder",
    "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip",
    "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe",
    "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight",
    "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise",
    "toss", "total", "tourist", "toward", "tower", "town", "toy", "track",
    "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel",
    "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger",
    "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet",
    "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel",
    "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist",
    "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle",
    "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique",
    "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update",
    "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage",
    "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum",
    "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various",
    "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb",
    "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious",
    "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus",
    "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void",
    "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk",
    "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp",
    "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel",
    "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet",
    "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper",
    "wide", "width", "wife", "wild", "will", "win", "window", "wine",
    "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish",
    "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work",
    "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write",
    "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra",
    "zero", "zone", "zoo"
  ];

  function getSecureRandom(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function generatePassword(): string {
    if (passphraseMode) {
      return generatePassphrase();
    }

    let charset = "";
    if (useUppercase) charset += uppercase;
    if (useLowercase) charset += lowercase;
    if (useDigits) charset += digits;
    if (useSymbols) charset += symbols;

    if (excludeAmbiguous) {
      charset = charset.split("").filter(c => !ambiguous.includes(c)).join("");
    }

    if (charset.length === 0) {
      charset = lowercase;
    }

    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset[getSecureRandom(charset.length)];
    }

    return result;
  }

  function generatePassphrase(): string {
    const words: string[] = [];
    for (let i = 0; i < passphraseWordCount; i++) {
      words.push(wordList[getSecureRandom(wordList.length)]);
    }
    return words.join(passphraseSeparator);
  }

  function generateAll() {
    passwords = Array.from({ length: count }, () => generatePassword());
    password = passwords[0];
  }

  function calculateStrength(pwd: string): { level: StrengthLevel; score: number; entropy: number } {
    let score = 0;
    const len = pwd.length;

    if (len >= 8) score += 1;
    if (len >= 12) score += 1;
    if (len >= 16) score += 1;
    if (len >= 20) score += 1;

    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    let poolSize = 0;
    if (/[a-z]/.test(pwd)) poolSize += 26;
    if (/[A-Z]/.test(pwd)) poolSize += 26;
    if (/[0-9]/.test(pwd)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32;
    const entropy = Math.log2(Math.pow(poolSize || 26, len));

    let level: StrengthLevel;
    if (score <= 2 || len < 8) level = "very-weak";
    else if (score <= 3) level = "weak";
    else if (score <= 5) level = "fair";
    else if (score <= 7) level = "strong";
    else level = "very-strong";

    return { level, score, entropy };
  }

  function getStrengthIcon(level: StrengthLevel) {
    switch (level) {
      case "very-weak": return ShieldX;
      case "weak": return ShieldAlert;
      case "fair": return Shield;
      case "strong": return ShieldCheck;
      case "very-strong": return ShieldCheck;
    }
  }

  function getStrengthColor(level: StrengthLevel): string {
    switch (level) {
      case "very-weak": return "text-error-500";
      case "weak": return "text-warning-500";
      case "fair": return "text-yellow-500";
      case "strong": return "text-success-500";
      case "very-strong": return "text-primary-500";
    }
  }

  async function copyPassword(index?: number) {
    const text = index !== undefined ? passwords[index] : password;
    await navigator.clipboard.writeText(text);
    copiedIndex = index ?? -1;
    copied = true;
    toaster.success({ title: "Copied!", description: "Password copied to clipboard" });
    setTimeout(() => {
      copied = false;
      copiedIndex = null;
    }, 1500);
  }

  function downloadPasswords() {
    const content = passwords.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generate on mount
  onMount(() => {
    generateAll();
  });
</script>

<svelte:head>
  <title>Password Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <KeyRound class="size-8 text-primary-500" />
      Password Generator
      <span class="badge variant-filled-error text-xs animate-pulse">NEW</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Generate secure, random passwords with customizable complexity
    </p>
  </div>

  <!-- Password Display -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="h2 font-bold">Generated Password</h2>
      <div class="flex gap-2">
        <button class="btn variant-filled-primary" onclick={generateAll}>
          <RefreshCw class="size-4" />
          Regenerate
        </button>
        <button class="btn variant-soft-surface" onclick={downloadPasswords}>
          <Download class="size-4" />
          Download
        </button>
      </div>
    </div>

    <!-- Main Password -->
    {#if password}
      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <div class="flex justify-between items-center">
          <code class="text-xl font-mono break-all">{password}</code>
          <button class="btn-icon" onclick={() => copyPassword()}>
            {#if copied}
              <Check class="size-5 text-success-500" />
            {:else}
              <Copy class="size-5" />
            {/if}
          </button>
        </div>

        <!-- Strength Indicator -->
        <div class="mt-4 flex items-center gap-3">
          <svelte:component this={getStrengthIcon(calculateStrength(password).level)} class="size-5 {getStrengthColor(calculateStrength(password).level)}" />
          <div class="flex-1">
            <div class="h-2 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
              <div
                class="h-full transition-all {getStrengthColor(calculateStrength(password).level).replace('text-', 'bg-')}"
                style="width: {(calculateStrength(password).score / 8) * 100}%"
              ></div>
            </div>
          </div>
          <span class="text-sm font-medium {getStrengthColor(calculateStrength(password).level)} capitalize">
            {calculateStrength(password).level.replace('-', ' ')}
          </span>
        </div>
        <p class="text-xs text-surface-500 mt-2">
          Entropy: {calculateStrength(password).entropy.toFixed(1)} bits | Length: {password.length}
        </p>
      </div>
    {/if}

    <!-- Bulk Passwords -->
    {#if count > 1 && passwords.length > 1}
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-medium">All Passwords ({passwords.length})</span>
          <button class="btn btn-sm variant-soft-surface" onclick={() => navigator.clipboard.writeText(passwords.join('\n'))}>
            <Copy class="size-4" />
            Copy All
          </button>
        </div>
        <div class="max-h-60 overflow-y-auto space-y-2">
          {#each passwords as pwd, index}
            <div class="flex justify-between items-center p-2 bg-surface-100 dark:bg-surface-800 rounded">
              <code class="font-mono text-sm break-all">{pwd}</code>
              <button class="btn-icon btn-icon-sm shrink-0 ml-2" onclick={() => copyPassword(index)}>
                {#if copiedIndex === index}
                  <Check class="size-4 text-success-500" />
                {:else}
                  <Copy class="size-4" />
                {/if}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Options -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Options</h2>

    <!-- Mode Toggle -->
    <div class="flex gap-2">
      <button
        class="btn {passphraseMode ? 'variant-soft-surface' : 'variant-filled-primary'}"
        onclick={() => { passphraseMode = false; generateAll(); }}
      >
        Password
      </button>
      <button
        class="btn {passphraseMode ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => { passphraseMode = true; generateAll(); }}
      >
        Passphrase
      </button>
    </div>

    {#if passphraseMode}
      <!-- Passphrase Options -->
      <div class="space-y-4">
        <label class="label">
          <span>Word Count: {passphraseWordCount}</span>
          <input
            type="range"
            class="range-slider"
            min="3"
            max="10"
            bind:value={passphraseWordCount}
            onchange={generateAll}
          />
        </label>

        <label class="label">
          <span>Separator</span>
          <select class="select" bind:value={passphraseSeparator} onchange={generateAll}>
            <option value="-">Dash (-)</option>
            <option value=" ">Space ( )</option>
            <option value="_">Underscore (_)</option>
            <option value=".">Dot (.)</option>
            <option value="">None</option>
          </select>
        </label>
      </div>
    {:else}
      <!-- Password Options -->
      <div class="space-y-4">
        <label class="label">
          <span>Length: {length}</span>
          <input
            type="range"
            class="range-slider"
            min="4"
            max="128"
            bind:value={length}
            onchange={generateAll}
          />
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useUppercase} onchange={generateAll} />
            <span>Uppercase (A-Z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useLowercase} onchange={generateAll} />
            <span>Lowercase (a-z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useDigits} onchange={generateAll} />
            <span>Digits (0-9)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useSymbols} onchange={generateAll} />
            <span>Symbols (!@#$...)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" class="checkbox" bind:checked={excludeAmbiguous} onchange={generateAll} />
            <span>Exclude Ambiguous (0O, 1lI)</span>
          </label>
        </div>
      </div>
    {/if}

    <!-- Count -->
    <label class="label">
      <span>Generate Count: {count}</span>
      <input
        type="range"
        class="range-slider"
        min="1"
        max="20"
        bind:value={count}
        onchange={generateAll}
      />
    </label>
  </div>
</div>
