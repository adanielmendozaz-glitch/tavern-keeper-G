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
const expose=`\n;globalThis.__tk={getState:()=>state,getLive:()=>liveShift,setLive:v=>liveShift=v,startLiveShift,simulateLiveTick,finishLiveShift,refreshCandidates,generateCandidates,resolveV09Decision,V09_DECISION_EVENTS,persistLiveShift,restoreLiveShift,clearLiveShiftSnapshot,spawnLiveGuest,restoreSelectedEnergy,restoreAllEnergy,setInfiniteEnergy,getTrainer:()=>trainerSettings,trainerSecretTap,openTrainer,closeTrainer,economyForecast,workerPayrollCost,activePayroll,restPayroll,projectedArrivalsTarget,turnoverMultiplier,toggleMenuProduct,buyProduct,clearCashSpendLedger,cashSpendSnapshot,pendingCashSpendTotal,PREMIUM_SERVICES_V096,setPremiumService,premiumService,premiumWorkers,premiumTryForGuest,ensureV096State};`;
vm.runInContext(source+expose,context,{filename:'game.js'});
const api=context.__tk;
assert(api,'API de smoke test no expuesta');
assert(version==='0.9.6','VERSION debe ser 0.9.6');
assert(html.includes('Tavern Keeper G · V0.9.6'),'Footer visual no coincide con V0.9.6');
const st=api.getState();
assert(st.staff?.length>0,'La plantilla inicial no se renderiza');
assert(st.candidates?.length>0,'El mercado laboral quedó vacío al arrancar');
st.gold=5000;st.reputation=100;st.upgrades.vip=2;st.upgrades.decor=3;st.upgrades.security=2;
api.refreshCandidates();assert(api.getState().candidates.length>=3,'Renovar candidatas no generó mercado');
// Stock generoso para pruebas
for(const k of Object.keys(st.inventory||{}))st.inventory[k]=80;
for(const k of Object.keys(st.menuEnabled||{}))st.menuEnabled[k]=true;
st.staff.forEach(w=>{w.active=true;w.energy=100});


// Trainer V0.9.4: restauración individual y de toda la plantilla
assert(html.includes('id="trainerOverlay"'),'Falta el panel trainer en HTML');
assert(html.includes('id="trainerHotspot"'),'Falta el acceso secreto del trainer');
const chosen=st.staff[0];
chosen.energy=7;chosen.active=false;st.selectedWorkerId=chosen.id;
assert(api.restoreSelectedEnergy(),'No pudo restaurar trabajadora seleccionada');
assert(chosen.energy===100,'Restaurar seleccionada no deja energía en 100');
assert(chosen.active===true,'Restaurar seleccionada no la deja disponible');
st.staff.forEach((w,i)=>{w.energy=5+i;w.active=false});
assert(api.restoreAllEnergy(),'No pudo restaurar toda la plantilla');
assert(st.staff.every(w=>w.energy===100&&w.active),'Restaurar toda la plantilla no deja a todas disponibles');

// Energía infinita debe persistir y evitar desgaste al finalizar jornada
api.setInfiniteEnergy(true);
assert(api.getTrainer().infiniteEnergy===true,'No se activó energía infinita');
assert(JSON.parse(store.get('tavernKeeper_trainer_v1')).infiniteEnergy===true,'Energía infinita no persiste');
st.staff.forEach(w=>{w.energy=13;w.active=true});
api.setLive(null);api.clearLiveShiftSnapshot();st.gold=10000;st.reputation=100;
for(const k of Object.keys(st.inventory||{}))st.inventory[k]=120;
api.startLiveShift();let trainerLoops=0;
while(api.getLive()&&!api.getLive().finished&&trainerLoops++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}
assert(api.getLive()?.finished,'Jornada trainer quedó bloqueada');
assert(st.staff.every(w=>w.energy===100),'Energía infinita no restauró 100% al cerrar jornada');
api.setInfiniteEnergy(false);
assert(api.getTrainer().infiniteEnergy===false,'No se pudo apagar energía infinita');

// Cinco toques deben abrir el trainer
api.closeTrainer();
for(let i=0;i<5;i++)api.trainerSecretTap();
assert(els.get('trainerOverlay').classList.contains('open'),'Cinco toques no abren el trainer');
api.closeTrainer();

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


// V0.9.5: nómina, menú, previsión y conciliación real de caja
api.setLive(null);api.clearLiveShiftSnapshot();api.clearCashSpendLedger();
st.gold=10000;st.reputation=30;st.upgrades={tables:1,kitchen:1,cellar:1,decor:1,rooms:0,bar:1,vip:0,security:0};
st.staff=[
 {id:'e-test',name:'Elena',role:'server',roleLabel:'Camarera principal',wage:11,service:82,charisma:76,speed:74,stamina:68,rarity:'Experta',rarityKey:'expert',rarityClass:'expert',level:3,xp:0,morale:82,energy:100,loyalty:68,active:true,assignment:'salon',abilityId:'warm'},
 {id:'b-test',name:'Luna',role:'server',roleLabel:'Camarera',wage:12,service:72,charisma:82,speed:78,stamina:70,rarity:'Competente',rarityKey:'competent',rarityClass:'competent',level:2,xp:0,morale:80,energy:100,loyalty:65,active:true,assignment:'barra',abilityId:'extraAle'},
 {id:'c-test',name:'Mira',role:'cook',roleLabel:'Cocinera',wage:14,service:60,charisma:58,speed:72,stamina:82,cooking:88,rarity:'Experta',rarityKey:'expert',rarityClass:'expert',level:2,xp:0,morale:80,energy:100,loyalty:66,active:true,assignment:'cocina',abilityId:'mise'},
 {id:'r-test',name:'Reserva',role:'server',roleLabel:'Camarera',wage:18,service:80,charisma:80,speed:80,stamina:80,rarity:'Élite',rarityKey:'elite',rarityClass:'elite',level:2,xp:0,morale:80,energy:100,loyalty:66,active:false,assignment:'salon',abilityId:'swift'}
];
assert(api.activePayroll()===37,'La nómina activa esperada debe ser 37');
assert(api.restPayroll()===5,'Descanso debe cobrar 25% redondeado: 5');
assert(api.workerPayrollCost(st.staff[3])===5,'La trabajadora en descanso cobra demasiado');
for(const k of Object.keys(st.inventory||{}))st.inventory[k]=120;
st.menuEnabled={beer:true,wine:true,mead:true,stew:true,roast:true,cheese:true};
let ef=api.economyForecast();
assert(ef.breakEven>0&&ef.breakEven<24,'Punto de equilibrio fuera de rango razonable');
assert(api.projectedArrivalsTarget()>=10,'La rotación no proyecta suficientes llegadas');
// Una plantilla absurdamente cara debe seguir marcando peligro: el rebalance no convierte el juego en dinero gratis.
const safeStaff=structuredClone(st.staff);st.staff=Array.from({length:8},(_,i)=>({id:`g${i}`,name:`Genio ${i}`,role:i%3===2?'cook':'server',roleLabel:i%3===2?'Cocinera':'Camarera',wage:40,service:99,charisma:99,speed:99,stamina:99,cooking:99,rarity:'Genio',rarityKey:'genius',rarityClass:'genius',level:4,xp:0,morale:90,energy:100,loyalty:90,active:true,assignment:i%3===0?'salon':i%3===1?'barra':'cocina',abilityId:'swift'}));
ef=api.economyForecast();assert(ef.status==='danger'&&ef.expectedProfit<0,'La previsión no detecta sobrecoste extremo de plantilla');st.staff=safeStaff;
// Producto agotado no puede reactivarse desde OFF.
st.menuEnabled.wine=false;st.inventory.wine=0;api.toggleMenuProduct('wine');assert(st.menuEnabled.wine===false,'Se activó vino sin stock');
// Compra normal debe quedar conciliada como movimiento de caja del periodo.
api.clearCashSpendLedger();for(const k of Object.keys(st.inventory||{}))st.inventory[k]=0;st.menuEnabled.beer=false;const beforeBuy=st.gold;api.buyProduct('beer');assert(api.cashSpendSnapshot().inventory>0,'Compra de inventario no quedó en el libro de caja');const afterBuy=st.gold;assert(afterBuy<beforeBuy,'Compra no descontó oro');st.menuEnabled.beer=true;st.inventory.stew=120;st.menuEnabled.stew=true;st.forecast={id:'normal',label:'Jornada normal',mod:1,segment:'Mixto',text:'',impact:''};
const periodStartGold=beforeBuy;api.startLiveShift();let econLoops=0;while(api.getLive()&&!api.getLive().finished&&econLoops++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}
assert(api.getLive()?.finished,'Jornada de conciliación económica quedó bloqueada');
assert(st.lastDay.preShiftInventorySpend>0,'El cierre no conserva compras previas de inventario');
assert(st.lastDay.cashChange===st.gold-periodStartGold,'La variación de caja no concilia con el oro real');
assert(api.pendingCashSpendTotal()===0,'El libro de caja no se reinició tras cerrar jornada');
// Soak económico: una plantilla sensata debe completar jornadas sin bloqueo y conservar posibilidad real de beneficio.
let positive=0,total=40;
for(let run=0;run<total;run++){
 api.setLive(null);api.clearLiveShiftSnapshot();api.clearCashSpendLedger();st.gold=10000;st.reputation=20;st.staff=structuredClone(safeStaff);st.staff.forEach((w,i)=>{w.active=i<3;w.energy=100;w.morale=80});st.upgrades={tables:1,kitchen:1,cellar:1,decor:1,rooms:0,bar:1,vip:0,security:0};for(const k of Object.keys(st.inventory||{}))st.inventory[k]=120;st.menuEnabled={beer:true,wine:true,mead:false,stew:true,roast:false,cheese:true};st.forecast={id:'normal',label:'Jornada normal',mod:1,segment:'Mixto',text:'',impact:''};
 api.startLiveShift();let loops=0;while(api.getLive()&&!api.getLive().finished&&loops++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(0);else api.simulateLiveTick()}assert(api.getLive()?.finished,`Economía jornada ${run+1} quedó bloqueada`);if(st.lastDay.net>0)positive++;
}
assert(positive>=20,`La operación sensata sigue demasiado castigada: ${positive}/${total} jornadas positivas`);


// V0.9.6: especialización solo cerveza + servicios premium
api.ensureV096State();
assert(st.menuEnabled.beer===true,'Cerveza debe quedar activa');
for(const id of ['wine','mead','stew','roast','cheese']){assert(st.menuEnabled[id]===false,`${id} no debe estar activo`);assert((st.inventory[id]||0)===0,`${id} debe quedar fuera del inventario operativo`)}
assert(html.includes('Servicios Premium'),'Falta interfaz de servicios premium');
assert(html.includes('<b>Premium</b>'),'La navegación no muestra Premium');
// Asegurar una trabajadora elegible y asignarle servicio
st.staff[0].charisma=95;st.staff[0].rarityKey='expert';st.staff[0].active=true;st.staff[0].assignment='salon';
assert(api.setPremiumService(st.staff[0].id,'company')===true,'No se pudo asignar compañía/conversación');
assert(api.premiumService(st.staff[0]).id==='company','Servicio premium no persistió');
// Servicio legendario solo para Prodigio/Genio
assert(api.setPremiumService(st.staff[0].id,'legendary')===false,'Servicio legendario aceptó rareza no válida');
st.staff[0].rarityKey='genius';assert(api.setPremiumService(st.staff[0].id,'legendary')===true,'Genio no pudo recibir servicio legendario');
// Jornada solo cerveza
api.setLive(null);api.clearLiveShiftSnapshot();st.gold=10000;st.inventory.beer=100;st.menuEnabled={beer:true,wine:false,mead:false,stew:false,roast:false,cheese:false};st.staff.forEach(w=>{w.active=true;w.energy=100;if(!['salon','barra','recepcion'].includes(w.assignment))w.assignment='barra'});
api.startLiveShift();assert(api.getLive(),'No inició jornada cerveza-only');
const forced=api.spawnLiveGuest('nobles',false);assert(forced&&forced.orders.length===1&&forced.orders[0]==='beer','Cliente pidió algo distinto de cerveza');
let beerLoops=0;while(api.getLive()&&!api.getLive().finished&&beerLoops++<500){if(api.getLive().pendingDecision)api.resolveV09Decision(1);else api.simulateLiveTick()}
assert(api.getLive()?.finished,'Jornada cerveza-only quedó bloqueada');
assert((st.lastDay?.mealsSold||0)===0,'Se vendió comida en modo solo cerveza');
assert(Object.entries(st.lastDay.productSales||{}).filter(([id,x])=>id!=='beer'&&x.qty>0).length===0,'Se vendió producto distinto de cerveza');

// Assets referenciados deben existir
const refs=[...source.matchAll(/['"](assets\/[^'"]+)['"]/g)].map(m=>m[1]);
const missing=[...new Set(refs)].filter(r=>!fs.existsSync(path.join(ROOT,'www',r)));
assert(missing.length===0,`Assets faltantes: ${missing.join(', ')}`);
console.log('SMOKE OK · V0.9.6 cerveza-only, premium, trainer, economía, decisiones, soak, checkpoint y assets');
