export const vrNav = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Games", href: "#games" },
  { label: "Modules", href: "#modules" },
  { label: "Sessions", href: "#sessions" },
  { label: "Scenarios", href: "#scenarios" },
  { label: "Help", href: "#help" }
];

export const vrGames = [
  {
    slug: "echo-squad",
    title: "Echo Squad",
    genre: "Co-op puzzle",
    genreKey: "coop",
    tags: ["команда", "логіка", "easy"],
    players: "2-4",
    playerKey: "2-4",
    duration: "60 хв",
    durationKey: "60",
    level: "Easy sync",
    shortText: "Кооперативна місія з просторовими задачами і голосовими підказками.",
    description: "Echo Squad підходить для першого знайомства з VR: команда рухається через серію кімнат, вирішує задачі на координацію і постійно має говорити між собою. Це спокійний, але дуже залучений формат.",
    features: ["підходить новачкам", "командні загадки", "низький рівень стресу"],
    recommendedFor: "друзів, сімей, першого VR-досвіду",
    mediaTone: "cyan"
  },
  {
    slug: "velocity-arena",
    title: "Velocity Arena",
    genre: "Action arena",
    genreKey: "action",
    tags: ["екшен", "арена", "fast"],
    players: "2-6",
    playerKey: "2-6",
    duration: "45-60 хв",
    durationKey: "45-60",
    level: "High tempo",
    shortText: "Неонова арена з короткими раундами, рухом і відчуттям live-матчу.",
    description: "Velocity Arena створена для швидкого темпу: короткі раунди, активне переміщення, командні ролі і відчуття спортивного VR-матчу. Добре заходить компаніям, які хочуть драйву без довгого сюжету.",
    features: ["короткі раунди", "активний рух", "змагальний формат"],
    recommendedFor: "компаній друзів, корпоративних міні-турнірів",
    mediaTone: "blue"
  },
  {
    slug: "afterlight",
    title: "Afterlight",
    genre: "Story adventure",
    genreKey: "story",
    tags: ["story", "cinematic", "soft"],
    players: "2-3",
    playerKey: "2-3",
    duration: "60 хв",
    durationKey: "60",
    level: "Cinematic",
    shortText: "Атмосферна пригода з красивою сценою і спокійним темпом.",
    description: "Afterlight більше схожа на інтерактивний фільм: світло, звук і сюжет ведуть гравців через м'яку пригоду. Тут менше хаосу, більше настрою і відчуття присутності в іншому просторі.",
    features: ["кінематографічний темп", "атмосферні сцени", "м'яка взаємодія"],
    recommendedFor: "пар, спокійних компаній, першого сюжетного VR",
    mediaTone: "violet"
  },
  {
    slug: "black-echo",
    title: "Black Echo",
    genre: "Horror mission",
    genreKey: "horror",
    tags: ["horror", "dark", "intense"],
    players: "2-4",
    playerKey: "2-4",
    duration: "45-60 хв",
    durationKey: "45-60",
    level: "Intense",
    shortText: "Темний сценарій для команди, яка готова до напруги і звуку.",
    description: "Black Echo грає на напрузі, темряві та звукових підказках. Це контрольований horror-досвід без зайвої жорсткості, але з достатньою атмосферою, щоб команда трималася разом.",
    features: ["контрольований страх", "сильний звук", "командна напруга"],
    recommendedFor: "сміливих компаній і вечорів з вау-ефектом",
    mediaTone: "magenta"
  },
  {
    slug: "neon-heist",
    title: "Neon Heist",
    genre: "Stealth quest",
    genreKey: "quest",
    tags: ["stealth", "mission", "tactics"],
    players: "2-5",
    playerKey: "2-5",
    duration: "60 хв",
    durationKey: "60",
    level: "Tactical",
    shortText: "Командне пограбування з лазерами, ролями і точним таймінгом.",
    description: "Neon Heist збирає команду навколо однієї місії: пройти захист, синхронізувати дії і винести цифровий артефакт. Гра відчувається як легкий VR escape-room з більш технологічною подачею.",
    features: ["ролі в команді", "лазерні пастки", "місія з таймінгом"],
    recommendedFor: "команд, які люблять планувати і діяти разом",
    mediaTone: "green"
  },
  {
    slug: "skyforge",
    title: "Skyforge",
    genre: "Fantasy combat",
    genreKey: "fantasy",
    tags: ["fantasy", "combat", "epic"],
    players: "2-4",
    playerKey: "2-4",
    duration: "60 хв",
    durationKey: "60",
    level: "Medium",
    shortText: "Фентезійна битва на літаючій арені з магією і командними ролями.",
    description: "Skyforge додає до VR відчуття великої пригоди: магічні ефекти, арена в небі і командні ролі для атаки, захисту та підтримки. Добре працює як святковий сценарій.",
    features: ["магічні ефекти", "командні ролі", "епічна арена"],
    recommendedFor: "днів народження і компаній, які хочуть видовищності",
    mediaTone: "gold"
  },
  {
    slug: "zero-gravity",
    title: "Zero Gravity",
    genre: "Space survival",
    genreKey: "sci-fi",
    tags: ["space", "survival", "coop"],
    players: "2-4",
    playerKey: "2-4",
    duration: "45 хв",
    durationKey: "30-45",
    level: "Medium",
    shortText: "Космічна кооперативна місія з ремонтом станції і аварійними рішеннями.",
    description: "Zero Gravity переносить команду на пошкоджену станцію: треба швидко знаходити модулі, розподіляти задачі і стабілізувати систему. Це гарний баланс між дією і кооперацією.",
    features: ["космічна станція", "аварійні задачі", "кооперативний survival"],
    recommendedFor: "компаній, які люблять sci-fi і командну взаємодію",
    mediaTone: "ice"
  },
  {
    slug: "rhythm-core",
    title: "Rhythm Core",
    genre: "Music arcade",
    genreKey: "arcade",
    tags: ["music", "arcade", "party"],
    players: "1-4",
    playerKey: "1-4",
    duration: "30-45 хв",
    durationKey: "30-45",
    level: "Party",
    shortText: "Музичний arcade-режим з ритмом, світлом і швидкими партіями.",
    description: "Rhythm Core легкий, яскравий і дуже швидко включає людей у процес. Формат добре підходить як частина вечірки або розігрів перед більшою VR-сесією.",
    features: ["музичний темп", "короткі партії", "простий старт"],
    recommendedFor: "вечірок, побачень, короткого знайомства з VR",
    mediaTone: "pink"
  }
];

export const vrPricing = [
  {
    name: "First Dive",
    price: "900 грн",
    meta: "до 2 гравців",
    features: ["60 хвилин", "інструктаж", "підбір гри для новачків"]
  },
  {
    name: "Squad",
    price: "1500 грн",
    meta: "3-6 гравців",
    features: ["командні сценарії", "ротація гравців", "супровід адміністратора"]
  },
  {
    name: "Event",
    price: "від 2800 грн",
    meta: "свята та корпоративи",
    features: ["окремий сценарій", "гнучка тривалість", "підготовка під групу"]
  }
];

export const vrEvents = [
  "День народження з окремим темпом гри",
  "Корпоративний міні-турнір",
  "Побачення або вечір для двох",
  "Дитячий формат після уточнення віку"
];
