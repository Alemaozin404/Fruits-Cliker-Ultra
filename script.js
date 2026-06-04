(() => {
  'use strict';
  const VERSION = '12.6.0-pc-cinema-stability';
  const BASE_SAVE_KEY = 'maca_clicker_v10_world_pets_save';
  const AUTH_KEY = 'maca_clicker_auth_profiles_v1';
  const SESSION_KEY = 'maca_clicker_auth_session_v1';
  const RANK_KEY = 'maca_clicker_v10_ranking';
  const ADMIN_KEY = 'maca_clicker_global_admin_v1';
  const ADMIN_CODES_KEY = 'maca_clicker_admin_codes_v1';
  const MINUTE = 60000, HOUR = 3600000;
  const BOSS_ACTIVE_TIME = 3 * MINUTE;
  const BOSS_EVENT_INTERVAL = HOUR;
  const AFK_CHECK_INTERVAL = 30 * MINUTE;
  const AFK_RESPONSE_TIME = 30;
  const SECRET_ET_CHANCE = 0.000001; // 0,0001%

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const now = () => Date.now();
  const fmt = v => Intl.NumberFormat('pt-BR',{notation:Math.abs(v)>=10000?'compact':'standard',maximumFractionDigits:2}).format(Math.floor(v||0));
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const dayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const weekKey = (d=new Date()) => { const onejan = new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7)}`; };
  const clock = ms => { const s=Math.max(0,Math.ceil(ms/1000)); const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),r=s%60; return h?`${h}h ${m}m`:`${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`; };

  function refreshViewportVars(){
    const vh = (window.visualViewport?.height || window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    document.body.classList.toggle('is-mobile-cinema', window.innerWidth <= 760);
  }
  refreshViewportVars();
  window.addEventListener('resize', refreshViewportVars, {passive:true});
  window.visualViewport?.addEventListener('resize', refreshViewportVars, {passive:true});

  const worlds = [
    {id:'farm',icon:'🌾',name:'Fazenda inicial',theme:'theme-farm',need:0,multi:1,desc:'Começo leve, simples e equilibrado.',music:220,shop:'Sementes e ferramentas básicas.'},
    {id:'gold',icon:'🏆',name:'Pomar dourado',theme:'theme-gold',need:75000,multi:1.65,desc:'Maçãs douradas e loja de riqueza.',music:260,shop:'Upgrades de ouro e crítico.'},
    {id:'welison',icon:'💙',name:'Floresta azul do Welison',theme:'theme-welison',need:350000,multi:2.25,desc:'Área azul com bônus forte em eventos.',music:300,shop:'Energia azul e evento Welison.'},
    {id:'rare',icon:'🏝️',name:'Ilha das maçãs raras',theme:'theme-rare',need:1200000,multi:3.1,desc:'Melhor sorte em pets e ovos raros.',music:340,shop:'Sorte, ovos e chuva rara.'},
    {id:'boss',icon:'👹',name:'Mundo sombrio / boss',theme:'theme-boss',need:4200000,multi:4.4,desc:'Dano aumentado contra bosses.',music:170,shop:'Dano, tickets e sombras.'},
    {id:'celestial',icon:'🌌',name:'Mundo celestial',theme:'theme-celestial',need:15000000,multi:6.5,desc:'Área final com multiplicador absurdo.',music:420,shop:'Prestígio, estrelas e poder global.'}
  ];
  const worldMap = Object.fromEntries(worlds.map(w=>[w.id,w]));
  const skins = [
    {id:'normal',icon:'🍎',name:'Maçã normal',need:0}, {id:'gold',icon:'🍏',name:'Maçã dourada',need:15000},
    {id:'welison',icon:'🔵',name:'Maçã azul Welison',need:80000}, {id:'fire',icon:'🔥',name:'Maçã infernal',need:180000},
    {id:'ice',icon:'🧊',name:'Maçã gelo eterno',need:360000}, {id:'royal',icon:'👑',name:'Maçã realeza',need:720000},
    {id:'nebula',icon:'🌌',name:'Maçã nebulosa',need:1400000}, {id:'shadow',icon:'🖤',name:'Maçã sombra',need:2600000},
    {id:'cosmic',icon:'🪐',name:'Maçã cósmica',need:5200000}, {id:'hacker',icon:'💻',name:'Maçã hacker',need:9500000},
    {id:'voidlord',icon:'🕳️',name:'Maçã Lorde Void',need:18000000}, {id:'etcore',icon:'👽',name:'Maçã ET secreta',need:0,secret:true}
  ];
  const rarities = {comum:{multi:.035,rank:1}, raro:{multi:.09,rank:2}, épico:{multi:.18,rank:3}, lendário:{multi:.38,rank:4}, mítico:{multi:.82,rank:5}, secreto:{multi:2.25,rank:6}};
  const petPool = [
    {id:'cat',icon:'🐱',name:'Gato do Quintal',rarity:'comum',power:1},
    {id:'dog',icon:'🐶',name:'Cachorro Pomar',rarity:'comum',power:2},
    {id:'rabbit',icon:'🐰',name:'Coelho Dourado',rarity:'raro',power:3},
    {id:'fox',icon:'🦊',name:'Raposa Azul',rarity:'raro',power:4},
    {id:'owl',icon:'🦉',name:'Coruja Épica',rarity:'épico',power:5},
    {id:'dragon',icon:'🐉',name:'Dragão da Colheita',rarity:'lendário',power:6},
    {id:'phoenix',icon:'🔥',name:'Fênix Celestial',rarity:'mítico',power:7},
    {id:'et',icon:'👽',name:'ET Secreto do Pomar',rarity:'secreto',power:99,secret:true}
  ];
  const eggs = [
    {id:'common',icon:'🥚',name:'Ovo comum',cost:18000,rarities:{comum:88,raro:11,épico:1}},
    {id:'silver',icon:'🥈',name:'Ovo prata',cost:95000,rarities:{comum:62,raro:30,épico:7.6,lendário:.4}},
    {id:'rare',icon:'💎',name:'Ovo raro',cost:280000,rarities:{comum:35,raro:45,épico:17,lendário:2.8,mítico:.2}},
    {id:'epic',icon:'🟣',name:'Ovo épico',cost:950000,rarities:{raro:48,épico:39,lendário:11.5,mítico:1.6}},
    {id:'legend',icon:'🌟',name:'Ovo lendário',cost:3200000,rarities:{épico:52,lendário:40,mítico:8}},
    {id:'supreme',icon:'🌈',name:'Melhor ovo',cost:12500000,rarities:{épico:30,lendário:52,mítico:18}, secretEt:true}
  ];
  const auras = [
    {id:'gold',icon:'🟡',name:'Aura Dourada',color:'#ffd47a',effect:'sparkles',need:0,desc:'Brilho nobre e partículas douradas.'},
    {id:'blue',icon:'🔵',name:'Aura Azul Fria',color:'#76ddff',effect:'ice',need:250000,desc:'Rastro azul, pulso frio e leveza.'},
    {id:'crimson',icon:'🔴',name:'Aura Carmesim',color:'#ff667e',effect:'embers',need:1200000,desc:'Impacto agressivo, faíscas e tensão.'},
    {id:'void',icon:'🟣',name:'Aura Void',color:'#b991ff',effect:'void',need:5000000,desc:'Aura roxa secreta com distorção premium.'},
    {id:'et',icon:'👽',name:'Aura ET Secreta',color:'#7dffb2',effect:'alien',need:0,secret:true,desc:'Liberada ao tirar o ET secreto.'}
  ];
  const upgrades = [
    {id:'click',icon:'👆',name:'Clique forte',desc:'+1 base por nível.',base:80,grow:1.72,apply:s=>s.up.click++},
    {id:'crit',icon:'💥',name:'Crítico',desc:'+2% chance crítica.',base:650,grow:1.82,apply:s=>s.up.crit++},
    {id:'auto',icon:'🤖',name:'Auto coletor',desc:'+2 maçãs/s antes dos multiplicadores.',base:650,grow:1.88,apply:s=>s.up.auto++},
    {id:'rain',icon:'🌧️',name:'Chuva de maçãs',desc:'Melhora eventos de chuva.',base:9500,grow:1.95,apply:s=>s.up.rain++},
    {id:'global',icon:'✖️',name:'Multiplicador global',desc:'+20% real em tudo.',base:22000,grow:2.18,apply:s=>s.up.global++},
    {id:'eventSpeed',icon:'⏱️',name:'Velocidade de evento',desc:'Eventos 2x chegam mais rápido.',base:65000,grow:2.25,cap:20,apply:s=>s.up.eventSpeed++},
    {id:'petLuck',icon:'🍀',name:'Sorte em pets',desc:'Melhora chance de raridade alta.',base:75000,grow:2.12,apply:s=>s.up.petLuck++},
    {id:'bossDmg',icon:'⚔️',name:'Dano em boss',desc:'+25% dano contra boss.',base:42000,grow:2.0,apply:s=>s.up.bossDmg++},
    {id:'prestige',icon:'⭐',name:'Prestígio',desc:'Reseta parte da economia e dá bônus permanente.',special:true}
  ];

  const defaultState = () => ({
    version:VERSION, fruits:0, world:'farm', skin:'normal', unlockedWorlds:{farm:true}, unlockedSkins:{normal:true},
    up:{click:1,crit:0,auto:0,rain:0,global:0,eventSpeed:0,petLuck:0,bossDmg:0}, prestige:0,
    pets:[], equippedPets:[], petSeq:0,
    boss:{active:false,name:'',hp:0,max:0,ends:0,type:'normal',damage:0,nextEvent:now()+BOSS_EVENT_INTERVAL}, tickets:{boss:0},
    event:{active:null,ends:0,next:now()+45*MINUTE,welisonKey:'',welisonEnds:0,rare:null,rareEnds:0},
    pass:{xp:0,claimedFree:{},claimedPremium:{},premium:true},
    missions:{dailyKey:'',weeklyKey:'',daily:{},weekly:{},dailyClaimed:{},weeklyClaimed:{}},
    stats:{clicks:0,total:0,bestClick:0,bossDamage:0,bossKills:0,prestiges:0,started:now(),play:0,lastSeen:now()},
    combo:{count:0,best:0,expires:0}, daily:{last:'',streak:0}, codes:{},
    auth:{user:'',id:''}, activity:{lastInteraction:now(),lastCheck:now(),warning:false}, aura:'gold', unlockedAuras:{gold:true},
    settings:{sound:false,music:false,perf:'auto',seenStory:false,quickCollapsed:false,introSeen:false,codeShowSeen:false,cinemaStamp:''}, adminApplied:{}, screen:'home'
  });
  let state = defaultState(), dirty = true, lastTick = now(), lastSave = now(), lastHud = 0, lastFloat = 0, audio = null, musicTimer = null, visible = true, lastPetSig = '', ambientTimer = 0, rainTicker = 0, adminLastCommand = '', hudMemory = {}, introTimer = null, tutorialTimer = null, tutorialIndex = 0, featuredCode = '', afkTimer = null, afkCountdown = null, remoteAdminCodes = {}, globalDb = null, globalMode = 'local';
  const dom = {};

  function bindDom(){ ['loadingScreen','loaderBar','startBtn','introCinematic','introTitle','introLine','introProgress','skipIntroBtn','introContinueBtn','storyModal','closeStoryBtn','tutorialTitle','tutorialDesc','tutorialProgress','tutorialStepsWrap','tutorialSkipBtn','bossCinematic','bossCinematicName','tutorialSpotlight','toastStack','particleLayer','mainNav','mobileMenuBtn','worldSubtitle','eventTitle','eventHint','fruitCount','clickStat','autoStat','multiStat','petStat','worldStat','worldIcon','worldName','comboText','offlineText','passMini','bossMini','bossAlert','bossAlertName','bossAlertTimer','bossAlertLife','petOrbit','appleBtn','appleSkin','floatLayer','claimDailyBtn','openBestEggBtn','summonBossBtn','worldGrid','shopSubtitle','shopList','eggGrid','petList','bossName','bossDesc','bossLife','bossTicketBtn','weeklyBossBtn','eventList','passLevelText','passBar','passRewards','missionList','rankingGrid','skinGrid','featuredCodeLabel','featuredCodeDesc','featuredCodeChip','revealCodeBtn','useFeaturedCodeBtn','codeShowcase','codeInput','codeBtn','soundBtn','musicBtn','perfBtn','saveBox','saveBtn','exportBtn','importBtn','resetBtn','auraGrid','loginOverlay','loginName','loginPassword','loginBtn','loginHint','profileBadge','afkOverlay','afkCountdown','afkYesBtn','quickShopPanel','quickShopToggle','quickShopList','quickShopHint','openFullShopBtn'].forEach(id=>dom[id]=$('#'+id)); }
  function currentProfile(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null} }
  function saveKey(){ const p=currentProfile(); return p?.id ? `${BASE_SAVE_KEY}_${p.id}` : BASE_SAVE_KEY; }
  function uid(){ return 'MCU-'+Math.random().toString(36).slice(2,8).toUpperCase()+'-'+Date.now().toString(36).toUpperCase(); }
  function profiles(){ try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}')}catch{return {}} }
  function setProfiles(p){ localStorage.setItem(AUTH_KEY, JSON.stringify(p)); }

  function merge(base, extra){ for(const k in extra||{}){ if(extra[k] && typeof extra[k]==='object' && !Array.isArray(extra[k]) && base[k]) merge(base[k], extra[k]); else base[k]=extra[k]; } return base; }
  function load(){ try{ state=merge(defaultState(), JSON.parse(localStorage.getItem(saveKey())||'{}')); }catch{ state=defaultState(); } migrateV9IfNeeded(); normalizeState(); computeOffline(); ensureMissions(); applyVisualState(); }
  function normalizeState(){ state.tickets ||= {boss:0}; state.boss ||= defaultState().boss; if(!state.boss.nextEvent) state.boss.nextEvent=now()+BOSS_EVENT_INTERVAL; state.event ||= defaultState().event; state.settings ||= defaultState().settings; state.activity ||= defaultState().activity; state.unlockedAuras ||= {gold:true}; state.aura ||= 'gold'; if(state.pets?.some(p=>p.id==='et')){ state.unlockedAuras.et=true; state.unlockedSkins.etcore=true; } state.settings.quickCollapsed ||= false; if(state.settings.cinemaStamp!==VERSION){ state.settings.introSeen=false; state.settings.seenStory=false; state.settings.codeShowSeen=false; state.settings.cinemaStamp=VERSION; } state.missions.dailyClaimed ||= {}; state.missions.weeklyClaimed ||= {}; state.adminApplied ||= {}; if(!state.event.next || state.event.next < now()-HOUR) state.event.next = now()+Math.max(5*MINUTE,30*MINUTE-state.up.eventSpeed*MINUTE); }
  function migrateV9IfNeeded(){ if(state.stats.total>0) return; try{ const old=JSON.parse(localStorage.getItem('maca_clicker_v9_cinema_save')||'null'); if(!old) return; state.fruits=old.fruits||0; state.stats.total=old.stats?.total||state.fruits; state.stats.clicks=old.stats?.clicks||0; state.prestige=old.prestige||0; state.up.click=old.clickPower||1; state.up.auto=old.autoCollector||0; state.up.global=Math.max(0,(old.multiplier||1)-1); setTimeout(()=>toast('Progresso antigo importado e preservado.'),700); }catch{} }
  function save(){ state.version=VERSION; state.stats.lastSeen=now(); const prof=currentProfile(); if(prof){ state.auth={user:prof.user,id:prof.id}; } localStorage.setItem(saveKey(), JSON.stringify(state)); dirty=false; }
  function computeOffline(){ const diff=Math.min(12*HOUR, Math.max(0, now()-(state.stats.lastSeen||now()))); if(diff>60000){ const gain=Math.floor(autoGain()*diff/1000*.55); if(gain>0){ state.fruits+=gain; state.stats.total+=gain; setTimeout(()=>toast(`Você ganhou ${fmt(gain)} maçãs enquanto estava fora.`),900); } } }

  function fxMode(){
    if(state.settings.perf==='low') return 'low';
    const smallScreen = innerWidth <= 980 || matchMedia('(pointer: coarse)').matches;
    const weakCpu = (navigator.hardwareConcurrency || 4) <= 6;
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
    if(state.settings.perf==='high' && !smallScreen) return 'high';
    return (smallScreen || weakCpu || lowMemory) ? 'low' : 'high';
  }
  function world(){ return worldMap[state.world]||worlds[0]; }
  function skin(){ return skins.find(x=>x.id===state.skin)||skins[0]; }
  function petPower(p){ return ((rarities[p.rarity]?.rank||0)*1000) + ((p.power||1)*100) + (p.level||1); }
  function sortedPets(){ return [...state.pets].sort((a,b)=>petPower(b)-petPower(a) || (b.level||1)-(a.level||1)); }
  function petMulti(){ return 1 + state.equippedPets.map(id=>state.pets.find(p=>p.uid===id)).filter(Boolean).reduce((a,p)=>a + (rarities[p.rarity]?.multi||0) * (p.power||1) * Math.sqrt(p.level||1), 0); }
  function worldMulti(){ return world().multi; }
  function eventMulti(){ let m=1; if(state.event.active==='double') m*=2; if(state.event.welisonEnds>now()) m*=5; if(state.event.rare==='legend' && state.event.rareEnds>now()) m*=4; return m; }
  function globalMulti(){ return (1+state.up.global*.20) * (1+state.prestige*.12) * petMulti() * worldMulti() * eventMulti(); }
  function clickGain(){ let g=Math.max(1,state.up.click)*globalMulti(); if(state.combo.count>1) g*=Math.min(2,1+state.combo.count/160); return Math.max(1,Math.floor(g)); }
  function autoGain(){ let g=(state.up.auto*2 + worlds.indexOf(world())*.75) * globalMulti(); if(state.event.rare==='auto' && state.event.rareEnds>now()) g*=3; return Math.floor(g); }
  function critChance(){ let c=state.up.crit*2 + state.up.petLuck*.15; if(state.event.rare==='crit' && state.event.rareEnds>now()) c += 30; return clamp(c,0,80); }
  function bossDamageMulti(){ return 1 + state.up.bossDmg*.25 + (state.world==='boss'?1.2:0) + (state.event.welisonEnds>now()?1.0:0); }
  function upgradeCost(u){ if(u.special) return prestigeCost(); const lvl=state.up[u.id]||0; return Math.floor(u.base*Math.pow(u.grow,lvl)); }
  function prestigeCost(){ return Math.floor(2500000*Math.pow(2.15,state.prestige)); }

  function sound(freq=360,dur=.09,type='sine'){ if(!state.settings.sound) return; try{ audio ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(), g=audio.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=.045; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur); o.stop(audio.currentTime+dur+.02); }catch{} }
  function music(on=state.settings.music){ clearInterval(musicTimer); if(!on) return; musicTimer=setInterval(()=>{ const w=world(); sound(w.music,.15,'triangle'); setTimeout(()=>sound(w.music*1.5,.12,'triangle'),180); },2200); }
  function toast(text){ if(!dom.toastStack) return; const t=document.createElement('div'); t.className='toast'; t.textContent=text; dom.toastStack.appendChild(t); setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(-8px)'},2600); setTimeout(()=>t.remove(),3100); }


  function createProgressDots(el,count){ if(!el) return []; el.innerHTML=''; const arr=[]; for(let i=0;i<count;i++){ const d=document.createElement('i'); el.appendChild(d); arr.push(d); } return arr; }

  function playIntro(){
    if(!dom.introCinematic) return finishIntro();
    const slides=[
      ['Bem-vindo ao Maçã Clicker Ultra.','A luz acende, a maçã desperta e cada clique vira espetáculo.'],
      ['Colete, evolua e domine mundos cinematográficos.','Cada clique aproxima você de um império maior.'],
      ['Pets, bosses, códigos e recompensas entram em cena.','Domine o pomar como se cada tela fosse uma cena final.']
    ];
    const dots=createProgressDots(dom.introProgress, slides.length);
    let i=0;
    dom.introCinematic.classList.remove('hidden');
    dom.introContinueBtn.classList.add('hidden');
    const show=()=>{
      dom.introTitle.textContent=slides[i][0];
      dom.introLine.textContent=slides[i][1];
      dots.forEach((d,idx)=>{ d.className=''; if(idx<i) d.classList.add('done'); else if(idx===i) d.classList.add('active'); });
      sound(420+i*70,.08,'triangle');
      if(i<slides.length-1){ i++; introTimer=setTimeout(show,1900); }
      else { setTimeout(()=>{ dots.forEach(d=>d.classList.remove('active')); dots.forEach(d=>d.classList.add('done')); dom.introContinueBtn.classList.remove('hidden'); },1500); }
    };
    show();
  }

  function finishIntro(){
    clearTimeout(introTimer);
    if(dom.introCinematic) dom.introCinematic.classList.add('hidden');
    state.settings.introSeen=true;
    dirty=true;
    if(!state.settings.seenStory) openTutorial();
  }

  function openTutorial(){
    if(!dom.storyModal) return;
    dom.storyModal.classList.remove('hidden');
    runTutorialAutoplay();
  }

  function tutorialTargetFor(i){
    const shopTarget = window.innerWidth <= 760 ? dom.mainNav?.querySelector('[data-screen="shop"]') : dom.quickShopPanel;
    const map=[dom.appleBtn, shopTarget, dom.openBestEggBtn, dom.summonBossBtn, dom.codeShowcase, dom.mainNav?.querySelector('[data-screen="worlds"]')];
    return map[i] || dom.appleBtn;
  }

  function moveTutorialSpotlight(target){
    if(!dom.tutorialSpotlight || !target){ dom.tutorialSpotlight?.classList.add('hidden'); return; }
    const r=target.getBoundingClientRect();
    dom.tutorialSpotlight.classList.remove('hidden');
    dom.tutorialSpotlight.style.setProperty('--x', (r.left-10)+'px');
    dom.tutorialSpotlight.style.setProperty('--y', (r.top-10)+'px');
    dom.tutorialSpotlight.style.setProperty('--w', (r.width+20)+'px');
    dom.tutorialSpotlight.style.setProperty('--h', (r.height+20)+'px');
  }

  function setTutorialStep(i){
    const steps=[...dom.tutorialStepsWrap.querySelectorAll('[data-step]')];
    tutorialIndex=clamp(i,0,Math.max(0,steps.length-1));
    steps.forEach((el,idx)=>el.classList.toggle('active',idx===tutorialIndex));
    if(dom.tutorialProgress) dom.tutorialProgress.style.width=((tutorialIndex+1)/steps.length*100)+'%';
    if(dom.closeStoryBtn) dom.closeStoryBtn.textContent=tutorialIndex>=steps.length-1?'Começar agora':'Próximo';
    moveTutorialSpotlight(tutorialTargetFor(tutorialIndex));
  }

  function runTutorialAutoplay(){
    clearInterval(tutorialTimer);
    const steps=[...dom.tutorialStepsWrap.querySelectorAll('[data-step]')];
    let i=0;
    tutorialIndex=0;
    setTutorialStep(0);
    tutorialTimer=setInterval(()=>{ i=(i+1)%steps.length; setTutorialStep(i); },2100);
    window.addEventListener('resize',()=>setTutorialStep(tutorialIndex),{once:true});
  }

  function closeTutorial(){
    clearInterval(tutorialTimer);
    state.settings.seenStory=true;
    dom.storyModal.classList.add('hidden');
    dom.tutorialSpotlight?.classList.add('hidden');
    dirty=true;
  }

  function rotateFeaturedCode(){
    const list=[
      {code:'V10CINEMA',title:'Visual cinema',desc:'Ganhe maçãs e XP para acelerar o começo.'},
      {code:'WELISON5X',title:'Evento especial',desc:'Ative uma recompensa com tema de evento.'},
      {code:'MACADOURADA',title:'Skin rara',desc:'Desbloqueie uma skin e receba um bônus inicial.'},
      {code:'BOSSUPDATE',title:'Caça ao boss',desc:'Pegue maçãs extras e força para continuar.'}
    ];
    const idx=Math.floor(now()/60000)%list.length;
    featuredCode=list[idx].code;
    if(dom.featuredCodeLabel) dom.featuredCodeLabel.textContent=list[idx].title;
    if(dom.featuredCodeDesc) dom.featuredCodeDesc.textContent=list[idx].desc;
    if(dom.featuredCodeChip){ dom.featuredCodeChip.textContent='••••••••'; dom.featuredCodeChip.classList.remove('revealed','used'); }
    if(dom.useFeaturedCodeBtn){ dom.useFeaturedCodeBtn.disabled=true; dom.useFeaturedCodeBtn.textContent='⚡ Usar agora'; }
  }

  function revealFeaturedCode(autoUse=false){
    rotateFeaturedCode();
    if(dom.featuredCodeChip){
      dom.featuredCodeChip.textContent=featuredCode;
      dom.featuredCodeChip.classList.remove('revealed'); void dom.featuredCodeChip.offsetWidth; dom.featuredCodeChip.classList.add('revealed');
    }
    if(dom.useFeaturedCodeBtn) dom.useFeaturedCodeBtn.disabled=false;
    sound(620,.12,'triangle');
    if(autoUse) setTimeout(useFeaturedCode,700);
  }

  function useFeaturedCode(){
    if(!featuredCode) revealFeaturedCode();
    dom.codeInput.value=featuredCode;
    dom.codeBtn.classList.remove('pulse-code'); void dom.codeBtn.offsetWidth; dom.codeBtn.classList.add('pulse-code');
    if(dom.featuredCodeChip) dom.featuredCodeChip.classList.add('used');
    setTimeout(()=>redeemCode(),260);
  }

  function applyVisualState(){
    const classes=[world().theme];
    if(state.boss.active) classes.push('boss-active');
    if(state.event.active==='double') classes.push('event-double');
    if(state.event.welisonEnds>now()) classes.push('event-welison');
    if(state.event.rare && state.event.rareEnds>now()) classes.push('rare-'+state.event.rare);
    document.body.className=classes.join(' ');
    document.body.dataset.fx=fxMode();
    const aura=auras.find(a=>a.id===state.aura)||auras[0];
    document.body.classList.add('aura-'+aura.id);
    document.body.style.setProperty('--lux-accent', state.event.welisonEnds>now() ? '#76ddff' : state.boss.active ? '#ff667e' : aura.color);
    document.body.style.setProperty('--aura-color', aura.color);
    if(dom.worldSubtitle) dom.worldSubtitle.textContent = `${world().name} • multi real x${globalMulti().toFixed(2)}`;
    if(dom.worldIcon) dom.worldIcon.textContent=world().icon;
    if(dom.worldName) dom.worldName.textContent=world().name;
  }
  function setScreen(screen){ const previous=state.screen; state.screen=screen; const center=document.querySelector('.center'); const isMobile=innerWidth<=760; if(center){ center.classList.remove('nav-soft-enter'); void center.offsetWidth; center.classList.add('nav-soft-enter'); } $$('.screen').forEach(s=>{ const on=s.id===`screen-${screen}`; s.classList.toggle('active',on); if(on){ s.classList.remove('screen-swap'); void s.offsetWidth; s.classList.add('screen-swap'); } }); $$('#mainNav button').forEach(b=>{ const active=b.dataset.screen===screen; b.classList.toggle('active',active); if(active){ b.classList.remove('nav-pulse'); void b.offsetWidth; b.classList.add('nav-pulse'); if(isMobile) b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}); } }); dom.mainNav?.classList.remove('open'); if(isMobile) dom.quickShopPanel?.classList.remove('open-mobile'); render(); if(previous!==screen && center){ requestAnimationFrame(()=>center.scrollTo({top:0,behavior:isMobile?'auto':'smooth'})); } if(screen==='codes'){ if(!state.settings.codeShowSeen){ state.settings.codeShowSeen=true; setTimeout(()=>revealFeaturedCode(false),320); } else rotateFeaturedCode(); } dirty=true; }

  function clickApple(ev){
    const t=now(); if(t>state.combo.expires) state.combo.count=0; state.combo.count++; state.combo.best=Math.max(state.combo.best,state.combo.count); state.combo.expires=t+1700;
    let gain=clickGain(); const crit=Math.random()*100<critChance(); if(crit) gain*=3;
    gain=Math.floor(gain); state.fruits+=gain; state.stats.total+=gain; state.stats.clicks++; state.stats.bestClick=Math.max(state.stats.bestClick,gain); addPassXp(1);
    if(state.boss.active){ const dmg=Math.max(1,Math.floor((gain + state.up.click*4 + 10)*bossDamageMulti())); damageBoss(dmg); float(ev, `-${fmt(dmg)} HP`, true); }
    float(ev, `+${fmt(gain)}${crit?' CRIT':''}`, crit); burstClick(ev, crit); sparkBurst(ev, crit); flashApple(crit); sound(state.boss.active?130:(crit?660:330), state.boss.active?.12:.08, state.boss.active?'sawtooth':'sine'); updateMissions(); dirty=true; renderHud();
  }
  function float(ev,text,crit=false){
    const low = fxMode()==='low';
    const t = now();
    if(low && !crit && t-lastFloat < 135) return;
    lastFloat = t;
    const r=dom.floatLayer.getBoundingClientRect(); const f=document.createElement('b'); f.className='float-text'+(crit?' crit':''); f.textContent=text; const x=ev?.clientX ? ev.clientX-r.left : r.width/2; const y=ev?.clientY ? ev.clientY-r.top : r.height/2; f.style.left=x+'px'; f.style.top=y+'px'; dom.floatLayer.appendChild(f); setTimeout(()=>f.remove(),low?620:950);
  }
  function burstClick(ev,crit=false){ if(fxMode()==='low' || !visible) return; const r=dom.floatLayer.getBoundingClientRect(); const cx=(ev?.clientX?ev.clientX-r.left:r.width/2), cy=(ev?.clientY?ev.clientY-r.top:r.height/2); const n=crit?8:4; for(let i=0;i<n;i++){ const b=document.createElement('i'); b.className='click-bit'; const a=Math.random()*Math.PI*2, d=35+Math.random()*58; b.style.left=cx+'px'; b.style.top=cy+'px'; b.style.setProperty('--dx',Math.cos(a)*d+'px'); b.style.setProperty('--dy',Math.sin(a)*d+'px'); dom.floatLayer.appendChild(b); setTimeout(()=>b.remove(),700); } }

  function flashApple(crit=false){
    if(!dom.appleBtn) return;
    document.body.classList.remove('cinema-click'); void document.body.offsetWidth; document.body.classList.add('cinema-click');
    dom.appleBtn.animate([
      {transform:`rotateX(${dom.appleBtn.style.getPropertyValue('--tiltX')||'0deg'}) rotateY(${dom.appleBtn.style.getPropertyValue('--tiltY')||'0deg'}) scale(1)`},
      {transform:`rotateX(${dom.appleBtn.style.getPropertyValue('--tiltX')||'0deg'}) rotateY(${dom.appleBtn.style.getPropertyValue('--tiltY')||'0deg'}) scale(${crit?1.08:1.04})`},
      {transform:`rotateX(${dom.appleBtn.style.getPropertyValue('--tiltX')||'0deg'}) rotateY(${dom.appleBtn.style.getPropertyValue('--tiltY')||'0deg'}) scale(1)`}
    ],{duration:crit?260:180,easing:'ease-out'});
  }

  function sparkBurst(ev,crit=false){
    if(fxMode()==='low' || !visible) return;
    const r=dom.floatLayer.getBoundingClientRect();
    const cx=(ev?.clientX?ev.clientX-r.left:r.width/2), cy=(ev?.clientY?ev.clientY-r.top:r.height/2);
    const n=crit?6:3;
    for(let i=0;i<n;i++){
      const s=document.createElement('span');
      s.className='lux-spark';
      s.style.left=cx+'px'; s.style.top=cy+'px';
      const ang=Math.random()*Math.PI*2, dist=(crit?44:28)+Math.random()*(crit?56:32);
      s.style.setProperty('--sx',Math.cos(ang)*dist+'px');
      s.style.setProperty('--sy',Math.sin(ang)*dist+'px');
      dom.floatLayer.appendChild(s);
      setTimeout(()=>s.remove(),1000);
    }
  }

  function buyUpgrade(id){ const u=upgrades.find(x=>x.id===id); if(!u) return; if(u.special){ doPrestige(); return; } if(u.cap && state.up[id]>=u.cap) return toast('Esse upgrade já está no máximo.'); const cost=upgradeCost(u); if(state.fruits<cost) return toast('Faltam maçãs para comprar.'); state.fruits-=cost; u.apply(state); sound(520,.1); toast(`${u.name} comprado.`); updateMissions(); dirty=true; render(); }
  function doPrestige(){ const cost=prestigeCost(); if(state.fruits<cost) return toast(`Prestígio precisa de ${fmt(cost)} maçãs.`); state.fruits=0; state.prestige++; state.stats.prestiges++; state.up.click=1; state.up.auto=0; state.up.crit=0; state.up.rain=0; state.stats.total+=1000; addPassXp(80); toast('Prestígio feito! Bônus permanente aumentado.'); sound(760,.18); dirty=true; render(); }
  function buyTicket(){ const c=250000*Math.pow(1.35, state.tickets.boss); if(state.fruits<c) return toast('Faltam maçãs para comprar ticket.'); state.fruits-=c; state.tickets.boss++; toast('+1 ticket boss comprado.'); dirty=true; render(); }

  function unlockWorld(id){ const w=worldMap[id]; if(!w) return; if(state.unlockedWorlds[id]){ state.world=id; applyVisualState(); music(); render(); dirty=true; return; } if(state.stats.total < w.need) return toast(`Precisa coletar ${fmt(w.need)} maçãs no total.`); state.unlockedWorlds[id]=true; state.world=id; toast(`${w.name} desbloqueado!`); sound(780,.18); applyVisualState(); dirty=true; render(); }
  function unlockSkin(id){ const s=skins.find(x=>x.id===id); if(!s) return; if(state.unlockedSkins[id]){ state.skin=id; renderHud(); dirty=true; return; } if(s.secret && !state.pets.some(p=>p.id==='et')) return toast('Skin secreta: tire o ET no melhor ovo.'); if(!s.secret && state.stats.total < s.need) return toast(`Precisa coletar ${fmt(s.need)} maçãs no total.`); state.unlockedSkins[id]=true; state.skin=id; toast(`${s.name} desbloqueada!`); dirty=true; render(); }
  function openEgg(id){ const egg=eggs.find(e=>e.id===id)||eggs[0]; let cost=egg.cost; if(state.world==='rare') cost=Math.floor(cost*.85); if(state.fruits<cost) return toast('Faltam maçãs para abrir ovo.'); state.fruits-=cost; const rarity=rollRarity(egg); const options=petPool.filter(p=>p.rarity===rarity); const base=options[Math.floor(Math.random()*options.length)]||petPool[0]; const pet={...base,uid:'p'+(++state.petSeq),level:1}; state.pets.push(pet); if(pet.id==='et') { state.unlockedAuras.et=true; state.unlockedSkins.etcore=true; toast('👽 IMPOSSÍVEL! Você encontrou o ET secreto e liberou a Aura ET + Skin ET!'); } autoEquipBestPets(); toast(`Você ganhou ${pet.icon} ${pet.name} (${pet.rarity})!`); sound(720,.14); addPassXp(rarity==='mítico'?80:rarity==='lendário'?45:18); ensureMissions(); state.missions.daily.eggs=(state.missions.daily.eggs||0)+1; updateMissions(); dirty=true; render(); }
  function rollRarity(egg){ if(egg.secretEt && Math.random()<SECRET_ET_CHANCE) return 'secreto'; const luck=state.up.petLuck*.75 + (state.world==='rare'?4:0); const adjusted={...egg.rarities}; if(adjusted.mítico) adjusted.mítico+=luck*.04; if(adjusted.lendário) adjusted.lendário+=luck*.10; if(adjusted.épico) adjusted.épico+=luck*.18; let total=Object.values(adjusted).reduce((a,b)=>a+b,0), r=Math.random()*total; for(const k in adjusted){ r-=adjusted[k]; if(r<=0) return k; } return 'comum'; }
  function autoEquipBestPets(){ state.equippedPets=sortedPets().slice(0,3).map(p=>p.uid); lastPetSig=''; }
  function equipPet(uid){ if(state.equippedPets.includes(uid)) state.equippedPets=state.equippedPets.filter(x=>x!==uid); else { if(state.equippedPets.length>=3) return toast('Máximo de 3 pets equipados.'); state.equippedPets.push(uid); } lastPetSig=''; dirty=true; render(); }
  function fusePet(uid){ const p=state.pets.find(x=>x.uid===uid); if(!p) return; const same=state.pets.filter(x=>x.id===p.id && x.rarity===p.rarity && x.level===p.level); if(same.length<3) return toast('Precisa de 3 pets iguais e do mesmo level.'); same.slice(1,3).forEach(rem=>{ state.pets=state.pets.filter(x=>x.uid!==rem.uid); state.equippedPets=state.equippedPets.filter(x=>x!==rem.uid); }); p.level++; toast(`${p.name} evoluiu para level ${p.level}!`); autoEquipBestPets(); dirty=true; render(); }
  function openBestEgg(){ const affordable=[...eggs].reverse().find(e=>state.fruits>=e.cost); openEgg(affordable?.id||'common'); }


  function showBossCinematic(name){
    if(!dom.bossCinematic) return;
    dom.bossCinematicName.textContent=name;
    dom.bossCinematic.classList.remove('hidden');
    dom.bossCinematic.classList.remove('boss-cinema-play');
    void dom.bossCinematic.offsetWidth;
    dom.bossCinematic.classList.add('boss-cinema-play');
    setTimeout(()=>dom.bossCinematic.classList.add('hidden'),2600);
  }

  function startBoss(type='normal'){
    if(state.boss.active) return toast('Já existe um boss ativo. Clique na caveira para atacar.');
    const weekly=type==='weekly', eventWelison=type==='welison' || state.event.welisonEnds>now();
    const isAutoEventBoss=type==='welison' || type==='event';
    if(!isAutoEventBoss){
      if(state.tickets.boss<=0) return toast('Sem ticket boss. Compre um ticket na loja rápida ou na loja completa.');
      state.tickets.boss--;
    }
    const worldIndex=worlds.findIndex(w=>w.id===state.world)+1;
    const prestigeBossScale = Math.pow(1.82, state.prestige) * (1 + Math.min(3, state.stats.bossKills * 0.035));
    const max=Math.floor((weekly?1250000:560000) * prestigeBossScale * Math.max(1,worldIndex*.82));
    state.boss={active:true,type,name:eventWelison?'💙 Boss Azul Welison':weekly?'💀 Boss Semanal Supremo':type==='event'?'👑 Boss de Evento Horário':'💀 Rei Caveira do Pomar',hp:max,max,ends:now()+BOSS_ACTIVE_TIME,damage:0,nextEvent:state.boss.nextEvent||now()+BOSS_EVENT_INTERVAL};
    applyVisualState(); showBossCinematic(state.boss.name); toast(`${state.boss.name} apareceu por 3 minutos • escala por prestígio x${prestigeBossScale.toFixed(2)}${isAutoEventBoss?'':' • -1 ticket'}.`); spawnBossPulse(); sound(120,.28,'sawtooth'); dirty=true; render();
  }
  function damageBoss(dmg){ if(!state.boss.active) return; state.boss.hp=Math.max(0,state.boss.hp-dmg); state.boss.damage+=dmg; state.stats.bossDamage+=dmg; if(state.boss.hp<=0) killBoss(); }
  function killBoss(){ const reward=Math.floor((state.boss.max/75) * (state.boss.type==='weekly'?1.35:1) * (state.event.welisonEnds>now()?1.15:1)); state.fruits+=reward; state.stats.total+=reward; state.stats.bossKills++; ensureMissions(); state.missions.daily.boss=(state.missions.daily.boss||0)+1; addPassXp(120); toast(`Boss derrotado! +${fmt(reward)} maçãs. Ticket não volta.`); state.boss.active=false; state.boss.hp=0; sound(820,.25); applyVisualState(); dirty=true; render(); }
  function endBossByTime(){ const reward=Math.floor(state.boss.damage/95); state.fruits+=reward; state.stats.total+=reward; toast(`Boss fugiu. Recompensa por dano: ${fmt(reward)} maçãs.`); state.boss.active=false; state.boss.hp=0; applyVisualState(); dirty=true; render(); }
  function spawnBossPulse(){ document.body.classList.remove('boss-impact'); void document.body.offsetWidth; document.body.classList.add('boss-impact'); if(fxMode()==='low') return; for(let i=0;i<10;i++){ const p=document.createElement('span'); p.className='particle'; p.textContent=Math.random()<.7?'💀':'🔥'; p.style.left=Math.random()*100+'vw'; p.style.setProperty('--x',(Math.random()*120-60)+'px'); p.style.animationDuration=(2.4+Math.random()*2.4)+'s'; dom.particleLayer.appendChild(p); setTimeout(()=>p.remove(),5600); } }

  function updateEvents(){
    const t=now(); let changed=false;
    if(state.event.active && t>state.event.ends){ state.event.active=null; changed=true; toast('Evento 2x terminou. A chuva de maçãs parou.'); clearPersistentRain(); }
    if(state.event.rare && t>state.event.rareEnds){ state.event.rare=null; changed=true; }
    if(state.boss.active && t>state.boss.ends) endBossByTime();
    if(!state.boss.active && t>(state.boss.nextEvent||0)){ state.boss.nextEvent=t+BOSS_EVENT_INTERVAL; changed=true; setTimeout(()=>startBoss('event'),300); }
    const d=new Date(); const key=dayKey(d); const isWelison=(d.getDay()===6 && ((d.getHours()===15 && d.getMinutes()>=30) || (d.getHours()===16 && d.getMinutes()<30)));
    if(isWelison && state.event.welisonKey!==key){ state.event.welisonKey=key; state.event.welisonEnds=t+HOUR; state.world='welison'; state.unlockedWorlds.welison=true; changed=true; toast('Evento Welison 5x começou! Multiplicador 5x REAL ativado.'); spawnRain('💙'); sound(620,.25); if(!state.boss.active) setTimeout(()=>startBoss('welison'),700); }
    if(t>state.event.next){ state.event.active='double'; state.event.ends=t+Math.min(8*MINUTE,4*MINUTE+state.up.rain*12000); state.event.next=t+Math.max(25*MINUTE,45*MINUTE-state.up.eventSpeed*MINUTE); if(Math.random()<.24){ state.event.rare=['auto','legend','crit'][Math.floor(Math.random()*3)]; state.event.rareEnds=t+4*MINUTE; } changed=true; spawnRain(); toast('Evento 2x ativo! Multiplicador 2x REAL + chuva persistente.'); sound(540,.16); }
    if(changed){ applyVisualState(); dirty=true; render(); }
  }
  function spawnRain(symbol, count=14){ if(fxMode()==='low' || !visible || !dom.particleLayer) return; for(let i=0;i<count;i++){ const p=document.createElement('span'); p.className='particle apple-rain'; p.textContent=symbol || (Math.random()<.78?'🍎':'🍏'); p.style.left=Math.random()*100+'vw'; p.style.setProperty('--x',(Math.random()*120-60)+'px'); p.style.animationDuration=(3+Math.random()*3)+'s'; p.style.animationDelay=(Math.random()*1.5)+'s'; dom.particleLayer.appendChild(p); setTimeout(()=>p.remove(),7200); } }
  function maintainPersistentRain(){ const t=now(); if(state.event.active==='double' && t<state.event.ends && visible && fxMode()!=='low' && t-rainTicker>620){ rainTicker=t; spawnRain(null,5); } }
  function clearPersistentRain(){ $$('.apple-rain').forEach(p=>p.remove()); }

  function claimDaily(){ const k=dayKey(); if(state.daily.last===k) return toast('Presente diário já coletado hoje.'); const y=new Date(); y.setDate(y.getDate()-1); state.daily.streak=state.daily.last===dayKey(y)?state.daily.streak+1:1; state.daily.last=k; const reward=1200*state.daily.streak + Math.min(25000,state.stats.total*.002); state.fruits+=reward; state.stats.total+=reward; addPassXp(35); toast(`Presente: +${fmt(reward)} maçãs.`); sound(780,.16); dirty=true; render(); }
  function addPassXp(x){ state.pass.xp+=x; }
  function passLevel(){ return Math.floor(state.pass.xp/100); }
  function claimPass(level,premium=false){ const bucket=premium?state.pass.claimedPremium:state.pass.claimedFree; if(passLevel()<level) return toast('Nível do passe insuficiente.'); if(bucket[level]) return toast('Recompensa já coletada.'); bucket[level]=true; const reward={fruits:premium?level*1800+1200:level*650+400}; state.fruits+=reward.fruits; state.stats.total+=reward.fruits; toast(`${premium?'Premium':'Grátis'} nível ${level}: +${fmt(reward.fruits)} maçãs.`); dirty=true; render(); }
  function ensureMissions(){ const dk=dayKey(), wk=weekKey(); if(state.missions.dailyKey!==dk){ state.missions.dailyKey=dk; state.missions.daily={clicks:0,eggs:0,boss:0}; state.missions.dailyClaimed={}; } if(state.missions.weeklyKey!==wk){ state.missions.weeklyKey=wk; state.missions.weekly={clicks:0,bossDamage:0,prestige:0}; state.missions.weeklyClaimed={}; } }
  function updateMissions(){ ensureMissions(); state.missions.daily.clicks=state.stats.clicks; state.missions.weekly.clicks=state.stats.clicks; state.missions.weekly.bossDamage=state.stats.bossDamage; state.missions.weekly.prestige=state.stats.prestiges; }
  function missionDefs(){ return [
    {id:'dclick',kind:'daily',icon:'👆',name:'Clique 700 vezes',cur:state.missions.daily.clicks||0,need:700,xp:36,reward:1800},
    {id:'degg',kind:'daily',icon:'🥚',name:'Abra 5 ovos',cur:state.missions.daily.eggs||0,need:5,xp:44,reward:2600},
    {id:'dboss',kind:'daily',icon:'👑',name:'Derrote 1 boss',cur:state.missions.daily.boss||0,need:1,xp:70,reward:4200},
    {id:'dcombo',kind:'daily',icon:'🔥',name:'Faça combo 120x',cur:state.combo.best||0,need:120,xp:55,reward:3600},
    {id:'dfocus',kind:'daily',icon:'🎬',name:'Jogue 25 minutos',cur:Math.floor((state.stats.play||0)/60),need:25,xp:60,reward:5000},
    {id:'wclick',kind:'weekly',icon:'🔥',name:'Semana: 8000 cliques',cur:state.missions.weekly.clicks||0,need:8000,xp:180,reward:18000},
    {id:'wdmg',kind:'weekly',icon:'⚔️',name:'Semana: 2M dano boss',cur:state.missions.weekly.bossDamage||0,need:2000000,xp:220,reward:35000},
    {id:'wprestige',kind:'weekly',icon:'⭐',name:'Semana: 1 prestígio',cur:state.missions.weekly.prestige||0,need:1,xp:160,reward:30000},
    {id:'wpet',kind:'weekly',icon:'🐾',name:'Semana: coletar 25 pets',cur:state.pets.length||0,need:25,xp:210,reward:28000}
  ]; }
  function claimMission(id){ const m=missionDefs().find(x=>x.id===id); if(!m || m.cur<m.need) return toast('Missão ainda incompleta.'); const key=m.kind+'Claimed'; state.missions[key] ||= {}; if(state.missions[key][id]) return toast('Missão já coletada.'); state.missions[key][id]=true; state.fruits+=m.reward; state.stats.total+=m.reward; addPassXp(m.xp); toast(`Missão concluída: +${fmt(m.reward)} maçãs e +${m.xp} XP.`); dirty=true; render(); }
  function localAdminCodes(){ try{return JSON.parse(localStorage.getItem(ADMIN_CODES_KEY)||'{}')}catch{return {}} }
  function adminCodes(){ return {...localAdminCodes(), ...remoteAdminCodes}; }
  function globalSyncConfig(){ return window.MACA_GLOBAL_CONFIG || {}; }
  function firebaseReady(){ const cfg=globalSyncConfig().firebase||{}; return !!(window.firebase && cfg.apiKey && cfg.databaseURL && cfg.projectId); }
  function globalNamespace(){ return (globalSyncConfig().namespace || 'maca_clicker_ultra_global_v1').replace(/[^a-zA-Z0-9_/-]/g,'_'); }
  function initGlobalSync(){
    if(!firebaseReady()){
      globalMode='local';
      console.warn('[Maçã Clicker] Firebase não configurado. Admin global em modo local.');
      return;
    }
    try{
      const cfg=globalSyncConfig().firebase;
      if(!firebase.apps.length) firebase.initializeApp(cfg);
      globalDb=firebase.database();
      globalMode='firebase';
      const ns=globalNamespace();
      globalDb.ref(ns+'/codes').on('value', snap=>{
        remoteAdminCodes = snap.val() || {};
        if(state.screen==='codes') render();
      });
      globalDb.ref(ns+'/command').on('value', snap=>{
        const cmd=snap.val();
        if(cmd) runAdminCommand(cmd);
      });
      globalDb.ref('.info/connected').on('value', snap=>{
        if(snap.val()) toast('Admin global conectado.');
      });
    }catch(err){
      console.error('[Maçã Clicker] Falha no Firebase global:', err);
      globalMode='local';
    }
  }
  function runAdminCommand(cmd){
    if(!cmd || !cmd.id || adminLastCommand===cmd.id || state.adminApplied?.[cmd.id]) return;
    const created=Number(cmd.created)||now();
    const minutes=Math.max(1, Number(cmd.minutes)||8);
    const remaining=Math.max(0, created + minutes*MINUTE - now());
    const instantFresh = now() - created < 3*MINUTE;
    if(['double','welison','rare'].includes(cmd.type) && remaining<=0) return;
    if(['boss','fruits'].includes(cmd.type) && !instantFresh) return;
    adminLastCommand=cmd.id;
    state.adminApplied ||= {};
    state.adminApplied[cmd.id]=true;
    if(cmd.type==='double'){ state.event.active='double'; state.event.ends=now()+remaining; toast('ADMIN: Evento 2x global ativado.'); spawnRain(null,24); }
    if(cmd.type==='welison'){ state.event.welisonEnds=now()+remaining; state.world='welison'; state.unlockedWorlds.welison=true; toast('ADMIN: Evento Welison global ativado.'); spawnRain('💙',24); }
    if(cmd.type==='rare'){ state.event.rare=cmd.rare||'legend'; state.event.rareEnds=now()+remaining; toast('ADMIN: Evento raro global ativado.'); }
    if(cmd.type==='boss'){ if(!state.boss.active) startBoss('event'); else toast('ADMIN: boss global recebido, mas já existe boss ativo.'); }
    if(cmd.type==='fruits'){ const amount=Math.max(0, Number(cmd.amount)||0); state.fruits+=amount; state.stats.total+=amount; toast(`ADMIN: +${fmt(amount)} maçãs.`); }
    applyVisualState(); dirty=true; render();
  }
  function checkAdminCommand(){
    try{ const cmd=JSON.parse(localStorage.getItem(ADMIN_KEY)||'null'); runAdminCommand(cmd); }catch{}
  }
  function redeemCode(){ const code=(dom.codeInput.value||'').trim().toUpperCase(); const rewards={V10CINEMA:{fruits:9000,xp:60},WELISON5X:{fruits:6500,xp:50},MACADOURADA:{skin:'gold',fruits:3500},BOSSUPDATE:{fruits:8000,xp:70},HARDMODE:{fruits:12000,xp:90},AURACINEMA:{aura:'blue',fruits:6000}}; Object.assign(rewards, adminCodes()); const r=rewards[code]; if(!r){ dom.codeShowcase?.classList.add('code-error'); setTimeout(()=>dom.codeShowcase?.classList.remove('code-error'),520); return toast('Código inválido.'); } if(state.codes[code]) return toast('Código já usado.'); state.codes[code]=true; if(r.fruits){state.fruits+=r.fruits;state.stats.total+=r.fruits;} if(r.xp) addPassXp(r.xp); if(r.skin){state.unlockedSkins[r.skin]=true;state.skin=r.skin;} if(r.aura){state.unlockedAuras[r.aura]=true;state.aura=r.aura;} toast(`Código ${code} resgatado!`); dom.codeShowcase?.classList.remove('code-success'); void dom.codeShowcase?.offsetWidth; dom.codeShowcase?.classList.add('code-success'); sound(840,.18); setTimeout(()=>sound(1040,.12,'triangle'),120); dirty=true; dom.codeInput.value=''; if(dom.featuredCodeChip && code===featuredCode){ dom.featuredCodeChip.classList.add('used'); } render(); }
  function updateRanking(){ localStorage.setItem(RANK_KEY, JSON.stringify({clicks:state.stats.clicks, apples:state.stats.total, prestige:state.prestige, boss:state.stats.bossDamage, play:state.stats.play})); }

  function render(){ try{ renderHud(); renderQuickShop(); const s=state.screen; if(s==='worlds') renderWorlds(); if(s==='shop') renderShop(); if(s==='pets') renderPets(); if(s==='boss') renderBoss(); if(s==='pass') renderPass(); if(s==='missions') renderMissions(); if(s==='ranking') renderRanking(); if(s==='skins') renderSkins(); if(s==='settings') renderSettings(); if(s==='codes') rotateFeaturedCode(); }catch(err){ console.error('[Maçã Clicker] render falhou:', err); toast('Uma tela falhou ao renderizar, mas o jogo continuou funcionando.'); } }
  function renderHud(){ applyVisualState();
    const nextVals={fruitCount:fmt(state.fruits),clickStat:'+'+fmt(clickGain()),autoStat:fmt(autoGain())+'/s',multiStat:'x'+globalMulti().toFixed(1),petStat:'x'+petMulti().toFixed(1),worldStat:'x'+worldMulti(),comboText:'Combo x'+Math.max(1,state.combo.count),passMini:String(passLevel()),bossMini:state.boss.active?clock(state.boss.ends-now()):'Inativo'};
    Object.entries(nextVals).forEach(([id,val])=>{ if(dom[id]){ if(hudMemory[id]!==undefined && hudMemory[id]!==val) pulseMetric(dom[id]); dom[id].textContent=val; hudMemory[id]=val; } });
    dom.appleSkin.textContent=state.boss.active?'💀':skin().icon;
    dom.eventTitle.textContent=state.event.welisonEnds>now()?'💙 Welison 5x ativo':state.event.active==='double'?'⚡ Evento 2x ativo':'⚡ Próximo 2x';
    dom.eventHint.textContent=state.event.welisonEnds>now()?`Termina em ${clock(state.event.welisonEnds-now())}`:state.event.active==='double'?`Termina em ${clock(state.event.ends-now())}`:`Começa em ${clock(state.event.next-now())}`;
    const bossPct=state.boss.active?`${100*state.boss.hp/state.boss.max}%`:'0%'; if(dom.bossLife) dom.bossLife.style.width=bossPct; if(dom.bossAlertLife) dom.bossAlertLife.style.width=bossPct; dom.bossAlert?.classList.toggle('hidden',!state.boss.active); if(state.boss.active){ dom.bossAlertName.textContent=state.boss.name; dom.bossAlertTimer.textContent=`${clock(state.boss.ends-now())} • ${fmt(state.boss.hp)} HP`; }
    renderPetOrbit(); }
  function renderPetOrbit(){ const sig=state.equippedPets.join('|')+':'+state.pets.length; if(sig===lastPetSig) return; lastPetSig=sig; dom.petOrbit.innerHTML=''; state.equippedPets.map(id=>state.pets.find(p=>p.uid===id)).filter(Boolean).slice(0,3).forEach((p,i)=>{ const e=document.createElement('span'); e.className='pet-friend'; e.textContent=p.icon; e.title=p.name; e.style.animationDelay=(i*.5)+'s'; dom.petOrbit.appendChild(e); }); }

  function pulseMetric(el){ el.classList.remove('metric-pop'); void el.offsetWidth; el.classList.add('metric-pop'); }

  function showLogin(){
    dom.loginOverlay?.classList.remove('hidden');
    if(dom.loginHint) dom.loginHint.textContent='Crie ou entre com nome e senha. O jogo cria um ID secreto único para proteger o save local.';
  }
  function hideLogin(){ dom.loginOverlay?.classList.add('hidden'); }
  function handleLogin(){
    const user=(dom.loginName?.value||'').trim().toLowerCase().replace(/\s+/g,'_');
    const pass=(dom.loginPassword?.value||'').trim();
    if(!user || pass.length<3){ if(dom.loginHint) dom.loginHint.textContent='Use um nome e uma senha com pelo menos 3 caracteres.'; return; }
    const ps=profiles();
    if(ps[user] && ps[user].pass!==pass){ if(dom.loginHint) dom.loginHint.textContent='Senha errada para esse nome.'; return; }
    if(!ps[user]) ps[user]={pass,id:uid(),created:now()};
    setProfiles(ps);
    localStorage.setItem(SESSION_KEY, JSON.stringify({user,id:ps[user].id}));
    state=defaultState();
    load();
    state.auth={user,id:ps[user].id};
    save();
    hideLogin();
    toast(`Login ativo: ${user}`);
    render();
  }
  function updateProfileBadge(){ if(dom.profileBadge){ const p=currentProfile(); dom.profileBadge.textContent=p ? `ID salvo • ${p.user}` : 'Sem login'; } }

  function recordActivity(){ state.activity ||= defaultState().activity; state.activity.lastInteraction=now(); state.activity.warning=false; dirty=true; }
  function setupActivityWatcher(){
    ['pointerdown','keydown','touchstart','wheel'].forEach(ev=>document.addEventListener(ev,recordActivity,{passive:true}));
    setInterval(()=>{
      state.activity ||= defaultState().activity;
      const t=now();
      if(t-(state.activity.lastCheck||0)<AFK_CHECK_INTERVAL) return;
      state.activity.lastCheck=t;
      if(t-(state.activity.lastInteraction||t)>AFK_CHECK_INTERVAL) showAfkPopup();
      dirty=true;
    }, 30000);
  }
  function showAfkPopup(){
    if(!dom.afkOverlay || state.activity.warning) return;
    state.activity.warning=true;
    let left=AFK_RESPONSE_TIME;
    dom.afkOverlay.classList.remove('hidden');
    if(dom.afkCountdown) dom.afkCountdown.textContent=left;
    clearInterval(afkCountdown);
    afkCountdown=setInterval(()=>{
      left--;
      if(dom.afkCountdown) dom.afkCountdown.textContent=left;
      if(left<=0){
        clearInterval(afkCountdown);
        save();
        try{ window.close(); }catch{}
        document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#050712;color:white;font-family:Arial"><div style="max-width:520px;text-align:center"><h1>Sessão encerrada por inatividade</h1><p>Reabra o jogo e faça login novamente para continuar.</p></div></div>';
      }
    },1000);
  }
  function confirmActive(){ clearInterval(afkCountdown); state.activity.warning=false; recordActivity(); dom.afkOverlay?.classList.add('hidden'); toast('Atividade confirmada.'); }


  function setupAppleMotion(){
    if(!dom.appleBtn) return;
    const reset=()=>{ dom.appleBtn.style.setProperty('--tiltX','0deg'); dom.appleBtn.style.setProperty('--tiltY','0deg'); };
    dom.appleBtn.addEventListener('pointermove',e=>{
      if(fxMode()==='low') return;
      const r=dom.appleBtn.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      dom.appleBtn.style.setProperty('--tiltY', (px*10).toFixed(2)+'deg');
      dom.appleBtn.style.setProperty('--tiltX', (-py*10).toFixed(2)+'deg');
    });
    dom.appleBtn.addEventListener('pointerleave', reset);
    dom.appleBtn.addEventListener('pointercancel', reset);
  }

  function ambientLux(){
    if(fxMode()==='low' || !visible || !dom.floatLayer || state.screen!=='home') return;
    const zone=dom.floatLayer.getBoundingClientRect();
    const mote=document.createElement('span');
    mote.className='lux-mote';
    mote.style.left=(zone.width*(.25+Math.random()*.5))+'px';
    mote.style.top=(zone.height*(.58+Math.random()*.18))+'px';
    mote.style.setProperty('--drift', (Math.random()*36-18)+'px');
    dom.floatLayer.appendChild(mote);
    setTimeout(()=>mote.remove(),4800);
  }

  function buttonRipples(){
    document.addEventListener('pointerdown',e=>{
      const b=e.target.closest('button');
      if(!b || fxMode()==='low') return;
      const r=b.getBoundingClientRect();
      const span=document.createElement('span');
      span.style.position='absolute';
      span.style.left=(e.clientX-r.left)+'px';
      span.style.top=(e.clientY-r.top)+'px';
      span.style.width='10px';
      span.style.height='10px';
      span.style.borderRadius='999px';
      span.style.pointerEvents='none';
      span.style.background='radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,.18) 45%, transparent 72%)';
      span.style.transform='translate(-50%,-50%) scale(.2)';
      span.style.opacity='.9';
      span.style.position='absolute';
      b.appendChild(span);
      span.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:.9},{transform:'translate(-50%,-50%) scale(11)',opacity:0}],{duration:520,easing:'ease-out'});
      setTimeout(()=>span.remove(),560);
    });
  }
  function renderQuickShop(){ if(!dom.quickShopList) return; dom.quickShopPanel.classList.toggle('collapsed',!!state.settings.quickCollapsed && innerWidth>980); const ids=['click','auto','global','bossDmg','crit']; const html=ids.map(id=>{ const u=upgrades.find(x=>x.id===id), cost=upgradeCost(u), lvl=state.up[id]||0; return `<div class="quick-buy"><div class="icon">${u.icon}</div><div><h3>${u.name}</h3><small>Lv ${lvl} • ${fmt(cost)} 🍎</small></div><button class="primary" data-quick-buy="${id}">Comprar</button></div>`; }).join('') + `<div class="quick-buy"><div class="icon">🎟️</div><div><h3>Ticket Boss</h3><small>${state.tickets.boss} tickets • uso único • ${fmt(250000*Math.pow(1.35,state.tickets.boss))} 🍎</small></div><button class="secondary" data-buy-ticket>Comprar</button></div>` + `<div class="quick-buy"><div class="icon">🥚</div><div><h3>Melhor ovo</h3><small>Abre o melhor ovo possível</small></div><button class="secondary" data-quick-egg>Abrir</button></div>`;
    dom.quickShopList.innerHTML=html; $$('[data-quick-buy]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.quickBuy)); $('[data-buy-ticket]')?.addEventListener('click',buyTicket,{once:true}); $('[data-quick-egg]')?.addEventListener('click',openBestEgg,{once:true}); }
  function renderWorlds(){ dom.worldGrid.innerHTML=worlds.map(w=>{ const unlocked=!!state.unlockedWorlds[w.id], can=state.stats.total>=w.need; return `<div class="card ${unlocked?'':'locked'}"><div class="icon">${w.icon}</div><span class="tag">x${w.multi} • ${w.music}Hz</span><h3>${w.name}</h3><p>${w.desc}</p><p><b>Loja:</b> ${w.shop}</p><button class="${unlocked?'primary':'secondary'}" data-world="${w.id}">${unlocked?(state.world===w.id?'Atual':'Entrar'):can?'Desbloquear':'Precisa '+fmt(w.need)}</button></div>`; }).join(''); $$('[data-world]').forEach(b=>b.onclick=()=>unlockWorld(b.dataset.world)); }
  function renderShop(){ if(!dom.shopList) return; if(dom.shopSubtitle) dom.shopSubtitle.textContent=world().shop; const groups=[['Base',['click','auto','crit']],['Avançado',['global','eventSpeed','petLuck','bossDmg','rain']],['Especial',['prestige']]]; let html=groups.map(([title,ids])=>`<div class="shop-group"><h3>${title}</h3>${ids.map(id=>{ const u=upgrades.find(x=>x.id===id), lvl=u.special?state.prestige:(state.up[u.id]||0), cost=upgradeCost(u); return `<div class="item shop-row"><div class="icon">${u.icon}</div><div><h3>${u.name} <small>Lv ${lvl}${u.cap?'/'+u.cap:''}</small></h3><p>${u.desc}</p></div><div><div class="price">${fmt(cost)} 🍎</div><button class="primary" data-buy="${u.id}">${u.special?'Prestigiar':'Comprar'}</button></div></div>`; }).join('')}</div>`).join(''); html += `<div class="shop-group ticket-group"><h3>Boss</h3><div class="item shop-row"><div class="icon">🎟️</div><div><h3>Ticket Boss</h3><p>Exclusivo da loja. Invoca boss por 3 minutos. O ticket é consumido e não volta.</p></div><div><div class="price">${fmt(250000*Math.pow(1.35,state.tickets.boss))} 🍎</div><button class="primary" id="buyTicket">Comprar</button></div></div></div>`; dom.shopList.innerHTML=html; $$('[data-buy]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.buy)); const buyTicketBtn=$('#buyTicket'); if(buyTicketBtn) buyTicketBtn.onclick=buyTicket; }
  function renderPets(){ if(!dom.eggGrid || !dom.petList) return; dom.eggGrid.innerHTML=eggs.map(e=>`<div class="card egg-card"><div class="icon">${e.icon}</div><span class="tag">${fmt(e.cost)} 🍎</span><h3>${e.name}</h3><p>${e.secretEt?'ET secreto: 0,0001% somente neste ovo.':'Chance balanceada e mais difícil.'}</p><button class="primary" data-egg="${e.id}">Abrir</button></div>`).join(''); $$('[data-egg]').forEach(b=>b.onclick=()=>openEgg(b.dataset.egg)); const pets=sortedPets(); dom.petList.innerHTML=state.pets.length?`<div class="pet-drawer"><div class="drawer-head"><b>Gavetinha de pets</b><small>Melhor no topo • pior embaixo • auto-organizado</small></div>${pets.map((p,idx)=>`<div class="item card pet-row" data-rarity="${p.rarity}"><div class="pet-rank">#${idx+1}</div><div class="icon">${p.icon}</div><div><h3>${p.name} <small>${p.rarity} • Lv ${p.level}</small></h3><p>Poder: ${petPower(p)} • Multiplicador: +${((rarities[p.rarity]?.multi||0)*(p.power||1)*Math.sqrt(p.level||1)).toFixed(2)}x • ${state.equippedPets.includes(p.uid)?'Equipado no topo':'Guardado'}</p></div><div><button class="secondary" data-equip="${p.uid}">${state.equippedPets.includes(p.uid)?'Remover':'Equipar'}</button><button class="primary" data-fuse="${p.uid}">Fundir</button></div></div>`).join('')}</div>`:'<div class="panel-soft" style="padding:16px">Você ainda não tem pets. Abra um ovo.</div>'; $$('[data-equip]').forEach(b=>b.onclick=()=>equipPet(b.dataset.equip)); $$('[data-fuse]').forEach(b=>b.onclick=()=>fusePet(b.dataset.fuse)); }
  function renderBoss(){ if(!dom.bossName || !dom.bossDesc || !dom.bossLife || !dom.eventList) return; dom.bossName.textContent=state.boss.active?state.boss.name:'Nenhum boss ativo'; dom.bossDesc.textContent=state.boss.active?`Tempo: ${clock(state.boss.ends-now())} • Vida: ${fmt(state.boss.hp)} / ${fmt(state.boss.max)} • Dano: ${fmt(state.boss.damage)}`:`Tickets: ${state.tickets.boss}. Evento automático a cada 1 hora. Boss ativo por 3 minutos. Vida escala por prestígio e kills. Ticket só vem da loja e é consumido.`; dom.bossLife.style.width=state.boss.active?`${100*state.boss.hp/state.boss.max}%`:'0%'; dom.eventList.innerHTML=[`<div class="item"><div class="icon">⚡</div><div><h3>Evento 2x</h3><p>Muda fundo, botão, partículas e multiplicador.</p></div><b>${state.event.active==='double'?'Ativo':'Em '+clock(state.event.next-now())}</b></div>`,`<div class="item"><div class="icon">💙</div><div><h3>Welison 5x</h3><p>Todo sábado às 15:30 por 1 hora. Tema azul automático.</p></div><b>${state.event.welisonEnds>now()?clock(state.event.welisonEnds-now()):'Agenda fixa'}</b></div>`,`<div class="item"><div class="icon">🌈</div><div><h3>Evento raro</h3><p>Auto 3x, crítico ou lenda 4x pode aparecer junto do 2x.</p></div><b>${state.event.rare?state.event.rare:'Sorte'}</b></div>`].join(''); }
  function renderPass(){ if(!dom.passRewards || !dom.passLevelText || !dom.passBar) return; const lvl=passLevel(); dom.passLevelText.textContent=`Nível ${lvl} • ${state.pass.xp%100}/100 XP`; dom.passBar.style.width=(state.pass.xp%100)+'%'; let html=''; for(let i=1;i<=20;i++) html+=`<div class="item"><div class="icon">🎫</div><div><h3>Nível ${i}</h3><p>Grátis: ${fmt(i*2500+1000)} maçãs • Premium fake: ${fmt(i*7500+2500)} maçãs</p></div><div><button class="secondary" data-pass-free="${i}">${state.pass.claimedFree[i]?'Coletado':'Grátis'}</button><button class="primary" data-pass-prem="${i}">${state.pass.claimedPremium[i]?'Coletado':'Premium'}</button></div></div>`; dom.passRewards.innerHTML=html; $$('[data-pass-free]').forEach(b=>b.onclick=()=>claimPass(+b.dataset.passFree,false)); $$('[data-pass-prem]').forEach(b=>b.onclick=()=>claimPass(+b.dataset.passPrem,true)); }
  function renderMissions(){ if(!dom.missionList) return; dom.missionList.innerHTML=missionDefs().map(m=>{ const claimed=state.missions[(m.kind+'Claimed')]?.[m.id]; return `<div class="item"><div class="icon">${m.icon}</div><div><h3>${m.name}</h3><p>${fmt(Math.min(m.cur,m.need))}/${fmt(m.need)} • +${m.xp} XP passe • +${fmt(m.reward)} maçãs</p><i class="life"><em style="width:${100*clamp(m.cur/m.need,0,1)}%"></em></i></div><button class="${claimed?'secondary':'primary'}" data-mission="${m.id}">${claimed?'Coletado':'Coletar'}</button></div>`; }).join(''); $$('[data-mission]').forEach(b=>b.onclick=()=>claimMission(b.dataset.mission)); }
  function renderRanking(){ if(!dom.rankingGrid) return; updateRanking(); const r=JSON.parse(localStorage.getItem(RANK_KEY)||'{}'); const data=[['👆','Top cliques',r.clicks],['🍎','Top maçãs',r.apples],['⭐','Top prestígio',r.prestige],['⚔️','Top boss damage',r.boss],['⏱️','Tempo jogado',Math.floor((r.play||0)/60)+' min']]; dom.rankingGrid.innerHTML=data.map(x=>`<div class="card"><div class="icon">${x[0]}</div><span class="tag">Ranking local</span><h3>${x[1]}</h3><p>${typeof x[2]==='number'?fmt(x[2]):x[2]}</p></div>`).join(''); }
  function renderSkins(){ if(!dom.skinGrid) return; dom.skinGrid.innerHTML=skins.map(s=>{ const unlocked=state.unlockedSkins[s.id], can=s.secret?state.pets.some(p=>p.id==='et'):state.stats.total>=s.need; return `<div class="card ${unlocked?'':'locked'}"><div class="icon">${s.icon}</div><span class="tag">${unlocked?'Desbloqueada':'Precisa '+fmt(s.need)}</span><h3>${s.name}</h3><p>${state.skin===s.id?'Skin atual':'Troque a aparência da maçã principal.'}</p><button class="${unlocked?'primary':'secondary'}" data-skin="${s.id}">${unlocked?'Usar':can?'Desbloquear':'Bloqueada'}</button></div>`; }).join(''); $$('[data-skin]').forEach(b=>b.onclick=()=>unlockSkin(b.dataset.skin)); if(dom.auraGrid){ dom.auraGrid.innerHTML=auras.map(a=>{ const unlocked=!!state.unlockedAuras[a.id] || (a.secret && state.pets.some(p=>p.id==='et')); const can=unlocked || (!a.secret && state.stats.total>=a.need); return `<div class="card aura-card ${state.aura===a.id?'active':''} ${can?'':'locked'}"><div class="icon" style="filter:drop-shadow(0 0 14px ${a.color})">${a.icon}</div><span class="tag">${can?'Liberada':'Precisa '+fmt(a.need)}</span><h3>${a.name}</h3><p>${a.desc}</p><button class="${can?'primary':'secondary'}" data-aura="${a.id}">${state.aura===a.id?'Usando':can?'Usar aura':'Bloqueada'}</button></div>`; }).join(''); $$('[data-aura]').forEach(b=>b.onclick=()=>unlockAura(b.dataset.aura)); } }
  function unlockAura(id){ const a=auras.find(x=>x.id===id); if(!a) return; const hasEt=state.pets.some(p=>p.id==='et'); if(!state.unlockedAuras[id]){ if(a.secret && !hasEt) return toast('Aura secreta: tire o ET no melhor ovo.'); if(!a.secret && state.stats.total<a.need) return toast(`Precisa coletar ${fmt(a.need)} maçãs no total.`); state.unlockedAuras[id]=true; } state.aura=id; toast(`${a.name} ativada.`); dirty=true; applyVisualState(); render(); }
  function renderSettings(){ if(!dom.soundBtn || !dom.musicBtn || !dom.perfBtn) return; dom.soundBtn.textContent=state.settings.sound?'🔊 Som ligado':'🔇 Som desligado'; dom.musicBtn.textContent=state.settings.music?'🎵 Música ligada':'🎵 Música desligada'; dom.perfBtn.textContent='✨ Efeitos: '+(state.settings.perf==='auto'?'Auto':state.settings.perf==='low'?'Leve':'Alto'); document.body.dataset.fx=fxMode(); }

  function loop(){ const t=now(), dt=Math.min(2,(t-lastTick)/1000); lastTick=t; if(visible){ const ag=autoGain()*dt; if(ag>0){ state.fruits+=ag; state.stats.total+=ag; dirty=true; } state.stats.play+=dt; } updateEvents(); maintainPersistentRain(); checkAdminCommand(); if(t>state.combo.expires) state.combo.count=0; if(t-lastSave>5000 && dirty){ save(); lastSave=t; } const interval = fxMode()==='low' ? 260 : 120; if(t-lastHud>interval){ renderHud(); lastHud=t; } if(t-ambientTimer>(fxMode()==='low'?999999:560)){ ambientLux(); ambientTimer=t; } requestAnimationFrame(loop); }
  function init(){ bindDom(); load(); initGlobalSync(); setupAppleMotion(); buttonRipples(); let progress=0; const loadTimer=setInterval(()=>{ progress+=18+Math.random()*16; dom.loaderBar.style.width=Math.min(100,progress)+'%'; if(progress>=100){ clearInterval(loadTimer); dom.startBtn.classList.remove('hidden'); } },160);
    dom.startBtn.onclick=()=>{ if(!currentProfile()){ showLogin(); return; } dom.loadingScreen.style.opacity='0'; setTimeout(()=>dom.loadingScreen.remove(),450); music(); if(!state.settings.introSeen) playIntro(); else if(!state.settings.seenStory) openTutorial(); };
    if(dom.loginBtn) dom.loginBtn.onclick=()=>{ handleLogin(); dom.loadingScreen.style.opacity='0'; setTimeout(()=>dom.loadingScreen.remove(),450); music(); if(!state.settings.introSeen) playIntro(); else if(!state.settings.seenStory) openTutorial(); };
    if(dom.loginPassword) dom.loginPassword.onkeydown=e=>{ if(e.key==='Enter') dom.loginBtn.click(); };
    if(dom.afkYesBtn) dom.afkYesBtn.onclick=confirmActive;
    dom.skipIntroBtn.onclick=finishIntro;
    dom.introContinueBtn.onclick=finishIntro;
    dom.closeStoryBtn.onclick=()=>{ const steps=[...dom.tutorialStepsWrap.querySelectorAll('[data-step]')]; if(tutorialIndex<steps.length-1){ clearInterval(tutorialTimer); setTutorialStep(tutorialIndex+1); } else closeTutorial(); };
    dom.tutorialSkipBtn.onclick=()=>{ closeTutorial(); };
    dom.mobileMenuBtn.onclick=()=>dom.mainNav.classList.toggle('open'); dom.mainNav.onclick=e=>{ const b=e.target.closest('button[data-screen]'); if(b) setScreen(b.dataset.screen); };
    dom.quickShopToggle.onclick=()=>{ if(innerWidth<=980) dom.quickShopPanel.classList.toggle('open-mobile'); else { state.settings.quickCollapsed=!state.settings.quickCollapsed; dirty=true; renderQuickShop(); } };
    dom.openFullShopBtn.onclick=()=>setScreen('shop');
    dom.appleBtn.onclick=clickApple; dom.claimDailyBtn.onclick=claimDaily; dom.openBestEggBtn.onclick=openBestEgg; dom.summonBossBtn.onclick=()=>startBoss('normal'); dom.bossTicketBtn.onclick=()=>startBoss('normal'); dom.weeklyBossBtn.onclick=()=>startBoss('weekly'); dom.revealCodeBtn.onclick=()=>revealFeaturedCode(false); dom.useFeaturedCodeBtn.onclick=useFeaturedCode; dom.codeBtn.onclick=redeemCode; dom.codeInput.onkeydown=e=>{if(e.key==='Enter')redeemCode();};
    dom.soundBtn.onclick=()=>{state.settings.sound=!state.settings.sound; sound(500,.1); dirty=true; renderSettings();}; dom.musicBtn.onclick=()=>{state.settings.music=!state.settings.music; music(); dirty=true; renderSettings();}; dom.perfBtn.onclick=()=>{state.settings.perf=state.settings.perf==='auto'?'high':state.settings.perf==='high'?'low':'auto'; document.body.dataset.fx=fxMode(); dirty=true; renderSettings();};
    dom.saveBtn.onclick=()=>{save();toast('Jogo salvo.');}; dom.exportBtn.onclick=()=>{dom.saveBox.value=btoa(unescape(encodeURIComponent(JSON.stringify(state)))); dom.saveBox.select(); toast('Save exportado.');}; dom.importBtn.onclick=()=>{try{state=merge(defaultState(), JSON.parse(decodeURIComponent(escape(atob(dom.saveBox.value.trim()))))); normalizeState(); save(); applyVisualState(); render(); toast('Save importado.');}catch{toast('Save inválido.');}}; dom.resetBtn.onclick=()=>{ if(confirm('Resetar todo o progresso V10?')){ localStorage.removeItem(saveKey()); state=defaultState(); save(); location.reload(); } };
    window.addEventListener('storage',e=>{ if(e.key===ADMIN_KEY) checkAdminCommand(); });
    document.addEventListener('visibilitychange',()=>{ visible=!document.hidden; if(!visible) save(); }); window.addEventListener('beforeunload',save); window.addEventListener('resize',()=>{document.body.dataset.fx=fxMode(); renderQuickShop(); if(window.innerWidth <= 760 && state.screen==='shop'){ document.querySelector('.center')?.scrollTo({top:0,behavior:'auto'}); }});
    setScreen(state.screen||'home'); render(); updateProfileBadge(); setupActivityWatcher(); requestAnimationFrame(loop); if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js?v=12.6.0-pc-cinema-stability').catch(()=>{}); }
  }
  init();
})();
