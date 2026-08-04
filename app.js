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
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
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

// --- تحديد بريد الأدمن (صاحب التطبيق والتحكم الكامل) ---
const ADMIN_EMAIL = "hassanasaad212@gmail.com";

// --- 1. إدارة المنشورات وغرفة الأسرار ---

async function savePost(title, text, isSecret = false, secretPass = "") {
  try {
    await addDoc(collection(db, "posts"), {
      title: title,
      text: text,
      image: localStorage.getItem("tempPostImage") || "",
      author: localStorage.getItem("userName") || "مستخدم",
      authorEmail: auth.currentUser ? auth.currentUser.email : "مجهول",
      authorImage: localStorage.getItem("userImage") || "",
      createdAt: new Date().toISOString(),
      likes: [],
      isSecret: isSecret,
      secretPass: secretPass
    });

    localStorage.removeItem("tempPostImage");

    if (window.showPage) {
      window.showPage("home");
    }
  } catch (error) {
    alert(error.message);
  }
}

async function deletePost(postId) {
  if (confirm("هل تريد حذف هذا المنشور حقاً؟")) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      alert("تم حذف المنشور بنجاح");
    } catch (error) {
      alert("خطأ في الحذف: " + error.message);
    }
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
    const currentUserEmail = auth.currentUser ? auth.currentUser.email : "";
    const isAdmin = currentUserEmail === ADMIN_EMAIL;

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const date = new Date(post.createdAt);

      const likesArray = post.likes || [];
      const likesCount = likesArray.length;
      const isLiked = likesArray.includes(currentUserEmail);
      const isOwner = post.authorEmail === currentUserEmail;

      let postContentHTML = "";

      // إذا كان المنشور سرياً والمستخدم ليس الأدمن أو صاحب المنشور
      if (post.isSecret && !isAdmin && !isOwner) {
        postContentHTML = `
          <div id="secret-box-${docSnap.id}" style="background:#2d3748; color:white; padding:15px; border-radius:10px; text-align:center; margin:10px 0;">
            <h3>🔒 منشور سرّي مغلق</h3>
            <p style="font-size:13px; color:#cbd5e0;">هذا المحتوى محمي بكلمة سر</p>
            <input type="password" id="pass-input-${docSnap.id}" placeholder="أدخل كلمة السر لرؤية المحتوى" style="width:80%; margin:8px 0; padding:6px; border-radius:6px; border:1px solid #ccc;">
            <button class="mainButton" style="width:auto; padding:6px 15px; background:#e11d48;" onclick="unlockSecret('${docSnap.id}', '${post.secretPass}')">كشف السر 🔓</button>
          </div>
          <div id="secret-content-${docSnap.id}" style="display:none;">
            <h4>${post.title}</h4>
            <p>${post.text}</p>
            ${post.image ? `<img src="${post.image}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin:10px 0;">` : ""}
          </div>
        `;
      } else {
        // العرض العادي أو العرض الكامل للأدمن وصاحب المنشور
        postContentHTML = `
          ${post.isSecret ? `<span style="background:#e11d48; color:white; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">🔒 سرّي (معروض لك بصفتك ${isAdmin ? 'الأدمن' : 'صاحب المنشور'})</span>` : ""}
          <h4 style="margin-top:6px;">${post.title}</h4>
          <p>${post.text}</p>
          ${post.image ? `<img src="${post.image}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin:10px 0;">` : ""}
        `;
      }

      container.innerHTML += `
      <div class="post" id="post-${docSnap.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${post.authorImage || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
            <div>
              <h3 style="margin:0;">${post.author}</h3>
              <small style="color:gray;">${date.toLocaleDateString()} - ${date.toLocaleTimeString()}</small>
            </div>
          </div>
          ${(isOwner || isAdmin) ? `<button onclick="deletePost('${docSnap.id}')" style="background:none;border:none;cursor:pointer;font-size:18px;">🗑️</button>` : ""}
        </div>
        ${postContentHTML}
        <div class="actions">
          <button onclick="toggleLike('${docSnap.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;">
            ${isLiked ? "💖" : "❤️"} <span>${likesCount}</span>
          </button>
          <button onclick="showComment(this)">💬 تعليق</button>
          <button onclick="sharePost(this)">↗ مشاركة</button>
        </div>
        <div class="comments"></div>
      </div>
      `;
    });
  });
}

function unlockSecret(postId, correctPassword) {
  const input = document.getElementById(`pass-input-${postId}`);
  if (input && input.value === correctPassword) {
    document.getElementById(`secret-box-${postId}`).style.display = "none";
    document.getElementById(`secret-content-${postId}`).style.display = "block";
  } else {
    alert("كلمة السر خاطئة! ❌");
  }
}

// --- 2. تفاعلات الأزرار (إعجاب، تعليق، مشاركة) ---

async function toggleLike(postId) {
  if (!auth.currentUser) {
    alert("يجب تسجيل الدخول للإعجاب بالمنشور");
    return;
  }

  const currentUserEmail = auth.currentUser.email;
  const postRef = doc(db, "posts", postId);

  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const postData = postSnap.data();
    const likes = postData.likes || [];

    if (likes.includes(currentUserEmail)) {
      await updateDoc(postRef, {
        likes: arrayRemove(currentUserEmail)
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(currentUserEmail)
      });
    }
  } catch (error) {
    console.error("خطأ في تحديث الإعجاب:", error);
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
window.deletePost = deletePost;
window.loadPosts = loadPosts;
window.unlockSecret = unlockSecret;
window.toggleLike = toggleLike;
window.showComment = showComment;
window.addComment = addComment;
window.sharePost = sharePost;
window.register = register;
window.login = login;
window.logout = logout;
