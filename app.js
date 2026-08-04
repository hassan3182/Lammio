import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// =======================
// إنشاء حساب
// =======================

async function register(email, password) {

  try {

    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const username = prompt("اختر اسم المستخدم");

    await setDoc(doc(db, "users", userCredential.user.uid), {

      username: username,
      email: email,
      bio: "مرحباً بك في Lammio",
      image: ""

    });

    alert("تم إنشاء الحساب بنجاح");

  } catch (error) {

    alert(error.message);

  }

}

// =======================
// تسجيل الدخول
// =======================

async function login(email, password) {

  try {

    await signInWithEmailAndPassword(auth, email, password);

    alert("تم تسجيل الدخول");

  } catch (error) {

    alert(error.message);

  }

}

// =======================
// تسجيل الخروج
// =======================

async function logout() {

  await signOut(auth);

}

// =======================
// مراقبة حالة المستخدم
// =======================

onAuthStateChanged(auth, (user) => {

  window.currentUser = user;

  if (user) {

    if (window.showPage) {
      window.showPage("home");
    }

  } else {

    if (window.showLogin) {
      window.showLogin();
    }

  }

});

// =======================
// جعل الدوال متاحة
// =======================

window.register = register;
window.login = login;
window.logout = logout;