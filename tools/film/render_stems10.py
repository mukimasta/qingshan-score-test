# render the music and the recordings as two raw float stems (no fades, no normalisation) for master10.py
import base64,sys
from playwright.sync_api import sync_playwright
html,stem,tag=sys.argv[1],sys.argv[2],sys.argv[3]
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page();logs=[];p.on('pageerror',lambda e:logs.append(str(e)))
    p.goto('http://localhost:8790/'+html);p.evaluate('window.ready')
    r=p.evaluate("renderAudio({stem:'%s',raw:true})"%stem)
    open(f'/home/claude/film/stems/{tag}_{stem}_raw.wav','wb').write(base64.b64decode(r['b64']));print(stem,'ok',logs[:3]);b.close()
