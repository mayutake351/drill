let points = 25;
const foodInventory = {};
const dressOwned = new Set();
let timer;

function toast(text){
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.add('hidden'), 1300);
}

function buyFood(name, cost){
  if(points < cost){ toast('ポイントが足りないよ'); return; }
  points -= cost;
  foodInventory[name] = (foodInventory[name] || 0) + 1;
  toast(name + 'を買ったよ');
}

function buyDress(name, cost){
  if(dressOwned.has(name)){ toast('もう持っているよ'); return; }
  if(points < cost){ toast('ポイントが足りないよ'); return; }
  points -= cost;
  dressOwned.add(name);
  toast(name + 'を買ったよ');
}
