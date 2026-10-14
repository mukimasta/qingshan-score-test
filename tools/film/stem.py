# render one film's audio with a filter applied first:  stem.py film.html out.wav "<js run before renderAudio>"
import base64,sys
from playwright.sync_api import sync_playwright
html,out,js=sys.argv[1],sys.argv[2],(sys.argv[3] if len(sys.argv)>3 else '')
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page()
    logs=[];p.on('console',lambda m:logs.append(m.text));p.on('pageerror',lambda e:logs.append('ERR '+str(e)))
    p.goto('http://localhost:8790/'+html);p.evaluate('window.ready')
    if js:p.evaluate(js)
    r=p.evaluate('renderAudio()')
    open(out,'wb').write(base64.b64decode(r['b64']));print(out,'peak',round(r['peak'],3),[l for l in logs if 'ERR' in l or 'skip' in l][:5]);b.close()
