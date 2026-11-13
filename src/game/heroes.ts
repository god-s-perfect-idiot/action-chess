import type { PieceColor, PieceType, Square } from './types'

export type HeroStat = 1 | 2 | 3 | 4 | 5

export interface HeroDef {
  id: string
  codename: string
  trueName: string
  piece: PieceType
  color: PieceColor
  startSquare: Square
  blurb: string
  gimmick: string
  look: string
  stats: { pwr: HeroStat; spd: HeroStat; sty: HeroStat }
}

/**
 * Full roster — presentation only; chess rules unchanged.
 * Starting sides are shuffled each game (`createTrackedPieces`), so any hero
 * can appear on either team. `color` / `startSquare` are authorship defaults.
 */
export const HEROES: HeroDef[] = [
  // --- Block Dawn pawns ---
  {
    id: 'escanor',
    codename: 'Escanor',
    trueName: 'Escanor',
    piece: 'p',
    color: 'w',
    startSquare: 'a2',
    blurb:
      'Lion’s Sin of Pride — once a prince of Castellio, now the Holy Knight whose power is the sun itself. Sunshine, a Grace once borne by the Archangel Mael, swells with daylight until noon crowns him The One. By night he is a timid flicker; by day Pride answers with Divine Axe Rhitta.',
    gimmick: 'Sunshine',
    look: 'Ginger side-part & mustache; green bartender vest by night, shirtless titan with Divine Axe Rhitta by day',
    stats: { pwr: 2, spd: 2, sty: 5 },
  },
  {
    id: 'one-punch-man',
    codename: 'One Punch Man',
    trueName: 'Saitama',
    piece: 'p',
    color: 'w',
    startSquare: 'b2',
    blurb:
      'A hero for fun who trained until every fight ended in a single blow — and every thrill died with it. Bored bald hero in yellow: he jogs in and punches. Awakened Serious Mode: he teleports — and one punch ends it.',
    gimmick: 'Serious Series',
    look: 'Bald, yellow jumpsuit, white cape, red gloves & boots, gold belt buckle — deadpan until Serious',
    stats: { pwr: 5, spd: 4, sty: 2 },
  },
  {
    id: 'mob',
    codename: 'Mob',
    trueName: 'Shigeo Kageyama',
    piece: 'p',
    color: 'w',
    startSquare: 'c2',
    blurb:
      'An average middle-schooler with world-breaking esper power he keeps bottled behind a deadpan face. Quiet steps, a stiff punch — until emotion overflows, ???% opens, and purple eats the file.',
    gimmick: '???%',
    look: 'Bowl cut, black gakuran, deadpan stare; awakens into flickering purple/black psychic form',
    stats: { pwr: 5, spd: 2, sty: 4 },
  },
  {
    id: 'might-guy',
    codename: 'Might Guy',
    trueName: 'Might Guy',
    piece: 'p',
    color: 'w',
    startSquare: 'd2',
    blurb:
      'Konoha’s Blue Beast — a taijutsu master who bets everything on youth, sweat, and the Eight Inner Gates. He Naruto-runs the file, then bursts with cross, hook, and kick. Awakened Eighth Gate: he teleports into a blistering combo that leaves them charred.',
    gimmick: 'Eight Gates',
    look: 'Bowl cut, thick brows, green jumpsuit, olive flak, orange leg warmers — crimson steam when the Eighth Gate opens',
    stats: { pwr: 5, spd: 5, sty: 4 },
  },
  {
    id: 'deku',
    codename: 'Deku',
    trueName: 'Izuku Midoriya',
    piece: 'p',
    color: 'w',
    startSquare: 'e2',
    blurb:
      'Once quirkless, now the ninth holder of One For All — a stockpile of inherited power he spends to become the next Symbol of Peace. Runs the file on Full Cowl with Detroit-smash punches that detonate on impact. Awakened: he blinks in and chains explosive punch-kick combos.',
    gimmick: 'One For All',
    look: 'Messy green curls, freckles, teal Gamma suit, silver respirator, red belt & iron-sole boots — cyan OFA sparks when awakened',
    stats: { pwr: 5, spd: 4, sty: 4 },
  },
  {
    id: 'all-might',
    codename: 'All Might',
    trueName: 'Toshinori Yagi',
    piece: 'p',
    color: 'w',
    startSquare: 'f2',
    blurb:
      'The Symbol of Peace — eighth holder of One For All, whose smile once held an entire society together. Gaunt True Form runs the file and Texas-Smashes. Awakened: the muscle form leaps in with explosive punches that still shout “I am here!”',
    gimmick: 'One For All',
    look: 'Twin blond tufts, torn blue/red/yellow suit when thin — awakens into the buff hero form',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'chainsaw-man',
    codename: 'Chainsaw Man',
    trueName: 'Denji',
    piece: 'p',
    color: 'w',
    startSquare: 'g2',
    blurb:
      'A debt-ridden devil hunter who fused with the Chainsaw Devil Pochita for a second chance at a simple life. Public Safety grunt who runs the file in a wrinkled shirt; on attack he yanks the cord and becomes Chainsaw Man. Awakened Hero of Hell: four arms, total dismemberment.',
    gimmick: 'Chainsaw',
    look: 'Messy blond, white shirt + black tie, charcoal pants, white/red sneakers — devil forms sprout orange then hell-black saws',
    stats: { pwr: 5, spd: 4, sty: 3 },
  },
  {
    id: 'hakari',
    codename: 'Hakari',
    trueName: 'Kinji Hakari',
    piece: 'p',
    color: 'w',
    startSquare: 'h2',
    blurb:
      'Exiled Tokyo Jujutsu High student who turned fighting into a private fighting-club racket — and a Domain that gambles on immortality. Runs in grinning, hands still in the puffer, then a clean punch-kick rush. Awakened Jackpot: Idle Death Gamble hits, golden-green aura, near untouchable fists.',
    gimmick: 'Idle Death Gamble',
    look: 'Sandy pompadour, dark green puffer, khaki baggies, hoop earrings, thin mustache',
    stats: { pwr: 4, spd: 4, sty: 5 },
  },

  // --- Block Dawn officers ---
  {
    id: 'ingenium',
    codename: 'Ingenium',
    trueName: 'Tenya Iida',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Class 1-A’s rule-bound class president and heir to the Ingenium name — engines in his calves, duty in his bones. Normal sprint, inhuman pace: muffler stacks roar, calf flames flare, and engine-boosted fists own the rank and file.',
    gimmick: 'Turbo Recoil',
    look: 'White engine armor, knight helm, muffler stacks, navy undersuit, gold pivots',
    stats: { pwr: 3, spd: 5, sty: 3 },
  },
  {
    id: 'rock-lee',
    codename: 'Rock Lee',
    trueName: 'Rock Lee',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb:
      'Konoha’s taijutsu prodigy — no ninjutsu, no genjutsu, only the springtime of youth hammered into his legs. He holds a low Strong Fist stance on the file, body-flickers down the rank, then closes with the same cross–hook–kick chain his sensei taught.',
    gimmick: 'Springtime of Youth',
    look: 'Bowl cut, thick brows, green jumpsuit, forehead protector as waist belt, forearm wraps, orange leg warmers, blue sandals',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'lemillion',
    codename: 'Lemillion',
    trueName: 'Mirio Togata',
    piece: 'n',
    color: 'w',
    startSquare: 'b1',
    blurb:
      'U.A.’s “big three” ace who swore to save a million people — Permeation lets him drop through matter itself. Phases under the board, drags them into the floor, then pops out to take the head with a million-watt grin.',
    gimmick: 'Permeation',
    look: 'Spiky blond, gold visor, white suit with 1,000,000 crest, red cape & gauntlets, navy tights',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'deadshot',
    codename: 'Deadshot',
    trueName: 'Floyd Lawton',
    piece: 'b',
    color: 'w',
    startSquare: 'c1',
    blurb:
      'DC’s premier contract killer — a marksman who never misses, even when the target is himself. Locks the diagonal from across the board, then puts two in the same hole with gold wrist-guns and a red eyepiece that sees only the shot.',
    gimmick: 'Wrist Barrage',
    look: 'Silver target helm, red eyepiece, gold wrist-guns, crosshair belt',
    stats: { pwr: 5, spd: 3, sty: 4 },
  },
  {
    id: 'todoroki',
    codename: 'Shoto',
    trueName: 'Shoto Todoroki',
    piece: 'b',
    color: 'w',
    startSquare: 'c1',
    blurb:
      'U.A.’s dual quirk prodigy — half-cold, half-hot, raised to surpass All Might and choosing his own path instead. He slides the diagonal on a freezing ice trail, then closes with a flame-coated punch-kick that scorches the square.',
    gimmick: 'Half-Cold Half-Hot',
    look: 'Split white/crimson hair, heterochromia, left-eye burn scar, navy hero suit, ice gauntlets, red-white gloves, coolant canisters',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'bakugo',
    codename: 'Dynamight',
    trueName: 'Katsuki Bakugo',
    piece: 'b',
    color: 'w',
    startSquare: 'c1',
    blurb:
      'U.A.’s explosive ace — a childhood rival who sweats nitroglycerin and detonates it from his palms. Blast-jumps the diagonal on hand explosions, then Howitzer Impact: palm boom, kick, and a finishing head blast that burns them apart.',
    gimmick: 'Explosion',
    look: 'Ash-blond spikes, red eyes, black eye mask, orange blast headpiece, black suit with orange X, grenade gauntlets, green belt & knee pads',
    stats: { pwr: 5, spd: 5, sty: 4 },
  },
  {
    id: 'gojo',
    codename: 'GOJO',
    trueName: 'Satoru Gojo',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'The strongest sorcerer of the modern age — Six Eyes and Limitless make the space around him untouchable. Blinks in for a scrap, blinks back behind Infinity, then Hollow Purple deletes whatever was standing on the file.',
    gimmick: 'Hollow Purple',
    look: 'White spikes, black blindfold, high-collar jujutsu blacks',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'kakashi',
    codename: 'Kakashi',
    trueName: 'Kakashi Hatake',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Konoha’s Copy Ninja — a masked jonin who fights with one eye open and a dog-eared novel in the other hand. Body-flickers onto the file for a short taijutsu exchange, then finishes with Chidori crackling in his palm.',
    gimmick: 'Chidori',
    look: 'Silver spikes, leaf headband over scarred left eye, navy mask, olive flak, Icha Icha paperback',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },
  {
    id: 'benimaru',
    codename: 'Benimaru',
    trueName: 'Benimaru Shinmon',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Asakusa’s strongest — Company 7’s captain who answers every infernal with a bored smirk and a wall of flame. Rides a flame-bristled matoi across the board, drops into a lean seal stance, then hurls a sun-sized fireball that eats whatever stands on the file.',
    gimmick: 'Ignition',
    look: 'Shaggy black hair, red cross/circle pupils, navy kimono over black tank, baggy trousers — tree-pose idle with a casual brow salute',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'akutagawa',
    codename: 'Akutagawa',
    trueName: 'Ryūnosuke Akutagawa',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Port Mafia’s white-tipped reaper — a sickly prodigy who turns cloth into living steel. Sprints the file with hands buried in his coat, then Rashomon unfurls from the fabric into black blades that carve whatever stands on the square into pieces.',
    gimmick: 'Rashomon',
    look: 'Choppy black hair with white-tipped side-locks, pale stare, high-collar black coat, white cravat, ruffled cuffs — coughs into one hand, pockets for the rest',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'dazai',
    codename: 'Dazai',
    trueName: 'Osamu Dazai',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Armed Detective Agency’s bandaged suicide enthusiast — a former Port Mafia executive who nullifies any ability with a touch. Lets the enemy hero cast first, then No Longer Human turns their power matrix-green and erases it mid-flight.',
    gimmick: 'No Longer Human',
    look: 'Messy dark hair, knowing smirk, sand trench coat, dark vest, bolo tie, white bandages on neck and forearms',
    stats: { pwr: 4, spd: 4, sty: 5 },
  },
  {
    id: 'chuuya',
    codename: 'Chuuya',
    trueName: 'Chūya Nakahara',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Port Mafia’s gravity tyrant — a short fuse in a black fedora who bends the world’s weight to his will. Flies the file by flipping gravity toward the next pad, then crushes whoever stands there with a punch that multiplies mass until bone and board give out.',
    gimmick: 'Upon the Tainted Sorrow',
    look: 'Orange-red waves under a black fedora, blue eyes, coat draped like a cape with rose lining, brown jacket, grey vest, black choker & bolo, gloves',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'yamamoto',
    codename: 'YAMAMOTO',
    trueName: 'Genryūsai Shigekuni Yamamoto',
    piece: 'k',
    color: 'w',
    startSquare: 'e1',
    blurb:
      'Captain-Commander of the Gotei 13 for a thousand years — founder of the Shin’ō Academy and the oldest flame in Soul Society. Slow staff steps across the pad; when Ryūjin Jakka unsheathes, the front block burns to ash.',
    gimmick: 'Ryūjin Jakka',
    look: 'Bald, scarred brow, waist-long white beard, black shihakushō, white captain haori, wooden staff',
    stats: { pwr: 5, spd: 1, sty: 5 },
  },
  {
    id: 'nanami',
    codename: 'Nanami',
    trueName: 'Kento Nanami',
    piece: 'b',
    color: 'w',
    startSquare: 'f1',
    blurb:
      'A jujutsu sorcerer who quit for a salaryman life, then came back because curses never punch out at five. Measures every diagonal at a 7:3 Ratio — then the blunt wrapped cleaver finishes overtime.',
    gimmick: 'Ratio Slice',
    look: 'Blond side-part, green rimless goggles, blue shirt, spotted tie, blunt wrapped cleaver',
    stats: { pwr: 4, spd: 3, sty: 4 },
  },
  {
    id: 'finral',
    codename: 'Finral',
    trueName: 'Finral Roulacase',
    piece: 'n',
    color: 'w',
    startSquare: 'g1',
    blurb:
      'Black Bulls spatial mage — a flirty coward whose portals win wars other fighters start. Opens a silver gate behind them, pulls them through, and snaps it shut before they can scream.',
    gimmick: 'Spatial Gate',
    look: 'Messy sandy hair, purple eyes, Black Bulls cloak, olive tunic, floating grimoire',
    stats: { pwr: 2, spd: 5, sty: 4 },
  },
  {
    id: 'flash-manhattan',
    codename: 'Flash Manhattan',
    trueName: 'Wally West',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb:
      'A Speed Force sprinter fused with atomic blue sight — Wally’s lightning rewritten through Doctor Manhattan’s cold omniscience. A cyan streak that rewrites the file mid-sprint, bolt crest glowing where the forehead mark watches every atom.',
    gimmick: 'Speed Force Discharge',
    look: 'Navy/cyan speed suit, glowing bolt crest, Flash cowl with Manhattan forehead mark, red spikes',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'flash',
    codename: 'Flash',
    trueName: 'Barry Allen',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb:
      'Central City’s scarlet speedster — the Flash who outruns death itself. Same Speed Force discharge as the Manhattan cut: a yellow bolt that rewrites the file mid-sprint, white crest flashing as the lightning lands.',
    gimmick: 'Speed Force Discharge',
    look: 'Scarlet speed suit, white bolt crest, yellow boots & ear wings, crackling gold lightning',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'reverse-flash',
    codename: 'Reverse Flash',
    trueName: 'Eobard Thawne',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb:
      'The Negative Speed Force incarnate — Barry’s future foil in mustard yellow. Same Speed Force discharge as the Flash, rewritten in red: a crimson bolt that rewrites the file mid-sprint, black crest flashing as the lightning lands.',
    gimmick: 'Speed Force Discharge',
    look: 'Mustard speed suit, black bolt crest, red boots & ear wings, crackling red lightning, glowing red eyes',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'quicksilver',
    codename: 'Quicksilver',
    trueName: 'Pietro Maximoff',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb:
      'Magneto’s silver-haired son — a kinetic speedster who outruns the file without a lightning spark. Sprints in on a white slipstream, then erases the square with a blur of hypersonic punches.',
    gimmick: 'Hypersonic Barrage',
    look: 'Silver wing hair, blue speed suit, white zigzag stripe, white gloves & boots, black trunks',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'red-rush',
    codename: 'Red Rush',
    trueName: 'Red Rush',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Guardians of the Globe’s crimson speedster — a maroon blur that outruns the file without a lightning spark. Sprints in on a scarlet slipstream, then erases the square with a hypersonic punch barrage.',
    gimmick: 'Hypersonic Barrage',
    look: 'Maroon speed cowl, scarlet wraparound goggles, red zigzag suit, bright gauntlets & boots',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'speed',
    codename: 'Speed',
    trueName: 'Tommy Maximoff',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Wanda’s silver-haired son — a green blur that outruns the file without a lightning spark. Quicksilver sprint kit in forest paint: slips in on a white afterimage, then erases the square with a hypersonic punch barrage.',
    gimmick: 'Hypersonic Barrage',
    look: 'White wing hair, amber wraparound goggles, green speed suit, white zigzag stripe, white gloves & boots',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'speed-o-sonic',
    codename: "Speed-o'-Sonic",
    trueName: "Speed-o'-Sound Sonic",
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'One Punch Man’s self-proclaimed strongest ninja — a black blur that outruns the file without a lightning spark. Quicksilver sprint kit in ninja paint: slips in on a white afterimage, then carves the square apart with a hypersonic ninjatō flurry.',
    gimmick: 'Supersonic Slash',
    look: 'Black topknot, purple under-eye marks & muffler, black ninja suit, silver riveted plates, sheathed ninjatō',
    stats: { pwr: 3, spd: 5, sty: 5 },
  },
  {
    id: 'zoom',
    codename: 'Zoom',
    trueName: 'Hunter Solomon',
    piece: 'r',
    color: 'b',
    startSquare: 'h8',
    blurb:
      'The Speed Force’s nightmare mirror — a black-suited hunter who claims the title of fastest man alive. Same discharge kit as the Flash, rewritten in blue: a bolt that rewrites the file mid-sprint while cyan lightning claws the air.',
    gimmick: 'Speed Force Discharge',
    look: 'Matte black speed suit, silver bolt crest, hollow black lenses, blue ear wings & crackling blue lightning',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },
  {
    id: 'killua',
    codename: 'Killua',
    trueName: 'Killua Zoldyck',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Youngest assassin of the Zoldyck family — a silver blur who runs the file at Flash pace, blue Nen lightning crawling his skin even at rest. Godspeed closes the lane in a streak; claw-slash flurries carve the square apart until nothing stands.',
    gimmick: 'Godspeed',
    look: 'Spiky silver hair, cat-blue eyes, lavender tee over navy turtleneck, grey shorts, maroon boots, crackling blue lightning',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },

  // --- Night Circuit pawns ---
  {
    id: 'kaneki',
    codename: 'Kaneki',
    trueName: 'Ken Kaneki',
    piece: 'p',
    color: 'b',
    startSquare: 'a7',
    blurb:
      'Once a bookish student, remade into the first artificial one-eyed ghoul after Rize’s kakuhou was transplanted into him. Eyepatch runs the file fast and carves with a rinkaku slash. Awakened Centipede: white hair, mask on, tails that remember Yamori’s torture — and dismember.',
    gimmick: 'Rinkaku',
    look: 'Black fringe & eyepatch, black combat suit — awakens into white hair, centipede mask, four crimson kagune',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'arthur-pendragon',
    codename: 'Arthur Pendragon',
    trueName: 'Arthur Boyle',
    piece: 'p',
    color: 'b',
    startSquare: 'b7',
    blurb:
      'Company 8’s self-crowned knight — a fool who believes so hard in kingship that plasma Excalibur answers. Runs the file carving fire into every cut. Awakened: the blade balloons into a colossal sword that incinerates the pad.',
    gimmick: 'Excalibur',
    look: 'Blond topknot, blue eyes, dark bunker coat with neon cyan stripes, bronze crossguard Excalibur — huge ignited blade when awakened',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'jin-mori',
    codename: 'Jin Mori',
    trueName: 'Jin Mori',
    piece: 'p',
    color: 'b',
    startSquare: 'c7',
    blurb:
      'The God of High School — Monkey King reborn as a fight-hungry teen who climbs every bracket with Renewal Taekwondo. Sprints the file stacking punches into kicks. Awakened: circlet on, Yeoui grown, Geindun underfoot — the square flattens.',
    gimmick: 'Renewal',
    look: 'Spiky dark hair, green forehead goggles, white tee, jacket at the waist, blue pants, red boots — Monkey King: circlet, tiger sash, stone pillar, cloud',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'gohan',
    codename: 'Gohan',
    trueName: 'Son Gohan',
    piece: 'p',
    color: 'b',
    startSquare: 'd7',
    blurb:
      'Son Goku’s scholar son — trained by Piccolo, tempered by Cell, holding untapped potential that wakes when the world needs a warrior more than a student. Runs the file in orange gi with Special Beam Cannon. Awakened SSJ2: he vanishes, then a devastating punch-kick combo ends it.',
    gimmick: 'Potential Unleashed',
    look: 'Black spikes & orange gi with navy sash; SSJ2 flips gold hair, purple gi, red wraps, and crackling blue lightning',
    stats: { pwr: 5, spd: 4, sty: 4 },
  },
  {
    id: 'yuno',
    codename: 'Yuno',
    trueName: 'Yuno Grinberryall',
    piece: 'p',
    color: 'b',
    startSquare: 'e7',
    blurb:
      'Orphan of Hage and rightful prince of the Spade Kingdom — rival to Asta, chosen by a four-leaf wind grimoire and the wind spirit Sylph. Runs the file on razor air cuts. Awakened Spirit Dive: fairy wings, green glow, flight, and crushing whirlwinds.',
    gimmick: 'Spirit Dive',
    look: 'Golden Dawn cape, messy black cowlick, amber eyes, floating wind grimoire; Spirit Dive flips the whole suit green with wings, crown, and mana glow',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },
  {
    id: 'zenitsu',
    codename: 'Zenitsu',
    trueName: 'Zenitsu Agatsuma',
    piece: 'p',
    color: 'b',
    startSquare: 'f7',
    blurb:
      'A cowardly Demon Slayer who masters Thunder Breathing’s first form only — until sleep or terror unlocks the lightning his waking self fears. Runs the file with a sheathed Nichirin draw-cut. Awakened: yellow thunder shell, Flash-pace sprint, one lightning katana slice.',
    gimmick: 'Thunder Breathing',
    look: 'Yellow triangle haori, bowl-cut blond, dark gakuran; awaken encases him in yellow thunder',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'ichigo',
    codename: 'Ichigo',
    trueName: 'Ichigo Kurosaki',
    piece: 'p',
    color: 'b',
    startSquare: 'g7',
    blurb:
      'Karakura’s substitute Shinigami — a teenager who inherited a Quincy mother’s blood and a Hollow’s hunger, then carved his own path with Zangetsu. Runs the file with an oversized cleaver and Getsuga Tenshō. Awakened Final Getsuga: long black hair, void cloak, a dark-dimension slash that erases the pad.',
    gimmick: 'Getsuga Tenshō',
    look: 'Spiky orange, black shihakushō, white sash, red beads, huge cleaver Zangetsu — Mugetsu flips long black hair, bandage seals, and an arm of black void',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'gaara',
    codename: 'Gaara',
    trueName: 'Gaara',
    piece: 'p',
    color: 'b',
    startSquare: 'h7',
    blurb:
      'Kazekage of Sunagakure — once the jinchūriki of Shukaku, raised to believe love was a lie written in sand. Floats the file on a sand cloud and buries foes under pyramids. Awakened Shukaku: slides as a sand pile and entombs them in a Sand Coffin.',
    gimmick: 'Sand Coffin',
    look: 'Red spikes, eye rings, forehead 愛, burgundy coat, gray flak, sand gourd — Shukaku flips to a sand tanuki shell with purple seals and one spiked tail',
    stats: { pwr: 5, spd: 3, sty: 4 },
  },

  // --- Night Circuit officers ---
  {
    id: 'red-riot',
    codename: 'Red Riot',
    trueName: 'Eijiro Kirishima',
    piece: 'r',
    color: 'b',
    startSquare: 'a8',
    blurb:
      'Class 1-A’s manliest shield — Hardening turns his body into living rock so he can stand where others break. Unbreakable form runs the file as armor, then smashes through with rocky fists and a grin that refuses to crumble.',
    gimmick: 'Unbreakable',
    look: 'Spiky crimson hair, jagged black jaw mask, gear pauldrons, bare torso, red R-belt waist-cape, baggy blacks, combat boots',
    stats: { pwr: 5, spd: 3, sty: 2 },
  },
  {
    id: 'todo',
    codename: 'Todo',
    trueName: 'Aoi Todo',
    piece: 'n',
    color: 'b',
    startSquare: 'b8',
    blurb:
      'Kyoto jujutsu’s loudest brother — a mountain of muscle who judges souls by their taste in women and swaps positions with a clap. Boogie Woogie puts him behind you in a blue flash; the smash that follows is brotherly love.',
    gimmick: 'Boogie Woogie',
    look: 'High man-bun, left-eye scar, bare muscle, white obi over navy hakama',
    stats: { pwr: 5, spd: 4, sty: 3 },
  },
  {
    id: 'hawks',
    codename: 'Hawks',
    trueName: 'Keigo Takami',
    piece: 'b',
    color: 'b',
    startSquare: 'c8',
    blurb:
      'The Pro Hero ranked just under the top — a former Commission weapon with Fierce Wings that read every draft of wind. Owns the diagonal from the air; feather volleys pin anything that moves before it finishes its thought.',
    gimmick: 'Fierce Wings',
    look: 'Ash-blond sweep, yellow goggles, tan aviator jacket, huge crimson wings',
    stats: { pwr: 3, spd: 5, sty: 5 },
  },
  {
    id: 'gilgamesh',
    codename: 'Gilgamesh',
    trueName: 'Gilgamesh',
    piece: 'q',
    color: 'b',
    startSquare: 'd8',
    blurb:
      'King of Heroes — two-thirds divine tyrant of ancient Uruk, origin of every later legend. Flies in, opens the Gates of Babylon to his golden treasury, and rains the prototypes of every Noble Phantasm until nothing stands.',
    gimmick: 'Gates of Babylon',
    look: 'Spiky blond, crimson eyes, ornate gold armor, red waist-cape',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'tengen',
    codename: 'Tengen',
    trueName: 'Tengen Uzui',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb:
      'Sound Hashira of the Demon Slayer Corps — a flamboyant shinobi who reads every clash as a score. Sprints the file swinging chain-linked Nichirin cleavers, then carves the square apart in a rapid musical barrage that leaves nothing standing.',
    gimmick: 'Sound Breathing',
    look: 'Spiky white hair, jeweled headband, red left-eye makeup, sleeveless navy uniform, gold armbands, dual cleavers chained across the back',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'overhaul',
    codename: 'Overhaul',
    trueName: 'Kai Chisaki',
    piece: 'k',
    color: 'b',
    startSquare: 'e8',
    blurb:
      'Yakuza reformer with a plague-doctor’s mania for “purity” — Overhaul disassembles matter down to parts and rebuilds it as he wills. Slow gloved steps across the pad; one touch and whatever stands in front comes apart.',
    gimmick: 'Overhaul',
    look: 'Plague beak mask, olive bomber, purple fur collar, white surgical gloves',
    stats: { pwr: 5, spd: 1, sty: 4 },
  },
  {
    id: 'byakuya',
    codename: 'Byakuya',
    trueName: 'Byakuya Kuchiki',
    piece: 'b',
    color: 'b',
    startSquare: 'f8',
    blurb:
      '26th head of the Kuchiki clan and captain of the 6th Division — pride wrapped in law, law wrapped in cherry blossoms. One cut and Senbonzakura blooms; a thousand pink petals carve the diagonal.',
    gimmick: 'Senbonzakura',
    look: 'Long black hair, white kenseikan, mint scarf, captain haori, Senbonzakura',
    stats: { pwr: 4, spd: 4, sty: 5 },
  },
  {
    id: 'minato',
    codename: 'Minato',
    trueName: 'Minato Namikaze',
    piece: 'n',
    color: 'b',
    startSquare: 'g8',
    blurb:
      'The Fourth Hokage — Yellow Flash of the Leaf, whose Flying Thunder God marks made him a ghost on the battlefield. Flash-throws a marked kunai, teleports above, Rasengan down before the echo catches up.',
    gimmick: 'Flying Thunder God',
    look: 'Spiky blonde, leaf headband, white flame-hem haori, green flak, Flying Raijin kunai',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },
  {
    id: 'accelerator',
    codename: 'Accelerator',
    trueName: 'Accelerator',
    piece: 'r',
    color: 'b',
    startSquare: 'h8',
    blurb:
      'Academy City’s strongest Level 5 — an albino vector tyrant whose reflection once made him “invincible,” not merely strong. Touch a vector and it answers to him: reflect, redirect, then erase the file.',
    gimmick: 'Vector Reflect',
    look: 'Albino white shag, blood-red eyes, black tee with white vector glyphs, pale grey pants',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'silver-surfer',
    codename: 'Silver Surfer',
    trueName: 'Norrin Radd',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Herald of Galactus — a chrome sentinel who rides the cosmos on a silver board. He hovers in place, then whizzes the file like a comet and punches so hard the board erupts.',
    gimmick: 'Power Cosmic',
    look: 'Mirror-chrome body, bald, glowing white eyes, sleek silver surfboard',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'roronoa-zoro',
    codename: 'Zoro',
    trueName: 'Roronoa Zoro',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb:
      'Pirate Hunter of the Straw Hats — Wano’s green-haired swordsman who owns the file with a low lunge sprint. Santoryu draws three blades (one clenched in his teeth), airslashes carve every angle, then the square falls apart.',
    gimmick: 'Santoryu',
    look: 'Moss-green topknot, closed left eye scar, three gold earrings, open white kimono, dark green haori, purple obi, three katanas',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'kenpachi',
    codename: 'Kenpachi',
    trueName: 'Kenpachi Zaraki',
    piece: 'r',
    color: 'b',
    startSquare: 'a8',
    blurb:
      'Captain of the 11th Division — a battle-drunk butcher who wears an eyepatch to handicap himself and still lives for the next fight. Lunges the file with a notched blade, idle-swishes for bloodlust, then cuts the lane in a vertical arch that splits whatever stands.',
    gimmick: 'Nozarashi',
    look: 'Spiky black bell-hair, jagged eyepatch, face scar, ragged white captain haori over black shihakushō, bandage-wrapped notched katana',
    stats: { pwr: 5, spd: 4, sty: 4 },
  },
]

const byId = new Map(HEROES.map((h) => [h.id, h]))
const byStart = new Map(
  HEROES.map((h) => [`${h.color}:${h.startSquare}` as const, h]),
)

export function getHeroById(id: string | undefined | null): HeroDef | undefined {
  if (!id) return undefined
  return byId.get(id)
}

export function getHeroByStart(
  color: PieceColor,
  startSquare: Square,
): HeroDef | undefined {
  return byStart.get(`${color}:${startSquare}`)
}
