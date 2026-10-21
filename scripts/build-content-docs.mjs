import {readFile,writeFile} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const [g,a,f,audit]=await Promise.all(['glossary','annotations','framework','content-audit'].map(read));
const names=new Map(g.terms.map(t=>[t.id,t.name.zh])),sources=new Map(g.sources.map(s=>[s.id,s]));
const link=(label,url)=>({label,url});
const sections=[
 {title:'这份文档能证明什么',paragraphs:[
  '核查日期：2026-10-21。内容库 1.0.0，随 main 分支通过 GitHub Pages 发布。本文记录选用理由、实际核查版本和证据边界，配合每条定义或关系中的章节定位阅读。',
  '正式期刊和会议的出版记录有助于确认出处；教材作者正文有助于核对基础定义；算法原文说明具体方法；项目官方文档说明实际接口或实现。作者机构、GitHub 星数、论文年份都不能单独证明一条关系正确。',
  '本轮完成的是编辑核查，不是外部同行评审，也不是截至 2026 年的穷尽检索。reviewed 表示已按本项目规则对照来源；自动校验只检查结构与引用完整性，不能证明科学命题为真。'
 ]},
 {title:'主要资料与权威依据',table:{headers:['资料','可核查依据','本轮使用方式与边界'],rows:[
  [link('Modern Robotics 作者站','https://hades.mech.northwestern.edu/index.php/Modern_Robotics'),'Lynch / Park；Cambridge 2017，作者提供 2019 修订一版版本说明。','使用配套章节逐字稿核对构型、运动学、接触力学；不把网页的新访问日期当作新版教材。'],
  [link('Kroemer 等，操作学习综述','https://jmlr.org/papers/v22/19-804.html'),'JMLR 22(30):1–82，2021；期刊原站全文有编辑及修订记录。','用于问题、表示和经典方法；不作为 2026 年新模型覆盖完整的证据。'],
  [link('An 等，灵巧操作模仿学习综述','https://doi.org/10.1109/TASE.2025.3646183'),'IEEE TASE 23:1760–1792，2026；Crossref DOI 元数据与发表记录可查。','正文核查使用 arXiv 2504.03515v5（2025-12-17）；章节按 v5，不混用期刊分页。'],
  [link('具身灵巧操作近期综述','https://doi.org/10.1109/MRA.2025.3642671'),'IEEE Robotics & Automation Magazine 33(1):24–38，2026-03。','仅核实发表元数据；未通读正文，不用于任何正式词条或连线的依据。'],
  [link('MIT Robotic Manipulation','https://manipulation.mit.edu/'),'Russ Tedrake 作者课程；站点声明 Fall 2026 更新。','核对规划、几何感知和机器人接口；工作讲义不是正式标准，局部 TODO 不当作完整技术论证。'],
  [link('MIT Underactuated Robotics','https://underactuated.mit.edu/'),'本轮使用的 intro / trajopt / sysid 页面标注 Spring 2024。','用于欠驱动、MPC、辨识基础；不能泛称全部 MIT 页面已在 2026 年更新。'],
  [link('Khatib 1987 操作空间控制原文','https://khatib.stanford.edu/publications/pdfs/Khatib_1987_RA.pdf'),'IEEE Journal of Robotics and Automation RA-3(1):43–53；DOI 10.1109/JRA.1987.1087068。','实际查看扫描正文 pp.43–46，§II–III 与式(8)、(14)、(17)–(18)，用于末端动力学和雅可比关系。'],
  [link('robomimic 官方文档','https://robomimic.github.io/docs/'),'页面标注 0.5；有 BC、BC-RNN、BC-Transformer、Diffusion Policy 实现说明。','证明框架中存在相应实现，不证明工业成熟、平台通用或当前最优。'],
  [link('LeRobot ACT 官方文档','https://huggingface.co/docs/lerobot/act'),'原论文团队之外的框架提供 ACT 训练与使用入口。','与 ACT 原文交叉核查“已有复用”；main 页面是核查日快照，未锁定历史 commit。']
 ]}},
 {title:'经典资料为什么保留，新方法如何证明仍有价值',paragraphs:[
  '基础定义与最新性能是不同问题。构型空间、雅可比、摩擦锥、力闭合、POMDP 等可由早期教材或原文定义；目前可查的课程和实现提供仍可学习和使用的例子，不能据年份直接判断过时。',
  'PPO 与 SAC 的定义分别按原论文和官方算法说明核对。Shadow Hand 原文提供 PPO 的具体操作实例；SAC 作为另一种算法选项，不被错误加入 Shadow 论文路线。Spinning Up 是 2018 年教学项目，不作为 2026 年算法流行度统计。',
  'ACT（RSS 2023）与 LeRobot 实现交叉核对；Diffusion Policy（RSS 2023）与 robomimic 实现交叉核对。RT-2（2023）和 OpenVLA（2024）支持 VLA 的不同代表实现。这里只据此说明已有研究或复用，不宣称已经覆盖所有 2025–2026 新模型。',
  '“近年发展，已有复用”是相对经典方法的阅读标签；2023 是所列代表研究的年份，不是该大类最早起源，也不表示其技术成熟度。其余词条以“基础概念或经典方法”作粗标签，不编造首创年代；边界含混者后续可改为未评估。'
 ]},
 {title:'每条引用如何使用',paragraphs:[
  'glossary.json 的 sources 是唯一来源登记表。术语 references 提供入口，claim_evidence 分别记录定义、作用、应用、当前价值的定位；定义为中文转述，其他三类标注 editorial_synthesis，含有条件的编辑归纳。不能把工程例子当作论文逐字结论。',
  '概念连接记录两端、predicate、解释、scope、context 和 evidence。general 是通用命题，case 限于具体实现，comparison 是按所列定义作的比较。review.basis 区分直接说明、基于定义的归纳和编辑比较。',
  '工程 usage 是“此处可以怎样用”的显式映射，并非术语所属学科或必经步骤；flow 的六阶段与顺序全部标注 editorial_navigation。教材和框架提供能力背景，没有一篇来源为整套六阶段背书。',
  'metadata_only 仅证明资料发表信息；校验脚本拒绝用它证明词条、沿革或关系。来源版本、checked_on 与命题的适用条件一起保留，后续修改不会因空间位置或分类自动增边。'
 ]},
 {title:'本轮未直接采用的资料与访问限制',paragraphs:[
  'Awesome Dexterous Manipulation、Awesome Learning for Manipulation、Awesome Robotics Manipulation、Embodied AI Starter Map 和在线 glossary 可用于发现候选文献；它们不是每个定义或每条连线的最终证明。最终连接回到原始正文、教材或官方实现。',
  'Springer Handbook of Robotics（第 2 版，2016）和 Sutton / Barto 的 Reinforcement Learning（第 2 版，2018）保留为背景候选。本轮未以未核实的具体章节为 64 个词条新增证据，不把出版社元数据核对写成通读。',
  'IEEE 页面存在访问限制时，用 DOI / Crossref 核实出版信息，再单独标明实际读到的作者公开正文。TASE 使用 arXiv v5；RAM 近期综述仅保留 metadata_only。',
  'Ha 等本体感知定义已核对出版商正文与作者 arXiv v2 的 §3.2.1。出版商 PDF 在独立请求中返回 403，阅读入口改为作者公开版；不混用版本分页。',
  'Diffusion Policy 旧项目域名本轮返回 404，现用 RSS 正式论文；diffusion_policy_project 是为兼容旧数据保留的来源 ID。Isaac Lab 的旧工作流地址已迁移；它只作背景候选，本轮不借迁移页面证明所有工程顺序。',
  '动态官方文档记录核查日与页面版本；未锁定 commit 的 README 明示限制。引用可打开不等于内容已评审；访问受限也不等于论文不存在。'
 ]},
 {title:'后续维护规则',paragraphs:[
  '先审词条定义，再审关系命题；新增关系必须单独提交定位和适用范围。综述中相邻出现、同属一类或常见于同一系统，不足以生成 uses 或 is_a。',
  '来源变更、版本漂移或失效时，先标记需复核；不能直接替换网址后沿用旧结论。每轮扩充记录增删、旧 ID 兼容性、访问日期和无法核实项。',
  '不维护“最先进”或“最常用”的永久标签。若需要时效排名，应另设有明确截止日期、任务、平台和指标的比较；不能从一篇综述推断行业现状。'
 ]}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mdCell=c=>typeof c==='object'?`[${c.label}](${c.url})`:String(c).replace(/\|/g,'\\|').replace(/\n/g,' ');
const htmlCell=c=>typeof c==='object'?`<a href="${esc(c.url)}">${esc(c.label)}</a>`:esc(c);
let md='# DexAtlas 来源与权威性评估\n\n',html='<h1>DexAtlas 来源与权威性评估</h1><nav><a href="../">返回图谱</a> · <a href="./source-authority.md">Markdown 原文</a> · <a href="#registry">来源目录</a></nav>';
for(const section of sections){
 md+='## '+section.title+'\n\n';html+='<section><h2>'+esc(section.title)+'</h2>';
 for(const p of section.paragraphs||[]){md+=p+'\n\n';html+='<p>'+esc(p)+'</p>';}
 if(section.table){const {headers,rows}=section.table;md+='| '+headers.join(' | ')+' |\n| '+headers.map(()=>'---').join(' | ')+' |\n'+rows.map(row=>'| '+row.map(mdCell).join(' | ')+' |').join('\n')+'\n\n';html+='<div class="table-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+htmlCell(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
 html+='</section>';
}
md+='## 完整来源目录\n\n共 '+g.sources.length+' 项，以下登记与数据同源。只有标注“正文已核查”的条目可以作为内容证据。\n\n';
html+='<section id="registry"><h2>完整来源目录 · '+g.sources.length+' 项</h2><p>以下登记与数据同源。元数据条目不作为术语或连线依据。</p>';
for(const s of g.sources){
 const fields=[['类型',s.kind],['实际版本',s.version],['核查状态',s.verification==='metadata_only'?'仅发表元数据':'正文已核查（限引用定位）'],['权威依据',s.authority_basis],['支持边界',s.usage_boundary],['核查日期',s.checked_on]];
 md+='### '+s.id+'\n\n['+s.title+']('+s.url+')\n\n'+fields.map(([k,v])=>'- **'+k+'**：'+v).join('\n')+(s.doi?'\n- **DOI**：https://doi.org/'+s.doi:'')+'\n\n';
 html+='<article id="'+esc(s.id)+'"><h3>'+esc(s.id)+'</h3><p><a href="'+esc(s.url)+'">'+esc(s.title)+'</a></p><dl>'+fields.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('')+(s.doi?'<dt>DOI</dt><dd><a href="https://doi.org/'+esc(s.doi)+'">'+esc(s.doi)+'</a></dd>':'')+'</dl></article>';
}
html+='</section>';
await writeFile(new URL('../docs/source-authority.md',import.meta.url),md.trimEnd()+'\n');
await writeFile(new URL('../docs/source-authority.html',import.meta.url),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>DexAtlas · 来源与权威性评估</title><style>body{margin:0;background:#0a0b19;color:#e8eaf4;font:17px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1080px;margin:auto;padding:32px 24px 72px}a{color:#80d4e1;text-underline-offset:4px}h1{font-size:30px}h2{font-size:23px;margin-top:44px}h3{font-size:19px;overflow-wrap:anywhere}nav{color:#a6adc5;font-size:15px}p{max-width:88ch}article{margin:22px 0;padding:12px 22px;background:#141627;border:1px solid #303248;border-radius:12px;scroll-margin-top:20px}.table-scroll{overflow:auto}table{border-collapse:collapse;min-width:700px;width:100%;font-size:15px}td,th{padding:12px;border:1px solid #35374c;text-align:left;vertical-align:top}th{background:#191c31}dl{display:grid;grid-template-columns:96px 1fr;gap:8px 14px;font-size:15px}dt{color:#aeb8d2}dd{margin:0;overflow-wrap:anywhere}section{scroll-margin-top:20px}@media(max-width:500px){main{padding:18px 16px}h1{font-size:25px}article{padding:10px 14px}dl{grid-template-columns:1fr;gap:2px}dd{margin-bottom:12px}}</style><main>'+html+'</main></html>\n');

const refs=rows=>rows.map(r=>'['+r.source_id+']('+sources.get(r.source_id)?.url+')：'+(r.locator||r.use)).join('；');
let review='# DexAtlas 内容库 1.0.0 核查记录\n\n日期：2026-10-21。内容已合并到 main 并通过 GitHub Pages 发布；前端仍为 0.2.4。\n\n';
review+=`本轮共 ${g.terms.length} 个词条（原有 22 个重审，新增 42 个）、${a.relations.length} 条概念关系、${f.usages.length} 条环节用途，以及 ${f.flows.length} 条编辑性工程流程。原有 22 个术语 ID 和 32 个概念关系 ID 保留；含义过强的旧连接已修正。来源与边界见 [权威性文档](source-authority.md)，机器可读变更表见 [content-audit.json](../data/content-audit.json)。\n\n`;
review+='## 如何核查\n\n第一轮按教材、综述及官方实现收集与去重；第二轮对照正文检查定义、两端概念、方向、适用范围和工程位置。既审旧样例，也审新增命题。reviewed 是编辑核查状态，不是外部学者认证；自动测试只验证引用、端点、兼容性和交互。\n\n技术类型与显示分类分别记录。算法、学习范式、数据设置、模型架构和研究问题不共用一棵上下位树。分组仅帮助导航，真实连接由独立关系记录表达。\n\n';
review+='最终独立审查后的修正：\n\n'+(audit.final_review?.corrections||[]).map(c=>'- **'+c.area+'**：'+c.change).join('\n')+'\n\n章节定位以实际原文复核；自动测试用于发现悬空来源、类型矛盾和页面回归，不用固定字符串断言代替文献核查。\n\n';
review+='## 本轮关键修正\n\n- 阻抗控制与策略：撤销“固定属于不同层次”的旧断言，改为控制律可参数化为可学习交互策略，定位 impedance_review §4.3。\n- 离线 RL 与异策略：前者约束训练能否继续采集环境数据，后者描述行为策略与目标策略关系，不能等同。\n- ACT 与动作分块：前者为具体方法，后者为可复用的序列表示；动作分块与 MPC 不等价。\n- 力闭合：注明接触/摩擦假设和实际夹紧力限制，不把几何条件当作任务必然成功。\n- 本体观测：Shadow 原文 §3.1 明确关节角反馈用于下层控制、未提供给策略；不再用它证明策略使用关节角。通用定义改引明确的自身状态感知章节。\n- 工程用途：手内操作连到目标和评估，分别表示任务规格与任务表现检查，不是重复节点或上下位关系。\n\n';
review+='## 词条目录\n\n';
for(const category of g.categories){const terms=g.terms.filter(t=>t.category_id===category.id);if(!terms.length)continue;review+='### '+category.name+'\n\n| ID | 名称 | 技术类型 | 定义依据 |\n| --- | --- | --- | --- |\n';for(const t of terms)review+='| '+[t.id,t.name.zh+(t.name.abbreviation?'（'+t.name.abbreviation+'）':''),t.type,refs(t.claim_evidence.definition)].map(mdCell).join(' | ')+' |\n';review+='\n';}
review+='## 原有 32 条概念关系重审\n\n| ID | 原标签 | 本轮标签 | 修订理由 | 依据 |\n| --- | --- | --- | --- | --- |\n';
for(const row of audit.legacy_concepts)review+='| '+[row.id,row.before,row.after,row.reason,refs(row.evidence)].map(mdCell).join(' | ')+' |\n';
review+='\n## 原有 29 条工程用途重审\n\n全部保留 ID；逐条补充来源定位、场景和编辑映射说明。新增 25 条用途也按同样规则记录。\n\n| ID | 范围与说明 | 依据 |\n| --- | --- | --- |\n';
for(const row of audit.legacy_usages)review+='| '+[row.id,row.reason,refs(row.evidence)].map(mdCell).join(' | ')+' |\n';
review+='\n## 工程流程\n\n全部 13 条 flow 标注 editorial_navigation。来源提供感知、规划、控制、记录/训练/评估等背景；没有用这些来源证明一条普遍必经的六阶段路线。反馈线可以构成循环，不应把它当作 is_a 的分类循环。\n\n';
review+='## 待核实与未覆盖\n\n'+g.review_queue.map(q=>'- '+(q.candidate_name||q.name||'候选')+'：'+(q.reason||q.status)).join('\n')+'\n\n当前内容不是完整领域本体，不穷尽机构、触觉、接触模型或前沿 VLA。新论文方法名须有清楚定义与独立使用，平台名称优先作为案例背景；缺少明确依据时不强行增边。\n\n';
review+='## 更新与复查\n\n修改 JSON 后运行 `npm run sync:relations` 生成兼容 related_terms，再运行 `npm run check:content`。自动校验可查重复来源、无效端点、未知谓词、缺少范围/定位、仅元数据引用、上下位循环与兼容表漂移；无法判断论文是否真的支持中文命题，仍需人工重读。\n\n运行 `npm run docs:content` 更新本记录及来源文档（Markdown 与独立 HTML）；`npm run build` 更新网站本地资源。测试结果和本地交付状态由实际运行记录为准。\n';
await writeFile(new URL('../docs/content-review-v1.md',import.meta.url),review.trimEnd()+'\n');
console.log(`Content documents: ${g.terms.length} terms / ${g.sources.length} sources.`);
