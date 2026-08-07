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

function showCustomAlert(message) {
  let modal = document.getElementById("customModalOverlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "customModalOverlay";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;";
    modal.innerHTML = `
      <div style="background:white; padding:20px; border-radius:12px; width:90%; max-width:350px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
        <p id="customModalText" style="margin-bottom:20px; font-size:16px; color:#1f2937;"></p>
        <button id="customModalOkBtn" style="background:#9333ea; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">موافق</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById("customModalText").innerText = message;
  document.getElementById("customModalOkBtn").onclick = () => {
    modal.style.display = "none";
  };
  modal.style.display = "flex";
}

function showCustomConfirm(message, onConfirm) {
  let modal = document.getElementById("customConfirmOverlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "customConfirmOverlay";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;";
    modal.innerHTML = `
      <div style="background:white; padding:20px; border-radius:12px; width:90%; max-width:350px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
        <p id="customConfirmText" style="margin-bottom:20px; font-size:16px; color:#1f2937;"></p>
        <div style="display:flex; gap:10px; justify-content:center;">
          <button id="customConfirmYes" style="background:#dc2626; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">موافق</button>
          <button id="customConfirmNo" style="background:#e5e7eb; color:#374151; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">إلغاء</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById("customConfirmText").innerText = message;
  modal.style.display = "flex";

  document.getElementById("customConfirmYes").onclick = () => {
    modal.style.display = "none";
    onConfirm(true);
  };
  document.getElementById("customConfirmNo").onclick = () => {
    modal.style.display = "none";
    onConfirm(false);
  };
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.email !== ADMIN_EMAIL) {
      try {
        let userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isBanned) {
          showCustomAlert("عذراً، لقد تم حظرك نهائياً من التطبيق من قبل الإدارة.");
          await signOut(auth);
          sessionStorage.removeItem("loggedIn");
          return;
        }
      } catch (e) {}
    }
    sessionStorage.setItem("loggedIn", "true");
  }
});

function formatIdentifier(identifier) {
  identifier = identifier.trim();
  if (identifier.includes("@")) {
    return { authEmail: identifier.toLowerCase(), isPhone: false, rawValue: identifier };
  }
  let cleanPhone = identifier.replace(/[^0-9]/g, "");
  return { authEmail: `phone${cleanPhone}@lammio.app`, isPhone: true, rawValue: identifier };
}

export async function loginWithIdentifier(identifier, password) {
  try {
    let formatted = formatIdentifier(identifier);
    let res = await signInWithEmailAndPassword(auth, formatted.authEmail, password);
    
    if (res.user.email !== ADMIN_EMAIL) {
      let userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (userDoc.exists() && userDoc.data().isBanned) {
        showCustomAlert("هذا الحساب محظور نهائياً.");
        await signOut(auth);
        return false;
      }
    }

    sessionStorage.setItem("loggedIn", "true");
    return true;
  } catch (error) {
    console.error("Login error:", error);
    showCustomAlert("خطأ في تسجيل الدخول: تأكد من صحة البريد أو رقم الهاتف وكلمة المرور.");
    return false;
  }
}

export async function registerWithFacebookStyle(firstName, lastName, birthDate, gender, identifier, password) {
  try {
    let formatted = formatIdentifier(identifier);
    let res = await createUserWithEmailAndPassword(auth, formatted.authEmail, password);
    
    let fullName = `${firstName.trim()} ${lastName.trim()}`;

    await setDoc(doc(db, "users", res.user.uid), {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      birthDate: birthDate,
      gender: gender,
      email: formatted.isPhone ? "" : formatted.rawValue,
      phone: formatted.isPhone ? formatted.rawValue : "",
      phoneVisibility: "private",
      avatar: "",
      isBanned: false,
      blockedUsers: []
    });
    
    sessionStorage.setItem("loggedIn", "true");
    if (window.showPage) window.showPage("home");
  } catch (error) {
    console.error("Register error:", error);
    showCustomAlert("خطأ في إنشاء الحساب: تأكد من صحة البيانات أو أن الحساب مسجل مسبقاً.");
  }
}

export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.removeItem("loggedIn");
    if (window.showPage) window.showPage("login");
  } catch (error) {}
}

export async function resetPassword(identifier) {
  if (!identifier) {
    showCustomAlert("يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً.");
    return;
  }
  try {
    let formatted = formatIdentifier(identifier);
    await sendPasswordResetEmail(auth, formatted.authEmail);
    showCustomAlert("تم إرسال رابط إعادة تعيين كلمة المرور بنجاح! 📧");
  } catch (error) {
    showCustomAlert("حدث خطأ، تأكد من صحة المدخلات.");
  }
}

export async function getUserProfile(userId = null) {
  let targetId = userId || (auth.currentUser ? auth.currentUser.uid : null);
  if (!targetId) return {};
  let userDoc = await getDoc(doc(db, "users", targetId));
  if (userDoc.exists()) {
    let data = userDoc.data();
    data.currentUserId = auth.currentUser ? auth.currentUser.uid : "";
    return data;
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
      likes: [],
      comments: [],
      createdAt: serverTimestamp()
    });
    showCustomAlert("تم النشر بنجاح!");
    window.showPage("home");
  } catch (error) {
    showCustomAlert("حدث خطأ أثناء النشر.");
  }
}

window.openUserProfileView = function(targetUserId, targetUserName) {
  if (window.showPage) {
    window.showPage("profile", targetUserId);
  }
};

window.reportUserAction = function(targetUserId) {
  let reason = prompt("يرجى كتابة سبب الإبلاغ عن هذا المستخدم:");
  if (reason && reason.trim() !== "") {
    showCustomConfirm("هل أنت متأكد من إرسال هذا البلاغ إلى الإدارة؟", async (confirmed) => {
      if (confirmed) {
        try {
          await addDoc(collection(db, "reports"), {
            reportedUserId: targetUserId,
            reporterId: auth.currentUser ? auth.currentUser.uid : "",
            reason: reason,
            createdAt: serverTimestamp()
          });
          showCustomAlert("تم إرسال البلاغ إلى الإدارة بنجاح.");
          window.showPage("home");
        } catch (err) {
          showCustomAlert("حدث خطأ أثناء إرسال البلاغ.");
        }
      }
    });
  }
};

window.blockUserPersonal = async function(targetUserId) {
  if (!auth.currentUser) return;

  try {
    let targetDoc = await getDoc(doc(db, "users", targetUserId));
    if (targetDoc.exists()) {
      let targetData = targetDoc.data();
      if (targetData.email === ADMIN_EMAIL) {
        showCustomAlert("عذراً، لا يمكنك حظر هذا الحساب (حساب الإدارة).");
        return;
      }
    }
  } catch (e) {}

  showCustomConfirm("هل تريد حظر هذا المستخدم من عندك لمنع مضايقتك؟", async (confirmed) => {
    if (confirmed) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          blockedUsers: arrayUnion(targetUserId)
        });
        showCustomAlert("تم حظر المستخدم بنجاح.");
        window.showPage("home");
      } catch (e) {
        showCustomAlert("خطأ في عملية الحظر.");
      }
    }
  });
};

window.unblockUserPersonal = async function(targetUserId) {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      blockedUsers: arrayRemove(targetUserId)
    });
    if (window.showPage) window.showPage("profile");
  } catch (e) {
    showCustomAlert("خطأ في إلغاء الحظر.");
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

window.loadAdminReports = async function() {
  const container = document.getElementById("reportsListContainer");
  if (!container) return;

  if (!checkIsAdmin()) {
    container.innerHTML = "<p style='color:red;'>عذراً، هذه الصفحة مخصصة للأدمن فقط.</p>";
    return;
  }

  try {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    container.innerHTML = "";
    if (querySnapshot.empty) {
      container.innerHTML = "<p>لا توجد بلاغات حالياً.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      let rep = docSnap.data();
      let div = document.createElement("div");
      div.style.cssText = "background:rgba(255,255,255,0.6); padding:12px; border-radius:10px; margin-bottom:10px; border-right:4px solid #e11d48;";
      div.innerHTML = `
        <p style="margin:0 0 6px 0;"><strong>المستخدم المُبلغ عنه ID:</strong> ${rep.reportedUserId}</p>
        <p style="margin:0;"><strong>السبب:</strong> ${rep.reason}</p>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p style='color:red;'>خطأ في تحميل البلاغات.</p>";
  }
};

window.loadAdminUsers = async function() {
  const container = document.getElementById("usersListContainer");
  if (!container) return;

  if (!checkIsAdmin()) {
    container.innerHTML = "<p style='color:red;'>عذراً، هذه اللوحة مخصصة للأدمن فقط.</p>";
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
      
      if (uData.email === ADMIN_EMAIL) return;

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
  showCustomConfirm(status ? "هل تريد حقاً حظر هذا المستخدم نهائياً من التطبيق؟" : "هل تريد إلغاء الحظر النهائي عن هذا المستخدم؟", async (confirmed) => {
    if (confirmed) {
      try {
        await updateDoc(doc(db, "users", userId), {
          isBanned: status
        });
        window.loadAdminUsers();
      } catch (e) {
        showCustomAlert("خطأ في تنفيذ الإجراء.");
      }
    }
  });
};

// تعديل الليكات بحيث تزيد تدريجياً حسب عدد المستخدمين الذين ضغطوا عليها
window.toggleLike = async function(postId, btnElement) {
  if (!auth.currentUser) {
    showCustomAlert("يجب تسجيل الدخول للإعجاب بالمنشور.");
    return;
  }
  let userId = auth.currentUser.uid;
  let postRef = doc(db, "posts", postId);

  try {
    let postDoc = await getDoc(postRef);
    if (!postDoc.exists()) return;
    let postData = postDoc.data();
    let likes = postData.likes || [];
    let hasLiked = likes.includes(userId);

    let newLikesCount;
    if (hasLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(userId)
      });
      newLikesCount = likes.length - 1;
      btnElement.innerHTML = `👍 أعجبني ${newLikesCount > 0 ? '(' + newLikesCount + ')' : ''}`;
      btnElement.style.color = "#555";
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(userId)
      });
      newLikesCount = likes.length + 1;
      btnElement.innerHTML = `❤️ أعجبني (${newLikesCount})`;
      btnElement.style.color = "#e11d48";
    }
  } catch (e) {
    showCustomAlert("حدث خطأ أثناء تسجيل الإعجاب.");
  }
};

// إضافة وظيفة إضافة وعرض التعليقات بوضوح داخل صفحة تفاصيل المنشور
window.addCommentToPost = async function(postId) {
  let commentInput = document.getElementById(`commentInput_${postId}`);
  if (!commentInput) return;
  let commentText = commentInput.value.trim();

  if (!commentText) {
    showCustomAlert("يرجى كتابة نص التعليق أولاً.");
    return;
  }

  let profile = await getUserProfile();
  let userName = profile.name || "مستخدم";
  let userAvatar = profile.avatar || "https://via.placeholder.com/30";

  let newComment = {
    userId: auth.currentUser ? auth.currentUser.uid : "",
    author: userName,
    avatar: userAvatar,
    text: commentText,
    createdAt: new Date().toISOString()
  };

  try {
    let postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });
    commentInput.value = "";
    openPostDetails(postId); // تحديث صفحة المنشور لإظهار التعليق الجديد فوراً
  } catch (e) {
    showCustomAlert("حدث خطأ أثناء إضافة التعليق.");
  }
};

window.openPostDetails = async function(postId) {
  let content = document.getElementById("appContent");
  if (!content) return;

  content.innerHTML = `<p style="text-align:center;">جاري تحميل المنشور والتعليقات...</p>`;

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

    let managementButtonsHtml = "";
    if (isAdmin || (post.authorId && post.authorId === currentUserId)) {
      managementButtonsHtml = `
        <div style="display:flex; gap:8px; margin-top:15px; border-top:1px solid rgba(0,0,0,0.08); padding-top:12px;">
          <button class="edit-btn" onclick="editPostUser('${postId}', '${post.authorId || ''}', '${post.title.replace(/'/g, "\\'")}', '${post.text.replace(/'/g, "\\\\'")}')">✏️ تعديل المنشور</button>
          <button class="danger-btn" onclick="deletePostUser('${postId}', '${post.authorId || ''}')">🗑️ حذف المنشور</button>
        </div>
      `;
    }

    let commentsList = post.comments || [];
    let commentsHtml = "";
    if (commentsList.length === 0) {
      commentsHtml = `<p style="color:#666; font-size:13px; text-align:center; margin:10px 0;">لا توجد تعليقات حتى الآن. كن أول المعلقين!</p>`;
    } else {
      commentsList.forEach(c => {
        commentsHtml += `
          <div style="background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:8px; margin-bottom:8px; font-size:13px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <img src="${c.avatar || 'https://via.placeholder.com/24'}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
              <strong>${c.author}</strong>
            </div>
            <p style="margin:0; padding-right:30px; color:#333;">${c.text}</p>
          </div>
        `;
      });
    }

    content.innerHTML = `
      <button style="background:transparent; border:none; color:var(--lammio-primary); font-weight:bold; cursor:pointer; margin-bottom:10px;" onclick="showPage('home')">← العودة للرئيسية</button>
      <div class="post">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="openUserProfileView('${post.authorId}', '${post.author}')">
            <img src="${post.authorAvatar || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
            <strong>${post.author || "مستخدم"}</strong>
          </div>
        </div>
        <h3 style="margin: 0 0 8px 0; color:var(--lammio-primary);">${post.title}</h3>
        <p style="margin: 0; line-height:1.6;">${post.text}</p>
        ${mediaHtml}
        ${managementButtonsHtml}

        <div style="margin-top:20px; border-top:1px solid rgba(0,0,0,0.1); padding-top:15px;">
          <h4 style="margin:0 0 10px 0; font-size:15px; color:var(--lammio-primary);">التعليقات (${commentsList.length})</h4>
          <div style="margin-bottom:12px; display:flex; gap:6px;">
            <input type="text" id="commentInput_${postId}" placeholder="اكتب تعليقاً..." style="flex:1; padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:13px;">
            <button type="button" style="background:var(--lammio-primary); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="addCommentToPost('${postId}')">إرسال</button>
          </div>
          <div>${commentsHtml}</div>
        </div>
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
    showCustomConfirm("هل أنت متأكد من حذف هذا المنشور؟", async (confirmed) => {
      if (confirmed) {
        try {
          await deleteDoc(doc(db, "posts", postId));
          showPage("home");
        } catch (e) {
          showCustomAlert("خطأ في الحذف.");
        }
      }
    });
  } else {
    showCustomAlert("ليس لديك الصلاحية لحذف هذا المنشور.");
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

    showCustomConfirm("هل أنت متأكد من تعديل العنوان؟", async (confirmed) => {
      if (confirmed) {
        try {
          await updateDoc(doc(db, "posts", postId), {
            title: newTitle,
            text: newText
          });
          openPostDetails(postId);
        } catch (e) {
          showCustomAlert("خطأ في التعديل.");
        }
      }
    });
  } else {
    showCustomAlert("ليس لديك الصلاحية لتعديل هذا المنشور.");
  }
};

export async function loadPosts() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center;'>جاري تحميل المنشورات...</p>";

  try {
    let profile = await getUserProfile();
    let blockedUsers = profile.blockedUsers || [];

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
      card.style.cursor = "pointer";
      card.onclick = (e) => {
        if(e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
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

      let likesArr = post.likes || [];
      let currentUserId = auth.currentUser ? auth.currentUser.uid : "";
      let isLikedByMe = likesArr.includes(currentUserId);
      let likeBtnText = isLikedByMe ? `❤️ أعجبني (${likesArr.length})` : `👍 أعجبني ${likesArr.length > 0 ? '(' + likesArr.length + ')' : ''}`;
      let likeBtnColor = isLikedByMe ? "#e11d48" : "#555";
      let commentsCount = (post.comments || []).length;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="openUserProfileView('${post.authorId}', '${post.author}')">
            <img src="${post.authorAvatar || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
            <strong>${post.author || "مستخدم"}</strong>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${secretBadge}
          </div>
        </div>
        <h4 style="margin: 0 0 6px 0; color:var(--lammio-primary);">${post.title}</h4>
        <p style="margin: 0 0 10px 0; line-height:1.5;">${post.text}</p>
        ${mediaHtml}
        
        <div style="display:flex; justify-content:space-around; border-top:1px solid rgba(0,0,0,0.06); padding-top:10px; margin-top:12px; color:#555; font-size:13px; font-weight:bold;">
          <button type="button" style="background:none; border:none; cursor:pointer; font-weight:bold; color:${likeBtnColor};" onclick="toggleLike('${postId}', this)">${likeBtnText}</button>
          <button type="button" style="background:none; border:none; cursor:pointer; font-weight:bold; color:#555;" onclick="openPostDetails('${postId}')">💬 تعليق (${commentsCount})</button>
          <button type="button" style="background:none; border:none; cursor:pointer; font-weight:bold; color:#555;" onclick="navigator.clipboard.writeText(window.location.href); showCustomAlert('تم نسخ رابط المنشور بنجاح!');">↗️ مشاركة</button>
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

window.showPage = async function(page, userId = null) {
  if (page !== "login" && page !== "register" && sessionStorage.getItem("loggedIn") !== "true") {
    window.showPage("login");
    return;
  }

  let content = document.getElementById("appContent");
  if (!content) return;

  if (page === "login") {
    content.innerHTML = `
      <div class="post" style="max-width: 400px; margin: 40px auto;">
        <h3 style="text-align: center; color: var(--lammio-primary); margin-bottom: 20px;">تسجيل الدخول إلى Lammio</h3>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px;">البريد الإلكتروني أو رقم الهاتف الحقيقي:</label>
          <input type="text" id="loginIdentifier" placeholder="مثال: 01012345678 أو email@domain.com">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px;">كلمة المرور:</label>
          <input type="password" id="loginPassword" placeholder="••••••••">
        </div>
        <button type="button" class="mainButton" onclick="handleLoginSubmit(event)">تسجيل الدخول</button>
        <p style="text-align: center; margin-top: 15px; font-size: 13px;">
          ليس لديك حساب؟ <a href="#" onclick="showPage('register'); return false;" style="color: var(--lammio-primary); font-weight: bold;">إنشاء حساب جديد</a>
        </p>
      </div>
    `;
  }
  else if (page === "register") {
    content.innerHTML = `
      <div class="post" style="max-width: 400px; margin: 40px auto;">
        <h3 style="text-align: center; color: var(--lammio-primary); margin-bottom: 10px;">إنشاء حساب جديد</h3>
        <p style="text-align: center; color: #666; font-size: 13px; margin-bottom: 20px;">سريع وسهل.</p>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="regFirstName" placeholder="الاسم الأول" style="flex:1;">
          <input type="text" id="regLastName" placeholder="اسم العائلة" style="flex:1;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #555;">تاريخ الميلاد:</label>
          <input type="date" id="regBirthDate" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 12px; color: #555;">الجنس:</label>
          <select id="regGender" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <input type="text" id="regIdentifier" placeholder="رقم الهاتف الحقيقي أو البريد الإلكتروني">
        </div>

        <div style="margin-bottom: 20px;">
          <input type="password" id="regPassword" placeholder="كلمة مرور جديدة">
        </div>

        <button type="button" class="mainButton" style="background:#10b981;" onclick="handleRegisterSubmit(event)">إنشاء الحساب</button>
        
        <p style="text-align: center; margin-top: 15px; font-size: 13px;">
          لديك حساب بالفعل؟ <a href="#" onclick="showPage('login'); return false;" style="color: var(--lammio-primary); font-weight: bold;">تسجيل الدخول</a>
        </p>
      </div>
    `;
  }
  else if (page === "home") {
    content.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(8px); padding: 10px; border-radius: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--lammio-glass-border);">
        <div style="width:36px; height:36px; background:#ddd; border-radius:50%;"></div>
        <div onclick="showPage('post')" style="flex:1; background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:20px; color:#666; cursor:pointer; font-size:14px;">بم تفكر في Lammio؟</div>
      </div>
      <div id="postsContainer">جاري تحميل المنشورات...</div>
    `;
    if (window.loadPosts) window.loadPosts();
  } 
  else if (page === "profile") {
    let profileData = window.getUserProfile ? await window.getUserProfile(userId) : {};
    let isOtherUser = userId && userId !== profileData.currentUserId;

    content.innerHTML = `
      <div class="post">
        <h3 style="color: var(--lammio-primary); margin-bottom:15px;">${isOtherUser ? 'الملف الشخصي' : 'تعديل الملف الشخصي'}</h3>
        
        <div style="text-align:center; margin-bottom:15px;">
          <img id="currentAvatar" src="${profileData.avatar || 'https://via.placeholder.com/80'}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--lammio-primary);">
        </div>

        <div id="profileDetailsArea">
          <label style="font-size:13px; font-weight:bold;">الاسم:</label>
          <input type="text" id="profileName" value="${profileData.name || ''}" ${isOtherUser ? 'readonly' : ''} placeholder="اسمك الكامل">

          <label style="font-size:13px; font-weight:bold;">رقم الهاتف أو الإيميل الحقيقي:</label>
          <input type="text" id="profilePhone" value="${profileData.phone || profileData.email || ''}" ${isOtherUser ? 'readonly' : ''} placeholder="رقم الهاتف">

          ${!isOtherUser ? `
            <label style="font-size:13px; font-weight:bold;">حالة رقم الهاتف:</label>
            <select id="phoneVisibility">
              <option value="public" ${profileData.phoneVisibility === 'public' ? 'selected' : ''}>مرئي للجميع</option>
              <option value="private" ${profileData.phoneVisibility === 'private' ? 'selected' : ''}>مخفي</option>
            </select>
            <button class="mainButton" onclick="saveProfileChanges()">حفظ التعديلات</button>
          ` : `
            <div style="display: flex; gap: 10px; margin-top: 15px;">
              <button class="danger-btn" style="flex:1; padding: 12px;" onclick="blockUserPersonal('${userId}')">🚫 حظر</button>
              <button class="secondaryButton" style="flex:1; margin-top:0;" onclick="reportUserAction('${userId}')">⚠️ إبلاغ</button>
            </div>
          `}
        </div>
      </div>

      ${!isOtherUser ? `
        <div class="post">
          <h4 style="color:var(--lammio-primary); margin-bottom:10px;">🚫 قائمة المحظورين شخصياً</h4>
          <div id="blockedUsersContainer">جاري التحميل...</div>
        </div>
      ` : ''}
    `;
    if (!isOtherUser && window.loadBlockedUsersList) window.loadBlockedUsersList();
  }
  else if (page === "adminPanel") {
    content.innerHTML = `
      <div class="post">
        <h3 style="color: var(--lammio-primary); margin-bottom:15px;">🛡️ لوحة تحكم المالك (Admin)</h3>
        <p style="font-size:13px; color:#555;">إدارة مستخدمي التطبيق وحظرهم نهائياً:</p>
        <div id="usersListContainer">جاري تحميل المستخدمين...</div>
      </div>
    `;
    if (window.loadAdminUsers) window.loadAdminUsers();
  }
  else if (page === "adminReports") {
    content.innerHTML = `
      <div class="post">
        <h3 style="color: var(--lammio-primary); margin-bottom:15px;">🚨 إدارة البلاغات</h3>
        <p style="font-size:13px; color:#555;">جميع البلاغات المقدمة من المستخدمين:</p>
        <div id="reportsListContainer">جاري تحميل البلاغات...</div>
      </div>
    `;
    if (window.loadAdminReports) window.loadAdminReports();
  }
  else if (page === "post") {
    content.innerHTML = `
      <div class="post">
        <h3 style="margin-bottom:12px; color: var(--lammio-primary);">إنشاء منشور جديد</h3>
        <input id="title" placeholder="عنوان المنشور">
        <textarea id="postText" rows="4" placeholder="بم تفكر؟"></textarea>
        
        <div style="background:rgba(255, 255, 255, 0.4); padding:10px; border-radius:10px; margin:10px 0;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="isSecret" style="width:auto; margin:0;" onchange="document.getElementById('secretPassInput').style.display = this.checked ? 'block' : 'none'">
            <strong>🔒 منشور في غرفة الأسرار</strong>
          </label>
          <input type="password" id="secretPassInput" placeholder="كلمة السر للمنشور" style="display:none; margin-top:8px;">
        </div>

        <label style="display:block; margin:8px 0; font-size:13px; font-weight:bold;">اختر صورة أو فيديو:</label>
        <input type="file" id="mediaInput" accept="image/*,video/*">

        <button class="mainButton" id="publishBtn" onclick="handlePublishSubmit(event)">نشر في Lammio</button>
      </div>
    `;
  } 
  else if (page === "menu") {
    let profileData = window.getUserProfile ? await window.getUserProfile() : {};
    let isAdmin = window.checkIsAdmin ? await window.checkIsAdmin() : false;
    
    let adminButtonsHtml = isAdmin ? `
      <div class="menu-card" style="background:#fef3c7; border-color:#f59e0b;" onclick="showPage('adminPanel')">🛡️ لوحة التحكم</div>
      <div class="menu-card" style="background:#fee2e2; border-color:#ef4444;" onclick="showPage('adminReports')">🚨 البلاغات</div>
    ` : `
      <div class="menu-card" onclick="showPage('search')">🔍 البحث</div>
    `;

    content.innerHTML = `
      <div class="post" style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="showPage('profile')">
        <img src="${profileData.avatar || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">
        <div>
          <h4 style="margin:0;">${profileData.name || 'مستخدم Lammio'}</h4>
          <span style="font-size:13px; color:#666;">اضغط لتعديل الملف الشخصي</span>
        </div>
      </div>

      <div class="menu-grid">
        <div class="menu-card" onclick="showPage('profile')">👤 الملف الشخصي</div>
        <div class="menu-card" onclick="showPage('friends')">👥 الأصدقاء</div>
        <div class="menu-card" onclick="showPage('messages')">💬 الرسائل</div>
        <div class="menu-card" onclick="showPage('saved')">📌 المحفوظات</div>
        <div class="menu-card" onclick="showPage('secrets')">🔒 غرفة الأسرار</div>
        ${adminButtonsHtml}
      </div>

      <button class="logout-btn" onclick="logoutApp()">🚪 تسجيل الخروج</button>
    `;
  }
  else {
    content.innerHTML = `<div class="post"><h3 style="color: var(--lammio-primary);">${page}</h3><p>قيد التطوير...</p></div>`;
  }
};

window.handleLoginSubmit = async function(event) {
  if (event) event.preventDefault();
  let identifier = document.getElementById("loginIdentifier").value;
  let password = document.getElementById("loginPassword").value;
  if (!identifier || !password) {
    showCustomAlert("يرجى إدخال البريد أو رقم الهاتف وكلمة المرور.");
    return;
  }
  let success = await loginWithIdentifier(identifier, password);
  if (success) {
    window.showPage("home");
  }
};

window.handleRegisterSubmit = async function(event) {
  if (event) event.preventDefault();
  let firstName = document.getElementById("regFirstName").value;
  let lastName = document.getElementById("regLastName").value;
  let birthDate = document.getElementById("regBirthDate").value;
  let gender = document.getElementById("regGender").value;
  let identifier = document.getElementById("regIdentifier").value;
  let password = document.getElementById("regPassword").value;

  if (!firstName || !lastName || !identifier || !password) {
    showCustomAlert("يرجى ملء جميع الحقول المطلوبة.");
    return;
  }

  await registerWithFacebookStyle(firstName, lastName, birthDate, gender, identifier, password);
};

window.handlePublishSubmit = async function(event) {
  if (event) event.preventDefault();
  let title = document.getElementById("title").value;
  let text = document.getElementById("postText").value;
  let isSecret = document.getElementById("isSecret").checked;
  let secretPass = document.getElementById("secretPassInput").value;
  let mediaFile = document.getElementById("mediaInput").files[0];

  if (!title || !text) {
    showCustomAlert("يرجى كتابة العنوان والنص للمنشور.");
    return;
  }

  await savePost(title, text, isSecret, secretPass, mediaFile);
};

window.logoutApp = function() {
  logout();
};

window.loginWithIdentifier = loginWithIdentifier;
window.registerWithFacebookStyle = registerWithFacebookStyle;
window.logout = logout;
window.resetPassword = resetPassword;
window.savePost = savePost;
window.loadPosts = loadPosts;
window.getUserProfile = getUserProfile;
window.updateProfile = updateProfile;
window.checkIsAdmin = checkIsAdmin;
