
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
  setDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where
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
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
window.currentUser = user;
  if (user) {

    if (window.showPage) {
      window.showPage("home");
    }

  } else {
window.currentUser = null;
    if (typeof showLogin === "function") {
      showLogin();
    }

  }

});
async function savePost(title, text) {
if (!auth.currentUser) {
    alert("يجب تسجيل الدخول أولاً");
    return;
}
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

          <button onclick="sharePost(this)">↗ مشاركة</button>

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

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const username = prompt("اختر اسم مستخدم (Username)");

    await setDoc(doc(db, "users", userCredential.user.uid), {

      username: username,
      email: email,
      bio: "مرحباً",
      image: ""

    });

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

    alert("تم تسجيل الدخول");

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
export async function sendMessage(receiver, text){

  try{

    const chatId = [auth.currentUser.email, receiver].sort().join("_");

    await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        sender: auth.currentUser.email,
        receiver: receiver,
        text: text,
        createdAt: serverTimestamp()
      }
    );

  }catch(error){

    alert(error.message);

  }

}

export function listenMessages(receiver,callback){

const chatId = [auth.currentUser.email, receiver].sort().join("_");

const q = query(
  collection(db, "chats", chatId, "messages"),
  orderBy("createdAt", "asc")
);

onSnapshot(q,(snapshot)=>{

let data=[];

snapshot.forEach((doc)=>{

data.push(doc.data());

});

callback(data);

});

}

window.sendMessage = sendMessage;
window.listenMessages = listenMessages;