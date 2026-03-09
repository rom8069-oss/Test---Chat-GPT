document.getElementById("optimizeBtn").onclick = function () {

saveState()

let stopW = Number(document.getElementById("stopWeight").value)
let revW = Number(document.getElementById("revWeight").value)
let distW = Number(document.getElementById("distWeight").value)

let reps = [...new Set(accounts.map(a => a.newRep))]

let centers = {}

reps.forEach(rep => {

let pts = accounts.filter(a => a.newRep === rep)

let lat = pts.reduce((s,a)=>s+a.lat,0) / pts.length
let lng = pts.reduce((s,a)=>s+a.lng,0) / pts.length

centers[rep] = {lat,lng}

})

accounts.forEach(a => {

if (a.protected) return

let bestRep = a.newRep
let bestScore = Infinity

reps.forEach(rep => {

let c = centers[rep]

let dist = Math.hypot(a.lat - c.lat, a.lng - c.lng)

let score =
dist * distW +
rankWeight[a.rank] * stopW +
a.sales * 0.0001 * revW

if (score < bestScore) {
bestScore = score
bestRep = rep
}

})

a.newRep = bestRep

markers[a.id].setStyle({
fillColor: getColor(bestRep)
})

})

updateRepStats()

}
