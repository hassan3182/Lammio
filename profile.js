export function editProfile() {

let userName = localStorage.getItem("userName") || "حسن";
let userBio = localStorage.getItem("userBio") || "مرحباً بك في Lammio";

let newName = prompt("اكتب اسمك", userName);

if (newName) {
    userName = newName;
    localStorage.setItem("userName", userName);
}

let newBio = prompt("اكتب نبذة عنك", userBio);

if (newBio) {
    userBio = newBio;
    localStorage.setItem("userBio", userBio);
}

if (window.showPage) {
    window.showPage("profile");
}

}