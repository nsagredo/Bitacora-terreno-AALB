const PARAMS=[
 {key:'ph',name:'pH',unit:'pH'},
 {key:'temp',name:'Temperatura',unit:'°C'},
 {key:'od',name:'Oxígeno disuelto',unit:'mg/L'},
 {key:'cloro',name:'Cloro libre',unit:'mg/L'},
 {key:'solidos',name:'Sól. sedimentables',unit:'mL/L/h'},
 {key:'turb',name:'Turbiedad',unit:'NTU'},
 {key:'caudal',name:'Caudal',unit:'m³/h'}
];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let samples=[];
try { samples=JSON.parse(localStorage.getItem('bt_samples')||'[]'); if(!Array.isArray(samples)) samples=[]; } catch(e){ samples=[]; }
const uniq=a=>Array.from(new Set(a.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'es'));
function options(el,arr){ if(!el)return; el.innerHTML=arr.map(x=>`<option value="${String(x).replaceAll('"','&quot;')}">${x}</option>`).join(''); }
function filtered(){ return CATALOGO.filter(x=>(!$('#cliente').value||x.cliente===$('#cliente').value)&&(!$('#faena').value||x.faena===$('#faena').value)&&(!$('#tipo').value||x.tipo===$('#tipo').value)); }
function cascade(from){
 if(from==='cliente'||!from){ if(!from) options($('#cliente'),uniq(CATALOGO.map(x=>x.cliente))); options($('#faena'),uniq(CATALOGO.filter(x=>x.cliente===$('#cliente').value).map(x=>x.faena))); }
 if(from==='faena'||from==='cliente'||!from){ let a=CATALOGO.filter(x=>x.cliente===$('#cliente').value&&x.faena===$('#faena').value); options($('#tipo'),uniq(a.map(x=>x.tipo))); }
 let a=filtered(); options($('#planta'),a.map(x=>x.nombre)); showMeta();
}
function selected(){ return CATALOGO.find(x=>x.cliente===$('#cliente').value&&x.faena===$('#faena').value&&x.tipo===$('#tipo').value&&x.nombre===$('#planta').value); }
function showMeta(){let p=selected(); if(!$('#meta'))return; $('#meta').innerHTML=p?`<p><b>${p.ceco}</b> · ${p.norma}</p><p class="muted">${p.equipamiento||'Sin detalle de equipamiento'}</p>${p.nota?`<p class="warn">${p.nota}</p>`:''}`:'';}
function now(){let d=new Date(),z=n=>String(n).padStart(2,'0');$('#fecha').value=`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;$('#hora').value=`${z(d.getHours())}:${z(d.getMinutes())}`;}
function num(s){if(!String(s).trim())return null;let n=Number(String(s).replace(',','.'));return Number.isFinite(n)?n:null;}
function renderData(){ let el=$('#lista'); if(!el)return; el.innerHTML=samples.length?samples.map(s=>`<div class="plant"><button style="float:right" onclick="delSample(${s.id})">Eliminar</button><b>${s.fecha||''} ${s.hora||''} · ${s.cliente||''} / ${s.faena||''} / ${s.planta||''}</b><small>${s.tipo||''} · ${s.punto||''} · ${s.operador||''}</small></div>`).join(''):'<p class="muted">Sin muestreos guardados.</p>'; }
window.delSample=id=>{samples=samples.filter(x=>x.id!==id);localStorage.setItem('bt_samples',JSON.stringify(samples));renderData();};
function renderCatalog(q=''){q=String(q).toLowerCase();let a=CATALOGO.filter(p=>[p.cliente,p.faena,p.nombre,p.tipo,p.ceco].join(' ').toLowerCase().includes(q));$('#catalogo').innerHTML=a.map(p=>`<div class="plant"><b>${p.cliente} · ${p.faena} · ${p.nombre}</b><small>${p.ceco} · ${p.tipo} · ${p.norma}</small><small>${p.equipamiento||''}</small>${p.nota?`<small class="warn">${p.nota}</small>`:''}</div>`).join('');}
function initChart(){options($('#gp'),PARAMS.map(p=>p.name));$('#gpl').innerHTML='<option value="">Todas</option>'+CATALOGO.map(p=>`<option value="${p.id}">${p.cliente} · ${p.faena} · ${p.nombre} (${p.tipo})</option>`).join('');}
function draw(){let pn=$('#gp').value,p=PARAMS.find(x=>x.name===pn)||PARAMS[0],pid=$('#gpl').value,a=samples.filter(s=>(!pid||String(s.plantId)===pid)&&s.readings&&s.readings[p.key]!=null).slice().reverse(),v=a.map(s=>Number(s.readings[p.key]));let c=$('#chart'),x=c.getContext('2d'),W=c.width,H=c.height,pad=55;x.clearRect(0,0,W,H);if(!v.length){$('#kpis').innerHTML='<div class="kpi">Sin datos</div>';return;}let avg=v.reduce((a,b)=>a+b,0)/v.length;$('#kpis').innerHTML=[['Última',v[v.length-1]],['Promedio',avg.toFixed(2)],['Mínimo',Math.min(...v)],['Máximo',Math.max(...v)]].map(z=>`<div class="kpi"><small>${z[0]}</small><b>${z[1]}</b></div>`).join('');let lo=Math.min(...v),hi=Math.max(...v);if(lo===hi){lo--;hi++;}let X=i=>pad+i*(W-2*pad)/Math.max(1,v.length-1),Y=n=>H-pad-(n-lo)*(H-2*pad)/(hi-lo);x.strokeStyle='#36c8fa';x.lineWidth=4;x.beginPath();v.forEach((n,i)=>i?x.lineTo(X(i),Y(n)):x.moveTo(X(i),Y(n)));x.stroke();}
function init(){
 if(typeof CATALOGO==='undefined'||!Array.isArray(CATALOGO)){document.querySelector('main').innerHTML='<div class="card"><h2>Error de catálogo</h2><p>No se pudo cargar catalogo.js.</p></div>';return;}
 $('#lecturas').innerHTML=PARAMS.map(p=>`<div class="reading"><label>${p.name} <small>${p.unit}</small><input inputmode="decimal" data-k="${p.key}"></label></div>`).join('');
 cascade(); now(); renderData(); renderCatalog(); initChart();
 $('#cliente').onchange=()=>cascade('cliente'); $('#faena').onchange=()=>cascade('faena'); $('#tipo').onchange=()=>cascade('tipo'); $('#planta').onchange=showMeta; $('#buscar').oninput=e=>renderCatalog(e.target.value); $('#gp').onchange=draw; $('#gpl').onchange=draw;
 $$('nav button').forEach(b=>b.onclick=()=>{$$('.tab,nav button').forEach(e=>e.classList.remove('on'));b.classList.add('on');$('#'+b.dataset.t).classList.add('on');if(b.dataset.t==='graf')draw();});
 $('#form').onsubmit=e=>{e.preventDefault();let p=selected();if(!p)return;let readings={};$$('#lecturas input').forEach(x=>readings[x.dataset.k]=num(x.value));if(!Object.values(readings).some(v=>v!==null)){ $('#msg').className='warn';$('#msg').textContent='Ingrese al menos una lectura.';return;} samples.unshift({id:Date.now(),plantId:p.id,ceco:p.ceco,cliente:p.cliente,faena:p.faena,planta:p.nombre,tipo:p.tipo,norma:p.norma,operador:$('#operador').value,fecha:$('#fecha').value,hora:$('#hora').value,punto:$('#punto').value,observaciones:$('#obs').value,readings});localStorage.setItem('bt_samples',JSON.stringify(samples));renderData();e.target.reset();now();$('#msg').className='ok';$('#msg').textContent='Muestreo guardado.';};
}
window.addEventListener('DOMContentLoaded',init);
