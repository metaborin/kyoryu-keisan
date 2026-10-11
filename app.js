(()=>{
"use strict";
const app=document.getElementById("app");
const REDUCE=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= 日付・乱数 ================= */
const pad=n=>String(n).padStart(2,"0");
const dkey=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>dkey(new Date());
const normD=s=>{const p=String(s).split("-");return p.length===3?p[0]+"-"+pad(p[1])+"-"+pad(p[2]):s;};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pickOne=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ================= ステージ ================= */
const AREAS=[
  {name:"ジャングル",cls:"jungle"},
  {name:"かざん",cls:"volcano"},
  {name:"うみ",cls:"sea"},
  {name:"こおりの くに",cls:"ice"}
];
const STAGES=[
  {id:"s1",name:"いくつと いくつ",area:0},
  {id:"s2",name:"たしざん",area:0},
  {id:"s3",name:"ひきざん",area:1},
  {id:"s4",name:"0の けいさん",area:1},
  {id:"s5",name:"3つの かず",area:2},
  {id:"s6",name:"くりあがり",area:2},
  {id:"s7",name:"くりさがり",area:3},
  {id:"s8",name:"おおきい かず",area:3}
];
const SPECIES=[
  {id:"steg",name:"ステゴサウルス",fact:"せなかに いたが ならんでいるよ"},
  {id:"tri",name:"トリケラトプス",fact:"3ぼんの つので みを まもるよ"},
  {id:"anky",name:"アンキロサウルス",fact:"しっぽの こぶで みを まもるよ"},
  {id:"para",name:"パラサウロロフス",fact:"あたまの とさかで おとを だしたかも"},
  {id:"brachio",name:"ブラキオサウルス",fact:"くびが ながくて とても おおきいよ"},
  {id:"ptera",name:"プテラノドン",fact:"そらを とぶ なかまだよ"},
  {id:"spino",name:"スピノサウルス",fact:"みずべで さかなを たべていたよ"},
  {id:"rex",name:"ティラノサウルス",fact:"きょうりゅうの おうさま!"}
];
const GROW=[{n:"たまご",at:0},{n:"ひびの はいった たまご",at:10},{n:"あかちゃん きょうりゅう",at:30},{n:"こども きょうりゅう",at:70},{n:"おとな きょうりゅう",at:150}];
const stageOf=f=>{let s=0;GROW.forEach((g,i)=>{if(f>=g.at)s=i;});return s;};

/* ================= 問題 ================= */
function Q(stage,disp,ans,say,hint){return {stage,disp,ans,say,hint,key:disp.join(" ")};}
const plus=(a,b,st)=>Q(st,[a,"+",b,"=","□"],a+b,`${a} たす ${b} は?`,{k:"add",a,b});
const minus=(a,b,st)=>Q(st,[a,"−",b,"=","□"],a-b,`${a} ひく ${b} は?`,{k:"sub",a,b});
const word=o=>o==="+"?"たす":"ひく";
const GEN={
  s1(){const n=rnd(2,10),a=rnd(1,n-1);return Q("s1",[n,"は",a,"と","□"],n-a,`${n} は ${a} と なに?`,{k:"bond",n,a});},
  s2(){const s=rnd(2,10),a=rnd(1,s-1);return plus(a,s-a,"s2");},
  s3(){const a=rnd(2,10),b=rnd(1,a-1);return minus(a,b,"s3");},
  s4(){const a=rnd(1,10);return pickOne([()=>plus(a,0,"s4"),()=>plus(0,a,"s4"),()=>minus(a,0,"s4"),()=>minus(a,a,"s4"),
    ()=>{const s=rnd(2,10),x=rnd(1,s-1);return plus(x,s-x,"s4");},()=>{const x=rnd(2,10);return minus(x,rnd(1,x-1),"s4");}])();},
  s5(){for(;;){const a=rnd(1,9),b=rnd(1,9),c=rnd(1,9),o1=pickOne(["+","−"]),o2=pickOne(["+","−"]);
    const m=o1==="+"?a+b:a-b;if(m<0||m>10)continue;const r=o2==="+"?m+c:m-c;if(r<0||r>10)continue;
    return Q("s5",[a,o1,b,o2,c,"=","□"],r,`${a} ${word(o1)} ${b} ${word(o2)} ${c} は?`,{k:"three",a,o1,b,o2,c,m});}},
  s6(){for(;;){const a=rnd(2,9),b=rnd(2,9);if(a+b>10)return plus(a,b,"s6");}},
  s7(){for(;;){const a=rnd(11,18),b=rnd(2,9);if(a-10<b)return minus(a,b,"s7");}},
  s8(){return pickOne([
    ()=>{const a=rnd(1,8)*10,b=rnd(1,(100-a)/10)*10;return plus(a,b,"s8");},
    ()=>{const a=rnd(2,10)*10,b=rnd(1,a/10-1)*10;return minus(a,b,"s8");},
    ()=>plus(rnd(1,9)*10,rnd(1,9),"s8"),
    ()=>{const t=rnd(1,9),o=rnd(0,8);return plus(t*10+o,rnd(1,9-o),"s8");},
    ()=>{const t=rnd(1,9),o=rnd(1,9);return minus(t*10+o,rnd(1,o),"s8");}
  ])();}
};
const fromOld=m=>m.op==="+"?plus(m.a,m.b,"s2"):minus(m.a,m.b,"s3");

/* ================= 保存 ================= */
const KEY="kyoryu-sansu-slots",OLD_KEY="kyoryu-sansu-v1",SLOTS=3;
const DEF_SET={sound:true,autoRead:false,goal:1,max:3,allOpen:false,seVol:.85,voiceVol:.6};
const blank=name=>({name,food:0,stars:{},days:[],mistakes:[],cardDone:0,day:{date:"",rounds:0},zukan:[],stats:{},log:{},set:{...DEF_SET},
  plays:{},best:{},fossils:{},mission:null,partner:null});
function upgrade(s,i){
  const o=Object.assign(blank("ぼうけんしゃ"+(i+1)),s||{});
  o.set=Object.assign({...DEF_SET},o.set||{});
  ["plays","best","fossils"].forEach(k=>{if(!o[k]||typeof o[k]!=="object")o[k]={};});
  if(o.stars&&("add" in o.stars||"sub" in o.stars||"mix" in o.stars)){
    const st={};if(o.stars.add)st.s2=o.stars.add;if(o.stars.sub)st.s3=o.stars.sub;o.stars=st;
    Object.keys(st).forEach(k=>{const sp=SPECIES[STAGES.findIndex(x=>x.id===k)];if(sp&&!o.zukan.includes(sp.id))o.zukan.push(sp.id);});
  }
  o.days=[...new Set((o.days||[]).map(normD))];
  o.day=o.day||{date:"",rounds:0};o.day.date=o.day.date?normD(o.day.date):"";
  o.mistakes=(o.mistakes||[]).map(m=>m&&m.disp?m:(m&&m.op?fromOld(m):null)).filter(Boolean);
  return o;
}
let DB={slots:Array(SLOTS).fill(null),last:0};
let migrated=false;
try{
  const raw=localStorage.getItem(KEY);
  if(raw)DB=Object.assign(DB,JSON.parse(raw));
  else{const old=localStorage.getItem(OLD_KEY);if(old){DB.slots[0]=upgrade(JSON.parse(old),0);migrated=true;}}
}catch(e){}
while(DB.slots.length<SLOTS)DB.slots.push(null);
let S=null,cur=-1,R=null;
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){}};
const save=()=>{if(cur>=0)DB.slots[cur]=S;persist();};
if(migrated)persist();
function pick(i){
  cur=i;DB.last=i;S=upgrade(DB.slots[i],i);
  if(S.day.date!==today())S.day={date:today(),rounds:0};
  save();home();
}
const unlocked=i=>!S||S.set.allOpen||i===0||(S.stars[STAGES[i-1].id]||0)>=1||(S.stars[STAGES[i].id]||0)>=1;

/* ================= 音・読み上げ ================= */
let ac=null,master=null;
const soundOn=()=>!S||S.set.sound;
const seVol=()=>S&&S.set.seVol!=null?S.set.seVol:DEF_SET.seVol;
const voiceVol=()=>S&&S.set.voiceVol!=null?S.set.voiceVol:DEF_SET.voiceVol;
function audio(){
  if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=10;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.15;
    master=ac.createGain();master.connect(comp).connect(ac.destination);}
  if(ac.state==="suspended")ac.resume();
  master.gain.value=seVol()*1.6;
  return ac;
}
/* 効果音:タブレットやノートPCの小さなスピーカーでも聞こえるよう、低すぎる音は1オクターブ上げ、倍音を足す */
function tone(seq,force){if(!force&&!soundOn())return;try{const a=audio();let t=a.currentTime+.01;
  seq.forEach(([f,d])=>{while(f<220)f*=2;
    const g=a.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d+.04);g.connect(master);
    const o=a.createOscillator();o.type="triangle";o.frequency.value=f;o.connect(g);
    const o2=a.createOscillator(),g2=a.createGain();o2.type="sine";o2.frequency.value=f*2;g2.gain.value=.3;o2.connect(g2).connect(g);
    [o,o2].forEach(x=>{x.start(t);x.stop(t+d+.06);});t+=d*.8;});}catch(e){}}
const sTap=()=>tone([[660,.06]]);
const sOk=()=>tone([[660,.11],[880,.11],[1175,.2]]);
const sNg=()=>tone([[392,.16],[349,.2]]);
const sFan=()=>tone([[523,.14],[659,.14],[784,.14],[1047,.32]]);
const sNew=()=>tone([[784,.12],[988,.12],[1175,.12],[1568,.36]]);
function speak(t){try{const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.9;u.volume=voiceVol();
  const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.startsWith("ja"));if(v)u.voice=v;
  speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
try{speechSynthesis.getVoices();}catch(e){}

/* ================= 絵 ================= */
const ART_ROOT="assets/art/";
const GROW_ART=["egg","egg-cracked","baby","child","adult"];
const art=(name,cls="",extra="")=>`<img class="game-art ${cls}" src="${ART_ROOT}${name}.webp" alt="" aria-hidden="true" draggable="false" width="314" height="314" ${extra}>`;
const dinoArt=st=>{const g=Math.max(0,Math.min(4,st));return art(GROW_ART[g],`dino-art g${g}`,'fetchpriority="high"');};
const speciesArt=(id,locked=false)=>art(id,`species-art ${locked?"locked-sp":""}`);
const starSVG=on=>`<svg viewBox="0 0 24 24" class="${on?"on":""}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on?"var(--sun)":"#e2dccb"}" stroke="${on?"#e0a400":"#cfc7b2"}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const starsRow=n=>`<span class="stars">${[1,2,3].map(i=>starSVG(n>=i)).join("")}</span>`;
const footSVG=(state,col)=>{const c=col||(state==="ok"?"var(--leaf)":state==="now"?"var(--lava)":"#d4cbb4");
  return `<svg viewBox="0 0 30 34" aria-hidden="true"><ellipse cx="15" cy="22" rx="9" ry="10" fill="${c}"/><ellipse cx="5" cy="9" rx="4" ry="6" fill="${c}" transform="rotate(-20 5 9)"/><ellipse cx="15" cy="5" rx="4" ry="5.5" fill="${c}"/><ellipse cx="25" cy="9" rx="4" ry="6" fill="${c}" transform="rotate(20 25 9)"/></svg>`;};
const meat=`<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M8 24 L4 28" stroke="#f3ead6" stroke-width="5" stroke-linecap="round"/><circle cx="3.5" cy="28.5" r="3" fill="#f3ead6"/><ellipse cx="18" cy="14" rx="12" ry="10" fill="#c4553a" transform="rotate(-40 18 14)"/><ellipse cx="20" cy="11" rx="5" ry="3" fill="#e98a6c" transform="rotate(-40 20 11)"/></svg>`;
const spk=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const lockSVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`;
const mapSVG=art("map","map-art");
const bookArt=art("journal","journal-art");
const retrySVG=`<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#f6b0a0"/><path d="M15 25 a9 9 0 1 0 3 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M14 11 v8 h8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const sceneArt=cls=>`<img class="scene-art" src="${ART_ROOT}${cls}.webp" alt="" aria-hidden="true" draggable="false" width="627" height="627">`;

/* ================= 演出 ================= */
function burst(el,n=16){
  if(REDUCE||!el)return;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  const L=document.createElement("div");L.className="fx";document.body.appendChild(L);
  for(let i=0;i<n;i++){const s=document.createElement("i"),a=Math.random()*Math.PI*2,d=60+Math.random()*110;
    s.style.left=x+"px";s.style.top=y+"px";s.style.setProperty("--dx",Math.cos(a)*d+"px");s.style.setProperty("--dy",(Math.sin(a)*d-50)+"px");
    s.style.background=pickOne(["#ffcb3d","#f06a2c","#6cc070","#3a7bb8","#e58fb0"]);L.appendChild(s);}
  setTimeout(()=>L.remove(),1000);
}
function hopEl(el){if(!el)return;el.classList.remove("hop");void el.offsetWidth;el.classList.add("hop");}
const LINES=["きょうも がんばろう!","ごはん ちょうだい!","ぼうけんに いこう!","けいさん たのしいね","なでなで うれしいな","おおきく なりたいな"];
function sayBubble(el,text){if(!el)return;el.textContent=text;el.classList.add("on");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("on"),1800);}

/* ================= タイトル ================= */
function slotCard(s,i){
  if(!s)return `<div class="slot empty"><button class="open" data-new="${i}">
      <span class="plus">+</span><span class="nm">あたらしく はじめる</span><span class="meta">ノート ${i+1}</span></button></div>`;
  const u=upgrade(s,i),st=stageOf(u.food),stars=Object.values(u.stars).reduce((a,b)=>a+b,0);
  return `<div class="slot" data-slot="${i}"><button class="open" data-pick="${i}">
      ${dinoArt(st)}<span class="nm">${esc(u.name)}</span>
      <span class="meta">${meat} ${u.food} ・ ほし ${stars}/24 ・ なかま ${u.zukan.length}/8</span></button>
      <button class="del" data-del="${i}">けす</button></div>`;
}
function title(){
  R=null;S=null;cur=-1;
  app.innerHTML=`<section class="screen title">
    <div class="title-hero"><div class="title-dino" id="tdino">${dinoArt(4)}</div>
      <h1 class="title-logo">きょうりゅう<span>けいさん</span></h1></div>
    <div class="parade">${["tri","steg","brachio","ptera","rex"].map(id=>speciesArt(id)).join("")}</div>
    <p class="title-sub">ぼうけんノートを えらんでね</p>
    <div class="slots">${DB.slots.map(slotCard).join("")}</div></section>`;
  app.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{tone([[523,.1],[784,.15]]);pick(+b.dataset.pick);});
  app.querySelectorAll("[data-new]").forEach(b=>b.onclick=()=>{sTap();newSlot(+b.dataset.new);});
  app.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>askDelete(+b.dataset.del));
  const t=document.getElementById("tdino");t.onclick=()=>{hopEl(t);tone([[392,.1],[523,.1],[784,.2]]);};
}
function askDelete(i){
  const card=app.querySelector(`[data-slot="${i}"]`);if(!card)return;
  card.classList.add("asking");
  card.innerHTML=`<p class="ask">「${esc(DB.slots[i].name)}」の ノートを けすと、きょうりゅうも きろくも なくなります。</p>
    <div class="ask-btns"><button class="btn" id="noDel">けさない</button><button class="btn danger" id="yesDel">けす</button></div>`;
  document.getElementById("noDel").onclick=title;
  document.getElementById("yesDel").onclick=()=>{DB.slots[i]=null;persist();title();};
}
function newSlot(i){
  app.innerHTML=`<section class="screen title">
    <div class="egg-new">${dinoArt(0)}</div>
    <form class="name-form" id="nf">
      <label for="nameIn" class="title-sub">なまえを いれてね</label>
      <input id="nameIn" maxlength="8" autocomplete="off" placeholder="ぼうけんしゃ${i+1}">
      <div class="btns"><button type="button" class="btn" id="back">もどる</button><button type="submit" class="btn main">はじめる</button></div>
    </form></section>`;
  const inp=document.getElementById("nameIn");
  setTimeout(()=>{try{inp.focus();}catch(e){}},50);
  document.getElementById("back").onclick=title;
  document.getElementById("nf").onsubmit=e=>{e.preventDefault();
    const name=inp.value.trim().slice(0,8)||("ぼうけんしゃ"+(i+1));
    DB.slots[i]=blank(name);persist();sFan();pick(i);};
}

/* ================= くりかえし あそびの しくみ ================= */
const MEDALS=[{n:3,name:"どう",c:"#c98a4b"},{n:10,name:"ぎん",c:"#a9b4bf"},{n:25,name:"きん",c:"#e8b923"}];
const medalOf=n=>{let m=-1;MEDALS.forEach((x,i)=>{if(n>=x.n)m=i;});return m;};
const medalSVG=(i,size=28)=>`<img class="medal-art" src="${ART_ROOT}medal-${["bronze","silver","gold"][i]}.webp" alt="" aria-hidden="true" draggable="false" width="${size}" height="${size*1.25}">`;
const stageBest=id=>S.best[id]||(S.best[id]={time:0,speed:0,race:1});
const cleared=id=>(S.stars[id]||0)>=1;
const PER_Q={s1:6,s2:6,s3:6,s4:5,s5:10,s6:8,s7:9,s8:9};
const rivalMs=(id,lv)=>Math.round(PER_Q[id]*10*1000*1.5*Math.pow(.88,lv-1));
const fmtTime=s=>{s=Math.round(s);return s>=60?`${Math.floor(s/60)}ふん ${s%60}びょう`:`${s}びょう`;};

/* ---- ミッション ---- */
const MISSIONS=[
  {id:"combo5",t:"れんぞく 5もん せいかい",ok:r=>r.maxCombo>=5},
  {id:"star3",t:"ぼうけんで ほしを 3つ とる",ok:r=>r.mode==="adv"&&r.stars===3},
  {id:"race",t:"レースで ライバルに かつ",ok:r=>r.mode==="race"&&r.won,need:true},
  {id:"speed8",t:"60びょうで 8もん せいかい",ok:r=>r.mode==="speed"&&r.count>=8,need:true},
  {id:"nohint",t:"ヒントを みないで さいごまで",ok:r=>r.mode!=="speed"&&r.finished&&!r.hintUsed},
  {id:"q20",t:"きょう 20もん とく",ok:()=>(S.log[today()]||0)>=20},
  {id:"two",t:"きょう 2かい あそぶ",ok:()=>S.day.rounds>=2},
  {id:"choice3",t:"えらぶ もんだいで 3もん せいかい",ok:r=>r.choiceOk>=3},
  {id:"gold",t:"きんの たまご もんだいに せいかい",ok:r=>r.goldOk}
];
const hashStr=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const seeded=seed=>()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
function ensureMissions(){
  if(S.mission&&S.mission.date===today())return;
  const any=STAGES.some(s=>cleared(s.id));
  const pool=MISSIONS.filter(m=>!m.need||any).map(m=>m.id);
  const r=seeded(hashStr(today()+"|"+cur+"|"+S.name));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  S.mission={date:today(),list:pool.slice(0,3).map(id=>({id,done:false})),bonus:false};
}
function checkMissions(run){
  ensureMissions();const got=[];
  S.mission.list.forEach(m=>{if(m.done)return;const d=MISSIONS.find(x=>x.id===m.id);if(d&&d.ok(run)){m.done=true;got.push(d);S.food+=5;}});
  let all=false;if(!S.mission.bonus&&S.mission.list.every(m=>m.done)){S.mission.bonus=true;all=true;}
  return {got,all};
}

/* ---- かせき ---- */
const fossilCount=id=>(S.fossils[id]||[]).length;
const fossilTotal=()=>SPECIES.reduce((n,sp)=>n+fossilCount(sp.id),0);
function rollFossil(prefer){
  const missing=[];SPECIES.forEach(sp=>{const h=S.fossils[sp.id]||[];for(let p=0;p<4;p++)if(!h.includes(p))missing.push([sp.id,p]);});
  if(!missing.length){S.food+=3;return null;}
  const pref=missing.filter(m=>m[0]===prefer);
  const [id,p]=pickOne(pref.length&&Math.random()<.5?pref:missing);
  (S.fossils[id]=S.fossils[id]||[]).push(p);
  return {id,p,complete:fossilCount(id)===4};
}
const fossilPiece=(id,p)=>`<span class="fp" style="background-image:url('${ART_ROOT}fossil-${id}.webp');background-position:${p%2?"100%":"0%"} ${p>1?"100%":"0%"}"></span>`;
const fossilBoard=(id,cls="")=>`<div class="fboard ${cls} ${fossilCount(id)===4?"full":""}">${[0,1,2,3].map(p=>(S.fossils[id]||[]).includes(p)?fossilPiece(id,p):`<span class="fp empty"></span>`).join("")}</div>`;
const spName=id=>{const sp=SPECIES.find(s=>s.id===id);return S.zukan.includes(id)?sp.name:"なぞの きょうりゅう";};

/* ================= おうち ================= */
function home(){
  stopRun();R=null;ensureMissions();save();
  const st=stageOf(S.food),next=GROW[st+1];
  const pct=next?Math.round((S.food-GROW[st].at)/(next.at-GROW[st].at)*100):100;
  const stamps=S.days.length-S.cardDone*10;
  const goal=S.set.goal,done=S.day.rounds;
  const nextStage=STAGES.findIndex((s,i)=>unlocked(i)&&!cleared(s.id));
  const tired=S.set.max>0&&done>=S.set.max;
  const ms=S.mission.list.map(m=>({...m,d:MISSIONS.find(x=>x.id===m.id)})).filter(m=>m.d);
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="logo">きょうりゅう <span>けいさん</span></h1>
      <div class="top-r"><div class="pill">${meat} ごはん <b>${S.food}</b></div>
        <button class="quit" id="toTitle">ノートを かえる</button></div></div>
    <div class="home">
      <div class="nest">
        <p class="dino-name">${esc(S.name)}の ${GROW[st].n}</p>
        <div class="dino-wrap ${st<=1?"is-egg":""}" id="dwrap"><div class="floor" id="floor"></div>
          <div class="walker" id="walker"><div class="face" id="face"><div class="dino-box" id="dino"><div class="idle" id="idle"><div class="act" id="act">${dinoArt(st)}</div></div></div></div>
            <div class="zzz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></div><div class="bubble" id="bub"></div></div></div>
        ${st>=2?`<button class="feed-btn" id="feed">${meat} ごはんを あげる</button>`:""}
        <div class="grow"><div class="grow-label"><span>せいちょう</span><span>${next?`つぎまで ごはん あと ${next.at-S.food}`:"いちばん おおきく なったよ!"}</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div></div>
      </div>
      <div class="side">
        ${tired?`<p class="notice">きょうは たくさん がんばったね! つづきは あしたに しよう。</p>`:""}
        <button class="go-adv" id="toMap">${mapSVG}<span class="t">ぼうけんに いく<small>${nextStage>=0?`つぎは「${STAGES[nextStage].name}」`:"すきな ステージで あそぼう!"}</small></span></button>
        <div class="missions"><h2>きょうの ミッション <small>${S.mission.bonus?"ぜんぶ クリア!":"ぜんぶ できたら たからばこ"}</small></h2>
          <ul>${ms.map(m=>`<li class="${m.done?"done":""}"><span class="chk">${m.done?"✓":""}</span>${m.d.t}<em>+5</em></li>`).join("")}</ul>
          <div class="goal-line">きょうの もくひょう <span class="gd">${Array.from({length:goal},(_,i)=>`<i class="${i<done?"on":""}"></i>`).join("")}</span>
            <span>${done>=goal?"たっせい!":`あと ${goal-done}かい`}</span></div></div>
        <div class="two">
          <button class="tile" id="toZukan">${bookArt}<span>ずかん<small>なかま ${S.zukan.length}/8 ・ かせき ${fossilTotal()}/32</small></span></button>
          <button class="tile" id="toReview" ${S.mistakes.length?"":"disabled"}>${retrySVG}<span>ふくしゅう<small>${S.mistakes.length?`${S.mistakes.length}もん`:"いまは ないよ"}</small></span></button>
        </div>
        <div class="stamp"><h2>スタンプカード <small>${S.days.includes(today())?"きょうの スタンプ ゲット!":"1かい あそぶと 1こ"}</small></h2>
          <div class="stamp-grid">${Array.from({length:10},(_,i)=>`<span class="${i<stamps?"on":""}">${i<stamps?footSVG("","#fff"):""}</span>`).join("")}</div>
          <p>10こ たまると ごはん 10こ プレゼント</p></div>
        <button class="parent-btn" id="toParent"><i class="hold-fill"></i><span>おうちのかたへ(ながおし)</span></button>
      </div>
    </div></section>`;
  document.getElementById("toMap").onclick=()=>{sTap();map();};
  document.getElementById("toZukan").onclick=()=>{sTap();zukan();};
  document.getElementById("toReview").onclick=()=>{sTap();start("review","review");};
  document.getElementById("toTitle").onclick=title;
  const d=document.getElementById("dino"),b=document.getElementById("bub");
  d.onclick=()=>{const w=document.getElementById("dwrap");if(w&&w.classList.contains("sleep")){w.classList.remove("sleep");setPose(null);idleKick();sayBubble(b,"あっ、おはよう!");hopEl(d);tone([[659,.1],[880,.15]]);return;}
    idleKick();hopEl(d);tone([[523,.1],[784,.15]]);sayBubble(b,pickOne(LINES));};
  const fb=document.getElementById("feed");if(fb)fb.onclick=feed;
  startIdle(st);
  bindHold(document.getElementById("toParent"),1500,parent);
}


/* ---- ホームの恐竜の ひとりあそび ---- */
/* ポーズ画像(あとから追加できる)
   assets/art/pose/<baby|child|adult>-<pose>.webp を置き、ここに名前を書くと自動で使われます。
   pose: walk-a, walk-b, eat-a, eat-b, sleep, roar, dig, look
   小物 assets/art/<name>.webp: meat, fern, dragonfly, dirt */
const POSES={baby:["walk-a","walk-b","eat-a","eat-b","sleep","roar","dig","look"],child:["walk-a","walk-b","eat-a","eat-b","sleep","roar","dig","look"],adult:["walk-a","walk-b","eat-a","eat-b","sleep","roar","dig","look"]};
const PROPS=["meat","fern","dragonfly","dirt"];
const IDLE_LINES=["おなか すいたなあ","けいさん しようよ!","ふわぁ…","なにして あそぶ?","きょうも ぼうけんだ!","ガオー!","いい てんきだね","あるくの たのしい!"];
const EGG_LINES=["コトコト…","もうすぐ うまれるかな?","ころん"];
const PROP_SVG={
  meat:`<svg viewBox="0 0 64 48"><path d="M10 38 L4 44" stroke="#f3ead6" stroke-width="7" stroke-linecap="round"/><circle cx="4" cy="44" r="4" fill="#f3ead6"/><ellipse cx="34" cy="24" rx="24" ry="17" fill="#b9472f" transform="rotate(-18 34 24)"/><ellipse cx="38" cy="18" rx="11" ry="5" fill="#e98a6c" transform="rotate(-18 38 18)"/></svg>`,
  fern:`<svg viewBox="0 0 64 48"><g stroke="#3d6444" stroke-width="3" fill="none" stroke-linecap="round"><path d="M32 46 Q30 26 18 8"/><path d="M32 46 Q36 24 50 10"/><path d="M32 46 Q32 22 34 4"/></g><g fill="#5f9a54"><ellipse cx="22" cy="18" rx="7" ry="3" transform="rotate(-50 22 18)"/><ellipse cx="26" cy="28" rx="7" ry="3" transform="rotate(-40 26 28)"/><ellipse cx="44" cy="18" rx="7" ry="3" transform="rotate(45 44 18)"/><ellipse cx="40" cy="28" rx="7" ry="3" transform="rotate(35 40 28)"/><ellipse cx="33" cy="14" rx="3" ry="7"/></g></svg>`,
  dragonfly:`<svg viewBox="0 0 64 40"><g fill="#bfe3f0" stroke="#7fb4c9" stroke-width="1"><ellipse cx="22" cy="12" rx="16" ry="5" transform="rotate(-12 22 12)"/><ellipse cx="42" cy="12" rx="16" ry="5" transform="rotate(12 42 12)"/><ellipse cx="22" cy="22" rx="13" ry="4" transform="rotate(10 22 22)"/><ellipse cx="42" cy="22" rx="13" ry="4" transform="rotate(-10 42 22)"/></g><rect x="30" y="8" width="4" height="30" rx="2" fill="#3a7bb8"/><circle cx="32" cy="7" r="4" fill="#2f6698"/></svg>`,
  dirt:`<svg viewBox="0 0 64 32"><ellipse cx="32" cy="24" rx="28" ry="9" fill="#9c7448"/><ellipse cx="26" cy="20" rx="14" ry="7" fill="#b88b58"/><circle cx="44" cy="18" r="4" fill="#8a6440"/></svg>`
};
const propHTML=n=>PROPS.includes(n)?`<img src="${ART_ROOT}${n}.webp" alt="" draggable="false">`:PROP_SVG[n];
const stageKey=st=>["","","baby","child","adult"][st]||"";

const P={st:0,busy:false,x:0,face:1,timer:0,last:0,frame:0};
function idleKick(){P.last=performance.now();}
const $id=id=>document.getElementById(id);
const petAlive=()=>!!$id("walker");
function petImg(){return document.querySelector("#act img");}
function setPose(pose){
  const img=petImg();if(!img)return;
  const k=stageKey(P.st);
  img.src=pose&&k&&POSES[k]&&POSES[k].includes(pose)?`${ART_ROOT}pose/${k}-${pose}.webp`:`${ART_ROOT}${GROW_ART[P.st]}.webp`;
}
const hasPose=p=>{const k=stageKey(P.st);return !!(k&&POSES[k]&&POSES[k].includes(p));};
function setAct(name){const a=$id("act");if(!a)return;a.className="act";void a.offsetWidth;if(name)a.classList.add("a-"+name);const w=$id("dwrap");if(w)w.classList.toggle("posed",hasPose("walk-a"));}
function faceTo(dir){P.face=dir;const f=$id("face");if(f)f.style.transform=`scaleX(${dir})`;}
function range(){const w=$id("dwrap"),k=$id("walker");if(!w||!k)return 0;return Math.max(0,(w.clientWidth-k.clientWidth)/2-6);}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function walkTo(x){
  const k=$id("walker"),idle=$id("idle");if(!k)return;
  const r=range();x=Math.max(-r,Math.min(r,x));
  const dist=Math.abs(x-P.x);if(dist<8)return;
  faceTo(x>P.x?1:-1);
  const ms=Math.max(700,dist*14);
  idle&&idle.classList.add("walking");
  let flip=null;
  if(hasPose("walk-a")&&hasPose("walk-b")){let f=0;setPose("walk-a");flip=setInterval(()=>{f^=1;setPose(f?"walk-b":"walk-a");},180);}
  k.style.transition=`transform ${ms}ms linear`;k.style.transform=`translateX(${x}px)`;
  const steps=Math.floor(ms/420);for(let i=0;i<steps;i++)setTimeout(()=>petAlive()&&!P.quiet&&tone([[90+Math.random()*20,.05]]),i*420+200);
  await wait(ms);
  clearInterval(flip);setPose(null);
  idle&&idle.classList.remove("walking");
  P.x=x;
}
function placeProp(name,x,cls=""){
  const fl=$id("floor");if(!fl)return null;
  const el=document.createElement("span");el.className=`prop prop-${name} ${cls}`;el.innerHTML=propHTML(name);
  el.style.left=`calc(50% + ${x}px)`;fl.appendChild(el);return el;
}
function crumbs(el,color,n=8){
  if(!el||REDUCE)return;const r=el.getBoundingClientRect();
  const L=document.createElement("div");L.className="fx";document.body.appendChild(L);
  for(let i=0;i<n;i++){const s=document.createElement("i");s.style.left=(r.left+r.width/2)+"px";s.style.top=(r.top+r.height/2)+"px";
    s.style.setProperty("--dx",(Math.random()*60-30)+"px");s.style.setProperty("--dy",(-20-Math.random()*30)+"px");s.style.background=color;s.style.width=s.style.height="7px";L.appendChild(s);}
  setTimeout(()=>L.remove(),1000);
}

/* ---- うごき ---- */
const ACTS={
  async walk(){const r=range();await walkTo((Math.random()*2-1)*r);if(Math.random()<.35)say(pickOne(["てくてく","おさんぽ たのしい!","あっちに いこう"]));},
  async eat(food){
    food=food||"fern";const r=range(),k=$id("walker");if(!k)return;
    const fx=(Math.random()*2-1)*r*.9;const el=placeProp(food,fx,"drop");
    await wait(500);
    const off=k.clientWidth*.32;const target=fx+(fx>=P.x?-off:off);
    await walkTo(target);faceTo(fx>=P.x?1:-1);
    for(let i=0;i<3;i++){
      setAct("eat");if(hasPose("eat-a"))setPose(i%2?"eat-b":"eat-a");
      tone([[300+Math.random()*80,.05],[240,.05]]);
      await wait(380);if(el){el.style.transform=`translateX(-50%) scale(${1-.3*(i+1)})`;crumbs(el,food==="meat"?"#b9472f":"#5f9a54",6);}
      await wait(320);
    }
    setPose(null);el&&el.remove();setAct("happy");say(pickOne(["おいしい!","もぐもぐ… おいしかった!","おなか いっぱい!"]));
    tone([[523,.08],[659,.08],[784,.14]]);await wait(900);
  },
  async dig(){
    const fl=$id("walker");setAct("dig");if(hasPose("dig"))setPose("dig");
    const k=$id("walker");const x=P.x+(P.face*(k?k.clientWidth*.22:40));const el=placeProp("dirt",x,"grow-in");
    for(let i=0;i<4;i++){tone([[140+Math.random()*40,.04]]);crumbs(el,"#9c7448",5);await wait(300);}
    setPose(null);setAct("");
    say(pickOne(["かせき あるかな?","なにも なかった…","ほりほり","この したに たからが…?"]));
    await wait(1400);el&&el.classList.add("fade");await wait(600);el&&el.remove();
  },
  async chase(){
    const fl=$id("floor");if(!fl)return;
    const fly=document.createElement("span");fly.className="flyer";fly.innerHTML=propHTML("dragonfly");fl.appendChild(fly);
    const from=Math.random()<.5?-1:1;fly.style.setProperty("--from",from);
    say("あっ、トンボだ!");setAct("look");if(hasPose("look"))setPose("look");faceTo(-from);
    await wait(1200);setPose(null);
    await walkTo(-from*range()*.6);setAct("jump");tone([[392,.08],[523,.1]]);await wait(700);
    say(pickOne(["にげられた〜","まてまて〜!","はやいなあ"]));
    await wait(1600);fly.remove();
  },
  async roar(){setAct("roar");if(hasPose("roar"))setPose("roar");say("ガオー!");tone([[160,.18],[130,.25]]);await wait(1300);setPose(null);setAct("");},
  async small(){const a=pickOne(["look","sway","stretch","stomp","tail"]);setAct(a);if(a==="stomp")setTimeout(()=>tone([[110,.08],[98,.1]]),350);
    if(Math.random()<.3)say(pickOne(IDLE_LINES));await wait(1800);},
  async home(){await walkTo(0);faceTo(1);}
};
function say(t){sayBubble($id("bub"),t);}
async function runAct(name,arg){
  if(P.busy||!petAlive())return;P.busy=true;
  try{await ACTS[name](arg);}catch(e){}
  if(petAlive()){setAct("");setPose(null);}
  P.busy=false;
}
function feed(){
  idleKick();const w=$id("dwrap");if(w&&w.classList.contains("sleep")){w.classList.remove("sleep");setPose(null);}
  if(P.st<=1){say("うまれたら たべるね!");hopEl($id("dino"));return;}
  if(P.busy){say("ちょっと まってね");return;}
  runAct("eat","meat");
}
function startIdle(st){
  clearTimeout(P.timer);P.st=st;P.busy=false;P.x=0;P.face=1;P.last=performance.now();
  if(REDUCE)return;
  const egg=st<=1;
  const table=egg?[]:[["walk",4],["small",4],["eat",1.5],["dig",1.2],["chase",1],["roar",1]];
  const loop=async()=>{
    const w=$id("dwrap"),a=$id("act");if(!w||!a)return;
    if(performance.now()-P.last>30000&&!w.classList.contains("sleep")&&!P.busy){
      await runAct("home");if(!petAlive())return;w.classList.add("sleep");setAct("");if(hasPose("sleep"))setPose("sleep");}
    if(!w.classList.contains("sleep")&&!P.busy){
      if(egg){setAct(pickOne(["wobble","wobble","rock","peek"]));if(Math.random()<.3)say(pickOne(EGG_LINES));}
      else{let t=Math.random()*table.reduce((s,x)=>s+x[1],0),pick="small";for(const [n,wt] of table){if((t-=wt)<0){pick=n;break;}}
        runAct(pick);}
    }
    P.timer=setTimeout(loop,3200+Math.random()*3000);
  };
  P.timer=setTimeout(loop,1500);
}

/* ================= ちず ================= */
function map(){
  stopRun();R=null;
  const nextStage=STAGES.findIndex((s,i)=>unlocked(i)&&!cleared(s.id));
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="h-title">ぼうけんの ちず</h1><button class="quit" id="back">おうちへ</button></div>
    <div class="areas">${AREAS.map((a,ai)=>{
      const sts=STAGES.map((s,i)=>({...s,i})).filter(s=>s.area===ai);
      const open=unlocked(sts[0].i);
      const got=sts.reduce((n,s)=>n+(S.stars[s.id]||0),0);
      return `<div class="area ${a.cls} ${open?"":"lock"}"><div class="scene">${sceneArt(a.cls)}</div>
        <h2>${a.name}<small>ほし ${got}/6</small></h2>
        <div class="nodes">${sts.map(s=>{const ok=unlocked(s.i),md=medalOf(S.plays[s.id]||0);return `
          <button class="node ${s.i===nextStage?"next":""}" data-st="${s.id}" ${ok?"":"disabled"} aria-label="${s.name}">
            <span class="c">${ok?s.i+1:lockSVG}${md>=0?`<span class="nmedal">${medalSVG(md,22)}</span>`:""}</span><span class="nn">${s.name}</span>${starsRow(S.stars[s.id]||0)}</button>`;}).join("")}
        </div></div>`;}).join("")}
    </div></section>`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll(".node[data-st]").forEach(b=>b.onclick=()=>{sTap();stageMenu(b.dataset.st);});
}

/* ================= ステージの あそびかた ================= */
function stageMenu(id){
  stopRun();R=null;
  const idx=STAGES.findIndex(s=>s.id===id),stg=STAGES[idx],area=AREAS[stg.area],b=stageBest(id);
  const plays=S.plays[id]||0,md=medalOf(plays),nextM=MEDALS[md+1];
  const open=cleared(id);
  const lockNote=`<span class="mlock">ぼうけんを 1かい クリアすると あそべるよ</span>`;
  app.innerHTML=`<section class="screen">
    <div class="top"><button class="quit" id="back">ちずへ</button></div>
    <div class="smenu ${area.cls}">
      <div class="sm-head"><div class="sm-scene">${sceneArt(area.cls)}</div>
        <div class="sm-title"><span class="sm-no">${idx+1}</span><div><small>${area.name}</small><h1>${stg.name}</h1></div></div></div>
      <div class="modes">
        <button class="mode adv" data-m="adv"><span class="mt">ぼうけん</span><span class="md">10もん とこう</span>
          <span class="mr">${starsRow(S.stars[id]||0)}${b.time?`<span>じこベスト ${fmtTime(b.time)}</span>`:""}</span></button>
        <button class="mode race" data-m="race" ${open?"":"disabled"}><span class="mt">きょうりゅう レース</span><span class="md">ライバルより さきに ゴール!</span>
          <span class="mr">${open?`<span class="mart">${speciesArt(rivalOf(id))}</span><span>ライバル レベル ${b.race}</span>`:lockNote}</span></button>
        <button class="mode speed" data-m="speed" ${open?"":"disabled"}><span class="mt">60びょう チャレンジ</span><span class="md">60びょうで なんもん とける?</span>
          <span class="mr">${open?`<span>さいこう きろく ${b.speed}もん</span>`:lockNote}</span></button>
      </div>
      <div class="medal-row">${MEDALS.map((m,i)=>`<span class="mslot ${i<=md?"on":""}">${medalSVG(i,26)}<small>${m.n}かい</small></span>`).join("")}
        <p>この ステージで あそんだ かいすう <b>${plays}</b>かい${nextM?` ・ つぎの ${nextM.name}くんしょうまで あと ${nextM.n-plays}かい`:" ・ きんくんしょう!"}</p></div>
    </div></section>`;
  document.getElementById("back").onclick=map;
  app.querySelectorAll(".mode[data-m]").forEach(btn=>btn.onclick=()=>{sTap();start(id,btn.dataset.m);});
}
const rivalOf=id=>{const i=STAGES.findIndex(s=>s.id===id);return SPECIES[(i+3)%SPECIES.length].id;};

/* ================= もんだい ================= */
function withChoices(q){
  const c=new Set([q.ans]),st=q.ans>=20?10:1;
  for(const v of shuffle([q.ans+st,q.ans-st,q.ans+2*st,q.ans-2*st,q.ans+1,q.ans-1,q.ans+2])){if(c.size>=3)break;if(v>=0)c.add(v);}
  return {...q,choices:shuffle([...c])};
}
function freshQ(){
  const recent=new Set(R.qs.slice(-6).map(q=>q.key));
  if(R.mode==="race"&&Math.random()<.15){const m=S.mistakes.find(m=>m.stage===R.id&&!recent.has(m.key));if(m)return {...m,review:true};}
  let q;for(let g=0;g<50;g++){q=GEN[R.id]();if(!recent.has(q.key))break;}
  return q;
}
function decorate(q,i){
  if(R.mode!=="speed"&&Math.random()<.3)q=withChoices(q);else q={...q};delete q.gold;
  if(R.mode==="adv"&&i===R.goldAt)q.gold=true;
  if(R.mode==="speed")delete q.choices;
  return q;
}
function makeSet(id){
  const qs=[],seen=new Set();
  const add=q=>{if(seen.has(q.key))return;seen.add(q.key);qs.push(q);};
  if(id==="review"){S.mistakes.slice(0,10).forEach(m=>add({...m,review:true}));return shuffle(qs);}
  S.mistakes.filter(m=>m.stage===id).slice(0,2).forEach(m=>add({...m,review:true}));
  let g=0;while(qs.length<10&&g++<1000)add(GEN[id]());
  return shuffle(qs);
}
let RUN_SEQ=0;
function start(id,mode){
  stopRun();
  R={id,mode,seq:++RUN_SEQ,qs:[],i:0,input:"",tries:0,firstOk:0,food:0,lock:false,combo:0,maxCombo:0,hintLv:0,
     hintUsed:false,choiceOk:0,goldOk:false,correct:0,count:0,t0:performance.now(),over:false,goldAt:rnd(2,9),wrongPick:[]};
  if(mode==="adv"||mode==="review"){R.qs=makeSet(id).map((q,i)=>decorate(q,i));if(!R.qs.length){home();return;}}
  else{R.qs=[decorate(freshQ(),0)];}
  if(mode==="race"){R.lv=stageBest(id).race;R.rival=rivalOf(id);R.rivalMs=rivalMs(id,R.lv);}
  if(mode==="speed"){R.tEnd=R.t0+60000;}
  quiz();
  if(mode==="race"||mode==="speed")tick();
}
function stopRun(){if(R){R.over=true;cancelAnimationFrame(R.raf);}}
const later=(fn,ms)=>{const seq=R.seq;setTimeout(()=>{if(R&&R.seq===seq&&!R.over)fn();},ms);};
const stageName=id=>id==="review"?"ふくしゅう":STAGES.find(s=>s.id===id).name;
const MODE_NAME={adv:"",race:"レース",speed:"60びょう",review:""};

function headerHTML(){
  if(R.mode==="race"){const p=R.correct/10;
    return `<div class="track"><div class="lane me"><span class="runner" id="rMe" style="left:calc((100% - 72px) * ${p})">${dinoArt(Math.max(2,stageOf(S.food)))}</span></div>
      <div class="lane rv"><span class="runner" id="rRv" style="left:0">${speciesArt(R.rival)}</span></div><span class="flag" aria-hidden="true"></span>
      <span class="left">ゴールまで あと <b>${10-R.correct}</b>もん</span></div>`;}
  if(R.mode==="speed"){return `<div class="timer">${art("stopwatch","timer-art")}<div class="tbar"><i id="tbar"></i></div><span class="tsec" id="tsec">60</span><span class="tcount">せいかい <b id="tcnt">${R.count}</b></span></div>`;}
  return `<div class="steps">${R.qs.map((x,i)=>footSVG(i<R.i?"ok":i===R.i?"now":"")).join("")}</div>`;
}
function tick(){
  if(!R||R.over)return;const now=performance.now();
  if(R.mode==="race"){const p=Math.min(1,(now-R.t0)/R.rivalMs),el=document.getElementById("rRv");
    if(el)el.style.left=`calc((100% - 72px) * ${p})`;
    if(p>=1&&!R.goal){finishRun({won:false});return;}}
  if(R.mode==="speed"){const left=Math.max(0,R.tEnd-now),b=document.getElementById("tbar"),s=document.getElementById("tsec");
    if(b)b.style.width=(left/600)+"%";if(s)s.textContent=Math.ceil(left/1000);
    if(s)s.classList.toggle("hurry",left<10000);
    if(left<=0){finishRun({});return;}}
  R.raf=requestAnimationFrame(tick);
}

function quiz(){
  const q=R.qs[R.i];
  const toks=q.disp.map(t=>t==="□"?`<span class="box" id="box">${R.input||"&nbsp;"}</span>`:
    t==="+"||t==="−"?`<span class="op">${t}</span>`:(t==="は"||t==="と")?`<span class="w">${t}</span>`:`<span>${t}</span>`).join("");
  const long=q.disp.length>5||q.disp.some(t=>typeof t==="number"&&t>=10);
  const buddy=S.partner&&S.zukan.includes(S.partner)?speciesArt(S.partner):dinoArt(Math.max(2,stageOf(S.food)));
  const pad=q.choices?`<div class="choices">${q.choices.map(v=>`<button class="egg-btn" data-c="${v}" ${R.wrongPick.includes(v)?"disabled":""}><span>${v}</span></button>`).join("")}</div>
      <button class="key sm hintkey" data-n="hint">ヒント</button>`:
    `${[7,8,9,4,5,6,1,2,3].map(n=>`<button class="key" data-n="${n}">${n}</button>`).join("")}
      <button class="key sm" data-n="del">けす</button><button class="key" data-n="0">0</button>${R.mode==="speed"?`<button class="key sm" data-n="skip">とばす</button>`:`<button class="key sm" data-n="hint">ヒント</button>`}
      <button class="key go" id="go">こたえる</button>`;
  app.innerHTML=`<section class="screen">
    <div class="qtop"><button class="quit" id="quit">${R.mode==="review"?"おうちへ":"やめる"}</button>
      <span class="qname">${stageName(R.id)}${MODE_NAME[R.mode]?` ・ ${MODE_NAME[R.mode]}`:""}</span>
      ${headerHTML()}
      <span class="combo ${R.combo>=3?"on":""}" id="combo">れんぞく ${R.combo}!</span></div>
    <div class="quiz">
      <div class="board ${q.gold?"gold":""}">
        ${q.gold?`<span class="gold-tag">${art("gold-egg","gold-icon")}<span>きんの たまご もんだい! いっかいで せいかいすると ごはん +3</span></span>`:""}
        ${q.choices?`<span class="choice-tag">こたえを えらんでね</span>`:""}
        <div class="eq ${long?"long":""}">${toks}</div>
        <div class="hint" id="hint"></div>
        <p class="msg" id="msg">${q.review?"まえに まちがえた もんだいだよ":""}</p>
        <div class="mini-row">
          <div class="mini-wrap"><div class="mini" id="mini">${buddy}</div><div class="bubble sm" id="mbub"></div></div>
          <button class="say" id="say">${spk} よみあげ</button>
        </div>
      </div>
      <div class="pad ${q.choices?"pad-choice":""}">${pad}</div>
    </div></section>`;
  document.getElementById("quit").onclick=()=>{const m=R.mode;stopRun();m==="review"?home():stageMenu(R.id);};
  document.getElementById("say").onclick=()=>speak(q.say);
  app.querySelectorAll(".key[data-n]").forEach(b=>b.onclick=()=>press(b.dataset.n));
  app.querySelectorAll(".egg-btn").forEach(b=>b.onclick=()=>{if(R.lock)return;R.input=b.dataset.c;const box=document.getElementById("box");box.className="box";box.textContent=R.input;check(b);});
  const go=document.getElementById("go");if(go)go.onclick=()=>check();
  if(R.hintLv)showHint(q,R.hintLv);
  if(S.set.autoRead&&!R.input&&R.mode!=="speed")setTimeout(()=>speak(q.say),250);
}

/* ---- ヒント ----
   方針:答えの数を そのまま数えられる図は出さない。
   考え方(いくつと いくつ・10の まとまり・さくらんぼ)を 1だんずつ 示し、さいごの 1歩は 子どもが 考える。 */
const dots=(n,c="")=>Array.from({length:n},()=>`<i class="${c}"></i>`).join("");
const frame=cells=>`<div class="tf">${cells.map(c=>`<i class="${c}"></i>`).join("")}</div>`;
const fill=(n,c)=>Array(Math.max(0,n)).fill(c);
const Qm=`<b class="hq">?</b>`;
const num=v=>v==="?"?Qm:`<b>${v}</b>`;
/* さくらんぼ図:上の かずを 下の 2つに わける */
const cherry=(top,l,r,cap="")=>`<div class="cherry">${cap?`<span class="ch-cap">${cap}</span>`:""}
  <span class="ch-top">${num(top)}</span><svg viewBox="0 0 100 34" aria-hidden="true"><path d="M50 2 L18 32 M50 2 L82 32"/></svg>
  <span class="ch-row"><span class="ch-l">${num(l)}</span><span class="ch-r">${num(r)}</span></span></div>`;
const card=v=>`<span class="ncard">${v}</span>`;
const mini=t=>`<span class="meq">${t}</span>`;
/* くらいの へや(十のくらい・一のくらい) */
const pv=(a,op,b)=>{const d=v=>[Math.floor(v/10),v%10];const [at,ao]=d(a),[bt,bo]=d(b);
  return `<table class="pv"><thead><tr><th></th><th>十の<br>くらい</th><th>一の<br>くらい</th></tr></thead><tbody>
    <tr><td></td><td>${at||""}</td><td>${ao}</td></tr><tr><td class="pop">${op}</td><td>${bt||""}</td><td>${bo}</td></tr>
    <tr class="sum"><td></td><td>${Qm}</td><td>${Qm}</td></tr></tbody></table>`;};
const tens=v=>{const t=Math.floor(v/10),o=v%10;return t&&o?`${v}は 10の まとまり ${t}こと ばら ${o}こ`:t?`${v}は 10の まとまり ${t}こ`:`${v}は ばら ${o}こ`;};
function hintLevels(q){
  const h=q.hint;
  if(h.k==="bond"){const {n,a}=h;return [
    {vis:cherry(n,a,"?"),txt:`${n}は ${a}と いくつに わけられるかな?`},
    {vis:`${card(a)}<span class="arrow">→</span>${card(n)}`,txt:`${a}の つぎから ${n}まで、ゆびを おって かぞえよう`}];}
  if(h.k==="add"){const {a,b}=h;
    if(a+b<=10){const big=Math.max(a,b),small=Math.min(a,b);return [
      {vis:`${card(big)}<span class="opx">+</span><div class="dots">${dots(small,"b")}</div>`,txt:`おおきい ${big}から はじめて、${small}こ ふやそう`},
      {vis:cherry("?",a,b),txt:`${a}と ${b}を あわせると いくつ?`}];}
    if(a<10&&b<10){const f=10-a,r=b-f;return [
      {vis:frame([...fill(a,""),...fill(f,"e")]),txt:`${a}は あと いくつで 10に なるかな?`},
      {vis:cherry(b,f,"?"),txt:`${b}を ${f}と いくつに わける? ${a}と ${f}で 10。のこりを 10に たそう`}];}
    return [
      {vis:pv(a,"+",b),txt:`十の くらいどうし、一の くらいどうしを たそう`},
      {vis:pv(a,"+",b),txt:`${tens(a)}。${tens(b)}。10の まとまりは あわせて いくつ? ばらは あわせて いくつ?`}];}
  if(h.k==="sub"){const {a,b}=h;
    if(a<=10)return [
      {vis:`${card(a)}<span class="opx">−</span><div class="dots">${dots(b,"x")}</div>`,txt:`${a}から ${b}つ もどって かぞえよう`},
      {vis:cherry(a,b,"?"),txt:`${a}は ${b}と いくつ? (いくつと いくつ)`}];
    if(a<20&&b<10&&a-10<b){const o=a-10;return [
      {vis:cherry(a,10,o),txt:`${a}を 10と ${o}に わけよう。${o}から ${b}は ひけないね`},
      {vis:mini(`10 − ${b} = ${Qm}`),txt:`10から ${b}を ひいた かずと、${o}を あわせよう`}];}
    return [
      {vis:pv(a,"−",b),txt:`十の くらいどうし、一の くらいどうしで ひこう`},
      {vis:pv(a,"−",b),txt:`${tens(a)}。${tens(b)}。10の まとまりは いくつ のこる? ばらは いくつ のこる?`}];}
  if(h.k==="three"){const w=h.o2==="+"?"たす":"ひく";return [
    {vis:mini(`<u>${h.a} ${h.o1} ${h.b}</u> ${h.o2} ${h.c}`),txt:`まず せんの ところ ${h.a}${h.o1}${h.b} を けいさんしよう`},
    {vis:mini(`${Qm} ${h.o2} ${h.c}`),txt:`さいしょの こたえに ${h.c}を ${w}よ`}];}
  return [];
}
const hintParts=q=>{const L=hintLevels(q);return L.length?[L[0].vis,L[0].txt]:["",""];};
function showHint(q,lv){
  const L=hintLevels(q);if(!L.length)return;
  R.hintLv=Math.min(L.length,Math.max(lv||1,R.hintLv||0));
  const cur=L[R.hintLv-1],more=R.hintLv<L.length;
  const h=document.getElementById("hint");
  if(h)h.innerHTML=`<div class="hint-vis">${cur.vis}</div><p class="htxt"><span class="hlv">ヒント ${R.hintLv}/${L.length}</span>${cur.txt}</p>`;
  const k=app.querySelector('.key[data-n="hint"]');if(k)k.textContent=more?(R.hintLv?"つぎの ヒント":"ヒント"):"ヒント";
}

function press(n){
  if(!R||R.lock||R.over)return;
  const q=R.qs[R.i];
  if(n==="hint"){sTap();R.hintUsed=true;showHint(q,(R.hintLv||0)+1);return;}
  if(n==="skip"){sTap();R.lock=true;R.combo=0;const msg=document.getElementById("msg");if(msg)msg.textContent=`こたえは ${q.ans} だったよ`;later(next,700);return;}
  if(q.choices)return;
  if(n==="del")R.input=R.input.slice(0,-1);
  else if(R.input.length<3)R.input=(R.input==="0"?"":R.input)+n;
  sTap();
  const box=document.getElementById("box");box.className="box";box.innerHTML=R.input||"&nbsp;";
}

function record(q,firstTry){
  const st=S.stats[q.stage]||(S.stats[q.stage]={n:0,first:0});
  st.n++;if(firstTry)st.first++;
  S.log[today()]=(S.log[today()]||0)+1;
}
function addMistake(q){
  if(S.mistakes.some(m=>m.key===q.key))return;
  const {review,choices,gold,...clean}=q;S.mistakes.unshift(clean);S.mistakes=S.mistakes.slice(0,30);
}
const PRAISE=["せいかい!","すごい!","やったね!","ばっちり!","てんさい!","かんぺき!"];
const CHEER=["いいね!","その ちょうし!","はやい!","さすが!","かっこいい!"];
function check(eggBtn){
  if(!R||R.lock||R.over||R.input==="")return;
  const q=R.qs[R.i],box=document.getElementById("box"),msg=document.getElementById("msg"),mini=document.getElementById("mini");
  const fast=R.mode==="speed";
  if(+R.input===q.ans){
    R.lock=true;box.className="box ok";sOk();hopEl(mini);burst(eggBtn||box,R.tries?8:(q.gold?30:16));
    msg.textContent=pickOne(PRAISE);
    if(Math.random()<.35)sayBubble(document.getElementById("mbub"),pickOne(CHEER));
    R.food++;R.correct++;R.count++;
    if(q.choices)R.choiceOk++;
    if(R.tries===0){R.firstOk++;R.combo++;R.maxCombo=Math.max(R.maxCombo,R.combo);
      if(q.review)S.mistakes=S.mistakes.filter(m=>m.key!==q.key);
      if(q.gold){R.food+=3;R.goldOk=true;msg.textContent="きんの たまご ゲット! ごはん +3";sNew();}
      const c=document.getElementById("combo");if(R.combo>=3){c.textContent=`れんぞく ${R.combo}!`;c.className="combo";void c.offsetWidth;c.className="combo on";}
      if(R.combo===5||R.combo===10){R.food+=2;msg.textContent=`れんぞく ${R.combo}! ごはん +2`;}
    }
    record(q,R.tries===0);save();
    if(R.mode==="race"){const me=document.getElementById("rMe");if(me)me.style.left=`calc((100% - 72px) * ${R.correct/10})`;
      const l=app.querySelector(".track .left b");if(l)l.textContent=10-R.correct;
      if(R.correct>=10){R.goal=true;later(()=>finishRun({won:true}),500);return;}}
    if(fast){const t=document.getElementById("tcnt");if(t)t.textContent=R.count;}
    later(next,fast?450:R.mode==="race"?700:1100);
  }else{
    R.tries++;R.combo=0;sNg();box.className="box ng";
    document.getElementById("combo").className="combo";
    addMistake(q);
    if(fast){R.lock=true;box.className="box ok";box.textContent=q.ans;msg.textContent=`こたえは ${q.ans}`;record(q,false);later(next,900);return;}
    if(eggBtn){R.wrongPick.push(+R.input);eggBtn.disabled=true;}
    if(R.tries===1){R.hintUsed=true;msg.textContent="おしい! ヒントを みて もういちど";showHint(q,1);R.input="";
      setTimeout(()=>{if(R&&!R.lock&&box.isConnected){box.className="box";box.innerHTML="&nbsp;";}},500);}
    else{R.lock=true;showHint(q,99);box.className="box ok";box.textContent=q.ans;
      msg.textContent=`こたえは ${q.ans} だよ。つぎは できるよ!`;R.food++;record(q,false);save();later(next,2400);}
  }
}
function next(){
  R.i++;R.input="";R.tries=0;R.lock=false;R.hintLv=0;R.wrongPick=[];
  if(R.mode==="adv"||R.mode==="review"){if(R.i>=R.qs.length){finishRun({});return;}}
  else if(R.i>=R.qs.length)R.qs.push(decorate(freshQ(),R.i));
  quiz();
}

/* ================= けっか ================= */
function finishRun(extra){
  if(!R||R.over)return;
  R.over=true;cancelAnimationFrame(R.raf);
  const run=Object.assign(R,extra,{finished:true});
  const id=run.id,mode=run.mode,isReview=mode==="review";
  const secs=(performance.now()-run.t0)/1000;
  const before=stageOf(S.food);
  const out={notes:[],stars:0,newSp:null,firstClear:false,improved:false,record:null};
  if(mode==="adv"){
    const stars=run.firstOk>=10?3:run.firstOk>=8?2:1;run.stars=stars;out.stars=stars;
    const prev=S.stars[id]||0;out.firstClear=prev===0;out.improved=stars>prev;
    S.stars[id]=Math.max(prev,stars);
    const sp=SPECIES[STAGES.findIndex(s=>s.id===id)];
    if(sp&&!S.zukan.includes(sp.id)){S.zukan.push(sp.id);out.newSp=sp;}
    const b=stageBest(id);if(run.firstOk>=8&&(!b.time||secs<b.time)){out.record=b.time?`じこベスト こうしん! ${fmtTime(b.time)} → ${fmtTime(secs)}`:`じこベスト ${fmtTime(secs)}`;b.time=Math.round(secs);}
  }
  if(mode==="race"){const b=stageBest(id);out.lvFrom=b.race;
    if(run.won){b.race=Math.min(15,b.race+1);run.food+=3;}else b.race=Math.max(1,b.race-1);out.lvTo=b.race;}
  if(mode==="speed"){const b=stageBest(id);out.prevBest=b.speed;if(run.count>b.speed){out.record=b.speed?`さいこう きろく こうしん! ${b.speed}もん → ${run.count}もん`:`はじめての きろく ${run.count}もん`;b.speed=run.count;}}
  let medal=-1;
  if(!isReview){const p0=S.plays[id]||0;S.plays[id]=p0+1;const m0=medalOf(p0),m1=medalOf(p0+1);if(m1>m0)medal=m1;}
  S.food+=run.food;
  let bonus=false;
  if(!S.days.includes(today())){S.days.push(today());
    if(S.days.length-S.cardDone*10>=10){S.cardDone++;S.food+=10;bonus=true;}}
  S.day.rounds++;
  const mi=checkMissions(run);
  const chests=[];const pref=(SPECIES[STAGES.findIndex(s=>s.id===id)]||SPECIES[0]).id;
  chests.push(rollFossil(pref));if(mi.all)chests.push(rollFossil(pref));
  save();
  const after=stageOf(S.food),grew=after>before;
  const idx=STAGES.findIndex(s=>s.id===id);
  const nextSt=mode==="adv"&&out.firstClear&&idx<STAGES.length-1&&unlocked(idx+1)?STAGES[idx+1]:null;
  const tired=S.set.max>0&&S.day.rounds>=S.set.max;
  let head="",sub="";
  if(mode==="adv")head=run.firstOk>=10?"パーフェクト!":"よく がんばったね!";
  if(mode==="review")head="ふくしゅう おわり!",sub=`<p class="note">のこり ${S.mistakes.length}もん</p>`;
  if(mode==="race")head=run.won?"レースに かった!":"おしい! もう すこし!",
    sub=`<div class="race-res">${dinoArt(Math.max(2,after))}<span class="vs">${run.won?"かち":"まけ"}</span>${speciesArt(run.rival)}</div>
      <p class="note">ライバル レベル ${out.lvFrom} → ${out.lvTo}${run.won?" ・ ごはん +3":" ・ つぎは かてるよ!"}</p>`;
  if(mode==="speed")head=`${run.count}もん せいかい!`,sub=`<p class="note">60びょうで ${run.count}もん とけたよ</p>`;
  app.innerHTML=`<section class="screen"><div class="result">
    <h2>${head}</h2>
    ${mode==="adv"?`<div class="big-stars">${[1,2,3].map(i=>starSVG(i<=out.stars)).join("")}</div>`:sub}
    ${out.record?`<p class="record">${out.record}</p>`:""}
    <div class="food">${meat} ごはん +${run.food}${bonus?" ・ スタンプボーナス +10":""}${run.maxCombo>=3?` ・ さいこう れんぞく ${run.maxCombo}`:""}</div>
    <div class="res-row">
      ${grew?`<div class="res-dino" id="rd">${dinoArt(after)}</div>`:""}
      ${out.newSp?`<div class="newfriend" id="nf">${speciesArt(out.newSp.id)}<div><b>あたらしい なかま!</b><span>${out.newSp.name}</span></div></div>`:""}
      <div class="chest-area" id="chestArea"></div>
    </div>
    <div class="res-notes">
      ${grew?`<p class="note hot">${GROW[after].n}に せいちょうした!</p>`:""}
      ${medal>=0?`<p class="note medal-note">${medalSVG(medal,24)} ${MEDALS[medal].name}くんしょう ゲット! (${MEDALS[medal].n}かい あそんだ)</p>`:""}
      ${nextSt?`<p class="note">「${nextSt.name}」が あそべるように なったよ! レースと 60びょうも あそべるよ</p>`:(mode==="adv"&&out.firstClear?`<p class="note">レースと 60びょう チャレンジが あそべるように なったよ!</p>`:"")}
      ${mi.got.map(d=>`<p class="note mission-note">ミッション クリア! ${d.t} ・ ごはん +5</p>`).join("")}
      ${mi.all?`<p class="note mission-note">きょうの ミッション ぜんぶ クリア! たからばこ もう1こ!</p>`:""}
      ${tired?`<p class="note">きょうは たくさん がんばったね。また あした あそぼう!</p>`:""}
    </div>
    <div class="btns"><button class="btn" id="home">おうちへ</button>
      ${isReview?"":`<button class="btn" id="menu">あそびかたを えらぶ</button><button class="btn main" id="again">もういちど</button>`}
      ${nextSt?`<button class="btn hot" id="nextSt">つぎの ステージ</button>`:""}</div>
  </div></section>`;
  sFan();
  const showChest=()=>{
    const area=document.getElementById("chestArea");if(!area)return;
    if(!chests.length){area.innerHTML="";return;}
    area.innerHTML=`<button class="chest" id="chest">${art("treasure","chest-art")}<span>たからばこを あける!${chests.length>1?` (${chests.length}こ)`:""}</span></button>`;
    document.getElementById("chest").onclick=()=>{
      const c=document.getElementById("chest");c.classList.add("opening");tone([[392,.08],[440,.08],[494,.08]]);
      setTimeout(()=>{const f=chests.shift();sNew();
        area.innerHTML=f?`<div class="reveal"><div class="chest-mini">${art("chest-open","chest-art")}</div>${fossilBoard(f.id,"big")}<div><b>${f.complete?"かせき かんせい!":"かせきの かけらを みつけた!"}</b>
          <span>${spName(f.id)}の かせき ${fossilCount(f.id)}/4</span></div></div>`:
          `<div class="reveal"><div class="chest-mini">${art("chest-open","chest-art")}</div><div><b>ごはんが はいってた!</b><span>${meat} ごはん +3</span></div></div>`;
        burst(area,f&&f.complete?34:20);
        if(f&&f.complete)speak(`${spName(f.id)}の かせき、かんせい!`);
        if(chests.length)setTimeout(showChest,1800);
      },650);};
  };
  setTimeout(showChest,out.newSp?1200:400);
  if(out.newSp)setTimeout(()=>{sNew();burst(document.getElementById("nf"),24);speak(`あたらしい なかま、${out.newSp.name}!`);},900);
  if(grew)setTimeout(()=>{hopEl(document.getElementById("rd"));burst(document.getElementById("rd"),20);},700);
  else if(out.improved)setTimeout(()=>burst(app.querySelector(".big-stars"),18),700);
  if(out.record)setTimeout(()=>burst(app.querySelector(".record"),22),500);
  document.getElementById("home").onclick=home;
  const ag=document.getElementById("again");if(ag)ag.onclick=()=>start(id,mode);
  const mn=document.getElementById("menu");if(mn)mn.onclick=()=>stageMenu(id);
  const ns=document.getElementById("nextSt");if(ns)ns.onclick=()=>stageMenu(nextSt.id);
}

/* ================= ずかん ================= */
function zukan(){
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="h-title">きょうりゅう ずかん <span style="font-size:.6em">なかま ${S.zukan.length}/8 ・ かせき ${fossilTotal()}/32</span></h1><button class="quit" id="back">おうちへ</button></div>
    <p class="zhelp">あそぶと たからばこから かせきの かけらが でるよ。4こ あつめると かせきが かんせい! なかまを「あいぼう」に すると、もんだいの とき いっしょに いてくれるよ。</p>
    <div class="zukan">${SPECIES.map((sp,i)=>{const got=S.zukan.includes(sp.id),fc=fossilCount(sp.id),pal=S.partner===sp.id;return `
      <div class="zc ${got?"":"off"} ${pal?"pal":""}">
        <button class="zmain" data-z="${i}" ${got?"":"disabled"}>${speciesArt(sp.id,!got)}
          <span class="zn">${got?sp.name:"???"}</span><span class="zf">${got?sp.fact:`「${STAGES[i].name}」を クリアすると なかまに なるよ`}</span></button>
        <div class="zfoot">${fossilBoard(sp.id,"sm")}<span class="zfc">かせき ${fc}/4</span>
          ${got?`<button class="pal-btn" data-p="${sp.id}">${pal?"あいぼう!":"あいぼうに する"}</button>`:""}</div>
      </div>`;}).join("")}
    </div></section>`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll(".zmain[data-z]").forEach(b=>b.onclick=()=>{const sp=SPECIES[+b.dataset.z];hopEl(b.querySelector(".game-art"));tone([[523,.1],[659,.1],[784,.15]]);speak(`${sp.name}。${sp.fact}`);});
  app.querySelectorAll(".pal-btn").forEach(b=>b.onclick=()=>{const id=b.dataset.p;S.partner=S.partner===id?null:id;save();sTap();
    if(S.partner)speak(`${SPECIES.find(s=>s.id===id).name}が あいぼうに なったよ`);zukan();});
}

/* ================= おうちのかたへ ================= */
function bindHold(btn,ms,fn){
  let t=null,raf=0,st=0;const bar=btn.querySelector(".hold-fill");
  const stop=()=>{clearTimeout(t);cancelAnimationFrame(raf);bar.style.width="0";};
  btn.addEventListener("pointerdown",()=>{st=performance.now();
    const loop=()=>{bar.style.width=Math.min(100,(performance.now()-st)/ms*100)+"%";raf=requestAnimationFrame(loop);};loop();
    t=setTimeout(()=>{stop();fn();},ms);});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>btn.addEventListener(ev,stop));
  btn.addEventListener("contextmenu",e=>e.preventDefault());
}
function parent(){
  const totalN=Object.values(S.stats).reduce((a,s)=>a+s.n,0),totalF=Object.values(S.stats).reduce((a,s)=>a+s.first,0);
  const rate=n=>n.n?Math.round(n.first/n.n*100):null;
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d);}
  const lv=n=>!n?"":n<10?"l1":n<25?"l2":"l3";
  const sw=(id,on,label)=>`<div class="set-row"><span>${label}</span><button class="sw" role="switch" aria-checked="${on}" data-sw="${id}" aria-label="${label}"></button></div>`;
  const sel=(id,val,opts,label)=>`<div class="set-row"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${String(v)===String(val)?"selected":""}>${t}</option>`).join("")}</select></div>`;
  app.innerHTML=`<section class="screen parent">
    <div class="top"><h1 class="h-title" style="font-size:clamp(20px,2.6vw,28px)">おうちのかたへ:${esc(S.name)} さんの記録</h1><button class="quit" id="back">もどる</button></div>
    <div class="p-grid">
      <div class="p-num"><b>${S.days.length}</b><span>学習した日数</span></div>
      <div class="p-num"><b>${totalN}</b><span>解いた問題数</span></div>
      <div class="p-num"><b>${totalN?Math.round(totalF/totalN*100)+"%":"—"}</b><span>1回目で正解した割合</span></div>
      <div class="p-num"><b>${S.day.rounds}</b><span>今日のプレイ回数</span></div>
    </div>
    <div class="p-card"><h2>直近2週間の学習</h2>
      <div class="cal">${days.map(d=>{const n=S.log[dkey(d)]||0;return `<div class="${lv(n)}" title="${d.getMonth()+1}/${d.getDate()}: ${n}問">${d.getDate()}</div>`;}).join("")}</div>
      <p class="cal-legend">色が濃いほど多く解いた日です(薄:1〜9問/中:10〜24問/濃:25問以上)。</p></div>
    <div class="p-cols">
      <div class="p-card"><h2>ステージ別の結果</h2><div class="tbl-wrap"><table>
        <thead><tr><th>ステージ</th><th class="r">遊んだ回数</th><th class="r">解いた数</th><th>1回目正解率</th><th class="r">星</th><th class="r">60秒最高</th><th class="r">レースLv</th></tr></thead>
        <tbody>${STAGES.map((s,i)=>{const st=S.stats[s.id]||{n:0,first:0},r=rate(st);const bb=S.best[s.id]||{};return `<tr><td>${i+1}. ${s.name}</td><td class="r">${S.plays[s.id]||0}</td><td class="r">${st.n}</td>
          <td>${r===null?"—":`<span class="rate" style="width:${Math.max(4,r*.6)}px"></span>${r}%`}</td><td class="r">${"★".repeat(S.stars[s.id]||0)||"—"}</td>
          <td class="r">${bb.speed?bb.speed+"問":"—"}</td><td class="r">${bb.race||"—"}</td></tr>`;}).join("")}</tbody>
      </table></div>
        <h2 style="margin-top:14px">まちがえた問題(新しい順)</h2>
        ${S.mistakes.length?`<div class="chips">${S.mistakes.slice(0,20).map(m=>`<span>${m.disp.join(" ").replace("□",m.ans)}</span>`).join("")}</div>
          <p class="p-note">ホームの「ふくしゅう」で練習でき、1回目で正解すると一覧から消えます。</p>`:`<p class="p-note">いまはありません。</p>`}
      </div>
      <div class="p-card"><h2>設定</h2>
        ${sw("sound",S.set.sound,"効果音")}
        <div class="set-row vol"><label for="seVol">効果音の大きさ</label><input type="range" id="seVol" min="0" max="100" step="5" value="${Math.round(seVol()*100)}"><button class="vtest" id="seTest">ためす</button></div>
        <div class="set-row vol"><label for="voiceVol">読み上げの声の大きさ</label><input type="range" id="voiceVol" min="0" max="100" step="5" value="${Math.round(voiceVol()*100)}"><button class="vtest" id="voTest">ためす</button></div>
        ${sw("autoRead",S.set.autoRead,"問題を自動で読み上げる")}
        ${sel("goal",S.set.goal,[[1,"1回"],[2,"2回"],[3,"3回"]],"1日の目標回数")}
        ${sel("max",S.set.max,[[2,"2回"],[3,"3回"],[5,"5回"],[0,"表示しない"]],"「今日はここまで」を出す回数")}
        ${sw("allOpen",S.set.allOpen,"すべてのステージを最初から開く")}
        <div class="set-row"><label for="rename">ノートの名前</label><input type="text" id="rename" maxlength="8" value="${esc(S.name)}"></div>
        <p class="p-note">「今日はここまで」は声かけの表示だけで、プレイは止めません。記録はこの端末のブラウザ内に保存されます。</p>
      </div>
    </div></section>`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll("[data-sw]").forEach(b=>b.onclick=()=>{const k=b.dataset.sw;S.set[k]=!S.set[k];b.setAttribute("aria-checked",S.set[k]);save();});
  ["goal","max"].forEach(id=>document.getElementById(id).onchange=e=>{S.set[id]=+e.target.value;save();});
  const seIn=document.getElementById("seVol"),voIn=document.getElementById("voiceVol");
  seIn.oninput=()=>{S.set.seVol=+seIn.value/100;save();};seIn.onchange=()=>sOk();
  voIn.oninput=()=>{S.set.voiceVol=+voIn.value/100;save();};voIn.onchange=()=>speak("7 たす 5 は?");
  document.getElementById("seTest").onclick=()=>{tone([[660,.11],[880,.11],[1175,.2]],true);};
  document.getElementById("voTest").onclick=()=>speak("7 たす 5 は?");
  document.getElementById("rename").onchange=e=>{const v=e.target.value.trim().slice(0,8);if(v){S.name=v;save();}};
}

/* ================= キーボード ================= */
document.addEventListener("keydown",e=>{
  if(!R||!document.getElementById("go"))return;
  if(/^[0-9]$/.test(e.key))press(e.key);
  else if(e.key==="Backspace")press("del");
  else if(e.key==="Enter"){e.preventDefault();check();}
});

/* テスト用 */
window.__kk={GEN,STAGES,hintParts,hintLevels,withChoices,MISSIONS,runAct,P,get S(){return S;},get R(){return R;}};

title();
})();
