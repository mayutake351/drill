const KEY='makopet_pretty_start';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{started:false,egg:'',points:0,belly:0};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function chooseEgg(name){state.started=true;state.egg=name;state.points=0;state.belly=0;save();render()}
function render(){document.getElementById('start').classList.toggle('hidden',state.started);document.getElementById('home').classList.toggle('hidden',!state.started);if(!state.started)return;document.getElementById('msg').textContent=state.egg+'をおうちにつれて帰ったよ！';document.getElementById('points').textContent=state.points;document.getElementById('belly').textContent=state.belly;document.getElementById('fill').style.width=Math.min(100,state.belly/50*100)+'%';document.getElementById('egg').textContent=state.belly>=50?'🐣':'🥚';if(state.belly>=50)document.getElementById('msg').textContent='あかちゃんが生まれたよ！'}
function study(){state.points+=5;save();render()}
function feed(){if(state.points<5){alert('ポイントが足りないよ');return}state.points-=5;state.belly=Math.min(50,state.belly+5);save();render()}
function resetAll(){localStorage.removeItem(KEY);state={started:false,egg:'',points:0,belly:0};render()}
render();