# v9 vs v10: perceived loudness (K-weighted) per section, and how much of the bass a small speaker would reproduce
import numpy as np,soundfile as sf,sys
import pyloudnorm as pyln
from scipy.signal import butter,sosfilt
B=16*60/84/4;T0=14.6;at=lambda b,s=0:T0+b*B+s*B/16;CRED=at(12)+3.7
files=sys.argv[1:] or ['sound10_n.wav','sound11_n.wav']
secs=[('walk',6.0,14.6),('02 cards',at(0),at(1.5)),('02 beat',at(1.5),at(3)),('03 stick',at(3),at(5)),('04 scan',at(5),at(6))]+[(f'row {r+1}',at(6+r),at(7+r)) for r in range(6)]+[('end card',at(12),CRED),('credits',CRED,CRED+4.0)]
res={}
for fn in files:
    y,sr=sf.read(fn);M=pyln.Meter(sr);x=y.copy()
    for f in M._filters.values():x=np.stack([f.apply_filter(x[:,c]) for c in range(2)],1)
    # small speaker: nothing much below ~150 Hz
    spk=sosfilt(butter(4,160,'highpass',fs=sr,output='sos'),y.mean(axis=1))
    band=sosfilt(butter(4,[160,450],'bandpass',fs=sr,output='sos'),y.mean(axis=1))
    L=lambda a,b:-0.691+10*np.log10((x[int(a*sr):int(b*sr)]**2).mean(axis=0).sum()+1e-12)
    rr=lambda s,a,b:20*np.log10(np.sqrt((s[int(a*sr):int(b*sr)]**2).mean())+1e-12)
    res[fn]={n:(L(a,b),rr(band,a,b)-rr(spk,a,b)) for n,a,b in secs}
print(f'{"":10s}'+''.join(f'{f:>34s}' for f in files))
print(f'{"":10s}'+''.join(f'{"LUFS-ish   160-450Hz share on speaker":>34s}' for f in files))
for n,_,_ in secs:print(f'{n:10s}'+''.join(f'{res[f][n][0]:14.1f}{res[f][n][1]:16.1f}    ' for f in files))
