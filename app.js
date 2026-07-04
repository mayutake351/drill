let toastTimer;
function showToast(text){
  const t=document.getElementById('toast');
  t.textContent=text;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.add('hidden'),1400);
}
function openFood(){
  document.getElementById('foodModal').classList.remove('hidden');
}
function closeFood(){
  document.getElementById('foodModal').classList.add('hidden');
}
function feed(name,cost){
  closeFood();
  if(name==='たんじょうびケーキ'){
    showToast('🎂 かわいさアップ！');
  }else{
    showToast(name+'を食べたよ♪');
  }
}
function petReaction(){
  showToast('なでてくれてうれしい♡');
}
