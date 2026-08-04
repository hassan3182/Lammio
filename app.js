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
  getDocs,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

const ADMIN_EMAIL = "hassanasaad212@gmail.com";

// دالة حفظ المنشور مع دعم ضغط الصور والفيديوهات لتتوافق مع حدود قاعدة البيانات
async function savePost(title, text, isSecret = false, secretPass = "", mediaFile = null) {
  try {
    let mediaData = "";
    let mediaType = "none";

    if (mediaFile) {
      if (mediaFile.type.startsWith("image/")) {
        mediaType = "image";
        mediaData = await compressImage(mediaFile);
      } else if (mediaFile.type.startsWith("video/")) {
        if (mediaFile.size > 2 * 1024 * 1024) {
          alert("حجم الفيديو كبير جداً للتخزين المباشر (الحد الأقصى 2 ميجابايت). يرجى اختيار فيديو أقصر أو أصغر حجماً.");
          return;
        }
        mediaType = "video";
        mediaData = await fileToDataURL(mediaFile);
      }
    }

    await addDoc(collection(db, "posts"), {
      title: title,
      text: text,
      mediaData: mediaData,
      mediaType: mediaType,
      author: localStorage.getItem("userName") || "مستخدم Lammio",
      authorEmail: auth.currentUser ? auth.currentUser.email : "مجهول",
      authorImage: localStorage.getItem("userImage") || "https://via.placeholder.com/40",
      createdAt: new Date().toISOString(),
      likes: [],
      isSecret: isSecret,
      secretPass: secretPass
    });

    if (window.showPage) window.showPage("home");
  } catch (error) {
    alert("خطأ أثناء النشر: " + error.message);
  }
}

// دالة لضغط الصور تلقائياً مهما كان حجمها الأصلي كبير
function compressImage(file) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onload = function(e) {
      let img = new Image();
      img.src = e.target.result;
      img.onload = function() {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        
        let maxWidth = 800; // تحديد عرض مناسب
        let scale = maxWidth / img.width;
        
        if (scale < 1) {
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // ضغط بجودة مقبولة لتخزينها مباشرة دون أخطاء
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      };
    };
    reader.readAsDataURL(file);
  });
}

function fileToDataURL(file) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

async function deletePost(postId) {
  if (confirm("هل تريد حذف هذا المنشور؟")) {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      alert("خطأ: " + error.message);
    }
  }
}

async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

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

      let mediaHTML = "";
      if (post.mediaType === "video" && post.mediaData) {
        mediaHTML = `<video controls style="width:100%; max-height:400px; border-radius:12px; margin:10px 0;"><source src="${post.mediaData}">متصفحك لا يدعم الفيديو</video>`;
      } else if (post.mediaData || post.image) {
        let imgSrc = post.mediaData || post.image;
        mediaHTML = `<img src="${imgSrc}" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px; margin:10px 0;">`;
      }

      let postContentHTML = "";
      if (post.isSecret && !isAdmin && !isOwner) {
        postContentHTML = `
          <div id="secret-box-${docSnap.id}" style="background:#2d3748; color:white; padding:15px; border-radius:12px; text-align:center; margin:10px 0;">
            <h3>🔒 منشور سرّي</h3>
            <input type="password" id="pass-input-${docSnap.id}" placeholder="أدخل كلمة السر" style="width:80%; margin:6px 0; padding:8px; border-radius:8px; border:1px solid #ccc;">
            <button class="mainButton" style="width:auto; padding:6px 15px; background:#e11d48;" onclick="unlockSecret('${docSnap.id}', '${post.secretPass}')">كشف 🔓</button>
          </div>
          <div id="secret-content-${docSnap.id}" style="display:none;">
            <h4 style="margin-top:6px; font-size:15px;">${post.title}</h4>
            <p style="font-size:14px; margin-top:4px;">${post.text}</p>
            ${mediaHTML}
          </div>
        `;
      } else {
        postContentHTML = `
          ${post.isSecret ? `<span style="background:#e11d48; color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">🔒 سرّي</span>` : ""}
          <h4 style="margin-top:6px; font-size:15px;">${post.title}</h4>
          <p style="font-size:14px; margin-top:4px;">${post.text}</p>
          ${mediaHTML}
        `;
      }

      container.innerHTML += `
      <div class="post" id="post-${docSnap.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${post.authorImage || 'https://via.placeholder.com/40'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
            <div>
              <h3 style="margin:0; font-size:14px; font-weight:bold;">${post.author}</h3>
              <small style="color:#636e72; font-size:11px;">${date.toLocaleDateString()}</small>
            </div>
          </div>
          ${(isOwner || isAdmin) ? `<button onclick="deletePost('${docSnap.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;color:#636e72;">🗑️</button>` : ""}
        </div>
        ${postContentHTML}
        <div style="display:flex; justify-content:space-around; padding-top:4px; border-top:1px solid #eee;">
          <button onclick="toggleLike('${docSnap.id}')" style="background:none;border:none;cursor:pointer;color:${isLiked ? '#e11d48' : '#636e72'}">❤️ ${likesCount}</button>
          <button onclick="showComment(this)" style="background:none;border:none;cursor:pointer;color:#636e72;">💬 تعليق</button>
        </div>
        <div class="comments"></div>
      </div>`;
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

async function toggleLike(postId) {
  if (!auth.currentUser) return alert("سجل الدخول أولاً");
  const currentUserEmail = auth.currentUser.email;
  const postRef = doc(db, "posts", postId);
  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const likes = postSnap.data().likes || [];
    if (likes.includes(currentUserEmail)) {
      await updateDoc(postRef, { likes: arrayRemove(currentUserEmail) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUserEmail) });
    }
  } catch (error) { console.error(error); }
}

function showComment(button) {
  let commentsDiv = button.closest(".post").querySelector(".comments");
  if (commentsDiv.innerHTML !== "") { commentsDiv.innerHTML = ""; return; }
  commentsDiv.innerHTML = `
    <div style="margin-top:10px; display:flex; gap:8px;">
      <input class="commentInput" placeholder="اكتب تعليقك..." style="margin:0; width:100%; padding:8px; border-radius:20px; border:1px solid #ccc;">
      <button class="mainButton" style="width:auto; padding:6px 15px; margin:0;" onclick="addComment(this)">إرسال</button>
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
  commentList.innerHTML += `<p style="background:rgba(108, 92, 231, 0.05); padding:6px; border-radius:8px; margin-top:4px; font-size:13px;"><strong>${author}:</strong> ${text}</p>`;
  input.value = "";
}

export async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("loggedIn", "true");
    localStorage.setItem("userName", email.split("@")[0]);
    if (window.showPage) window.showPage("home");
    return userCredential.user;
  } catch (error) { alert(error.message); }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("loggedIn", "true");
    localStorage.setItem("userName", email.split("@")[0]);
    if (window.showPage) window.showPage("home");
    return userCredential.user;
  } catch (error) { alert(error.message); }
}

export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.removeItem("loggedIn");
    if (window.showLogin) window.showLogin();
    else window.location.reload();
  } catch (error) { alert(error.message); }
}

window.savePost = savePost;
window.deletePost = deletePost;
window.loadPosts = loadPosts;
window.unlockSecret = unlockSecret;
window.toggleLike = toggleLike;
window.showComment = showComment;
window.addComment = addComment;
window.register = register;
window.login = login;
window.logout = logout;
