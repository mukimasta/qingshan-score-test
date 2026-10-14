# 青山乐谱 宣传片（源文件）

- `film.html`：整部片子按时间 t 画在 1920×1080 画布上；配乐用和网站同一套乐器离线渲染。素材在 `assets/`（复制站点 assets，另加声音地图 map.jpg 和 Barlow Condensed 字体），乐器采样用站点的 `samples/`。
- `engine.js`：从 index 页面抽出的几何、贴纸和声音引擎。
- `audio.py` 生成 sound.wav，再 `ffmpeg -af loudnorm=I=-16:TP=-1.5` 得到 sound_n.wav；`render.py` 逐帧截图并合成 MP4（30fps，H.264 + AAC）。
