let map
let accounts=[]
let markers={}
let heatLayer=null
let darkMode=true

let selected=[]
let lassoActive=false
let lassoPoints=[]
let lassoLayer=null

const rankWeight={A:1,B:.5,C:.25,D:.083}

const colors=[
"#1f77b4","#ff7f0e","#2ca02c","#d62728",
"#9467bd","#8c564b","#e377c2","#7f7f7f",
"#bcbd22","#17becf","#f781bf","#999999"
]

function getColor(rep){
return colors[Math.abs(hash(rep))%colors.length]
}

function hash(str){
let h=0
for(let i=0;i<str.length;i++){
h=((h<<5)-h)+str.charCodeAt(i)
}
return h
}

map=L.map('map',{preferCanvas:true}).setView([41.85,-87.7],10)

let darkTiles=L.tileLayer(
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
).addTo(map)

let lightTiles=L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
)

document.getElementById("mapStyleToggle").onclick=function(){

if(darkMode){
map.removeLayer(darkTiles)
lightTiles.addTo(map)
}else{
map.removeLayer(lightTiles)
darkTiles.addTo(map)
}

darkMode=!darkMode

}

document.getElementById("fileInput").addEventListener("change",function(e){

let reader=new FileReader()

reader.onload=function(evt){

let data=new Uint8Array(evt.target.result)
let wb=XLSX.read(data,{type:'array'})
let sheet=wb.Sheets[wb.SheetNames[0]]

let rows=XLSX.utils.sheet_to_json(sheet)

loadAccounts(rows)

}

reader.readAsArrayBuffer(e.target.files[0])

})

function loadAccounts(rows){

accounts=[]
markers={}

rows.forEach((r,i)=>{

let acct={
id:i,
company:r["Company"],
lat:Number(r["Latitude"]),
lng:Number(r["Longitude"]),
rank:r["Rank"],
sales:Number(r["$ Vol Sept - Feb"])||0,
currentRep:r["Current Rep"],
newRep:r["New Rep"]||r["Current Rep"],
protected:r["Protected Account"]==="TRUE"
}

accounts.push(acct)

createMarker(acct)

})

buildRepDropdown()

updateRepStats()

}

function createMarker(a){

let m=L.circleMarker(
[a.lat,a.lng],
{radius:3,fillColor:getColor(a.newRep),fillOpacity:.9,stroke:false}
).addTo(map)

m.bindTooltip(
`${a.company}<br>
Sales: $${a.sales}<br>
Current: ${a.currentRep}<br>
New: ${a.newRep}`
)

m.on("click",()=>showAccount(a))

markers[a.id]=m

}

function showAccount(a){

document.getElementById("accountDetail").innerHTML=
`${a.company}<br>
Sales: $${a.sales}<br>
Rank: ${a.rank}<br>
Current Rep: ${a.currentRep}<br>
New Rep: ${a.newRep}`

}

function buildRepDropdown(){

let reps=[...new Set(accounts.map(a=>a.newRep))]

let sel=document.getElementById("repSelect")

sel.innerHTML=""

reps.forEach(r=>{
let opt=document.createElement("option")
opt.value=r
opt.text=r
sel.appendChild(opt)
})

}

document.getElementById("assignBtn").onclick=function(){

let rep=document.getElementById("repSelect").value

selected.forEach(a=>{
a.newRep=rep
markers[a.id].setStyle({fillColor:getColor(rep)})
})

updateRepStats()

}

document.getElementById("heatToggle").onclick=function(){

if(heatLayer){
map.removeLayer(heatLayer)
heatLayer=null
return
}

let pts=accounts.map(a=>[a.lat,a.lng,a.sales])

heatLayer=L.heatLayer(pts,{radius:25}).addTo(map)

}

document.getElementById("lassoBtn").onclick=function(){

lassoActive=true
lassoPoints=[]
selected=[]

if(lassoLayer)map.removeLayer(lassoLayer)

}

map.on("click",function(e){

if(!lassoActive)return

lassoPoints.push([e.latlng.lng,e.latlng.lat])

if(lassoLayer)map.removeLayer(lassoLayer)

lassoLayer=L.polygon(
lassoPoints.map(p=>[p[1],p[0]])
).addTo(map)

})

map.on("dblclick",function(){

if(!lassoActive)return

lassoActive=false

let poly=turf.polygon([[...lassoPoints,lassoPoints[0]]])

accounts.forEach(a=>{

let pt=turf.point([a.lng,a.lat])

if(turf.booleanPointInPolygon(pt,poly)){

selected.push(a)

markers[a.id].setStyle({color:"white",weight:2})

}

})

})
