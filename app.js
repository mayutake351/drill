let toastTimer;
function toast(text){
  const t=document.getElementById('toast');
  t.textContent=text;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.add('hidden'),1400);
}
function petTap(){
  const h=document.getElementById('hearts');
  h.classList.remove('hidden');
  void h.offsetWidth;
  setTimeout(()=>h.classList.add('hidden'),900);
  toast('にこっ♪');
}
function openPanel(id){document.getElementById(id).classList.remove('hidden')}
function closePanels(){document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'))}
function feed(name){closePanels();toast(name==='たんじょうびケーキ'?'かわいさUP！':name+'を食べたよ♪')}
function dress(name){closePanels();toast(name+'をつけたよ♪')}
