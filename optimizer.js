document.getElementById("optimizeBtn").onclick=function(){

saveState()

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
