import numpy as np,soundfile as sf,subprocess,sys
src=sys.argv[1] if len(sys.argv)>1 else '/home/claude/film/sound6.wav'
out=sys.argv[2] if len(sys.argv)>2 else '/home/claude/film/sound6_n.wav'
y,sr=sf.read(src);m=y.mean(axis=1)
B=16*60/84/4;T0=22.5;at=lambda b:T0+b*B
def rms(a,b):s=m[int(a*sr):int(b*sr)];return 20*np.log10(np.sqrt((s**2).mean())+1e-9)
# mix automation across the score: a small arc so row 5 is the peak (rows 1-3 a touch under, row 4 lifting, row 5 up, row 6 settling)
tt=np.arange(len(y))/sr;env_db=np.zeros(len(y))
pts=[(at(6)-.2,0),(at(6)+.15,-1.8),(at(9)-.15,-1.8),(at(9)+.15,-1.4),(at(10)-.25,-1.0),(at(10)+.1,2.4),(at(11)-.1,2.4),(at(11)+.25,.8),(at(12)-.1,.8),(at(12)+1.2,0)]
xs=[p[0] for p in pts];ys=[p[1] for p in pts];env_db=np.interp(tt,xs,ys,left=0,right=0)
y=y*(10**(env_db/20))[:,None];m=y.mean(axis=1)
g=-17-rms(at(6),at(12))   # the score section sits at -17 dBFS rms
tmp='/home/claude/film/_g.wav';sf.write(tmp,(y*10**(g/20)).astype(np.float32),sr,subtype='FLOAT')
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af','alimiter=limit=0.84:attack=2:release=60:level=false','-ar','48000','-c:a','pcm_s16le',out],check=True)
y2,sr2=sf.read(out);m=y2.mean(axis=1);sr=sr2
secs=[('opening',0,5.8),('walk+places',6.0,21.6),('02 cards',at(0),at(1.5)),('02 beat',at(1.5),at(3)),('03 stick',at(3),at(5)),('04 scan',at(5),at(6)),('05 score',at(6),at(12)),('end',at(12),at(13.5))]
for n,a,b in secs:
    s=m[int(a*sr):int(b*sr)];print(f'{n:12s} rms {20*np.log10(np.sqrt((s**2).mean())+1e-9):6.1f}  peak {20*np.log10(np.abs(s).max()+1e-9):6.1f}')
print('gain applied',round(g,1))
print('--- score rows')
for r in range(6):
    s=m[int(at(6+r)*sr):int(at(7+r)*sr)];print(f'row {r+1}  rms {20*np.log10(np.sqrt((s**2).mean())+1e-9):6.1f}')
