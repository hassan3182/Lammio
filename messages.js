import { sendMessage, listenMessages } from "./app.js";

export function showMessages() {

const content = document.getElementById("content");

content.innerHTML = `

<h2>💬 الرسائل</h2>

<input
id="receiver"
type="email"
placeholder="البريد الإلكتروني للطرف الآخر">

<div id="messagesArea"
style="
height:300px;
overflow-y:auto;
border:1px solid #ddd;
border-radius:10px;
padding:10px;
margin:15px 0;
background:#fff;
"></div>

<input
id="messageText"
placeholder="اكتب رسالة...">

<button class="mainButton" id="sendBtn">

إرسال

</button>

`;

const receiverInput = document.getElementById("receiver");
const sendBtn = document.getElementById("sendBtn");

function loadChat(){

const receiver = receiverInput.value.trim();

if(receiver==="") return;

listenMessages(receiver,(messages)=>{

const area = document.getElementById("messagesArea");

area.innerHTML="";

messages.forEach(msg=>{

area.innerHTML += `

<div style="
background:#4f46e5;
color:white;
padding:10px;
border-radius:10px;
margin-bottom:8px;
width:fit-content;
">

${msg.text}

</div>

`;

});

area.scrollTop = area.scrollHeight;

});

}

receiverInput.addEventListener("input",loadChat);

sendBtn.onclick = async ()=>{

const receiver = receiverInput.value.trim();

const text = document.getElementById("messageText").value.trim();

if(receiver==="" || text===""){

alert("اكتب البريد الإلكتروني والرسالة");

return;

}

await sendMessage(receiver,text);

document.getElementById("messageText").value="";

loadChat();

};

}

window.showMessages = showMessages;