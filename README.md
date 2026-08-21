# AI 自媒体口播视频包装 Skill

作者与维护者：小杰

这是一套面向真人口播视频的 Agent Skill。它读取已经剪辑完成的视频与对应 SRT，生成可审核的视觉包装方案，再通过 Remotion 输出成片；也可以从同一份分镜生成 HyperFrames 项目。

仓库强调先审方案、再做实现、最后检查真实成片。源视频的剪辑顺序、声音和已有字幕默认保持不变。

## 主要能力

- 依据 SRT 语义规划视觉节拍，普通片段优先控制在 1.6–3.2 秒。
- 提供 10 种语义视觉结构、6 组语义配色、10 种 seek-safe 动效原语和 6 类程序化线条插画。
- 保护居中人物安全区，并为原视频字幕预留底部空间。
- 区分来源事实、个人确认和估算，减少无依据数字、Logo、评价与产品能力。
- 支持直接合成 MP4，也支持带 Alpha 通道的透明 MOV。
- 输出输入哈希、媒体探测、分镜、代表帧、渲染清单和完整解码检查结果。

## 安装

环境要求：Node.js 20+、FFmpeg、ffprobe。

```bash
git clone https://github.com/xiaojiesssx/ai-self-media-video-packaging-skill.git
cd ai-self-media-video-packaging-skill
npm ci
```

作为 Agent Skill 使用时，将仓库目录复制或链接到 Agent 的 Skills 目录。入口文件是 [SKILL.md](SKILL.md)。

推荐触发语句：

> 使用 package-talking-head-video 检查这段 MP4 和 SRT，先生成 Gate A，等我确认后再继续。

## 前期素材准备

### 1. 准备剪辑完成的视频

这个 Skill 负责画面包装，不处理重读、漏读和气口，也不修正口误、长停顿、错误镜头或基础剪辑问题。输入视频的顺序、声音和时长需要已经确定。

### 2. 导出与成片对应的 SRT

SRT 需要使用 UTF-8 编码，并与成片时间轴完全一致。视频发生删改后，应重新导出 SRT。

### 3. 选择字幕模式

- 原视频已经带有字幕（字幕已固定在画面中）：使用 `--captions burned-in`。
- 原视频没有字幕，希望 Skill 自动生成字幕：使用 `--captions generated`。
- 原视频没有字幕，并且只需要动效、不需要字幕：使用 `--captions none`。

## 两种输出方式

| 方式 | 输入 | 输出 | 适用场景 |
|---|---|---|---|
| 只提供 SRT，输出透明 MOV | SRT、画布宽高和帧率 | 无音轨、带 Alpha 通道的 ProRes 4444 `overlay.mov` | 需要在剪映、Premiere 或 Final Cut 中自行叠加 |
| 视频 + SRT，直接合成 MP4 | 完整视频与对应 SRT | 含原画面、原声音和动效的 `packaged.mp4` | 第一次使用或希望直接获得成片 |

默认推荐视频 + SRT 的直接合成方式。它可以检查真实人物位置、字幕高度、画面构图和遮挡风险。

## 四阶段流程

### Gate A：只生成方案

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite
```

这一阶段生成 `BRIEF.md`、`SOURCE_PROBE.json`、`STORYBOARD.md`、`storyboard.json` 和 `input-manifest.json`，不会渲染成片。

### Gate B：生成视觉实现

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b
```

### Gate C：生成代表帧并检查

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-c
```

### Gate D：渲染并验收成片

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-c --approve-gate-d --render
```

最终输出位于 `run/renders/packaged.mp4`。

## 透明 MOV 示例

```bash
npm run package-video -- --srt ./input.srt --out ./run-overlay --renderer remotion --captions burned-in --output-mode overlay --width 1920 --height 1080 --fps 30 --approve-gate-a --approve-gate-b --approve-gate-c --approve-gate-d --render
```

最终输出位于 `run-overlay/renders/overlay.mov`。

## 视觉规则

- 16:9 居中人物素材默认保护画面横向 35%–65% 的区域。
- 普通信息进入左侧 5%–32% 或右侧 68%–95%，底部 18% 预留给原视频字幕。
- 每个场景采用人物安全模式或完整不透明全屏模式。
- 信息卡按内容自适应高度，避免大面积空白和装饰性堆叠。
- 数字结构需要真实来源、明确的个人确认或估算标签。
- 所有动画由帧计算，支持任意时间点跳转和逐帧渲染。
- Gate C 代表帧在对应节拍的 72% 稳定位置抽取；人物遮挡、内容重叠、裁切、对比度、语义或字幕安全区有一项不合格，就停止进入 Gate D。

详细说明：

- [使用说明](docs/USAGE.md)
- [示例说明](docs/EXAMPLES.md)
- [排障说明](docs/TROUBLESHOOTING.md)
- [四阶段门禁](references/gates.md)
- [导演与证据规则](references/director-rules.md)
- [视觉结构](references/visual-structures.md)
- [动效与线条插画](references/motion-and-illustration.md)
- [视觉质检](references/visual-quality-gates.md)

## 开发与验证

```bash
npm test
npm run typecheck
npm run build
npm run verify:public
npm audit --omit=dev
```

## 许可与维护

当前仓库由小杰开发和维护，代码按 [MIT License](LICENSE) 分发。Remotion 与 HyperFrames 仍受各自上游许可约束。使用第三方人物、商标、视频、图片或字体前，请先确认授权。
