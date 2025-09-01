import { FirestoreProvider } from "../contexts/FirestoreContext"
import ChatApp from "../components/chat/ChatApp"

export default function Chat() {
  return (
    <FirestoreProvider>
      <ChatApp />
    </FirestoreProvider>
  )
}
