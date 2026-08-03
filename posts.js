import { collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { db, auth } from "./firebase.js";

export async function savePost(title, text) {

  try {

    await addDoc(collection(db, "posts"), {
      title: title,
      text: text,
      image: localStorage.getItem("tempPostImage") || "",
      author: localStorage.getItem("userName") || "مستخدم",
      authorEmail: auth.currentUser ? auth.currentUser.email : "مجهول",
      authorImage: localStorage.getItem("userImage") || "",
      createdAt: new Date().toISOString()
    });

    localStorage.removeItem("tempPostImage");

    if (window.showPage) {
      window.showPage("home");
    }

  } catch (error) {

    alert(error.message);

  }

}

export function loadPosts() {

  const container = document.getElementById("postsContainer");

  if (!container) return;

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {

    container.innerHTML = "";

    snapshot.forEach((docSnap) => {

      const post = docSnap.data();

      const date = new Date(post.createdAt);

      container.innerHTML += `
      <div class="post">

        <div style="display:flex;align-items:center;gap:12px;">

          <img
          src="${post.authorImage || 'https://via.placeholder.com/50'}"
          style="width:50px;height:50px;border-radius:50%;object-fit:cover;">

          <div>
            <h3 style="margin:0;">${post.author}</h3>

            <small style="color:gray;">
              ${date.toLocaleDateString()} -
              ${date.toLocaleTimeString()}
            </small>

          </div>

        </div>

        <h4>${post.title}</h4>

        <p>${post.text}</p>

        ${post.image ? `
        <img
        src="${post.image}"
        style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-top:10px;margin-bottom:10px;">
        ` : ""}

        <div class="actions">

          <button onclick="likePost(this)">❤️ <span>0</span></button>

          <button onclick="showComment(this)">💬 تعليق</button>

          <button>↗ مشاركة</button>

        </div>

        <div class="comments"></div>

      </div>
      `;

    });

  });

}