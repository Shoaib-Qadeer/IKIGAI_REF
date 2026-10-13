// Content + deterministic scoring. Ported unchanged from prototype v0.1.

const VERSION = "0.2.0";
const TYPES = ["R","I","A","S","E","C"];
const TYPE_INFO = {
  R:{name:"Realistic", short:"Build", desc:"building, fixing, and working with tools, machines or the outdoors"},
  I:{name:"Investigative", short:"Think", desc:"analyzing, researching and solving problems with data and science"},
  A:{name:"Artistic", short:"Create", desc:"creating, designing, writing and expressing ideas"},
  S:{name:"Social", short:"Help", desc:"teaching, helping, caring for and supporting people"},
  E:{name:"Enterprising", short:"Persuade", desc:"leading, persuading, selling and starting things"},
  C:{name:"Conventional", short:"Organize", desc:"organizing, keeping records accurate and working with clear systems"}
};
const FIELDS = {
  R:["Civil or mechanical engineering","Electronics and IT infrastructure","Agriculture technology","Renewable energy installation","Construction and site management"],
  I:["Data science and analytics","Research and laboratory science","Medicine and health sciences","Software engineering","Environmental science"],
  A:["UX/UI and graphic design","Film, media and content creation","Architecture","Writing and journalism","Game design"],
  S:["Teaching and education","Counseling and psychology","Nursing and public health","Human resources and training","Social work and NGOs"],
  E:["Entrepreneurship","Sales and business development","Marketing and brand management","Management consulting","Law and policy advocacy"],
  C:["Accounting and auditing","Banking and finance operations","Supply chain and logistics","Database administration","Project coordination"]
};

/* Game A: 36 activity cards, 6 per type, used in order of appearance. */
const A_CARDS = {
  R:["Set up and repair the computer network in an office","Build a working prototype in a workshop","Survey land with GPS equipment outdoors","Keep machines running on a production line","Install solar panels on a rooftop","Assemble and test a delivery drone"],
  I:["Analyze a dataset to find hidden patterns","Run experiments to test why a medicine works","Research the cause of a disease outbreak","Debug a complex algorithm","Study climate data to predict rainfall","Investigate why a bridge design failed"],
  A:["Design the look of a mobile app","Write a short film script","Compose music for a video game","Illustrate a children's book","Design the stage set for a play","Photograph and edit a magazine story"],
  S:["Teach a class of first-year students","Counsel students who are choosing careers","Run a health awareness workshop in a community","Train new employees on their first week","Support patients through their recovery","Mentor young people at a sports club"],
  E:["Pitch a startup idea to investors","Negotiate a better price with a supplier","Lead a sales team to its monthly target","Run a campaign to win a student union election","Manage the business side of a restaurant","Persuade companies to sponsor an event"],
  C:["Keep a company's accounts accurate","Organize a database of customer records","Check contracts for errors before signing","Plan schedules and logistics for shipments","Audit expenses against company rules","Maintain stock records for a warehouse"]
};
const A_ICONS = { // one picture per card; every card has a different one, so pictures don't give away the type
  R:["network","hammer","compass","factory","sun","plane"],
  I:["chart-scatter","flask-conical","microscope","bug","cloud-rain","construction"],
  A:["smartphone","clapperboard","music","palette","drama","camera"],
  S:["graduation-cap","signpost","heart-pulse","users","stethoscope","trophy"],
  E:["rocket","handshake","target","vote","utensils","megaphone"],
  C:["calculator","database","file-check","truck","receipt","package"]
};
const A_TRIADS = ["IAC","RSE","ISC","IAS","REC","AEC","RAS","ASE","IEC","RAC","RIS","RIE"];
function buildRoundsA(){
  const used = {R:0,I:0,A:0,S:0,E:0,C:0};
  return A_TRIADS.map((tri, r) => {
    let cards = tri.split("").map(t => { const k = used[t]++; return { id: t + (k+1), type: t, text: A_CARDS[t][k], icon: A_ICONS[t][k] }; });
    const rot = r % 3; cards = cards.slice(rot).concat(cards.slice(0, rot)); // fixed display order
    return { round: r+1, cards };
  });
}
const A_ROUNDS = buildRoundsA();

/* Game B: 10 scenes, 2 per trait; options keyed level 1..4; order = fixed display order of option indexes. */
const TRAITS = ["E","A","C","N","O"];
const TRAIT_INFO = {
  E:{name:"Extraversion", plain:"Social energy"},
  A:{name:"Agreeableness", plain:"Putting others first"},
  C:{name:"Conscientiousness", plain:"Planning and order"},
  N:{name:"Emotional reactivity", plain:"How strongly stress hits"},
  O:{name:"Openness", plain:"Pull toward the new"}
};
const B_SCENES = [
 {id:"E1",icon:"party-popper",trait:"E",title:"The graduation party",text:"A friend invites you to a big graduation party. You know almost nobody there. What do you do?",options:["Skip it and have a quiet evening instead.","Go for a short while, stay with my friend, and leave early.","Go and chat with a few new people.","Go and end up talking to most of the room."],order:[2,0,3,1]},
 {id:"C1",icon:"book-open",trait:"C",title:"Thesis countdown",text:"Your final thesis is due in three weeks. What do you do?",options:["Start in the last few days. I work best under pressure.","Start in the second week with a rough idea.","Make a plan and work on it most days.","Build a detailed schedule and finish a few days early."],order:[1,3,0,2]},
 {id:"A1",icon:"handshake",trait:"A",title:"Credit where it is due",text:"A teammate did very little on your group report. They ask to be listed as an equal contributor. What do you do?",options:["Say no and tell the instructor what happened.","Agree only if they do the final edits now.","Agree, but tell them honestly that it bothered me.","Agree without fuss. Keeping the peace matters more."],order:[3,1,2,0]},
 {id:"N1",icon:"mail",trait:"N",title:"A vague email",text:"A company you applied to emails you: “Can we talk about your application?” There are no other details. How do you react?",options:["Assume it is routine and carry on with my day.","Feel curious and check my inbox a bit more often.","Keep thinking about it until I hear back.","Struggle to focus and imagine the worst cases."],order:[2,0,3,1]},
 {id:"O1",icon:"library",trait:"O",title:"One free elective",text:"Your last term has room for one free elective. Which do you pick?",options:["The one closest to my major, so it is familiar.","A practical skills course, like advanced Excel.","Something new to me that is still useful for work.","Something completely different, like philosophy or astronomy, because it interests me."],order:[0,3,1,2]},
 {id:"E2",icon:"users",trait:"E",title:"The silent first meeting",text:"It is the first meeting of a new group project and nobody is speaking. What do you do?",options:["Wait for someone else to start.","Share my idea if someone asks me.","Offer an opinion to get things moving.","Take the lead and run the meeting."],order:[3,0,2,1]},
 {id:"A2",icon:"phone",trait:"A",title:"The night before the exam",text:"A close friend calls, upset about a rejection. You have an exam tomorrow morning. What do you do?",options:["Tell them I am busy and will call after the exam.","Send a supportive message and keep studying.","Talk on the phone for 15 minutes, then study.","Stop studying and go to see them."],order:[1,2,0,3]},
 {id:"C2",icon:"briefcase",trait:"C",title:"Interview tomorrow",text:"You have a job interview tomorrow at 10 am. How do you prepare?",options:["Find my documents in the morning before I leave.","Put my documents roughly together tonight.","Prepare a folder and my outfit the night before.","Make a checklist, print spare copies and plan the route with extra time."],order:[2,0,3,1]},
 {id:"N2",icon:"presentation",trait:"N",title:"The presentation",text:"Your class presentation goes badly. You lose your place and the slides freeze. Afterwards:",options:["I shrug it off and forget it by the evening.","I feel annoyed for an hour or so.","I replay it in my head for the rest of the day.","I feel low about it for several days."],order:[1,3,0,2]},
 {id:"O2",icon:"map",trait:"O",title:"A weekend somewhere new",text:"You have a free weekend in a city you have never visited. How do you spend it?",options:["Visit places like the ones I already enjoy at home.","Follow a top-ten list of tourist sights.","Plan a few sights, then wander.","Make no plan and look for unusual places and food I have never tried."],order:[3,1,2,0]}
];

/* Game C: 8 locks. Unsolvable sets have no 6-letter anagram in a 234k-word dictionary (checked offline). */
const C_LOCKS = [
 {n:1,letters:"TREKAM",answer:"MARKET",solvable:true},
 {n:2,letters:"GIDREB",answer:"BRIDGE",solvable:true},
 {n:3,letters:"TESKIB",answer:null,solvable:false},
 {n:4,letters:"TECKOP",answer:"POCKET",solvable:true},
 {n:5,letters:"PRENIW",answer:null,solvable:false},
 {n:6,letters:"GLUNEJ",answer:"JUNGLE",solvable:true},
 {n:7,letters:"TROLIM",answer:null,solvable:false},
 {n:8,letters:"NIWDOW",answer:"WINDOW",solvable:true}
];
const C_LIMIT = 90, C_SEC_PER_GUESS = 20;
function usesExactLetters(guess, letters){
  return guess.length === letters.length && guess.split("").sort().join("") === letters.split("").sort().join("");
}

/* Self-report */
const ACC_SCALE = ["Very inaccurate","Moderately inaccurate","Neither","Moderately accurate","Very accurate"];
const LIKE_SCALE = ["Strongly dislike","Dislike","Unsure","Like","Strongly like"];
const MINI_IPIP = [ // Donnellan et al. (2006), items and keys from ipip.ori.org/MiniIPIPKey.htm; original item order
 {id:"M1",trait:"E",key:1,text:"Am the life of the party."},
 {id:"M2",trait:"A",key:1,text:"Sympathize with others' feelings."},
 {id:"M3",trait:"C",key:1,text:"Get chores done right away."},
 {id:"M4",trait:"N",key:1,text:"Have frequent mood swings."},
 {id:"M5",trait:"O",key:1,text:"Have a vivid imagination."},
 {id:"M6",trait:"E",key:-1,text:"Don't talk a lot."},
 {id:"M7",trait:"A",key:-1,text:"Am not interested in other people's problems."},
 {id:"M8",trait:"C",key:-1,text:"Often forget to put things back in their proper place."},
 {id:"M9",trait:"N",key:-1,text:"Am relaxed most of the time."},
 {id:"M10",trait:"O",key:-1,text:"Am not interested in abstract ideas."},
 {id:"M11",trait:"E",key:1,text:"Talk to a lot of different people at parties."},
 {id:"M12",trait:"A",key:1,text:"Feel others' emotions."},
 {id:"M13",trait:"C",key:1,text:"Like order."},
 {id:"M14",trait:"N",key:1,text:"Get upset easily."},
 {id:"M15",trait:"O",key:-1,text:"Have difficulty understanding abstract ideas."},
 {id:"M16",trait:"E",key:-1,text:"Keep in the background."},
 {id:"M17",trait:"A",key:-1,text:"Am not really interested in others."},
 {id:"M18",trait:"C",key:-1,text:"Make a mess of things."},
 {id:"M19",trait:"N",key:-1,text:"Seldom feel blue."},
 {id:"M20",trait:"O",key:-1,text:"Do not have a good imagination."}
];
const INTEREST_ITEMS = [ // prototype items, O*NET work-activity style, not validated
 {id:"I1",icon:"wrench",type:"R",text:"Repair or assemble equipment"},
 {id:"I2",icon:"chart-line",type:"I",text:"Analyze data to find out why something happens"},
 {id:"I3",icon:"pen-tool",type:"A",text:"Design a poster, video or app screen"},
 {id:"I4",icon:"graduation-cap",type:"S",text:"Teach or tutor someone"},
 {id:"I5",icon:"trending-up",type:"E",text:"Pitch an idea to win support or funding"},
 {id:"I6",icon:"calculator",type:"C",text:"Keep records and spreadsheets accurate"},
 {id:"I7",icon:"trees",type:"R",text:"Work outdoors on a building or field project"},
 {id:"I8",icon:"flask-conical",type:"I",text:"Run a laboratory experiment"},
 {id:"I9",icon:"feather",type:"A",text:"Write stories, scripts or articles"},
 {id:"I10",icon:"hand-heart",type:"S",text:"Help people work through personal problems"},
 {id:"I11",icon:"target",type:"E",text:"Lead a team toward a sales target"},
 {id:"I12",icon:"clipboard-check",type:"C",text:"Check documents for errors and follow procedures"}
];
const PERSIST_ITEMS = [ // prototype items, not validated
 {id:"P1",key:1,text:"When a problem gets hard, I keep going until I solve it."},
 {id:"P2",key:-1,text:"I give up quickly when something doesn't work at first."}
];

/* Mirror round, part 1: the deck. Mini-IPIP items in original order, persistence items slotted in at fixed places. */
const DECK = [...MINI_IPIP.slice(0,8), PERSIST_ITEMS[0], ...MINI_IPIP.slice(8,16), PERSIST_ITEMS[1], ...MINI_IPIP.slice(16)];
const ZONES = [ // value, standard IPIP anchor, friendly label
 [1,"Very inaccurate","That's not me"],[2,"Moderately inaccurate","Not really"],[3,"Neither","Hard to say"],[4,"Moderately accurate","Kind of me"],[5,"Very accurate","That's me"]];

const SENTENCES = {
  E:{high:"You tend to get energy from being around people and groups.",middle:"You're comfortable in groups and on your own, depending on the day.",low:"You tend to recharge on your own or with a few close people."},
  A:{high:"You tend to put other people's feelings first and avoid conflict.",middle:"You balance caring for others with standing up for yourself.",low:"You tend to be direct, and put fairness or the task ahead of keeping the peace."},
  C:{high:"You tend to plan ahead and finish before deadlines.",middle:"You plan for what matters most and stay flexible on the rest.",low:"You tend to work in bursts and prefer flexibility over detailed plans."},
  N:{high:"Setbacks and uncertainty tend to stay with you for a while.",middle:"Stress affects you at times, and you usually recover within a day.",low:"You tend to stay calm when things are uncertain or go wrong."},
  O:{high:"You're drawn to new ideas, unfamiliar places and subjects outside your field.",middle:"You like some novelty, mixed with what you already know works.",low:"You prefer the familiar and practical over the new and abstract."},
  P:{high:"You keep working on hard problems long after many people would stop.",middle:"You give hard problems a fair try, then move on.",low:"You tend to move on quickly when a problem doesn't give way."}
};
const REFS = {
  miniipip:{label:"Donnellan et al. (2006), Mini-IPIP",url:"https://ipip.ori.org/MiniIPIPKey.htm"},
  onet:{label:"Rounds et al. (2010), O*NET Interest Profiler Short Form",url:"https://www.onetcenter.org/reports/IPSF_Psychometric.html"},
  nye:{label:"Nye et al. (2017), interest congruence and performance",url:"https://experts.illinois.edu/en/publications/interest-congruence-and-performance-revisiting-recent-meta-analyt/"},
  ventura:{label:"Ventura, Shute & Zhao (2013), time on unsolved problems as persistence",url:"https://learntechlib.org/p/132187"},
  palaoag:{label:"Palaoag et al. (2015), time can mean being stuck",url:"https://library.apsce.net/index.php/ICCE/article/view/1004"},
  dang:{label:"Dang, King & Inzlicht (2020), why game and self-report differ",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC7977810"}
};

/* ---------- scoring (pure functions) ---------- */
const round0 = x => Math.round(x);
const r2 = x => Math.round(x*100)/100;
function band(score){ return score <= 33 ? "low" : score <= 66 ? "middle" : "high"; }
const BAND_LABEL = {low:"lower", middle:"middle", high:"higher"};
function gapLabel(gap){ return gap <= 20 ? "consistent" : gap <= 35 ? "mixed" : "conflicting"; }
function overlapLabel(n){ return n >= 2 ? "consistent" : n === 1 ? "mixed" : "conflicting"; }

function hollandCode(scores, mostCounts){
  const order = TYPES.slice().sort((a,b) => (scores[b]-scores[a]) || ((mostCounts?mostCounts[b]:0)-(mostCounts?mostCounts[a]:0)) || (TYPES.indexOf(a)-TYPES.indexOf(b)));
  return order.slice(0,3).join("");
}
function scoreGameA(picks){ // picks: [{round, most:type, least:type}]
  const most={}, least={}, net={}, score={}, calc={};
  TYPES.forEach(t => { most[t]=0; least[t]=0; });
  picks.forEach(p => { most[p.most]++; least[p.least]++; });
  TYPES.forEach(t => { net[t]=most[t]-least[t]; score[t]=round0((net[t]+6)/12*100);
    calc[t]=`net = ${most[t]} most − ${least[t]} least = ${net[t]}\nscore = (${net[t]} + 6) ÷ 12 × 100 = ${score[t]}`; });
  return { most, least, net, score, calc, code: hollandCode(score, most) };
}
function scoreInterestSR(answers){ // answers: {I1: 1..5}
  const score={}, calc={}, vals={};
  TYPES.forEach(t => {
    const items = INTEREST_ITEMS.filter(i => i.type===t);
    vals[t] = items.map(i => answers[i.id]);
    const mean = vals[t].reduce((a,b)=>a+b,0)/items.length;
    score[t] = round0((mean-1)/4*100);
    calc[t] = `answers ${vals[t].join(", ")} → mean ${r2(mean)}\nscore = (${r2(mean)} − 1) ÷ 4 × 100 = ${score[t]}`;
  });
  return { score, calc, vals, code: hollandCode(score, null) };
}
function scoreGameB(levels){ // levels: {E1: 1..4, ...}
  const out={};
  TRAITS.forEach(tr => {
    const sc = B_SCENES.filter(s => s.trait===tr);
    const lv = sc.map(s => levels[s.id]);
    const mean = lv.reduce((a,b)=>a+b,0)/lv.length;
    const score = round0((mean-1)/3*100);
    out[tr] = { levels: lv, scenes: sc.map(s=>s.id), mean, score,
      calc: `levels ${lv.join(", ")} → mean ${r2(mean)}\nscore = (${r2(mean)} − 1) ÷ 3 × 100 = ${score}` };
  });
  return out;
}
function scoreLikert(items, answers){ // returns score, calc
  const raw = items.map(i => answers[i.id]);
  const keyed = items.map((i,k) => i.key===1 ? raw[k] : 6-raw[k]);
  const mean = keyed.reduce((a,b)=>a+b,0)/keyed.length;
  const score = round0((mean-1)/4*100);
  const parts = items.map((i,k) => i.key===1 ? `${raw[k]}` : `${raw[k]}→${keyed[k]}`);
  return { raw, keyed, mean, score, calc:`answers (− items reversed 6 − x): ${parts.join(", ")} → mean ${r2(mean)}\nscore = (${r2(mean)} − 1) ÷ 4 × 100 = ${score}` };
}
function scoreMiniIPIP(answers){
  const out={};
  TRAITS.forEach(tr => { out[tr] = scoreLikert(MINI_IPIP.filter(i=>i.trait===tr), answers); });
  return out;
}
function scoreGameC(results){ // results: [{n, seconds, guesses, outcome}]
  const rows = results.map(r => {
    const lock = C_LOCKS.find(l => l.n===r.n);
    const active = lock.solvable ? null : Math.min(r.seconds, r.guesses*C_SEC_PER_GUESS);
    const flag = !lock.solvable && r.seconds > 30 && active < r.seconds/2;
    return { ...r, solvable: lock.solvable, active, flag };
  });
  const uns = rows.filter(r => !r.solvable);
  const meanActive = uns.reduce((a,r)=>a+r.active,0)/uns.length;
  const meanRaw = uns.reduce((a,r)=>a+r.seconds,0)/uns.length;
  const score = round0(Math.min(1, meanActive/C_LIMIT)*100);
  const solved = rows.filter(r => r.solvable && r.outcome==="solved").length;
  const lines = uns.map(r => `lock ${r.n}: min(${r1(r.seconds)} s, ${r.guesses} guesses × ${C_SEC_PER_GUESS} s) = ${r1(r.active)} s${r.flag?"  [flag: waiting, not trying]":""}`);
  return { rows, meanActive, meanRaw, score, solved, flags: uns.filter(r=>r.flag).length,
    calc: lines.join("\n") + `\nmean active = ${r1(meanActive)} s\nscore = ${r1(meanActive)} ÷ ${C_LIMIT} × 100 = ${score}` };
}
function r1(x){ return Math.round(x*10)/10; }

function compareScores(game, self){
  const gap = Math.abs(game-self), avg = round0((game+self)/2);
  return { gap, avg, label: gapLabel(gap), band: band(avg) };
}

function buildProfile(data){ // data: {A:{picks}, B:{levels}, C:{results}, SR:{answers}}
  const gA = scoreGameA(data.A.picks);
  const sI = scoreInterestSR(data.SR.answers);
  const shared = gA.code.split("").filter(l => sI.code.includes(l));
  const combined = {}; TYPES.forEach(t => combined[t] = round0((gA.score[t]+sI.score[t])/2));
  const combinedCode = hollandCode(combined, gA.most);
  const interest = { game:gA, self:sI, shared, label: overlapLabel(shared.length), combined, combinedCode,
    rule:`game code ${gA.code}, self-report code ${sI.code}; shared letters: ${shared.length ? shared.join(", ") : "none"} (${shared.length}) → ${overlapLabel(shared.length)}\ncombined score per type = (game + self-report) ÷ 2; combined code ${combinedCode}` };

  const gB = scoreGameB(data.B.levels);
  const sM = scoreMiniIPIP(data.SR.answers);
  const traits = {};
  TRAITS.forEach(tr => {
    const c = compareScores(gB[tr].score, sM[tr].score);
    traits[tr] = { game:gB[tr], self:sM[tr], ...c, sentence: SENTENCES[tr][c.band],
      rule:`gap = |${gB[tr].score} − ${sM[tr].score}| = ${c.gap} → ${c.label} (≤20 consistent, 21–35 mixed, >35 conflicting)\naverage = (${gB[tr].score} + ${sM[tr].score}) ÷ 2 = ${c.avg} → ${BAND_LABEL[c.band]} band → sentence ${tr}-${c.band}` };
  });

  const gC = scoreGameC(data.C.results);
  const sP = scoreLikert(PERSIST_ITEMS, data.SR.answers);
  const pc = compareScores(gC.score, sP.score);
  const persistence = { game:gC, self:sP, ...pc, sentence: SENTENCES.P[pc.band],
    rule:`gap = |${gC.score} − ${sP.score}| = ${pc.gap} → ${pc.label}\naverage = ${pc.avg} → ${BAND_LABEL[pc.band]} band → sentence P-${pc.band}` };

  return { version: VERSION, interest, traits, persistence };
}

export { ACC_SCALE, A_CARDS, A_ICONS, A_ROUNDS, A_TRIADS, BAND_LABEL, B_SCENES, C_LIMIT, C_LOCKS, DECK, FIELDS, INTEREST_ITEMS, LIKE_SCALE, MINI_IPIP, PERSIST_ITEMS, REFS, SENTENCES, TRAITS, TRAIT_INFO, TYPES, TYPE_INFO, VERSION, ZONES, band, buildProfile, buildRoundsA, compareScores, gapLabel, hollandCode, overlapLabel, r1, r2, round0, scoreGameA, scoreGameB, scoreGameC, scoreInterestSR, scoreLikert, scoreMiniIPIP, usesExactLetters };
