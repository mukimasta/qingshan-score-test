# 青山乐谱 宣传片（源文件）

横屏 1920×1080，60fps，约 60 秒。当前版本是 `film6.html` + `arr5.js`（`audio7.py` → `post7.py`：乐谱段定在 -17 dBFS，第五行最高 → `render6.py`）。

- `film2.html`：整部片子按时间画在画布上，所有段落卡在 84 BPM 的小节上；配乐用和网站同一套乐器离线渲染，再叠上野外录音。超过片尾的声音会折回片头，所以循环没有断点。
- `arr.js`：片中「贴」「扫」「听见」用的示例乐谱（按和声编排：C · Am · D · G · Em→Am · D→G）。
- `engine.js`：从网站抽出的几何、贴纸和声音引擎。
- `audio3.py` 生成 sound3.wav，再用 ffmpeg loudnorm 两遍处理到 -16 LUFS；`render2.py` 逐帧截图合成 MP4。

## 声音来源

- 青山声音地图上的录音：共富坊旁边的小沟、鸟群、青山之弦和蝉合奏（羊），龙坞里雨夜的虫鸣（Hanlin）
- 乐谱段按网站同一套声音化规则播放；`arr4.js` 是为片子编排的乐谱（C · Am · D · G · Em→Am · D→G，结尾落到 C）
- Freesound，CC0：Walking through leaves（markbolden）、Bamboo Creaking in Wind（Yoyodaman234）
- 乐器采样同网站：tonejs-instruments、FluidR3 GM，CC BY 3.0
