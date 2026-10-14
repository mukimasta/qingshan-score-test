# section levels of each stem, on the final mix's scale (render normalisation undone, post automation + gain applied)
import numpy as np,soundfile as sf,json,re,glob,sys
tag=sys.argv[1] if len(sys.argv)>1 else 'v7';full=sys.argv[2] if len(sys.argv)>2 else 'sound8.wav'
B=16*60/84/4;T0=14.6;at=lambda b:T0+b*B
P=json.load(open('post8.json'));g=P['g'];PTS=P['pts']
def peak_of(log):
    t=open(log).read();return float(re.search(r'peak ([\d.]+)',t).group(1))
def load(path,peak):
    y,sr=sf.read(path);m=y.mean(axis=1)
    if peak>.98:m=m*peak/.98     # undo the render's own normalisation
    return m,sr
fullpeak=float(open('fullpeak.txt').read()) if glob.glob('fullpeak.txt') else 1
def to_final(m,sr):
    tt=np.arange(len(m))/sr;env=np.interp(tt,[p[0] for p in PTS],[p[1] for p in PTS])
    k=min(1,.98/fullpeak);return m*k*10**((env+g)/20)
def aw(f):f2=f*f;return (12194**2*f2*f2)/((f2+20.6**2)*np.sqrt((f2+107.7**2)*(f2+737.9**2))*(f2+12194**2))/0.7943
def lev(m,sr,a,b):
    s=m[int(a*sr):int(b*sr)]
    if not len(s) or not np.any(s):return -99,-99
    S=np.fft.rfft(s);f=np.fft.rfftfreq(len(s),1/sr);A=np.fft.irfft(S*aw(np.maximum(f,1)),len(s))
    return 20*np.log10(np.sqrt((s**2).mean())+1e-9),20*np.log10(np.sqrt((A**2).mean())+1e-9)
secs=[('opening',0,5.8),('walk',6.0,13.8),('maps→02',13.8,at(0)+.6),('02 cards',at(0),at(1.5)),('02 beat',at(1.5),at(3)),('03 stick',at(3),at(5)),('04 scan',at(5),at(6))]+[(f'row {r+1}',at(6+r),at(7+r)) for r in range(6)]+[('end',at(12),at(13.5))]
stems=sorted(set(re.search(tag+r'_(\w+)\.log',l).group(1) for l in glob.glob(f'stems/{tag}_*.log')))
data={}
m,sr=load(full,fullpeak);data['FULL']=to_final(m,sr)
for s in stems:
    m,_=load(f'stems/{tag}_{s}.wav',peak_of(f'stems/{tag}_{s}.log'));data[s]=to_final(m,sr)
print('A-weighted rms, final scale   '+'  '.join(f'{k:>7s}' for k in data))
for n,a,b in secs:print(f'{n:10s}'+'  '.join(f'{lev(v,sr,a,b)[1]:7.1f}' for v in data.values()))
