import base64,subprocess,sys,time
from playwright.sync_api import sync_playwright
FPS=60
out=sys.argv[1] if len(sys.argv)>1 else 'qingshan_promo.mp4'
with sync_playwright() as pw:
    b=pw.chromium.launch();p=b.new_page(viewport={'width':1000,'height':600})
    p.goto('http://localhost:8790/film3.html');dur=p.evaluate('window.ready');n=int(round(dur*FPS))
    ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-i','sound4_n.wav',
        '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-profile:v','high','-r',str(FPS),
        '-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out],stdin=subprocess.PIPE)
    t0=time.time()
    for i in range(n):
        u=p.evaluate(f'frame({i/FPS})');ff.stdin.write(base64.b64decode(u.split(',',1)[1]))
        if i%150==0:print(i,n,round(time.time()-t0),flush=True)
    ff.stdin.close();ff.wait();b.close();print('done',out,round(time.time()-t0))
