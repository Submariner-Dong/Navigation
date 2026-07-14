# 青芽智医 - 口腔医院导航小程序

## 更新日志

### 2026-07-14：全面修复分包加载 & ES Module 兼容性 & 优化交互细节并加强防重复机制

1. **分包模块 require() 失败根本原因定位与修复**：
   - **核心发现**：微信分包首次从主包跳转时，分包内非页面 JS 文件可能尚未注册到模块系统，导致顶层 `require()` 找不到同包内文件
   - **解决方案**：所有分包的共享模块引用统一指向主包（使用 `../../../` 路径穿越分包边界）
   - **修复范围**：navigationConfig.js、imageConfig.js、userDataManager.js、amap-wx.130.js 等 10+ 文件路径调整

2. **ES Module → CommonJS 全面转换**（关键修复）：
   - **根因**：分包环境中 `require()` 无法解析 ES6 的 `export default` 语法，返回 `undefined`
   - **修复文件**：主包 `config/imageConfig.js`（最后一行 `export default` → `module.exports`）
   - **影响**：此修复解决了 navigationConfig 图片 URL 全部为 `undefined` 的连锁问题

3. **navigationConfig.js 内部路径错误修复**：
   - 原代码：`require("./config/navigationConfig")` 解析为不存在的 `config/config/navigationConfig`
   - 修复为：`require("./imageConfig.js")`（同目录下的 imageConfig）

4. **detail.js ES6 import 语法修复**：
   - `import imageConfig from '...'` 改为 `const imageConfig = require('...')`

5. **medical-record 页面 "page not found" 修复**：
   - 根因：缺少必要的 `.wxml`、`.wxss`、`.json` 页面文件
   - 微信小程序每个页面必须包含完整的4个文件才能被识别和加载

6. **调试基础设施建立**：
   - 为 6 个关键页面添加详细的模块加载调试代码（navigation.js、department.js、map.js、detail.js、medical-record.js、medical-record-detail.js）
   - 生成 `DEBUG_GUIDE.md` 调试指南文档，包含预期输出示例与常见错误排查流程

7. **技术经验总结（写入最佳实践）**：
   - 分包开发只用 CommonJS（`require/module.exports`），禁用 ES Module（`import/export`）
   - 共享文件优先放主包，避免多副本同步问题
   - 每个页面的4个文件必须齐全
   - 分包首次加载时避免在顶层立即 require 同包内非页面文件

8. **登录页微信昵称获取交互优化**：
   - **问题**：点击"使用微信昵称"按钮后仅弹出 toast 提示让用户在下方输入框确认，体验不流畅
   - **修复方案**：改用 `<input type="nickname">` 的 `focus` 属性控制聚焦状态 → 微信自动弹窗填充昵称
   - **实现细节**：`onChooseNicknameWechat()` 先重置 `nicknameInputFocus=false`，再延迟 50ms 设为 `true` 触发弹窗；获取成功后自动 `focus=false`
   - **效果**：与「获取微信头像」一致的点击即唤起交互体验

9. **首页轮播图显示不全修复**：
   - **问题**：轮播图 carousel-1.png（1256×336，宽高比约 3.74:1）使用 `mode="aspectFill"` + 固定高度 `33vh` 容器，导致图片被大量裁剪无法完整显示
   - **修复方案**：3张轮播图全部改为 `mode="widthFix"`；移除 `.carousel-section` 和 `.carousel` 的固定高度约束，由图片内容自适应撑开
   - **效果**：图片按原始比例完整展示（宽度铺满屏幕，高度自动计算约为宽度的 26.7%）

10. **科普视频标题修正 & 病历保存防重复提交**：
    - **视频标题修改**：`science.js` 和 `detail.js` 中 "口腔地毯（待定）" → "嘴里疼的不止牙"
    - **病历重复保存 Bug 根因**：`saveMedicalRecord()` 无任何防护，保存后 `navigateBack()` 有 1.5s 延迟期间用户可连点多下 → 每次都 `unshift` 插入相同记录
    - **三重防护方案**：
      - **UI 锁（第一层）**：按钮增加 `loading="{{submitting}}"` + `disabled="{{submitting}}"`，点击后文字切换为"保存中..."；3秒冷却定时器兜底防止永久卡死
      - **存储记录查重（第二层）**：在 record 构建完成后、写入 Storage 前，读取已有病历列表用 `records.some(逐字段 === record)` 对比核心字段（visitTime/department/doctor/diagnosis/mainComplaint/treatmentProcess/medication），发现完全一致则拦截并提示"请勿重复保存相同病历"
      - **关键设计决策**：查重使用完整 `record` 对象与存储值对比，天然避免默认值不一致导致比对失败的问题
    - **修复文件**：`medical-record.wxml`（按钮状态）、`medical-record.js`（三重防护逻辑）、新增 `onUnload` 清理定时器防泄漏

### 2026-07-12：分包重构 & 主包瘦身

1. **主包分包化改造**：
   - 将页面从 `pages/` 主包迁移至独立分包，解决主包体积超限问题
   - 新增 5 个分包：`pkg-navigation`（地图+院内导航+科室详情）、`pkg-science`（科普列表+详情）、`pkg-profile`（个人中心+病历管理）、`pkg-auth`（认证登录）、`pkg-ai`（AI智能分诊）
   - 首页保留在主包作为统一入口，配置 `preloadRule` 预下载各分包提升加载速度

2. **路径全面迁移**：
   - 22 处页面跳转路径全部从 `/pages/xxx` 格式更新为分包绝对路径 `/pkg-xxx/xxx`
   - 涉及 7 个 JS 文件和 1 个 WXML 文件的 navigator 路由与 API 跳转

3. **工具文件归属迁移**：
   - `config/navigationConfig.js` → `pkg-navigation/config/`（导航配置随导航模块）
   - `libs/amap-wx.130.js` → `pkg-navigation/libs/`（高德SDK随地模块）
   - `utils/avatarManager.js` → `pkg-profile/utils/`（头像管理随个人中心）
   - 修复 2 处跨包引用路径（`ai-diagnosis.js`、`auth/auth.js`），改用绝对路径 `/pkg-profile/utils/avatarManager.js`

4. **代码质量修复**：
   - 清理微信开发者工具「代码质量」扫描报告的 3 项"主包未使用JS文件"警告
   - TDesign 组件库优化方案已写入文档（方案A/B）待后续实施

### 2026-07-04: 认证流程重构 & 游客模式 & 病历信息模块增强

1. **认证流程优化**：
   - Step 1 合并头像与用户名设置：支持微信昵称一键获取、手动编辑、跳过生成匿名（格式"匿名XXXXXXX"，7位随机数字）
   - 移除独立 Step 2 资料设置页，跳过后直接进入手机号绑定步骤（Step 3），流程更简洁
   - 上一步/下一步按钮改为各占 50% 宽度，布局更均衡
   - 认证完成页绿色圆圈替换为 APP LOGO 图片展示

2. **WXSS SCSS 语法兼容性修复**：
   - 修复 `auth.wxss` 中 6 处 SCSS 嵌套语法（`&::after`、`&.disabled-btn` 等）导致的编译错误
   - 全部展开为标准 CSS 独立选择器，确保微信小程序 WXSS 正常编译

3. **微信手机号快捷绑定权限处理**：
   - 新增 `getPhoneNumber:fail no permission` 错误分支捕获
   - 权限不足时提示用户「暂不支持快捷绑定，请手动输入手机号」，引导至手动输入流程

4. **游客模式实现**：
   - 退出登录后自动切换为游客模式（`isGuestMode` 标记持久化存储）
   - 游客模式下个人中心显示默认 Logo + 功能引导卡（问诊记录/收藏/病历/手机号 4 项解锁提示）
   - 游客仅可访问「关于与帮助」设置项，无法查看或操作任何用户数据
   - 游客模式下首页正常使用，不强制跳转认证页
   - 点击游客模式的「立即登录」按钮跳转回认证流程
   - 认证成功后自动清除游客模式标记，恢复完整功能

5. **图片资源统一管理**：
   - `config/imageConfig.js` 新增 `APP_LOGO` 配置项（`logo.png`）
   - 认证完成页与游客模式头像统一引用 `images.APP_LOGO`，避免硬编码 URL
   - `auth.js` 引入 `imageConfig` 并注册到页面 data 中

6. **WXML 标签结构修复**：
   - 修复 `profile.wxml` 中 `<block>` 标签跨边界闭合导致的编译错误
   - 确保 `<view class="container">` 正确包裹两个条件分支（游客模式 / 已登录），标签嵌套层级正确闭合

7. **病历信息模块增强**：
   - 新增独立手动添加/编辑病历页面（`pages/profile/medical-record/`），支持 10 个完整字段录入：
     - 就诊基本信息：就诊时间（日历选择器，不可选未来日期）、科室（下拉选择器，含 7 个口腔科室）、医生
     - 详细信息：主诉、诊断结果、治疗经过（多行文本）、用药信息（多行文本）、复诊信息、检查结果（多行文本）、医嘱（多行文本）
   - 病历详情页（`medical-record-detail`）重构为 TDesign 组件卡片式布局，区分手动添加与医院模拟两种数据来源
   - 手动添加的病历支持「修改病历」功能（仅 `isManual: true` 的记录可编辑），点击后跳转至填写页并回填已有数据
   - 详情页新增 `onShow` 自动刷新机制：从编辑页返回后自动拉取最新数据并更新显示
   - 表单校验强化：就诊时间禁止未来日期（字符串比较避免时区问题）、科室和医生为必填项
   - 分享功能完善：支持微信分享病历至好友与朋友圈，携带完整记录参数

### 2026-07-04: 科普模块视频功能

1. **科普模块新增视频支持**：
   - 科普列表页支持文章与视频两种类型展示，通过蓝色「视频」/灰色「文章」标签区分
   - 详情页根据类型条件渲染：文章展示图片 + 富文本，视频展示 `<video>` 播放器（支持控件与自动播放）
   - 列表页与详情页均完成样式适配（`.article-header`、`.article-type-tag`、`.video-wrapper` 等）

2. **新增科普视频资源**：
   - 接入 10 个口腔健康科普视频（含即拔即种、牙隐裂、趣味护牙、口腔小镇、换牙记、蛀牙大作战、夜磨牙、智齿、咬合、牙毯等主题）
   - 视频托管于腾讯云 COS，统一管理便于维护
   - 暂时隐藏"即拔即种即吃饭"视频（id=5），后续可根据需要启用

3. **视频 URL 集中配置管理**：
   - `config/imageConfig.js` 新增 `scienceVideos` 对象，所有视频路径集中定义
   - 路径与 `BASE_URL` 自动拼接，避免硬编码散落各处
   - `science.js` 与 `detail/detail.js` 统一通过 `import imageConfig` 引用，采用 ES Module 规范

### 2026-06-04: 专家数字分身实现

1. **云函数超时问题修复**：
   - `config.json` 新增 `"timeout": 60`，将云函数执行超时从默认 3 秒提升至 60 秒
   - 解决 Dify RAG API 调用时因响应耗时较长导致的 `FUNCTIONS_TIME_LIMIT_EXCEEDED` 错误

2. **键盘弹出遮挡聊天内容修复**：
   - 输入框禁用微信默认键盘推页行为（`adjust-position="{{false}}"`）
   - 输入区域改为 `position: fixed` 定位，通过 `bindkeyboardheightchange` 监听键盘高度动态上浮
   - 聊天区域同步增加底部内边距（`padding-bottom` 随键盘高度动态调整）
   - 键盘弹出后自动滚动到最新消息，确保对话内容始终可见（智能分诊和专家咨询模式均已适配）

3. **RAG 专家数字分身**：
   - 基于 Dify 平台完成知识库构建与聊天应用创建
   - 云函数 `aiDiagnosis` 实现 `expertAvatar` 模式，支持 Dify `/chat-messages` API 调用
   - 前端 AI 问诊页新增「专家咨询」模式，支持医生选择与多轮对话
   - 目前已接入种植科叶颖副主任医师数字分身，后续可扩展更多科室专家

### 2026-06-03: API 安全防护 & 老年友好模式

1. **API Key 安全保护**：
   - 新增统一云函数代理 `cloudfunctions/aiDiagnosis`，支持 `diagnosis` / `summary` / `expertAvatar` 三种调用模式
   - 所有 DeepSeek API Key 从前端硬编码迁移至云函数环境变量 (`process.env.DEEPSEEK_API_KEY`)
   - 前端通过 `wx.cloud.callFunction()` 安全调用，彻底消除 3 处高危 API Key 泄露风险
   - 同步修复 `cloudfunctions/chatAI/index.js` 的硬编码问题

2. **老年友好模式 UI**：
   - 首页新增老年模式切换开关，支持跨会话持久化存储（`wx.setStorageSync`）
   - 老年版采用大字体设计（标题 64rpx、按钮文字 56rpx），适配老花眼用户
   - 极简 2×2 四宫格布局：医院导航、院内导航、智能问诊、我的信息
   - 渐变蓝配色方案与加大触控区域，提升老年人操作体验

### 2026-03-19: 病历详情页面功能

1. **新增病历详情页面**：
   - 创建完整的病历详情展示页面，替代原有的弹窗显示
   - 包含就诊时间、科室、医生、主诉、诊断结果、治疗经过、用药信息、复诊信息等详细内容
   - 支持病历信息复制和分享功能
   - 美观的卡片式布局和响应式设计

2. **病历信息自动跳转优化**：
   - 修复病历信息点击跳转问题，确保页面正确注册和路径配置
   - 优化数据传递方式，通过index和id双重验证确保数据准确性
   - 修复WXML语法错误和缺少方法定义问题

3. **UI界面优化**：
   - 底部操作按钮样式优化，按钮大小统一且视觉效果更明显
   - 添加渐变背景、阴影效果和点击动画
   - 按钮间距和布局优化，提升用户体验

### 2026-02-06: AI问诊导航优化

1. **AI问诊导航直接跳转功能**：
   - 优化AI问诊页面导航按钮，点击后直接跳转到对应科室导航页面
   - 不再需要用户再次选择目的地，提高用户体验连贯性
   - 修复科室导航页面参数传递问题

### 2025-11-20: 新增onlyfoTJ分支，包含以下功能更新

1. **隐藏医院地图功能模块**：
   - 通过注释方式隐藏地图功能入口，保留代码内容
   - 调整首页导航布局

2. **新增个人资料模块**：
   - 创建用户个人信息管理页面
   - 支持姓名、性别、年龄、电话等信息录入
   - 提供病历记录添加和删除功能
   - 数据安全存储在本地

3. **添加AI智能分诊功能**：
   - 实现对话式智能问诊交互
   - 根据症状描述推荐合适科室
   - 提供科室推荐依据说明
   - 支持一键跳转到导航页面

4. **新增微信账号登录功能**：
   - 首次使用时弹出登录询问（可选）
   - 获取用户微信头像和昵称信息
   - 生成唯一账号名称（匿名+7位随机数字）
   - 个人信息页面显示圆形头像和账号信息
   - 确保账号数字部分不重复

5. **界面优化**：
   - 调整首页功能模块顺序（科普知识、院内导航、智能问诊、个人信息）
   - 优化个人信息页面样式和交互体验

## 项目概述

「青芽智医」是一款面向同济大学附属口腔医院的智慧医疗导诊与导航微信小程序。项目以"全生命周期口腔健康关怀"为核心理念，整合了院外路线规划、院内科室导航、AI智能分诊、健康科普和个人健康档案管理等核心能力，致力于为患者提供从"出发前问诊"到"到院后就诊"再到"离院后随访"的一站式便民医疗服务体验。小程序基于微信原生框架开发，深度集成高德地图API与人工智能技术，无需下载安装即用即走，覆盖 iOS 与 Android 双平台。

## 项目功能

### 1. 首页门户

- 轮播图展示与功能模块快捷入口布局
- 微信一键登录（可选），支持匿名账号体系
- 统一的视觉设计与交互体验（TDesign 组件库）

### 2. 地图导航（院外路线规划）

- 基于**高德地图微信小程序 SDK** 的实时定位与路线规划
- 目的地精确至同济大学附属口腔医院（上海市静安区延长中路399号）
- 支持**四种出行方式**：驾车、公共交通、步行、骑行
- 自动计算距离与预计时长，在地图上可视化绘制路线折线
- 支持语音导航提示与实时位置追踪

### 3. 院内科室导航

- 完整的医院内部楼层导航系统
- 覆盖挂号处、放射科、儿科、正畸科、牙周科、牙体牙髓病科、修复科、口腔颌面外科等科室
- 包含电梯、楼梯、通道等关键位置点的图文引导
- 支持从 AI 问诊结果一键跳转至对应科室导航页面

### 4. AI 智能分诊

- 基于 DeepSeek AI 大模型的对话式口腔疾病智能问诊
- 用户输入症状描述，AI 自动分析并推荐就诊科室
- 提供详细的推荐依据与医疗建议说明
- 保存问诊历史记录，便于回顾与管理

### 5. 口腔健康科普

- 口腔医学科普文章列表与分类浏览
- 科普文章详情阅读页
- 定期更新口腔保健知识与就医指南

### 6. 个人中心与健康档案

- **用户管理**：微信授权登录、个人信息维护（姓名、性别、年龄、联系方式）
- **病历管理**：就诊记录的新增、查看、删除；包含就诊时间、科室、医生、主诉、诊断结果、治疗经过、用药信息、复诊安排等完整字段
- **病历详情页**：独立的病历详情展示页面，支持信息复制与分享
- **数据安全**：所有用户数据通过微信本地存储加密保存

### 7. 老年友好模式（无障碍访问）

- 首页顶部提供老年模式切换开关，偏好设置跨会话持久化存储
- 老年版采用**大字体设计**（标题 64rpx、按钮文字 56rpx），适配老花眼及视力障碍人群
- 极简 **2×2 四宫格布局**：医院导航、院内导航、智能问诊、我的信息
- 渐变蓝配色方案 + 加大触控区域（padding 70rpx），提升老年人操作体验

### 8. API 安全防护体系

- 统一云函数代理层 `aiDiagnosis`，集中管理所有 AI API 调用
- 支持 `diagnosis`（智能分诊）/ `summary`（报告解读）/ `expertAvatar`（专家数字分身）三种模式
- 所有敏感 API Key 存储于云函数环境变量，前端零硬编码
- 前端仅通过 `wx.cloud.callFunction()` 安全调用，彻底消除密钥泄露风险

## 程序结构

```plaintext
Navigation/
├── app.js                          # 小程序入口文件
├── app.json                        # 全局配置（页面路由、权限声明、网络超时）
├── app.wxss                        # 全局样式
├── cloudfunctions/                 # 微信云函数
│   ├── aiDiagnosis/                # 🔒 AI 统一安全代理（P0 新增）
│   │   ├── index.js                #    支持 diagnosis / summary / expertAvatar 三种模式
│   │   ├── config.json             #    云函数配置（Node.js 18）
│   │   └── package.json            #    依赖：axios + wx-server-sdk
│   └── chatAI/                     #    AI 聊天云函数（张教授数字分身原型）
├── config/
│   ├── imageConfig.js              # 图片资源统一地址配置（腾讯云 COS 托管）
│   └── navigationConfig.js         # 院内科室导航配置（科室信息与路径数据）
├── libs/
│   └── amap-wx.130.js             # 高德地图微信小程序 SDK
├── pages/
│   ├── index/                      # 首页（功能入口 + 登录流程 + 老年模式切换）
│   │   ├── index.js / .wxml / .wxss / .json
│   ├── map/                        # 地图导航页（高德地图集成核心）
│   │   ├── map.js / .wxml / .wxss / .json
│   ├── navigation/                 # 院内导航入口页
│   │   ├── navigation.js / .wxml / .wxss / .json
│   ├── navigation/department/      # 科室导航详情页
│   │   ├── department.js / .wxml / .wxss / .json
│   ├── ai-diagnosis/               # AI 智能分诊页（通过云函数安全调用 API）
│   │   ├── ai-diagnosis.js / .wxml / .wxss / .json
│   ├── science/                    # 科普文章列表页
│   │   ├── science.js / .wxml / .wxss / .json
│   ├── science/detail/             # 科普文章详情页
│   │   ├── detail.js / .wxml / .wxss / .json
│   ├── profile/                    # 个人中心页（报告解读功能已迁移至云函数代理）
│   │   ├── profile.js / .wxml / . .wxss / .json
│   └── profile/medical-record-detail/  # 病历详情页
│       ├── medical-record-detail.js / .wxml / .wxss / .json
├── utils/
│   ├── userDataManager.js          # 用户数据持久化管理工具
│   └── avatarManager.js            # 头像管理工具
├── package.json                    # 项目依赖（TDesign 组件库）
└── project.config.json             # 微信开发者工具项目配置
```

### 技术栈

| 类别 | 技术 |
| ------ | ------ |
| 开发框架 | 微信原生小程序（WXML + WXSS + JavaScript ES6+） |
| UI 组件库 | TDesign Miniprogram（腾讯企业级组件库） |
| 地图服务 | 高德地图微信小程序 SDK（amap-wx.130） |
| 云存储 | 腾讯云 COS（图片资源托管） |
| AI 能力 | DeepSeek API（智能分诊） |
| 云计算 | 微信云开发（云函数 + 环境变量安全存储） |
| 数据存储 | wx.setStorageSync / wx.getStorageSync（本地持久化） |

### 核心模块职责

| 文件 | 职责 |
| ------ | ------ |
| `map.js`（1359行） | 高德地图 SDK 集成、多模式路线规划（驾车/公交/步行/骑行）、路线折线解析与渲染、标记点管理、语音导航 |
| `profile.js`（1118行） | 个人信息管理、病历 CRUD 操作、用户登录注册、数据校验与持久化、报告解读（已迁移至云函数代理调用） |
| `ai-diagnosis.js`（453行） | AI 对话式问诊交互、症状分析与科室推荐、问诊历史管理（API 调用已迁移至云函数代理） |
| `aiDiagnosis/index.js`（🆕新增） | **统一 API 安全代理**：支持 diagnosis / summary / expertAvatar 三种模式，环境变量密钥管理，前端零硬编码 |
| `index.js`（首页） | 功能入口路由、老年模式切换与持久化、登录流程管理 |
| `userDataManager.js`（370行） | 用户数据的本地读写封装、数据迁移与版本兼容 |
| `navigationConfig.js`（89行） | 院内各科室的图文导航配置数据 |

## 使用说明

1. **打开小程序**：在微信中搜索并打开「青芽智医」小程序，首次使用可选择微信授权登录。
2. **老年模式切换**：首页顶部提供老年模式开关，开启后显示大字体极简界面（2×2 四宫格），偏好自动保存。
3. **AI 智能分诊**：点击首页「智能问诊」入口，描述您的口腔不适症状，AI 将为您推荐合适的就诊科室及依据（API 调用经云函数安全代理，无密钥泄露风险）。
4. **前往医院**：点击首页「地图导航」，小程序将自动获取您的当前位置，规划前往同济大学附属口腔医院的最优路线（支持驾车/公交/步行/骑行四种方式）。
5. **院内导航**：到达医院后，选择目标科室即可获得院内楼层导航指引，包含图文路径说明。
6. **健康科普**：在「科普资讯」中浏览口腔医学知识文章。
7. **个人档案**：在「我的」中管理个人信息和就诊病历记录，支持随时查阅和向医生展示。

### 部署注意事项

> **云函数环境变量配置（必须）**
>
> 上传云函数后，需在微信开发者工具中为以下云函数配置环境变量：
>
> | 云函数 | 环境变量 | 说明 |
> | -------- | ---------- | ------ |
> | `aiDiagnosis` | `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
> | `aiDiagnosis` | `DIFY_API_BASE_URL`（可选） | Dify 服务地址（RAG 专家数字分身功能启用时需要） |
> | `aiDiagnosis` | `DIFY_API_KEY`（可选） | Dify 应用 API Key（RAG 专家数字分身功能启用时需要） |
> | `chatAI` | `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
>
> **部署步骤**：
>
> 1. 右键 `cloudfunctions/aiDiagnosis` → **上传并部署：云端安装依赖**
> 2. 右键 `cloudfunctions/chatAI` → **上传并部署：云端安装依赖**
> 3. 右键各云函数 → **配置** → **环境变量** → 填入上述 Key

## 待实现功能（技术债务与规划）

---

### ✅ 已完成：主包代码质量修复（2026-07-12）

- ~~`config/navigationConfig.js`~~ → 已移至 `pkg-navigation/config/`
- ~~`libs/amap-wx.130.js`~~ → 已移至 `pkg-navigation/libs/`
- ~~`utils/avatarManager.js`~~ → 已移至 `pkg-profile/utils/`，跨包引用路径已更新（`ai-diagnosis.js`、`auth/auth.js`）

---

### 📦 待实施：TDesign 组件库体积优化（分包后专项）

> **背景**：项目使用 TDesign Miniprogram 组件库（位于 `miniprogram_npm/tdesign-miniprogram/`），包含 **500+ 文件**，占用约 **2-3MB**。
>
> **当前状态**：分包已完成（路径已全部迁移），但 TDesign 组件库的优化尚未执行。以下为详细实施方案，供日后参考。

#### 方案 A：各分包相对引用（推荐，改动小）

**原理**：每个分包的 JSON 配置中，通过**相对路径**直接引用 `miniprogram_npm/tdesign-miniprogram/` 下的具体组件文件。

**路径计算示例**：

```plaintext
pkg-profile/profile/profile.json
├── 当前位置：pkg-profile/profile/profile.json
├── 目标位置：miniprogram_npm/tdesign-miniprogram/cell-group/index.js
└── 相对路径：../../../miniprogram_npm/tdesign-miniprogram/cell-group/index.js

pkg-navigation/navigation/navigation.json
├── 当前位置：pkg-navigation/navigation/navigation.json
├── 目标位置：miniprogram_npm/tdesign-miniprogram/button/index.js
└── 相对路径：../../../../miniprogram_npm/tdesign-miniprogram/button/index.js
```

**操作步骤**：

1. 检查每个分包页面的 WXML，确认实际使用了哪些 TDesign 组件
2. 将该分包内所有页面的 JSON 中 `"usingComponents"` 的组件路径从绝对路径改为**相对路径**
3. 相对层级 = 从当前分包页面位置回溯到项目根目录的 `../` 数量 + `miniprogram_npm/...`

**优缺点**：

| 优点 | 缺点 |
|------|------|
| 改动量小，只改 JSON 配置 | 各分包可能重复打包同一组件（如 t-cell 多个分包都用） |
| 不影响现有 import 语句 | 分包间组件不共享，总体积可能增加 |

#### 方案 B：独立 TDesign 分包（最优解，改动大）

**原理**：将 TDesign 创建为一个**独立的分包**（如 `pkg-tdesign`），其他分包通过**跨分包自定义组件引用**来使用。

**app.json 配置**：

```json
{
  "subpackages": [
    {
      "root": "pkg-tdesign",
      "name": "pkg-tdesign",
      "pages": []
    },
    {
      "root": "pkg-profile",
      "pages": ["profile/profile", ...]
    }
  ]
}
```

**跨包引用格式**：

```json
// pkg-profile/profile/profile.json
{
  "usingComponents": {
    "t-cell": "/pkg-tdesign/miniprogram_npm/tdesign-miniprogram/cell/index",
    "t-cell-group": "/pkg-tdesign/miniprogram_npm/tdesign-miniprogram/cell-group/index"
  }
}
```

**操作步骤**：

1. 创建 `pkg-tdesign` 空分包（无需 pages）
2. 将 `miniprogram_npm/tdesign-miniprogram/` 复制或软链接到该分包内
3. 更新所有分包页面的 JSON，使用 `/pkg-tdesign/...` 绝对路径
4. 可选：配置 `preloadRule` 预下载 pkg-tdesign

**优缺点**：

| 优点 | 缺点 |
|------|------|
| TDesign 只打包一次，所有分包共享 | 需要创建新目录 + 复制/链接组件文件 |
| 总体积最小化 | 需修改所有使用 TDesign 页面的 JSON 路径 |

#### 已知未使用组件警告（可同步清理）

以下页面注册了但实际未使用的 TDesign 组件（WXML 使用原生标签）：

| 文件 | 注册了但未使用 |
|------|---------------|
| `pkg-profile/medical-record/medical-record.json` | t-input, t-picker, t-textarea（wxml 用原生 input/picker/textarea） |

建议：从对应 JSON 的 `usingComponents` 中移除这些未使用的组件声明。

---

## 后续更新方向

### 一、AI 专家数字分身（智能化升级）—— 待开发

- 在现有 AI 普通分诊的基础上，引入**医院资深专家的 AI 数字分身**
- 用户完成初步分诊后，可进一步与专家数字分身深度对话
- 数字分身基于专家真实临床经验训练，提供更精准的就诊前准备指导（如需携带的资料、注意事项、预问诊信息采集）
- 形成"普通 AI 分诊 → 专家数字分身深化 → 到院精准对接"的三级智能服务体系

### 二、全生命周期就诊档案（深度惠民医疗）

将现有的病历管理升级为**完整的就诊伴随系统**：

1. **电子就诊包（就诊一体化）**：
   - 病历记录（已实现）→ 扩展为包含检查报告单（X光片/CT/Panoramic）、检验报告（血常规/凝血功能等）、处方信息
   - 过敏史与用药禁忌录入
   - 就诊时间线视图（历次就诊一目了然）
   - 到院后打开小程序即可向医生一键展示完整就诊档案，减少重复询问，提升诊疗效率

2. **诊前准备助手**：
   - 根据推荐科室自动生成就诊清单（如带医保卡/身份证、空腹要求、术前注意事项等）
   - 智能预约提醒与排队进度查询

3. **诊后关怀体系**：
   - 复诊自动提醒（根据医嘱设定的复诊周期）
   - 用药提醒与服药打卡
   - 术后康复指导推送（针对拔牙/种植/正畸等不同场景）
   - 定期口腔健康自测问卷与风险评估

4. **家庭口腔健康管理**：
   - 支持绑定家庭成员（老人/儿童），代为管理口腔健康档案
   - 儿童换牙期/替牙期专属追踪
   - 老年人口腔健康定期评估提醒

### 三、室内精确定位技术升级

- 接入 **Wi-Fi 指纹 / 蓝信标（Beacon）** 室内定位技术
- 实现"您距离正畸科还有15米"级别的米级精度导航
- 结合医院建筑平面图提供实时位置追踪与偏航纠正

### 四、平台与服务拓展

- **后端云服务搭建**：将本地存储迁移至云端，支持多设备同步、数据备份与隐私加密
- **官方配套网站**：建设医院科室介绍、专家排班、在线预约等 Web 端服务
- **医保对接**：探索与医保系统的接口打通，实现费用预估与医保结算查询
- **社区健康联动**：联合周边社区卫生服务中心，构建"社区初筛 → 专科转诊 → 康复回归"的区域口腔健康闭环
