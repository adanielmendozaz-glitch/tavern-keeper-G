const SAVE_KEY = 'tavernKeeper_save';
const SAVE_SCHEMA = 1;

const FORECASTS = [
  { id: 'quiet', label: 'Tranquilo', mod: 0.82, text: 'Llueve sobre Brumavieja y pocos viajeros se aventuran por los caminos.' },
  { id: 'normal', label: 'Normal', mod: 1.0, text: 'Los caminos están transitados. Se espera una jornada normal.' },
  { id: 'market', label: 'Mercado', mod: 1.22, text: 'Hay mercado en la plaza. Comerciantes y campesinos buscarán mesa al caer la tarde.' },
  { id: 'caravan', label: 'Caravana', mod: 1.15, text: 'Una caravana llegó a la villa. Los viajeros traen sed, hambre y algo de oro.' },
  { id: 'guard', label: 'Guardia', mod: 1.08, text: 'Cambio de guardia en la fortaleza. Habrá soldados buscando comida y cerveza.' }
];

function makeForecast() {
  const weights = [0.14, 0.42, 0.17, 0.15, 0.12];
  let roll = Math.random();
  for (let i = 0; i < FORECASTS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return { ...FORECASTS[i] };
  }
  return { ...FORECASTS[1] };
}

const initialState = () => ({
  schemaVersion: SAVE_SCHEMA,
  day: 1,
  gold: 120,
  reputation: 10,
  ale: 20,
  food: 12,
  servers: 1,
  cooks: 0,
  prices: { ale: 4, meal: 7 },
  upgrades: { tables: 1, kitchen: 1, cellar: 1 },
  forecast: makeForecast(),
  lifetime: { customers: 0, revenue: 0, profit: 0 },
  lastDay: null,
  log: [
    { day: 0, title: 'Llegas a Brumavieja', text: 'Has heredado una taberna pequeña, unas cuantas monedas y un letrero que cruje con el viento.' }
  ]
});

let state = load();
let toastTimer;

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    const fresh = initialState();
    return {
      ...fresh,
      ...parsed,
      schemaVersion: SAVE_SCHEMA,
      prices: { ...fresh.prices, ...(parsed.prices || {}) },
      upgrades: { ...fresh.upgrades, ...(parsed.upgrades || {}) },
      forecast: parsed.forecast?.id ? parsed.forecast : fresh.forecast,
      lifetime: { ...fresh.lifetime, ...(parsed.lifetime || {}) },
      log: Array.isArray(parsed.log) ? parsed.log : fresh.log
    };
  } catch {
    return initialState();
  }
}

function save(showToast = false) {
  state.schemaVersion = SAVE_SCHEMA;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showToast) toast('Partida guardada');
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function chance(p) { return Math.random() < p; }
function capacity() { return 6 + state.upgrades.tables * 4; }
function cellarSoftCap() { return 24 + state.upgrades.cellar * 16; }
function wages() { return state.servers * 5 + state.cooks * 6; }

function upgradeCost(type) {
  const base = { tables: 45, kitchen: 55, cellar: 50 }[type];
  return base * state.upgrades[type];
}

function serviceScore(customers) {
  const labor = state.servers * 7 + state.cooks * 5 + state.upgrades.kitchen * 2;
  return clamp(0.55 + labor / Math.max(18, customers * 3), 0.5, 1.25);
}

function demandModifier() {
  const alePricePenalty = Math.max(0, state.prices.ale - 5) * 0.055;
  const mealPricePenalty = Math.max(0, state.prices.meal - 8) * 0.04;
  const cheapBonus = (state.prices.ale <= 3 ? 0.05 : 0) + (state.prices.meal <= 6 ? 0.04 : 0);
  return clamp(1 - alePricePenalty - mealPricePenalty + cheapBonus, 0.42, 1.2);
}

function log(title, text, day = state.day) {
  state.log.unshift({ day, title, text });
  state.log = state.log.slice(0, 100);
}

function buy(kind, amount, cost, label) {
  if (state.gold < cost) return toast('No tienes suficiente oro');
  const newStock = state[kind] + amount;
  const softCap = cellarSoftCap();
  if (newStock > softCap + 10) return toast('La bodega está demasiado llena');
  state.gold -= cost;
  state[kind] = newStock;
  log('Compra de provisiones', `${label}: +${amount}. Pagaste ${cost} de oro.`);
  save();
  render();
}

function hire(role) {
  const data = role === 'servers'
    ? { cost: 35, label: 'camarero' }
    : { cost: 40, label: 'cocinero' };
  if (state.gold < data.cost) return toast('No tienes suficiente oro');
  state.gold -= data.cost;
  state[role] += 1;
  log('Nuevo contrato', `Contrataste un ${data.label}. Recuerda que cobrará salario al final de cada jornada.`);
  save();
  render();
}

function upgrade(type) {
  const cost = upgradeCost(type);
  if (state.gold < cost) return toast(`Necesitas ${cost} de oro`);
  state.gold -= cost;
  state.upgrades[type] += 1;
  const names = { tables: 'Mesas y bancos', kitchen: 'Cocina', cellar: 'Bodega' };
  log('Mejora completada', `${names[type]} sube a nivel ${state.upgrades[type]}. Coste: ${cost} oro.`);
  save();
  render();
}

function eventForDay(customers) {
  const roll = Math.random();
  if (roll < 0.10) {
    const tip = rand(8, 18);
    state.gold += tip;
    state.reputation += 1;
    return `Un mercader satisfecho dejó ${tip} de oro extra y habló bien de la casa.`;
  }
  if (roll < 0.18) {
    const loss = Math.min(Math.max(0, state.gold), rand(6, 14));
    state.gold -= loss;
    state.reputation = Math.max(0, state.reputation - 1);
    return `Una pelea rompió vajilla. Reparaciones: ${loss} de oro.`;
  }
  if (roll < 0.25 && customers >= 7) {
    state.reputation += 2;
    return 'Un bardo improvisó una canción sobre tu taberna. +2 reputación.';
  }
  if (roll < 0.31 && state.food > 4) {
    const loss = Math.min(state.food, rand(2, 5));
    state.food -= loss;
    return `Ratas en la despensa: perdiste ${loss} raciones.`;
  }
  if (roll < 0.36) {
    state.reputation += 1;
    return 'Un grupo de aventureros eligió tu salón como punto de reunión. +1 reputación.';
  }
  return null;
}

function openTavern() {
  const repPull = 4 + state.reputation * 0.34;
  const randomPull = rand(-2, 6);
  const forecastMod = state.forecast?.mod || 1;
  let visitors = Math.round((repPull + randomPull) * demandModifier() * forecastMod);
  visitors = clamp(visitors, 1, capacity());

  const service = serviceScore(visitors);
  const aleBuyChance = clamp(0.68 + state.reputation * 0.004 - Math.max(0, state.prices.ale - 4) * 0.055, 0.2, 0.9);
  const foodBuyChance = clamp(0.38 + state.cooks * 0.07 + state.upgrades.kitchen * 0.035 - Math.max(0, state.prices.meal - 7) * 0.04, 0.1, 0.82);

  let aleSold = 0;
  let mealsSold = 0;
  let unhappy = 0;

  for (let i = 0; i < visitors; i++) {
    if (chance(aleBuyChance)) {
      if (state.ale > 0) { state.ale--; aleSold++; } else unhappy++;
    }
    if (chance(foodBuyChance)) {
      if (state.food > 0) { state.food--; mealsSold++; } else unhappy++;
    }
    if (service < 0.78 && chance(0.26)) unhappy++;
  }

  const revenue = aleSold * state.prices.ale + mealsSold * state.prices.meal;
  const salary = wages();
  const operatingNet = revenue - salary;
  state.gold += operatingNet;

  let repDelta = 0;
  if (unhappy === 0 && service >= 0.92) repDelta += 2;
  else if (unhappy <= 2 && service >= 0.78) repDelta += 1;
  else if (unhappy >= 5) repDelta -= 2;
  else if (unhappy >= 3) repDelta -= 1;

  if (state.prices.ale >= 8 || state.prices.meal >= 13) repDelta -= 1;
  if (state.gold < 0) repDelta -= 1;
  state.reputation = clamp(state.reputation + repDelta, 0, 100);

  const cap = cellarSoftCap();
  let spoilage = 0;
  if (state.food > cap && chance(0.45)) {
    spoilage = Math.min(state.food - cap, rand(1, 3));
    state.food -= spoilage;
  }

  const goldBeforeEvent = state.gold;
  const event = eventForDay(visitors);
  const eventGoldDelta = state.gold - goldBeforeEvent;
  const finalNet = operatingNet + eventGoldDelta;

  state.lifetime.customers += visitors;
  state.lifetime.revenue += revenue;
  state.lifetime.profit += finalNet;
  state.lastDay = {
    day: state.day,
    visitors,
    aleSold,
    mealsSold,
    revenue,
    salary,
    net: finalNet,
    unhappy,
    forecast: state.forecast.label
  };

  let text = `${visitors} clientes · ${aleSold} cervezas · ${mealsSold} platos · ingresos ${revenue} · salarios ${salary} · balance ${finalNet >= 0 ? '+' : ''}${finalNet}.`;
  if (repDelta) text += ` Reputación ${repDelta > 0 ? '+' : ''}${repDelta}.`;
  if (spoilage) text += ` Merma: ${spoilage} raciones.`;
  if (event) text += ` Evento: ${event}`;

  log(`Jornada ${state.day} · ${state.forecast.label}`, text);
  state.day += 1;
  state.forecast = makeForecast();
  save();
  render();
  toast(finalNet >= 0 ? `Jornada cerrada: +${finalNet} oro` : `Jornada cerrada: ${finalNet} oro`);
}

function changePrice(kind, delta) {
  const limits = kind === 'ale' ? [2, 12] : [4, 18];
  state.prices[kind] = clamp(state.prices[kind] + delta, ...limits);
  save();
  render();
}

function render() {
  document.getElementById('day').textContent = state.day;
  document.getElementById('gold').textContent = state.gold;
  document.getElementById('reputation').textContent = state.reputation;
  document.getElementById('capacity').textContent = capacity();
  document.getElementById('aleStock').textContent = state.ale;
  document.getElementById('foodStock').textContent = state.food;
  document.getElementById('servers').textContent = state.servers;
  document.getElementById('cooks').textContent = state.cooks;
  document.getElementById('alePrice').textContent = state.prices.ale;
  document.getElementById('mealPrice').textContent = state.prices.meal;
  document.getElementById('tablesLevel').textContent = state.upgrades.tables;
  document.getElementById('kitchenLevel').textContent = state.upgrades.kitchen;
  document.getElementById('cellarLevel').textContent = state.upgrades.cellar;
  document.getElementById('cellarLevel2').textContent = state.upgrades.cellar;
  document.getElementById('forecastBadge').textContent = state.forecast.label;
  document.getElementById('forecastBadge').dataset.kind = state.forecast.id;
  document.getElementById('forecastText').textContent = state.forecast.text;

  const tableCost = upgradeCost('tables');
  const kitchenCost = upgradeCost('kitchen');
  const cellarCost = upgradeCost('cellar');
  document.getElementById('upgradeTables').textContent = `Mejorar · ${tableCost} oro`;
  document.getElementById('upgradeKitchen').textContent = `Mejorar · ${kitchenCost} oro`;
  document.getElementById('upgradeCellar').textContent = `Mejorar · ${cellarCost} oro`;
  document.getElementById('upgradeTables').disabled = state.gold < tableCost;
  document.getElementById('upgradeKitchen').disabled = state.gold < kitchenCost;
  document.getElementById('upgradeCellar').disabled = state.gold < cellarCost;
  document.getElementById('buyAle').disabled = state.gold < 12;
  document.getElementById('buyFood').disabled = state.gold < 16;
  document.getElementById('hireServer').disabled = state.gold < 35;
  document.getElementById('hireCook').disabled = state.gold < 40;

  const score = serviceScore(Math.max(6, capacity()));
  document.getElementById('serviceText').textContent = score >= 1
    ? 'Tu plantilla puede mantener un servicio rápido incluso con el salón lleno.'
    : score >= 0.78
      ? 'El servicio es aceptable, pero una jornada fuerte puede ponerlo bajo presión.'
      : 'Falta personal. Las esperas pueden costarte reputación.';

  const title = state.reputation >= 60 ? 'Posada legendaria'
    : state.reputation >= 35 ? 'Taberna célebre'
    : state.reputation >= 20 ? 'Taberna concurrida'
    : 'Taberna humilde';
  document.getElementById('tavernTitle').textContent = title;

  const debtNote = state.gold < 0 ? ' Estás endeudado: necesitas una buena jornada.' : '';
  document.getElementById('statusText').textContent = `Tienes ${state.ale} jarras, ${state.food} raciones y pagarás ${wages()} de oro en salarios al cerrar la próxima jornada.${debtNote}`;

  const logList = document.getElementById('logList');
  logList.innerHTML = state.log.length
    ? state.log.map(item => `<div class="log-item"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('')
    : '<p>No hay anotaciones.</p>';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[ch]));
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
}

document.querySelectorAll('[data-price]').forEach(btn => btn.addEventListener('click', () => changePrice(btn.dataset.price, Number(btn.dataset.delta))));
document.getElementById('buyAle').addEventListener('click', () => buy('ale', 10, 12, 'Barril de cerveza'));
document.getElementById('buyFood').addEventListener('click', () => buy('food', 8, 16, 'Provisiones'));
document.getElementById('hireServer').addEventListener('click', () => hire('servers'));
document.getElementById('hireCook').addEventListener('click', () => hire('cooks'));
document.getElementById('upgradeTables').addEventListener('click', () => upgrade('tables'));
document.getElementById('upgradeKitchen').addEventListener('click', () => upgrade('kitchen'));
document.getElementById('upgradeCellar').addEventListener('click', () => upgrade('cellar'));
document.getElementById('openBtn').addEventListener('click', openTavern);
document.getElementById('saveBtn').addEventListener('click', () => save(true));
document.getElementById('clearLog').addEventListener('click', () => { state.log = []; save(); render(); });
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('¿Seguro que quieres borrar la partida y empezar de cero?')) {
    state = initialState();
    save();
    render();
    toast('Nueva partida creada');
  }
});

render();
