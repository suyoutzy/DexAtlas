# DexAtlas 来源与权威性评估

## 这份文档能证明什么

核查日期：2026-10-21。内容库 1.0.0，本地待发布。本文记录选用理由、实际核查版本和证据边界，配合每条定义或关系中的章节定位阅读。

正式期刊和会议的出版记录有助于确认出处；教材作者正文有助于核对基础定义；算法原文说明具体方法；项目官方文档说明实际接口或实现。作者机构、GitHub 星数、论文年份都不能单独证明一条关系正确。

本轮完成的是编辑核查，不是外部同行评审，也不是截至 2026 年的穷尽检索。reviewed 表示已按本项目规则对照来源；自动校验只检查结构与引用完整性，不能证明科学命题为真。

## 主要资料与权威依据

| 资料 | 可核查依据 | 本轮使用方式与边界 |
| --- | --- | --- |
| [Modern Robotics 作者站](https://hades.mech.northwestern.edu/index.php/Modern_Robotics) | Lynch / Park；Cambridge 2017，作者提供 2019 修订一版版本说明。 | 使用配套章节逐字稿核对构型、运动学、接触力学；不把网页的新访问日期当作新版教材。 |
| [Kroemer 等，操作学习综述](https://jmlr.org/papers/v22/19-804.html) | JMLR 22(30):1–82，2021；期刊原站全文有编辑及修订记录。 | 用于问题、表示和经典方法；不作为 2026 年新模型覆盖完整的证据。 |
| [An 等，灵巧操作模仿学习综述](https://doi.org/10.1109/TASE.2025.3646183) | IEEE TASE 23:1760–1792，2026；Crossref DOI 元数据与发表记录可查。 | 正文核查使用 arXiv 2504.03515v5（2025-12-17）；章节按 v5，不混用期刊分页。 |
| [具身灵巧操作近期综述](https://doi.org/10.1109/MRA.2025.3642671) | IEEE Robotics & Automation Magazine 33(1):24–38，2026-03。 | 仅核实发表元数据；未通读正文，不用于任何正式词条或连线的依据。 |
| [MIT Robotic Manipulation](https://manipulation.mit.edu/) | Russ Tedrake 作者课程；站点声明 Fall 2026 更新。 | 核对规划、几何感知和机器人接口；工作讲义不是正式标准，局部 TODO 不当作完整技术论证。 |
| [MIT Underactuated Robotics](https://underactuated.mit.edu/) | 本轮使用的 intro / trajopt / sysid 页面标注 Spring 2024。 | 用于欠驱动、MPC、辨识基础；不能泛称全部 MIT 页面已在 2026 年更新。 |
| [Khatib 1987 操作空间控制原文](https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf) | IEEE Journal of Robotics and Automation RA-3(1):43–53；DOI 10.1109/JRA.1987.1087068。 | 实际查看扫描正文 pp.43–46，§II–III 与式(8)、(14)、(17)–(18)，用于末端动力学和雅可比关系。 |
| [robomimic 官方文档](https://robomimic.github.io/docs/) | 页面标注 0.5；有 BC、BC-RNN、BC-Transformer、Diffusion Policy 实现说明。 | 证明框架中存在相应实现，不证明工业成熟、平台通用或当前最优。 |
| [LeRobot ACT 官方文档](https://huggingface.co/docs/lerobot/act) | 原论文团队之外的框架提供 ACT 训练与使用入口。 | 与 ACT 原文交叉核查“已有复用”；main 页面是核查日快照，未锁定历史 commit。 |

## 经典资料为什么保留，新方法如何证明仍有价值

基础定义与最新性能是不同问题。构型空间、雅可比、摩擦锥、力闭合、POMDP 等可由早期教材或原文定义；目前可查的课程和实现提供仍可学习和使用的例子，不能据年份直接判断过时。

PPO 与 SAC 的定义分别按原论文和官方算法说明核对。Shadow Hand 原文提供 PPO 的具体操作实例；SAC 作为另一种算法选项，不被错误加入 Shadow 论文路线。Spinning Up 是 2018 年教学项目，不作为 2026 年算法流行度统计。

ACT（RSS 2023）与 LeRobot 实现交叉核对；Diffusion Policy（RSS 2023）与 robomimic 实现交叉核对。RT-2（2023）和 OpenVLA（2024）支持 VLA 的不同代表实现。这里只据此说明已有研究或复用，不宣称已经覆盖所有 2025–2026 新模型。

“近年发展，已有复用”是相对经典方法的阅读标签；2023 是所列代表研究的年份，不是该大类最早起源，也不表示其技术成熟度。其余词条以“基础概念或经典方法”作粗标签，不编造首创年代；边界含混者后续可改为未评估。

## 每条引用如何使用

glossary.json 的 sources 是唯一来源登记表。术语 references 提供入口，claim_evidence 分别记录定义、作用、应用、当前价值的定位；定义为中文转述，其他三类标注 editorial_synthesis，含有条件的编辑归纳。不能把工程例子当作论文逐字结论。

概念连接记录两端、predicate、解释、scope、context 和 evidence。general 是通用命题，case 限于具体实现，comparison 是按所列定义作的比较。review.basis 区分直接说明、基于定义的归纳和编辑比较。

工程 usage 是“此处可以怎样用”的显式映射，并非术语所属学科或必经步骤；flow 的六阶段与顺序全部标注 editorial_navigation。教材和框架提供能力背景，没有一篇来源为整套六阶段背书。

metadata_only 仅证明资料发表信息；校验脚本拒绝用它证明词条、沿革或关系。来源版本、checked_on 与命题的适用条件一起保留，后续修改不会因空间位置或分类自动增边。

## 本轮未直接采用的资料与访问限制

Awesome Dexterous Manipulation、Awesome Learning for Manipulation、Awesome Robotics Manipulation、Embodied AI Starter Map 和在线 glossary 可用于发现候选文献；它们不是每个定义或每条连线的最终证明。最终连接回到原始正文、教材或官方实现。

Springer Handbook of Robotics（第 2 版，2016）和 Sutton / Barto 的 Reinforcement Learning（第 2 版，2018）保留为背景候选。本轮未以未核实的具体章节为 64 个词条新增证据，不把出版社元数据核对写成通读。

IEEE 页面存在访问限制时，用 DOI / Crossref 核实出版信息，再单独标明实际读到的作者公开正文。TASE 使用 arXiv v5；RAM 近期综述仅保留 metadata_only。

Ha 等本体感知定义已核对出版商正文与作者 arXiv v2 的 §3.2.1。出版商 PDF 在独立请求中返回 403，阅读入口改为作者公开版；不混用版本分页。

Diffusion Policy 旧项目域名本轮返回 404，现用 RSS 正式论文；diffusion_policy_project 是为兼容旧数据保留的来源 ID。Isaac Lab 的旧工作流地址已迁移；它只作背景候选，本轮不借迁移页面证明所有工程顺序。

动态官方文档记录核查日与页面版本；未锁定 commit 的 README 明示限制。引用可打开不等于内容已评审；访问受限也不等于论文不存在。

## 后续维护规则

先审词条定义，再审关系命题；新增关系必须单独提交定位和适用范围。综述中相邻出现、同属一类或常见于同一系统，不足以生成 uses 或 is_a。

来源变更、版本漂移或失效时，先标记需复核；不能直接替换网址后沿用旧结论。每轮扩充记录增删、旧 ID 兼容性、访问日期和无法核实项。

不维护“最先进”或“最常用”的永久标签。若需要时效排名，应另设有明确截止日期、任务、平台和指标的比较；不能从一篇综述推断行业现状。

## 完整来源目录

共 52 项，以下登记与数据同源。只有标注“正文已核查”的条目可以作为内容证据。

### dexterous_il_survey

[An et al. — Dexterous Manipulation Through Imitation Learning: A Survey](https://arxiv.org/html/2504.03515v5)

- **类型**：正式期刊综述的作者公开版本
- **实际版本**：arXiv v5, 2025-12-17；IEEE TASE 23:1760–1792, 2026
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：IEEE TASE 正式记录 DOI 10.1109/TASE.2025.3646183；正文核查使用作者 arXiv v5。
- **支持边界**：章节号引用 arXiv v5，不混用期刊分页；作者分类不视为统一标准。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1109/TASE.2025.3646183

### in_hand_rl

[Andrychowicz et al. — Learning Dexterous In-Hand Manipulation](https://arxiv.org/html/1808.00177v5)

- **类型**：原始研究全文；另有 IJRR 正式刊载
- **实际版本**：arXiv v5, 2019-01-18；IJRR 39(1), 2020
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：IJRR DOI 10.1177/0278364919887447；可查任务、架构、实机结果和附录。
- **支持边界**：Shadow Hand 重定向案例；不证明所有灵巧手路线或现代性能排名。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1177/0278364919887447

### force_closure_textbook

[Modern Robotics, 12.2.3 — Force Closure](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-3-force-closure/)

- **类型**：教材配套原文
- **实际版本**：Modern Robotics 2017；作者修订一版 2019；章节逐字稿
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### ik_textbook

[Modern Robotics, 6.2 — Numerical Inverse Kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/6-2-numerical-inverse-kinematics-part-1-of-2/)

- **类型**：教材配套原文
- **实际版本**：Modern Robotics 2017；作者修订一版 2019；章节逐字稿
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### impedance_notes

[MIT Robotic Manipulation — Manipulator Control](https://manipulation.mit.edu/force.html)

- **类型**：课程教材
- **实际版本**：MIT Robotic Manipulation；Fall 2026 网站版本
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### dex_retargeting

[Dex Retargeting — official repository](https://github.com/dexsuite/dex-retargeting)

- **类型**：官方实现
- **实际版本**：官方仓库 README / Examples；核查日默认分支，未锁定历史 commit
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### rl_concepts

[Spinning Up — Key Concepts in RL](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)

- **类型**：官方算法教学文档
- **实际版本**：Spinning Up 教学文档；2018 年项目，核查日可访问的 latest 页面
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### offline_rl_review

[Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems](https://arxiv.org/html/2005.01643v3)

- **类型**：教程与综述预印本
- **实际版本**：arXiv v3, 2020-11-01
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### robomimic_algorithms

[robomimic — Implemented Algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)

- **类型**：官方框架文档
- **实际版本**：robomimic 0.5 文档；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### dagger_paper

[A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)

- **类型**：原始论文
- **实际版本**：AISTATS / PMLR 15:627–635, 2011
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### ppo_paper

[Proximal Policy Optimization Algorithms](https://arxiv.org/pdf/1707.06347)

- **类型**：原始预印本；有独立后续实现
- **实际版本**：arXiv v2, 2017-08-28
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### ppo_docs

[Spinning Up — Proximal Policy Optimization](https://spinningup.openai.com/en/latest/algorithms/ppo.html)

- **类型**：官方算法文档
- **实际版本**：Spinning Up 教学文档；2018 年项目，核查日可访问的 latest 页面
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### sac_paper

[Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)

- **类型**：原始论文
- **实际版本**：ICML / PMLR 80:1861–1870, 2018
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### sac_docs

[Spinning Up — Soft Actor-Critic](https://spinningup.openai.com/en/latest/algorithms/sac.html)

- **类型**：官方算法文档
- **实际版本**：Spinning Up 教学文档；2018 年项目，核查日可访问的 latest 页面
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### transformer_paper

[Vaswani et al. — Attention Is All You Need](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)

- **类型**：正式会议论文
- **实际版本**：NIPS 2017；§3
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：正式会议原站全文及元数据。
- **支持边界**：原任务为序列建模；机器人用途由 ACT / robomimic 等另证。
- **核查日期**：2026-10-21

### robomimic_transformers

[robomimic — Training Transformers](https://robomimic.github.io/docs/tutorials/training_transformers.html)

- **类型**：官方框架文档
- **实际版本**：robomimic 0.5 文档；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### diffusion_policy_project

[Chi et al. — Diffusion Policy: Visuomotor Policy Learning via Action Diffusion](https://www.roboticsproceedings.org/rss19/p026.pdf)

- **类型**：正式会议论文
- **实际版本**：RSS 2023；§II–III 方法，§IV 性质，§V Evaluation
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：RSS 原站正式全文，DOI 10.15607/RSS.2023.XIX.026。
- **支持边界**：原项目域名本轮返回 404，改用正式全文；CNN/Transformer 是不同实现选项。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.15607/RSS.2023.XIX.026

### robomimic_diffusion

[robomimic — Training Diffusion Policy](https://robomimic.github.io/docs/tutorials/training_diffusion_policy.html)

- **类型**：官方框架文档
- **实际版本**：robomimic 0.5 文档；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### act_paper

[Zhao et al. — Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware](https://www.roboticsproceedings.org/rss19/p016.pdf)

- **类型**：正式会议论文
- **实际版本**：RSS 2023；§IV / §V
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：RSS 原站正式全文，包含 ACT 架构、动作分块及实机验证。
- **支持边界**：ALOHA 使用双臂夹爪；不据此宣称灵巧多指手性能已验证。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.15607/RSS.2023.XIX.016

### rt2_paper

[RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control](https://arxiv.org/html/2307.15818v1)

- **类型**：代表性论文
- **实际版本**：arXiv v1, 2023-07-28
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### openvla_project

[Kim et al. — OpenVLA: An Open-Source Vision-Language-Action Model](https://arxiv.org/html/2406.09246v1)

- **类型**：原始论文作者公开版本
- **实际版本**：arXiv v1, 2024-06-13
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### domain_randomization_paper

[Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/html/1703.06907v1)

- **类型**：代表性论文
- **实际版本**：arXiv v1, 2017-03-20
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者原始研究或正式论文公开版本；以正文定位限定结论。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### pipeline_mit

[MIT Robotic Manipulation — Perception, Planning, and Control](https://manipulation.mit.edu/)

- **类型**：教材与课程
- **实际版本**：网站声明 Fall 2026 更新；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### pipeline_lerobot

[LeRobot — Imitation Learning on Real-World Robots](https://huggingface.co/docs/lerobot/il_robots)

- **类型**：官方实现文档
- **实际版本**：LeRobot main 教程；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者、课程或项目官方发布；可追溯具体说明。
- **支持边界**：只支持引用定位中的命题，不证明最新最优、所有平台适用或产业成熟。
- **核查日期**：2026-10-21

### review_jmlr

[Kroemer, Niekum & Konidaris — A Review of Robot Learning for Manipulation](https://jmlr.org/papers/volume22/19-804/19-804.pdf)

- **类型**：正式期刊综述
- **实际版本**：JMLR 22(30):1–82, 2021
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：JMLR 原站全文含投稿、修订、发表和编辑记录。
- **支持边界**：用于问题形式化与经典方法，不能单独代表 2026 年模型现状。
- **核查日期**：2026-10-21

### mr_configuration

[Modern Robotics §2.1 — Configuration and Degrees of Freedom](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-1-degrees-of-freedom-of-a-rigid-body/)

- **类型**：教材配套原文
- **实际版本**：2017 教材；作者说明的修订一版 2019
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：Lynch 与 Park，Cambridge University Press；作者配套讲解与逐字稿。
- **支持边界**：刚体模型与配置空间定义；不把坐标数、约束数和驱动数混为一谈。
- **核查日期**：2026-10-21

### mr_fk

[Modern Robotics §4.1.1 — Forward Kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/4-1-1-product-of-exponentials-formula-in-the-space-frame/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§4.1.1
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：教材作者发布的公式推导与逐字稿。
- **支持边界**：此页推导开链刚体运动学；柔性、标定误差另行处理。
- **核查日期**：2026-10-21

### mr_jacobian

[Modern Robotics §5.1.1 — Space Jacobian](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§5.1.1
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：教材作者给出关节速度到末端 twist 的映射。
- **支持边界**：雅可比随坐标和速度表示改变；须检查奇异性。
- **核查日期**：2026-10-21

### mr_wrench

[Modern Robotics §3.4 — Wrenches](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-4-wrenches/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§3.4
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：教材作者给出力矩与力的六维表示及坐标变换。
- **支持边界**：力矩参考点、坐标系与分量顺序必须一致。
- **核查日期**：2026-10-21

### mr_friction

[Modern Robotics §12.2.1 — Friction](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-1-friction/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§12.2.1
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：逐字稿明确库仑摩擦近似、摩擦锥与 wrench cone。
- **支持边界**：干摩擦近似；不能把理想摩擦锥当成所有真实接触的精确规律。
- **核查日期**：2026-10-21

### mr_form

[Modern Robotics §12.1.7 — Form Closure](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-1-7-form-closure/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§12.1.7
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：明确一阶形闭合、一般形闭合和保守性。
- **支持边界**：一阶检验未通过不等于不存在高阶形闭合。
- **核查日期**：2026-10-21

### mr_inverse_dynamics

[Modern Robotics §8.3 — Newton–Euler Inverse Dynamics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-3-newton-euler-inverse-dynamics/)

- **类型**：教材配套原文
- **实际版本**：修订一版；§8.3
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者给出给定运动与外载计算关节力矩的算法。
- **支持边界**：模型、惯量与外力估计决定准确性。
- **核查日期**：2026-10-21

### mit_robot

[MIT Robotic Manipulation — Let’s Get You a Robot](https://manipulation.mit.edu/robot.html)

- **类型**：作者课程讲义
- **实际版本**：网站声明 Fall 2026 更新；核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：Russ Tedrake 的 MIT 操作课程，公开讨论驱动接口、手与传感器。
- **支持边界**：工作讲义，不是硬件参数数据库；引用具体接口假设。
- **核查日期**：2026-10-21

### mit_pose

[MIT Robotic Manipulation — Geometric Pose Estimation](https://manipulation.mit.edu/pose.html)

- **类型**：作者课程讲义
- **实际版本**：Fall 2026 网站版本；Geometric Pose Estimation
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：明确利用观测估计物体位姿，说明已知几何、遮挡与替代表示的边界。
- **支持边界**：显式位姿不是所有策略的必需中间量。
- **核查日期**：2026-10-21

### mit_planning

[MIT Robotic Manipulation — Motion Planning](https://manipulation.mit.edu/trajectories.html)

- **类型**：作者课程讲义
- **实际版本**：Fall 2026 网站版本；Motion Planning
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：含逆运动学、运动学轨迹优化、碰撞约束及局部极小值讨论。
- **支持边界**：运动学规划不自动保证动态接触任务可执行。
- **核查日期**：2026-10-21

### mit_underactuation

[MIT Underactuated Robotics — Fully-actuated vs Underactuated Systems](https://underactuated.mit.edu/intro.html)

- **类型**：作者课程讲义
- **实际版本**：页面声明 Spring 2024；Definition 与输入约束
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者从可实现广义加速度定义驱动充分性，而不只比较电机数量。
- **支持边界**：本页非 2026 更新证明；机构常见的驱动数解释只是特例。
- **核查日期**：2026-10-21

### mit_trajopt

[MIT Underactuated Robotics — Trajectory Optimization](https://underactuated.mit.edu/trajopt.html)

- **类型**：作者课程讲义
- **实际版本**：页面声明 Spring 2024；Model-Predictive Control
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：给出状态测量、有限时域优化、首动作执行再规划的 MPC 配方。
- **支持边界**：MPC 是基于模型的闭环优化；与仅有滚动动作执行区分。
- **核查日期**：2026-10-21

### mit_sysid

[MIT Underactuated Robotics — System Identification](https://underactuated.mit.edu/sysid.html)

- **类型**：作者课程讲义
- **实际版本**：页面声明 Spring 2024；Multibody Dynamics / Experiment Design
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：从输入输出数据拟合模型，讨论参数可辨识性与激励条件。
- **支持边界**：拟合准确不自动证明参数真实或接触外推可靠。
- **核查日期**：2026-10-21

### grasp_notes

[Nima Fazeli — Introduction to Manipulation: Grasp Analysis](https://nima-fazeli.github.io/manipulation/mechanics/grasp-analysis.html)

- **类型**：作者课程讲义
- **实际版本**：Grasp Analysis / Grasp Matrix
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：教师公开课程笔记，正文推导接触力到物体 wrench 的矩阵，并指向 Springer 抓取章节。
- **支持边界**：刚体、点接触与库仑摩擦假设；不是所有软接触的模型。
- **核查日期**：2026-10-21

### impedance_review

[Abu-Dakka & Saveriano — Variable Impedance Control and Learning: A Review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)

- **类型**：正式期刊综述
- **实际版本**：Frontiers in Robotics and AI 7:590681, 2020
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：出版页面列出编辑、审稿人、接收日期与 DOI；正文可访问。
- **支持边界**：用于顺应、阻抗/导纳及策略组合；不作 2026 进展排名。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.3389/frobt.2020.590681

### pomdp_review

[Kaelbling, Littman & Cassandra — Planning and Acting in Partially Observable Stochastic Domains](https://cs.brown.edu/courses/csci2951-k/papers/kaelbling98.pdf)

- **类型**：正式期刊论文的高校公开版本
- **实际版本**：Artificial Intelligence 101:99–134, 1998
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：正文第 3 节定义 POMDP、观测与 belief state；正式期刊 DOI 可核查。
- **支持边界**：基础形式化来源，不能代表当前求解器或机器人实机水平。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1016/S0004-3702(98)00023-X

### pytorch_rnn

[PyTorch — RNN](https://docs.pytorch.org/docs/2.14/generated/torch.nn.RNN.html)

- **类型**：官方框架文档
- **实际版本**：PyTorch 2.14；RNN 定义与公式
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：项目原站的循环隐藏状态公式与接口。
- **支持边界**：nn.RNN 是 Elman 网络实现，不能代表全部 RNN 变体。
- **核查日期**：2026-10-21

### pytorch_conv

[PyTorch — Conv2d](https://docs.pytorch.org/docs/2.14/generated/torch.nn.Conv2d.html)

- **类型**：官方框架文档
- **实际版本**：PyTorch 2.14；Conv2d 定义与公式
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：项目原站的二维卷积/互相关层公式、权重与输入输出。
- **支持边界**：卷积层只是 CNN 的组成；机器人视觉用途另以原论文为据。
- **核查日期**：2026-10-21

### slip_fusion

[Li, Dong & Adelson — Slip Detection with Combined Tactile and Visual Information](https://arxiv.org/html/1802.10153v1)

- **类型**：原始论文公开版本
- **实际版本**：arXiv v1, 2018-02-27
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者正文给出双模态输入、CNN/LSTM 模型和抓取实验。
- **支持边界**：正文公开版支持具体融合实例；本轮不将其宣传为当前最优或普遍精度。
- **核查日期**：2026-10-21

### asymmetric_paper

[Pinto et al. — Asymmetric Actor Critic for Image-Based Robot Learning](https://www.roboticsproceedings.org/rss14/p08.pdf)

- **类型**：正式会议论文
- **实际版本**：RSS 2018；§IV-A 方法，§IV-C 随机化，§V-B 实机评估
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：RSS 原站全文明确 actor 使用图像、critic 训练时使用完整状态。
- **支持边界**：特权输入仅限训练中的 critic；不能让部署策略偷用实机不可得真值。
- **核查日期**：2026-10-21

### lerobot_act

[LeRobot — ACT (Action Chunking with Transformers)](https://huggingface.co/docs/lerobot/act)

- **类型**：官方框架文档
- **实际版本**：main 文档，核查日快照
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：原方法之外的框架实现复用；与原论文交叉核对。
- **支持边界**：当前可查实现不证明所有平台已验证，不把页面存在当作最近发布日。
- **核查日期**：2026-10-21

### mujoco_contact

[MuJoCo — Computation](https://mujoco.readthedocs.io/en/stable/computation/)

- **类型**：官方仿真器文档
- **实际版本**：stable 页面；Soft contact model
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：项目说明接触、约束与求解器模型，并明确其特有近似。
- **支持边界**：MuJoCo 接触模型是数值建模选择，不等于精确真实物理。
- **核查日期**：2026-10-21

### recent_mra

[The Developments and Challenges Toward Dexterous and Embodied Robotic Manipulation: A Survey](https://doi.org/10.1109/MRA.2025.3642671)

- **类型**：正式期刊综述的元数据
- **实际版本**：IEEE RAM 33(1):24–38, March 2026
- **核查状态**：仅发表元数据
- **权威依据**：IEEE 与 Crossref 登记题名、卷期、页码、DOI 一致。
- **支持边界**：本轮只核查发表元数据；不用于证明具体术语定义或连线。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1109/MRA.2025.3642671

### proprioception_review

[Ha et al. — Learning-based legged locomotion: State of the art and future perspectives](https://arxiv.org/html/2406.01152v2)

- **类型**：正式期刊综述的作者公开版本
- **实际版本**：arXiv v2, 2024-11-22；IJRR 44(8):1396–1427, 2025
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：期刊出版记录与作者公开正文均已核查，§3.2.1 明确定义自身状态观测。
- **支持边界**：出版商下载链接偶有 403，改用已核对同一定义的作者 v2；只借用通用定义，不外推足式实验。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1177/02783649241312698

### proprioception_manipulation

[Lips & wyffels — Revisiting Proprioceptive Sensing for Articulated Object Manipulation](https://arxiv.org/html/2305.09584v1)

- **类型**：原始研究预印本
- **实际版本**：arXiv v1, 2023-05-16；§I / §II
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：作者公开正文给出 UR3e、平行夹爪与本体反馈的开柜实现。
- **支持边界**：定性原型、人工给定抓取；滑移可使估计失效，不作通用性能证据。
- **核查日期**：2026-10-21

### khatib_osc

[Khatib — A Unified Approach for Motion and Force Control of Robot Manipulators: The Operational Space Formulation](https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf)

- **类型**：正式期刊论文的作者公开版本
- **实际版本**：IEEE Journal of Robotics and Automation RA-3(1):43–53, 1987；§II–III
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：原论文从末端任务坐标构造动力学与控制；作者实验室提供全文。
- **支持边界**：基础控制框架；不据此主张任意机器人开放所需接口或当前性能排名。
- **核查日期**：2026-10-21
- **DOI**：https://doi.org/10.1109/JRA.1987.1087068

### covariate_shift_definition

[Sugiyama, Krauledat & Müller — Covariate Shift Adaptation by Importance Weighted Cross Validation](https://jmlr.org/papers/v8/sugiyama07a.html)

- **类型**：正式期刊论文
- **实际版本**：JMLR 8(35):985–1005, 2007；Abstract / §1
- **核查状态**：正文已核查（限引用定位）
- **权威依据**：期刊原站明确区分输入分布变化与不变的条件输出分布。
- **支持边界**：用于标准统计定义；序贯机器人模仿学习的应用另以 DAgger 为据。
- **核查日期**：2026-10-21
