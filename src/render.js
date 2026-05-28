/**
 * Fortune reading Markdown format templates.
 * Used by the LLM as reference for rendering output.
 */

/** First-time deep reading format — tag hook + 5 dimensions + story + advice */
export const FIRST_READING = `
🦞 {user_name} · {season}命盘

小龙虾掐指一算——

**你的底色：{type_name}**

{type_explanation}

---

展开说说为什么——

**你怎么做事：{work_style}**

{work_evidence}

**你怎么说话：{comm_style}**

{comm_evidence}

**你关注什么：{focus_style}**

{focus_evidence}

**你从哪里获得能量：{energy_style}**

{energy_evidence}

**你怎么做判断：{affect_style}**

{affect_evidence}

---

**你的盲区**

{blindspot_detail}

📖 **今日微故事：{story_title}**

{story_block}

**建议**

{advice_paragraphs}

好了，算完了 🦞

每天早上七点半，小龙虾会告诉你今天适合做点什么小事。想试试的话，说一声就好。

{follow_up_prompts}
`;

/** Daily fortune format — story block is mandatory */
export const DAILY_FORTUNE = `
🦞 {user_name}，{date_display} · {solar_term_info}

{emotion_acknowledgment}

{aha_moment}

🧘 今日修炼：{cultivation_tip}

**今日微行动**：{micro_action}

📖 **今日微故事：{story_title}**

{story_block}

{discovery}

运势一句话：**{one_liner}**

{follow_up_prompts}
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

{follow_up_prompts}
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
