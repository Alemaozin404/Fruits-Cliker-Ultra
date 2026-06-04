
(() => {
  'use strict';
  const VERSION = '12.9.0-admin-cinema-codes-private';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const now = () => Date.now();
  const ADMIN_LOCAL_CODES = 'maca_clicker_admin_codes_v1';
  const LOCAL_PREMIUM_KEYS = 'maca_premium_keys_local_v1';

  let globalDb = null;

  function initFirebase(){
    try{
      const cfg = window.MACA_FIREBASE_CONFIG;
      if(!cfg || !cfg.enabled || !cfg.firebaseConfig) throw new Error('Firebase não ativado no global-config.js');
      if(!firebase.apps.length) firebase.initializeApp(cfg.firebaseConfig);
      globalDb = firebase.database();
      window.globalDb = globalDb;
      $('#firebaseStatus').textContent = 'Online';
      return true;
    }catch(err){
      console.warn(err);
      $('#firebaseStatus').textContent = 'Fallback local';
      return false;
    }
  }

  function clean(obj){
    if(Array.isArray(obj)) return obj.map(clean).filter(v=>v!==undefined);
    if(obj && typeof obj === 'object'){
      const out = {};
      Object.entries(obj).forEach(([k,v])=>{ if(v !== undefined && v !== null && v !== '') out[k] = clean(v); });
      return out;
    }
    return obj;
  }

  function randomPart(){ return Math.random().toString(36).slice(2,6).toUpperCase(); }
  function sanitizeKey(v){ return String(v||'').trim().toUpperCase().replace(/\s+/g,'-'); }
  function fmtDate(v){ return v ? new Date(v).toLocaleString('pt-BR') : 'sem data'; }

  async function sendCommand(type, payload={}){
    const command = clean({
      type,
      ...payload,
      id: now() + '_' + randomPart(),
      createdAt: now(),
      source: 'admin-cinema'
    });
    try{
      if(globalDb){
        await globalDb.ref('command').set(command);
        await globalDb.ref('commandHistory/'+command.id).set(command);
      }else{
        localStorage.setItem('maca_clicker_global_admin_v1', JSON.stringify(command));
      }
      $('#lastCommandText').textContent = 'Último comando: ' + type + ' • ' + fmtDate(command.createdAt);
      alert('Comando enviado com sucesso!');
    }catch(err){
      console.error(err);
      alert('Erro ao enviar comando: ' + (err?.message || err));
    }
  }

  async function createCode(){
    const code = sanitizeKey($('#codeName').value || ('CODE-' + randomPart() + '-' + randomPart()));
    const event = $('#codeEvent').value;
    const payload = clean({
      code,
      fruits: Number($('#codeFruits').value || 0),
      passXp: Number($('#codePassXp').value || 0),
      bossTickets: Number($('#codeBossTickets').value || 0),
      premiumDays: Number($('#codePremiumDays').value || 0),
      maxUses: Number($('#codeMaxUses').value || 0),
      event,
      duration: event ? 10*60000 : undefined,
      msg: $('#codeMessage').value || 'Código resgatado com sucesso!',
      createdAt: now(),
      usedCount: 0,
      disabled: false
    });
    try{
      if(globalDb){
        await globalDb.ref('codes/'+code).set(payload);
      }else{
        const local = JSON.parse(localStorage.getItem(ADMIN_LOCAL_CODES) || '{}');
        local[code] = payload;
        localStorage.setItem(ADMIN_LOCAL_CODES, JSON.stringify(local));
      }
      $('#createdCodeResult').innerHTML = `<b>Código criado:</b><br><code>${code}</code>`;
      $('#codeName').value = '';
      await loadCodes();
      alert('Código privado criado!');
    }catch(err){
      console.error(err);
      alert('Erro ao criar código: ' + (err?.message || err));
    }
  }

  async function loadCodes(){
    const box = $('#codesList');
    if(!box) return;
    box.innerHTML = '<article><div><b>Carregando...</b><small>Aguarde</small></div></article>';
    try{
      let codes = {};
      if(globalDb){
        const snap = await globalDb.ref('codes').limitToLast(80).get();
        codes = snap.val() || {};
      }else{
        codes = JSON.parse(localStorage.getItem(ADMIN_LOCAL_CODES) || '{}');
      }
      const arr = Object.values(codes).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      box.innerHTML = arr.length ? arr.map(c=>`<article>
        <div><b>${c.code}</b><small>${c.fruits||0} maçãs • ${c.passXp||0} XP • usos ${c.usedCount||0}/${c.maxUses||'∞'}</small></div>
        <span class="pill">${c.disabled?'OFF':'ATIVO'}</span>
      </article>`).join('') : '<article><div><b>Nenhum código criado</b><small>Crie o primeiro código privado.</small></div></article>';
    }catch(err){
      console.error(err);
      box.innerHTML = '<article><div><b>Erro ao carregar códigos</b><small>Confira Firebase/Rules.</small></div></article>';
    }
  }

  function generatePremiumKey(duration){
    const prefix = duration === 'permanent' ? 'PREM-LIFE' : 'PREM-' + duration.toUpperCase();
    return `${prefix}-${randomPart()}-${randomPart()}-${randomPart()}`;
  }

  async function createPremiumKey(){
    const duration = $('#premiumKeyDuration').value || '30d';
    const key = sanitizeKey($('#premiumKeyCustom').value) || generatePremiumKey(duration);
    const payload = {key,duration,used:false,createdAt:now(),createdBy:'admin-cinema'};
    try{
      if(globalDb){
        await globalDb.ref('premiumKeys/'+key).set(payload);
      }else{
        const local = JSON.parse(localStorage.getItem(LOCAL_PREMIUM_KEYS) || '{}');
        local[key] = payload;
        localStorage.setItem(LOCAL_PREMIUM_KEYS, JSON.stringify(local));
      }
      $('#premiumKeyResult').innerHTML = `<b>Key criada:</b><br><code>${key}</code><br><small>Duração: ${duration}</small>`;
      $('#premiumKeyCustom').value = '';
      await loadPremiumKeys();
      alert('Key Premium criada!');
    }catch(err){
      console.error(err);
      alert('Erro ao criar key: ' + (err?.message || err));
    }
  }

  async function loadPremiumKeys(){
    const box = $('#premiumKeysList');
    if(!box) return;
    box.innerHTML = '<article><div><b>Carregando...</b><small>Aguarde</small></div></article>';
    try{
      let keys = {};
      if(globalDb){
        const snap = await globalDb.ref('premiumKeys').limitToLast(80).get();
        keys = snap.val() || {};
      }else{
        keys = JSON.parse(localStorage.getItem(LOCAL_PREMIUM_KEYS) || '{}');
      }
      const arr = Object.values(keys).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      box.innerHTML = arr.length ? arr.map(k=>`<article>
        <div><b>${k.key}</b><small>Duração: ${k.duration} • criada em ${fmtDate(k.createdAt)}</small></div>
        <span class="pill">${k.used?'USADA':'NOVA'}</span>
      </article>`).join('') : '<article><div><b>Nenhuma key criada</b><small>Crie uma key Premium.</small></div></article>';
    }catch(err){
      console.error(err);
      box.innerHTML = '<article><div><b>Erro ao carregar keys</b><small>Confira Firebase/Rules.</small></div></article>';
    }
  }

  async function loadHistory(){
    const box = $('#codeHistoryList');
    if(!box) return;
    box.innerHTML = '<article><div><b>Carregando...</b><small>Aguarde</small></div></article>';
    try{
      let hist = [];
      if(globalDb){
        const snap = await globalDb.ref('codeHistory').limitToLast(80).get();
        const val = snap.val() || {};
        hist = Object.values(val);
      }else{
        hist = JSON.parse(localStorage.getItem('maca_code_history_local_v1') || '[]');
      }
      hist.sort((a,b)=>(b.usedAt||0)-(a.usedAt||0));
      box.innerHTML = hist.length ? hist.map(h=>`<article>
        <div><b>${h.code}</b><small>${h.player||'Jogador'} • ${fmtDate(h.usedAt)} • ${h.source||'local'}</small></div>
      </article>`).join('') : '<article><div><b>Nenhum resgate ainda</b><small>Quando jogadores usarem códigos, aparece aqui.</small></div></article>';
    }catch(err){
      console.error(err);
      box.innerHTML = '<article><div><b>Erro ao carregar histórico</b><small>Confira Firebase/Rules.</small></div></article>';
    }
  }

  async function diagnostic(){
    const box = $('#diagnosticResult');
    try{
      if(!globalDb) throw new Error('Firebase não conectado. Usando fallback local.');
      await globalDb.ref('diagnostic/adminCinema').set({ok:true,at:now(),version:VERSION});
      box.textContent = 'Firebase OK. Escrita e leitura funcionando.';
    }catch(err){
      box.textContent = 'Diagnóstico: ' + (err?.message || err);
    }
  }

  function bind(){
    $$('.admin-tab').forEach(btn=>btn.addEventListener('click',()=>{
      $$('.admin-tab').forEach(b=>b.classList.remove('active'));
      $$('.admin-screen').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      $('#tab-'+btn.dataset.adminTab)?.classList.add('active');
    }));

    $('#startDoubleBtn')?.addEventListener('click',()=>sendCommand('event',{event:'double',duration:Number($('#doubleDuration').value||30)*60000}));
    $('#startWelisonBtn')?.addEventListener('click',()=>sendCommand('event',{event:'welison',duration:Number($('#welisonDuration').value||15)*60000}));
    $('#startBossBtn')?.addEventListener('click',()=>sendCommand('boss',{bossName:$('#bossNameInput').value||'Rei Caveira do Pomar'}));
    $('#startRareBtn')?.addEventListener('click',()=>sendCommand('event',{event:'rare',rare:$('#rareType').value}));
    $('#sendFruitsBtn')?.addEventListener('click',()=>sendCommand('fruits',{amount:Number($('#globalFruitAmount').value||0)}));
    $('#createCodeBtn')?.addEventListener('click',createCode);
    $('#refreshCodesBtn')?.addEventListener('click',loadCodes);
    $('#createPremiumKeyBtn')?.addEventListener('click',createPremiumKey);
    $('#refreshPremiumKeysBtn')?.addEventListener('click',loadPremiumKeys);
    $('#refreshHistoryBtn')?.addEventListener('click',loadHistory);
    $('#diagnosticBtn')?.addEventListener('click',diagnostic);
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    initFirebase();
    bind();
    await Promise.allSettled([loadCodes(),loadPremiumKeys(),loadHistory()]);
  });
})();
