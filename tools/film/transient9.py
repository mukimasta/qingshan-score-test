# how the film's drum hits sit against the stickers at the moment they sound (80 ms windows, K-weighted)
import numpy as np,soundfile as sf,json,re
import pyloudnorm as pyln,sys
TAG=sys.argv[1] if len(sys.argv)>1 else 'v8'
B=16*60/84/4;ST=B/16;T0=14.6;at=lambda b,s=0:T0+b*B+s*ST
def peak_of(l):return float(re.search(r'peak ([\d.]+)',open(l).read()).group(1))
def load(n):
    y,sr=sf.read(f'stems/{TAG}_{n}.wav');m=y.mean(axis=1);p=peak_of(f'stems/{TAG}_{n}.log');return (m*p/.98 if p>.98 else m),sr
fd,sr=load('filmdrum');stk,_=load('stickers')
M=pyln.Meter(sr)
def kw(x):
    for f in M._filters.values():x=f.apply_filter(x)
    return x
fdk=kw(fd.copy());stk_k=kw(stk.copy())
def lv(x,t,w=.08):s=x[int(t*sr):int((t+w)*sr)];return 20*np.log10(np.sqrt((s**2).mean())+1e-9)
HITS={6:[0,4,8,12],7:[0,4],8:[0,4,8],9:[0,4,12,14],10:[0,4,8,12],11:[0,4,8,12]}
for bar,steps in HITS.items():
    row=bar-5;out=[]
    for s in steps:
        t=at(bar,s);out.append(f'{s:>2}: drum {lv(fdk,t):6.1f} stk {lv(stk_k,t):6.1f} ({lv(fdk,t)-lv(stk_k,t):+5.1f})')
    print(f'row {row}  '+' | '.join(out))
# the shaker/ohat off-beats: average over odd 16ths
for bar in range(6,12):
    d=[lv(fdk,at(bar,s),.05)-lv(stk_k,at(bar,s),.05) for s in range(1,16,2)]
    print(f'row {bar-5} shaker vs stickers (odd 16ths, 50ms): median {np.median(d):+5.1f} dB')
OH={7:[2],8:[2,6],9:[2,6,15.5],10:[2,6,10,14],11:[2,6]}
for bar,steps in OH.items():
    d=[lv(fdk,at(bar,s),.08)-lv(stk_k,at(bar,s),.08) for s in steps]
    print(f'row {bar-5} open hat vs stickers: '+' '.join(f'{x:+5.1f}' for x in d))
print('crash row5', round(lv(fdk,at(10),.4)-lv(stk_k,at(10),.4),1), ' end', round(lv(fdk,at(12),.4)-lv(stk_k,at(12),.4),1))
