# 今晚吃什么 · 产品设计与技术方案

面向年轻女性用户的“AI 美食&心情日记”。以温柔、引导式交互收集饮食与体征信息，结合营养学能力给出建议与推荐。

## 目标
- 帮助用户形成持续的饮食记录习惯，兼顾心情与体征
- 以温和引导+专业营养分析提供可采纳的下一餐推荐
- 建立结构化数据，便于周/月追踪与 AI 个性化

## 角色与基调
- 目标用户：20-35 岁、关注健康与身材、情绪敏感度高的女性
- AI 形象：动态彩色气泡，名为「泡泡」。语气温柔、陪伴、轻专业
- 主题：浅色系、柔和渐变，简洁留白

## 关键体验流
### 登录（暂用本地校验）
- 输入用户名/密码（001/001）→ 进入 Phase 1

### Phase 1：长期档案（首次必填，可后续补充）
- 基本项：性别、身高、体重、是否记录生理期、生日/年龄
- 可选项：体脂率、过敏/忌口、慢病、药物/补剂
- 未来补充：体温、围度、血压、血糖

### Phase 2：近期状态（每日/每次进入可更新）
- 状态：食欲、胃口异常（感冒/发烧/肠胃不适）、睡眠质量、精神/精力、运动量/类型、体重更新、备注
- 目标：减脂/增肌/维持
- Mood：当日心情（简单图标+词汇），支持备注

### 主页面：日记（按天）
- 顶部：日期选择器 + 今日心情快捷选择 + 体重更新入口
- 三餐卡片（早餐/午餐/晚餐，依据系统时间高亮当前/下一餐）
- 已过餐点：询问「吃了什么？」→ 记录为真实饮食数据
- 下一餐：泡泡给出 2-3 个推荐卡片（营养指数+推荐理由+快捷采纳）
- 支持切换日期查看历史

### 餐次记录（真实饮食数据 a 类）
- 用户输入：菜名/组合、份量、口味、烹饪方式、主要食材
- AI 追问补全：食材量级、油盐糖、加工度、饮品/酒、时间
- AI 生成：餐次标题、元信息标签（菜品类型/口味/含肉率/碳水率等）、营养卡片（热量、三大宏量、钠、纤维等）、建议卡片（基于 Phase 1/2 + 近 7 天平衡度的反馈）
- 采纳快捷：若用户采纳推荐餐次，则用推荐卡片预填，允许微调

### 推荐（b 类，下一餐/未来餐次）
- 输入：Phase 1/2、近 7 天饮食分布、用户偏好/忌口、心情
- 输出：2-3 条卡片（菜名/组合、营养指数、推荐理由、可能的替代）
- 交互：用户可以说「想吃甜的/想喝汤」→ 泡泡更新推荐

### 周/月追踪
- 维度：营养平衡度（餐次健康值）、心情趋势、体征趋势（体重等）
- 展示：简单折线/柱状 + 文字洞察；突出异常（高盐、高油、不足蛋白）

## 信息架构（页面/模块）
- Auth：本地表单（001/001）
- Onboarding：Phase 1、Phase 2
- Dashboard（日记）：日期切换、心情与体重快捷更新、三餐卡片、推荐卡片、历史查看
- 记录详情：餐次记录、追问对话、营养/建议卡片
- 追踪：周/月视图
- 设置/档案：补充长期档案，管理偏好/忌口

## 数据模型（D1 草案）
- users：id, username, password_hash (后续接 clerk), created_at
- profiles：user_id, gender, height_cm, weight_kg, body_fat_pct, birthday, period_tracking, allergies, diet_pref, chronic_conditions, supplements, updated_at
- daily_states：id, user_id, date, appetite, illness_flags, sleep_quality, energy_level, goal (lose/gain/maintain), workout_type, workout_level, weight_kg, mood, mood_note, note, created_at
- meals：id, user_id, date, slot (breakfast/lunch/dinner), title, source (user_input/recommendation/adopted_reco), created_at
- meal_items：id, meal_id, name, quantity, unit, cooking_method, taste, carb_ratio, fat_ratio, protein_ratio, is_meat, oil_level, salt_level, sugar_level, fiber_level, notes
- meal_nutrition：meal_id, kcal, protein_g, carb_g, fat_g, sodium_mg, fiber_g, sat_fat_g, sugar_g, score_health
- recommendations：id, user_id, date, slot, title, rationale, nutrition_score, macros_hint, accepted (bool), created_at
- weekly_monthly_metrics：id, user_id, period_type (week/month), period_start, health_score_avg, mood_trend, weight_delta, notes

## 交互与对话策略
- 语气：陪伴式、引导式，先肯定再建议
- 追问顺序：从易答到难（菜名→主食/蛋白→烹饪方式→油盐→饮品→分量）
- 解释透明：推荐理由始终基于用户档案/近期状态/近 7 天分布
- 安全提示：对生病/特殊状态（发烧、肠胃炎、生理期）给出温和提醒

## UI 方向
- 主题：浅色柔和渐变（如薄荷绿、蜜桃粉、浅杏），大留白，圆角
- 组件：卡片式布局；日期胶囊；心情选择器；推荐卡片含营养小标签
- 动效：泡泡轻微浮动/颜色渐变；卡片淡入/下滑
- 响应式：移动优先；桌面端保留左右留白并显示周视图摘要

## 技术架构
- 前端：Vite + React + TypeScript（已有）
- 部署：Cloudflare Pages
- 数据：Cloudflare D1（SQLite）+ Drizzle ORM（建议）或直接 SQL
- AI：调用 Gemini/DeepSeek；在客户端通过服务层调用 Cloudflare Workers Proxy（可选），避免暴露密钥
- Auth：阶段一本地校验 001/001；阶段二接入 Clerk

## API 草案（未来 Workers / Pages Functions）
- POST /auth/login （暂时本地模拟）
- GET/POST /profiles
- GET/POST /daily-states?date=
- GET/POST /meals?date=
- POST /meals/:id/items
- POST /meals/:id/nutrition (AI 计算后写回)
- GET/POST /recommendations?date=&slot=
- GET /metrics/weekly, /metrics/monthly

## 日志与指标
- 关键事件：完成 Phase1、完成 Phase2、记录餐次、采纳推荐、更新心情、更新体重
- 指标：7 日留存、日记完成率、追问完成率、推荐采纳率、健康值均衡度

## MVP 范围
- 本地登录 001/001
- Phase1/2 表单 + 本地持久化（先用 localStorage，后接 D1）
- 日记页三餐卡片 + 推荐卡片（假数据/简单规则） + 真实记录表单
- 心情与体重快捷更新
- 周视图摘要（静态计算）

## 迭代路线
1) 接 D1 + 简单规则引擎（基于宏量平衡 + 过往分布）
2) 引入 AI 追问与营养估算；推荐理由可解释
3) 周/月指标自动生成；异常提醒
4) 接 Clerk；多用户；分享/导出
5) 更细营养数据库联动，支持菜谱拆解与模糊匹配

## 风险与对策
- 营养估算误差高：用追问分段提问 + 标记可信度 + 允许用户微调
- 模糊菜名：先匹配常见菜库，再请求用户澄清
- 数据隐私：默认本地存储，接入云后需要隐私提示与最小化收集
- 流程过长导致流失：Phase1 必填最小集合，Phase2/追问可跳过并补全
