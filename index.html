document.getElementById("optimizeBtn").onclick=function(){

let stopW=Number(document.getElementById("stopWeight").value)
let revW=Number(document.getElementById("revWeight").value)
let distW=Number(document.getElementById("distWeight").value)

let reps=[...new Set(accounts.map(a=>a.newRep))]

let centers={}

reps.forEach(r=>{

let pts=accounts.filter(a=>a.newRep===r)

let lat=pts.reduce((s,a)=>s+a.lat,0)/pts.length
let lng=pts.reduce((s,a)=>s+a.lng,0)/pts.length

centers[r]={lat,lng}

})

accounts.forEach(a=>{

if(a.protected)return

let best=a.newRep
let bestScore=Infinity

reps.forEach(rep=>{

let c=centers[rep]

let dist=Math.hypot(a.lat-c.lat,a.lng-c.lng)

let score=
dist*distW+
rankWeight[a.rank]*stopW+
a.sales*.0001*revW

if(score<bestScore){
bestScore=score
best=rep
}

})

a.newRep=best

markers[a.id].setStyle({fillColor:getColor(best)})

})

updateRepStats()

}

function updateRepStats(){

let reps={}

accounts.forEach(a=>{

if(!reps[a.newRep]){
reps[a.newRep]={accounts:0,revenue:0,stops:0,A:0,B:0,C:0,D:0}
}

let r=reps[a.newRep]

r.accounts++
r.revenue+=a.sales
r.stops+=rankWeight[a.rank]

r[a.rank]++

})

let html=`<table>
<tr>
<th>Rep</th>
<th>Accounts</th>
<th>Revenue</th>
<th>Stops</th>
<th>A</th>
<th>B</th>
<th>C</th>
<th>D</th>
</tr>`

Object.keys(reps).forEach(rep=>{

let r=reps[rep]

html+=`
<tr>
<td><span class="colorBox" style="background:${getColor(rep)}"></span>${rep}</td>
<td>${r.accounts}</td>
<td>$${Math.round(r.revenue)}</td>
<td>${r.stops.toFixed(1)}</td>
<td>${r.A}</td>
<td>${r.B}</td>
<td>${r.C}</td>
<td>${r.D}</td>
</tr>
`

})

html+="</table>"

document.getElementById("repStats").innerHTML=html

}
