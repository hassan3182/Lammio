export function showMessages() {
  const content = document.getElementById("content");
  const savedReceiver = localStorage.getItem("chatReceiver") || "";

  content.innerHTML = `
    <h2>💬 الرسائل</h2>
    <input id="receiver" type="email" placeholder="البريد الإلكتروني للطرف الآخر" value="${savedReceiver}">
    <div id="messagesArea" style="height:300px;overflow-y:auto;border:1px solid #ddd;border-radius:10px;padding:10px;margin:15px 0;background:#fff;"></div>
    <input id="messageText" placeholder="اكتب رسالة...">
    <button class="mainButton" id="sendBtn">إرسال</button>
  `;

  const receiverInput = document.getElementById("receiver");
  const sendBtn = document.getElementById("sendBtn");

  function loadChat(){
    const receiver = receiverInput.value.trim();
    if(receiver === "") return;

    if (window.listenMessages) {
      window.listenMessages(receiver, (messages) => {
        const area = document.getElementById("messagesArea");
        area.innerHTML = "";

        messages.forEach(msg => {
          const mine = window.currentUser && msg.sender === window.currentUser.email;
          area.innerHTML += `
            <div style="background:${mine ? "#4f46e5" : "#ddd"};color:${mine ? "white" : "black"};padding:10px;border-radius:10px;margin-bottom:8px;margin-left:${mine ? "40px" : "0"};margin-right:${mine ? "0" : "40px"};">
              ${msg.text}
            </div>
          `;
        });
        area.scrollTop = area.scrollHeight;
      });
    }
  }

  receiverInput.addEventListener("input", () => {
    localStorage.setItem("chatReceiver", receiverInput.value);
    loadChat();
  });

  sendBtn.onclick = async () => {
    const receiver = receiverInput.value.trim();
    const text = document.getElementById("messageText").value.trim();

    if(receiver === "" || text === ""){
      alert("اكتب البريد والرسالة");
      return;
    }

    if (window.sendMessage) {
      await window.sendMessage(receiver, text);
      document.getElementById("messageText").value = "";
      loadChat();
    }
  };

  if(savedReceiver !== ""){
    loadChat();
  }
}

window.showMessages = showMessages;
