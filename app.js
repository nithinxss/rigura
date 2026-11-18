const $ = id => document.getElementById(id);
let contacts = JSON.parse(localStorage.getItem("rigaura_contacts") || "[]");
let taps = [], sosActive = false, currentLocation = null, recorder = null;

function renderContacts() {
  $("contactCount").textContent = contacts.length + " / 6";
  $("contactList").innerHTML = "";
  if (!contacts.length) { const li=document.createElement("li"); li.className="empty"; li.textContent="Add up to 6 people you trust."; $("contactList").append(li); return; }
  contacts.forEach((c,i) => {
    const li=document.createElement("li"), label=document.createElement("span"), remove=document.createElement("button");
    label.textContent=c.name+" · "+c.phone; remove.textContent="Remove"; remove.className="remove-contact"; remove.type="button";
    remove.onclick=()=>{contacts.splice(i,1);saveContacts();}; li.append(label,remove); $("contactList").append(li);
  });
}
function saveContacts(){localStorage.setItem("rigaura_contacts",JSON.stringify(contacts));renderContacts();}
$("contactForm").addEventListener("submit",e=>{e.preventDefault();if(contacts.length>=6)return alert("You can add up to 6 trusted contacts.");const name=$("contactName").value.trim(),phone=$("contactPhone").value.trim();if(!name||!phone)return;contacts.push({name,phone});saveContacts();$("contactForm").reset();});

function playBuzzer(){
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      const osc = ctx.createOscillator();
      const pulse = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.22);
      pulse.gain.setValueAtTime(0, ctx.currentTime);
      for (let i = 0; i < 6; i++) {
        const start = ctx.currentTime + i * 0.32;
        pulse.gain.setValueAtTime(0, start);
        pulse.gain.linearRampToValueAtTime(1, start + 0.035);
        pulse.gain.setValueAtTime(1, start + 0.20);
        pulse.gain.linearRampToValueAtTime(0, start + 0.25);
      }
      osc.connect(pulse); pulse.connect(master); osc.start();
      osc.stop(ctx.currentTime + 2.0);
      osc.onended = () => ctx.close();
    }
  } catch (e) { console.warn("Buzzer sound unavailable:", e); }
  if (navigator.vibrate) navigator.vibrate([300,120,300,120,600]);
}
function smsLink(){
  const place = currentLocation
    ? "https://www.google.com/maps?q=" + currentLocation.latitude + "," + currentLocation.longitude
    : "Location not available yet. Please call me and help.";
  const body = "RIGAURA SOS ALERT! I may be in danger and need help. My location: " + place;
  const numbers = contacts.map(c => c.phone.replace(/[^+\\d]/g, "")).filter(Boolean);
  return "sms:" + numbers.join(",") + "?body=" + encodeURIComponent(body);
}
function activateSOS(){
  sosActive=true;
  $("cancelSos").disabled=false;
  $("sosStatus").textContent="SOS ALERT ACTIVE — buzzer started.";
  $("sosModal").classList.remove("hidden");
  $("modalText").textContent=contacts.length
    ? "Your buzzer has sounded. Open the SMS app to send the SOS message to your saved contacts."
    : "Your buzzer has sounded. Add a trusted contact to prepare an SOS SMS.";
  playBuzzer();
  if (contacts.length) window.location.href = smsLink();
}
$("sosButton").addEventListener("click",()=>{const now=Date.now();taps=taps.filter(t=>now-t<=3000);taps.push(now);$("tapCount").textContent=taps.length+" / 5 TAPS";if(taps.length>=5){taps=[];$("tapCount").textContent="SOS ACTIVATED";activateSOS();}});
$("closeModal").onclick=()=>$("sosModal").classList.add("hidden");

function getLocation(){
  if(!navigator.geolocation){$("locationTitle").textContent="Location unavailable";$("locationText").textContent="Your browser does not support GPS.";return;}
  $("locationTitle").textContent="Finding your location…";
  navigator.geolocation.getCurrentPosition(p=>{const {latitude,longitude}=p.coords;currentLocation={latitude,longitude};$("locationTitle").textContent="Location found";$("locationText").textContent=latitude.toFixed(5)+", "+longitude.toFixed(5);$("mapLink").href="https://www.google.com/maps?q="+latitude+","+longitude;$("mapLink").classList.remove("hidden");},e=>{$("locationTitle").textContent="Location permission needed";$("locationText").textContent=e.message+" Allow location access and try again.";},{enableHighAccuracy:true,timeout:12000});
}
$("getLocation").onclick=getLocation;
$("shareLocation").onclick=()=>{if(!currentLocation){getLocation();return;}const url="https://www.google.com/maps?q="+currentLocation.latitude+","+currentLocation.longitude;if(navigator.share)navigator.share({title:"My RIGAURA location",text:"Please check my location: "+url}).catch(()=>{});else window.open("sms:?body="+encodeURIComponent("Please check my location: "+url),"_self");};
$("sendAlerts").onclick=()=>{if(!contacts.length)return alert("Please add a trusted contact first.");window.location.href=smsLink();};

$("savePassword").onclick=()=>{const value=$("cancelPassword").value;if(value.length<4){$("passwordStatus").textContent="Please enter at least 4 characters.";return;}localStorage.setItem("rigaura_demo_password",value);$("passwordStatus").textContent="Password saved on this device (demo only).";$("cancelPassword").value="";};
$("cancelSos").onclick=()=>{if(!sosActive)return;const entered=prompt("Enter your cancellation password");if(entered===null)return;const saved=localStorage.getItem("rigaura_demo_password");if(!saved){alert("Set your cancellation password first.");return;}if(entered!==saved){alert("Incorrect password. SOS remains active.");return;}sosActive=false;$("cancelSos").disabled=true;$("sosStatus").textContent="Test SOS cancelled successfully.";$("sosModal").classList.add("hidden");};

$("recordButton").onclick=async()=>{
  if(recorder&&recorder.state==="recording"){recorder.stop();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$("recordStatus").textContent="Recording is not supported in this browser. Use Chrome on HTTPS or localhost.";return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true}),chunks=[];
    recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="rigaura-test-recording.webm";a.click();URL.revokeObjectURL(url);stream.getTracks().forEach(t=>t.stop());$("recordStatus").textContent="Recording saved to downloads.";$("recordButton").textContent="Start test recording";};
    recorder.start();$("recordStatus").textContent="Recording… it stops automatically after 30 seconds.";$("recordButton").textContent="Stop recording";setTimeout(()=>{if(recorder&&recorder.state==="recording")recorder.stop();},30000);
  }catch(e){$("recordStatus").textContent="Camera/microphone permission unavailable: "+e.message;}
};
renderContacts();