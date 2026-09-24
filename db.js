
const firebaseConfig = {
  apiKey: "AIzaSyCf5Cn9gfOPyNzM-GS09Rn99MmMFJrnqRg",
  authDomain: "universo-recuerdos-9ade9.firebaseapp.com",
  databaseURL: "https://universo-recuerdos-9ade9-default-rtdb.firebaseio.com",
  projectId: "universo-recuerdos-9ade9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
