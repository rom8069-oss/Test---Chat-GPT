function getAllReps(){let reps={}; accounts.forEach(a=>{reps[a.newRep]=true}); return Object.keys(reps);}

function optimizeTerritories(){
  let stopWeight=parseFloat(document.getElementById("stopWeight").value);
  let revWeight=parseFloat(document.getElementById("revWeight").value);
  let distWeight=parseFloat(document.getElementById("distWeight").value);
  let disruption=parseFloat(document.getElementById("disruption").value);

  const reps=getAllReps(); let centers={};

  reps.forEach(r=>{
    let pts=accounts.filter(a=>a.newRep===r);
    if(pts.length===0) return;
    let avgLat=pts.reduce((s,a)=>s+a.lat,0)/pts.length;
    let avgLng=pts.reduce((s,a)=>s+a.lng,0)/pts.length;
    centers[r]={lat:avgLat,lng:avgLng};
  });

  accounts.forEach(a=>{
    if(a.protected) return;
    let bestRep=a.newRep, bestScore=Infinity;
    reps.forEach(rep=>{
      let center=centers[rep]; if(!center) return;
      let dist=Math.hypot(a.lat-center.lat,a.lng-center.lng);
      let stopScore=rankWeights[a.rank]||0;
      let revenueScore=a.sales||0;
      let disruptionPenalty=(rep!==a.currentRep)?disruption:0;
      let score=(dist*distWeight)+(stopScore*stopWeight)+(revenueScore*revWeight)+disruptionPenalty;
      if(score<bestScore){bestScore=score; bestRep=rep;}
    });
    a.newRep=bestRep;
    markersById[a.id].setStyle({fillColor:getRepColor(bestRep)});
  });

  updateRepStats();
  drawTerritories();
}

document.getElementById("optimizeBtn").onclick=optimizeTerritories;
