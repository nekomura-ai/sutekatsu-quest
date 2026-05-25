const todayKey = new Date().toISOString().slice(0, 10);
const state = {
  xp: Number(localStorage.getItem("sutekatsu-xp") || 0),
  history: JSON.parse(localStorage.getItem("sutekatsu-history") || "[]"),
  completedDays: JSON.parse(localStorage.getItem("sutekatsu-completed-days") || "[]"),
  startDate: localStorage.getItem("sutekatsu-start-date") || todayKey,
};
if (!localStorage.getItem("sutekatsu-start-date")) localStorage.setItem("sutekatsu-start-date", state.startDate);

const sevenDayQuests = [
  { title: "財布の中を1つ軽くする", detail: "レシート、期限切れカード、使っていないメモを1つ手放す。", reward: 20 },
  { title: "3年着ていない服を1つ見つける", detail: "迷ったら写真に残して、未来の自分に聞いてみる。", reward: 40 },
  { title: "写真に残して手放す", detail: "思い出は記録へ。物は余白へ。", reward: 35 },
  { title: "誰かに譲れる物を探す", detail: "あなたの卒業品が、誰かの新装備になるかもしれない。", reward: 45 },
  { title: "防災バッグを1つ確認する", detail: "命を守る片付け。期限切れや不足を1つチェックする。", reward: 50 },
  { title: "思い出BOXを作る", detail: "全部を捨てなくていい。大切なものに席を用意する。", reward: 60 },
  { title: "Before / Afterを記録する", detail: "7日目は小さな王冠の日。変化を見える形に残す。", reward: 100 },
];
const bonusQuests = [
  { title: "引き出しもしくは棚の物を整理", reward: 20 },
  { title: "3年触っていない物を発見", reward: 40 },
  { title: "思い出BOXを1つ作る", reward: 30 },
];
const quotes = [
  "その服、あなたの未来に必要ですかな？",
  "思い出は心の中に。モノは手放してOKですぞ。",
  "執着を手放すと、未来の自分が喜びますぞ。",
  "今日は小さな勝利で十分。余白は冒険の入り口です。",
  "よき決断です。部屋も心も、少し呼吸を取り戻しましたぞ。",
];
const growthStages = [
  { min: 1, title: "余白みならい", weapon: "ほうきの杖", art: "I", story: "最初の一歩を待っています。小さな整理が、未来の装備になります。" },
  { min: 2, title: "整理の見習い騎士", weapon: "鍵の杖", art: "II", story: "迷いの扉を開ける力が芽生えました。選ぶたびに身軽になります。" },
  { min: 3, title: "思い出を守る旅人", weapon: "水晶ロッド", art: "III", story: "大切なものと手放すものを見分ける目が育っています。" },
  { min: 5, title: "余白の賢者", weapon: "余白の剣", art: "IV", story: "部屋だけでなく、時間と気持ちにも余白を作れる冒険者です。" },
];

const $ = (selector) => document.querySelector(selector);
const levelEl = $("#level");
const xpEl = $("#xp");
const nextXpEl = $("#nextXp");
const xpBarEl = $("#xpBar");
const historyEl = $("#history");
const emptyStateEl = $("#emptyState");
const questsEl = $("#quests");
const quoteEl = $("#butlerQuote");
const levelUpEl = $("#levelUp");
const form = $("#itemForm");
const photoInput = $("#photoInput");
const preview = $("#preview");
const photoText = $("#photoText");
const photoDrop = $(".photo-drop");
const dailyQuestEl = $("#dailyQuest");
const dayLabelEl = $("#dayLabel");
const streakEl = $("#streak");
const totalItemsEl = $("#totalItems");
const completeQuestButton = $("#completeQuest");
const copyShareTextButton = $("#copyShareText");
const shareTextEl = $("#shareText");
const heroTitleEl = $("#heroTitle");
const heroStoryEl = $("#heroStory");
const weaponNameEl = $("#weaponName");
const weaponArtEl = $("#weaponArt");
const growthRankEl = $("#growthRank");
const spaceStatEl = $("#spaceStat");
const decisionStatEl = $("#decisionStat");
const memoryStatEl = $("#memoryStat");
let selectedPhoto = "";

function daysBetween(start, end) {
  return Math.max(0, Math.floor((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000));
}
function getQuestIndex() { return Math.min(daysBetween(state.startDate, todayKey), sevenDayQuests.length - 1); }
function getLevel(xp) { return Math.floor(xp / 100) + 1; }
function getNextXp(xp) { return getLevel(xp) * 100; }
function getGrowthStage(level) {
  return growthStages.reduce((current, stage) => (level >= stage.min ? stage : current), growthStages[0]);
}
function getStreak() {
  let streak = 0;
  const completed = new Set(state.completedDays);
  for (let i = 0; i < 30; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (!completed.has(date.toISOString().slice(0, 10))) break;
    streak += 1;
  }
  return streak;
}
function save() {
  localStorage.setItem("sutekatsu-xp", String(state.xp));
  localStorage.setItem("sutekatsu-history", JSON.stringify(state.history));
  localStorage.setItem("sutekatsu-completed-days", JSON.stringify(state.completedDays));
  localStorage.setItem("sutekatsu-start-date", state.startDate);
}
function celebrateLevelUp() {
  levelUpEl.classList.remove("show");
  window.requestAnimationFrame(() => levelUpEl.classList.add("show"));
}
function addXp(amount) {
  const beforeLevel = getLevel(state.xp);
  state.xp += amount;
  if (getLevel(state.xp) > beforeLevel) celebrateLevelUp();
}
function markTodayComplete() {
  if (!state.completedDays.includes(todayKey)) state.completedDays.push(todayKey);
}
function renderStats() {
  const level = getLevel(state.xp);
  const levelBase = (level - 1) * 100;
  const next = getNextXp(state.xp);
  levelEl.textContent = level;
  xpEl.textContent = state.xp;
  nextXpEl.textContent = next;
  xpBarEl.style.width = `${Math.min(((state.xp - levelBase) / (next - levelBase)) * 100, 100)}%`;
  streakEl.textContent = getStreak();
  totalItemsEl.textContent = state.history.length;
}
function renderGrowth() {
  const level = getLevel(state.xp);
  const stage = getGrowthStage(level);
  const itemCount = state.history.length;
  heroTitleEl.textContent = stage.title;
  heroStoryEl.textContent = stage.story;
  weaponNameEl.textContent = stage.weapon;
  weaponArtEl.textContent = stage.art;
  growthRankEl.textContent = `Rank ${growthStages.indexOf(stage) + 1}`;
  spaceStatEl.textContent = Math.max(1, level + itemCount);
  decisionStatEl.textContent = Math.max(1, level + state.completedDays.length);
  memoryStatEl.textContent = Math.max(1, 1 + state.history.filter((item) => item.action === "思い出保存").length);
  document.querySelectorAll(".evolution-track span").forEach((node, index) => {
    node.classList.toggle("is-active", index <= growthStages.indexOf(stage));
  });
}
function renderDailyQuest() {
  const index = getQuestIndex();
  const quest = sevenDayQuests[index];
  const done = state.completedDays.includes(todayKey);
  dayLabelEl.textContent = `Day ${index + 1}`;
  completeQuestButton.textContent = done ? "本日達成済み" : "達成";
  completeQuestButton.disabled = done;
  dailyQuestEl.className = `daily-quest${done ? " is-done" : ""}`;
  dailyQuestEl.innerHTML = `<span class="quest__icon">${done ? "✓" : index + 1}</span><div><strong>${quest.title}</strong><small>${quest.detail}</small></div><b>+${quest.reward}</b>`;
}
function renderBonusQuests() {
  questsEl.innerHTML = bonusQuests.map((quest, index) => {
    const done = state.history.length > index;
    return `<article class="quest"><span class="quest__icon">${done ? "✓" : index + 1}</span><div><strong>${quest.title}</strong><small>${done ? "達成済み" : `報酬 ${quest.reward} EXP`}</small></div><small>${done ? "+済" : "未"}</small></article>`;
  }).join("");
}
function renderHistory() {
  emptyStateEl.hidden = state.history.length > 0;
  historyEl.innerHTML = state.history.map((item) => {
    const image = item.photo ? `<img src="${item.photo}" alt="${item.name}" />` : `<span class="thumb">宝</span>`;
    return `<li>${image}<div><strong>${item.name}</strong><small>${item.action} / ${item.date}</small></div><b>+${item.xp}</b></li>`;
  }).join("");
}
function renderQuote() {
  quoteEl.textContent = quotes[Math.min(state.history.length + state.completedDays.length, quotes.length - 1)];
}
function render() { renderStats(); renderGrowth(); renderDailyQuest(); renderBonusQuests(); renderHistory(); renderQuote(); }

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedPhoto = reader.result;
    preview.src = selectedPhoto;
    preview.style.display = "block";
    photoDrop.classList.add("has-image");
    photoText.textContent = "写真を変更";
  });
  reader.readAsDataURL(file);
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#itemName").value.trim();
  if (!name) return;
  const xp = Number($("#rarity").value);
  addXp(xp);
  markTodayComplete();
  state.history.unshift({ name, xp, action: new FormData(form).get("action"), photo: selectedPhoto, date: new Date().toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) });
  state.history = state.history.slice(0, 20);
  save();
  form.reset();
  selectedPhoto = "";
  preview.removeAttribute("src");
  preview.style.display = "none";
  photoDrop.classList.remove("has-image");
  photoText.textContent = "写真を撮る / 選ぶ";
  render();
});
completeQuestButton.addEventListener("click", () => {
  if (state.completedDays.includes(todayKey)) return;
  const quest = sevenDayQuests[getQuestIndex()];
  addXp(quest.reward);
  markTodayComplete();
  state.history.unshift({ name: quest.title, xp: quest.reward, action: "クエスト達成", photo: "", date: new Date().toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) });
  save();
  render();
});
$("#clearLog").addEventListener("click", () => {
  state.history = [];
  state.completedDays = [];
  state.xp = 0;
  state.startDate = todayKey;
  save();
  render();
});
copyShareTextButton.addEventListener("click", async () => {
  shareTextEl.select();
  try { await navigator.clipboard.writeText(shareTextEl.value); } catch { document.execCommand("copy"); }
  copyShareTextButton.textContent = "コピー済み";
  window.setTimeout(() => { copyShareTextButton.textContent = "文面をコピー"; }, 1800);
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
render();
