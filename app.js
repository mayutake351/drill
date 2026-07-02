const TASK_KEY = "makopet_art_tasks_v1";
const STATE_KEY = "makopet_art_state_v1";

const defaultTasks = [
  { id: 1, name: "📗 こくご", point: 0 },
  { id: 2, name: "🔢 さんすう", point: 0 },
  { id: 3, name: "漢字ドリル", point: 0 },
  { id: 4, name: "ABC えいご", point: 0 },
  { id: 5, name: "👕 きがえ", point: 0 },
  { id: 6, name: "🪥 はみがき", point: 0 },
];

function load(key, def){
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}
function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

let tasks = load(TASK_KEY, defaultTasks);
let state = load(STATE_KEY, {
  points: 0,
  friend: 80,
  hunger: 70,
  energy: 90,
  sleepy: 40,
  cat: "🐱"
});

function render(){
  document.getElementById("points").textContent = state.points;
  document.getElementById("points2").textContent = state.points;
  document.getElementById("friend").textContent = state.friend;
  document.getElementById("hunger").textContent = state.hunger;
  document.getElementById("energy").textContent = state.energy;
  document.getElementById("sleepy").textContent = state.sleepy;
  document.getElementById("foodFill").style.width = Math.min(100, state.points * 10) + "%";

  const cat = document.getElementById("cat");
  cat.textContent = state.cat;
  cat.className = "cat";
  if(state.hunger < 35) cat.textContent = "😿";
  else if(state.friend > 90) cat.textContent = "😻";

  const box = document.getElementById("tasks");
  box.innerHTML = "";
  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <div>${task.name}</div>
      <div class="stars">
        ${[0,1,2,3].map(n => `<button class="${task.point===n?'on':''}" onclick="setTaskPoint(${task.id},${n})">${n}</button>`).join("")}
      </div>
    `;
    box.appendChild(div);
  });

  save(TASK_KEY, tasks);
  save(STATE_KEY, state);
}

function setTaskPoint(id, point){
  const task = tasks.find(t => t.id === id);
  if(!task) return;
  const diff = point - task.point;
  task.point = point;

  if(diff > 0){
    state.points += diff;
    state.friend = Math.min(100, state.friend + diff * 2);
    state.energy = Math.min(100, state.energy + diff);
    say("がんばったね！<br>えらいにゃ〜♡");
    animateCat("happy");
  } else {
    say("記録を直したにゃ");
  }
  render();
}

function addTask(){
  const name = prompt("追加する科目ややることは？\n例：読書、ピアノ、お手伝い");
  if(!name) return;
  tasks.push({ id: Date.now(), name: "✨ " + name, point: 0 });
  say("新しいやることを追加したにゃ！");
  render();
}

function feedCat(){
  if(state.points < 10){
    say("10ポイントたまると<br>ごはんが食べられるにゃ");
    animateCat("hungry");
    return;
  }
  state.points -= 10;
  state.hunger = Math.min(100, state.hunger + 20);
  state.friend = Math.min(100, state.friend + 5);
  say("もぐもぐ…<br>おいしいにゃ♡");
  animateCat("eat");
  render();
}

function buyFurniture(){
  if(state.points < 20){
    say("20ポイントで<br>おへやをかわいくできるにゃ");
    return;
  }
  state.points -= 20;
  say("おへやが少し<br>かわいくなったにゃ✨");
  render();
}

function dressCat(){
  if(state.points < 15){
    say("15ポイントで<br>おようふくがもらえるにゃ");
    return;
  }
  state.points -= 15;
  state.friend = Math.min(100, state.friend + 8);
  say("おしゃれしたにゃ🎀");
  animateCat("happy");
  render();
}

function showBook(){
  alert("ずかん\n\n🐱 まこねこ\n😻 なかよしねこ\n😿 おなかすいたねこ\n\nこれから増えるよ！");
}

function gachaEgg(){
  if(state.points < 30){
    say("30ポイントで<br>たまごを見にいけるにゃ");
    return;
  }
  state.points -= 30;
  const cats = ["🐱","😺","😸","😻","🐈","🐈‍⬛"];
  state.cat = cats[Math.floor(Math.random()*cats.length)];
  say("新しい子に会えたにゃ！");
  animateCat("happy");
  render();
}

function resetAll(){
  if(confirm("データをリセットする？")){
    localStorage.removeItem(TASK_KEY);
    localStorage.removeItem(STATE_KEY);
    tasks = JSON.parse(JSON.stringify(defaultTasks));
    state = {points:0,friend:80,hunger:70,energy:90,sleepy:40,cat:"🐱"};
    render();
  }
}

function petCat(){
  state.friend = Math.min(100, state.friend + 1);
  const lines = [
    "なでてくれて<br>うれしいにゃ♡",
    "今日も会えて<br>うれしいにゃ",
    "いっしょに<br>がんばろうにゃ",
    "にゃ〜♪"
  ];
  say(lines[Math.floor(Math.random()*lines.length)]);
  animateCat("happy");
  render();
}

function say(text){
  document.getElementById("bubble").innerHTML = text;
}

function animateCat(name){
  const cat = document.getElementById("cat");
  cat.classList.remove("happy","eat","sleep","hungry");
  void cat.offsetWidth;
  cat.classList.add(name);
  setTimeout(() => cat.classList.remove(name), 1600);
}

setInterval(() => {
  state.hunger = Math.max(0, state.hunger - 1);
  state.sleepy = Math.min(100, state.sleepy + 1);
  if(state.hunger < 35) say("おなかすいたにゃ…");
  render();
}, 60000);

render();
