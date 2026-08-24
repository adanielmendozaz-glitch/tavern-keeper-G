import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT=path.resolve(new URL('..', import.meta.url).pathname);
const html=fs.readFileSync(path.join(ROOT,'www/index.html'),'utf8');
const source=fs.readFileSync(path.join(ROOT,'www/game.js'),'utf8');
const version=fs.readFileSync(path.join(ROOT,'VERSION'),'utf8').trim();
function assert(cond,msg){if(!cond)throw new Error(msg)}

class Classes{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(v,force){if(force===undefined){this.s.has(v)?this.s.delete(v):this.s.add(v);return this.s.has(v)}force?this.s.add(v):this.s.delete(v);return force}contains(v){return this.s.has(v)}}
class El{constructor(id=''){this.id=id;this.textContent='';this.innerHTML='';this.className='';this.classList=new Classes();this.style={};this.dataset={};this.disabled=false;this.src='';this.onclick=null;this.attributes={}}setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]}}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const els=new Map(ids.map(id=>[id,new El(id)]));
const document={body:new El('body'),hidden:false,querySelector(sel){if(sel.startsWith('#'))return els.get(sel.slice(1))||null;return null},querySelectorAll(){return []},addEventListener(){}};
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let timerId=1;
const windowObj={scrollTo(){},addEventListener(){}};
const context=vm.createContext({console,document,window:windowObj,localStorage,setTimeout:()=>1,clearTimeout(){},setInterval:()=>timerId++,clearInterval(){},structuredClone,Date,Math,JSON,Set,Map,Object,Array,String,Number,Boolean,RegExp,Error});
const expose=`\n;globalThis.__tk={getState:()=>state,getLive:()=>liveShift,setLive:v=>liveShift=v,startLiveShift,simulateLiveTick,finishLiveShift,refreshCandidates,generateCandidates,resolveV09Decision,V09_DECISION_EVENTS,persistLiveShift,restoreLiveShift,clearLiveShiftSnapshot,spawnLiveGuest};`;
vm.runInContext(source+expose,context,{filename:'game.js'});
const api=context.__tk;
assert(api,'API de smoke test no expuesta');
assert(version==='0.9.3','VERSION debe ser 0.9.3');
assert(html.includes('Tavern Keeper G · V0.9.3'),'Footer visual no coincide con V0.9.3');
const st=api.getState();
assert(st.staff?.length>0,'La plantilla inicial no se renderiza');
assert(st.candidates?.length>0,'El mercado laboral quedó vacío al arrancar');
st.gold=5000;st.reputation=100;st.upgrades.vip=2;st.upgrades.decor=3;st.upgrades.security=2;
api.refreshCandidates();assert(api.getState().candidates.length>=3,'Renovar candidatas no generó mercado');
// Stock generoso para pruebas
for(const k of Object.keys(st.inventory||{}))st.inventory[k]=80;
for(const k of Object.keys(st.menuEnabled||{}))st.menuEnabled[k]=true;
st.staff.forEach(w=>{w.active=true;w.energy=100});

// Probar cada rama de decisiones con una jornada real inicializada
for(const ev of api.V09_DECISION_EVENTS){
  for(let i=0;i<ev.choices.length;i++){
    api.setLive(null);api.clearLiveShiftSnapshot();
    st.gold=5000;st.reputation=100;st.upgrades.vip=2;st.upgrades.decor=3;st.upgrades.security=2;
    api.startLiveShift();const L=api.getLive();assert(L,'No inicia jornada para prueba de decisiones');
    L.pendingDecision=ev;L.paused=true;
    api.resolveV09Decision(i);
    assert(!api.getLive().pendingDecision,`Decisión ${ev.id}/${i} no se resolvió`);
  }
}

// Probar contabilidad del gasto directo de publicidad
api.setLive(null);api.clearLiveShiftSnapshot();st.gold=5000;for(const k of Object.keys(st.inventory||{}))st.inventory[k]=80;api.startLiveShift();
let L=api.getLive();const caravan=api.V09_DECISION_EVENTS.find(e=>e.id==='caravanDeal');L.pendingDecision=caravan;L.paused=true;const goldBefore=st.gold;api.resolveV09Decision(1);assert(st.gold===goldBefore-6,'Publicidad no descuenta 6 oro inmediatamente');assert(L.directSpend===6,'Publicidad no queda registrada como gasto directo');
// completar jornada resolviendo cualquier decisión
let guard=0;while(api.getLive()&&!api.getLive().finished&&guard++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}
assert(api.getLive()?.finished,'La jornada no terminó en smoke test');
assert((st.lastDay?.directSpend||0)>=6,'El informe no conserva el gasto directo');
assert(st.lastDay.expenses>=st.lastDay.salary+st.lastDay.cogs+6,'Los gastos no incluyen publicidad/compra directa');


// Probar compra de inventario: sale de caja, pero se capitaliza como inventario (no gasto operativo completo)
api.setLive(null);api.clearLiveShiftSnapshot();st.gold=5000;for(const k of Object.keys(st.inventory||{}))st.inventory[k]=80;api.startLiveShift();
L=api.getLive();L.pendingDecision=caravan;L.paused=true;const stockGoldBefore=st.gold;api.resolveV09Decision(0);assert(st.gold===stockGoldBefore-12,'La compra de caravana no descuenta 12 oro');assert(L.inventorySpend===12,'La compra no queda registrada como inversión en inventario');

// Soak: múltiples jornadas aleatorias completas sin bloqueos
for(let run=0;run<20;run++){
  api.setLive(null);api.clearLiveShiftSnapshot();st.gold=10000;st.reputation=100;st.staff.forEach(w=>{w.active=true;w.energy=100});for(const k of Object.keys(st.inventory||{}))st.inventory[k]=120;
  api.startLiveShift();let loops=0;while(api.getLive()&&!api.getLive().finished&&loops++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}
  assert(api.getLive()?.finished,`Soak jornada ${run+1} quedó bloqueada`);
}

// Probar checkpoint/reanudación a mitad de jornada
api.setLive(null);api.clearLiveShiftSnapshot();for(const k of Object.keys(st.inventory||{}))st.inventory[k]=80;api.startLiveShift();
for(let i=0;i<25;i++){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}
const tickBefore=api.getLive().tick;api.persistLiveShift();api.setLive(null);assert(api.restoreLiveShift(),'No pudo restaurar jornada guardada');assert(api.getLive().tick===tickBefore,'La jornada no vuelve al mismo tick');

// Assets referenciados deben existir
const refs=[...source.matchAll(/['"](assets\/[^'"]+)['"]/g)].map(m=>m[1]);
const missing=[...new Set(refs)].filter(r=>!fs.existsSync(path.join(ROOT,'www',r)));
assert(missing.length===0,`Assets faltantes: ${missing.join(', ')}`);
console.log('SMOKE OK · arranque, mercado, decisiones, contabilidad, 20 jornadas soak, checkpoint y assets');
