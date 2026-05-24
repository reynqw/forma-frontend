/**
 * FORMA — генератор ресурсов для каталога
 * Скачивает шрифты Google Fonts, создаёт SVG-иконки, иллюстрации, шаблоны и превью
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE = __dirname;

// ============================================================================
// Утилита загрузки файлов
// ============================================================================
function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { file.close(); reject(e); });
  });
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// ============================================================================
// ЦВЕТА FORMA
// ============================================================================
const C = {
  primary: '#6366f1',    // indigo-500
  primaryDark: '#4f46e5',
  primaryLight: '#a5b4fc',
  primaryBg: '#eef2ff',
  accent: '#f59e0b',     // amber
  dark: '#1e1b4b',
  text: '#334155',
  muted: '#94a3b8',
  white: '#ffffff',
  surface: '#f8fafc',
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  cyan: '#06b6d4',
};

// ============================================================================
// СОЗДАНИЕ ПРЕВЬЮ (SVG 800x600)
// ============================================================================
function previewSvg({ title, subtitle, bgColor, accentColor, iconContent, badge }) {
  const badgeHtml = badge
    ? `<rect x="580" y="20" width="200" height="36" rx="18" fill="${badge === 'FREE' ? C.green : C.accent}"/>
       <text x="680" y="44" text-anchor="middle" font-size="14" font-weight="700" fill="white">${badge}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgColor}"/>
      <stop offset="100%" stop-color="${accentColor}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="24" fill="url(#bg)"/>
  <!-- Decorative circles -->
  <circle cx="650" cy="100" r="120" fill="white" opacity="0.07"/>
  <circle cx="700" cy="450" r="80" fill="white" opacity="0.05"/>
  <circle cx="100" cy="500" r="60" fill="white" opacity="0.05"/>
  <!-- Icon area -->
  <g transform="translate(400,240)">${iconContent}</g>
  <!-- Title -->
  <text x="400" y="430" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="white">${title}</text>
  <text x="400" y="465" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="white" opacity="0.8">${subtitle}</text>
  <!-- Badge -->
  ${badgeHtml}
  <!-- FORMA watermark -->
  <text x="400" y="560" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="white" opacity="0.4">FORMA Platform</text>
</svg>`;
}

// ============================================================================
// 1. ШРИФТЫ
// ============================================================================
const FONTS = [
  {
    id: '01-roboto',
    name: 'Roboto',
    url: 'https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf',
    file: 'Roboto-Regular.ttf',
    price: 0,
    desc: 'Roboto — современный геометрический шрифт от Google. Идеально подходит для UI-дизайна, веб-приложений и мобильных интерфейсов. Поддерживает кириллицу и латиницу. Один из самых популярных шрифтов в мире.',
    family: 'Roboto', style: 'Regular', format: 'TTF',
    preview: { title: 'Roboto', subtitle: 'Sans-serif / Google Fonts / Кириллица', bgColor: '#1e3a5f', accentColor: '#2563eb', badge: 'FREE',
      icon: `<text x="0" y="0" text-anchor="middle" font-family="system-ui" font-size="80" font-weight="700" fill="white">Aa</text>
             <text x="0" y="50" text-anchor="middle" font-family="system-ui" font-size="18" fill="white" opacity="0.7">ABCDEFG abcdefg 0123456789</text>` }
  },
  {
    id: '02-montserrat',
    name: 'Montserrat',
    url: 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf',
    file: 'Montserrat-Regular.ttf',
    price: 0,
    desc: 'Montserrat — элегантный шрифт, вдохновлённый вывесками Буэнос-Айреса. Отлично подходит для заголовков, логотипов и навигации. Полная поддержка кириллицы. 18 начертаний.',
    family: 'Montserrat', style: 'Regular', format: 'TTF',
    preview: { title: 'Montserrat', subtitle: 'Sans-serif / Заголовки / 18 начертаний', bgColor: '#1a1a2e', accentColor: '#6366f1', badge: 'FREE',
      icon: `<text x="0" y="0" text-anchor="middle" font-family="system-ui" font-size="80" font-weight="600" fill="white">Mm</text>
             <text x="0" y="50" text-anchor="middle" font-family="system-ui" font-size="18" fill="white" opacity="0.7">Заголовки и навигация</text>` }
  },
  {
    id: '03-playfair-display',
    name: 'Playfair Display',
    url: 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf',
    file: 'PlayfairDisplay-Regular.ttf',
    price: 299,
    desc: 'Playfair Display — изысканный антиквенный шрифт с высоким контрастом штрихов. Создан для крупных заголовков, журнальной вёрстки и премиальных брендов. Поддержка кириллицы.',
    family: 'Playfair Display', style: 'Regular', format: 'TTF',
    preview: { title: 'Playfair Display', subtitle: 'Serif / Премиум / Журнальный стиль', bgColor: '#3c1053', accentColor: '#8b5cf6', badge: '299 ₽',
      icon: `<text x="0" y="0" text-anchor="middle" font-family="Georgia,serif" font-size="80" font-weight="700" fill="white">Pp</text>
             <text x="0" y="50" text-anchor="middle" font-family="system-ui" font-size="18" fill="white" opacity="0.7">Элегантный антиквенный шрифт</text>` }
  },
  {
    id: '04-nunito',
    name: 'Nunito',
    url: 'https://github.com/google/fonts/raw/main/ofl/nunito/static/Nunito-Regular.ttf',
    file: 'Nunito-Regular.ttf',
    price: 0,
    desc: 'Nunito — дружелюбный округлый шрифт с мягкими формами букв. Идеально подходит для образовательных проектов, детских приложений и креативных лендингов. Кириллица + латиница.',
    family: 'Nunito', style: 'Regular', format: 'TTF',
    preview: { title: 'Nunito', subtitle: 'Rounded Sans / Дружелюбный / Кириллица', bgColor: '#064e3b', accentColor: '#10b981', badge: 'FREE',
      icon: `<text x="0" y="0" text-anchor="middle" font-family="system-ui" font-size="80" font-weight="700" fill="white" letter-spacing="4">Nn</text>
             <text x="0" y="50" text-anchor="middle" font-family="system-ui" font-size="18" fill="white" opacity="0.7">Мягкие округлые формы</text>` }
  },
  {
    id: '05-raleway',
    name: 'Raleway',
    url: 'https://github.com/google/fonts/raw/main/ofl/raleway/static/Raleway-Regular.ttf',
    file: 'Raleway-Regular.ttf',
    price: 199,
    desc: 'Raleway — утончённый шрифт с тонкими элегантными линиями. Подходит для модных брендов, портфолио дизайнеров и минималистичных сайтов. 18 начертаний с поддержкой кириллицы.',
    family: 'Raleway', style: 'Regular', format: 'TTF',
    preview: { title: 'Raleway', subtitle: 'Thin Sans / Минимализм / 18 начертаний', bgColor: '#312e81', accentColor: '#a78bfa', badge: '199 ₽',
      icon: `<text x="0" y="0" text-anchor="middle" font-family="system-ui" font-size="80" font-weight="100" fill="white" letter-spacing="8">Rr</text>
             <text x="0" y="50" text-anchor="middle" font-family="system-ui" font-size="18" fill="white" opacity="0.7">Элегантный и минималистичный</text>` }
  },
  {
    id: '06-fira-code',
    name: 'Fira Code',
    url: 'https://github.com/google/fonts/raw/main/ofl/firacode/static/FiraCode-Regular.ttf',
    file: 'FiraCode-Regular.ttf',
    price: 0,
    desc: 'Fira Code — моноширинный шрифт с лигатурами для программирования. Поддерживает 100+ лигатур (=>, !==, <=), что делает код более читаемым. Идеален для IDE и терминалов.',
    family: 'Fira Code', style: 'Regular', format: 'TTF',
    preview: { title: 'Fira Code', subtitle: 'Monospace / Лигатуры / Для кода', bgColor: '#0f172a', accentColor: '#0ea5e9', badge: 'FREE',
      icon: `<text x="0" y="-10" text-anchor="middle" font-family="monospace" font-size="40" fill="#0ea5e9">{"=>"}</text>
             <text x="0" y="35" text-anchor="middle" font-family="monospace" font-size="22" fill="white" opacity="0.9">const x = () => {}</text>
             <text x="0" y="65" text-anchor="middle" font-family="system-ui" font-size="16" fill="white" opacity="0.6">100+ лигатур для разработчиков</text>` }
  },
];

// ============================================================================
// 2. ИКОНКИ (SVG)
// ============================================================================
function iconSvgPack(icons, size = 24) {
  let y = 0;
  const rows = [];
  for (let i = 0; i < icons.length; i += 6) {
    const row = icons.slice(i, i + 6);
    rows.push(row.map((icon, j) =>
      `<g transform="translate(${j * (size + 16) + 8}, ${y + 8})">${icon}</g>`
    ).join('\n'));
    y += size + 16;
  }
  const w = 6 * (size + 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${y + 16}" viewBox="0 0 ${w} ${y + 16}">
  <rect width="${w}" height="${y + 16}" fill="#f8fafc" rx="8"/>
  ${rows.join('\n')}
</svg>`;
}

// Common SVG icon paths (simplified Lucide-like)
const iconPaths = {
  home: `<path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  search: `<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  user: `<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" fill="none"/>`,
  heart: `<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  star: `<polygon points="12,2 15.1,8.3 22,9.2 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.2 8.9,8.3" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  settings: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.8 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 004.6 15" stroke="currentColor" stroke-width="2" fill="none"/>`,
  mail: `<rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bell: `<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  cart: `<circle cx="9" cy="21" r="1" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="20" cy="21" r="1" stroke="currentColor" stroke-width="2" fill="none"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  check: `<polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  trash: `<polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  edit: `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  download: `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  upload: `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>`,
  lock: `<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  image: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21,15 16,10 5,21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  // Social icons
  globe: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" stroke="currentColor" stroke-width="2" fill="none"/>`,
  share: `<circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2" fill="none"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" stroke="currentColor" stroke-width="2"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" stroke="currentColor" stroke-width="2"/>`,
  link: `<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.8 1.7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.8-1.7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  msgCircle: `<path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8A8.5 8.5 0 018.7 3.9a8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8 v.5z" stroke="currentColor" stroke-width="2" fill="none"/>`,
  thumbsUp: `<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.3a2 2 0 002-1.7l1.4-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  // Business icons
  briefcase: `<rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  chart: `<line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  dollar: `<line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  calendar: `<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>`,
  clock: `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  // Arrow/Nav icons
  arrowRight: `<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="12,5 19,12 12,19" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  arrowLeft: `<line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="12,19 5,12 12,5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronDown: `<polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronUp: `<polyline points="18,15 12,9 6,15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  menu: `<line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  x: `<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  externalLink: `<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  refresh: `<polyline points="23,4 23,10 17,10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 15.5A9 9 0 115.6 5.6L23 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  // Weather
  sun: `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  cloud: `<path d="M18 10h-1.3A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  droplet: `<path d="M12 2.7S5 9.7 5 14a7 7 0 0014 0c0-4.3-7-11.3-7-11.3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  wind: `<path d="M9.6 4.6A2 2 0 0111 4a2 2 0 010 4H2M12.6 19.4A2 2 0 0014 20a2 2 0 000-4H2M17.7 7.3A2.5 2.5 0 0119.5 7a2.5 2.5 0 010 5H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  thermometer: `<path d="M14 14.8V6a2 2 0 00-4 0v8.8a4 4 0 104 0zM12 18a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="2" fill="none"/>`,
  snowflake: `<line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="19.1" y1="4.9" x2="4.9" y2="19.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  // Ecommerce
  tag: `<path d="M20.6 11.4L12.4 3.2A2 2 0 0011 2.6H5a2 2 0 00-2 2v6a2 2 0 00.6 1.4l8.2 8.2a2 2 0 002.8 0l6-6a2 2 0 000-2.8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>`,
  creditCard: `<rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>`,
  truck: `<rect x="1" y="3" width="15" height="13" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="16,8 20,8 23,11 23,16 16,16 16,8" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/>`,
  gift: `<polyline points="20,12 20,22 4,22 4,12" stroke="currentColor" stroke-width="2" fill="none"/><rect x="2" y="7" width="20" height="5" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><path d="M12 7H7.5a2.5 2.5 0 010-5c2.5 0 4.5 5 4.5 5zM12 7h4.5a2.5 2.5 0 000-5C14 2 12 7 12 7z" stroke="currentColor" stroke-width="2" fill="none"/>`,
  percent: `<line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/>`,
  package: `<path d="M16.5 9.4l-9-5.2M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><polyline points="3.3,7 12,12 20.7,7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="12" y1="22" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>`,
};

const ICON_PACKS = [
  {
    id: '01-ui-basic',
    name: 'UI Basic Icons',
    price: 0,
    desc: 'Базовый набор из 18 иконок для интерфейсов: дом, поиск, пользователь, сердце, звезда, настройки, почта, колокольчик, корзина, галочка, плюс, удаление, редактирование, скачивание, загрузка, глаз, замок, изображение. SVG формат, 24x24px.',
    icons: ['home','search','user','heart','star','settings','mail','bell','cart','check','plus','trash','edit','download','upload','eye','lock','image'],
    preview: { title: 'UI Basic Icons', subtitle: '18 иконок / SVG / 24x24px', bgColor: '#1e40af', accentColor: '#3b82f6', badge: 'FREE' }
  },
  {
    id: '02-social-media',
    name: 'Social Media Icons',
    price: 149,
    desc: 'Набор иконок для социальных сетей и коммуникаций: глобус, поделиться, ссылка, сообщение, лайк, почта. Идеальны для блогов, лендингов и контактных страниц. SVG формат.',
    icons: ['globe','share','link','msgCircle','thumbsUp','mail','heart','user','bell','eye','externalLink','search'],
    preview: { title: 'Social Media Icons', subtitle: '12 иконок / SVG / Соцсети', bgColor: '#7c3aed', accentColor: '#a78bfa', badge: '149 ₽' }
  },
  {
    id: '03-business',
    name: 'Business Icons',
    price: 249,
    desc: 'Профессиональный набор бизнес-иконок: портфель, график, доллар, календарь, часы, настройки, почта, пользователь, замок, поиск, скачивание, редактирование. Для корпоративных сайтов и приложений.',
    icons: ['briefcase','chart','dollar','calendar','clock','settings','mail','user','lock','search','download','edit'],
    preview: { title: 'Business Icons', subtitle: '12 иконок / SVG / Бизнес', bgColor: '#0f766e', accentColor: '#14b8a6', badge: '249 ₽' }
  },
  {
    id: '04-arrows-nav',
    name: 'Arrows & Navigation',
    price: 0,
    desc: 'Набор стрелок и навигационных иконок: стрелки, шевроны, меню, крестик, внешняя ссылка, обновление. Незаменимы для навигации, кнопок и элементов управления. SVG 24x24px.',
    icons: ['arrowRight','arrowLeft','chevronDown','chevronUp','menu','x','externalLink','refresh','search','home','plus','download'],
    preview: { title: 'Arrows & Navigation', subtitle: '12 иконок / SVG / Навигация', bgColor: '#1e293b', accentColor: '#475569', badge: 'FREE' }
  },
  {
    id: '05-weather',
    name: 'Weather Icons',
    price: 199,
    desc: 'Набор погодных иконок: солнце, облако, капля, ветер, термометр, снежинка. Для погодных виджетов, приложений прогноза и метео-сервисов. SVG формат, линейный стиль.',
    icons: ['sun','cloud','droplet','wind','thermometer','snowflake','eye','star','globe','clock','bell','heart'],
    preview: { title: 'Weather Icons', subtitle: '12 иконок / SVG / Погода', bgColor: '#0c4a6e', accentColor: '#0284c7', badge: '199 ₽' }
  },
  {
    id: '06-ecommerce',
    name: 'E-commerce Icons',
    price: 179,
    desc: 'Набор иконок для интернет-магазинов: тег, кредитная карта, грузовик, подарок, процент, посылка, корзина, сердце, звезда, поиск, пользователь, настройки. SVG формат.',
    icons: ['tag','creditCard','truck','gift','percent','package','cart','heart','star','search','user','settings'],
    preview: { title: 'E-commerce Icons', subtitle: '12 иконок / SVG / Магазин', bgColor: '#7c2d12', accentColor: '#ea580c', badge: '179 ₽' }
  },
];

// ============================================================================
// 3. ИЛЛЮСТРАЦИИ (SVG)
// ============================================================================
function makeIllustration(name, colors, shapes) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="${colors.bg}" rx="12"/>
  ${shapes}
</svg>`;
}

const ILLUSTRATIONS = [
  {
    id: '01-remote-work', name: 'Remote Work', price: 0,
    desc: 'Векторная иллюстрация на тему удалённой работы. Рабочее место с ноутбуком, растение и облачные элементы. Идеальна для лендингов, блогов и презентаций о фрилансе и удалёнке.',
    svg: makeIllustration('remote', { bg: '#eef2ff' }, `
      <!-- Desk -->
      <rect x="150" y="220" width="300" height="10" rx="4" fill="#6366f1" opacity="0.2"/>
      <rect x="170" y="130" width="260" height="90" rx="8" fill="#6366f1"/>
      <rect x="178" y="138" width="244" height="68" rx="4" fill="#312e81"/>
      <!-- Screen content -->
      <rect x="195" y="150" width="80" height="8" rx="2" fill="#818cf8"/>
      <rect x="195" y="165" width="120" height="6" rx="2" fill="#818cf8" opacity="0.5"/>
      <rect x="195" y="178" width="90" height="6" rx="2" fill="#818cf8" opacity="0.3"/>
      <rect x="340" y="148" width="65" height="50" rx="4" fill="#a5b4fc" opacity="0.3"/>
      <!-- Keyboard -->
      <rect x="220" y="230" width="160" height="10" rx="3" fill="#c7d2fe"/>
      <!-- Coffee cup -->
      <rect x="430" y="200" width="30" height="25" rx="4" fill="#fbbf24"/>
      <rect x="460" y="207" width="12" height="10" rx="5" fill="none" stroke="#fbbf24" stroke-width="3"/>
      <path d="M435 195 Q445 185 455 195" stroke="#94a3b8" stroke-width="2" fill="none"/>
      <!-- Plant -->
      <rect x="115" y="195" width="25" height="30" rx="4" fill="#a78bfa"/>
      <circle cx="128" cy="185" r="18" fill="#34d399"/>
      <circle cx="118" cy="175" r="12" fill="#10b981"/>
      <!-- Person shape (abstract) -->
      <circle cx="300" cy="290" r="25" fill="#818cf8"/>
      <rect x="275" y="315" width="50" height="50" rx="10" fill="#6366f1"/>
      <!-- Cloud elements -->
      <ellipse cx="100" cy="80" rx="40" ry="20" fill="#c7d2fe" opacity="0.5"/>
      <ellipse cx="500" cy="60" rx="50" ry="22" fill="#c7d2fe" opacity="0.5"/>
      <ellipse cx="480" cy="120" rx="25" ry="12" fill="#c7d2fe" opacity="0.3"/>
    `),
    preview: { title: 'Remote Work', subtitle: 'Векторная иллюстрация / SVG / Удалёнка', bgColor: '#312e81', accentColor: '#6366f1', badge: 'FREE' }
  },
  {
    id: '02-business-team', name: 'Business Team', price: 399,
    desc: 'Иллюстрация командной работы в бизнесе. Абстрактные фигуры людей с диаграммами и графиками роста. Подходит для корпоративных сайтов, HR-порталов и бизнес-презентаций.',
    svg: makeIllustration('team', { bg: '#f0fdf4' }, `
      <!-- Growth chart -->
      <rect x="200" y="100" width="200" height="180" rx="8" fill="white" stroke="#e2e8f0" stroke-width="1"/>
      <polyline points="220,250 260,220 300,200 340,170 380,140" stroke="#10b981" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="260" cy="220" r="4" fill="#10b981"/><circle cx="300" cy="200" r="4" fill="#10b981"/>
      <circle cx="340" cy="170" r="4" fill="#10b981"/><circle cx="380" cy="140" r="4" fill="#10b981"/>
      <!-- Person 1 -->
      <circle cx="140" cy="250" r="22" fill="#6366f1"/><rect x="118" y="275" width="44" height="50" rx="8" fill="#818cf8"/>
      <!-- Person 2 -->
      <circle cx="300" cy="310" r="22" fill="#f59e0b"/><rect x="278" y="335" width="44" height="40" rx="8" fill="#fbbf24"/>
      <!-- Person 3 -->
      <circle cx="460" cy="250" r="22" fill="#ec4899"/><rect x="438" y="275" width="44" height="50" rx="8" fill="#f472b6"/>
      <!-- Decorative -->
      <circle cx="500" cy="80" r="30" fill="#bbf7d0" opacity="0.5"/>
      <rect x="80" y="150" width="40" height="40" rx="8" fill="#c7d2fe" opacity="0.4"/>
    `),
    preview: { title: 'Business Team', subtitle: 'Векторная иллюстрация / SVG / Команда', bgColor: '#064e3b', accentColor: '#10b981', badge: '399 ₽' }
  },
  {
    id: '03-creative-design', name: 'Creative Design', price: 0,
    desc: 'Яркая иллюстрация на тему креативного дизайна. Палитра, кисть, геометрические фигуры и абстрактные формы. Для портфолио дизайнеров, креативных агентств и студий.',
    svg: makeIllustration('creative', { bg: '#fdf4ff' }, `
      <!-- Palette -->
      <circle cx="300" cy="180" r="100" fill="#f0abfc" opacity="0.3"/>
      <circle cx="260" cy="150" r="20" fill="#ec4899"/><circle cx="310" cy="130" r="20" fill="#8b5cf6"/>
      <circle cx="350" cy="160" r="20" fill="#3b82f6"/><circle cx="340" cy="210" r="20" fill="#10b981"/>
      <circle cx="280" cy="220" r="20" fill="#f59e0b"/><circle cx="240" cy="190" r="20" fill="#ef4444"/>
      <!-- Brush -->
      <rect x="380" y="100" width="12" height="80" rx="4" fill="#a78bfa" transform="rotate(30,386,140)"/>
      <rect x="376" y="95" width="20" height="20" rx="6" fill="#7c3aed" transform="rotate(30,386,105)"/>
      <!-- Stars -->
      <polygon points="120,100 123,110 133,110 125,116 128,126 120,120 112,126 115,116 107,110 117,110" fill="#fbbf24"/>
      <polygon points="480,80 482,86 488,86 483,90 485,96 480,92 475,96 477,90 472,86 478,86" fill="#fbbf24"/>
      <!-- Geometric shapes -->
      <rect x="100" y="250" width="50" height="50" rx="4" fill="#c084fc" opacity="0.4" transform="rotate(15,125,275)"/>
      <circle cx="480" cy="280" r="30" fill="#93c5fd" opacity="0.4"/>
      <polygon points="450,330 470,370 430,370" fill="#a78bfa" opacity="0.4"/>
      <!-- Abstract lines -->
      <path d="M80 320 Q200 280 300 340 T520 300" stroke="#d946ef" stroke-width="3" fill="none" opacity="0.3"/>
    `),
    preview: { title: 'Creative Design', subtitle: 'Векторная иллюстрация / SVG / Дизайн', bgColor: '#701a75', accentColor: '#d946ef', badge: 'FREE' }
  },
  {
    id: '04-tech-innovation', name: 'Tech Innovation', price: 499,
    desc: 'Технологическая иллюстрация с элементами инноваций: процессор, микросхема, связи, абстрактные формы. Для IT-компаний, стартапов и технологических продуктов.',
    svg: makeIllustration('tech', { bg: '#f0f9ff' }, `
      <!-- Central chip -->
      <rect x="230" y="130" width="140" height="140" rx="12" fill="#0ea5e9"/>
      <rect x="245" y="145" width="110" height="110" rx="6" fill="#0c4a6e"/>
      <!-- Circuit lines -->
      <line x1="300" y1="130" x2="300" y2="80" stroke="#0ea5e9" stroke-width="2"/><circle cx="300" cy="75" r="5" fill="#0ea5e9"/>
      <line x1="300" y1="270" x2="300" y2="320" stroke="#0ea5e9" stroke-width="2"/><circle cx="300" cy="325" r="5" fill="#0ea5e9"/>
      <line x1="230" y1="200" x2="180" y2="200" stroke="#0ea5e9" stroke-width="2"/><circle cx="175" cy="200" r="5" fill="#0ea5e9"/>
      <line x1="370" y1="200" x2="420" y2="200" stroke="#0ea5e9" stroke-width="2"/><circle cx="425" cy="200" r="5" fill="#0ea5e9"/>
      <!-- Inner chip detail -->
      <rect x="270" y="170" width="60" height="60" rx="4" fill="#38bdf8" opacity="0.3"/>
      <text x="300" y="208" text-anchor="middle" font-family="monospace" font-size="18" fill="#7dd3fc">AI</text>
      <!-- Floating elements -->
      <circle cx="130" cy="100" r="25" fill="#bae6fd" opacity="0.4"/>
      <circle cx="470" cy="300" r="20" fill="#bae6fd" opacity="0.4"/>
      <rect x="450" y="80" width="40" height="40" rx="8" fill="#7dd3fc" opacity="0.3"/>
      <!-- Connection lines -->
      <line x1="175" y1="200" x2="130" y2="130" stroke="#bae6fd" stroke-width="1" stroke-dasharray="4"/>
      <line x1="425" y1="200" x2="470" y2="300" stroke="#bae6fd" stroke-width="1" stroke-dasharray="4"/>
    `),
    preview: { title: 'Tech Innovation', subtitle: 'Векторная иллюстрация / SVG / Технологии', bgColor: '#0c4a6e', accentColor: '#0ea5e9', badge: '499 ₽' }
  },
  {
    id: '05-education', name: 'Education', price: 299,
    desc: 'Образовательная иллюстрация с книгами, лампочкой-идеей и академическими элементами. Для образовательных платформ, онлайн-курсов и учебных материалов.',
    svg: makeIllustration('education', { bg: '#fffbeb' }, `
      <!-- Book stack -->
      <rect x="200" y="220" width="200" height="25" rx="4" fill="#6366f1"/><rect x="210" y="195" width="180" height="25" rx="4" fill="#8b5cf6"/>
      <rect x="220" y="170" width="160" height="25" rx="4" fill="#a78bfa"/>
      <!-- Open book -->
      <path d="M250 280 Q300 260 350 280 L350 340 Q300 320 250 340 Z" fill="white" stroke="#e2e8f0" stroke-width="1"/>
      <path d="M350 280 Q400 260 450 280 L450 340 Q400 320 350 340 Z" fill="white" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="270" y1="295" x2="330" y2="295" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="270" y1="305" x2="320" y2="305" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="270" y1="315" x2="335" y2="315" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="370" y1="295" x2="430" y2="295" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="370" y1="305" x2="420" y2="305" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Light bulb -->
      <circle cx="300" cy="100" r="40" fill="#fbbf24" opacity="0.2"/>
      <circle cx="300" cy="100" r="25" fill="#fbbf24"/>
      <rect x="292" y="125" width="16" height="12" rx="3" fill="#f59e0b"/>
      <!-- Rays -->
      <line x1="300" y1="50" x2="300" y2="40" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
      <line x1="340" y1="65" x2="348" y2="57" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
      <line x1="260" y1="65" x2="252" y2="57" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
      <line x1="350" y1="100" x2="360" y2="100" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
      <line x1="250" y1="100" x2="240" y2="100" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
      <!-- Graduation cap -->
      <polygon points="130,140 170,120 210,140 170,160" fill="#1e293b"/>
      <line x1="170" y1="140" x2="170" y2="175" stroke="#1e293b" stroke-width="2"/>
      <path d="M145 145 L145 165 Q170 180 195 165 L195 145" fill="none" stroke="#1e293b" stroke-width="2"/>
    `),
    preview: { title: 'Education', subtitle: 'Векторная иллюстрация / SVG / Образование', bgColor: '#78350f', accentColor: '#f59e0b', badge: '299 ₽' }
  },
  {
    id: '06-data-analytics', name: 'Data Analytics', price: 0,
    desc: 'Аналитическая иллюстрация с диаграммами, графиками и дашбордом. Для маркетинговых отчётов, аналитических платформ и бизнес-дашбордов. Минималистичный стиль.',
    svg: makeIllustration('analytics', { bg: '#ecfdf5' }, `
      <!-- Dashboard frame -->
      <rect x="100" y="60" width="400" height="280" rx="12" fill="white" stroke="#e2e8f0" stroke-width="1"/>
      <rect x="100" y="60" width="400" height="35" rx="12" fill="#f1f5f9"/>
      <rect x="100" y="83" width="400" height="12" fill="#f1f5f9"/>
      <circle cx="120" cy="78" r="5" fill="#ef4444"/><circle cx="138" cy="78" r="5" fill="#fbbf24"/><circle cx="156" cy="78" r="5" fill="#10b981"/>
      <!-- Bar chart -->
      <rect x="130" y="220" width="30" height="90" rx="4" fill="#6366f1" opacity="0.3"/>
      <rect x="170" y="180" width="30" height="130" rx="4" fill="#6366f1" opacity="0.5"/>
      <rect x="210" y="200" width="30" height="110" rx="4" fill="#6366f1" opacity="0.4"/>
      <rect x="250" y="150" width="30" height="160" rx="4" fill="#6366f1" opacity="0.7"/>
      <rect x="290" y="170" width="30" height="140" rx="4" fill="#6366f1" opacity="0.6"/>
      <rect x="330" y="130" width="30" height="180" rx="4" fill="#6366f1"/>
      <!-- Line chart overlay -->
      <polyline points="145,210 185,170 225,190 265,140 305,160 345,120" stroke="#10b981" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Pie chart -->
      <circle cx="430" cy="170" r="35" fill="#e2e8f0"/>
      <path d="M430 135 A35 35 0 0 1 460 190 L430 170 Z" fill="#6366f1"/>
      <path d="M460 190 A35 35 0 0 1 410 198 L430 170 Z" fill="#10b981"/>
      <!-- KPI boxes -->
      <rect x="395" y="220" width="80" height="35" rx="6" fill="#f0fdf4" stroke="#d1fae5" stroke-width="1"/>
      <text x="435" y="242" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="700" fill="#10b981">+24%</text>
      <rect x="395" y="265" width="80" height="35" rx="6" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1"/>
      <text x="435" y="287" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="700" fill="#6366f1">1.2k</text>
    `),
    preview: { title: 'Data Analytics', subtitle: 'Векторная иллюстрация / SVG / Аналитика', bgColor: '#065f46', accentColor: '#34d399', badge: 'FREE' }
  },
];

// ============================================================================
// 4. ШАБЛОНЫ (HTML)
// ============================================================================
const TEMPLATES = [
  {
    id: '01-landing-page', name: 'Landing Page Template', price: 599,
    desc: 'Современный HTML-шаблон лендинга с адаптивным дизайном. Включает hero-секцию, блок преимуществ, секцию отзывов и форму обратной связи. Tailwind CSS. Готов к продакшену.',
    preview: { title: 'Landing Page', subtitle: 'HTML + Tailwind / Адаптивный / Лендинг', bgColor: '#4c1d95', accentColor: '#7c3aed', badge: '599 ₽' },
    html: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing Template</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#1e293b}
.hero{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:80px 20px;text-align:center}
.hero h1{font-size:3rem;margin-bottom:16px}.hero p{font-size:1.2rem;opacity:.8;max-width:600px;margin:0 auto 32px}
.btn{display:inline-block;padding:14px 32px;background:#fff;color:#6366f1;border-radius:8px;font-weight:700;text-decoration:none}
.features{max-width:1000px;margin:60px auto;padding:0 20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.feature{padding:24px;border-radius:12px;border:1px solid #e2e8f0}.feature h3{margin-bottom:8px}
.cta{background:#f8fafc;padding:60px 20px;text-align:center}.cta h2{font-size:2rem;margin-bottom:12px}
footer{padding:32px 20px;text-align:center;color:#64748b;font-size:.9rem}</style></head>
<body><section class="hero"><h1>Your Product Name</h1><p>Modern landing page template built with clean HTML and CSS.</p><a href="#" class="btn">Get Started</a></section>
<section class="features"><div class="feature"><h3>Fast</h3><p>Lightning-fast loading times with optimized code.</p></div>
<div class="feature"><h3>Responsive</h3><p>Works perfectly on all screen sizes.</p></div>
<div class="feature"><h3>Modern</h3><p>Clean, modern design following latest trends.</p></div></section>
<section class="cta"><h2>Ready to start?</h2><p>Join thousands of happy customers today.</p></section>
<footer>&copy; 2025 FORMA Template</footer></body></html>`
  },
  {
    id: '02-business-card', name: 'Business Card Template', price: 0,
    desc: 'Минималистичный шаблон визитной карточки в HTML/CSS. Двусторонний дизайн с логотипом, контактными данными и QR-кодом. Легко кастомизируется. Печать 90x50мм.',
    preview: { title: 'Business Card', subtitle: 'HTML + CSS / Минимализм / Визитка', bgColor: '#1e293b', accentColor: '#475569', badge: 'FREE' },
    html: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Business Card</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#f1f5f9;display:flex;justify-content:center;align-items:center;min-height:100vh;gap:40px;flex-wrap:wrap;padding:40px}
.card{width:360px;height:200px;border-radius:12px;padding:30px;position:relative;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.front{background:linear-gradient(135deg,#1e293b,#334155);color:#fff}.front h1{font-size:1.6rem;margin-bottom:4px}
.front .title{font-size:.85rem;opacity:.7;margin-bottom:24px}.front .info{font-size:.8rem;opacity:.8;line-height:1.8}
.front .logo{position:absolute;top:24px;right:24px;width:40px;height:40px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem}
.back{background:#fff;color:#1e293b;display:flex;flex-direction:column;align-items:center;justify-content:center}
.back h2{font-size:1.4rem;color:#6366f1;margin-bottom:8px}.back p{font-size:.85rem;color:#64748b}</style></head>
<body><div class="card front"><div class="logo">F</div><h1>Ivan Petrov</h1><div class="title">UI/UX Designer</div>
<div class="info">+7 (999) 123-45-67<br>ivan@design.studio<br>design.studio</div></div>
<div class="card back"><h2>FORMA</h2><p>Design Resources Platform</p></div></body></html>`
  },
  {
    id: '03-presentation', name: 'Presentation Template', price: 399,
    desc: 'HTML-шаблон презентации с 5 слайдами. Минималистичный дизайн с градиентами, анимациями перехода. Подходит для стартап-питчей, отчётов и конференций.',
    preview: { title: 'Presentation', subtitle: 'HTML / 5 слайдов / Питч-дек', bgColor: '#831843', accentColor: '#ec4899', badge: '399 ₽' },
    html: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Presentation</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;overflow:hidden;height:100vh}
.slide{width:100vw;height:100vh;display:none;align-items:center;justify-content:center;flex-direction:column;padding:60px;text-align:center}
.slide.active{display:flex}.slide h1{font-size:3.5rem;margin-bottom:16px}.slide p{font-size:1.3rem;opacity:.8;max-width:700px}
.s1{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
.s2{background:#f8fafc;color:#1e293b}.s3{background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#fff}
.s4{background:#1e293b;color:#fff}.s5{background:linear-gradient(135deg,#ec4899,#f43f5e);color:#fff}
nav{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}
nav button{width:12px;height:12px;border-radius:50%;border:2px solid rgba(99,102,241,.5);background:transparent;cursor:pointer}
nav button.active{background:#6366f1;border-color:#6366f1}</style></head>
<body><div class="slide s1 active"><h1>Your Startup</h1><p>One-line pitch that captures your vision</p></div>
<div class="slide s2"><h1>Problem</h1><p>Define the problem you're solving</p></div>
<div class="slide s3"><h1>Solution</h1><p>How your product solves it</p></div>
<div class="slide s4"><h1>Traction</h1><p>1,000+ users in first month</p></div>
<div class="slide s5"><h1>Join Us</h1><p>contact@startup.com</p></div>
<nav></nav>
<script>const slides=document.querySelectorAll('.slide'),nav=document.querySelector('nav');let cur=0;
slides.forEach((_,i)=>{const b=document.createElement('button');if(i===0)b.classList.add('active');b.onclick=()=>go(i);nav.appendChild(b)});
function go(i){slides[cur].classList.remove('active');nav.children[cur].classList.remove('active');cur=i;slides[cur].classList.add('active');nav.children[cur].classList.add('active')}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&cur<slides.length-1)go(cur+1);if(e.key==='ArrowLeft'&&cur>0)go(cur-1)})</script></body></html>`
  },
  {
    id: '04-portfolio', name: 'Portfolio Template', price: 499,
    desc: 'Элегантный шаблон портфолио дизайнера. Сетка проектов с hover-эффектами, секция «О себе», контактная форма. Адаптивный, готов к кастомизации. HTML + CSS.',
    preview: { title: 'Portfolio', subtitle: 'HTML + CSS / Галерея / Адаптивный', bgColor: '#1e1b4b', accentColor: '#6366f1', badge: '499 ₽' },
    html: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#1e293b}
header{padding:60px 20px;text-align:center;background:#1e1b4b;color:#fff}header h1{font-size:2.5rem;margin-bottom:8px}
header p{opacity:.7;font-size:1.1rem}
.grid{max-width:1000px;margin:40px auto;padding:0 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.item{aspect-ratio:4/3;border-radius:12px;overflow:hidden;position:relative;cursor:pointer}
.item .bg{width:100%;height:100%;transition:transform .3s}.item:hover .bg{transform:scale(1.05)}
.item .overlay{position:absolute;inset:0;background:rgba(30,27,75,.7);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}
.item:hover .overlay{opacity:1}.item .overlay span{color:#fff;font-size:1.2rem;font-weight:600}
.about{max-width:700px;margin:60px auto;padding:0 20px;text-align:center;line-height:1.8}
footer{padding:32px;text-align:center;color:#64748b;font-size:.9rem}</style></head>
<body><header><h1>Anna Designer</h1><p>UI/UX & Visual Design</p></header>
<div class="grid"><div class="item"><div class="bg" style="background:linear-gradient(135deg,#6366f1,#a78bfa)"></div><div class="overlay"><span>Project One</span></div></div>
<div class="item"><div class="bg" style="background:linear-gradient(135deg,#ec4899,#f472b6)"></div><div class="overlay"><span>Project Two</span></div></div>
<div class="item"><div class="bg" style="background:linear-gradient(135deg,#0ea5e9,#38bdf8)"></div><div class="overlay"><span>Project Three</span></div></div>
<div class="item"><div class="bg" style="background:linear-gradient(135deg,#10b981,#34d399)"></div><div class="overlay"><span>Project Four</span></div></div>
<div class="item"><div class="bg" style="background:linear-gradient(135deg,#f59e0b,#fbbf24)"></div><div class="overlay"><span>Project Five</span></div></div>
<div class="item"><div class="bg" style="background:linear-gradient(135deg,#ef4444,#f87171)"></div><div class="overlay"><span>Project Six</span></div></div></div>
<div class="about"><h2>About Me</h2><p>I'm a passionate designer with 5+ years of experience creating beautiful digital experiences.</p></div>
<footer>&copy; 2025 Portfolio Template by FORMA</footer></body></html>`
  },
  {
    id: '05-email-newsletter', name: 'Email Newsletter', price: 299,
    desc: 'Готовый шаблон email-рассылки. Совместим с Gmail, Outlook, Apple Mail. Адаптивная верстка на таблицах. Включает шапку, блок новостей, CTA-кнопку и подвал.',
    preview: { title: 'Email Newsletter', subtitle: 'HTML / Email / Адаптивный', bgColor: '#7c2d12', accentColor: '#f97316', badge: '299 ₽' },
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05)">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;color:#fff">
<h1 style="margin:0 0 8px;font-size:28px">FORMA Weekly</h1><p style="margin:0;opacity:.8">New resources this week</p></td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 12px;color:#1e293b">Featured Resource</h2>
<p style="color:#64748b;line-height:1.6;margin:0 0 24px">Check out our latest collection of premium design resources.</p>
<table cellpadding="0" cellspacing="0"><tr><td style="background:#6366f1;border-radius:8px;padding:14px 28px">
<a href="#" style="color:#fff;text-decoration:none;font-weight:700;font-size:15px">View Collection</a></td></tr></table>
</td></tr>
<tr><td style="padding:0 32px 32px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">
<p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">FORMA Platform &bull; Unsubscribe</p></td></tr>
</table></td></tr></table></body></html>`
  },
  {
    id: '06-resume', name: 'Resume / CV Template', price: 0,
    desc: 'Чистый минималистичный шаблон резюме (CV). Двухколоночный дизайн, секции опыта, навыков и образования. HTML + CSS, легко кастомизируется. Подходит для печати формата A4.',
    preview: { title: 'Resume / CV', subtitle: 'HTML + CSS / Минимализм / A4 печать', bgColor: '#374151', accentColor: '#6b7280', badge: 'FREE' },
    html: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Resume</title>
<style>@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;color:#1e293b;max-width:800px;margin:0 auto;display:grid;grid-template-columns:260px 1fr;min-height:100vh}
.sidebar{background:#1e293b;color:#fff;padding:40px 24px}.sidebar h1{font-size:1.8rem;margin-bottom:4px}
.sidebar .title{opacity:.7;margin-bottom:32px;font-size:.95rem}.sidebar h3{font-size:.85rem;text-transform:uppercase;letter-spacing:1px;opacity:.5;margin-bottom:12px;margin-top:24px}
.sidebar p,.sidebar li{font-size:.9rem;line-height:1.7;opacity:.85}
.sidebar ul{list-style:none}.sidebar li::before{content:"—  ";opacity:.4}
.skill{display:flex;align-items:center;gap:8px;margin-bottom:8px}.skill span{font-size:.85rem;flex:1}
.bar{height:6px;background:rgba(255,255,255,.2);border-radius:3px;flex:2}.bar div{height:100%;background:#6366f1;border-radius:3px}
main{padding:40px 32px}main h2{font-size:1.1rem;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
.entry{margin-bottom:20px}.entry h3{font-size:1rem;margin-bottom:2px}.entry .meta{font-size:.85rem;color:#64748b;margin-bottom:6px}
.entry p{font-size:.9rem;line-height:1.6;color:#475569}
main h2+.entry{margin-top:0}section+section{margin-top:28px}</style></head>
<body><aside class="sidebar"><h1>Ivan Petrov</h1><div class="title">Frontend Developer</div>
<h3>Contact</h3><p>ivan@email.com<br>+7 (999) 123-4567<br>Moscow, Russia</p>
<h3>Skills</h3><div class="skill"><span>React</span><div class="bar"><div style="width:90%"></div></div></div>
<div class="skill"><span>TypeScript</span><div class="bar"><div style="width:85%"></div></div></div>
<div class="skill"><span>CSS</span><div class="bar"><div style="width:95%"></div></div></div>
<div class="skill"><span>Node.js</span><div class="bar"><div style="width:70%"></div></div></div>
<h3>Languages</h3><ul><li>Russian (Native)</li><li>English (B2)</li></ul></aside>
<main><section><h2>Experience</h2>
<div class="entry"><h3>Senior Frontend Developer</h3><div class="meta">Tech Corp &bull; 2022 — Present</div><p>Led UI development for the main product. Improved performance by 40%.</p></div>
<div class="entry"><h3>Frontend Developer</h3><div class="meta">StartupXYZ &bull; 2020 — 2022</div><p>Built React components, integrated REST APIs, mentored juniors.</p></div></section>
<section><h2>Education</h2>
<div class="entry"><h3>B.Sc. Computer Science</h3><div class="meta">Moscow State University &bull; 2016 — 2020</div></div></section></main></body></html>`
  },
];

// ============================================================================
// MAIN: Generate everything
// ============================================================================
async function main() {
  console.log('=== FORMA Resource Generator ===\n');

  // 1. Download fonts
  console.log('1. Downloading fonts from Google Fonts...');
  for (const font of FONTS) {
    const dir = path.join(BASE, 'fonts', font.id);
    const dest = path.join(dir, font.file);
    if (fs.existsSync(dest)) {
      console.log(`   [skip] ${font.name} already exists`);
    } else {
      try {
        await download(font.url, dest);
        console.log(`   [ok]   ${font.name} -> ${font.file}`);
      } catch (e) {
        console.log(`   [FAIL] ${font.name}: ${e.message}`);
      }
    }
    // Preview
    const prev = previewSvg({
      title: font.preview.title,
      subtitle: font.preview.subtitle,
      bgColor: font.preview.bgColor,
      accentColor: font.preview.accentColor,
      iconContent: font.preview.icon,
      badge: font.preview.badge,
    });
    write(path.join(dir, 'preview.svg'), prev);
  }

  // 2. Create icon packs
  console.log('\n2. Creating icon packs...');
  for (const pack of ICON_PACKS) {
    const dir = path.join(BASE, 'icons', pack.id);
    // Individual SVG icons in a single file
    const iconsSvg = pack.icons.map(name => {
      const p = iconPaths[name] || iconPaths.star;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="color:#334155">${p}</svg>`;
    }).join('\n');

    // Create a combined SVG sheet
    const cols = 6;
    const cellSize = 48;
    const rows = Math.ceil(pack.icons.length / cols);
    let sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols*cellSize}" height="${rows*cellSize}" viewBox="0 0 ${cols*cellSize} ${rows*cellSize}">
  <rect width="${cols*cellSize}" height="${rows*cellSize}" fill="#f8fafc" rx="8"/>`;
    pack.icons.forEach((name, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const p = iconPaths[name] || iconPaths.star;
      sheet += `\n  <g transform="translate(${col*cellSize+12},${row*cellSize+12})" style="color:#334155">${p}</g>`;
    });
    sheet += '\n</svg>';
    write(path.join(dir, `${pack.id}.svg`), sheet);

    // Preview
    const iconPreviewContent = pack.icons.slice(0, 6).map((name, i) => {
      const p = iconPaths[name] || iconPaths.star;
      const x = (i - 2.5) * 50;
      return `<g transform="translate(${x},-30)" style="color:white">${p}</g>`;
    }).join('\n');
    const prev = previewSvg({
      title: pack.preview.title,
      subtitle: pack.preview.subtitle,
      bgColor: pack.preview.bgColor,
      accentColor: pack.preview.accentColor,
      iconContent: iconPreviewContent,
      badge: pack.preview.badge,
    });
    write(path.join(dir, 'preview.svg'), prev);
    console.log(`   [ok]   ${pack.name} (${pack.icons.length} icons)`);
  }

  // 3. Create illustrations
  console.log('\n3. Creating illustrations...');
  for (const illust of ILLUSTRATIONS) {
    const dir = path.join(BASE, 'illustrations', illust.id);
    write(path.join(dir, `${illust.id}.svg`), illust.svg);

    const prev = previewSvg({
      title: illust.preview.title,
      subtitle: illust.preview.subtitle,
      bgColor: illust.preview.bgColor,
      accentColor: illust.preview.accentColor,
      iconContent: `<rect x="-50" y="-40" width="100" height="80" rx="8" fill="white" opacity="0.15"/>
        <text x="0" y="5" text-anchor="middle" font-family="system-ui" font-size="36" fill="white">SVG</text>`,
      badge: illust.preview.badge,
    });
    write(path.join(dir, 'preview.svg'), prev);
    console.log(`   [ok]   ${illust.name}`);
  }

  // 4. Create templates
  console.log('\n4. Creating HTML templates...');
  for (const tmpl of TEMPLATES) {
    const dir = path.join(BASE, 'templates', tmpl.id);
    write(path.join(dir, `${tmpl.id}.html`), tmpl.html);

    const prev = previewSvg({
      title: tmpl.preview.title,
      subtitle: tmpl.preview.subtitle,
      bgColor: tmpl.preview.bgColor,
      accentColor: tmpl.preview.accentColor,
      iconContent: `<rect x="-60" y="-40" width="120" height="80" rx="6" fill="white" opacity="0.15"/>
        <text x="0" y="-10" text-anchor="middle" font-family="monospace" font-size="16" fill="white" opacity="0.9">&lt;html&gt;</text>
        <text x="0" y="15" text-anchor="middle" font-family="monospace" font-size="14" fill="white" opacity="0.6">&lt;/html&gt;</text>`,
      badge: tmpl.preview.badge,
    });
    write(path.join(dir, 'preview.svg'), prev);
    console.log(`   [ok]   ${tmpl.name}`);
  }

  // 5. Generate instructions file
  console.log('\n5. Generating upload instructions...');
  let instructions = `# FORMA — Инструкция по загрузке ресурсов\n\n`;
  instructions += `## Порядок загрузки\n\n`;
  instructions += `1. Откройте http://localhost:5173/become-author и подайте заявку на статус автора\n`;
  instructions += `2. В базе данных обновите статус: UPDATE authors SET verification_status='VERIFIED' WHERE id=1;\n`;
  instructions += `3. Перелогиньтесь (выйти и войти снова)\n`;
  instructions += `4. Перейдите на http://localhost:5173/resources/upload\n`;
  instructions += `5. Для каждого ресурса ниже заполните форму\n\n`;
  instructions += `---\n\n`;

  // Fonts
  instructions += `## ШРИФТЫ (typeId = 1)\n\n`;
  FONTS.forEach((f, i) => {
    instructions += `### ${i+1}. ${f.name}\n`;
    instructions += `- **Файл:** fonts/${f.id}/${f.file}\n`;
    instructions += `- **Превью:** fonts/${f.id}/preview.svg\n`;
    instructions += `- **Цена:** ${f.price === 0 ? 'Бесплатно (0)' : f.price + ' ₽'}\n`;
    instructions += `- **Лицензия:** SIL Open Font License (id=2)\n`;
    instructions += `- **Описание:** ${f.desc}\n`;
    instructions += `- **Семейство:** ${f.family} | Стиль: ${f.style} | Формат: ${f.format}\n\n`;
  });

  // Icons
  instructions += `## ИКОНКИ (typeId = 2)\n\n`;
  ICON_PACKS.forEach((p, i) => {
    instructions += `### ${i+1}. ${p.name}\n`;
    instructions += `- **Файл:** icons/${p.id}/${p.id}.svg\n`;
    instructions += `- **Превью:** icons/${p.id}/preview.svg\n`;
    instructions += `- **Цена:** ${p.price === 0 ? 'Бесплатно (0)' : p.price + ' ₽'}\n`;
    instructions += `- **Лицензия:** Creative Commons (id=1)\n`;
    instructions += `- **Описание:** ${p.desc}\n\n`;
  });

  // Illustrations
  instructions += `## ИЛЛЮСТРАЦИИ (typeId = 3)\n\n`;
  ILLUSTRATIONS.forEach((ill, i) => {
    instructions += `### ${i+1}. ${ill.name}\n`;
    instructions += `- **Файл:** illustrations/${ill.id}/${ill.id}.svg\n`;
    instructions += `- **Превью:** illustrations/${ill.id}/preview.svg\n`;
    instructions += `- **Цена:** ${ill.price === 0 ? 'Бесплатно (0)' : ill.price + ' ₽'}\n`;
    instructions += `- **Лицензия:** Creative Commons (id=1)\n`;
    instructions += `- **Описание:** ${ill.desc}\n\n`;
  });

  // Templates
  instructions += `## ШАБЛОНЫ (typeId = 4)\n\n`;
  TEMPLATES.forEach((t, i) => {
    instructions += `### ${i+1}. ${t.name}\n`;
    instructions += `- **Файл:** templates/${t.id}/${t.id}.html\n`;
    instructions += `- **Превью:** templates/${t.id}/preview.svg\n`;
    instructions += `- **Цена:** ${t.price === 0 ? 'Бесплатно (0)' : t.price + ' ₽'}\n`;
    instructions += `- **Лицензия:** Коммерческая лицензия FORMA (id=3)\n`;
    instructions += `- **Описание:** ${t.desc}\n\n`;
  });

  write(path.join(BASE, 'INSTRUCTIONS.md'), instructions);

  console.log('\n=== Done! ===');
  console.log(`Total: ${FONTS.length} fonts, ${ICON_PACKS.length} icon packs, ${ILLUSTRATIONS.length} illustrations, ${TEMPLATES.length} templates`);
  console.log(`Files saved to: ${BASE}`);
  console.log(`\nOpen INSTRUCTIONS.md for upload guide`);
}

main().catch(console.error);
