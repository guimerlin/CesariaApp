import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { firebaseApp } from "./firebaseConfig"

const app = firebaseApp

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
