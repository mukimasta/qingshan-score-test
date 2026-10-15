# raw music stem with a JS filter on the events:  stem_raw.py film.html out.wav "<js filter on e>"
import base64,sys
from playwright.sync_api import sync_playwright
html,out,flt=sys.argv[1],sys.argv[2],sys.argv[3]
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page();p.goto('http://localhost:8790/'+html);p.evaluate('window.ready')
    p.evaluate("(()=>{const __m=musicEvents;window.musicEvents=()=>__m().filter(e=>%s)})()"%flt)
    r=p.evaluate("renderAudio({stem:'music',raw:true})");open(out,'wb').write(base64.b64decode(r['b64']));print(out,'ok');b.close()
