# iGEM Perfume Booth Agent

面向路演展台的 Next.js 香水 Agent。访客用一句话描述想要的情绪、场景或风格，系统会从展台已有香水原料中选择 3-5 种，生成可现场执行的试香卡，并收集评分反馈。

## 当前模型

线上当前使用：

```text
OPENAI_MODEL=deepseek-v4-flash
```

模型通过 OpenAI-compatible Chat Completions 接口调用，`OPENAI_BASE_URL` 和 `OPENAI_API_KEY` 配置在 Vercel 环境变量中。

## 核心功能

- 根据用户需求生成前调、中调、后调结构。
- 只使用 `data/ingredients.ts` 中的展台原料，不输出暂未排好的瓶身编号。
- 每次选择 3-5 种原料，比例总和必须为 100。
- 把配方比例转换成现场喷香步骤：每种原料喷 1 下，给出喷距和等待时间。
- 支持短轮对话和追问，不限制对话轮数。
- 用户问“为什么加某个原料/某个原料有什么用”时，只解释当前配方，不擅自换配方。
- 生成后收集 1-5 分评分和文字反馈。
- 生成记录和反馈持续写入 Neon Postgres。
- 后台可查看用户需求、AI 回复、配方、评分反馈，并下载 CSV。

## 专业化生成链路

生成链路被拆成几个内部模块，类似轻量 subagent 编排：

1. `lib/intentLlm.ts` + `lib/intent.ts`
   优先调用当前模型把用户自然语言解析成结构化意图，得到香气维度、场景、情绪、禁忌和约束；模型超时或不可用时，自动退回 `lib/intent.ts` 的本地规则解析。

2. `lib/materialSelector.ts`
   根据意图给展台原料打分，输出前调、中调、后调候选短名单和选材理由。

3. `lib/prompt.ts`
   把完整原料知识库和候选短名单交给模型，要求模型输出固定 JSON，并按“香气定位、选材逻辑、前中后调变化、现场操作建议、可调整方向”的专业结构回答。

4. `lib/llm.ts`
   调用 `deepseek-v4-flash`，解析 JSON 输出。

5. `lib/generator.ts`
   当模型超时、缺 key 或输出不合格时，使用同一套意图和选材结果生成本地兜底配方。

6. `lib/validation.ts`
   校验输出是否可用于展台：原料必须在库内、3-5 种、比例总和 100、步骤与配方一致、每种只喷 1 下、等待 10 秒、喷距匹配比例。

## 项目结构

```text
app/
  page.tsx                  展台主界面
  globals.css               全局样式、动态背景、快速选择滚动动画
  admin/feedback/page.tsx   反馈与生成记录后台页
  api/
    generate/route.ts       生成配方、解释追问、记录生成结果
    feedback/route.ts       评分反馈接口
    records/route.ts        记录查询与 CSV 下载接口

data/
  ingredients.ts            展台香水原料知识库
  styleTemplates.ts         风格示例数据

lib/
  explain.ts                “为什么/作用”类追问处理
  generator.ts              本地兜底配方生成器
  intent.ts                 用户意图分析模块
  intentLlm.ts              LLM 结构化意图解析模块，失败时退回 intent.ts
  materialSelector.ts       原料评分与候选短名单模块
  i18n.ts                   中英文界面文案
  llm.ts                    OpenAI-compatible Chat Completions 客户端
  prompt.ts                 调香 Agent 系统提示词
  records.ts                Neon Postgres / 本地 JSONL 记录层
  types.ts                  共享类型与输出清洗
  validation.ts             LLM 输出校验
```

## 环境变量

```text
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=deepseek-v4-flash
DATABASE_URL=
POSTGRES_URL=
```

数据库由 Vercel Neon 集成提供。首次写入或读取时，系统会自动创建 `booth_records` 表。

## 后台与下载

后台页面：

```text
https://perfume-booth-app.vercel.app/admin/feedback
```

JSON：

```text
https://perfume-booth-app.vercel.app/api/records
```

CSV 下载：

```text
https://perfume-booth-app.vercel.app/api/records?format=csv
```

后台目标是按每位体验者的 session 汇总查看：

- 用户需求
- AI 回复
- 完整配方
- 用户评分和文字反馈
- CSV 导出

## 本地运行

```powershell
npm install
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

打开：

```text
http://127.0.0.1:3000
```

## 部署

```powershell
npx vercel deploy --prod --yes
```

生产地址：

```text
https://perfume-booth-app.vercel.app
```

## 维护注意

- 暂时不要给 `data/ingredients.ts` 添加实体瓶身编号，展台瓶身排序还未最终确定。
- 修改中文文案后，运行乱码扫描，避免历史编码问题回归。
- 解释追问必须保留当前配方，避免用户问“为什么要加 X”时系统答非所问并重新生成。
- 首页仍以路演体验为主，不要做成复杂专业后台；专业性主要体现在选材逻辑、回复结构和后台数据记录。
