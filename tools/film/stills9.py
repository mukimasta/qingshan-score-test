import sys,base64
from playwright.sync_api import sync_playwright
ts=[float(a) for a in sys.argv[1:]]
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page(viewport={'width':1000,'height':600})
    errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.on('console',lambda m:m.type in('error',) and errs.append(m.text))
    p.goto('http://localhost:8790/film9.html');d=p.evaluate('window.ready');print('dur',d)
    for t in ts:
        u=p.evaluate(f'frame({t})');open(f'/home/claude/film/chk9/s9_{t:05.1f}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
    print(errs);b.close()
