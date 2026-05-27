/**
 * Fortune reading Markdown format templates.
 * Used by the LLM as reference for rendering output.
 */

/** First-time deep reading format */
export const FIRST_READING = `
🔮 {user_name} · {season}命盘

小龙虾掐指一算——

**你的底色：{label}**

{evidence_paragraphs}

**你内心深处**

{inner_drive}

**你的盲区：{blindspot_title}**

{blindspot_detail}

**你的能量模式：{energy_title}**

{energy_detail}

**给{user_name}的建议**

{advice_paragraphs}

好了，算完了。你给打个分——哪几条说对了，哪几条你觉得"小龙虾还是不够了解我"？
`;

/** Daily fortune format */
export const DAILY_FORTUNE = `
🦞 {user_name}，{date_display} · {solar_term_info}

{aha_moment}

{energy_hint}

{cultivation_tip}

**今日微行动**：{micro_action}

{discovery}

运势一句话：**{one_liner}**
`;

/** Weekly review format */
export const WEEKLY_REVIEW = `
🦞 {user_name}，{date_display} · 本周回望

{week_summary}

**人格洞察更新**

{personality_update}

**今日运势**

{today_fortune}

运势一句话：**{one_liner}**
`;

/** Fortune genre choices for daily */
export const DAILY_GENRES = {
  '收网日': {
    condition: '用户近期大量思考/规划',
    message: '该把想法变成行动了',
  },
  '充电日': {
    condition: '用户近期高强度输出后',
    message: '今天不需要做决定，只需要吸收',
  },
  '连接日': {
    condition: '用户近期独自工作较多',
    message: '今天适合跟一个人聊聊',
  },
};
