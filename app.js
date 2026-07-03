let points=25, belly=45;
document.querySelectorAll('.pts').forEach(box=>{[0,1,2,3,4,5].forEach(n=>{let b=document.createElement('button');b.textContent=n;b.onclick=()=>{box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');points+=n;update();say(n===5?'すごい！5ポイント！':'がんばったね♡')};box.appendChild(b)})});
function update(){document.getElementById('points').textContent=points;document.getElementById('belly').textContent=belly;document.getElementById('barFill').style.width=(belly/50*100)+'%';document.getElementById('nextText').textContent=belly>=50?'レベルアップできるよ！':'あと'+(50-belly)+'ptであかちゃん！'}
function say(t){document.getElementById('speech').textContent=t}
function heart(){let h=document.getElementById('heart');h.classList.remove('hidden');void h.offsetWidth;setTimeout(()=>h.classList.add('hidden'),950)}
function pet(){say('なでてくれてうれしい♡');heart()}
function feed(){if(points<5){say('ポイントが足りないよ');return}points-=5;belly=Math.min(50,belly+5);say('もぐもぐ♪ おなかいっぱい！');heart();update()}
update();