import numpy as np,soundfile as sf
import pyloudnorm as pyln
B=16*60/84/4;T0=14.6;at=lambda b,s=0:T0+b*B+s*B/16
a,sr=sf.read('/home/claude/film/stems/arp.wav');r,_=sf.read('/home/claude/film/stems/noarp.wav')
M=pyln.Meter(sr)
def kw(y):
    x=y.copy()
    for f in M._filters.values():x=np.stack([f.apply_filter(x[:,c]) for c in range(2)],1)
    return x
ka,kr=kw(a),kw(r)
L=lambda x,t,w=.15:-0.691+10*np.log10((x[int(t*sr):int((t+w)*sr)]**2).mean(axis=0).sum()+1e-12)
d=[]
for i,n in enumerate(['F3','A3','C4','E4','F4','A4','C5','E5','F5','A5','C6','E6']):
    t=at(5,1+i);d.append(L(ka,t)-L(kr,t));print(f'  {n:3s} arp {L(ka,t):6.1f}  rest {L(kr,t):6.1f}  ({d[-1]:+5.1f})')
print('whole run',round(L(ka,at(5,1),2.1),1),' rest',round(L(kr,at(5,1),2.1),1),'  median note margin',round(float(np.median(d)),1))
