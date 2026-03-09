let map
let accounts=[]
let markers={}
let originalAssignments={}
let heatLayer=null
let darkMode=true
let selected=[]

const rankWeights={A:1,B:.5,C:.25,D:.083}

const repColors=[
"#1f77b4","#ff7f0e","#2ca02c","#d62728",
"#9467bd","#8c564b","#e377c2","#7f7f7f",
"#bcbd22","#17becf","#f781bf","#999999"
]

function initMap(){

map=L.map('map',{preferCanvas:true}).setView([41.85,-87.7],10)

window.darkTiles=L.tileLayer(
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
).addTo(map)

window.lightTiles=L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
)

}

initMap()

function getRepColor(rep){
let index=Math.abs(hashCode(rep))%repColors.length
return repColors[index]
}

function hashCode(str){
let h=0
for(let i=0;i<str.length;i++){
h=((h<<5)-h)+str.charCodeAt(i)
}
return h
}

document.getElementById("fileInput").addEventListener("change",e=>{

const reader=new FileReader()

reader.onload=function(evt){

const data=new Uint8Array(evt.target.result)
const workbook=XLSX.read(data,{type:'array'})
const sheet=workbook.Sheets[workbook.SheetNames[0]]

const rows=XLSX.utils.sheet_to_json(sheet)

loadAccounts(rows)

}

reader.readAsArrayBuffer(e.target.files[0])

})

function loadAccounts(rows){

accounts=[]
markers={}
originalAssignments={}

rows.forEach((r,i)=>{

let sales=Number(r["Sales"]||r["$ Sales"]||0)

let acct={
id:i,
name:r["Customer Name"]||r["Account"]||"Unknown",
lat:Number(r["Latitude"]),
lng:Number(r["Longitude"]),
sales:sales,
rank:r["Rank"]||"C",
currentRep:r["Current Rep"],
newRep:r["New Rep"]||r["Current Rep"],
protected:r["Protected"]==="TRUE"
}

accounts.push(acct)

originalAssignments[i]=acct.currentRep

createMarker(acct)

})

updateRepStats()

}

function createMarker(a){

let marker=L.circleMarker(
[a.lat,a.lng],
{
radius:3,
fillColor:getRepColor(a.newRep),
fillOpacity:.9,
stroke:false
}).addTo(map)

marker.bindTooltip(
`${a.name}<br>
Sales: $${a.sales}<br>
Current Rep: ${a.currentRep}<br>
New Rep: ${a.newRep}`
)

marker.on("click",()=>showAccount(a))

markers[a.id]=marker

}

function showAccount(a){

document.getElementById("accountDetail").innerHTML=
`<b>${a.name}</b><br>
Sales: $${a.sales}<br>
Rank: ${a.rank}<br>
Current Rep: ${a.currentRep}<br>
New Rep: ${a.newRep}`

}

function updateRepStats(){

let reps={}
let moved=0
let revenue=0
let stops=0

accounts.forEach(a=>{

if(!reps[a.newRep]){
reps[a.newRep]={accounts:0,revenue:0,stops:0}
}

reps[a.newRep].accounts++
reps[a.newRep].revenue+=a.sales
reps[a.newRep].stops+=rankWeights[a.rank]

revenue+=a.sales
stops+=rankWeights[a.rank]

if(a.currentRep!==a.newRep) moved++

})

let html=""

Object.keys(reps).forEach(rep=>{

let r=reps[rep]

html+=`
<div class="repCard" style="border-left-color:${getRepColor(rep)}">
<span class="colorBox" style="background:${getRepColor(rep)}"></span>
<b>${rep}</b><br>
Accounts: ${r.accounts}<br>
Revenue: $${Math.round(r.revenue)}<br>
Stops: ${r.stops.toFixed(1)}
</div>
`

})

document.getElementById("repStats").innerHTML=html

document.getElementById("movedCount").innerText=moved
document.getElementById("totalRevenue").innerText=Math.round(revenue)
document.getElementById("totalStops").innerText=Math.round(stops)

}

document.getElementById("heatToggle").onclick=()=>{

if(!accounts.length)return

if(heatLayer){
map.removeLayer(heatLayer)
heatLayer=null
return
}

let pts=accounts.map(a=>[a.lat,a.lng,a.sales])

heatLayer=L.heatLayer(pts,{radius:25}).addTo(map)

}

document.getElementById("resetBtn").onclick=()=>{

accounts.forEach(a=>{

a.newRep=originalAssignments[a.id]

markers[a.id].setStyle({
fillColor:getRepColor(a.newRep)
})

})

updateRepStats()

}
