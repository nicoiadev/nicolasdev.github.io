// db.js
// Aquí pegaremos tu configuración de Firebase cuando me la pases.
const firebaseConfig = {
  apiKey: "AIzaSyBFIrAZ3IJrAyFyJXNM08N-8LuECtFixv8",
  authDomain: "universo-recuerdos-9ade9.firebaseapp.com",
  databaseURL: "https://universo-recuerdos-9ade9-default-rtdb.firebaseio.com",
  projectId: "universo-recuerdos-9ade9"
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
