// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB16GvAnHD1GYNu4ikS4GU8Wba5vPvIFOs",
    authDomain: "pptai-5fb76.firebaseapp.com",
    projectId: "pptai-5fb76",
    storageBucket: "pptai-5fb76.firebasestorage.app",
    messagingSenderId: "1034727400796",
    appId: "1:1034727400796:web:810d4b9d53923c43ab4d99",
    measurementId: "G-TDLR2Q3KK3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Function to register users with email and password
export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        alert("Registration successful!");
        window.location.href = "index.html"; // Redirect after successful registration
    } catch (error) {
        console.error("Registration error:", error.code, error.message);
        alert(error.message);
    }
};

// Function to log in users with email and password
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        window.location.href = "index.html"; // Redirect after successful login
    } catch (error) {
        console.error("Login error:", error.code, error.message);
        alert(error.message);
    }
};

// Function for Google sign-in
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("User signed in with Google:", result.user);
        window.location.href = "index.html"; // Redirect after Google sign-in
    } catch (error) {
        console.error("Google Sign-In Error:", error.code, error.message);
        alert(error.message);
    }
};

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        updateNavbarForLoggedInUser(user);
    } else {
        console.log("No user is signed in.");
        updateNavbarForGuest();
    }
});

// Update Navbar for Logged-in Users
const updateNavbarForLoggedInUser = (user) => {
    const authButtons = document.querySelector(".auth-buttons");
    authButtons.innerHTML = `
        <div class="user-profile">
            <img src="${user.photoURL || 'default-profile.png'}" alt="${user.displayName || 'User'}" class="profile-pic">
            <span class="user-name">${user.displayName || 'User'}</span>
            <button class="btn logout-btn" onclick="signOutUser()">Logout</button>
        </div>
    `;
    document.querySelector(".logout-btn").addEventListener("click", signOutUser);
};

// Update Navbar for Guests
const updateNavbarForGuest = () => {
    const authButtons = document.querySelector(".auth-buttons");
    authButtons.innerHTML = `
    <button class="sign-up-btn" onclick="window.location.href='signup.html'">Sign Up</button>
        <button class="sign-in-btn" onclick="window.location.href='signin.html'">Sign In</button>
    `;
};

// Function to sign out users
export const signOutUser = async () => {
    try {
        await signOut(auth);
        console.log("User signed out.");
        window.location.href = "signin.html"; // Redirect after logout
    } catch (error) {
        console.error("Sign out error:", error.message);
        alert("Error signing out: " + error.message);
    }
};


