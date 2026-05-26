/**
 * 9-label personality library.
 * Used by the LLM as reference when matching user traits to labels.
 */
export const LABELS = {
  '布局者': {
    center: '思维',
    summary: '想清楚再动，系统思考，习惯把框架搭好才动手',
    clues: ['多发文档', '搭框架', '分批验证', '先规划后执行'],
    blindspots: ['习惯独自承担', '过度规划导致启动延迟'],
    growth: '从"想清楚全部再动" → "想清楚第一步就动"',
  },
  '观察者': {
    center: '思维',
    summary: '深度研究，知识驱动，喜欢把一个问题彻底搞懂',
    clues: ['大量阅读', '追问细节', '引用数据', '追求原理'],
    blindspots: ['过度研究迟迟不行动', '社交退缩太久'],
    growth: '设定研究时间上限，到期必须输出结论',
  },
  '策士': {
    center: '思维',
    summary: '善分析问题给出方案，习惯帮别人梳理逻辑',
    clues: ['被咨询', '帮人梳理逻辑', '善于给出建议'],
    blindspots: ['给别人出主意厉害，自己的事反而犹豫', '容易被咨询消耗'],
    growth: '把给别人建议的能力，用在给自己做决策上',
  },
  '点燃者': {
    center: '情感',
    summary: '热情感染他人，行动先于思考，能量感强',
    clues: ['高频表达情绪', '带动气氛', '行动先于思考'],
    blindspots: ['热情来得快去得也快', '容易被新鲜事物吸引'],
    growth: '选定一个核心项目，至少坚持三个月不换方向',
  },
  '连接者': {
    center: '情感',
    summary: '善于发现人与资源之间的连接，社交网络广',
    clues: ['经常引荐', '关注关系网', '帮人牵线搭桥'],
    blindspots: ['过度关注关系网忽略核心能力', '自己的需求不好意思提'],
    growth: '在维持关系之前，先确认自己的核心价值是什么',
  },
  '守护者': {
    center: '情感',
    summary: '稳定可靠，人们依靠的人，团队的锚点',
    clues: ['长期跟进', '在意他人感受', '不轻易改变', '照顾身边人'],
    blindspots: ['不会开口要——自己的需求永远排最后', '习惯性低估自己'],
    growth: '每天留30分钟给自己——守护者也值得被守护',
  },
  '破局者': {
    center: '本能',
    summary: '不满足现状，总想颠覆，追求变化和新方向',
    clues: ['挑战假设', '追求变化', '不满足现状'],
    blindspots: ['为颠覆而颠覆', '缺乏耐心'],
    growth: '在挑战现状之前，先花时间理解"现状为什么存在"',
  },
  '匠人': {
    center: '本能',
    summary: '深耕一个领域，追求极致，反复打磨',
    clues: ['反复打磨', '关注细节', '追求品质'],
    blindspots: ['过度追求完美迟迟不发', '视野限制在专业内'],
    growth: '设置"足够好"的标准，到了就发——完美是迭代出来的',
  },
  '统帅': {
    center: '本能',
    summary: '定方向、带人干，目标导向，敢于拍板',
    clues: ['目标导向', '敢于拍板', '关注结果'],
    blindspots: ['太快拍板跳过必要讨论', '忽略团队感受'],
    growth: '重大决策前强制听三个反对意见',
  },
};

/** Match traits to best label. Returns { label, confidence }. */
export function matchLabel(traits) {
  let best = null;
  let bestScore = 0;
  for (const [name, def] of Object.entries(LABELS)) {
    const score = traits.reduce((s, t) =>
      s + (def.clues.some(c => t.includes(c) || c.includes(t)) ? 1 : 0), 0
    );
    if (score > bestScore) { best = name; bestScore = score; }
  }
  return best ? { label: best, confidence: Math.min(1, bestScore / 3) } : null;
}

/** Get center for a label */
export function getCenter(label) {
  return LABELS[label]?.center || null;
}

export const CENTERS = {
  '思维': { drive: '需要确定性、理解世界', emoji: '🧠' },
  '情感': { drive: '需要被看见、建立连接', emoji: '💙' },
  '本能': { drive: '需要掌控、行动落地', emoji: '⚡' },
};
