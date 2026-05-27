/**
 * Aha Moment template engine.
 * Generates personalized daily fortune by connecting solar term × personality × recent context.
 */
import { getLocalCalendar } from './local-calendar.js';

// ── Aha Moment 关联模板 ──
// key: season_term_center → associations
const AHA_MAP = {
  '春_立春_思维': '立春是"万物始生"的时节。对你这个{label}来说，立春的能量特别适合"破土"——不是大动作，是把那个想了很久的想法，第一次写下来。',
  '春_惊蛰_思维': '惊蛰的雷声唤醒冬眠的万物。{label}的能量在这个时节会从"想"转向"做"——那件你分析了很多遍的事，今天是开始的第一天。',
  '春_春分_思维': '春分，昼夜平分。{label}的思维模式容易走向极端分析，今天适合找一个平衡点——不是想得更深，而是想得"刚刚好"。',
  '夏_立夏_思维': '立夏，万物长大。{label}在这个时节容易陷入"再想想"的循环。但夏天的能量是生长——不需要完美，只需要开始。',
  '夏_小满_思维': '小满是"小得盈满"的时节——麦子灌浆了，但还没熟。{label}，这很像你现在的状态：框架想清楚了，就差动手。小满之后是芒种——该收了。',
  '夏_小满_情感': '小满，"小得盈满"。{label}，你已经照顾了太多人的感受。小满提醒你：给自己留一点空间，不是自私，是让杯子不满才有空间装新的。',
  '夏_小满_本能': '小满，麦子灌浆。{label}，你的行动力正要满——不是现在就冲，是再酝酿一下，芒种一到就动手。',
  '夏_芒种_思维': '芒种，"有芒的麦子该收了"。{label}，你之前搭建的那个框架，现在是时候让大家看到它了。不是完美的版本——是第一个版本。',
  '夏_芒种_情感': '芒种，收获的季节。{label}，你播下的那些关怀的种子，今天适合回头看一眼——它们都发芽了。',
  '夏_芒种_本能': '芒种，该动手了。{label}，不要等"完美的时机"——芒种就是最好的时机。',
  '夏_夏至_思维': '夏至，最长的一天。{label}的思维在今天可以拉到最满——但记住，最长的一天之后，白天开始变短。今天想透彻，明天开始做减法。',
  '秋_秋分_思维': '秋分之后，昼短夜长。{label}在这个时节适合"收敛"——从扩散的思考中收回来，聚焦到一个核心命题上。',
  '秋_霜降_思维': '霜降，万物收藏。{label}，这个时节适合做年度复盘——不是自我批判，是清点这一年的"果实"和"种子"。',
  '冬_冬至_思维': '冬至，一阳来复。最长的黑夜之后，光开始回来了。{label}，你脑子里的那盘大棋，冬至这一天适合想一个简单的问题：明年，我只做哪一件事？',

  '春_立春_情感': '立春是"心门初开"的时节。{label}，这个春天你适合做一件小事：把那个你在乎的人拉到一边，告诉他"我需要你帮我想想这个"。',
  '夏_小满_情感': '小满，"小得盈满"。{label}，你已经照顾了太多人的感受。小满提醒你：给自己留一点空间，不是自私，是让杯子不满才有空间装新的。',
  '秋_白露_情感': '白露，天气转凉。{label}，你的温暖是很多人的避风港。但白露提醒你：秋天了，该问自己一句——"我暖到我自己了吗？"',
  '冬_冬至_情感': '冬至，最冷的一天。{label}，你的本能是给别人取暖。今天换一个方向：允许别人暖你一次。就一次。',

  '春_惊蛰_本能': '惊蛰的雷声就是命令。{label}，不要等了——那个你已经决定的事，今天就动手。惊蛰不是用来纠结的，是用来"破土"的。',
  '夏_夏至_本能': '夏至，最长的一天。{label}的能量在今天可以拉到最满——但记住，最长的一天之后，白天开始变短。今天火力全开，明天适度收回。',
  '秋_立秋_本能': '立秋，从"长"转向"收"。{label}，你习惯了冲。立秋提醒你：有些仗不需要打，有些方向值得深耕。从冲刺模式切换到深耕模式。',
};

/**
 * Generate Aha Moment text for daily fortune.
 * @param {object} calendarData - from local calendar or L1
 * @param {string} label - personality label
 * @param {string} center - 思维/情感/本能
 * @param {string} recentContext - user's recent activity summary (from CC analysis)
 */
export function generateAha(calendarData, label, center, recentContext = '') {
  const term = calendarData.solar_term?.name;
  const season = calendarData.season?.name || '';
  const phenology = calendarData.season_phenology || {};

  // Try exact match
  const key = `${season}_${term}_${center}`;
  let base = AHA_MAP[key];

  // Fallback: season + center
  if (!base) {
    const seasonKeys = Object.keys(AHA_MAP).filter(k => k.startsWith(`${season}_`) && k.endsWith(`_${center}`));
    if (seasonKeys.length > 0) {
      base = AHA_MAP[seasonKeys[0]];
    }
  }

  // Fallback: generic
  if (!base) {
    const seasonEmoji = calendarData.season?.emoji || '';
    base = `${seasonEmoji} 今天没有特别的节气关联，但作为${label}，关注自己的节奏就好。`;
  }

  // Inject label
  let text = base.replace(/\{label\}/g, label);

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

// ── 每日修炼小提醒：9 人格 × 3 体裁日 = 27 条 ──
const CULTIVATION_TIPS = {
  '布局者': {
    '收网日': '你习惯搭完框架再动——今天先把框架放下，直接做第一件小事',
    '充电日': '你的脑子一直在跑——今天刻意让它空转 10 分钟，什么都别想',
    '连接日': '你习惯一个人想清楚再说——今天找一个人，在还没想清楚的时候就聊聊',
  },
  '观察者': {
    '收网日': '你习惯研究透了再出手——今天在 80% 把握时就行动，留 20% 给运气',
    '充电日': '你的大脑一直开在学习模式——今天允许自己"什么都不学"',
    '连接日': '你习惯观察别人——今天试一次：先表达自己，再听别人',
  },
  '策士': {
    '收网日': '你给别人出主意很厉害——今天把同一套方法用在自己身上，给自己下一个决定',
    '充电日': '你习惯了被需要的感觉——今天不需要帮任何人，只需要帮自己',
    '连接日': '你习惯帮别人梳理逻辑——今天找一个朋友，让他帮你梳理一次',
  },
  '点燃者': {
    '收网日': '你行动力强——今天把那股热情引导到一件需要长期坚持的事上',
    '充电日': '你的热情会自己燃烧——今天不需要加油，只需要维持小火苗',
    '连接日': '你擅长带动气氛——今天试一次：安静地坐着，让别人带动你',
  },
  '连接者': {
    '收网日': '你善于发现资源——今天把其中一条线索变成你自己的行动',
    '充电日': '你的社交能量需要平衡——今天不做"桥梁"，只做"自己"',
    '连接日': '你关心别人比关心自己多——今天做一次被关心的那个人',
  },
  '守护者': {
    '收网日': '你擅长照顾别人——今天把照顾别人的精力用在一件纯粹是自己的事上',
    '充电日': '你会等所有事做完才休息——今天先休息，事等会儿再做',
    '连接日': '你习惯了被依靠——今天试一次：依靠别人一次',
  },
  '破局者': {
    '收网日': '你想颠覆的东西太多——今天只选一个，只做一件事来推动它',
    '充电日': '你的大脑一直在找"更好的方案"——今天不找，享受现有的就够了',
    '连接日': '你挑战别人的假设——今天试一次：先真正理解他们的假设，明天再挑战',
  },
  '匠人': {
    '收网日': '你追求完美——今天设定一个"够好了"的截止线，到了就放手',
    '充电日': '你的坚持值得敬佩——今天刻意不做那个坚持的事，看看会发生什么',
    '连接日': '你习惯一个人精进——今天把你的手艺讲给一个完全不懂的人听',
  },
  '统帅': {
    '收网日': '你拍板快——今天在一个决定上刻意慢三拍，听听每个人的犹豫',
    '充电日': '你习惯了指挥——今天不做任何决策，做一个跟随者',
    '连接日': '你关注结果胜过过程——今天跟一个人聊聊"过程"，不聊结果',
  },
};

/**
 * Generate cultivation tip based on personality label and daily genre.
 * @param {string} label — 9 personality labels from labels.js
 * @param {string} genre — 收网日 | 充电日 | 连接日
 * @returns {string} cultivation tip
 */
export function generateCultivationTip(label, genre) {
  const labelTips = CULTIVATION_TIPS[label] || CULTIVATION_TIPS['观察者'];
  return labelTips[genre] || labelTips['充电日'];
}
