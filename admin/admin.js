(() => {
  const ADMIN_KEY='maca_clicker_global_admin_v1';
  const CODES_KEY='maca_clicker_admin_codes_v1';
  const $=s=>document.querySelector(s);
  let db=null, globalMode='local';

  const cfg=()=>window.MACA_GLOBAL_CONFIG||{};
  const ns=()=>String(cfg().namespace||'maca_clicker_ultra_global_v1').replace(/[^a-zA-Z0-9_/-]/g,'_');
  const firebaseReady=()=>{const f=cfg().firebase||{}; return !!(window.firebase && f.apiKey && f.databaseURL && f.projectId);};
  const log=t=>{$('#log').textContent=new Date().toLocaleTimeString('pt-BR')+' • '+t};
  const status=t=>{const el=$('#globalStatus'); if(el) el.textContent=t;};

  const readLocalCodes=()=>{try{return JSON.parse(localStorage.getItem(CODES_KEY)||'{}')}catch{return {}}};
  const writeLocalCodes=c=>localStorage.setItem(CODES_KEY, JSON.stringify(c));
  const renderCodes=c=>{$('#codesList').textContent=Object.keys(c||{}).length?JSON.stringify(c,null,2):'Nenhum código admin criado.'};

  function firebaseErrorText(err){
    const code = err && (err.code || err.name) ? String(err.code || err.name) : 'erro-desconhecido';
    const msg = err && err.message ? String(err.message) : String(err || 'Sem detalhes');
    if(code.includes('PERMISSION_DENIED') || msg.toLowerCase().includes('permission')){
      return 'Firebase bloqueou a gravação: as regras do Realtime Database não permitem write/read. Vá em Firebase > Realtime Database > Rules e publique as regras de teste.';
    }
    if(msg.toLowerCase().includes('database_url') || msg.toLowerCase().includes('url') || msg.toLowerCase().includes('not found')){
      return 'Realtime Database não encontrado ou databaseURL errado. Crie o Realtime Database e confira o link em global-config.js.';
    }
    return code + ': ' + msg;
  }
  async function testFirebaseWrite(){
    if(!(globalMode==='firebase' && db)) return;
    try{
      const test={ok:true,at:Date.now(),source:'admin-health'};
      await db.ref(ns()+'/_health/admin').set(test);
      status('Firebase OK: leitura/escrita liberadas. Admin global funcionando.');
      log('Teste Firebase OK.');
    }catch(err){
      console.error(err);
      status(firebaseErrorText(err));
      log('Falha no teste Firebase: '+firebaseErrorText(err));
    }
  }


  async function initGlobal(){
    if(!firebaseReady()){
      globalMode='local';
      status('Modo local: configure o Firebase no global-config.js para funcionar para todos os jogadores.');
      renderCodes(readLocalCodes());
      return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(cfg().firebase);
      db=firebase.database();
      globalMode='firebase';
      status('Modo global online: Firebase conectado. Eventos e códigos chegam para todos os jogadores.');
      db.ref(ns()+'/codes').on('value', snap=>renderCodes(snap.val()||{}), err=>status(firebaseErrorText(err)));
      testFirebaseWrite();
      db.ref('.info/connected').on('value', snap=>{
        status(snap.val()?'Modo global online: Firebase conectado.':'Firebase configurado, mas sem conexão agora.');
      });
    }catch(err){
      console.error(err);
      globalMode='local';
      status('Falha no Firebase. Usando modo local. Veja console e confira global-config.js.');
      renderCodes(readLocalCodes());
    }
  }

  function cleanFirebaseValue(value){
    // Firebase Realtime Database NÃO aceita undefined em nenhum campo.
    // Usamos JSON stringify + limpeza recursiva para garantir que nada undefined chegue no set().
    if(value === undefined) return undefined;
    if(value === null || typeof value !== 'object') return value;
    if(Array.isArray(value)){
      return value
        .map(cleanFirebaseValue)
        .filter(v => v !== undefined);
    }
    const out = {};
    Object.keys(value).forEach(key => {
      const cleaned = cleanFirebaseValue(value[key]);
      if(cleaned !== undefined) out[key] = cleaned;
    });
    return out;
  }

  function firebaseSafeObject(obj){
    const cleaned = cleanFirebaseValue(obj || {});
    // JSON.stringify remove qualquer undefined restante por segurança extra.
    return JSON.parse(JSON.stringify(cleaned));
  }

  function assertNoUndefined(value, path='payload'){
    if(value === undefined) throw new Error('Campo undefined bloqueado antes do Firebase em '+path);
    if(value && typeof value === 'object'){
      Object.entries(value).forEach(([key,val]) => assertNoUndefined(val, path+'.'+key));
    }
  }

  async function writeCommand(cmd){
    const safeCmd = firebaseSafeObject(cmd);
    assertNoUndefined(safeCmd, 'command');
    if(!safeCmd.id) safeCmd.id = 'ADM-'+Date.now();
    if(!safeCmd.type) throw new Error('Comando sem tipo.');

    if(globalMode==='firebase' && db){
      await db.ref(ns()+'/command').set(safeCmd);
      await db.ref(ns()+'/history/'+safeCmd.id).set(safeCmd);
      log('Comando GLOBAL enviado: '+safeCmd.type);
      return;
    }
    localStorage.setItem(ADMIN_KEY, JSON.stringify(safeCmd));
    log('Comando LOCAL enviado: '+safeCmd.type);
  }

  async function command(type, extra={}){
    const safeExtra = firebaseSafeObject(extra || {});
    const cmd = {
      id:'ADM-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
      type:String(type || 'event'),
      created:Date.now(),
      ...safeExtra
    };

    // Correção definitiva: rare só existe quando o comando é raro.
    // Nos outros eventos o campo é REMOVIDO, nunca fica undefined.
    if(cmd.type === 'rare') cmd.rare = cmd.rare || 'legend';
    else delete cmd.rare;

    try{
      await writeCommand(cmd);
    }catch(err){
      console.error(err);
      alert(firebaseErrorText(err));
      status(firebaseErrorText(err));
    }
  }

  async function saveCode(name, code){
    if(globalMode==='firebase' && db){
      await db.ref(ns()+'/codes/'+name).set(code);
      log('Código GLOBAL criado: '+name);
      return;
    }
    const codes=readLocalCodes(); codes[name]=code; writeLocalCodes(codes); renderCodes(codes); log('Código LOCAL criado: '+name);
  }

  $('#unlockBtn').onclick=async()=>{
    const pass=(cfg().adminPassword || 'admin2117');
    if($('#adminPass').value.trim()!==pass) return alert('Senha errada.');
    $('#lock').classList.add('hidden');
    $('#panel').classList.remove('hidden');
    await initGlobal();
  };

  document.querySelectorAll('[data-event]').forEach(btn=>btn.onclick=()=>{
    const type=btn.dataset.event;
    const minutes=Math.max(1,Number($('#eventMinutes').value)||8);
    const payload={minutes};
    if(type==='rare') payload.rare='legend';
    command(type,payload);
  });

  $('#giveFruits').onclick=()=>command('fruits',{amount:Number($('#fruitAmount').value)||0});

  $('#createCode').onclick=async()=>{
    const name=($('#codeName').value||'').trim().toUpperCase().replace(/[^A-Z0-9_]/g,'');
    if(!name) return alert('Digite o nome do código.');
    const code={};
    const fruits=Number($('#codeFruits').value)||0, xp=Number($('#codeXp').value)||0;
    if(fruits>0) code.fruits=fruits;
    if(xp>0) code.xp=xp;
    if($('#codeSkin').value) code.skin=$('#codeSkin').value;
    if($('#codeAura').value) code.aura=$('#codeAura').value;
    try{ await saveCode(name, code); }catch(err){ console.error(err); alert(firebaseErrorText(err)); status(firebaseErrorText(err)); }
  };
})();


function generatePremiumKey(duration){
  const part = () => Math.random().toString(36).slice(2,6).toUpperCase();
  const prefix = duration === 'permanent' ? 'PREM-LIFE' : 'PREM-' + duration.toUpperCase();
  return `${prefix}-${part()}-${part()}-${part()}`;
}

function sanitizePremiumKey(key){
  return String(key||'').trim().toUpperCase().replace(/\s+/g,'-');
}

async function createPremiumKey(){
  const durationEl = document.getElementById('premiumKeyDuration');
  const customEl = document.getElementById('premiumKeyCustom');
  const resultEl = document.getElementById('premiumKeyResult');
  const duration = durationEl?.value || '30d';
  const key = sanitizePremiumKey(customEl?.value) || generatePremiumKey(duration);
  const payload = {
    key,
    duration,
    used:false,
    createdAt:Date.now(),
    createdBy:'admin'
  };

  try{
    if(window.globalDb){
      await window.globalDb.ref('premiumKeys/'+key).set(payload);
    }else if(typeof globalDb !== 'undefined' && globalDb){
      await globalDb.ref('premiumKeys/'+key).set(payload);
    }else{
      const local = JSON.parse(localStorage.getItem('maca_premium_keys_local_v1') || '{}');
      local[key] = payload;
      localStorage.setItem('maca_premium_keys_local_v1', JSON.stringify(local));
    }
    if(resultEl){
      resultEl.innerHTML = `<b>Key criada:</b><br><code>${key}</code><br><small>Duração: ${duration}</small>`;
    }
    customEl && (customEl.value='');
    alert('Key Premium criada com sucesso!');
  }catch(err){
    console.error(err);
    alert('Erro ao criar key Premium: ' + (err?.message || err));
    if(resultEl) resultEl.textContent = 'Erro ao criar key. Confira Firebase/Rules.';
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('createPremiumKeyBtn')?.addEventListener('click', createPremiumKey);
});
