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
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query, 
  orderBy, 
  serverTimestamp 
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
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "hassanasaad212@gmail.com"; 

export function checkIsAdmin() {
  if (!auth.currentUser) return false;
  return auth.currentUser.email === ADMIN_EMAIL;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    let userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().isBanned) {
      alert("عذراً، لقد تم حظرك نهائياً من التطبيق من قبل الإدارة.");
      await signOut(auth);
      sessionStorage.removeItem("loggedIn");
      window.location.reload();
      return;
    }
    sessionStorage.setItem("loggedIn", "true");
  } else {
    sessionStorage.removeItem("loggedIn");
  }
});

function formatIdentifier(identifier) {
  identifier = identifier.trim();
  if (identifier.includes("@")) {
    return identifier;
  } else {
    let cleanPhone = identifier.replace(/[^0-9]/g, "");
    return `${cleanPhone}@lammio.phone`;
  }
}

export async function loginWithIdentifier(identifier, password) {
  try {
    let emailToUse = formatIdentifier(identifier);
    let res = await signInWithEmailAndPassword(auth, emailToUse, password);
    let userDoc = await getDoc(doc(db, "users", res.user.uid));
    if (userDoc.exists() && userDoc.data().isBanned) {
      alert("هذا الحساب محظور نهائياً.");
      await signOut(auth);
      return false;
    }
    sessionStorage.setItem("loggedIn", "true");
    return true;
  } catch (error) {
    alert("خطأ: تأكد من صحة البريد/الهاتف أو كلمة المرور.");
    return false;
  }
}

export async function registerWithIdentifier(identifier, password) {
  try {
    let emailToUse = formatIdentifier(identifier);
    let res = await createUserWithEmailAndPassword(auth, emailToUse, password);
    
    let isPhone = !identifier.includes("@");
    await setDoc(doc(db, "users", res.user.uid), {
      email: isPhone ? "" : identifier,
      phone: isPhone ? identifier : "",
      name: "مستخدم Lammio",
      phoneVisibility: "private",
      avatar: "",
      isBanned: false,
      blockedUsers: []
    });
    sessionStorage.setItem("loggedIn", "true");
    if (window.showPage) window.showPage("home");
  } catch (error) {
    alert("خطأ في إنشاء الحساب: هذا الحساب مستخدم من قبل أو كلمة المرور ضعيفة.");
  }
}

export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.removeItem("loggedIn");
    window.location.reload();
  } catch (error) {}
}

export async function resetPassword(identifier) {
  if (!identifier) {
    alert("يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً.");
    return;
  }
  try {
    let emailToUse = formatIdentifier(identifier);
    await sendPasswordResetEmail(auth, emailToUse);
    alert("تم إرسال رابط إعادة تعيين كلمة المرور بنجاح! 📧");
  } catch (error) {
    alert("حدث خطأ، تأكد من صحة المدخلات.");
  }
}

export async function getUserProfile() {
  if (!auth.currentUser) return {};
  let userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return { name: "مستخدم Lammio", phone: "", phoneVisibility: "private", avatar: "", blockedUsers: [] };
}

export async function updateProfile(name, phone, phoneVisibility, avatarFile) {
  if (!auth.currentUser) return;
  let avatarBase64 = "";
  if (avatarFile) {
    avatarBase64 = await convertFileToBase64(avatarFile);
  } else {
    let current = await getUserProfile();
    avatarBase64 = current.avatar || "";
  }

  await setDoc(doc(db, "users", auth.currentUser.uid), {
    name: name || "مستخدم Lammio",
    phone: phone || "",
    phoneVisibility: phoneVisibility || "private",
    avatar: avatarBase64
  }, { merge: true });
}

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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    };
  });
}

async function convertFileToBase64(file) {
  if (!file) return null;
  if (file.type.startsWith("image/")) {
    return await compressImage(file);
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}

export async function savePost(title, text, isSecret, secretPass, mediaFile) {
  try {
    let mediaBase64 = null;
    let mediaType = "";

    if (mediaFile) {
      mediaBase64 = await convertFileToBase64(mediaFile);
      mediaType = mediaFile.type.startsWith("image/") ? "image" : "video";
    }

    let profile = await getUserProfile();
    let authorName = profile.name || "مستخدم";

    await addDoc(collection(db, "posts"), {
      title: title,
      text: text,
      authorId: auth.currentUser ? auth.currentUser.uid : "",
      author: authorName,
      authorAvatar: profile.avatar || "",
      isSecret: isSecret,
      secretPass: secretPass || "",
      mediaUrl: mediaBase64,
      mediaType: mediaType,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    alert("حدث خطأ أثناء النشر.");
  }
}

window.blockUserPersonal = async function(targetUserId) {
  if (!auth.currentUser) return;
  if (confirm("هل تريد حظر هذا المستخدم لمنع مضايقتك؟")) {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        blockedUsers: arrayUnion(targetUserId)
      });
      loadPosts();
    } catch (e) {
      alert("خطأ في عملية الحظر.");
    }
  }
};

window.unblockUserPersonal = async function(targetUserId) {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      blockedUsers: arrayRemove(targetUserId)
    });
    if (window.showPage) window.showPage("profile");
  } catch (e) {
    alert("خطأ في إلغاء الحظر.");
  }
};

window.loadBlockedUsersList = async function() {
  let container = document.getElementById("blockedUsersContainer");
  if (!container) return;
  let profile = await getUserProfile();
  let blockedArr = profile.blockedUsers || [];

  if (blockedArr.length === 0) {
    container.innerHTML = "<p style='font-size:13px; color:#666;'>لا توجد حسابات محظورة شخصياً.</p>";
    return;
  }

  container.innerHTML = "";
  for (let bId of blockedArr) {
    let uDoc = await getDoc(doc(db, "users", bId));
    let uName = uDoc.exists() ? (uDoc.data().name || "مستخدم") : "مستخدم محذوف";
    
    let div = document.createElement("div");
    div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.6); padding:8px 12px; border-radius:8px; margin-bottom:6px; font-size:14px;";
    div.innerHTML = `
      <span>${uName}</span>
      <button style="background:#10b981; color:white; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;" onclick="unblockUserPersonal('${bId}')">إلغاء الحظر</button>
    `;
    container.appendChild(div);
  }
};

// الدخول لتفاصيل المنشور (مثل النقر على المنشور لعرضه وحده مع خيارات التعديل والحذف إن كان المالك أو الأدمن)
window.openPostDetails = async function(postId) {
  let content = document.getElementById("appContent");
  if (!content) return;

  content.innerHTML = `<p style="text-align:center;">جاري تحميل المنشور...</p>`;

  try {
    let postDoc = await getDoc(doc(db, "posts", postId));
    if (!postDoc.exists()) {
      content.innerHTML = `<p style="text-align:center; color:red;">هذا المنشور غير موجود أو تم حذفه.</p>`;
      return;
    }

    let post = postDoc.data();
    let isAdmin = checkIsAdmin();
    let currentUserId = auth.currentUser ? auth.currentUser.uid : "";

    let mediaHtml = "";
    if (post.mediaUrl) {
      if (post.mediaType === "image") {
        mediaHtml = `<img src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:400px; object-fit:cover;">`;
      } else if (post.mediaType === "video") {
        mediaHtml = `<video controls src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:400px;"></video>`;
      }
    }

    // تظهر أزرار التعديل والحذف هنا حصراً داخل صفحة المنشور المفردة لصاحب المنشور أو الأدمن
    let managementButtonsHtml = "";
    if (isAdmin || (post.authorId && post.authorId === currentUserId)) {
      managementButtonsHtml = `
        <div style="display:flex; gap:8px; margin-top:15px; border-top:1px solid rgba(0,0,0,0.08); padding-top:12px;">
          <button class="edit-btn" onclick="editPostUser('${postId}', '${post.authorId || ''}', '${post.title.replace(/'/g, "\\'")}', '${post.text.replace(/'/g, "\\'")}')">✏️ تعديل المنشور</button>
          <button class="danger-btn" onclick="deletePostUser('${postId}', '${post.authorId || ''}')">🗑️ حذف المنشور</button>
        </div>
      `;
    }

    content.innerHTML = `
      <button style="background:transparent; border:none; color:var(--lammio-primary); font-weight:bold; cursor:pointer; margin-bottom:10px;" onclick="showPage('home')">← العودة للرئيسية</button>
      <div class="post">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${post.authorAvatar || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
            <strong>${post.author || "مستخدم"}</strong>
          </div>
        </div>
        <h3 style="margin: 0 0 8px 0; color:var(--lammio-primary);">${post.title}</h3>
        <p style="margin: 0; line-height:1.6;">${post.text}</p>
        ${mediaHtml}
        ${managementButtonsHtml}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<p style="text-align:center; color:red;">خطأ في تحميل تفاصيل المنشور.</p>`;
  }
};

window.deletePostUser = async function(postId, authorId) {
  let isAdmin = checkIsAdmin();
  let currentUserId = auth.currentUser ? auth.currentUser.uid : "";

  if (isAdmin || authorId === currentUserId) {
    if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        showPage("home");
      } catch (e) {
        alert("خطأ في الحذف.");
      }
    }
  } else {
    alert("ليس لديك الصلاحية لحذف هذا المنشور.");
  }
};

window.editPostUser = async function(postId, authorId, currentTitle, currentText) {
  let isAdmin = checkIsAdmin();
  let currentUserId = auth.currentUser ? auth.currentUser.uid : "";

  if (isAdmin || authorId === currentUserId) {
    let newTitle = prompt("تعديل العنوان:", currentTitle);
    if (newTitle === null) return;
    let newText = prompt("تعديل النص:", currentText);
    if (newText === null) return;

    try {
      await updateDoc(doc(db, "posts", postId), {
        title: newTitle,
        text: newText
      });
      openPostDetails(postId);
    } catch (e) {
      alert("خطأ في التعديل.");
    }
  } else {
    alert("ليس لديك الصلاحية لتعديل هذا المنشور.");
  }
};

window.loadAdminUsers = async function() {
  const container = document.getElementById("usersListContainer");
  if (!container) return;

  if (!checkIsAdmin()) {
    container.innerHTML = "<p style='color:red;'>عذراً، هذه اللوحة مخصصة لمالك التطبيق فقط.</p>";
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = "<p>لا توجد حسابات مسجلة.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      let uData = docSnap.data();
      let uId = docSnap.id;
      let div = document.createElement("div");
      div.style.cssText = "background:rgba(255,255,255,0.6); padding:10px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;";

      let banStatus = uData.isBanned ? `<span style="color:red; font-weight:bold;">(محظور نهائياً)</span>` : `<span style="color:green;">(نشط)</span>`;
      let banBtnText = uData.isBanned ? "إلغاء الحظر النهائي" : "حظر نهائي من التطبيق";
      let banBtnColor = uData.isBanned ? "#10b981" : "#e11d48";

      div.innerHTML = `
        <div>
          <strong>${uData.name || 'مبدئي'}</strong> ${banStatus}<br>
          <small style="color:#666;">${uData.email || uData.phone || uId}</small>
        </div>
        <div style="display:flex; gap:6px;">
          <button style="background:${banBtnColor}; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px;" onclick="toggleBanUser('${uId}', ${!uData.isBanned})">${banBtnText}</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p style='color:red;'>خطأ في تحميل المستخدمين.</p>";
  }
};

window.toggleBanUser = async function(userId, status) {
  if (confirm(status ? "هل تريد حقاً حظر هذا المستخدم نهائياً من التطبيق؟" : "هل تريد إلغاء الحظر النهائي عن هذا المستخدم؟")) {
    try {
      await updateDoc(doc(db, "users", userId), {
        isBanned: status
      });
      window.loadAdminUsers();
    } catch (e) {
      alert("خطأ في تنفيذ الإجراء.");
    }
  }
};

export async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;'>جاري تحميل المنشورات...</p>";

  try {
    let profile = await getUserProfile();
    let blockedUsers = profile.blockedUsers || [];
    let currentUserId = auth.currentUser ? auth.currentUser.uid : "";

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = "<p style='text-align:center; color:#555;'>لا توجد منشورات حتى الآن.</p>";
      return;
    }

    let hasVisiblePosts = false;

    querySnapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;

      if (blockedUsers.includes(post.authorId)) return;

      hasVisiblePosts = true;
      const card = document.createElement("div");
      card.className = "post";
      // جعل النقر على المنشور يفتح تفاصيله (مثل فيسبوك)
      card.style.cursor = "pointer";
      card.onclick = (e) => {
        // عدم تفعيل النقر لو ضغط على زر الحظر الجانبي
        if(e.target.tagName === 'BUTTON') return;
        openPostDetails(postId);
      };

      let mediaHtml = "";
      if (post.mediaUrl) {
        if (post.mediaType === "image") {
          mediaHtml = `<img src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:250px; object-fit:cover;">`;
        } else if (post.mediaType === "video") {
          mediaHtml = `<video controls src="${post.mediaUrl}" style="width:100%; border-radius:12px; margin-top:10px; max-height:250px;"></video>`;
        }
      }

      let secretBadge = post.isSecret ? `<span style="background:#e11d48; color:white; padding:2px 8px; border-radius:6px; font-size:11px; margin-right:8px;">🔒 سرّي</span>` : "";

      let blockOptionHtml = "";
      if (post.authorId && post.authorId !== currentUserId) {
        blockOptionHtml = `<button style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer;" onclick="blockUserPersonal('${post.authorId}')">حظر المستخدم</button>`;
      }

      // الصفحة الرئيسية تعرض فقط: (اللايك، التعليق، المشاركة) وأزرار تفاعلية شبيهة بفيسبوك وخالية تماماً من زر التعديل أو الحذف العلني
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${post.authorAvatar || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
            <strong>${post.author || "مستخدم"}</strong>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${secretBadge}
            ${blockOptionHtml}
          </div>
        </div>
        <h4 style="margin: 0 0 6px 0; color:var(--lammio-primary);">${post.title}</h4>
        <p style="margin: 0 0 10px 0; line-height:1.5;">${post.text}</p>
        ${mediaHtml}
        
        <div style="display:flex; justify-content:space-around; border-top:1px solid rgba(0,0,0,0.06); padding-top:10px; margin-top:12px; color:#555; font-size:13px; font-weight:bold;">
          <span>👍 أعجبني</span>
          <span>💬 تعليق</span>
          <span>↗️ مشاركة</span>
        </div>
      `;
      container.appendChild(card);
    });

    if (!hasVisiblePosts) {
      container.innerHTML = "<p style='text-align:center; color:#555;'>لا توجد منشورات متاحة.</p>";
    }
  } catch (error) {
    container.innerHTML = "<p style='text-align:center; color:red;'>خطأ في تحميل المنشورات.</p>";
  }
}

window.loginWithIdentifier = loginWithIdentifier;
window.registerWithIdentifier = registerWithIdentifier;
window.logout = logout;
window.resetPassword = resetPassword;
window.savePost = savePost;
window.loadPosts = loadPosts;
window.getUserProfile = getUserProfile;
window.updateProfile = updateProfile;
window.checkIsAdmin = checkIsAdmin;
