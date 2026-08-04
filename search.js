import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function showSearch(){
  const content = document.getElementById("content");

  content.innerHTML = `
    <h2>🔍 البحث عن مستخدم</h2>
    <input id="searchInput" placeholder="اكتب اسم المستخدم">
    <button class="mainButton" id="searchBtn">بحث</button>
    <div id="results"></div>
  `;

  document.getElementById("searchBtn").onclick = async () => {
    const value = document.getElementById("searchInput").value.trim().toLowerCase();
    const results = document.getElementById("results");
    results.innerHTML = "";

    if (value === "") {
      alert("يرجى كتابة اسم المستخدم أولاً");
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, "users"));

      snapshot.forEach((doc) => {
        const user = doc.data();
        if(user.username && user.username.toLowerCase().includes(value)){
          results.innerHTML += `
            <div class="post">
              <h3>@${user.username}</h3>
              <p>${user.bio || ''}</p>
              <button class="mainButton" onclick="openChat('${user.email}')">فتح المحادثة 💬</button>
            </div>
          `;
        }
      });
    } catch (error) {
      alert("خطأ في البحث: " + error.message);
    }
  };
}

function openChat(email) {
  if (!email) {
    alert("هذا المستخدم ليس لديه بريد إلكتروني مسجل");
    return;
  }
  localStorage.setItem("chatReceiver", email);
  if (window.showPage) {
    window.showPage("messages");
  }
}

window.showSearch = showSearch;
window.openChat = openChat;
