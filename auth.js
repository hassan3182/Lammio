import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";

export async function register(email, password) {

  try {

    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const username = prompt("اكتب اسم المستخدم");

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

    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    alert("تم تسجيل الدخول");

    return userCredential.user;

  } catch (error) {

    alert(error.message);

  }

}

export async function logout() {

  await signOut(auth);

  alert("تم تسجيل الخروج");

}