let map, markersById={}, accounts=[], selected=[], heatLayer, darkMode=true, history=[], lassoActive=false, lassoPoints=[], lassoLayer, territoryLayer;

const rankWeights={A:1,B:0.5,C:0.25,D:0.083};
const repColors=["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"];

function initMap(){
  map=L.map('map',{preferCanvas:true}).setView([41.85,-87.7],10);
  window.darkTiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
  window.lightTiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
}
initMap();

// Map style toggle
document.getElementById("mapStyleToggle").onclick=()=>{
  if(darkMode){ map.removeLayer(darkTiles); map.addLayer(lightTiles);}
  else{ map.removeLayer(lightTiles); map.addLayer(darkTiles);}
  darkMode=!darkMode;
};

// Excel import
document.getElementById("fileInput").addEventListener("change",handleFile);
function handleFile(e){
  const reader=new FileReader();
  reader.onload=function(evt){
    const data=new Uint8Array(evt.target.result);
    const workbook=XLSX.read(data,{type:'array'});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet);
    loadAccounts(rows);
  };
  reader.readAsArrayBuffer(e.target.files[0]);
}

function loadAccounts(rows){
  accounts=[]; if(territoryLayer){map.removeLayer(territoryLayer);}
  rows.forEach((r,i)=>{
    let newRep=r["New Rep"] || r["Current Rep"];
    let acct={
      id:i,
      name:r["Customer Name"],
      lat:parseFloat(r["Latitude"]),
      lng:parseFloat(r["Longitude"]),
      sales:r["Sales"],
      rank:r["Rank"],
      currentRep:r["Current Rep"],
      newRep:newRep,
      wine:r["Wine"], spirits:r["Spirits"], thc:r["THC"],
      protected:r["Protected"]==="TRUE"
    };
    accounts.push(acct);
    createMarker(acct);
  });
  updateRepStats();
  drawTerritories();
}

function createMarker(acct){
  let marker=L.circleMarker([acct.lat,acct.lng],{radius:3, fillColor:getRepColor(acct.newRep), fillOpacity:0.9, stroke:false}).addTo(map);
  marker.bindTooltip(()=>`${acct.name}<br>Sales: $${acct.sales}<br>Current Rep: ${acct.currentRep}<br>New Rep: ${acct.newRep}`);
  marker.on("click",()=>showAccount(acct));
  markersById[acct.id]=marker;
}

function showAccount(a){
  document.getElementById("accountDetail").innerHTML=`
<b>${a.name}</b><br>
Sales: $${a.sales}<br>Rank: ${a.rank}<br>Protected: ${a.protected}<br><br>
Current Rep: ${a.currentRep}<br>New Rep: ${a.newRep}`;
}

function getRepColor(rep){let index=Math.abs(hashCode(rep))%repColors.length; return repColors[index];}
function hashCode(str){let h=0; for(let i=0;i<str.length;i++) h=((h<<5)-h)+str.charCodeAt(i); return h;}

// Rep stats
function updateRepStats(){
  let reps={}; let movedCount=0; let totalRevenue=0; let totalStops=0;
  accounts.forEach(a=>{
    if(!reps[a.newRep]) reps[a.newRep]={accounts:0,stops:0,revenue:0};
    reps[a.newRep].accounts++; reps[a.newRep].revenue+=a.sales; reps[a.newRep].stops+=rankWeights[a.rank]||0;
    if(a.currentRep!==a.newRep) movedCount++;
    totalRevenue+=a.sales; totalStops+=rankWeights[a.rank]||0;
  });
  let html="";
  Object.keys(reps).forEach(r=>{
    let d=reps[r];
    html+=`<div class="repCard"><b>${r}</b><br>Accounts: ${d.accounts}<br>Weekly Stops: ${d.stops.toFixed(1)}<br>Revenue: $${Math.round(d.revenue)}</div>`;
  });
  document.getElementById("repStats").innerHTML=html;
  document.getElementById("movedCount").innerText=movedCount;
  document.getElementById("totalRevenue").innerText=Math.round(totalRevenue);
  document.getElementById("totalStops").innerText=Math.round(totalStops);
}

// Heatmap toggle
document.getElementById("heatToggle").onclick=()=>{
  if(heatLayer){ map.removeLayer(heatLayer); heatLayer=null; return;}
  let pts=accounts.map(a=>[a.lat,a.lng,a.sales]);
  heatLayer=L.heatLayer(pts,{radius:25}).addTo(map);
};

// Export Excel
document.getElementById("exportBtn").onclick=()=>{
  let rows=accounts.map(a=>({"Customer Name":a.name,"Current Rep":a.currentRep,"New Rep":a.newRep,"Sales":a.sales,"Rank":a.rank}));
  const ws=XLSX.utils.json_to_sheet(rows);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Export");
  XLSX.writeFile(wb,"territory_export.xlsx");
};

// Lasso
document.getElementById("lassoBtn").onclick=()=>{
  lassoActive=!lassoActive; lassoPoints=[]; if(lassoLayer) map.removeLayer(lassoLayer);
};
map.on("click",e=>{
  if(!lassoActive) return;
  lassoPoints.push([e.latlng.lng,e.latlng.lat]);
  if(lassoLayer) map.removeLayer(lassoLayer);
  lassoLayer=L.polygon(lassoPoints.map(p=>[p[1],p[0]])).addTo(map);
});
function finalizeLasso(){
  selected=[]; const poly=turf.polygon([[...lassoPoints,lassoPoints[0]]]);
  accounts.forEach(a=>{
    const pt=turf.point([a.lng,a.lat]);
    if(turf.booleanPointInPolygon(pt,poly)){
      selected.push(a); markersById[a.id].setStyle({color:"white",weight:2});
    }
  });
}

// Territories
function drawTerritories(){
  if(window.territoryLayer) map.removeLayer(window.territoryLayer);
  window.territoryLayer=L.layerGroup().addTo(map);
  let reps=getAllReps();
  reps.forEach(rep=>{
    let pts=accounts.filter(a=>a.newRep===rep).map(a=>turf.point([a.lng,a.lat]));
    if(pts.length<3) return;
    let fc=turf.featureCollection(pts);
    let hull=turf.concave(fc,{maxEdge:5}); if(!hull) return;
    let layer=L.geoJSON(hull,{style:{color:getRepColor(rep),weight:2,fillOpacity:0.1}});
    territoryLayer.addLayer(layer);
  });
}
