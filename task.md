# AI 你画我猜 - 开发任务清单

## 1. 项目初始化 (Initialization)

- [x] **环境搭建**
  - [x] 创建 Vue 3 + Vite 前端项目结构
  - [x] 创建 Express 后端项目结构
  - [x] 配置项目环境变量 (.env)
- [x] **Supabase 配置**
  - [x] 创建 Supabase 项目
  - [x] 配置 Database (执行 Migration 建表)
  - [x] 配置 Storage Bucket (用于存储画作)
  - [x] 配置 Auth (Email/Password 登录)

## 2. 数据库与后端基础 (Backend Foundation)

- [x] **数据库安全**
  - [x] 为所有表配置 RLS (Row Level Security) 策略
  - [x] 创建数据库触发器 (自动更新 updated_at, total_points)
- [x] **后端核心架构**
  - [x] 配置 Express 服务器与路由结构
  - [x] 集成 Supabase Client (Admin/Service Role)
  - [x] 实现基础 Auth 中间件 (验证用户身份)
  - [x] 编写通用错误处理机制

## 3. 核心功能 - 房间管理 (Room Management)

- [x] **后端 API**
  - [x] 实现 `POST /api/rooms/create` (创建房间)
  - [x] 实现 `POST /api/rooms/join` (加入房间)
  - [x] 实现 `GET /api/rooms/:id/members` (获取成员)
  - [ ] 实现超时房间清理定时任务 (Cron Job)
- [x] **前端开发**
  - [x] 开发登录/注册页面
  - [x] 开发游戏大厅 (Lobby) - 创建/加入入口
  - [x] 开发房间等待区 UI - 实时显示成员列表 (Supabase Realtime)

## 4. 核心功能 - 绘画与 AI (Drawing & AI)

- [x] **Canvas 画板**
  - [x] 封装 Canvas 组件 (支持画笔颜色、粗细、撤销、清空)
  - [x] 实现 Canvas 导出图片功能 (Blob/Base64)
- [x] **后端逻辑**
  - [x] 实现图片上传接口 (上传至 Supabase Storage)
  - [x] 集成 阿里云百炼千问大模型 API (Qwen-VL-Max)
  - [x] 实现 `POST /api/game/submit-drawing` (提交画作并触发 AI 识别)
  - [x] 优化 Prompt 模板，将识别结果转为提示词
- [x] **前端交互**
  - [x] 画手视角：画板操作与提交
  - [x] 猜词视角：实时同步画板/显示图片 (Realtime)
  - [x] 猜词视角：展示 AI 生成的提示词

## 5. 核心功能 - 猜词与积分 (Guessing & Scoring)

- [x] **后端逻辑**
  - [x] 实现 `POST /api/game/guess` (提交答案)
  - [x] 编写答案比对算法 (支持模糊匹配)
  - [x] 实现积分结算逻辑 (写入 point_records, 更新 profiles)
- [x] **前端交互**
  - [x] 开发猜词输入框与聊天区
  - [x] 实现答案正误反馈 (Toast/弹幕)
  - [x] 开发回合结算弹窗 (显示答案与本轮得分)

## 6. 用户与排行 (Profile & Ranking)

- [x] **后端 API**
  - [x] 实现 `GET /api/user/profile` (个人积分与历史) - *使用 Supabase SDK 替代*
  - [x] 实现 `GET /api/rankings` (全站排行榜) - *使用 Supabase SDK 替代*
- [x] **前端开发**
  - [x] 开发个人中心页面
  - [x] 开发全站排行榜页面 (Top 100)

## 7. 管理员后台 (Admin Dashboard)

- [x] **后端 API**
  - [x] 实现 `POST /api/admin/config/ai` (修改模型/阈值)
  - [x] 实现 `POST /api/admin/rules` (管理积分规则)
  - [x] 实现 `GET /api/admin/stats` (数据报表统计)
- [x] **前端开发**
  - [x] 开发管理员登录与鉴权 (Demo 入口)
  - [x] 开发系统配置面板 (AI 参数)
  - [x] 开发积分规则管理表格
  - [x] 开发数据仪表盘 (Charts/Stats)

## 9. 扩展功能 - 一笔画大挑战 (One-Stroke Challenge)

- [ ] **数据库与存储**
  - [ ] 创建一笔画题目表 (存储图片URL、答案名称)
  - [ ] 创建一笔画积分表/记录表 (存储玩家挑战记录)
  - [ ] 上传题目图片至 Supabase Storage
- [ ] **后端 API**
  - [ ] 实现 `GET /api/onestroke/question` (获取随机题目)
  - [ ] 实现 `POST /api/onestroke/submit` (提交画作，调用千问大模型裁判，计算得分)
  - [ ] 实现 `GET /api/onestroke/rankings` (一笔画段位榜)
- [ ] **前端开发**
  - [ ] 游戏大厅添加入口，支持单人直接进入
  - [ ] 开发一笔画挑战 UI (展示题目图片，限制一笔画笔逻辑)
  - [ ] 接入大模型裁判反馈动效 (答对/答错)
  - [ ] 开发一笔画段位排行榜页面

## 10. 测试与优化 (Testing & Optimization)

- [x] **测试**
  - [x] 单元测试 (关键业务逻辑)
  - [x] 集成测试 (完整游戏流程)
- [x] **优化**
  - [x] 移动端适配 (Responsive Design)
  - [x] AI 响应速度优化
  - [x] 部署上线

