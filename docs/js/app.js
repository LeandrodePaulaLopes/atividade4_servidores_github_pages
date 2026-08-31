const DATA_URL="data/benchmark.csv";
let data=[],filtered=[];

const $=id=>document.getElementById(id);

function csv(text){
  const lines=text.trim().split(/\\r?\\n/);
  const headers=lines[0].split(",");
  return lines.slice(1).map(line=>{
    const v=line.split(","),r={};
    headers.forEach((h,i)=>r[h]=v[i]);
    ["requisicoes","workers","repeticao"].forEach(k=>r[k]=Number(r[k]));
    ["tempo_total_s","tempo_medio_ms","throughput_req_s","cpu_percent","memoria_mb"].forEach(k=>r[k]=Number(r[k]));
    return r;
  });
}
function avg(rows,key){return rows.reduce((s,r)=>s+r[key],0)/(rows.length||1)}
function grouped(rows){
  const m=new Map();
  rows.forEach(r=>{const k=r.modelo+"|"+r.requisicoes;if(!m.has(k))m.set(k,[]);m.get(k).push(r)});
  return [...m.values()].map(g=>({...g[0],
    tempo_total_s:avg(g,"tempo_total_s"),tempo_medio_ms:avg(g,"tempo_medio_ms"),
    throughput_req_s:avg(g,"throughput_req_s"),cpu_percent:avg(g,"cpu_percent"),memoria_mb:avg(g,"memoria_mb")
  }));
}
function filters(){
  const ns=[...new Set(data.map(r=>r.requisicoes))].sort((a,b)=>a-b);
  const rs=[...new Set(data.map(r=>r.repeticao))].sort((a,b)=>a-b);
  $("requestFilter").innerHTML='<option value="all">Todas</option>'+ns.map(n=>`<option value="${n}">${n}</option>`).join("");
  $("repFilter").innerHTML='<option value="avg">Média</option>'+rs.map(n=>`<option value="${n}">Repetição ${n}</option>`).join("");
}
function apply(){
  const n=$("requestFilter").value,r=$("repFilter").value;
  filtered=data.filter(x=>(n==="all"||x.requisicoes===Number(n))&&(r==="avg"||x.repeticao===Number(r)));
  render();
}
function render(){
  const rows=filtered.length?filtered:data;
  const best=[...rows].sort((a,b)=>a.tempo_total_s-b.tempo_total_s)[0];
  const th=[...rows].sort((a,b)=>b.throughput_req_s-a.throughput_req_s)[0];
  $("bestTime").textContent=best?best.tempo_total_s.toFixed(2)+" s":"—";
  $("bestTimeLabel").textContent=best?best.modelo:"—";
  $("bestThroughput").textContent=th?th.throughput_req_s.toFixed(1)+" req/s":"—";
  $("bestThroughputLabel").textContent=th?th.modelo:"—";
  $("totalRequests").textContent=rows.length?Math.max(...rows.map(x=>x.requisicoes)):"—";
  const mw=rows.find(x=>x.modelo==="Multi-Thread");$("workerCount").textContent=mw?mw.workers:"—";

  const tableRows=$("repFilter").value==="avg"?grouped(rows):rows;
  $("body").innerHTML=tableRows.sort((a,b)=>a.requisicoes-b.requisicoes||a.modelo.localeCompare(b.modelo)).map(r=>`
  <tr><td>${r.modelo}</td><td>${r.requisicoes}</td><td>${r.tempo_total_s.toFixed(3)} s</td>
  <td>${r.tempo_medio_ms.toFixed(2)} ms</td><td>${r.throughput_req_s.toFixed(2)} req/s</td>
  <td>${r.cpu_percent.toFixed(1)}%</td><td>${r.memoria_mb.toFixed(1)} MB</td></tr>`).join("");
  drawAll();
}
function chartData(metric){
  const g=grouped(filtered.length?filtered:data),ns=[...new Set(g.map(r=>r.requisicoes))].sort((a,b)=>a-b);
  return {labels:ns,single:ns.map(n=>g.find(r=>r.modelo==="Single-Thread"&&r.requisicoes===n)?.[metric]??null),multi:ns.map(n=>g.find(r=>r.modelo==="Multi-Thread"&&r.requisicoes===n)?.[metric]??null)};
}
function setup(c){const d=devicePixelRatio||1,rect=c.getBoundingClientRect();c.width=rect.width*d;c.height=rect.height*d;const x=c.getContext("2d");x.scale(d,d);return[x,rect.width,rect.height]}
function line(c,d){
  const [x,w,h]=setup(c),p={l:48,r:18,t:25,b:42},vals=d.single.concat(d.multi).filter(v=>v!=null),max=Math.max(...vals,1);
  const X=i=>p.l+i*(w-p.l-p.r)/Math.max(d.labels.length-1,1),Y=v=>h-p.b-(v/max)*(h-p.t-p.b);
  x.clearRect(0,0,w,h);x.font="11px system-ui";x.fillStyle="#777";
  for(let i=0;i<5;i++){let y=p.t+i*(h-p.t-p.b)/4;x.strokeStyle="#ddd";x.beginPath();x.moveTo(p.l,y);x.lineTo(w-p.r,y);x.stroke();x.fillText((max*(1-i/4)).toFixed(max<10?1:0),5,y+4)}
  [["Single-Thread","#222"],["Multi-Thread","#9bbd17"]].forEach(([name,col],j)=>{
    const a=j?d.multi:d.single;x.strokeStyle=col;x.lineWidth=3;x.beginPath();
    a.forEach((v,i)=>{if(v==null)return;i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v))});x.stroke();
    a.forEach((v,i)=>{if(v==null)return;x.fillStyle=col;x.beginPath();x.arc(X(i),Y(v),4,0,7);x.fill()});
  });
  x.fillStyle="#777";d.labels.forEach((n,i)=>x.fillText(n,X(i)-8,h-15));
}
function bars(c,d){
  const [x,w,h]=setup(c),p={l:45,r:15,t:25,b:45},vals=d.single.concat(d.multi).filter(v=>v!=null),max=Math.max(...vals,1),gw=(w-p.l-p.r)/Math.max(d.labels.length,1),bw=Math.min(28,gw/3),Y=v=>h-p.b-(v/max)*(h-p.t-p.b);
  x.clearRect(0,0,w,h);x.font="11px system-ui";x.fillStyle="#777";
  for(let i=0;i<5;i++){let y=p.t+i*(h-p.t-p.b)/4;x.strokeStyle="#ddd";x.beginPath();x.moveTo(p.l,y);x.lineTo(w-p.r,y);x.stroke();x.fillText((max*(1-i/4)).toFixed(max<10?1:0),5,y+4)}
  d.labels.forEach((n,i)=>{const center=p.l+i*gw+gw/2;[d.single[i],d.multi[i]].forEach((v,j)=>{if(v==null)return;x.fillStyle=j?"#9bbd17":"#222";x.fillRect(center+(j-.5)*(bw+4),Y(v),bw,h-p.b-Y(v))});x.fillStyle="#777";x.fillText(n,center-9,h-15)});
}
function drawAll(){line($("timeChart"),chartData("tempo_total_s"));line($("throughputChart"),chartData("throughput_req_s"));bars($("cpuChart"),chartData("cpu_percent"));bars($("memoryChart"),chartData("memoria_mb"))}
async function load(){
  try{const r=await fetch(DATA_URL);if(!r.ok)throw Error("CSV não encontrado");data=csv(await r.text());filters();apply()}
  catch(e){console.error(e);$("body").innerHTML='<tr><td colspan="7">Não foi possível carregar o CSV. Execute o benchmark ou gere dados demonstrativos.</td></tr>'}
}
$("requestFilter").onchange=apply;$("repFilter").onchange=apply;
$("reset").onclick=()=>{$("requestFilter").value="all";$("repFilter").value="avg";apply()};
addEventListener("resize",drawAll);load();
