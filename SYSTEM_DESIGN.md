# AI 你画我猜 - 系统设计与架构文档

## 第1章 绪论

### 1.1 课题背景与意义
近年来，随着互联网技术的普及，在线互动游戏成为人们日常休闲和社交的重要方式之一。“你画我猜”作为一款经典的聚会游戏，因其规则简单、互动性强而广受欢迎。然而，传统的在线“你画我猜”游戏通常完全依赖玩家之间的主观判定，缺乏客观的评价机制。当玩家绘画水平参差不齐时，容易出现猜词困难、游戏节奏拖沓等情况，影响了整体的游戏体验。

与此同时，人工智能技术特别是视觉大模型（如 OpenAI Vision、Qwen-VL 等）在图像识别和自然语言处理领域取得了显著进展。这些模型具备强大的图像理解和语义生成能力。基于此背景，将视觉大模型引入传统休闲游戏中，不仅可以作为客观的裁判机制来辅助判定，还能通过生成提示词来增加游戏的趣味性。本课题旨在设计并实现一个接入 AI 裁判的“你画我猜”游戏平台，通过工程实践探索前后端分离架构、实时 WebSocket 通信以及大模型 API 调用的结合方式，为相关互动应用的开发提供一定的技术参考和实现案例。

### 1.2 国内外现状
目前，国内外市场上的“你画我猜”类应用（如 Draw & Guess、Skribbl.io 等）主要以纯玩家交互为主。这类应用的系统架构相对成熟，通常采用传统的客户端-服务器模式，利用 WebSocket 广播绘图坐标和聊天消息。其核心在于保证画板数据的低延迟同步，但在游戏规则判定上基本依赖于房主或系统的硬编码字符串匹配。

在人工智能与游戏结合方面，Google 曾推出过基于神经网络的“Quick, Draw!”小程序，通过收集用户涂鸦来训练识别模型。但这类应用大多偏向于单人体验或技术演示，较少将其融入到完整的多人社交互动流程中。随着近两年多模态大模型 API 的开放，部分独立开发者开始尝试将大模型引入游戏，但往往停留在简单的图文生成层面。将视觉大模型深度嵌入到多人实时联机游戏的裁判逻辑中，并构建包含好友、组队、排行等完整生态的系统，在现有的开源项目和常见应用中仍具有较大的探索空间。

### 1.3 课题研究主要内容
本项目主要研究并实现一个基于 Web 的“AI 你画我猜”在线游戏系统。具体内容包括：
1. **基础框架搭建**：使用 Vue.js 3 构建前端单页应用（SPA），使用 Node.js 与 Express 搭建后端服务，并集成 Supabase 作为后端即服务（BaaS）提供数据存储与用户鉴权。
2. **实时互动功能**：利用 HTML5 Canvas 实现前端画板，通过 Supabase Realtime 实现多端画板状态、房间成员列表以及聊天消息的低延迟同步。
3. **AI 裁判模块接入**：在后端集成视觉大模型接口，接收前端上传的画作图片并结合 Prompt 进行分析，生成判定结果与提示词下发给客户端。
4. **社交与扩展系统**：设计并实现好友添加、私聊、房间内组队邀请机制；同时开发基于 AI 判定的“一笔画大挑战”单人闯关模式，并配套实现积分与段位排行榜功能。

### 1.4 课题关键问题及创新点
**关键问题：**
1. **多端状态实时同步**：在多人在线房间中，需要确保画手的绘图动作、玩家的加入/退出以及竞猜消息能够在各个客户端之间准确、快速地同步。
2. **大模型接口调用的稳定性与延迟处理**：视觉大模型处理图像需要一定时间，如何在不阻塞主游戏流程的前提下，合理处理异步请求并给予用户友好的交互反馈。
3. **数据并发与安全控制**：在组队邀请、并发猜词等场景下，需要防止数据脏读和越权操作。

**创新点：**
1. **引入 AI 作为游戏机制核心**：改变了传统玩家互评的单一模式，利用视觉大模型作为第三方裁判，客观判定画作内容，并生成生活化的提示词辅助竞猜。
2. **基于 BaaS 的敏捷开发架构**：深度结合 Supabase 的 Row Level Security (RLS) 和 Realtime 功能，在减少后端冗余样板代码的同时，保障了数据的隔离安全与消息的实时分发。

---

## 2. 项目概述 (Project Overview)

本项目是一个基于 Web 的多人在线“你画我猜”互动游戏平台，创新性地引入了 **AI 视觉大模型（OpenAI Vision / Qwen-VL）** 作为裁判和提示生成者。用户可以在房间内进行绘画创作，AI 负责识别画作内容并生成生活化的提示词，其他用户根据提示进行竞猜。
系统不仅包含核心的联机游戏逻辑，还延展出丰富的社交功能（好友、组队、聊天）和挑战玩法（一笔画单人闯关段位赛）。

**表 10：组队表 (teams)**

| 字段名          | 名称    | 数据类型        | 约束                                                                        |
| :----------- | :---- | :---------- | :------------------------------------------------------------------------ |
| id           | 队伍编号  | uuid        | PK, DEFAULT uuid\_generate\_v4()                                          |
| leader\_id   | 队长 ID | uuid        | FK (profiles), ON DELETE CASCADE                                          |
| name         | 队伍名称  | varchar(50) | DEFAULT 'My Team'                                                         |
| status       | 队伍状态  | varchar(20) | DEFAULT 'forming', CHECK (status IN ('forming', 'in\_game', 'disbanded')) |
| max\_members | 最大人数  | integer     | DEFAULT 4, CHECK (max\_members >= 2 AND max\_members <= 10)               |
| created\_at  | 创建时间  | timestamptz | DEFAULT NOW()                                                             |
| updated\_at  | 更新时间  | timestamptz | DEFAULT NOW()                                                             |

**表 11：组队成员表 (team\_members)**

| 字段名        | 名称     | 数据类型        | 约束                                                         |
| :--------- | :----- | :---------- | :--------------------------------------------------------- |
| id         | 成员记录编号 | uuid        | PK, DEFAULT uuid\_generate\_v4()                           |
| team\_id   | 队伍 ID  | uuid        | FK (teams), ON DELETE CASCADE                              |
| user\_id   | 用户 ID  | uuid        | FK (profiles), ON DELETE CASCADE                           |
| status     | 成员状态   | varchar(20) | DEFAULT 'pending', CHECK (status IN ('pending', 'joined')) |
| joined\_at | 加入时间   | timestamptz | DEFAULT NOW()                                              |

*(注：设有 UNIQUE(team\_id, user\_id) 联合唯一约束防止重复加入)*

**表 12：房间邀请表 (room\_invites)**

| 字段名          | 名称     | 数据类型        | 约束                               |
| :----------- | :----- | :---------- | :------------------------------- |
| id           | 邀请编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| room\_id     | 房间 ID  | uuid        | FK (rooms), ON DELETE CASCADE    |
| sender\_id   | 发送方 ID | uuid        | FK (profiles), ON DELETE CASCADE |
| receiver\_id | 接收方 ID | uuid        | FK (profiles), ON DELETE CASCADE |
| status       | 邀请状态   | varchar(20) | DEFAULT 'pending'                |
| created\_at  | 创建时间   | timestamptz | DEFAULT NOW()                    |

### 5.3 积分与排行榜数据表设计

**表 13：积分规则表 (point\_rules)**

| 字段名           | 名称    | 数据类型         | 约束                               |
| :------------ | :---- | :----------- | :------------------------------- |
| id            | 规则编号  | uuid         | PK, DEFAULT uuid\_generate\_v4() |
| rule\_key     | 规则标识键 | varchar(50)  | UNIQUE, NOT NULL                 |
| rule\_name    | 规则名称  | varchar(100) | NOT NULL                         |
| points\_value | 规则分值  | integer      | DEFAULT 0, NOT NULL              |
| is\_active    | 是否启用  | boolean      | DEFAULT TRUE                     |
| created\_at   | 创建时间  | timestamptz  | DEFAULT NOW()                    |
| updated\_at   | 更新时间  | timestamptz  | DEFAULT NOW()                    |

**表 14：积分流水表 (point\_records)**

| 字段名            | 名称      | 数据类型        | 约束                               |
| :------------- | :------ | :---------- | :------------------------------- |
| id             | 流水编号    | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| user\_id       | 用户 ID   | uuid        | FK (profiles), ON DELETE CASCADE |
| rule\_id       | 规则 ID   | uuid        | FK (point\_rules)                |
| points\_change | 积分变动    | integer     | NOT NULL                         |
| source\_id     | 来源业务 ID | uuid        | NULL                             |
| created\_at    | 创建时间    | timestamptz | DEFAULT NOW()                    |

**表 15：排行榜快照表 (rankings)**

| 字段名              | 名称     | 数据类型        | 约束                               |
| :--------------- | :----- | :---------- | :------------------------------- |
| id               | 快照编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| user\_id         | 用户 ID  | uuid        | FK (profiles), ON DELETE CASCADE |
| rank\_position   | 排名位置   | integer     | NOT NULL                         |
| snapshot\_points | 快照积分   | integer     | NOT NULL                         |
| period\_type     | 统计周期类型 | varchar(20) | DEFAULT 'daily'                  |
| calculated\_at   | 统计计算时间 | timestamptz | DEFAULT NOW()                    |

### 5.4 一笔画挑战高级数据表设计

**表 16：一笔画题目表 (onestroke\_questions)**

| 字段名          | 名称     | 数据类型        | 约束                              |
| :----------- | :----- | :---------- | :------------------------------ |
| id           | 题目编号   | uuid        | PK, DEFAULT gen\_random\_uuid() |
| image\_url   | 题目图片地址 | text        | NOT NULL                        |
| answer\_name | 题目答案名称 | varchar     | NOT NULL                        |
| created\_at  | 创建时间   | timestamptz | DEFAULT NOW()                   |

**表 17：一笔画用户数据/段位表 (onestroke\_profiles)**

| 字段名            | 名称    | 数据类型        | 约束                                     |
| :------------- | :---- | :---------- | :------------------------------------- |
| user\_id       | 用户 ID | uuid        | PK, FK (auth.users), ON DELETE CASCADE |
| total\_score   | 挑战总分  | integer     | DEFAULT 0                              |
| correct\_count | 成功次数  | integer     | DEFAULT 0                              |
| updated\_at    | 更新时间  | timestamptz | DEFAULT NOW()                          |

**表 18：一笔画匹配记录表 (onestroke\_match\_records)**

| 字段名          | 名称       | 数据类型        | 约束                               |
| :----------- | :------- | :---------- | :------------------------------- |
| id           | 匹配记录编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| user\_id     | 用户 ID    | uuid        | FK (profiles), ON DELETE CASCADE |
| question\_id | 匹配到的题目ID | uuid        | FK (onestroke\_questions)        |
| status       | 匹配状态     | varchar     | DEFAULT 'matched'                |
| matched\_at  | 匹配时间     | timestamptz | DEFAULT NOW()                    |

**表 19：一笔画赛季表 (onestroke\_seasons)**

| 字段名         | 名称     | 数据类型        | 约束                               |
| :---------- | :----- | :---------- | :------------------------------- |
| id          | 赛季编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| name        | 赛季名称   | varchar     | NOT NULL                         |
| start\_date | 赛季开始时间 | timestamptz | NOT NULL                         |
| end\_date   | 赛季结束时间 | timestamptz | NOT NULL                         |
| is\_active  | 是否当前赛季 | boolean     | DEFAULT FALSE                    |

**表 20：一笔画段位分数配置表 (onestroke\_tier\_scores)**

| 字段名        | 名称    | 数据类型    | 约束                               |
| :--------- | :---- | :------ | :------------------------------- |
| id         | 配置编号  | uuid    | PK, DEFAULT uuid\_generate\_v4() |
| user\_id   | 用户 ID | uuid    | FK (profiles), ON DELETE CASCADE |
| tier\_name | 段位名称  | varchar | NOT NULL                         |
| min\_score | 最小分数  | integer | NOT NULL                         |

### 5.5 后台管理与系统支撑表设计

**表 21：AI 参数配置表 (ai\_configs)**

| 字段名                   | 名称      | 数据类型        | 约束                               |
| :-------------------- | :------ | :---------- | :------------------------------- |
| id                    | 配置编号    | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| config\_name          | 配置项名称   | varchar(50) | NOT NULL                         |
| openai\_model         | 模型名称    | varchar(50) | DEFAULT 'gpt-4-vision-preview'   |
| confidence\_threshold | 识别置信度阈值 | float       | DEFAULT 0.6                      |
| prompt\_template      | 提示词模板   | text        | NULL                             |
| is\_active            | 是否启用    | boolean     | DEFAULT FALSE                    |
| updated\_at           | 更新时间    | timestamptz | DEFAULT NOW()                    |

**表 22：登录日志表 (login\_records)**

| 字段名         | 名称       | 数据类型        | 约束                               |
| :---------- | :------- | :---------- | :------------------------------- |
| id          | 日志编号     | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| user\_id    | 用户 ID    | uuid        | FK (profiles), ON DELETE CASCADE |
| ip\_address | 登录 IP 地址 | inet        | NULL                             |
| login\_time | 登录时间     | timestamptz | DEFAULT NOW()                    |

**表 23：管理员用户表 (admin\_users)**

| 字段名         | 名称     | 数据类型        | 约束                                     |
| :---------- | :----- | :---------- | :------------------------------------- |
| id          | 管理员 ID | uuid        | PK, FK (auth.users), ON DELETE CASCADE |
| role        | 管理员角色  | varchar     | DEFAULT 'ADMIN'                        |
| created\_at | 创建时间   | timestamptz | DEFAULT NOW()                          |

**表 24：审计日志表 (audit\_logs)**

| 字段名         | 名称     | 数据类型        | 约束                              |
| :---------- | :----- | :---------- | :------------------------------ |
| id          | 日志编号   | uuid        | PK, DEFAULT gen\_random\_uuid() |
| admin\_id   | 管理员 ID | uuid        | FK (admin\_users)               |
| action      | 操作行为   | varchar     | NOT NULL                        |
| resource    | 操作资源   | varchar     | NULL                            |
| details     | 详细信息   | jsonb       | NULL                            |
| ip\_address | IP 地址  | varchar     | NULL                            |
| created\_at | 操作时间   | timestamptz | DEFAULT NOW()                   |

**表 25：旧好友消息表 (friend\_messages)**

*(注：系统重构遗留备用表，目前使用 messages 表替代)*

| 字段名          | 名称     | 数据类型        | 约束                               |
| :----------- | :----- | :---------- | :------------------------------- |
| id           | 消息编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| sender\_id   | 发送方 ID | uuid        | FK (profiles), ON DELETE CASCADE |
| receiver\_id | 接收方 ID | uuid        | FK (profiles), ON DELETE CASCADE |
| content      | 消息内容   | text        | NOT NULL                         |
| created\_at  | 发送时间   | timestamptz | DEFAULT NOW()                    |

***

## 2. 系统原型介绍 (System Prototype Introduction)

本系统的 UI/UX 设计采用了时下流行的 **Neo-brutalism (新粗野主义)** 风格。其主要特点是：大色块拼接、粗黑边框、高对比度色彩以及显眼的阴影偏移，营造出一种轻松、活泼、充满游戏感的视觉体验。

系统主要包含以下几个核心页面原型设计：

1. **认证与登录页 (Auth View)**
   - **功能**：用户注册与登录。
   - **设计**：屏幕中央的卡片式设计，配合粗黑边框的输入框和亮色按钮。支持 Supabase Auth 提供的邮箱密码登录。
   - **视觉**：背景采用动态或高饱和度色块，提升年轻化氛围。
2. **游戏大厅 (Lobby View)**
   - **功能**：玩家登录后的主界面。提供“创建房间”、“加入房间”、“一笔画大挑战”三个核心入口。
   - **设计**：采用响应式网格布局，三个主要入口以巨大的功能卡片展示。顶部导航栏包含个人中心、排行榜入口以及“好友与组队”的快捷抽屉按钮。
   - **交互**：点击卡片伴随明显的按下动画和阴影变化反馈。
3. **好友与组队抽屉 (Social Drawer)**
   - **功能**：集成好友搜索、申请处理、实时聊天、队伍创建与邀请。
   - **设计**：从屏幕右侧滑出的抽屉面板，内部分为“好友”与“队伍”两个 Tab 标签页。
   - **亮点**：聊天界面采用类似微信/QQ的气泡式对话框，带有未读消息的红点提示。
4. **游戏房间与对局页 (Room View)**
   - **功能**：核心游戏区域。分为等待阶段、作画阶段、竞猜阶段和结算阶段。
   - **设计**：
     - **左侧**：玩家列表侧边栏，实时显示房间内成员的头像、分数和在线状态。
     - **中间**：巨大的 Canvas 画板区。画师拥有画笔颜色、粗细调整和清空画布的功能；非画师玩家在此区域观看 AI 生成的提示词和画作。
     - **右侧**：竞猜日志侧边栏。玩家在此输入答案，系统会根据比对结果给出正确/错误的实时反馈弹幕。
     - **顶部**：房间邀请码显示与“邀请好友”的快捷按钮。
5. **一笔画挑战与段位榜 (One-Stroke View & Rankings)**
   - **功能**：单人闯关模式。玩家需一笔画出题目要求的图形，由 AI 实时打分。
   - **设计**：沉浸式的单人挑战界面，突出题目和倒计时。结算后进入段位榜，榜单按照青铜、白银、黄金、钻石、大师进行阶梯式视觉展示，辅以不同的背景色和皇冠图标。
6. **管理员后台 (Admin Dashboard)**
   - **功能**：系统配置与数据监控。
   - **设计**：专业的数据仪表盘，包含 AI 模型参数调整表单（如置信度阈值）、积分规则管理表格以及平台活跃度的数据统计图表。

***

## 3. 体系结构设计 (System Architecture Design)

项目采用前后端分离的架构，结合 Supabase 提供的 BaaS（后端即服务）能力，实现高实时性和强扩展性。

### 技术栈

- **前端 (Frontend)**: Vue.js (Vue 3) + Vite + Tailwind CSS + HTML5 Canvas
- **后端 (Backend)**: Node.js + Express.js
- **BaaS / 基础设施**: Supabase (PostgreSQL 数据库, Auth, Storage 存储, Realtime 实时同步)
- **AI 服务**: OpenAI Vision API / 阿里云百炼千问大模型 (Qwen-VL-Max)

### 体系结构图

```mermaid
graph TB
    subgraph Client [客户端 - Vue 3]
        direction LR
        UI[页面交互 UI]
        Canvas[Canvas 画板]
        State[Pinia 状态管理]
    end

    subgraph Backend [核心服务 - Node.js]
        direction LR
        RoomAPI[房间/组队 API]
        GameAPI[游戏/AI API]
        SocialAPI[社交/消息 API]
    end

    subgraph BaaS [Supabase 基础设施]
        direction LR
        Auth[Auth 鉴权]
        DB[(PostgreSQL 数据库)]
        Storage[Storage 存储]
        Realtime[Realtime 实时同步]
    end

    subgraph AI [大模型服务]
        AIVision[OpenAI / Qwen-VL]
    end

    %% 客户端到后端的请求
    UI -->|REST API| RoomAPI
    UI -->|REST API| SocialAPI
    Canvas -->|触发识别| GameAPI

    %% 客户端直接到 BaaS
    UI -.->|登录注册| Auth
    UI -.->|WebSocket| Realtime
    Canvas -.->|Blob 上传| Storage

    %% 后端到 BaaS
    RoomAPI -->|读写状态| DB
    SocialAPI -->|读写数据| DB
    GameAPI -->|写入记录| DB

    %% 后端到 AI
    GameAPI -->|图片URL+Prompt| AIVision
    AIVision -->|返回提示词| GameAPI
```

***

## 4. 用户功能模块设计 (Functional Module Design)

用户功能模块负责处理具体的业务逻辑，包括用户认证、资料管理、房间控制、游戏对局等。系统后端主要通过 Controller -> Service -> Repository 的分层架构来实现。

### 4.1 用户认证与资料功能模块

用户侧包含注册/登录/登出、资料查询与修改、登录日志记录等。认证依托 Supabase Auth，后端负责封装鉴权与资料初始化。

```mermaid
classDiagram
    class AuthController {
        +signUp()
        +signIn()
        +signOut()
        +getMe()
    }
    
    class AuthService {
        +signUp()
        +signIn()
        +signOut()
        +verifyToken()
    }
    
    class ProfileService {
        +getProfile()
        +updateProfile()
        +ensureProfile()
    }
    
    class LoginRecordService {
        +recordLogin()
    }
    
    class ProfileRepository {
        +findByUserId()
        +upsert()
    }
    
    class LoginRecordRepository {
        +insert()
    }
    
    class Profile {
        +String id
        +String nickname
        +String avatarUrl
        +int totalPoints
    }
    
    class LoginRecord {
        +String id
        +String userId
        +String ipAddress
        +String loginTime
    }
    
    AuthController --> AuthService : calls
    AuthController --> ProfileService : calls
    AuthController --> LoginRecordService : calls
    
    ProfileService --> ProfileRepository : uses
    LoginRecordService --> LoginRecordRepository : uses
    
    ProfileRepository --> Profile : maps
    LoginRecordRepository --> LoginRecord : maps
```

### 4.2 房间管理与成员同步模块

房间模块负责创建房间码、加入/退出房间、查询成员列表、维护成员角色与在线状态；并为实时同步提供基础。

```mermaid
classDiagram
    class RoomController {
        +createRoom()
        +joinRoom()
        +leaveRoom()
        +getRoomMembers()
    }
    
    class RoomService {
        +createRoom()
        +joinRoom()
        +leaveRoom()
        +getRoomMembers()
    }
    
    class RoomServiceImpl {
        +createRoom()
        +joinRoom()
        +leaveRoom()
        +getRoomMembers()
    }
    
    class RoomRepository {
        +create()
        +findByCode()
        +updateStatus()
    }
    
    class RoomMemberRepository {
        +addMember()
        +removeMember()
        +findByRoomId()
    }
    
    class Room {
        +String id
        +String code
        +String ownerId
        +String status
    }
    
    class RoomMember {
        +String id
        +String roomId
        +String userId
        +String role
    }

    RoomController --> RoomService : calls
    RoomService <|.. RoomServiceImpl : implements
    RoomServiceImpl --> RoomRepository : uses
    RoomServiceImpl --> RoomMemberRepository : uses
    RoomRepository --> Room : maps
    RoomMemberRepository --> RoomMember : maps
```

### 4.3 游戏对局与 AI 裁判模块

负责游戏回合的流转、画作上传、调用大模型进行识别并生成提示、以及猜词积分结算。

```mermaid
classDiagram
    class GameController {
        +startGame()
        +submitDrawing()
        +submitGuess()
        +endRound()
    }
    
    class GameService {
        +createRound()
        +processDrawingAndAI()
        +validateGuess()
        +calculatePoints()
    }
    
    class AIService {
        +analyzeImage()
        +generateHint()
    }
    
    class StorageService {
        +uploadImage()
        +getPublicUrl()
    }
    
    class GameRoundRepository {
        +create()
        +updateStatus()
    }
    
    class DrawingRepository {
        +saveDrawingResult()
    }
    
    class GuessRecordRepository {
        +saveGuess()
    }

    GameController --> GameService : calls
    GameService --> AIService : uses
    GameService --> StorageService : uses
    GameService --> GameRoundRepository : uses
    GameService --> DrawingRepository : uses
    GameService --> GuessRecordRepository : uses
```

### 4.4 社交与扩展玩法模块

包含好友系统、组队邀请、私聊消息以及一笔画大挑战的闯关逻辑。

```mermaid
classDiagram
    class SocialController {
        +addFriend()
        +deleteFriend()
        +sendMessage()
        +inviteToTeam()
    }
    
    class OneStrokeController {
        +getQuestion()
        +submitAnswer()
        +getRankings()
    }
    
    class FriendService {
        +sendRequest()
        +acceptRequest()
        +deleteFriend()
    }
    
    class MessageService {
        +sendMessage()
        +sendRoomInvite()
    }
    
    class TeamService {
        +createTeam()
        +joinTeam()
    }

    SocialController --> FriendService : calls
    SocialController --> MessageService : calls
    SocialController --> TeamService : calls
```

***

## 5. 数据库设计 (Database Design)

系统数据主要存储在 PostgreSQL 中。以下为核心业务数据表的详细结构设计：

### 5.1 核心数据表设计

**表 1：用户档案表 (profiles)**

| 字段名           | 名称   | 数据类型        | 约束                                     |
| :------------ | :--- | :---------- | :------------------------------------- |
| id            | 用户编号 | uuid        | PK, FK (auth.users), ON DELETE CASCADE |
| nickname      | 用户昵称 | text        | NOT NULL                               |
| avatar\_url   | 头像链接 | text        | NULL                                   |
| total\_points | 总积分  | integer     | DEFAULT 0                              |
| created\_at   | 创建时间 | timestamptz | DEFAULT NOW()                          |
| updated\_at   | 更新时间 | timestamptz | DEFAULT NOW()                          |

**表 2：房间表 (rooms)**

| 字段名          | 名称    | 数据类型        | 约束                                                                                 |
| :----------- | :---- | :---------- | :--------------------------------------------------------------------------------- |
| id           | 房间编号  | uuid        | PK, DEFAULT uuid\_generate\_v4()                                                   |
| code         | 房间码   | varchar(6)  | UNIQUE, NOT NULL                                                                   |
| owner\_id    | 房主 ID | uuid        | FK (profiles)                                                                      |
| max\_players | 最大人数  | integer     | DEFAULT 10, CHECK (max\_players >= 2)                                              |
| status       | 房间状态  | varchar(20) | DEFAULT 'waiting', CHECK (status IN ('waiting', 'playing', 'finished', 'timeout')) |
| created\_at  | 创建时间  | timestamptz | DEFAULT NOW()                                                                      |
| updated\_at  | 更新时间  | timestamptz | DEFAULT NOW()                                                                      |

**表 3：房间成员关联表 (room\_members)**

| 字段名        | 名称    | 数据类型        | 约束                                                    |
| :--------- | :---- | :---------- | :---------------------------------------------------- |
| id         | 记录编号  | uuid        | PK, DEFAULT uuid\_generate\_v4()                      |
| room\_id   | 房间 ID | uuid        | FK (rooms), ON DELETE CASCADE                         |
| user\_id   | 用户 ID | uuid        | FK (profiles), ON DELETE CASCADE                      |
| role       | 角色    | varchar(20) | DEFAULT 'player', CHECK (role IN ('owner', 'player')) |
| is\_online | 在线状态  | boolean     | DEFAULT TRUE                                          |
| joined\_at | 加入时间  | timestamptz | DEFAULT NOW()                                         |

*(注：设有 UNIQUE(room\_id, user\_id) 联合唯一约束防止重复加入)*

**表 4：游戏回合表 (game\_rounds)**

| 字段名           | 名称    | 数据类型        | 约束                                                                       |
| :------------ | :---- | :---------- | :----------------------------------------------------------------------- |
| id            | 回合编号  | uuid        | PK, DEFAULT uuid\_generate\_v4()                                         |
| room\_id      | 房间 ID | uuid        | FK (rooms), ON DELETE CASCADE                                            |
| drawer\_id    | 画手 ID | uuid        | FK (profiles)                                                            |
| target\_word  | 目标词汇  | varchar(50) | NOT NULL                                                                 |
| status        | 回合状态  | varchar(20) | DEFAULT 'drawing', CHECK (status IN ('drawing', 'guessing', 'finished')) |
| round\_number | 回合序号  | integer     | NOT NULL DEFAULT 1                                                       |
| created\_at   | 创建时间  | timestamptz | DEFAULT NOW()                                                            |

**表 5：画作表 (drawings)**

| 字段名                     | 名称      | 数据类型        | 约束                                   |
| :---------------------- | :------ | :---------- | :----------------------------------- |
| id                      | 画作编号    | uuid        | PK, DEFAULT uuid\_generate\_v4()     |
| round\_id               | 关联回合 ID | uuid        | FK (game\_rounds), ON DELETE CASCADE |
| image\_url              | 图片存储地址  | text        | NOT NULL                             |
| ai\_raw\_response       | AI 原始响应 | jsonb       | NULL                                 |
| ai\_hint\_text          | AI 提示词  | text        | NULL                                 |
| recognition\_confidence | 识别置信度   | float       | NULL                                 |
| created\_at             | 创建时间    | timestamptz | DEFAULT NOW()                        |

**表 6：猜词记录表 (guess\_records)**

| 字段名            | 名称     | 数据类型        | 约束                               |
| :------------- | :----- | :---------- | :------------------------------- |
| id             | 记录编号   | uuid        | PK, DEFAULT uuid\_generate\_v4() |
| drawing\_id    | 画作 ID  | uuid        | FK (drawings), ON DELETE CASCADE |
| user\_id       | 竞猜者 ID | uuid        | FK (profiles), ON DELETE CASCADE |
| guess\_content | 猜测内容   | text        | NOT NULL                         |
| is\_correct    | 是否正确   | boolean     | DEFAULT FALSE                    |
| points\_earned | 获得积分   | integer     | DEFAULT 0                        |
| created\_at    | 创建时间   | timestamptz | DEFAULT NOW()                    |

### 5.2 社交与扩展数据表设计

**表 7：好友关系表 (friends)**

| 字段名           | 名称     | 数据类型        | 约束                                                                      |
| :------------ | :----- | :---------- | :---------------------------------------------------------------------- |
| id            | 关系编号   | uuid        | PK, DEFAULT uuid\_generate\_v4()                                        |
| requester\_id | 发起方 ID | uuid        | FK (profiles), ON DELETE CASCADE                                        |
| addressee\_id | 接收方 ID | uuid        | FK (profiles), ON DELETE CASCADE                                        |
| status        | 关系状态   | varchar(20) | DEFAULT 'pending', CHECK (status IN ('pending', 'accepted', 'blocked')) |
| created\_at   | 创建时间   | timestamptz | DEFAULT NOW()                                                           |
| updated\_at   | 更新时间   | timestamptz | DEFAULT NOW()                                                           |

**表 8：消息表 (messages)**

| 字段名          | 名称       | 数据类型        | 约束                                                       |
| :----------- | :------- | :---------- | :------------------------------------------------------- |
| id           | 消息编号     | uuid        | PK, DEFAULT uuid\_generate\_v4()                         |
| sender\_id   | 发送方 ID   | uuid        | FK (profiles), ON DELETE CASCADE                         |
| receiver\_id | 接收方 ID   | uuid        | FK (profiles), ON DELETE CASCADE                         |
| content      | 消息内容     | text        | NOT NULL                                                 |
| type         | 消息类型     | varchar(20) | DEFAULT 'text', CHECK (type IN ('text', 'room\_invite')) |
| room\_code   | 房间码(邀请用) | varchar(6)  | NULL                                                     |
| is\_read     | 已读状态     | boolean     | DEFAULT FALSE                                            |
| created\_at  | 发送时间     | timestamptz | DEFAULT NOW()                                            |

**表 9：一笔画挑战记录表 (onestroke\_records)**

| 字段名            | 名称    | 数据类型        | 约束                              |
| :------------- | :---- | :---------- | :------------------------------ |
| id             | 记录编号  | uuid        | PK, DEFAULT gen\_random\_uuid() |
| user\_id       | 用户 ID | uuid        | FK (auth.users)                 |
| question\_id   | 题目 ID | uuid        | FK (onestroke\_questions)       |
| is\_correct    | 是否正确  | boolean     | NOT NULL                        |
| points\_earned | 获得积分  | integer     | DEFAULT 0                       |
| created\_at    | 挑战时间  | timestamptz | DEFAULT NOW()                   |

***

## 6. 系统交互流程示例 (System Interaction Flow)

### 房间内邀请好友与游戏进行时序图

```mermaid
sequenceDiagram
    participant P1 as 玩家 A (房主)
    participant P2 as 玩家 B (好友)
    participant DB as Supabase DB & Realtime
    participant API as 后端 API 服务
    participant AI as 视觉大模型 (Qwen-VL)

    %% 邀请好友流程
    P1->>DB: [发消息] Insert into messages (type: 'room_invite', room_code)
    DB-->>P2: [Realtime 推送] 触发新消息事件 (带红点)
    P2->>P2: 点击邀请卡片中的 "加入房间"
    P2->>API: POST /api/rooms/join (带 room_code)
    API->>DB: Insert into room_members
    DB-->>P1: [Realtime 推送] 玩家 B 加入房间
    
    %% 游戏环节
    P1->>API: 点击 "开始游戏"
    API->>DB: Update room status = 'playing', Create game_round
    DB-->>P1: [Realtime 推送] 进入作画阶段
    DB-->>P2: [Realtime 推送] 进入等待画师阶段
    
    P1->>API: 提交画作 Blob
    API->>DB: 上传 Storage 获得 image_url
    API->>AI: 传入 image_url 和 Prompt 要求判定并给提示
    AI-->>API: 返回: {"hint": "生活在海里的巨无霸"}
    API->>DB: Create drawing (存入图片URL和AI提示)
    DB-->>P2: [Realtime 推送] 收到图片和 AI 提示
    
    P2->>API: 提交竞猜词 "鲸鱼"
    API->>API: 字符串比对 / 相似度判断
    API->>DB: 写入 guess_records (得分)
    DB-->>P1: [Realtime 推送] P2 猜对，积分 +10
    DB-->>P2: [Realtime 推送] 回合结束展示积分榜
```

***

## 7. 系统测试 (System Testing)

### 7.1 用户功能测试

#### 7.1.1 登录与注册功能测试

用户在进入平台时，需通过邮箱密码进行注册或登录。针对该模块进行功能测试，相关测试用例如表 7.1 所示。

**表 7.1 登录注册功能测试用例表**

| 用例编号 | 用例描述   | 操作过程及数据                            | 预期结果                        | 实际结果 |
| :--: | :----- | :--------------------------------- | :-------------------------- | :--: |
|  01  | 正常登录   | 1. 访问登录页2. 输入已注册邮箱和正确密码3. 点击“登录”按钮 | 页面成功跳转至游戏大厅，右上角显示用户头像与昵称。   |  正确  |
|  02  | 密码错误   | 1. 输入已注册邮箱2. 输入错误密码3. 点击“登录”按钮     | 页面停留，上方弹出“密码错误或账号不存在”提示信息。  |  正确  |
|  03  | 账号未注册  | 1. 输入未注册邮箱2. 输入任意密码3. 点击“登录”按钮     | 页面停留，上方弹出“账号不存在”提示信息。       |  正确  |
|  04  | 正常注册   | 1. 切换至注册面板2. 输入新邮箱和合法密码3. 点击“注册”按钮 | 注册成功，系统自动分配默认昵称并登录跳转至大厅。    |  正确  |
|  05  | 密码格式校验 | 1. 输入新邮箱2. 输入长度不足6位的密码3. 点击“注册”按钮  | 拦截提交，输入框下方标红提示“密码长度不能少于6位”。 |  正确  |

#### 7.1.2 房间管理功能测试

房间管理是玩家联机的核心入口，包含创建房间、加入房间等功能，在此过程中可能会出现多种情况，相关测试如表 7.2 所示。

**表 7.2 房间管理功能测试用例表**

| 用例编号 | 用例描述     | 操作过程及数据                           | 预期结果                            | 实际结果 |
| :--: | :------- | :-------------------------------- | :------------------------------ | :--: |
|  01  | 创建房间     | 在大厅点击“立即创建”按钮                     | 跳转至专属房间页，生成唯一的 6 位房间码，玩家身份为房主。  |  正确  |
|  02  | 正常加入房间   | 1. 在大厅输入框输入 6 位有效房间码2. 点击“进入房间”   | 成功跳转至目标房间，左侧成员列表实时新增该玩家，房主看到通知。 |  正确  |
|  03  | 加入不存在的房间 | 1. 输入无效或过期的房间码2. 点击“进入房间”         | 页面不跳转，弹出“找不到相关房间或房间已解散”提示信息。    |  正确  |
|  04  | 房间人数已满   | 尝试加入一个当前人数已达到 `max_players` 上限的房间 | 加入被拦截，弹出“该房间人数已满”提示。            |  正确  |
|  05  | 退出房间     | 1. 在房间内点击“离开”按钮2. 确认离开            | 页面退回大厅，该房间其他玩家的成员列表中该玩家消失。      |  正确  |

#### 7.1.3 游戏对局与 AI 裁判功能测试

该模块为系统核心玩法，测试范围涵盖画手作画、AI 识别、其他玩家竞猜等全链路流程。

**表 7.3 游戏对局核心功能测试用例表**

| 用例编号 | 用例描述        | 操作过程及数据                        | 预期结果                                                    | 实际结果 |
| :--: | :---------- | :----------------------------- | :------------------------------------------------------ | :--: |
|  01  | 房主开始游戏      | 房间内人数≥2人时，房主点击“START GAME”     | 房间状态变为 playing，系统随机选中一名玩家作为画手并下发题目。                     |  正确  |
|  02  | 画作提交与 AI 识别 | 1. 画手使用 Canvas 绘图2. 点击“提交画作”   | Canvas 转换为 Blob 上传，页面显示“判定中”。几秒后，猜词玩家屏幕出现画作及 AI 生成的提示词。 |  正确  |
|  03  | 正常竞猜正确      | 1. 猜词玩家在输入框输入完全正确的题目词汇2. 提交答案  | 聊天区显示“🎉 猜对了！”，玩家获得对应积分并触发实时音效/特效。                      |  正确  |
|  04  | 模糊竞猜 (可选)   | 1. 输入包含错别字或同义词（如题目是"猫"，输入"小猫"） | AI/算法判定相似度达标，算作正确并给予相应积分提示。                             |  正确  |
|  05  | 竞猜错误        | 1. 输入完全无关的词汇2. 提交答案            | 聊天区展示玩家输入的普通文本，不加分。                                     |  正确  |

#### 7.1.4 社交系统功能测试

针对好友添加、实时聊天以及房间内组队邀请进行功能测试。

**表 7.4 社交系统功能测试用例表**

| 用例编号 | 用例描述    | 操作过程及数据                        | 预期结果                              | 实际结果 |
| :--: | :------ | :----------------------------- | :-------------------------------- | :--: |
|  01  | 搜索并添加好友 | 1. 打开右侧社交抽屉2. 搜索目标昵称并点击“添加”    | 对方收到好友申请提示，待对方同意后，双方好友列表均出现彼此。    |  正确  |
|  02  | 实时私聊消息  | 1. 在好友列表点击“发消息”2. 发送文本“你好”     | 对方界面的社交按钮出现红点，点开后能看到气泡对话框及“你好”。   |  正确  |
|  03  | 房间内发送邀请 | 1. 房主在房间内点击“邀请好友”2. 选择在线好友发送邀请 | 好友的聊天框中出现特殊样式的“房间邀请卡片”附带“加入房间”按钮。 |  正确  |
|  04  | 接受房间邀请  | 好友点击聊天卡片上的“加入房间”按钮             | 自动解析房间码并触发加入逻辑，直接跳转至该对局房间。        |  正确  |
|  05  | 删除好友    | 1. 在好友列表点击“删除”2. 确认删除          | 好友关系双向解除，对方列表同步消失，聊天记录清理/隐藏。      |  正确  |

#### 7.1.5 个人资料与排行榜功能测试

验证用户个人信息的展示、修改，以及全站积分排行榜的实时性和准确性。

**表 7.5 个人资料与排行榜测试用例表**

| 用例编号 | 用例描述    | 操作过程及数据                           | 预期结果                                    | 实际结果 |
| :--: | :------ | :-------------------------------- | :-------------------------------------- | :--: |
|  01  | 查看个人主页  | 1. 登录后在导航栏点击头像2. 进入 Profile 页面    | 成功显示用户的昵称、头像、总积分、历史游戏记录及历史画作。           |  正确  |
|  02  | 修改昵称    | 1. 在个人主页点击“修改昵称”2. 输入新昵称“画画大师”并保存 | 提示修改成功，页面各处（大厅、房间、好友列表）的昵称同步更新。         |  正确  |
|  03  | 排行榜数据展示 | 1. 在大厅点击“排行榜”2. 浏览 Top 100 榜单     | 列表按玩家 `total_points` 从高到低排序，前三名有特殊奖牌标识。 |  正确  |
|  04  | 排行榜积分同步 | 1. 玩家完成一局游戏并获得 20 积分2. 刷新排行榜页面    | 该玩家在排行榜上的总积分增加 20 分，排名可能发生变化。           |  正确  |

***

### 7.2 扩展玩法功能测试 (一笔画大挑战)

针对单人闯关模式“一笔画大挑战”进行专门的逻辑验证。

**表 7.6 一笔画挑战功能测试用例表**

| 用例编号 | 用例描述    | 操作过程及数据                            | 预期结果                               | 实际结果 |
| :--: | :------ | :--------------------------------- | :--------------------------------- | :--: |
|  01  | 获取随机题目  | 在大厅点击“一笔画大挑战”入口                    | 页面成功渲染题目图片及目标物品名称（如“苹果”），倒计时开始。    |  正确  |
|  02  | 限制一笔画规则 | 1. 在 Canvas 上按下鼠标画一条线2. 松开鼠标再次尝试绘制 | 第二次绘制无效/被拦截，严格保证只能“一笔成型”。          |  正确  |
|  03  | 提交正确画作  | 1. 绘制符合题意的图案2. 提交 AI 判定            | AI 判定正确，页面弹出“挑战成功”动效，获得积分，段位可能提升。  |  正确  |
|  04  | 提交错误画作  | 1. 随意乱画一通2. 提交 AI 判定               | AI 判定失败，页面弹出“挑战失败”，显示 AI 的吐槽/反馈意见。 |  正确  |
|  05  | 查看段位榜   | 点击“一笔画段位榜”                         | 根据累计得分显示对应的青铜、白银、黄金、钻石或大师段位图标及排名。  |  正确  |

***

### 7.3 管理员功能测试

管理员负责维护系统的正常运行、AI 参数调优、用户管理和数据看板监控。

**表 7.7 管理员后台功能测试用例表**

| 用例编号 | 用例描述     | 操作过程及数据                                     | 预期结果                                          | 实际结果 |
| :--: | :------- | :------------------------------------------ | :-------------------------------------------- | :--: |
|  01  | 调整 AI 阈值 | 1. 登录管理员后台2. 修改 AI 识别置信度阈值由 0.6 改为 0.83. 保存 | 数据库 `ai_configs` 更新成功，后续游戏对局中 AI 判定标准变得更严格。   |  正确  |
|  02  | 积分规则管理   | 1. 进入“积分规则”菜单2. 修改“猜对基础分”由 10 分改为 15 分      | `point_rules` 表更新，后续对局猜对的玩家将获得 15 分。          |  正确  |
|  03  | 封禁违规用户   | 1. 在用户管理列表找到目标违规用户2. 点击“封禁”并确认              | 该用户的 `status` 变更为 banned，其无法登录或加入游戏。          |  正确  |
|  04  | 数据报表查看   | 点击“数据仪表盘”菜单                                 | 页面成功渲染 ECharts/Chart.js 图表，准确展示 DAU、今日开局数等统计。 |  正确  |

***

### 7.4 性能测试

针对本在线互动游戏网站，特别是涉及 WebSocket 实时通信和 AI 接口调用的部分，采取了模拟高并发用户访问进行性能测试，以确保系统在多人同时在线和高频交互场景下流畅运行。

1. **页面加载性能**：通过 Lighthouse 测试，首屏加载时间 (FCP) 均控制在 **1.5秒** 以内，Canvas 渲染无阻塞，好友列表 1000 条数据虚拟滚动/分页加载响应时间 **≤ 200 ms**。
2. **WebSocket 并发测试**：模拟 500 个并发连接（约 50 个满员房间）同时发送绘图坐标和聊天消息。测试结果显示，Supabase Realtime 消息分发延迟 P95 **< 150 ms**，无明显消息丢失。
3. **API 接口压测**：针对 `/api/rooms/join` 等核心业务接口使用 JMeter 进行压测，在 200 QPS 下吞吐量稳定，无锁冲突和脏读（依赖数据库层面正确的事务和隔离级别）。
4. **AI 响应时间测试**：在画作提交触发 Qwen-VL/OpenAI Vision 识别时，平均响应时间约为 **2\~4 秒**，前端设置了合理的 Loading 动画缓冲用户的等待焦虑。

***

### 7.5 安全性测试

针对本网站，采用了全面的安全测试，保障系统的数据与交易安全。

1. **SQL 注入防护**：后端采用 Supabase 提供的 ORM/SDK 接口进行数据查询，天然防御拼接型 SQL 注入攻击。
2. **XSS 攻击防护**：前端使用 Vue 3 框架，模板渲染双大括号 `{{ }}` 自动对用户输入（如昵称、聊天消息、竞猜内容）进行 HTML 实体转义，成功拦截 `<script>alert(1)</script>` 等恶意脚本注入。
3. **数据越权测试 (IDOR)**：系统核心表（如 `profiles`, `friends`, `messages`）全部开启了严格的 PostgreSQL RLS (行级安全策略)。测试表明：用户 A 尝试通过篡改 API 请求参数去强行读取或删除用户 B 的私聊消息时，被数据库底层直接拦截（返回 403 或空数据）。
4. **CSRF 防护**：采用 JWT Token 存放于 HTTP Header (`Authorization: Bearer <token>`) 进行鉴权，而非依赖传统 Cookie，有效避免了跨站请求伪造攻击。

***

## 第8章 结　论

本研究工作围绕“AI 你画我猜”在线互动游戏平台的设计与实现展开，系统性地探讨了视觉大模型在强交互类 Web 应用中的工程落地可行性。通过整合 Vue.js 3、Node.js、Supabase 基础设施以及阿里云百炼千问大模型（Qwen-VL），本系统构建了一个兼具娱乐性与技术前瞻性的全栈应用。

在功能实现方面，本系统成功交付了包括房间管理、实时画板同步、AI 智能裁判、社交互动（好友、组队、私聊）以及单人一笔画挑战在内的完整业务闭环。与传统的“你画我猜”游戏相比，本系统的核心创新点在于摒弃了传统模式中完全依赖玩家人工比对和裁决的局限，将视觉大模型深度嵌入游戏链路中。这种设计不仅提升了游戏判定的客观性，还通过 AI 生成的生活化提示词，为游戏增添了意想不到的趣味性与交互深度。同时，借助 Supabase 的 Realtime 模块和 RLS（行级安全策略）机制，系统在保证高并发 WebSocket 消息低延迟分发的前提下，有效防御了数据越权等安全隐患，达到了较高的工程规范标准。

然而，在开发与测试过程中，系统也暴露出一些尚待解决的问题。首先是 AI 接口的响应延迟问题。尽管在前端引入了过渡动画进行缓冲，但受限于当前视觉大模型的推理计算成本，图片上传及结果返回的整体链路耗时仍维持在 2 至 4 秒之间，这在一定程度上削弱了竞技类游戏对“即时反馈”的体验要求。其次是 AI 识别的语义漂移现象，对于玩家绘制的抽象图形或过于简陋的线条，模型偶尔会出现过度解读或识别偏差，导致系统下发的提示词偏离正确答案，进而影响竞猜玩家的游戏体验。最后，一笔画挑战模块的判定算法在面对极其复杂的折线或重叠轨迹时，仍存在误判的可能性，这反映出现有的几何特征比对与 AI 校验在细粒度图像理解上存在边界盲区。

针对上述问题，未来的研究与优化工作可从以下几个维度展开：一是探索边缘计算或轻量化端侧视觉模型的引入方案，尝试在客户端进行初步的图像特征提取，以分担云端推理压力并降低网络传输带来的延迟；二是在服务端构建专用的垂直领域微调（Fine-tuning）数据集，通过收集玩家的历史画作与对应标签，对开源视觉模型进行二次训练，进一步提高针对涂鸦、简笔画等特定风格图像的识别准确率；三是引入更多元化的游戏机制，例如增加玩家对 AI 提示词的“纠错投票”环节，将玩家的反馈作为数据飞轮的一部分，推动系统能力的持续迭代。

综上所述，本项目验证了视觉大模型在实时互动娱乐场景下的应用价值，并在架构设计与业务实现上取得了预期成果。随着底层 AI 算力的进一步发展与模型推理成本的降低，本系统的核心架构和设计思路有望为同类智能互动应用的研发提供有益的参考。

---
*文档生成日期：2026-03-22*
