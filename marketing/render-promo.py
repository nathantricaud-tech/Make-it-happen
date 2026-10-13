"""Original kinetic typography promos. Pillow + NumPy + ffmpeg. No licensed audio samples."""
from PIL import Image,ImageDraw,ImageFont
import numpy as np, math, subprocess, wave, os, sys
from functools import lru_cache
OUT=sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/a750af0aefe4/promo'
os.makedirs(OUT,exist_ok=True)
W,H,FPS,DUR=1080,1920,30,26
@lru_cache(None)
def font(size,kind='sans'):
 p={'sans':'/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf','serif':'/usr/share/fonts/opentype/urw-base35/P052-Italic.otf','mono':'/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'}[kind]
 return ImageFont.truetype(p,int(size))
def ease(x):return 1-(1-max(0,min(1,x)))**3
def text(d,xy,s,size=70,fill='#f5f3ee',kind='sans',anchor=None):d.text(xy,s,font=font(size,kind),fill=fill,anchor=anchor)
def pill(d,box,s,white=False,size=30):
 d.rounded_rectangle(box,radius=28,fill='#eeeeea' if white else '#242526',outline='#535454',width=1)
 text(d,((box[0]+box[2])/2,(box[1]+box[3])/2),s,size,'#111213' if white else '#e9e8e3',anchor='mm',kind='mono')
def cube(d,cx,cy,scale,t):
 pts=[]
 for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
  a=t*.45;b=t*.3;x,z=x*math.cos(a)+z*math.sin(a),-x*math.sin(a)+z*math.cos(a);y,z=y*math.cos(b)-z*math.sin(b),y*math.sin(b)+z*math.cos(b);q=4/(4+z);pts.append((cx+x*scale*q,cy+y*scale*q))
 for a,b in [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)]:d.line([pts[a],pts[b]],fill='#969b9f',width=3)
def render(t,lang):
 im=Image.new('RGB',(W,H),'#0d0e10');d=ImageDraw.Draw(im);fr=lang=='fr'
 # Flowing contour field across every scene.
 for j in range(16):
  pts=[(x,1340+j*22+70*math.sin(x/245+t*.45+j*.13)) for x in range(-20,W+30,20)]
  d.line(pts,fill=(26+j,28+j,30+j),width=2)
 text(d,(88,120),'MAKE IT HAPPEN',30,kind='mono');text(d,(980,120),'↗',42,anchor='ra')
 cuts=[0,3,6,10,14,18,21,26];i=next(k for k in range(7) if cuts[k]<=t<cuts[k+1]);u=t-cuts[i];reveal=ease(u/.7);y=int(50*(1-reveal))
 if i==0:
  text(d,(88,325+y),'23:47',165,kind='mono');pill(d,(90,550,530,615),'MODE RÉVISION' if fr else 'STUDY MODE',size=25)
  for k,s in enumerate(['Encore tout','à réviser ?'] if fr else ['Still so much','to study?']):text(d,(85,745+k*135+y),s,112)
  text(d,(90,1130),'Respire. On commence.' if fr else 'Breathe. Start here.',52,kind='serif')
  for k in range(3):
   xx=90+k*270+int(math.sin(t+k)*12);yy=1380+k*32
   d.rounded_rectangle((xx,yy,xx+240,yy+190),25,fill='#25262a',outline='#53565a',width=1)
   text(d,(xx+22,yy+30),['f(x)','E = mc²','01 / 03'][k],31,kind='mono')
   for r in range(3):d.line((xx+22,yy+85+r*24,xx+200,yy+85+r*24),fill='#56585e',width=4)
 elif i==1:
  text(d,(88,420),'« Demain. »' if fr else '“Tomorrow.”',112,fill='#85888e',kind='serif')
  d.line((85,488,85+820*ease(u/.6),488),fill='#f4f4f2',width=5)
  for k,s in enumerate(['Et si c’était','maintenant ?'] if fr else ['What about','right now?']):text(d,(85,750+k*135+y),s,106)
  cube(d,535,1390,185,t)
 elif i==2:
  text(d,(88,300+y),'Tes cours.' if fr else 'Your notes.',110)
  text(d,(88,435+y),'Un plan clair.' if fr else 'A clear plan.',103,kind='serif')
  yy=710+int(100*(1-reveal));d.rounded_rectangle((90,yy,940,yy+780),42,fill='#eeeae2')
  text(d,(135,yy+58),'FICHE DE RÉVISION' if fr else 'STUDY GUIDE',28,'#535357',kind='mono')
  text(d,(135,yy+142),'L’énergie' if fr else 'Energy',80,'#111213')
  for j,(a,b) in enumerate([('01','Comprendre' if fr else 'Understand'),('02','Retenir' if fr else 'Remember'),('03','Appliquer' if fr else 'Apply')]):
   z=yy+280+j*135; text(d,(137,z),a,30,'#77797b',kind='mono');text(d,(235,z-7),b,49,'#17181a');d.line((235,z+65,860,z+65),fill='#b8b8b5',width=3)
  scan=yy+80+(u%2)/2*580;d.line((100,scan,930,scan),fill='#777b82',width=3)
  pill(d,(160,1555,875,1640),'IMPORTE → ORGANISE' if fr else 'IMPORT → ORGANIZE',True,29)
 elif i==3:
  text(d,(88,295+y),'Comprends.' if fr else 'Understand.',102)
  text(d,(88,425+y),'Puis pratique.' if fr else 'Then practice.',97,kind='serif')
  pill(d,(90,640,515,710),'SUJET BLANC' if fr else 'MOCK EXAM',False,27)
  d.rounded_rectangle((90,775,940,1390),42,fill='#24262a',outline='#55575b',width=2)
  text(d,(132,820),'01',40,kind='mono');text(d,(132,920),'f(x) = x²',77,kind='mono')
  text(d,(132,1050),'Dérive la fonction.' if fr else 'Find the derivative.',43)
  if u>1.1:
   d.rounded_rectangle((125,1155,905,1345),22,fill='#303b35',outline='#7ca08b',width=2)
   text(d,(165,1195),"f′(x) = 2x",62,fill='#d7eade',kind='mono')
  text(d,(90,1510),'Essaie. Vérifie. Progresse.' if fr else 'Try. Check. Improve.',48,kind='serif')
 elif i==4:
  text(d,(88,310+y),'Un peu' if fr else 'A little',126)
  text(d,(88,450+y),'chaque jour.' if fr else 'every day.',110,kind='serif')
  d.rounded_rectangle((90,730,940,1300),42,fill='#202226',outline='#4b4e53',width=2)
  text(d,(140,775),'TA RÉGULARITÉ' if fr else 'YOUR CONSISTENCY',28,kind='mono')
  for j in range(21):
   xx=140+(j%7)*105;yy=895+(j//7)*107;active=j<int(u*7)
   d.rounded_rectangle((xx,yy,xx+77,yy+77),20,fill='#e0e4e0' if active else '#383b40')
   text(d,(xx+38,yy+39),str(j+1),25,'#1b1c1e' if active else '#9b9da1',kind='mono',anchor='mm')
  text(d,(530,1480),'25:00',146,kind='mono',anchor='mm')
  text(d,(530,1630),'Un cours. Une session.' if fr else 'One lesson. One session.',45,kind='serif',anchor='mm')
 elif i==5:
  cube(d,535,1010,290,t)
  for k,s in enumerate(['Fais le','premier pas.'] if fr else ['Take the','first step.']):
   boxy=570+k*190+y;d.rectangle((70,boxy,990,boxy+160),fill='#0d0e10');text(d,(85,boxy),s,122)
  text(d,(90,1520),'Le reste se construit.' if fr else 'Build from there.',54,kind='serif')
 else:
  for k,s in enumerate(['Make','it','happen.']):text(d,(85,335+k*175+int((1-ease((u-k*.15)/.8))*80)),s,166,kind='serif' if k==1 else 'sans')
  text(d,(95,1045),'APPRENDS À TON RYTHME' if fr else 'LEARN AT YOUR OWN PACE',30,kind='mono')
  pill(d,(90,1210,940,1310),'DÉCOUVRE · LIEN EN BIO ↗' if fr else 'EXPLORE · LINK IN BIO ↗',True,30)
  text(d,(95,1410),'Cours · Fiches · Entraînement' if fr else 'Notes · Study guides · Practice',38)
  text(d,(95,1480),'Téléphone + ordinateur' if fr else 'Phone + desktop',36,fill='#969b9e')
 # Editorial progress track, safe from TikTok controls.
 d.rounded_rectangle((90,1740,930,1745),2,fill='#3b3d41');d.rounded_rectangle((90,1740,90+840*(t/DUR),1745),2,fill='#c7cbc9')
 text(d,(90,1790),f'{i+1:02d} / 07',24,fill='#8d9298',kind='mono')
 return im
# Original 120 BPM electronic bed: warm chords, restrained percussion and soft impacts.
sr=48000;n=sr*DUR;a=np.zeros(n,dtype=np.float64);rng=np.random.default_rng(31)
for start in np.arange(0,DUR,.5):
 at=int(start*sr);tt=np.arange(min(int(.35*sr),n-at))/sr
 kick=np.sin(2*np.pi*(48*tt+35*.035*(1-np.exp(-tt/.035))))*np.exp(-tt*17)*.3;a[at:at+len(tt)]+=kick
for k,start in enumerate(np.arange(.25,DUR,.5)):
 at=int(start*sr);tt=np.arange(min(int(.07*sr),n-at))/sr;noise=rng.normal(0,1,len(tt));noise=np.diff(noise,prepend=0);a[at:at+len(tt)]+=noise*np.exp(-tt*80)*.021
for j,start in enumerate(np.arange(0,DUR,2)):
 notes=[[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[164.81,196,246.94]][j%4]
 at=int(start*sr);tt=np.arange(min(int(2.5*sr),n-at))/sr;env=np.minimum(tt/.3,1)*np.exp(-tt*.9)
 a[at:at+len(tt)]+=sum(np.sin(2*np.pi*f*tt+0.2*np.sin(tt*3)) for f in notes)*env*.038
for start in [3,6,10,14,18,21]:
 at=int(start*sr);tt=np.arange(int(.45*sr))/sr;a[at:at+len(tt)]+=rng.normal(0,1,len(tt))*np.exp(-tt*13)*.04
fade=np.minimum(np.arange(n)/(sr*.3),1)*np.minimum((n-np.arange(n))/(sr*.8),1);a=np.tanh(a*1.3)*fade
stereo=np.stack([a,np.roll(a,330)*.98],axis=1)
with wave.open(OUT+'/original-soundtrack.wav','wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((stereo*26000).astype('<i2').tobytes())
for lang in ['fr','en']:
 target=f'{OUT}/make-it-happen-{lang}.mp4'
 p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',OUT+'/original-soundtrack.wav','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',target],stdin=subprocess.PIPE)
 for frame in range(FPS*DUR):p.stdin.write(render(frame/FPS,lang).tobytes())
 p.stdin.close();assert p.wait()==0
 render(22.5,lang).save(f'{OUT}/cover-{lang}.jpg',quality=95)
 print(target,flush=True)
# Contact sheet for visual QA.
ims=[render(t,'fr').resize((216,384)) for t in [1.3,4.5,8,12,16,19.5,23.5]]
sheet=Image.new('RGB',(216*7,384));[sheet.paste(im,(i*216,0)) for i,im in enumerate(ims)];sheet.save(OUT+'/contact-sheet.jpg')
