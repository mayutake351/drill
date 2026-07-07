let points = 25;
const ownedFood = {};
const ownedDress = new Set();
let toastTimer;

function toast(text){
  const t=document.getElementById('toast');
  t.textContent=text;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.add('hidden'),1400);
}

function buy(name,cost,type){
  if(points < cost){
    toast('ポイントが足りないよ');
    return;
  }
  points -= cost;

  if(type === 'food'){
    ownedFood[name] = (ownedFood[name] || 0) + 1;
    toast(name + 'を買ったよ');
  }else{
    if(ownedDress.has(name)){
      points += cost;
      toast('もう持っているよ');
      return;
    }
    ownedDress.add(name);
    toast(name + 'を買ったよ');
  }
  renderOwned();
}

function renderOwned(){
  const foodText = Object.keys(ownedFood).map(k => k + '×' + ownedFood[k]).join('、');
  const dressText = Array.from(ownedDress).join('、');
  let text = '';
  if(foodText) text += 'ごはん：' + foodText;
  if(foodText && dressText) text += ' / ';
  if(dressText) text += 'きせかえ：' + dressText;
  if(!text) text = 'まだ何も買っていません';
  document.getElementById('ownedText').textContent = text;
}
renderOwned();
