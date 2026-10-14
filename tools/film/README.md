# 青山乐谱 宣传片（源文件）

横屏 1920×1080，60fps，约 53 秒。当前版本是 `film7.html` + `arr5.js`（`audio8.py` → `post8.py`：第五行定在 -13 dBFS，乐谱前的段落整体低 1.2 dB，乐谱内部一条到第五行的弧线 → `render7.py`）。

v7：01 小溪那一站的水声一路延续到 02、03，扫描时才退掉，乐谱响起时已经没有；03 贴贴纸时只有贝斯 + 和弦 + 鼓（像 v2），没有高音旋律；播放乐谱时除了贴纸自己的声音，只加了鼓（底鼓、军鼓、沙锤、开镲、镲片），没有任何录音或别的乐器。
`stems8.sh` 分轨渲染，`measurek.py` 按段量各轨响度（K 加权），`transient.py` 量每一下鼓相对贴纸的音量。

- `film2.html`：整部片子按时间画在画布上，所有段落卡在 84 BPM 的小节上；配乐用和网站同一套乐器离线渲染，再叠上野外录音。超过片尾的声音会折回片头，所以循环没有断点。
- `arr.js`：片中「贴」「扫」「听见」用的示例乐谱（按和声编排：C · Am · D · G · Em→Am · D→G）。
- `engine.js`：从网站抽出的几何、贴纸和声音引擎。
- `audio3.py` 生成 sound3.wav，再用 ffmpeg loudnorm 两遍处理到 -16 LUFS；`render2.py` 逐帧截图合成 MP4。

## 声音来源

- 青山声音地图上的录音：共富坊旁边的小沟（`creek_loop.wav` 是它接成的循环）、鸟群、青山之弦和蝉合奏（羊），龙坞里雨夜的虫鸣（Hanlin）
- 乐谱段按网站同一套声音化规则播放；`arr4.js` 是为片子编排的乐谱（C · Am · D · G · Em→Am · D→G，结尾落到 C）
- Freesound，CC0：Walking through leaves（markbolden）、Bamboo Creaking in Wind（Yoyodaman234）
- 乐器采样同网站：tonejs-instruments、FluidR3 GM，CC BY 3.0
