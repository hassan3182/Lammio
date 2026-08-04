// استيراد أدوات Firebase المطلوبة
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyD... (ضع مفتاحك هنا)",
  authDomain: "lammio-app.firebaseapp.com",
  projectId: "lammio-app",
  storageBucket: "lammio-app.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// مراقبة حالة المستخدم وتخزين الجلسة
onAuthStateChanged(auth, (user) => {
  if (user) {
    sessionStorage.setItem("loggedIn", "true");
  } else {
    sessionStorage.removeItem("loggedIn");
  }
});

// وظيفة تسجيل الدخول
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("loggedIn", "true");
    alert("تم تسجيل الدخول بنجاح! أهلاً بك في Lammio");
    if (window.showPage) window.showPage("home");
  } catch (error) {
    alert("خطأ في تسجيل الدخول: " + error.message);
  }
}

// وظيفة إنشاء حساب جديد
export async function register(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem("loggedIn", "true");
    alert("تم إنشاء الحساب بنجاح! أهلاً بك في Lammio");
    if (window.showPage) window.showPage("home");
  } catch (error) {
    alert("خطأ في إنشاء الحساب: " + error.message);
  }
}

// وظيفة تسجيل الخروج
export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.removeItem("loggedIn");
    window.location.reload();
  } catch (error) {
    alert("خطأ أثناء تسجيل الخروج: " + error.message);
  }
}

// وظيفة نسيت كلمة السر
export async function resetPassword(email) {
  if (!email) {
    alert("يرجى إدخال بريدك الإلكتروني في الحقل المخصص أولاً.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح! 📧");
  } catch (error) {
    alert("خطأ: " + error.message);
  }
}

// دالة لضغط الصور تلقائياً لتجنب مشاكل الحجم
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // ضغط الجودة لـ 70%
      };
    };
  });
}

// تحويل الملفات إلى Base64 مع الضغط
async function convertFileToBase64(file) {
  if (!file) return null;
  if (file.type.startsWith("image/")) {
    return await compressImage(file);
  } else {
    // للفيديوهات أو الملفات الأخرى
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}

// حفظ المنشور في Firestore
export async function savePost(title, text, isSecret, secretPass, mediaFile) {
  try {
    let mediaBase64 = null;
    let mediaType = "";

    if (mediaFile) {
      if (mediaFile.size > 2 * 1024 * 1024) { // التحذير إذا كان الملف كبيراً جداً
        alert("الملف الكبير قد يستغرق وقتاً قليلاً للمعالجة...");
      }
      mediaBase64 = await convertFileToBase64(mediaFile);
      mediaType = mediaFile.type.startsWith("image/") ? "image" : "video";
    }

    const userEmail = auth.currentUser ? auth.currentUser.email : "مستخدم مجهول";

    await addDoc(collection(db, "posts"), {
      title: title,
      text: text,
      author: userEmail,
      isSecret: isSecret,
      secretPass: secretPass || "",
      mediaUrl: mediaBase64,
      mediaType: mediaType,
      createdAt: serverTimestamp()
    });

    alert("تم نشر المنشور بنجاح! 🎉");
    if (window.showPage) window.showPage("home");
  } catch (error) {
    alert("حدث خطأ أثناء النشر: " + error.message);
  }
}

// تحميل المنشورات وعرضها
export async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;'>جاري تحميل المنشورات...</p>";

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = "<p style='text-align:center; color:#555;'>لا توجد منشورات حتى الآن.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const card = document.createElement("div");
      card.className = "post";

      let mediaHtml = "";
      if (post.mediaUrl) {
        if (post.mediaType === "image") {
          mediaHtml = `<img src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:300px; object-fit:cover;">`;
        } else if (post.mediaType === "video") {
          mediaHtml = `<video controls src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:300px;"></video>`;
        }
      }

      let secretBadge = post.isSecret ? `<span style="background:#e11d48; color:white; padding:2px 8px; border-radius:6px; font-size:11px; margin-right:8px;">🔒 سرّي</span>` : "";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>${post.author || "مستخدم"}</strong>
          ${secretBadge}
        </div>
        <h4 style="margin: 0 0 6px 0; color:var(--lammio-primary);">${post.title}</h4>
        <p style="margin: 0; line-height:1.5;">${post.text}</p>
        ${mediaHtml}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = "<p style='text-align:center; color:red;'>خطأ في تحميل المنشورات.</p>";
  }
}

// ربط الدوال بالنافذة العامة لتتمكن صفحات HTML من الوصول إليها
window.login = login;
window.register = register;
window.logout = logout;
window.resetPassword = resetPassword;
window.savePost = savePost;
window.loadPosts = loadPosts;
