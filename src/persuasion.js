/**
 * 7 persuasion technique templates.
 * Each function returns a string fragment for the fortune reading.
 */
export const techniques = {
  /** 1. Barnum — broad but deep-sounding opener */
  barnum: () => [
    '你偶尔会怀疑自己是否做出了正确的决定。',
    '你外表看起来从容，但有时会在意别人的看法。',
    '你有很强的学习能力，但也因此对自己要求很高。',
    '你习惯先观察再发言，不是那种急于表现自己的人。',
  ],

  /** 2. Evidence — judgment + specific proof. proof should come from user data. */
  evidence: (judgment, proof) => `${judgment}——${proof}。`,

  /** 3. Rainbow — main tendency + exception. Covers both sides. */
  rainbow: (main, exception) => `${main}——但如果有时候你也会${exception}，说明你内心有${exception}的一面。`,

  /** 4. Mirror — reuse user's own words */
  mirror: (userWords, insight) => `你描述过自己"${userWords}"——${insight}。`,

  /** 5. Process praise — praise specific behavior, not generic trait */
  processPraise: (behavior, quality) => `你能${behavior}，这份${quality}不是谁都有的。`,

  /** 6. Progressive — L1 known → L2 hinted → L3 blindspot */
  progressive: {
    l1: (known) => `你知道的：${known}。`,
    l2: (hinted) => `你可能隐约感觉到了：${hinted}。`,
    l3: (blindspot) => `你也许没意识到的是：${blindspot}。`,
  },

  /** 7. Constructive ending — actionable advice */
  constructiveEnding: (advice) => `> 你缺的不是${advice.thing}，是${advice.what}。`,
};

export default techniques;
