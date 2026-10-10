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
const DEF_SET={sound:true,autoRead:false,goal:1,max:3,allOpen:false};
const blank=name=>({name,food:0,stars:{},days:[],mistakes:[],cardDone:0,day:{date:"",rounds:0},zukan:[],stats:{},log:{},set:{...DEF_SET}});
function upgrade(s,i){
  const o=Object.assign(blank("ぼうけんしゃ"+(i+1)),s||{});
  o.set=Object.assign({...DEF_SET},o.set||{});
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
let ac=null;
const soundOn=()=>!S||S.set.sound;
function tone(seq){if(!soundOn())return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();let t=ac.currentTime;
  seq.forEach(([f,d])=>{const o=ac.createOscillator(),g=ac.createGain();o.type="triangle";o.frequency.value=f;
    g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d);t+=d*.8;});}catch(e){}}
const sTap=()=>tone([[660,.06]]);
const sOk=()=>tone([[660,.11],[880,.11],[1175,.2]]);
const sNg=()=>tone([[392,.16],[349,.2]]);
const sFan=()=>tone([[523,.14],[659,.14],[784,.14],[1047,.32]]);
const sNew=()=>tone([[784,.12],[988,.12],[1175,.12],[1568,.36]]);
function speak(t){try{const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.9;
  const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.startsWith("ja"));if(v)u.voice=v;
  speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
try{speechSynthesis.getVoices();}catch(e){}

/* ================= 絵 ================= */
const ART_ROOT="assets/art/";
const GROW_ART=["egg","egg-cracked","baby","child","adult"];
const art=(name,cls="",extra="")=>`<img class="game-art ${cls}" src="${ART_ROOT}${name}.webp" alt="" aria-hidden="true" draggable="false" width="314" height="314" ${extra}>`;
const dinoArt=st=>art(GROW_ART[Math.max(0,Math.min(4,st))],"dino-art",'fetchpriority="high"');
const speciesArt=(id,locked=false)=>art(id,`species-art ${locked?"locked-sp":""}`);
const starSVG=on=>`<svg viewBox="0 0 24 24" class="${on?"on":""}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on?"var(--sun)":"#e2dccb"}" stroke="${on?"#e0a400":"#cfc7b2"}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const starsRow=n=>`<span class="stars">${[1,2,3].map(i=>starSVG(n>=i)).join("")}</span>`;
const footSVG=(state,col)=>{const c=col||(state==="ok"?"var(--leaf)":state==="now"?"var(--lava)":"#d4cbb4");
  return `<svg viewBox="0 0 30 34" aria-hidden="true"><ellipse cx="15" cy="22" rx="9" ry="10" fill="${c}"/><ellipse cx="5" cy="9" rx="4" ry="6" fill="${c}" transform="rotate(-20 5 9)"/><ellipse cx="15" cy="5" rx="4" ry="5.5" fill="${c}"/><ellipse cx="25" cy="9" rx="4" ry="6" fill="${c}" transform="rotate(20 25 9)"/></svg>`;};
const meat=`<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M8 24 L4 28" stroke="#f3ead6" stroke-width="5" stroke-linecap="round"/><circle cx="3.5" cy="28.5" r="3" fill="#f3ead6"/><ellipse cx="18" cy="14" rx="12" ry="10" fill="#c4553a" transform="rotate(-40 18 14)"/><ellipse cx="20" cy="11" rx="5" ry="3" fill="#e98a6c" transform="rotate(-40 20 11)"/></svg>`;
const spk=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const lockSVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fff"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`;
const mapSVG=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 14 L22 8 L42 14 L58 8 V50 L42 56 L22 50 L6 56Z" fill="#fff6e0"/><path d="M22 8 V50 M42 14 V56" stroke="#e0c99a" stroke-width="2"/><path d="M12 44 Q22 30 30 36 T50 20" stroke="#f06a2c" stroke-width="3" stroke-dasharray="4 4" fill="none"/><path d="M46 16 l8 8 M54 16 l-8 8" stroke="#c4553a" stroke-width="3.5" stroke-linecap="round"/></svg>`;
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

/* ================= おうち ================= */
function home(){
  R=null;
  const st=stageOf(S.food),next=GROW[st+1];
  const pct=next?Math.round((S.food-GROW[st].at)/(next.at-GROW[st].at)*100):100;
  const stamps=S.days.length-S.cardDone*10;
  const goal=S.set.goal,done=S.day.rounds;
  const nextStage=STAGES.findIndex((s,i)=>unlocked(i)&&!(S.stars[s.id]>=1));
  const tired=S.set.max>0&&done>=S.set.max;
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="logo">きょうりゅう <span>けいさん</span></h1>
      <div class="top-r"><div class="pill">${meat} ごはん <b>${S.food}</b></div>
        <button class="quit" id="toTitle">ノートを かえる</button></div></div>
    <div class="home">
      <div class="nest">
        <p class="dino-name">${esc(S.name)}の ${GROW[st].n}</p>
        <div class="dino-wrap"><div class="dino-box" id="dino">${dinoArt(st)}</div><div class="bubble" id="bub"></div></div>
        <div class="grow"><div class="grow-label"><span>せいちょう</span><span>${next?`つぎまで ごはん あと ${next.at-S.food}`:"いちばん おおきく なったよ!"}</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div></div>
      </div>
      <div class="side">
        ${tired?`<p class="notice">きょうは たくさん がんばったね! つづきは あしたに しよう。</p>`:""}
        <button class="go-adv" id="toMap">${mapSVG}<span class="t">ぼうけんに いく<small>${nextStage>=0?`つぎは「${STAGES[nextStage].name}」`:"ぜんぶの ステージを クリアしたよ!"}</small></span></button>
        <div class="goal">きょうの もくひょう <span class="gd">${Array.from({length:goal},(_,i)=>`<i class="${i<done?"on":""}"></i>`).join("")}</span>
          <span>${done>=goal?"たっせい!":`あと ${goal-done}かい`}</span></div>
        <div class="two">
          <button class="tile" id="toZukan">${bookArt}<span>ずかん<small>なかま ${S.zukan.length}/8</small></span></button>
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
  document.getElementById("toReview").onclick=()=>{sTap();start("review");};
  document.getElementById("toTitle").onclick=title;
  const d=document.getElementById("dino"),b=document.getElementById("bub");
  d.onclick=()=>{hopEl(d);tone([[523,.1],[784,.15]]);sayBubble(b,pickOne(LINES));};
  bindHold(document.getElementById("toParent"),1500,parent);
}

/* ================= ちず ================= */
function map(){
  const nextStage=STAGES.findIndex((s,i)=>unlocked(i)&&!(S.stars[s.id]>=1));
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="h-title">ぼうけんの ちず</h1><button class="quit" id="back">おうちへ</button></div>
    <div class="areas">${AREAS.map((a,ai)=>{
      const sts=STAGES.map((s,i)=>({...s,i})).filter(s=>s.area===ai);
      const open=unlocked(sts[0].i);
      const got=sts.reduce((n,s)=>n+(S.stars[s.id]||0),0);
      return `<div class="area ${a.cls} ${open?"":"lock"}"><div class="scene">${sceneArt(a.cls)}</div>
        <h2>${a.name}<small>ほし ${got}/6</small></h2>
        <div class="nodes">${sts.map(s=>{const ok=unlocked(s.i);return `
          <button class="node ${s.i===nextStage?"next":""}" data-st="${s.id}" ${ok?"":"disabled"} aria-label="${s.name}">
            <span class="c">${ok?s.i+1:lockSVG}</span><span class="nn">${s.name}</span>${starsRow(S.stars[s.id]||0)}</button>`;}).join("")}
        </div></div>`;}).join("")}
    </div></section>`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll(".node[data-st]").forEach(b=>b.onclick=()=>{sTap();start(b.dataset.st);});
}

/* ================= もんだい ================= */
function makeSet(id){
  const qs=[],seen=new Set();
  const add=q=>{if(seen.has(q.key))return;seen.add(q.key);qs.push(q);};
  if(id==="review"){S.mistakes.slice(0,10).forEach(m=>add({...m,review:true}));return shuffle(qs);}
  S.mistakes.filter(m=>m.stage===id).slice(0,2).forEach(m=>add({...m,review:true}));
  let g=0;while(qs.length<10&&g++<1000)add(GEN[id]());
  return shuffle(qs);
}
function start(id){
  R={id,qs:makeSet(id),i:0,input:"",tries:0,firstOk:0,food:0,lock:false,combo:0,maxCombo:0,hint:false};
  if(!R.qs.length){home();return;}
  quiz();
}
const stageName=id=>id==="review"?"ふくしゅう":STAGES.find(s=>s.id===id).name;

function quiz(){
  const q=R.qs[R.i];
  const toks=q.disp.map(t=>t==="□"?`<span class="box" id="box">${R.input||"&nbsp;"}</span>`:
    t==="+"||t==="−"?`<span class="op">${t}</span>`:(t==="は"||t==="と")?`<span class="w">${t}</span>`:`<span>${t}</span>`).join("");
  const long=q.disp.length>5||q.disp.some(t=>typeof t==="number"&&t>=10);
  app.innerHTML=`<section class="screen">
    <div class="qtop"><button class="quit" id="quit">${R.id==="review"?"おうちへ":"ちずへ"}</button>
      <span class="qname">${stageName(R.id)}</span>
      <div class="steps">${R.qs.map((x,i)=>footSVG(i<R.i?"ok":i===R.i?"now":"")).join("")}</div>
      <span class="combo ${R.combo>=3?"on":""}" id="combo">れんぞく ${R.combo}!</span></div>
    <div class="quiz">
      <div class="board">
        <div class="eq ${long?"long":""}">${toks}</div>
        <div class="hint" id="hint"></div>
        <p class="msg" id="msg">${q.review?"まえに まちがえた もんだいだよ":""}</p>
        <div class="mini-row">
          <div class="mini" id="mini">${dinoArt(Math.max(2,stageOf(S.food)))}</div>
          <button class="say" id="say">${spk} よみあげ</button>
        </div>
      </div>
      <div class="pad">
        ${[7,8,9,4,5,6,1,2,3].map(n=>`<button class="key" data-n="${n}">${n}</button>`).join("")}
        <button class="key sm" data-n="del">けす</button><button class="key" data-n="0">0</button><button class="key sm" data-n="hint">ヒント</button>
        <button class="key go" id="go">こたえる</button>
      </div>
    </div></section>`;
  document.getElementById("quit").onclick=()=>{R.id==="review"?home():map();};
  document.getElementById("say").onclick=()=>speak(q.say);
  app.querySelectorAll(".key[data-n]").forEach(b=>b.onclick=()=>press(b.dataset.n));
  document.getElementById("go").onclick=check;
  if(R.hint)showHint(q);
  if(S.set.autoRead&&!R.input)setTimeout(()=>speak(q.say),250);
}

/* ---- ヒント ---- */
const dots=(n,c="")=>Array.from({length:n},()=>`<i class="${c}"></i>`).join("");
const frame=cells=>`<div class="tf">${cells.map(c=>`<i class="${c}"></i>`).join("")}</div>`;
const fill=(n,c)=>Array(Math.max(0,n)).fill(c);
const blocks=n=>`<div class="blk">${"<b></b>".repeat(Math.floor(n/10))}${"<i></i>".repeat(n%10)}</div>`;
function hintParts(q){
  const h=q.hint;
  if(h.k==="bond")return [`<div class="dots">${dots(h.a)}${dots(h.n-h.a,"q")}</div>`,`${h.n}こ のうち ${h.a}こ。のこりは なんこ?`];
  if(h.k==="add"){const {a,b}=h;
    if(a+b<=10)return [`<div class="dots">${dots(a)}<span class="gap"></span>${dots(b,"b")}</div>`,`${a}こと ${b}こを あわせると?`];
    if(a<10&&b<10){const f=10-a,r=b-f;
      return [`<div class="tfs">${frame([...fill(a,""),...fill(f,"b")])}${frame([...fill(r,"b"),...fill(10-r,"e")])}</div>`,
        `${a}は あと ${f}で 10。${b}を ${f}と ${r}に わけると…`];}
    return [`${blocks(a)}<span class="opx">+</span>${blocks(b)}`,`10の まとまりと ばらを べつべつに かぞえよう`];}
  if(h.k==="sub"){const {a,b}=h;
    if(a<=10)return [`<div class="dots">${dots(a-b)}${dots(b,"x")}</div>`,`${a}こから ${b}こ とると?`];
    if(a<20&&b<10&&a-10<b){const o=a-10;
      return [`<div class="tfs">${frame([...fill(10-b,""),...fill(b,"x")])}${frame([...fill(o,""),...fill(10-o,"e")])}</div>`,
        `10から ${b}を とって、のこりと ${o}を あわせると…`];}
    return [`${blocks(a)}<span class="opx">−</span>${blocks(b)}`,`10の まとまりと ばらを べつべつに かんがえよう`];}
  if(h.k==="three"){const first=h.o1==="+"?`${dots(h.a)}<span class="gap"></span>${dots(h.b,"b")}`:`${dots(h.a-h.b)}${dots(h.b,"x")}`;
    return [`<div class="dots">${first}</div>`,`まず ${h.a}${h.o1}${h.b} を けいさん。そのあと ${h.o2==="+"?"たす":"ひく"} ${h.c}`];}
  return ["",""];
}
function showHint(q){
  R.hint=true;const [vis,txt]=hintParts(q);
  document.getElementById("hint").innerHTML=`<div class="hint-vis">${vis}</div><p class="htxt">${txt}</p>`;
}

function press(n){
  if(R.lock)return;
  if(n==="hint"){sTap();showHint(R.qs[R.i]);return;}
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
  const {review,...clean}=q;S.mistakes.unshift(clean);S.mistakes=S.mistakes.slice(0,30);
}
const PRAISE=["せいかい!","すごい!","やったね!","ばっちり!","てんさい!","かんぺき!"];
function check(){
  if(R.lock||R.input==="")return;
  const q=R.qs[R.i],box=document.getElementById("box"),msg=document.getElementById("msg"),mini=document.getElementById("mini");
  if(+R.input===q.ans){
    R.lock=true;box.className="box ok";sOk();hopEl(mini);burst(box,R.tries?8:16);
    msg.textContent=pickOne(PRAISE);
    R.food++;
    if(R.tries===0){R.firstOk++;R.combo++;R.maxCombo=Math.max(R.maxCombo,R.combo);
      if(q.review)S.mistakes=S.mistakes.filter(m=>m.key!==q.key);
      const c=document.getElementById("combo");if(R.combo>=3){c.textContent=`れんぞく ${R.combo}!`;c.className="combo";void c.offsetWidth;c.className="combo on";}
      if(R.combo===5||R.combo===10){R.food+=2;msg.textContent=`れんぞく ${R.combo}! ごはん +2`;}
    }
    record(q,R.tries===0);save();
    setTimeout(next,1100);
  }else{
    R.tries++;R.combo=0;sNg();box.className="box ng";
    document.getElementById("combo").className="combo";
    addMistake(q);
    if(R.tries===1){msg.textContent="おしい! ヒントを みて もういちど";showHint(q);R.input="";
      setTimeout(()=>{if(!R.lock&&box.isConnected){box.className="box";box.innerHTML="&nbsp;";}},500);}
    else{R.lock=true;showHint(q);box.className="box ok";box.textContent=q.ans;
      msg.textContent=`こたえは ${q.ans} だよ。つぎは できるよ!`;R.food++;record(q,false);save();setTimeout(next,2600);}
  }
}
function next(){
  R.i++;R.input="";R.tries=0;R.lock=false;R.hint=false;
  if(R.i>=R.qs.length)result();else quiz();
}

/* ================= けっか ================= */
function result(){
  const before=stageOf(S.food),isReview=R.id==="review";
  const stars=R.firstOk>=10?3:R.firstOk>=8?2:1;
  let newSp=null,firstClear=false,improved=false;
  if(!isReview){
    const prev=S.stars[R.id]||0;firstClear=prev===0;improved=stars>prev;
    S.stars[R.id]=Math.max(prev,stars);
    const sp=SPECIES[STAGES.findIndex(s=>s.id===R.id)];
    if(sp&&!S.zukan.includes(sp.id)){S.zukan.push(sp.id);newSp=sp;}
  }
  S.food+=R.food;
  let bonus=false;
  if(!S.days.includes(today())){S.days.push(today());
    if(S.days.length-S.cardDone*10>=10){S.cardDone++;S.food+=10;bonus=true;}}
  S.day.rounds++;save();
  const after=stageOf(S.food),grew=after>before;
  const idx=STAGES.findIndex(s=>s.id===R.id);
  const nextSt=!isReview&&idx<STAGES.length-1&&unlocked(idx+1)?STAGES[idx+1]:null;
  const tired=S.set.max>0&&S.day.rounds>=S.set.max;
  const goalHit=S.day.rounds===S.set.goal;
  app.innerHTML=`<section class="screen"><div class="result">
    <h2>${R.firstOk>=10?"パーフェクト!":"よく がんばったね!"}</h2>
    ${isReview?`<p class="note">ふくしゅう おわり! のこり ${S.mistakes.length}もん</p>`:`<div class="big-stars">${[1,2,3].map(i=>starSVG(i<=stars)).join("")}</div>`}
    <div class="food">${meat} ごはん +${R.food}${bonus?" ・ スタンプボーナス +10":""}${R.maxCombo>=3?` ・ さいこう れんぞく ${R.maxCombo}`:""}</div>
    <div class="res-row">
      <div class="res-dino" id="rd">${dinoArt(after)}</div>
      ${newSp?`<div class="newfriend" id="nf">${speciesArt(newSp.id)}<div><b>あたらしい なかま!</b><span>${newSp.name}</span></div></div>`:""}
    </div>
    ${grew?`<p class="note" style="color:var(--lava)">${GROW[after].n}に せいちょうした!</p>`:""}
    ${firstClear&&nextSt?`<p class="note">「${nextSt.name}」が あそべるように なったよ!</p>`:""}
    ${goalHit?`<p class="note">きょうの もくひょう たっせい!</p>`:""}
    ${tired?`<p class="note">きょうは たくさん がんばったね。また あした あそぼう!</p>`:""}
    <div class="btns"><button class="btn" id="home">おうちへ</button>
      ${isReview?"":`<button class="btn" id="again">もういちど</button>`}
      ${nextSt?`<button class="btn hot" id="nextSt">つぎの ステージ</button>`:isReview?"":`<button class="btn main" id="toMap">ちずへ</button>`}</div>
  </div></section>`;
  sFan();
  if(newSp)setTimeout(()=>{sNew();burst(document.getElementById("nf"),24);speak(`あたらしい なかま、${newSp.name}!`);},900);
  if(grew)setTimeout(()=>{hopEl(document.getElementById("rd"));burst(document.getElementById("rd"),20);sFan();},newSp?2200:900);
  else if(improved)setTimeout(()=>burst(app.querySelector(".big-stars"),18),700);
  document.getElementById("home").onclick=home;
  const ag=document.getElementById("again");if(ag)ag.onclick=()=>start(R.id);
  const ns=document.getElementById("nextSt");if(ns)ns.onclick=()=>start(nextSt.id);
  const tm=document.getElementById("toMap");if(tm)tm.onclick=map;
}

/* ================= ずかん ================= */
function zukan(){
  app.innerHTML=`<section class="screen">
    <div class="top"><h1 class="h-title">きょうりゅう ずかん <span style="font-size:.6em">${S.zukan.length}/8</span></h1><button class="quit" id="back">おうちへ</button></div>
    <div class="zukan">${SPECIES.map((sp,i)=>{const got=S.zukan.includes(sp.id);return `
      <button class="zc" data-z="${i}" ${got?"":"disabled"}>${speciesArt(sp.id,!got)}
        <span class="zn">${got?sp.name:"???"}</span><span class="zf">${got?sp.fact:`「${STAGES[i].name}」を クリアすると なかまに なるよ`}</span></button>`;}).join("")}
    </div></section>`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll(".zc[data-z]").forEach(b=>b.onclick=()=>{const sp=SPECIES[+b.dataset.z];hopEl(b.querySelector(".game-art"));tone([[523,.1],[659,.1],[784,.15]]);speak(`${sp.name}。${sp.fact}`);});
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
        <thead><tr><th>ステージ</th><th class="r">解いた数</th><th>1回目正解率</th><th class="r">星</th></tr></thead>
        <tbody>${STAGES.map((s,i)=>{const st=S.stats[s.id]||{n:0,first:0},r=rate(st);return `<tr><td>${i+1}. ${s.name}</td><td class="r">${st.n}</td>
          <td>${r===null?"—":`<span class="rate" style="width:${Math.max(4,r*.6)}px"></span>${r}%`}</td><td class="r">${"★".repeat(S.stars[s.id]||0)||"—"}</td></tr>`;}).join("")}</tbody>
      </table></div>
        <h2 style="margin-top:14px">まちがえた問題(新しい順)</h2>
        ${S.mistakes.length?`<div class="chips">${S.mistakes.slice(0,20).map(m=>`<span>${m.disp.join(" ").replace("□",m.ans)}</span>`).join("")}</div>
          <p class="p-note">ホームの「ふくしゅう」で練習でき、1回目で正解すると一覧から消えます。</p>`:`<p class="p-note">いまはありません。</p>`}
      </div>
      <div class="p-card"><h2>設定</h2>
        ${sw("sound",S.set.sound,"効果音")}
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
window.__kk={GEN,STAGES,hintParts};

title();
})();
