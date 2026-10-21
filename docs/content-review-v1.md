# DexAtlas 内容库 1.0.0 核查记录

日期：2026-10-21。开发分支，待网站发布；前端仍为 0.2.4。

本轮共 64 个词条（原有 22 个重审，新增 42 个）、101 条概念关系、54 条环节用途，以及 13 条编辑性工程流程。原有 22 个术语 ID 和 32 个概念关系 ID 保留；含义过强的旧连接已修正。来源与边界见 [权威性文档](source-authority.md)，机器可读变更表见 [content-audit.json](../data/content-audit.json)。

## 如何核查

第一轮按教材、综述及官方实现收集与去重；第二轮对照正文检查定义、两端概念、方向、适用范围和工程位置。既审旧样例，也审新增命题。reviewed 是编辑核查状态，不是外部学者认证；自动测试只验证引用、端点、兼容性和交互。

技术类型与显示分类分别记录。算法、学习范式、数据设置、模型架构和研究问题不共用一棵上下位树。分组仅帮助导航，真实连接由独立关系记录表达。

最终独立审查后的修正：

- **asymmetric_actor_critic**：方法改为 RSS2018 §IV-A，随机化 §IV-C，实机 §V-B；Shadow 应用另挂 in_hand_rl §4.1 / §6。
- **diffusion_policy**：§II-C 观测条件化，§III-B Visual Encoder，§V-A 数据与评估；不将 §IV 性质说明写成实验章节。
- **action_chunking**：ACT 动作分块与时间融合消融定位为 §VI-A，不称为附录。
- **source_registry**：primary_source_ids 显式登记关于面板来源；分类 act_code 改引 lerobot_act；校验覆盖元数据来源数组。
- **relation_types**：用当前谓词释义替换旧兼容类型表，检查主关系和派生关系的类型一致。

章节定位以实际原文复核；自动测试用于发现悬空来源、类型矛盾和页面回归，不用固定字符串断言代替文献核查。

## 本轮关键修正

- 阻抗控制与策略：撤销“固定属于不同层次”的旧断言，改为控制律可参数化为可学习交互策略，定位 impedance_review §4.3。
- 离线 RL 与异策略：前者约束训练能否继续采集环境数据，后者描述行为策略与目标策略关系，不能等同。
- ACT 与动作分块：前者为具体方法，后者为可复用的序列表示；动作分块与 MPC 不等价。
- 力闭合：注明接触/摩擦假设和实际夹紧力限制，不把几何条件当作任务必然成功。
- 本体观测：Shadow 原文 §3.1 明确关节角反馈用于下层控制、未提供给策略；不再用它证明策略使用关节角。通用定义改引明确的自身状态感知章节。
- 工程用途：手内操作连到目标和评估，分别表示任务规格与任务表现检查，不是重复节点或上下位关系。

## 词条目录

### 操作任务与能力

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| dexterous_manipulation | 灵巧操作 | 研究问题与操作能力 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：arXiv v5 §II-A：definition and tasks；§IV end-effectors |
| in_hand_manipulation | 手内操作 | 操作任务与研究问题 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：arXiv v5 §II-A：in-hand manipulation；[in_hand_rl](https://arxiv.org/html/1808.00177v5)：arXiv v5 §2 Task and System Overview |
| grasping | 抓取 | 操作任务 | [grasp_notes](https://nima-fazeli.github.io/manipulation/mechanics/grasp-analysis.html)：Grasp Analysis 开篇；刚体与库仑摩擦假设 |

### 机器人学与控制基础

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| force_closure | 力闭合 | 接触力学性质与抓取判据 | [force_closure_textbook](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-3-force-closure/)：§12.2.3 Transcript，尤其关于 actuator squeezing force 的限制 |
| inverse_kinematics | 逆运动学（IK） | 运动学求解问题 | [ik_textbook](https://modernrobotics.northwestern.edu/nu-gm-book-resource/6-2-numerical-inverse-kinematics-part-1-of-2/)：逆运动学定义、迭代求解与收敛限制。 |
| impedance_control | 阻抗控制 | 控制方法 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§2，式(1)–(4)：impedance/admittance；§2.1 stability；[impedance_notes](https://manipulation.mit.edu/force.html)：Joint stiffness control；Cartesian stiffness and operational space control |
| configuration_space | 构型空间（C-space） | 理论概念 | [mr_configuration](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-1-degrees-of-freedom-of-a-rigid-body/)：§2.1 Transcript：two-joint robot 与 torus |
| forward_kinematics | 正运动学（FK） | 数学问题与求解方法 | [mr_fk](https://modernrobotics.northwestern.edu/nu-gm-book-resource/4-1-1-product-of-exponentials-formula-in-the-space-frame/)：§4.1.1 Transcript：given joint angles, find end-effector configuration |
| jacobian | 机器人雅可比矩阵 | 数学表示 | [mr_jacobian](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/)：§5.1.1 Transcript：joint velocity to twist |
| inverse_dynamics | 逆动力学 | 数学问题与求解方法 | [mr_inverse_dynamics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-3-newton-euler-inverse-dynamics/)：§8.3 Transcript：forward and backward Newton–Euler iterations |
| position_control | 位置控制 | 控制方法 | [impedance_notes](https://manipulation.mit.edu/force.html)：Manipulator-Control Toolbox；Position control / Joint stiffness control |
| torque_control | 力矩控制 | 控制接口与方法 | [mit_robot](https://manipulation.mit.edu/robot.html)：Arms：Torque-controlled robots；Joint-torque sensing and control |
| admittance_control | 导纳控制 | 交互控制方法 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§2 Variable Impedance Control：impedance/admittance schemes；§2.1 stability |
| operational_space_control | 操作空间控制（OSC） | 控制方法 | [khatib_osc](https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf)：Abstract；§II Generalized Task Specification Matrices；§III End-Effector Equations of Motion，pp.43–47 |

### 感知与动作映射

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| tactile_sensing | 触觉感知 | 感知技术 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：IV-D：传感信息、应用和局限。 |
| motion_retargeting | 动作重定向 | 动作映射方法 | [dex_retargeting](https://github.com/dexsuite/dex-retargeting)：README：Position / Vector / DexPilot optimizer configurations 与 Examples |
| proprioception | 本体感知 | 感知概念 | [proprioception_review](https://arxiv.org/html/2406.01152v2)：arXiv v2 §3.2.1 Proprioception |
| slip_detection | 滑移检测 | 感知研究问题 | [slip_fusion](https://arxiv.org/html/1802.10153v1)：§I Introduction；§III Model Description；§IV results |
| pose_estimation | 位姿估计 | 感知研究问题 | [mit_pose](https://manipulation.mit.edu/pose.html)：章节引言；已知几何与 partial views / occlusions |
| visuotactile_fusion | 视觉—触觉融合 | 感知方法 | [slip_fusion](https://arxiv.org/html/1802.10153v1)：§III 双视觉流与触觉图像输入；§IV 融合和单模态比较 |
| teleoperation | 遥操作 | 系统与操作方式 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§III A Low-Cost Teleoperation System；§V 任务 |

### 策略学习基础概念

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| markov_decision_process | 马尔可夫决策过程（MDP） | 数学模型 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：(Optional) Formalism：MDP tuple / Markov property |
| policy | 策略 | 决策规则与基础概念 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：Policies：deterministic and stochastic policies；States and Observations |
| partially_observable_markov_decision_process | 部分可观测马尔可夫决策过程（POMDP） | 理论模型 | [pomdp_review](https://cs.brown.edu/courses/csci2951-k/papers/kaelbling98.pdf)：§3 Partially Observable Markov Decision Processes；belief-state discussion |
| observation | 观测 | 理论概念 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：States and Observations |
| action_space | 动作空间 | 理论概念 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：Action Spaces；Policies |
| reward_function | 奖励函数 | 任务建模概念 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：Reward and Return；The RL Problem；Formalism |
| value_function | 价值函数 | 理论概念 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：Value Functions；Bellman Equations |

### 学习范式

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| imitation_learning | 模仿学习（IL） | 学习范式 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：II-B：范式定义与主要方法。 |
| reinforcement_learning | 强化学习（RL） | 学习范式 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：回报最大化目标与策略学习。；[in_hand_rl](https://arxiv.org/html/1808.00177v5)：灵巧手内重定向实例。 |

### 学习数据设置

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| offline_reinforcement_learning | 离线强化学习（Offline RL） | 强化学习的数据设置与研究问题 | [offline_rl_review](https://arxiv.org/html/2005.01643v3)：§2.2 Offline Reinforcement Learning；§2.4 distribution shift |
| on_policy_learning | 同策略学习 | 学习数据使用方式 | [ppo_docs](https://spinningup.openai.com/en/latest/algorithms/ppo.html)：Quick Facts；Pseudocode |
| off_policy_learning | 异策略学习 | 学习数据使用方式 | [sac_docs](https://spinningup.openai.com/en/latest/algorithms/sac.html)：Background / Quick Facts；replay buffer |
| covariate_shift | 协变量偏移 | 分布变化概念 | [covariate_shift_definition](https://jmlr.org/papers/v8/sugiyama07a.html)：Abstract / §1 |

### 具体学习算法与方法

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| behavior_cloning | 行为克隆（BC） | 模仿学习方法 | [robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：Imitation Learning：BC / BC-RNN；[dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§1–2：sequential prediction distribution mismatch |
| dataset_aggregation | 数据集聚合（DAgger） | 交互式模仿学习算法 | [dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§3 DAgger，Algorithm 3.1 与 expert queries |
| proximal_policy_optimization | 近端策略优化（PPO） | 强化学习算法族 | [ppo_paper](https://arxiv.org/pdf/1707.06347)：§2–4；Algorithm 1；[ppo_docs](https://spinningup.openai.com/en/latest/algorithms/ppo.html)：Background；Quick Facts；Pseudocode |
| soft_actor_critic | 软演员-评论家算法（SAC） | 强化学习算法 | [sac_paper](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)：§2–4；[sac_docs](https://spinningup.openai.com/en/latest/algorithms/sac.html)：Background；Quick Facts；Pseudocode |
| policy_gradient | 策略梯度 | 算法原理与方法族 | [ppo_paper](https://arxiv.org/pdf/1707.06347)：§2 Background: Policy Gradient Methods |
| actor_critic | 演员—评论家 | 算法框架 | [sac_paper](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)：§2 maximum entropy RL；§4 Soft Actor-Critic |
| experience_replay | 经验回放 | 训练机制 | [sac_docs](https://spinningup.openai.com/en/latest/algorithms/sac.html)：Pseudocode：replay buffer D / sample batch |
| asymmetric_actor_critic | 非对称演员—评论家 | 训练方法 | [asymmetric_paper](https://www.roboticsproceedings.org/rss14/p08.pdf)：§IV-A Asymmetric Actor Critic；§IV-C；§V-B |

### 模型结构与类别

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| transformer | Transformer 架构 | 神经网络架构 | [transformer_paper](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)：§3 Model Architecture；[robomimic_transformers](https://robomimic.github.io/docs/tutorials/training_transformers.html)：Training Transformers：bc_transformer configuration |
| vision_language_action_model | 视觉-语言-动作模型（VLA） | 策略模型类别 | [rt2_paper](https://arxiv.org/html/2307.15818v1)：v1 §3 Vision-Language-Action Models；§5 Limitations；[openvla_project](https://arxiv.org/html/2406.09246v1)：v1 §3 The OpenVLA Model；§6 Discussion and Limitations |
| recurrent_neural_network | 循环神经网络（RNN） | 模型架构类别 | [pytorch_rnn](https://docs.pytorch.org/docs/2.14/generated/torch.nn.RNN.html)：RNN：hidden state recurrence formula |
| convolutional_neural_network | 卷积神经网络（CNN） | 模型架构类别 | [pytorch_conv](https://docs.pytorch.org/docs/2.14/generated/torch.nn.Conv2d.html)：Conv2d 运算定义 |
| action_chunking | 动作分块 | 动作表示与执行方法 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV-A Action Chunking；Temporal Ensembling |

### 代表性具名策略方法

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| diffusion_policy | 扩散策略 | 具名策略学习方法 | [diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§II-C Diffusion for Visuomotor Policy Learning；§III-A Network Architecture Options / §III-B Visual Encoder；[robomimic_diffusion](https://robomimic.github.io/docs/tutorials/training_diffusion_policy.html)：Training Diffusion Policy：configuration and implementation |
| action_chunking_with_transformers | 基于 Transformer 的动作分块方法（ACT） | 具名模仿学习方法 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV ACT，§V experiments；[lerobot_act](https://huggingface.co/docs/lerobot/act)：ACT：Overview / implementation |

### 仿真迁移问题与方法

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| sim_to_real_transfer | 仿真到现实迁移 | 迁移研究问题 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：arXiv v5 §3 Transferable Simulations；§6 results；§C.3 calibration |
| domain_randomization | 域随机化 | 训练与迁移方法 | [domain_randomization_paper](https://arxiv.org/html/1703.06907v1)：v1 §III-A：visual domain randomization；[in_hand_rl](https://arxiv.org/html/1808.00177v5)：v5 §3.2：physics / observation / appearance randomizations |
| system_identification | 系统辨识 | 建模方法 | [mit_sysid](https://underactuated.mit.edu/sysid.html)：Multibody dynamics / Experiment design / Identifiability |

### 机构与驱动（导航分组）

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| degrees_of_freedom | 自由度（DoF） | 理论概念 | [mr_configuration](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-1-degrees-of-freedom-of-a-rigid-body/)：§2.1 Transcript：configuration space 与 dimension |
| underactuation | 欠驱动 | 系统性质 | [mit_underactuation](https://underactuated.mit.edu/intro.html)：Definition / Input and state constraints |
| tendon_driven_actuation | 腱绳驱动 | 驱动与传动方式 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：arXiv v5 §IV-B1 Tendon-driven Approach |
| compliance | 机械顺应性 | 物理性质 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§1 Introduction；§2 impedance behavior |

### 接触与抓取力学（导航分组）

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| contact_model | 接触模型 | 物理与数值模型 | [mujoco_contact](https://mujoco.readthedocs.io/en/stable/computation/)：Computation：Soft contact model / Physical realism and soft contacts |
| friction_cone | 摩擦锥 | 接触力学概念 | [mr_friction](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-1-friction/)：§12.2.1 Transcript：static Coulomb friction / friction cone |
| wrench | 力旋量 | 数学表示 | [mr_wrench](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-4-wrenches/)：§3.4 Transcript：moment and force packaged as a 6-vector |
| form_closure | 形闭合 | 抓取与约束性质 | [mr_form](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-1-7-form-closure/)：§12.1.7 Transcript：first-order conditions and conservative test |
| grasp_matrix | 抓取矩阵（G） | 数学表示 | [grasp_notes](https://nima-fazeli.github.io/manipulation/mechanics/grasp-analysis.html)：Grasp Matrix；Force Closure |

### 规划与优化控制（导航分组）

| ID | 名称 | 技术类型 | 定义依据 |
| --- | --- | --- | --- |
| motion_planning | 运动规划 | 研究问题与方法集合 | [mit_planning](https://manipulation.mit.edu/trajectories.html)：章节引言；Inverse Kinematics；Local minima |
| trajectory_optimization | 轨迹优化 | 优化方法 | [mit_planning](https://manipulation.mit.edu/trajectories.html)：Kinematic trajectory optimization；Local minima in collision-free trajectory optimization |
| model_predictive_control | 模型预测控制（MPC） | 控制方法 | [mit_trajopt](https://underactuated.mit.edu/trajopt.html)：Model-Predictive Control：measure / optimize / first action / repeat |

## 原有 32 条概念关系重审

| ID | 原标签 | 本轮标签 | 修订理由 | 依据 |
| --- | --- | --- | --- | --- |
| ppo-rl | 属于 | 强化学习算法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [ppo_paper](https://arxiv.org/pdf/1707.06347)：§2 Policy Gradient Methods；§3–4 PPO |
| sac-rl | 属于 | 强化学习算法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [sac_paper](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)：Abstract；§4 Soft Actor-Critic |
| bc-il | 属于 | 模仿学习方法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：Imitation Learning / BC |
| dagger-il | 属于 | 交互式模仿学习算法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§3 DAgger；Algorithm 3.1 |
| offline-rl | 一种数据设置 | 强化学习的数据设置 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [offline_rl_review](https://arxiv.org/html/2005.01643v3)：§2.2 Offline Reinforcement Learning |
| mdp-rl | 提供数学框架 | 提供决策形式化 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：(Optional) Formalism；States and Observations |
| rl-policy | 学习 / 改进 | 学习或改进策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：The RL Problem；Policies；Value Functions |
| bc-policy | 学习得到 | 拟合示范策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：BC / BC_GMM / BC_RNN |
| dagger-policy | 学习得到 | 迭代训练策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§3 Algorithm 3.1 |
| ppo-policy | 优化 | 更新策略参数 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [ppo_docs](https://spinningup.openai.com/en/latest/algorithms/ppo.html)：Background；Key Equations；Pseudocode |
| sac-policy | 优化 | 优化熵正则策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [sac_paper](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)：§4.2 value and policy updates |
| dagger-bc | 对比：数据收集 | 区别：数据访问与专家查询 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§1–3，supervised learner 与 expert labeling；[robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：BC |
| ppo-sac | 对比：经验使用 | 区别：同策略与异策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [ppo_docs](https://spinningup.openai.com/en/latest/algorithms/ppo.html)：Quick Facts：on-policy；Pseudocode；[sac_docs](https://spinningup.openai.com/en/latest/algorithms/sac.html)：Quick Facts：off-policy；Pseudocode |
| offline-bc | 对比：学习目标 | 区别：优化目标 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [offline_rl_review](https://arxiv.org/html/2005.01643v3)：§2.2 / §2.4，behavioral cloning discussion；[robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：BC / Offline Reinforcement Learning |
| offline-sac | 区分：离线与异策略 | 区别：离线与异策略 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [offline_rl_review](https://arxiv.org/html/2005.01643v3)：§2.2 / §2.4；§4.2 Distributional Shift；[sac_docs](https://spinningup.openai.com/en/latest/algorithms/sac.html)：Background；replay buffer |
| il-rl | 对比：学习信号 | 区别：主要学习信号 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：§II-B；§III-A / §III-B；[rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：The RL Problem |
| act-il | 属于 | 示范学习方法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV；§V |
| diffusion-il | 原方法采用 | 原方法采用示范学习 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§II-C；§V-A Simulation Environments and datasets |
| act-transformer | 使用架构 | 采用 Transformer 架构 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV-B / §IV-C |
| bc-transformer | 可采用架构 | 可采用 Transformer | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [robomimic_transformers](https://robomimic.github.io/docs/tutorials/training_transformers.html)：bc_transformer.json 与 algorithm configuration |
| diffusion-transformer | 可采用架构 | 去噪网络可采用 Transformer | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§III-A Network Architecture Options |
| act-diffusion | 对比：生成方式 | 区别：动作生成机制 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV-B / §IV-C；[diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§II；§III-A |
| vla-policy | 用于动作生成 | 用于视觉语言条件决策 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [rt2_paper](https://arxiv.org/html/2307.15818v1)：v1 §3；§5 limitations |
| vla-transformer | 代表模型采用 | 代表模型采用 Transformer | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [openvla_project](https://arxiv.org/html/2406.09246v1)：v1 §3.1 / §3.2 |
| vla-diffusion | 区分：概念维度 | 区别：描述维度 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [rt2_paper](https://arxiv.org/html/2307.15818v1)：v1 §3；[diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§II policy formulation |
| inhand-dexterous | 一类操作问题 | 一类灵巧操作问题 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：arXiv v5 §II-A |
| tactile-inhand | 提供接触信息 | 可提供局部接触信息 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：arXiv v5 §IV-D Tactile Sensors |
| dr-transfer | 支持迁移 | 一种迁移支持方法 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [domain_randomization_paper](https://arxiv.org/html/1703.06907v1)：v1 §III-A；§IV |
| inhand-transfer | 已有迁移实例 | 有仿真迁移实例 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：v5 §2 / §6 |
| retarget-ik | 相关求解问题 | 可涉及逆运动学问题 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [dex_retargeting](https://github.com/dexsuite/dex-retargeting)：README：Position / Vector / DexPilot；Examples |
| impedance-policy | 不同控制层次 | 可参数化为交互策略 | 撤销固定层级断言；正文允许阻抗律本身参数化为策略。 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§4.3 VILC via Reinforcement Learning，policy parameterization |
| closure-inhand | 接触判据与动态任务 | 区别：接触性质与操作任务 | 补充关系类型、适用范围及精确正文定位；保留经核查的命题。 | [force_closure_textbook](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-3-force-closure/)：§12.2.3：actuation caveat；[in_hand_rl](https://arxiv.org/html/1808.00177v5)：§2 task definition |

## 原有 29 条工程用途重审

全部保留 ID；逐条补充来源定位、场景和编辑映射说明。新增 25 条用途也按同样规则记录。

| ID | 范围与说明 | 依据 |
| --- | --- | --- |
| u1 | Shadow Hand 物体重定向任务目标；此处只抽象为能力需求。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§2 Task and System Overview |
| u2 | Shadow Hand 的物体姿态目标，不指定所有手内任务都采用其实现。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§2 Task and System Overview |
| u3 | 选择装有触觉的系统时的一种可选观测设计。 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：§IV-D Tactile Sensors |
| u4 | 任务空间目标与关节构型之间的运动学接口归纳。 | [mit_planning](https://manipulation.mit.edu/trajectories.html)：Inverse Kinematics |
| u5 | 决策映射的通用建模用途，不限定网络或训练算法。 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：Policies |
| u6 | robomimic BC-Transformer 架构选项，非全部策略必选。 | [robomimic_transformers](https://robomimic.github.io/docs/tutorials/training_transformers.html)：bc_transformer.json 配置 |
| u7 | OpenVLA 类视觉语言条件动作模型选项。 | [openvla_project](https://arxiv.org/html/2406.09246v1)：v1 §3 The OpenVLA Model |
| u8 | 固定离线数据条件下的方法构建。 | [offline_rl_review](https://arxiv.org/html/2005.01643v3)：§2.2 Offline Reinforcement Learning |
| u9 | 用于抓取接触的理论分析，仍需检查实际可施力。 | [force_closure_textbook](https://modernrobotics.northwestern.edu/nu-gm-book-resource/12-2-3-force-closure/)：§12.2.3，actuation caveat |
| u10 | 设计所需运动学求解器，不代表得到整段可行轨迹。 | [ik_textbook](https://modernrobotics.northwestern.edu/nu-gm-book-resource/6-2-numerical-inverse-kinematics-part-1-of-2/)：§6.2 Numerical IK |
| u11 | 交互控制律设计，明确动力学与环境条件。 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§2；§2.1 stability |
| u12 | 可选的人手到机器人手的几何映射。 | [dex_retargeting](https://github.com/dexsuite/dex-retargeting)：README / Examples / Position and Vector modes |
| u13 | ALOHA 通过遥操作示范训练 ACT 的实例。 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§III / §IV |
| u14 | 监督拟合示范动作的一种可选方法。 | [robomimic_algorithms](https://robomimic.github.io/docs/introduction/implemented_algorithms.html)：BC |
| u15 | 交互查询专家并聚合数据；不是纯固定离线示范流程。 | [dagger_paper](https://proceedings.mlr.press/v15/ross11a/ross11a.pdf)：§3 Algorithm 3.1 |
| u16 | 示范训练的动作扩散策略实例。 | [diffusion_policy_project](https://www.roboticsproceedings.org/rss19/p026.pdf)：§II；§III |
| u17 | 原始 ACT 方法，不外推为多指手实机证明。 | [act_paper](https://www.roboticsproceedings.org/rss19/p016.pdf)：§IV |
| u18 | 可用 MDP 形式化，部分观测还需 POMDP 处理。 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：(Optional) Formalism |
| u19 | Shadow 仿真交互与奖励优化实例。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§4；Appendix A.1 |
| u20 | Shadow 策略训练使用 PPO。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：Appendix A.3 Proximal Policy Optimization |
| u21 | 连续控制交互算法选项；不表示 Shadow 原论文使用 SAC。 | [sac_paper](https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf)：§4 Soft Actor-Critic |
| u22 | Shadow 仿真物理和观测变化。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§3.2 Randomizations |
| u23 | 以奖励反馈学习决策规则的通用用途。 | [rl_concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)：The RL Problem；Policies |
| u24 | Shadow 运行时根据观测生成目标关节动作。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§4.2；Appendix B.4 Control |
| u25 | 采用阻抗接口时的一种执行方式，非全部策略必需。 | [impedance_review](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2020.590681/full)：§4.3 控制接口与 learned policy 的映射 |
| u26 | 触觉系统运行时可提供接触反馈，不表示无触觉方案不可行。 | [dexterous_il_survey](https://arxiv.org/html/2504.03515v5)：§IV-D；§IV-E3 Sensor Configuration |
| u27 | Shadow 在实机运行并检验仿真策略。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§6 Results；§6.3 Ablation of Randomizations |
| u28 | 统计连续姿态目标完成数、掉落及超时等终止条件。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§6.2 Quantitative Results |
| u29 | 比较实机任务表现与随机化消融，不只看仿真回报。 | [in_hand_rl](https://arxiv.org/html/1808.00177v5)：§6.2 / §6.3 |

## 工程流程

全部 13 条 flow 标注 editorial_navigation。来源提供感知、规划、控制、记录/训练/评估等背景；没有用这些来源证明一条普遍必经的六阶段路线。反馈线可以构成循环，不应把它当作 is_a 的分类循环。

## 待核实与未覆盖

- World Action Model (WAM)：候选知识地图使用了该名称；本轮未完成跨原始论文的定义范围、缩写一致性及后续研究核验，暂不作为统一的成熟分类。
- 未列入的单篇论文新缩写与平台/项目名：首轮优先通用概念和有跨研究/框架复用的方法；平台仅作案例，不自动作为独立领域。

当前内容不是完整领域本体，不穷尽机构、触觉、接触模型或前沿 VLA。新论文方法名须有清楚定义与独立使用，平台名称优先作为案例背景；缺少明确依据时不强行增边。

## 更新与复查

修改 JSON 后运行 `npm run sync:relations` 生成兼容 related_terms，再运行 `npm run check:content`。自动校验可查重复来源、无效端点、未知谓词、缺少范围/定位、仅元数据引用、上下位循环与兼容表漂移；无法判断论文是否真的支持中文命题，仍需人工重读。

运行 `npm run docs:content` 更新本记录及来源文档（Markdown 与独立 HTML）；`npm run build` 更新网站本地资源。测试结果和本地交付状态由实际运行记录为准。
