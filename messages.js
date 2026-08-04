import { db } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export function showMessages() {
  const content = document.getElementById("content");
  const savedReceiver = localStorage.getItem("chatReceiver") || "";

  content.innerHTML = `
    <h2>💬 الرسائل والمحادثات</h2>
    <input id="receiver" type="email" placeholder="البريد الإلكتروني للطرف الآخر" value="${savedReceiver}">
    
    <div id="messagesArea" style="height:320px; overflow-y:auto; border:1px solid #ddd; border-radius:12px; padding:10px; margin:15px 0; background:#fff; display:flex; flex-direction:column; gap:8px;"></div>

    <div style="display:flex; gap:6px; align-items:center;">
      <input id="messageText" placeholder="اكتب رسالة..." style="margin:0; flex:1;">
      <label for="chatMedia" style="background:#eef2ff; padding:10px; border-radius:10px; cursor:pointer; font-size:18px;">📎</label>
      <input type="file" id="chatMedia" accept="image/*,video/*" style="display:none;">
      <button class="mainButton" id="sendBtn" style="width:auto; margin:0; padding:12px 18px;">إرسال</button>
    </div>
  `;

  const receiverInput = document.getElementById("receiver");
  const sendBtn = document.getElementById("sendBtn");
  let unsubscribe = null;

  function loadChat() {
    const receiver = receiverInput.value.trim();
    if (!receiver) return;

    localStorage.setItem("chatReceiver", receiver);
    const currentUserEmail = window.currentUser ? window.currentUser.email : "";

    if (unsubscribe) unsubscribe();

    const q = query(collection(db, "chats"), orderBy("createdAt", "asc"));

    unsubscribe = onSnapshot(q, (snapshot) => {
      const area = document.getElementById("messagesArea");
      if (!area) return;
      area.innerHTML = "";

      snapshot.forEach((docSnap) => {
        const msg = docSnap.data();

        const isBetweenUs = 
          (msg.sender === currentUserEmail && msg.receiver === receiver) ||
          (msg.sender === receiver && msg.receiver === currentUserEmail);

        if (isBetweenUs) {
          const mine = msg.sender === currentUserEmail;
          let mediaHTML = "";

          if (msg.mediaType === "image") {
            mediaHTML = `<img src="${msg.mediaUrl}" style="max-width:100%; max-height:220px; border-radius:8px; margin-top:5px; display:block;">`;
          } else if (msg.mediaType === "video") {
            mediaHTML = `<video src="${msg.mediaUrl}" controls style="max-width:100%; max-height:220px; border-radius:8px; margin-top:5px; display:block;"></video>`;
          }

          area.innerHTML += `
            <div style="
              align-self: ${mine ? "flex-end" : "flex-start"};
              background: ${mine ? "#4f46e5" : "#e5e7eb"};
              color: ${mine ? "white" : "black"};
              padding: 10px 14px;
              border-radius: 12px;
              max-width: 75%;
              word-break: break-word;
            ">
              ${msg.text ? `<div>${msg.text}</div>` : ""}
              ${mediaHTML}
            </div>
          `;
        }
      });
      area.scrollTop = area.scrollHeight;
    });
  }

  receiverInput.addEventListener("input", loadChat);

  sendBtn.onclick = async () => {
    const receiver = receiverInput.value.trim();
    const textInput = document.getElementById("messageText");
    const mediaInput = document.getElementById("chatMedia");
    const text = textInput.value.trim();
    const file = mediaInput.files[0];

    if (!receiver) {
      alert("يرجى إدخال البريد الإلكتروني للطرف الآخر");
      return;
    }

    if (!text && !file) return;

    const sender = window.currentUser ? window.currentUser.email : "مجهول";

    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const mediaUrl = e.target.result;
        const mediaType = file.type.startsWith("image") ? "image" : "video";

        await addDoc(collection(db, "chats"), {
          sender: sender,
          receiver: receiver,
          text: text,
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          createdAt: new Date().toISOString()
        });

        textInput.value = "";
        mediaInput.value = "";
      };
      reader.readAsDataURL(file);
    } else {
      await addDoc(collection(db, "chats"), {
        sender: sender,
        receiver: receiver,
        text: text,
        mediaUrl: "",
        mediaType: "",
        createdAt: new Date().toISOString()
      });

      textInput.value = "";
    }
  };

  if (savedReceiver !== "") {
    loadChat();
  }
}

window.showMessages = showMessages;
