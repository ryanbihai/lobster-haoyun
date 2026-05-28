/**
 * Aha Moment template engine.
 * Generates personalized daily fortune by connecting solar term × personality × recent context.
 */
import { getLocalCalendar } from './local-calendar.js';

// ── Aha Moment 关联模板 ──
// key: season_term → associations (generic, no personality-specific)
const AHA_MAP = {
  '春_立春': '立春是"万物始生"的时节。那个想了很久的想法，今天是把它第一次写下来的好日子。',
  '春_惊蛰': '惊蛰的雷声唤醒冬眠的万物。从"想"转向"做"——那件你犹豫了很久的事，今天是开始的第一天。',
  '春_春分': '春分，昼夜平分。今天适合找一个平衡点——不是想得更深，而是想得"刚刚好"。',
  '夏_立夏': '立夏，万物长大。夏天的能量是生长——不需要完美，只需要开始。',
  '夏_小满': '小满是"小得盈满"的时节——麦子灌浆了，但还没熟。这很像你现在的状态：框架想清楚了，就差动手。小满之后是芒种——该收了。',
  '夏_芒种': '芒种，"有芒的麦子该收了"。你之前搭建的那个框架，现在是时候让大家看到它了。不是完美的版本——是第一个版本。',
  '夏_夏至': '夏至，最长的一天。今天可以把能量拉到最满——但记住，最长的一天之后，白天开始变短。今天火力全开，明天适度收回。',
  '秋_立秋': '立秋，从"长"转向"收"。有些仗不需要打，有些方向值得深耕。从冲刺模式切换到深耕模式。',
  '秋_秋分': '秋分之后，昼短夜长。这个时节适合"收敛"——从扩散的思考中收回来，聚焦到一个核心命题上。',
  '秋_白露': '白露，天气转凉。你温暖了很多人——白露提醒你：该问自己一句，"我暖到我自己了吗？"',
  '秋_霜降': '霜降，万物收藏。这个时节适合做年度复盘——不是自我批判，是清点这一年的"果实"和"种子"。',
  '冬_冬至': '冬至，一阳来复。最长的黑夜之后，光开始回来了。今天适合想一个简单的问题：接下来，只做哪一件事？',
};

/**
 * Generate Aha Moment text for daily fortune.
 * @param {object} calendarData - from local calendar or L1
 * @param {string} recentContext - user's recent activity summary (from CC analysis)
 */
export function generateAha(calendarData, recentContext = '') {
  const term = calendarData.solar_term?.name;
  const season = calendarData.season?.name || '';
  const phenology = calendarData.season_phenology || {};

  // Try exact match, then fallback to any entry for same season
  const key = `${season}_${term}`;
  let base = AHA_MAP[key];
  if (!base) {
    const seasonKey = Object.keys(AHA_MAP).find(k => k.startsWith(`${season}_`));
    if (seasonKey) base = AHA_MAP[seasonKey];
  }

  // Fallback: generic
  if (!base) {
    const seasonEmoji = calendarData.season?.emoji || '';
    base = `${seasonEmoji} 今天没有特别的节气关联，跟随自己的节奏就好。`;
  }

  let text = base;

  // Append phenology hint
  if (phenology.pentad) {
    text += `\n\n（今日物候：${phenology.pentad}）`;
  }

  // Append context if available
  if (recentContext) {
    text += `\n\n小龙虾知道，你最近在${recentContext}。`;
  }

  return text;
}

/**
 * Pick daily genre based on recent user behavior
 */
export function pickGenre(recentContext, history) {
  const entries = history?.week_entries || [];
  const recentDays = entries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return (now - d) / 86400000 < 3;
  }).length;

  if (recentDays >= 3) return '充电日'; // user has been active recently
  if (recentContext && (recentContext.includes('想') || recentContext.includes('规划') || recentContext.includes('设计'))) return '收网日';
  if (recentContext && (recentContext.includes('一个人') || recentContext.includes('独自'))) return '连接日';

  // Random weighted
  const genres = ['收网日', '收网日', '充电日', '充电日', '连接日'];
  return genres[Math.floor(Math.random() * genres.length)];
}

/**
 * Generate micro-action based on genre, label, and context
 */
export function generateMicroAction(genre, label, center) {
  const actions = {
    '收网日': [
      '把今天最让你焦虑的那件事，拆成 3 个小步骤。只做第一个。',
      '打开那个你搁置了很久的文件，只看一眼标题。然后关掉。就一眼。',
      '写三行——不是三页——就是三行。关于那个你想了很久但没动手的事。',
    ],
    '充电日': [
      '今天不输出。读一篇文章、听一期播客、或者什么也不做，发 10 分钟呆。',
      '找一件跟工作完全无关的事做一下——浇花、散步、泡杯茶慢慢喝。',
      '允许自己今天不"高效"。你的大脑在后台整理的时候，看起来像在偷懒。',
    ],
    '连接日': [
      '给一个很久没联系的人发一条消息。不用很长，一句"最近怎么样"就够了。',
      '今天跟一个人面对面说 10 分钟话。不是文字，不是语音，是面对面。',
      '找一个人聊聊你最近在想什么。不是汇报，就是说一说。',
    ],
  };

  const pool = actions[genre] || actions['充电日'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 每日修炼小提醒：3 条通用版（按体裁） ──
const CULTIVATION_TIPS = {
  '收网日': '你的想法已经够成熟了——今天把其中一件事变成行动，哪怕只是第一步。',
  '充电日': '今天不输出。读、听、看都行——你的能量需要在安静中重新蓄满。',
  '连接日': '你最近独立工作的时间不短了——今天跟一个人说说话，不需要目的。',
};

/**
 * Generate cultivation tip based on daily genre.
 * @param {string} genre — 收网日 | 充电日 | 连接日
 * @returns {string} cultivation tip
 */
export function generateCultivationTip(genre) {
  return CULTIVATION_TIPS[genre] || CULTIVATION_TIPS['充电日'];
}
