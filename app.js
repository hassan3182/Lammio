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

    if(window.showPage){
      window.showPage("home");
    }

  } catch(error){

    alert(error.message);

  }

}

window.savePost = savePost;

async function loadPosts(){

  const container=document.getElementById("postsContainer");

  if(!container) return;

  const q=query(
    collection(db,"posts"),
    orderBy("createdAt","desc")
  );

  onSnapshot(q,(snapshot)=>{

    container.innerHTML="";

    snapshot.forEach((docSnap)=>{

      const post=docSnap.data();

      const date=new Date(post.createdAt);

      container.innerHTML+=`

      <div class="post">

        <div style="display:flex;align-items:center;gap:12px;">

          <img
          src="${post.authorImage || 'https://via.placeholder.com/50'}"
          style="width:50px;height:50px;border-radius:50%;object-fit:cover;">

          <div>

            <h3 style="margin:0;">${post.author}</h3>

            <small style="color:gray;">
              ${date.toLocaleDateString()}
              -
              ${date.toLocaleTimeString()}
            </small>

          </div>

        </div>

        <h4>${post.title}</h4>

        <p>${post.text}</p>

        ${post.image ? `
        <img
        src="${post.image}"
        style="
        width:100%;
        max-height:400px;
        object-fit:cover;
        border-radius:12px;
        margin-top:10px;
        margin-bottom:10px;
        ">
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

window.loadPosts = loadPosts;

export async function register(email, password) {

  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    alert("تم إنشاء الحساب بنجاح");

    return userCredential.user;

  } catch (error) {

    alert(error.message);

  }

}

export async function login(email, password) {

  try {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.currentUser = userCredential.user;

    alert("تم تسجيل الدخول");

    if (window.showPage) {
      window.showPage("home");
    }

    return userCredential.user;

  } catch (error) {

    console.log(error);

    alert(error.message);

  }

}
export async function logout() {

  await signOut(auth);

  alert("تم تسجيل الخروج");

}

window.register = register;
window.login = login;
window.logout = logout;