# DexAtlas · 灵巧操作术语图谱

以全屏 3D 图谱探索技术的工程位置与概念关系。当前用 22 个词条、32 条概念关系验证界面，内容仍是研究样例。

项目与版本备份仓库：[suyoutzy/DexAtlas](https://github.com/suyoutzy/DexAtlas)。本地 `main` 跟踪 `origin/main`，临时文件与 `node_modules/` 不纳入版本备份。

当前版本 **0.2**。`v0.1` 保留初始三维原型；0.2 固定工程骨架，工程使用 C3 HTML 标签，术语使用 C2 文字精灵，画布只显示节点名称。

## 本地预览

已生成的静态资源可直接通过 HTTP 预览：

```powershell
npm start
```

打开 <http://127.0.0.1:4173/>。也可使用 `python -m http.server 4173 --bind 127.0.0.1`。JSON 通过异步请求读取，请勿直接双击 HTML。

修改源码后使用 Node.js 20+ 构建：

```powershell
npm ci
npm run build
```

依赖版本由 `package-lock.json` 锁定，esbuild 将 Three.js、3D Force Graph 与 three-spritetext 打包到本地 `assets/`；运行时不请求第三方 CDN。

## 浏览与阅读

- 工程骨架默认从左到右排列：目标、系统、方法、运行、评估、达成；三个方法入口并列。工程节点坐标固定，拖动不会改变脉络；拖动画布仍可整体旋转，术语节点仍可自由拖动。左右顺序指默认镜头，旋转后随观察方向改变。
- 工程节点与流程线统一使用暖金色；C3 HTML 短标签带阶段编号并进行屏幕避让。术语保留青蓝紫粉分组色，使用同一字体系列的 C2 三维文字精灵。
- 滚轮缩放，点击术语约 600 毫秒聚焦，再查看按实际关系分组的浮动卡片。
- 相邻卡片先阅读；“以此词为中心”继续探索。关闭阅读卡回到局部关系，再次关闭保留当前镜头。
- 右侧工具栏提供搜索、节点名称开关、查看全图和设置。名称开关默认关闭，工程短名称保留；悬停显示当前节点与直接连接节点的名称，聚焦术语保留自身名称。开启时显示所有节点名称。
- 画布不显示关系文字；点击连接仍可阅读完整语义与出处，局部关系卡片上的关系说明也保留。
- 标签优先避让工程名称；视口确实放不下时暂不绘制无法安放的名称，可缩放或搜索定位，避免文字互相覆盖。
- 悬停突出节点、邻居及连接，仅高亮连线上有粒子；没有方向箭头。关系阅读卡保留双方顺序、语义和出处。
- 查看全图主动清除聚焦并取景；加载、布局结束及窗口变化不触发取景。发光默认 0，刷新恢复默认。
- 搜索支持中文、英文、缩写与别名；`/` 打开搜索，方向键选择，Enter 定位，Esc 分层退出。浏览器后退与页面返回保留术语上下文。
- URL hash 可直接访问术语或工程环节。手机采用纵向关系卡与底部阅读面板；遵循系统减少动画偏好。
- 数据加载失败可重试；没有 WebGL 时仍提供搜索、词条列表、关系和来源阅读。

## 数据与实现

| 文件 | 职责 |
| --- | --- |
| `data/glossary.json` | 原始 22 个词条的独立副本；ID 不变。 |
| `data/annotations.json` | 32 条有出处的概念关系与沿革依据；保留历史论文案例数据，首页不使用该案例。 |
| `data/framework.json` | 9 个工程导航节点、13 条流程连接、29 个显式术语用途及依据。 |
| `src/atlas-model.mjs` | 三类连接、唯一术语节点、共用标签规则与直接链接解析。 |
| `src/model.mjs` | 搜索和概念邻域等可复用的数据逻辑。 |
| `src/graph-scene.mjs` | Orbit 相机、力导向布局、文字精灵、悬停与可选发光。 |
| `src/layout.mjs` | 工程骨架固定坐标、方法分支、术语初始位置与工程拖动约束；不生成技术关系。 |
| `src/stage-labels.mjs` | C3 HTML 工程标签的相机投影与屏幕避让；不修改节点坐标。 |
| `src/app.mjs`、`styles.css` | 搜索、历史、关系浮层、阅读与响应式界面。 |

工程导航为“定义目标与验收条件 → 建立系统与接口 → 构建操作方法 → 部署与闭环运行 → 评估与迭代 → 达成验收条件”。方法构建提供设计与优化、从示范构建、从交互构建三个可组合入口，评估可反馈至方法构建。

该导航参考 [MIT Robotic Manipulation](https://manipulation.mit.edu/)、[LeRobot](https://huggingface.co/docs/lerobot/il_robots) 和 [Isaac Lab](https://isaac-sim.github.io/IsaacLab/main/source/overview/core-concepts/task_workflows.html) 归纳，不宣称统一标准，也不表示所有技术组合都已实证。仿真、采集、训练按方法说明，不作为所有路线的必经环节。

一个术语在全图只有一个节点，可被多个工程环节引用。`flow` 表示工程输入输出，`usage` 表示环节使用术语，`concept` 表示术语间概念关系。`from / to` 是记录方向，`label / explanation / evidence` 保存含义与出处。力导向距离及分类配色不生成技术关系；布局坐标不写入内容分类。沿革标签不等于性能或成熟度评分，依据不足时显示未评估。

## 验证

```powershell
npm test
npm run test:browser
```

浏览器检查使用开发环境已有的 Playwright 与 Chrome；`PLAYWRIGHT_MODULE` 可指定模块绝对路径，`PLAYWRIGHT_CHANNEL` 选择通道，`PREVIEW_URL` 指定预览地址。额外设置 `PREVIEW_SUBPATH_URL` 可检查仓库子路径，例如 `http://127.0.0.1:4174/DexAtlas/`，该地址需由父目录 HTTP 服务提供。网站运行不依赖测试工具。

测试覆盖规范节点、关系出处、搜索、预览与切换中心、返回、控制按钮、直接链接、真实 WebGL 交互、失败重试、无 WebGL 阅读、22 个词条的桌面与手机布局、200% 文字和减少动画。截图在 `.work/screenshots/`。当前 31 个节点的测试不代表较大规模图谱的性能结论。

0.2 额外验证工程节点顺序及拖动锁定、三个入口并列、Orbit 旋转、HTML 标签避让、悬停邻居名称和关系文字始终关闭。

## GitHub Pages

本轮只做本地预览。以后发布时运行构建，将 `index.html`、`styles.css`、`favicon.svg`、`assets/`、`data/` 和 `.nojekyll` 放入发布根目录。相对资源路径与 hash 状态适用于仓库子路径；发布不需要 `node_modules/`、测试及 `.work/`。依赖许可证随构建保存在 `assets/THIRD_PARTY_LICENSES.txt`。
