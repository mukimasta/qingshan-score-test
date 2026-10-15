# Master the film's sound from two raw stems (music, recordings):
#   music: more low end for small speakers (a low shelf, a low-mid bump, and harmonics of the bass/kick that
#          laptop-size speakers can actually play), then louder than the recordings by DM dB;
#   recordings: exactly as in v9 (same anchor, same automation);
#   then the v9 arc automation, fades, and a limiter.
import numpy as np,soundfile as sf,subprocess,json,sys
from scipy.signal import butter,sosfilt,lfilter
tag=sys.argv[1] if len(sys.argv)>1 else 'v10'
out=sys.argv[2] if len(sys.argv)>2 else '/home/claude/film/sound11_n.wav'
DM=float(sys.argv[3]) if len(sys.argv)>3 else 3.0          # music lift (dB) over v9
B=16*60/84/4;T0=14.6;at=lambda b,s=0:T0+b*B+s*B/16
M,sr=sf.read(f'/home/claude/film/stems/{tag}_music_raw.wav');R,_=sf.read(f'/home/claude/film/stems/{tag}_rec_raw.wav')
N=min(len(M),len(R));M=M[:N];R=R[:N];tt=np.arange(N)/sr

def biquad(kind,f0,gdb,Q):
    A=10**(gdb/40);w=2*np.pi*f0/sr;cw,sw=np.cos(w),np.sin(w);al=sw/(2*Q)
    if kind=='peak':b=[1+al*A,-2*cw,1-al*A];a=[1+al/A,-2*cw,1-al/A]
    else:
        sq=2*np.sqrt(A)*al
        b=[A*((A+1)-(A-1)*cw+sq),2*A*((A-1)-(A+1)*cw),A*((A+1)-(A-1)*cw-sq)];a=[(A+1)+(A-1)*cw+sq,-2*((A-1)+(A+1)*cw),(A+1)+(A-1)*cw-sq]
    return np.array(b)/a[0],np.array(a)/a[0]
def eq(x,fs):
    for b,a in fs:x=lfilter(b,a,x,axis=0)
    return x
# --- low end ---
LS,LM,HG=2.5,3.5,-4.0      # low shelf @100 Hz, low-mid bump @170 Hz, harmonics level vs the low band (dB)
from scipy.ndimage import maximum_filter1d,uniform_filter1d
lo=sosfilt(butter(4,140,'low',fs=sr,output='sos'),M,axis=0).mean(axis=1)
env=uniform_filter1d(maximum_filter1d(np.abs(lo),int(.012*sr)),int(.004*sr))+1e-7   # a peak envelope that never lags the transients
u=np.clip(lo/env,-1,1)
h=np.abs(lo)+.6*env*u**3                                       # |x| → 2f, 4f …; env·u³ → 3f; both scale with the level, both bounded
H=sosfilt(butter(2,[150,900],'bandpass',fs=sr,output='sos'),h)
mus=slice(int(at(0)*sr),int(at(13)*sr))
H*=10**(HG/20)*np.sqrt((lo[mus]**2).mean())/np.sqrt((H[mus]**2).mean())
Me=eq(M,[biquad('shelf',100,LS,.7),biquad('peak',160,LM,.8)])+H[:,None]
# --- the v9 automation and anchor (recordings keep their v9 level) ---
PRE,R13,R4A,R4B,R5,R6,END=-1.2,-3.2,-2.3,-1.7,3.0,-0.5,-1.0
PTS=[(0,PRE),(at(6)-.3,PRE),(at(6)+.12,R13),(at(9)-.15,R13),(at(9)+.15,R4A),(at(10)-.25,R4B),(at(10)+.08,R5),(at(11)-.1,R5),(at(11)+.25,R6),(at(12)-.1,R6),(at(12)+1.6,R6),(at(12)+2.8,END),(N/sr+1,END)]
E=10**(np.interp(tt,[p[0] for p in PTS],[p[1] for p in PTS])/20)[:,None]
def rms(x,a,b):s=x[int(a*sr):int(b*sr)].mean(axis=1);return 20*np.log10(np.sqrt((s**2).mean())+1e-12)
G=float(sys.argv[4]) if len(sys.argv)>4 else -13.0-rms((M+R)*E,at(10),at(11))   # v9's gain (pass it to keep it fixed)
Y=(Me*10**((G+DM)/20)+R*10**(G/20))*E
f=np.minimum(1,np.minimum(tt/.4,(tt[-1]-tt)/1.0)).clip(0)[:,None];Y*=f
pre={n:rms(Y,a,b) for n,a,b in [(f'row {r+1}',at(6+r),at(7+r)) for r in range(6)]}
tmp='/home/claude/film/_m.wav';sf.write(tmp,Y.astype(np.float32),sr,subtype='FLOAT')
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af','alimiter=limit=0.84:attack=3:release=80:level=false','-ar','48000','-c:a','pcm_s16le',out],check=True)
json.dump({'G':G,'DM':DM,'LS':LS,'LM':LM,'HG':HG,'pts':PTS},open(out.replace('.wav','.json'),'w'))
y2,sr2=sf.read(out);m=y2.mean(axis=1)
def r2(a,b):s=m[int(a*sr2):int(b*sr2)];return 20*np.log10(np.sqrt((s**2).mean())+1e-12)
CRED=at(12)+3.7
for n,a,b in [('opening',0,5.8),('walk+places',6.0,14.6),('02 cards',at(0),at(1.5)),('02 beat',at(1.5),at(3)),('03 stick',at(3),at(5)),('04 scan',at(5),at(6))]+[(f'row {r+1}',at(6+r),at(7+r)) for r in range(6)]+[('end card',at(12),CRED),('credits',CRED,CRED+5.3)]:
    lim=f'   (limiter took {pre[n]-r2(a,b):.1f} dB)' if n in pre else ''
    print(f'{n:12s} rms {r2(a,b):6.1f}{lim}')
print('peak dBFS',round(20*np.log10(np.abs(y2).max()),2),' G',round(G,2),' DM',DM)
