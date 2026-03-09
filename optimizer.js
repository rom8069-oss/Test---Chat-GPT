document.getElementById("optimizeBtn").onclick=function(){

let stopWeight=Number(document.getElementById("stopWeight").value)
let revWeight=Number(document.getElementById("revWeight").value)
let distWeight=Number(document.getElementById("distWeight").value)
let disruption=Number(document.getElementById("disruption").value)

let reps=[...new Set(accounts.map(a=>a.newRep))]

let centers={}

reps.forEach(r=>{

let pts=accounts.filter(a=>a.newRep===r)

let lat=pts.reduce((s,a)=>s+a.lat,0)/pts.length
let lng=pts.reduce((s,a)=>s+a.lng,0)/pts.length

centers[r]={lat,lng}

})

accounts.forEach(a=>{

if(a.protected) return

let bestRep=a.newRep
let bestScore=Infinity

reps.forEach(rep=>{

let c=centers[rep]

let dist=Math.hypot(a.lat-c.lat,a.lng-c.lng)

let stopScore=rankWeights[a.rank]
let revenueScore=a.sales

let disruptionPenalty=(rep!==a.currentRep)?disruption:0

let score=
dist*distWeight+
stopScore*stopWeight+
revenueScore*.0001*revWeight+
disruptionPenalty

if(score<bestScore){
bestScore=score
bestRep=rep
}

})

a.newRep=bestRep

markers[a.id].setStyle({
fillColor:getRepColor(bestRep)
})

})

updateRepStats()

}
