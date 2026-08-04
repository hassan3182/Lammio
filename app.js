import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { showSearch } from "./search.js";
import { showMessages } from "./messages.js";

const firebaseConfig = {
  apiKey: "AIzaSyAR-rrGnNo0XnblSHJw6a0FerAe_g-Qd9Y",
  authDomain: "lammio-9335b.firebaseapp.com",
  projectId: "lammio-9335b",
  storageBucket: "lammio-9335b.firebasestorage.app",
  messagingSenderId: "601630216360",
  appId: "1:601630216360:web:eec05a140d7adb62ac329d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 1. إدارة المنشورات ---

async function savePost(title, text) {
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

async function loadPosts() {
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
              ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}
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
          <button onclick="sharePost(this)">↗ مشاركة</button>
        </div>
        <div class="comments"></div>
      </div>
      `;
    });
  });
}

// --- 2. تفاعلات الأزرار (إعجاب، تعليق، مشاركة) ---

function likePost(button) {
  let span = button.querySelector("span");
  let count = Number(span.innerText);

  if (button.dataset.liked === "true") {
    count--;
    button.dataset.liked = "false";
    button.innerHTML = "❤️ <span>" + count + "</span>";
  } else {
    count++;
    button.dataset.liked = "true";
    button.innerHTML = "💖 <span>" + count + "</span>";
  }
}

function showComment(button) {
  let postElement = button.closest(".post");
  let commentsDiv = postElement.querySelector(".comments");

  if (commentsDiv.innerHTML !== "") {
    commentsDiv.innerHTML = "";
    return;
  }

  commentsDiv.innerHTML = `
    <div style="margin-top:10px; display:flex; gap:8px;">
      <input class="commentInput" placeholder="اكتب تعليقك..." style="margin:0;">
      <button class="mainButton" style="width:auto; padding:8px 15px; margin:0;" onclick="addComment(this)">إرسال</button>
    </div>
    <div class="commentList" style="margin-top:8px;"></div>
  `;
}

function addComment(button) {
  let parent = button.parentElement;
  let input = parent.querySelector(".commentInput");
  let text = input.value.trim();
  if (text === "") return;

  let commentList = parent.nextElementSibling;
  let author = localStorage.getItem("userName") || "مستخدم";

  commentList.innerHTML += `<p style="background:#f0f2f5; padding:6px 10px; border-radius:8px; margin-top:5px; font-size:14px;"><strong>💬 ${author}:</strong> ${text}</p>`;
  input.value = "";
}

function sharePost(button) {
  const post = button.closest(".post");
  const title = post.querySelector("h4") ? post.querySelector("h4").innerText : "";
  const text = post.querySelector("p") ? post.querySelector("p").innerText : "";

  const shareText = `${title}\n\n${text}\n\nhttps://san3182.github.io/Lammio/`;

  if (navigator.share) {
    navigator.share({ title: title, text: shareText });
  } else {
    navigator.clipboard.writeText(shareText);
    alert("تم نسخ نص المنشور ورابط التطبيق!");
  }
}

// --- 3. المصادقة وتأكيد الحسابات ---

export async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    window.currentUser = userCredential.user;
    sessionStorage.setItem("loggedIn", "true");
    alert("تم إنشاء الحساب بنجاح");
    if (window.showPage) window.showPage("home");
    return userCredential.user;
  } catch (error) {
    alert(error.message);
  }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    window.currentUser = userCredential.user;
    sessionStorage.setItem("loggedIn", "true");
    alert("تم تسجيل الدخول");

    if (window.showPage) window.showPage("home");

    return userCredential.user;
  } catch (error) {
    console.log(error);
    alert(error.message);
  }
}

export async function logout() {
  await signOut(auth);
  window.currentUser = null;
  sessionStorage.removeItem("loggedIn");
  alert("تم تسجيل الخروج");
  if (window.showLogin) window.showLogin();
}

// --- 4. إتاحة جميع الدوال لنطاق النافذة (Window Object) ---

window.savePost = savePost;
window.loadPosts = loadPosts;
window.likePost = likePost;
window.showComment = showComment;
window.addComment = addComment;
window.sharePost = sharePost;
window.register = register;
window.login = login;
window.logout = logout;
