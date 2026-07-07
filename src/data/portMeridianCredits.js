import { BACKGROUND_MUSIC } from '../utils/audio/soundEffects';

export const PORT_MERIDIAN_CREDIT_STATUS = {
  active: { label: 'In build' },
  staged: { label: 'Staged' },
};

const WHITE_BAT_AUDIO_TRACKS = BACKGROUND_MUSIC.filter(
  (track) => track.attribution === 'Karl Casey @ White Bat Audio'
)
  .map((track) => track.title)
  .sort((left, right) => left.localeCompare(right));

export const PORT_MERIDIAN_CREDIT_SCOPE =
  'Grouped by creator once. Covers the Port Meridian city build, including the current District 01 slice, the apartment terminal shell, desktop and phone cosmetics, the font stack, supporting sound packs, and the White Bat Audio music catalog already used across CodeGrind.';

export const PORT_MERIDIAN_CREDIT_REGISTRY = [
  {
    id: 'addinsachen',
    creator: 'Addinsachen',
    creatorUrl: 'https://addinsachen.itch.io',
    items: [
      {
        title: 'Pixeledge City',
        url: 'https://addinsachen.itch.io/pixeledge-city',
        usage:
          'Port Meridian exterior streets, sidewalks, trash, and the base city tile language for the current District 01 slice.',
        status: 'active',
      },
    ],
  },
  {
    id: 'ad-sounds',
    creator: 'AD Sounds',
    creatorUrl: 'https://ad-sounds.itch.io',
    items: [
      {
        title: 'Dialog Text Sound Effects',
        url: 'https://ad-sounds.itch.io/dialog-text-sound-effects',
        usage: 'Typewriter and dialog blips for desktop shell prompts, callouts, and phone UI.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'ashizian',
    creator: 'Ashizian',
    creatorUrl: 'https://ashizian.itch.io',
    items: [
      {
        title: 'Pixelized Phone',
        url: 'https://ashizian.itch.io/pixelized-phone',
        usage: 'Phone shell cosmetics, backgrounds, and handset customization hooks.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'aspecsgaming',
    creator: 'Aspecs Gaming',
    creatorUrl: 'https://aspecsgaming.itch.io',
    items: [
      {
        title: 'Pixel Art Cursors',
        url: 'https://aspecsgaming.itch.io/pixel-art-cursors',
        usage: 'Cursor swaps for desktop shell themes and future apartment terminal cosmetics.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'comp3interactive',
    creator: 'Comp3interactive',
    creatorUrl: 'https://comp3interactive.itch.io',
    items: [
      {
        title: 'Retro Windows GUI',
        url: 'https://comp3interactive.itch.io/retro-windows-gui',
        usage: 'Retro desktop chrome references for shell windows, controls, and modal framing.',
        status: 'active',
      },
    ],
  },
  {
    id: 'damp-squib',
    creator: 'Damp Squib',
    creatorUrl: 'https://damp-squib.itch.io',
    items: [
      {
        title: 'Computer Icons Asset Pack',
        url: 'https://damp-squib.itch.io/computer-icons-asset-pack',
        usage:
          'Desktop shell iconography, window language, and retro operating-system styling cues.',
        status: 'active',
      },
    ],
  },
  {
    id: 'datagoblin',
    creator: 'DataGoblin',
    creatorUrl: 'https://datagoblin.itch.io',
    items: [
      {
        title: 'Monogram',
        url: 'https://datagoblin.itch.io/monogram',
        usage: 'Additional pixel font option for shell headers and customization unlocks.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'daymarius',
    creator: 'Daymarius',
    creatorUrl: 'https://www.dafont.com/retro-gaming.font',
    items: [
      {
        title: 'Retro Gaming',
        url: 'https://www.dafont.com/pt/retro-gaming.font',
        usage: 'Primary retro desktop font candidate for shell chrome and system labels.',
        status: 'active',
      },
    ],
  },
  {
    id: 'edermunizz',
    creator: 'Eder Muniz',
    creatorUrl: 'https://edermunizz.itch.io',
    items: [
      {
        title: 'Free Futuristic City',
        url: 'https://edermunizz.itch.io/free-futuristic-city',
        usage: 'Supplemental skyline and ad-background backdrops for Port Meridian transitions.',
        status: 'active',
      },
    ],
  },
  {
    id: 'essssam',
    creator: 'Essssam',
    creatorUrl: 'https://essssam.itch.io',
    items: [
      {
        title: 'Pixel AE',
        url: 'https://essssam.itch.io/pixel-ae',
        usage: 'Extra font option for shell themes and unlockable interface presets.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'fontworks-google',
    creator: 'Fontworks / Google Fonts',
    creatorUrl: 'https://github.com/fontworks-fonts/DotGothic16',
    items: [
      {
        title: 'DotGothic16',
        url: 'https://github.com/fontworks-fonts/DotGothic16',
        usage: 'Pixel UI font option for desktop shell headings, tooltips, and terminal labels.',
        status: 'active',
      },
    ],
  },
  {
    id: 'free-game-assets',
    creator: 'Free Game Assets',
    creatorUrl: 'https://free-game-assets.itch.io',
    items: [
      {
        title: 'Free Scrolling City Backgrounds Pixel Art',
        url: 'https://free-game-assets.itch.io/free-scrolling-city-backgrounds-pixel-art',
        usage: 'Travel and loading-scene background option for district transfers.',
        status: 'staged',
      },
      {
        title: 'Free Cyberpunk Resource Pixel Art 32x32 Icons',
        url: 'https://free-game-assets.itch.io/free-cyberpunk-resource-pixel-art-3232-icons',
        usage: 'Apartment upgrade and prop icon set for shop and room customization flows.',
        status: 'staged',
      },
      {
        title: 'Free Futuristic City Pixel Art Backgrounds',
        url: 'https://free-game-assets.itch.io/free-futuristic-city-pixel-art-backgrounds',
        usage: 'Backup skyline and ad-feed background plates for city transitions.',
        status: 'staged',
      },
      {
        title: 'Free Billboards and Advertising Pixel Art',
        url: 'https://free-game-assets.itch.io/free-billboards-and-advertising-pixel-art',
        usage: 'Desktop-feed billboards and in-world advertising props.',
        status: 'active',
      },
      {
        title: 'Animated Ads Cyberpunk Pixel Art',
        url: 'https://free-game-assets.itch.io/animated-ads-cyberpunk-pixel-art',
        usage: 'Animated ad strips for the apartment desktop feed and intro shell.',
        status: 'active',
      },
      {
        title: 'Animated Cyberpunk Ads Pixel Art Pack 2',
        url: 'https://free-game-assets.itch.io/animated-cyberpunk-ads-pixel-art-pack-2',
        usage: 'Additional animated ad loops for shell overlays, popups, and city signage.',
        status: 'active',
      },
    ],
  },
  {
    id: 'graduation-cat',
    creator: 'Graduation Cat',
    creatorUrl: 'https://graduation-cat.itch.io',
    items: [
      {
        title: 'House Interior Tileset 32x32',
        url: 'https://graduation-cat.itch.io/house-interior-tileset-32x32',
        usage:
          'Supplemental apartment and interior room dressing for Port Meridian spaces, including the current safehouse slice.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'greedy-toad',
    creator: 'Greedy Toad',
    creatorUrl: 'https://greedy-toad.itch.io',
    items: [
      {
        title: 'Pixel Desktop Icons Pack',
        url: 'https://greedy-toad.itch.io/pixel-desktop-icons-pack',
        usage: 'Desktop icon family for the apartment safehouse shell and future terminal themes.',
        status: 'active',
      },
    ],
  },
  {
    id: 'gregor-quendel',
    creator: 'Gregor Quendel',
    creatorUrl: 'https://gregor-quendel.itch.io',
    items: [
      {
        title: 'Free General Ambience Sounds',
        url: 'https://gregor-quendel.itch.io/free-general-ambience-sounds',
        usage: 'Ambient room and city-noise layers for Port Meridian traversal.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'hungry-japanese-students',
    creator: 'Hungry Japanese Students',
    creatorUrl: 'https://hungryjapanesestudents.itch.io',
    items: [
      {
        title: 'Cyberpunk',
        url: 'https://hungryjapanesestudents.itch.io/cyberpunk',
        usage: 'Supplemental cyberpunk skyline background option for travel and ad surfaces.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'jackburton84',
    creator: 'Jack Burton 84',
    creatorUrl: 'https://jackburton84.itch.io',
    items: [
      {
        title: '80s Pixel Cars Pack Retro Vehicle Sprites',
        url: 'https://jackburton84.itch.io/80s-pixel-cars-pack-retro-vehicle-sprites',
        usage: 'Street traffic dressing and parked-car variation for the district exterior pass.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'jdsherbert',
    creator: 'J.D. Sherbert',
    creatorUrl: 'https://jdsherbert.itch.io',
    items: [
      {
        title: 'Ambiences Music Pack',
        url: 'https://jdsherbert.itch.io/ambiences-music-pack',
        usage: 'Ambient music bed candidate for apartment, transit, and city spaces.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'justfredrik',
    creator: 'JustFredrik',
    creatorUrl: 'https://justfredrik.itch.io',
    items: [
      {
        title: 'Weiholmir',
        url: 'https://justfredrik.itch.io/weiholmir',
        usage: 'Additional font option for desktop shell labels and cosmetic presets.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'karsiori',
    creator: 'Karsiori',
    creatorUrl: 'https://karsiori.itch.io',
    items: [
      {
        title: 'Free Pixel Art Neon Signs',
        url: 'https://karsiori.itch.io/free-pixel-art-neon-signs',
        usage: 'Neon storefront accents and wayfinding signs across Port Meridian.',
        status: 'active',
      },
      {
        title: 'Pixel Art Vending Machines',
        url: 'https://karsiori.itch.io/pixel-art-vending-machines',
        usage: 'Street props and shop-adjacent environmental dressing.',
        status: 'active',
      },
    ],
  },
  {
    id: 'karl-casey',
    creator: 'Karl Casey @ White Bat Audio',
    creatorUrl: 'https://whitebataudio.com',
    items: [
      {
        title: 'White Bat Audio background music catalog',
        url: 'https://whitebataudio.com',
        usage:
          'Background music currently used across CodeGrind, including Port Meridian preview sequences, city mode, and tower-defense surfaces.',
        details: WHITE_BAT_AUDIO_TRACKS,
        status: 'active',
      },
    ],
  },
  {
    id: 'kika',
    creator: 'Kika',
    creatorUrl: 'https://github.com/kika/fixedsys',
    items: [
      {
        title: 'Fixedsys',
        url: 'https://github.com/kika/fixedsys',
        usage: 'Fallback retro system-font reference for desktop shell typography.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'liamrogersdeveloper',
    creator: 'Liam Rogers Developer',
    creatorUrl: 'https://liamrogersdeveloper.itch.io',
    items: [
      {
        title: 'Pixel Art Computer CRT Terminal Monitors',
        url: 'https://liamrogersdeveloper.itch.io/pixel-art-computer-crt-terminal-monitors',
        usage:
          'Monitor bezel art that makes the in-world apartment terminal match the shell overlay.',
        status: 'active',
      },
    ],
  },
  {
    id: 'limezu',
    creator: 'LimeZu',
    creatorUrl: 'https://limezu.itch.io',
    items: [
      {
        title: 'Modern Interiors',
        url: 'https://limezu.itch.io/moderninteriors',
        usage:
          'Primary interior tileset candidate for apartment expansions and future city interiors.',
        status: 'active',
      },
    ],
  },
  {
    id: 'little-wild-grass',
    creator: 'Little Wild Grass',
    creatorUrl: 'https://littlewildgrass.itch.io',
    items: [
      {
        title: 'Childish 8x8 Font',
        url: 'https://littlewildgrass.itch.io/little-wild-grass-childish-8x8-font',
        usage: 'Alternative pixel font for desktop personalization and toy-like shell themes.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'livingtheindie',
    creator: 'Living The Indie',
    creatorUrl: 'https://livingtheindie.itch.io',
    items: [
      {
        title: 'Pixel Cyberpunk Interior',
        url: 'https://livingtheindie.itch.io/pixel-cyberpunk-interior',
        usage: 'Earlier apartment interior candidate retained as a staged backup set.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'morda-studios',
    creator: 'Morda Studios',
    creatorUrl: 'https://morda-studios.itch.io',
    items: [
      {
        title: 'Cyberpunk Tileset 16x16',
        url: 'https://morda-studios.itch.io/cyberpunk-tileset-16x16',
        usage: 'Animated sign set for city blocks and ad-heavy storefront clusters.',
        status: 'active',
      },
    ],
  },
  {
    id: 'nikoichu',
    creator: 'Nikoichu',
    creatorUrl: 'https://nikoichu.itch.io',
    items: [
      {
        title: 'Pixel Icons',
        url: 'https://nikoichu.itch.io/pixel-icons',
        usage:
          'UI icon family for shell apps, contracts, phone surfaces, and tower-defense chrome.',
        status: 'active',
      },
    ],
  },
  {
    id: 'o-lobster',
    creator: 'O-Lobster',
    creatorUrl: 'https://o-lobster.itch.io',
    items: [
      {
        title: 'Monopixel Icon Collection',
        url: 'https://o-lobster.itch.io/monopixel-icon-collection',
        usage: 'Additional icon family for shell apps, phone tools, and device widgets.',
        status: 'active',
      },
      {
        title: 'Mono-Lith Font',
        url: 'https://o-lobster.itch.io/mono-lith-font',
        usage: 'Pixel system-font option for shell windows, Monaco styling, and OS chrome.',
        status: 'active',
      },
    ],
  },
  {
    id: 'pegadance',
    creator: 'PegaDance',
    creatorUrl: 'https://pegadance.itch.io',
    items: [
      {
        title: 'Free Cyber Finance Hacking Terminal UI Sounds',
        url: 'https://pegadance.itch.io/free-cyber-finance-hacking-terminal-ui-sounds',
        usage: 'Terminal clicks, confirm tones, and UI audio for apartment shell interactions.',
        status: 'active',
      },
    ],
  },
  {
    id: 'polusx',
    creator: 'PolusX',
    creatorUrl: 'https://polusx.itch.io',
    items: [
      {
        title: 'Galvanic Font Free',
        url: 'https://polusx.itch.io/galvanic-font-free',
        usage: 'Additional futuristic font option for unlockable shell variants.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'riciery-leal',
    creator: 'Riciery Leal',
    creatorUrl: 'https://www.dafont.com/vcr-osd-mono.font',
    items: [
      {
        title: 'VCR OSD Mono 1.001',
        url: 'https://www.dafont.com/vcr-osd-mono.font',
        usage: 'OS-shell and terminal font candidate for boot screens and command panes.',
        status: 'active',
      },
    ],
  },
  {
    id: 'takwolf',
    creator: 'TakWolf',
    creatorUrl: 'https://takwolf.itch.io',
    items: [
      {
        title: 'Retro Pixel Font',
        url: 'https://takwolf.itch.io/retro-pixel-font',
        usage: 'Additional pixel font option for shell personalization.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'tangram-play',
    creator: 'Tangram Play',
    creatorUrl:
      'https://github.com/tangrams/tangram-play/blob/master/public/data/fonts/ms-sans-serif/readme.txt',
    items: [
      {
        title: 'MS Sans Serif reference files',
        url: 'https://github.com/tangrams/tangram-play/blob/master/public/data/fonts/ms-sans-serif/readme.txt',
        usage: 'Reference source for matching classic Windows desktop typography inside the shell.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'u-gamez',
    creator: 'U-Gamez',
    creatorUrl: 'https://u-gamez.itch.io',
    items: [
      {
        title: 'Error Boy Soundpack Volume 2',
        url: 'https://u-gamez.itch.io/error-boy-soundpack-volume-2',
        usage: 'Error, warning, and failure-state stingers for desktop and city interactions.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'v-ktor',
    creator: 'V-Ktor',
    creatorUrl: 'https://v-ktor.itch.io',
    items: [
      {
        title: '32x32 RPG Tilesets',
        url: 'https://v-ktor.itch.io/32x32-rpg-tilesets?download',
        usage: 'Extra interior pieces for shops, fixer offices, and learning-module rooms.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'v3x3d',
    creator: 'V3x3d',
    creatorUrl: 'https://v3x3d.itch.io',
    items: [
      {
        title: 'Retro Lines',
        url: 'https://v3x3d.itch.io/retro-lines',
        usage: 'Tower-defense and shell linework reference set for the retro OS presentation.',
        status: 'staged',
      },
    ],
  },
  {
    id: 'xacaleboo',
    creator: 'Xacaleboo',
    creatorUrl: 'https://xacaleboo.itch.io',
    items: [
      {
        title: 'Cyberpunk Icons',
        url: 'https://xacaleboo.itch.io/cyberpunk-icons',
        usage: '16x16 icon family that better matches the current Port Meridian art direction.',
        status: 'active',
      },
    ],
  },
];

const packCount = PORT_MERIDIAN_CREDIT_REGISTRY.reduce(
  (total, entry) => total + entry.items.length,
  0
);

const activePackCount = PORT_MERIDIAN_CREDIT_REGISTRY.reduce(
  (total, entry) => total + entry.items.filter((item) => item.status === 'active').length,
  0
);

export const PORT_MERIDIAN_CREDIT_SUMMARY = {
  activePackCount,
  creatorCount: PORT_MERIDIAN_CREDIT_REGISTRY.length,
  packCount,
  stagedPackCount: packCount - activePackCount,
};

export default PORT_MERIDIAN_CREDIT_REGISTRY;
