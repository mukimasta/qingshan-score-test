import numpy as np,soundfile as sf,subprocess,sys,json
src=sys.argv[1] if len(sys.argv)>1 else '/home/claude/film/sound8.wav'
out=sys.argv[2] if len(sys.argv)>2 else '/home/claude/film/sound8_n.wav'
y,sr=sf.read(src);m=y.mean(axis=1)
B=16*60/84/4;T0=14.6;at=lambda b:T0+b*B
def rms(a,b):s=m[int(a*sr):int(b*sr)];return 20*np.log10(np.sqrt((s**2).mean())+1e-9)
# mix automation (dB): everything before the score sits a little under it; inside the score a clear arc to row 5
PRE,R13,R4A,R4B,R5,R6,END=-1.2,-2.6,-1.8,-1.2,3.0,0.0,-1.0
PTS=[(0,PRE),(at(6)-.3,PRE),(at(6)+.12,R13),(at(9)-.15,R13),(at(9)+.15,R4A),(at(10)-.25,R4B),(at(10)+.08,R5),(at(11)-.1,R5),(at(11)+.25,R6),(at(12)-.1,R6),(at(12)+1.2,END),(len(y)/sr+1,END)]
tt=np.arange(len(y))/sr;env_db=np.interp(tt,[p[0] for p in PTS],[p[1] for p in PTS])
y=y*(10**(env_db/20))[:,None];m=y.mean(axis=1)
g=-13.0-rms(at(10),at(11))   # the peak (row 5) sits at -13 dBFS rms, as in v6
json.dump({'g':g,'pts':PTS},open('/home/claude/film/post8.json','w'))
tmp='/home/claude/film/_g.wav';sf.write(tmp,(y*10**(g/20)).astype(np.float32),sr,subtype='FLOAT')
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af','alimiter=limit=0.84:attack=2:release=60:level=false','-ar','48000','-c:a','pcm_s16le',out],check=True)
y2,sr2=sf.read(out);m=y2.mean(axis=1);sr=sr2
secs=[('opening',0,5.8),('walk+places',6.0,14.6),('02 cards',at(0),at(1.5)),('02 beat',at(1.5),at(3)),('03 stick',at(3),at(5)),('04 scan',at(5),at(6)),('05 score',at(6),at(12)),('end',at(12),at(13.5))]
for n,a,b in secs:
    s=m[int(a*sr):int(b*sr)];print(f'{n:12s} rms {20*np.log10(np.sqrt((s**2).mean())+1e-9):6.1f}  peak {20*np.log10(np.abs(s).max()+1e-9):6.1f}')
print('gain applied',round(g,1))
print('--- score rows')
for r in range(6):
    s=m[int(at(6+r)*sr):int(at(7+r)*sr)];print(f'row {r+1}  rms {20*np.log10(np.sqrt((s**2).mean())+1e-9):6.1f}')
