import base64
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page()
    logs=[];p.on('console',lambda m:logs.append(m.text));p.on('pageerror',lambda e:logs.append('ERR '+str(e)))
    p.goto('http://localhost:8790/film6.html');p.evaluate('window.ready')
    r=p.evaluate('renderAudio()')
    open('/home/claude/film/sound7.wav','wb').write(base64.b64decode(r['b64']));print('peak',r['peak'],logs[:10]);b.close()
