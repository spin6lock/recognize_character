# 识字打卡工具 - 开发计划

## 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端 | Python 3 + FastAPI | 轻量高效，自带 OpenAPI 文档 |
| 数据库 | SQLite | 单文件，零配置，适合单机部署 |
| 前端 | Vue 3 + Vite + Tailwind CSS | 响应式，移动端优先 |
| TTS | Web Speech API（浏览器原生） | 无需后端，直接调用系统 TTS 朗读汉字 |
| 音频存储 | 服务端本地文件夹 `/uploads/audio/` | 家长录音 WAV/WebM 文件 |
| 拼音补全 | `pypinyin` 库 | 自动为汉字补全拼音 |

---

## 目录结构

```
recognize_character/
├── backend/
│   ├── main.py              # FastAPI 入口，路由注册
│   ├── database.py          # SQLite 连接与初始化
│   ├── models.py            # SQLAlchemy ORM 模型
│   ├── schemas.py           # Pydantic 请求/响应模型
│   ├── routers/
│   │   ├── words.py         # 字库管理 API
│   │   ├── checkin.py       # 打卡记录 API
│   │   └── audio.py         # 提示录音 API
│   ├── uploads/
│   │   └── audio/           # 家长录音文件存储
│   ├── data.db              # SQLite 数据库文件
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/
│       │   └── index.js     # Vue Router 路由配置
│       ├── stores/
│       │   ├── word.js      # 字库状态（Pinia）
│       │   └── session.js   # 答题会话状态（Pinia）
│       ├── api/
│       │   └── index.js     # Axios 封装，统一请求
│       ├── components/
│       │   ├── ConfettiEffect.vue   # 撒花动画
│       │   ├── ProgressBar.vue      # 答题进度条
│       │   ├── AudioRecorder.vue    # 按住录音组件
│       │   └── CalendarView.vue     # 打卡日历
│       └── views/
│           ├── HomeView.vue         # 首页
│           ├── QuizView.vue         # 答题页
│           ├── ReviewView.vue       # 错题复习页
│           ├── CompleteView.vue     # 打卡完成页
│           ├── HistoryView.vue      # 历史记录页
│           └── AdminView.vue        # 后台管理页
└── Plan.md
```

---

## 数据库设计（SQLite）

```sql
-- 字库
CREATE TABLE word_library (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    character   TEXT NOT NULL,
    pinyin      TEXT NOT NULL,
    learn_date  TEXT,                    -- YYYY-MM-DD
    add_time    TEXT DEFAULT (datetime('now', 'localtime')),
    is_active   INTEGER DEFAULT 1        -- 1=正常 0=逻辑删除
);

-- 打卡记录
CREATE TABLE checkin_records (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_date    TEXT NOT NULL,       -- YYYY-MM-DD
    challenge_count INTEGER DEFAULT 0,
    correct_count   INTEGER DEFAULT 0,
    wrong_count     INTEGER DEFAULT 0,
    total_rounds    INTEGER DEFAULT 0,   -- 含错题复习轮数
    duration        INTEGER DEFAULT 0    -- 用时（秒）
);

-- 答题明细
CREATE TABLE answer_details (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id     INTEGER NOT NULL REFERENCES checkin_records(id),
    character     TEXT NOT NULL,
    is_correct    INTEGER DEFAULT 0,     -- 最终是否答对
    wrong_times   INTEGER DEFAULT 0,     -- 答错次数
    round_correct INTEGER DEFAULT 0      -- 第几轮答对（1=第一轮）
);

-- 提示录音
CREATE TABLE prompt_audio (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,           -- correct / wrong / complete
    audio_url   TEXT NOT NULL,
    create_time TEXT DEFAULT (datetime('now', 'localtime'))
);
```

---

## 后端 API 设计

### 字库管理 `/api/words`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/words` | 获取字库列表（支持搜索、筛选） |
| POST | `/api/words/batch` | 批量添加汉字（空格分隔，自动补全拼音） |
| PUT | `/api/words/{id}` | 修改学习日期 |
| DELETE | `/api/words/{id}` | 逻辑删除（is_active=0） |
| GET | `/api/words/random` | 随机抽取指定数量的字（用于答题） |

### 打卡记录 `/api/checkin`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/checkin` | 获取历史打卡记录列表 |
| POST | `/api/checkin` | 提交一次打卡记录（含答题明细） |
| GET | `/api/checkin/{id}` | 获取单次打卡详情（含答题明细） |
| GET | `/api/checkin/streak` | 获取连续打卡天数 + 今日是否已打卡 |

### 提示录音 `/api/audio`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/audio/{type}` | 获取某类录音列表（随机一条） |
| POST | `/api/audio/upload` | 上传录音文件（multipart/form-data） |
| DELETE | `/api/audio/{id}` | 删除某条录音 |

---

## 前端页面设计

### 首页 `HomeView.vue`
- 展示字库总数、连续打卡天数、今日是否已打卡
- 挑战字数选择：10 / 15 / 20 / 自定义（上限=字库总数）
- 大圆角「开始挑战」按钮
- 底部导航：首页 / 历史 / 管理

### 答题页 `QuizView.vue`
- 顶部：进度条 + 当前对错计数
- 中央：大号汉字展示（点击触发 Web Speech API 朗读）
- 底部：「✅ 认识」「❌ 不认识」两个大按钮
- 答对：撒花动画（`canvas-confetti`）+ 播放家长答对录音
- 答错：轻柔抖动动画 + 播放家长答错录音 + TTS 再读一遍

### 错题复习页 `ReviewView.vue`
- 展示本轮所有错题
- TTS 逐个朗读
- 再答一轮，循环直到全对或用户选择跳过

### 打卡完成页 `CompleteView.vue`
- 展示：挑战字数 / 一次通过数 / 练习后通过数 / 用时
- 播放家长完成录音
- 显示连续打卡天数（🔥 动画）
- 「查看历史」「再来一次」按钮

### 历史记录页 `HistoryView.vue`
- 日历视图（打卡日高亮）
- 列表：日期 / 挑战字数 / 正确率
- 点击展开：一次通过的字 / 练习后通过的字

### 后台管理页 `AdminView.vue`
- Tab 切换：字库管理 / 提示录音
- **字库管理**：批量输入框、字库列表（汉字/拼音/学习日期）、搜索筛选、编辑/删除
- **提示录音**：三类录音（答对/答错/完成），每类显示已录音频列表，`AudioRecorder.vue` 组件实现「按住录音 → 松开回放 → 确认/重录」

---

## 关键组件说明

### `AudioRecorder.vue` - 录音组件
```
状态机：idle → recording（按住）→ reviewing（松开回放）→ idle
- 使用 MediaRecorder API 录音
- 松开后自动回放
- 「确认保存」→ POST /api/audio/upload
- 「重新录制」→ 回到 idle
```

### `ConfettiEffect.vue` - 撒花动画
```
- 使用 canvas-confetti 库
- 答对时从屏幕顶部撒落彩色纸屑+星星
- 动画时长约 1.5 秒
```

### TTS 朗读（工具函数）
```javascript
// src/utils/tts.js
function speakCharacter(character) {
  const utterance = new SpeechSynthesisUtterance(character)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8   // 语速稍慢，适合儿童
  window.speechSynthesis.speak(utterance)
}
```

### 离线缓存策略
- 答题进度存入 `localStorage`（`session.js` Pinia store 持久化）
- 恢复网络后自动调用 `POST /api/checkin` 上传记录
- 字库数据每次进入首页自动拉取最新

---

## UI 风格规范

- **主色调**：橙色 `#FF8C00`，黄色 `#FFD700`，辅助白色/浅米色背景
- **字体**：`font-family: 'ZCOOL XiaoWei', 'Noto Sans SC', sans-serif`（Google Fonts 圆体）
- **按钮**：`border-radius: 9999px`，点击有 `scale(0.95)` 弹性动画
- **答对反馈**：绿色光晕 + 撒花
- **答错反馈**：橙色轻柔抖动，不出现红叉等负面图标
- **移动端优先**：基准字号 `18px`，汉字展示 `120px`，按钮高度 `64px`

---

## 开发阶段规划

### Phase 1 - 后端基础（预计 1 天）
- [ ] 初始化 FastAPI 项目，配置 SQLite + SQLAlchemy
- [ ] 实现数据库初始化脚本（建表）
- [ ] 实现字库 CRUD API（含 `pypinyin` 自动补全）
- [ ] 实现打卡记录提交与查询 API
- [ ] 实现录音文件上传与静态文件服务

### Phase 2 - 前端核心答题流程（预计 1.5 天）
- [ ] 初始化 Vue 3 + Vite + Tailwind CSS 项目
- [ ] 配置 Vue Router + Pinia
- [ ] 实现首页（字数选择、打卡状态展示）
- [ ] 实现答题页（TTS 朗读、答对/答错动画、进度条）
- [ ] 实现错题复习页
- [ ] 实现打卡完成页

### Phase 3 - 后台管理与录音（预计 1 天）
- [ ] 实现后台管理页（字库批量录入、搜索筛选）
- [ ] 实现 `AudioRecorder.vue` 录音组件
- [ ] 实现提示录音管理（上传、列表、删除）

### Phase 4 - 历史记录与收尾（预计 0.5 天）
- [ ] 实现历史记录页（日历视图 + 列表详情）
- [ ] 实现离线暂存 + 恢复上传逻辑
- [ ] 响应式适配调优（手机/平板/PC）
- [ ] 部署文档（`uvicorn` 启动后端，Nginx 托管前端静态文件）

---

## 依赖清单

### 后端 `requirements.txt`
```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
sqlalchemy>=2.0.0
pypinyin>=0.51.0
python-multipart>=0.0.9    # 文件上传支持
aiofiles>=23.0.0           # 异步文件写入
```

### 前端 `package.json` 关键依赖
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "canvas-confetti": "^1.9.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 部署方式

```
# 后端启动
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# 前端构建
cd frontend
npm install && npm run build
# dist/ 目录用 Nginx 托管，/api/* 反向代理到 :8000
```

> 局域网内家庭多设备访问：手机/平板直接浏览器打开服务器 IP 即可，无需安装 App。
