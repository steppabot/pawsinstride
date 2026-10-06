/* Android-only GPS adapter. Does nothing on the website, so the same file can live in both places. */
(() => {
 if (!window.Capacitor?.isNativePlatform()) return;
 const recorder=window.Capacitor.registerPlugin('WalkRecorder');
 let draining=null, recovering=false, starting=false;
 function warn(e) {
  console.error('Native GPS',e);
  let b=document.getElementById('native-walk-warning');
  if(!b) {b=document.createElement('div');b.id='native-walk-warning';b.setAttribute('role','alert');b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999999;background:#8b2518;color:white;padding:12px;font:14px sans-serif';document.body.appendChild(b);}
  b.textContent=`Walk GPS: ${e.message||e}. Open your active walk.`;
 }
 async function drain(t) {
  if(draining) {await draining;return drain(t);}
  draining=(async()=>{
   if(t.flushPromise) await t.flushPromise;
   let b;
   do {
    b=await recorder.snapshot();const s=b.state;
    if(Number(s.walkId)!==t.walkId||s.userId!==currentUser?.id) throw Error('Recorder does not match the signed-in walk');
    const m=new Map(t.pendingQueue.map(p=>[p.sequence_number,p]));
    for(const p of b.points)m.set(p.sequence_number,p);
    const q=[...m.values()].sort((a,b)=>a.sequence_number-b.sequence_number);
    localStorage.setItem(getWalkGpsQueueStorageKey(t.walkId),JSON.stringify(q));
    t.pendingQueue=q;t.distanceMeters=s.distanceMeters;t.pointCount=s.pointCount;
    t.nextSequence=s.nextSequence;t.lastAcceptedPoint=s.lastAcceptedPoint||null;t.permissionErrorShown=Boolean(s.error);
    updateLocalWalkTotals(t.walkId,t.distanceMeters,t.pointCount);
    if(b.points.length)await recorder.acknowledge({walkId:t.walkId,sequence:b.points.at(-1).sequence_number});
    if(s.error)warn(Error(s.error));else document.getElementById('native-walk-warning')?.remove();
   }while(b.points.length===200);
   updateWalkLiveUi();
  })();
  try{await draining;}finally{draining=null;}
  if(!t.localOnly)await flushWalkGpsQueue(t);
 }
 window.PawsNative={
  async prepare(){
   if(!navigator.onLine)throw Error('Connect to start a walk. Active walks keep recording offline.');
   await recorder.prepare();
   const {state}=await recorder.snapshot();
   if(state.active&&state.userId!==currentUser?.id)throw Error('Finish the previous account’s walk first.');
  },
  async start(t,walk){
   if(walk.local_only||Number(walk.id)<=0)throw Error('Reconnect and sync this walk before starting native GPS.');
   starting=true;
   try{
    await recorder.start({walkId:t.walkId,visitId:t.visitId||0,userId:currentUser.id,startedAt:t.startedAt,
     nextSequence:t.nextSequence,distanceMeters:t.distanceMeters,pointCount:t.pointCount,lastAcceptedPoint:t.lastAcceptedPoint,walk});
    t.watchId='native';t.native=true;await drain(t);
   }finally{starting=false;}
  },
  async stop(t){await recorder.pause({walkId:t.walkId});await drain(t);},
  async beforeFinish(walk){
   if(!walk)return;
   if(!activeWalkGpsTracker||Number(activeWalkGpsTracker.walkId)!==Number(walk.id)){
    const {state}=await recorder.snapshot();
    if(Number(state.walkId)===Number(walk.id)){
     if(state.active)await startWalkGpsTracking(walk);
     else activeWalkGpsTracker={walkId:Number(walk.id),visitId:Number(walk.visit_id),startedAt:Date.parse(walk.started_at),
      watchId:'native',native:true,pendingQueue:loadPendingWalkGpsQueue(walk.id),flushPromise:null,localOnly:false,
      distanceMeters:state.distanceMeters,pointCount:state.pointCount};
    }
   }
   const t=activeWalkGpsTracker;if(t?.native&&Number(t.walkId)===Number(walk.id))await this.stop(t);
  },
  async canLogout(){
   const {state,points}=await recorder.snapshot();
   if(state.active||points.length||(state.walkId&&loadPendingWalkGpsQueue(state.walkId).length))throw Error('Finish and sync the walk before logging out.');
  }
 };
 async function tick(){
  if(document.hidden||starting||recovering||typeof currentUser==='undefined'||!currentUser||!['admin','employee'].includes(String(currentProfile?.role||'').toLowerCase()))return;
  recovering=true;
  try{
   if(activeWalkGpsTracker?.native)await drain(activeWalkGpsTracker);
   else {
    const {state,points}=await recorder.snapshot();
    if(!state.walkId||(!state.active&&!points.length)||state.userId!==currentUser.id)return;
    const walk=allVisitWalks.find(w=>Number(w.id)===Number(state.walkId))||state.walk;
    if(!walk)return;
    if(walk.status!=='in_progress'){
     if(state.active)await recorder.pause({walkId:state.walkId});
     warn(Error('Walk ended elsewhere; saved GPS needs review'));return;
    }
    if(state.active){await startWalkGpsTracking(walk);startWalkUiTimer();renderAdminDayServices();}
    else if(points.length)warn(Error('Stopped walk has saved points; finish syncing that walk'));
   }
  }catch(e){warn(e);}finally{recovering=false;}
 }
 setInterval(tick,3000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick();});
})();
