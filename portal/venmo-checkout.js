/* Hosted HTTPS page only. No account session is established here. */
(async function () {
 'use strict';
 const base='https://xyhndwopvlmnxjkthtkl.supabase.co/functions/v1/';
 const publicKey='sb_publishable_U3OIYatZuBUe8Y6Vq0DS2w_IMacau2j';
 const message=document.getElementById('venmo-message');
 const button=document.getElementById('venmo-button');
 const back=document.getElementById('venmo-return');
 const check=document.getElementById('venmo-check');
 let info, busy=false;
 const fragment=new URLSearchParams(location.hash.slice(1));
 let token=fragment.get('token');
 // Remove credentials before loading any third-party SDK or navigation.
 history.replaceState(null,'',location.pathname);
 if(token&&/^[a-f0-9]{64}$/.test(token))sessionStorage.setItem('paws.venmo.checkout',token);
 else token=sessionStorage.getItem('paws.venmo.checkout');
 async function request(name,body){
  const response=await fetch(base+name,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json',
   ...(info?.anon_key?{Authorization:'Bearer '+info.anon_key}:{}),'x-paws-venmo-token':token||''},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok||!data.success)throw new Error(data.error||'Unable to verify payment.');
  return data;
 }
 function updateBack(){
  back.href='pawsinstride://venmo-return?'+new URLSearchParams({checkout:info.checkout_id,state:info.return_state});
  back.hidden=false;
 }
 function completed(){
  button.hidden=true;check.hidden=true;
  document.getElementById('venmo-heading').textContent='Payment confirmed';
  message.textContent='Your service is booked. Return to the app to view your confirmation.';
  updateBack();
 }
 async function verify(){
  const result=await request('venmo-handoff',{action:'status'});
  if(result.completed){completed();return true;}
  if(result.order_id){
   // Reuses the same order. Existing server handles approved, captured and pending states.
   await request('paypal-capture-order', {
    checkout_id: info.checkout_id,
    orderID: result.order_id
   });
   const after=await request('venmo-handoff',{action:'status'});
   if(after.completed){completed();return true;}
  }
  return false;
 }
 check.addEventListener('click',async()=>{
  check.disabled=true;message.textContent='Checking payment…';
  try{if(!await verify())message.textContent='The booking is not yet confirmed. Return to the app or check again. Do not start another payment while confirmation is pending.';}
  catch(e){message.textContent=e.message;}finally{check.disabled=false;}
 });
 try{
  if(location.protocol!=='https:'||!['pawsinstride.com','www.pawsinstride.com'].includes(location.hostname))throw new Error('Open this page from the Paws in Stride app.');
  if(!token)throw new Error('Checkout link missing. Close this sheet and try again in the app.');
  info=await request('venmo-handoff',{action:'info'});updateBack();
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:info.currency||'USD'}).format(n/100);
  document.getElementById('venmo-total').textContent=money(info.amount_cents);
  document.getElementById('venmo-credit').textContent=info.credit_cents?money(info.credit_cents)+' account credit already applied.':'';
  if(info.completed){completed();return;}
  if(info.order_started){check.hidden=false;if(await verify())return;}
  if(Date.parse(info.checkout_expires_at)<=Date.now())throw new Error('This checkout has expired. Return to the app.');
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=info.sdk_url;s.onload=resolve;s.onerror=()=>reject(new Error('Venmo could not load. Return to the app and try again.'));document.head.appendChild(s);});
  const sdk=await window.paypal.createInstance({clientId:info.paypal_client_id,components:['venmo-payments'],pageType:'checkout'});
  const eligible=await sdk.findEligibleMethods({currencyCode:'USD'});
  if(!eligible.isEligible('venmo'))throw new Error('Venmo is unavailable in this browser session. Return to the app to choose another payment option.');
  const session=await sdk.createVenmoOneTimePaymentSession({
   async onApprove(data){
    button.hidden=true;check.hidden=false;message.textContent='Confirming your payment…';
    try{await request('paypal-capture-order',{checkout_id:info.checkout_id,orderID:data.orderId});
     if(!await verify())message.textContent='Your payment is being checked. Tap Check payment status before trying another payment.';
    }catch(e){message.textContent=e.message;}finally{busy=false;}
   },
   onCancel(){busy=false;button.removeAttribute('disabled');check.hidden=false;message.textContent='Venmo approval was cancelled. Return to the app or try Venmo again.';},
   onError(){busy=false;button.removeAttribute('disabled');check.hidden=false;message.textContent='Venmo could not finish. Check payment status before trying again.';}
  });
  button.hidden=false;message.textContent='Continue with Venmo to approve your payment.';
  button.addEventListener('click',()=>{
   if(busy)return;busy=true;button.setAttribute('disabled','');
   const order=request('paypal-create-order',{checkout_id:info.checkout_id,payment_method:'venmo'}).then(d=>({orderId:d.orderID}));
   session.start({presentationMode:'auto'},order).catch(e=>{busy=false;button.removeAttribute('disabled');check.hidden=false;message.textContent=e.message||'Unable to open Venmo. Check payment status or return to the app.';});
  });
 }catch(e){message.textContent=e.message;}
})();
