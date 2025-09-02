"use client"
import { useFirestore } from "../../contexts/FirestoreContext"
import LoginForm from "./LoginForm"
import ChatList from "./ChatList"
import ChatWindow from "./ChatWindow"
import NotificationSystem from "./NotificationSystem"
import { Button } from "./ui/button"

const ChatApp = () => {
  const { user, loading, logout } = useFirestore()

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center bg-background w-max">
//         <div className="text-center">
//           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-muted-foreground">Carregando...</p>
//         </div>
//       </div>
//     )
//   }

  if (!user) {
    return <LoginForm />
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
  <div className="h-screen flex flex-col bg-background w-full">
    {/* Top Bar */}
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <h1 className="text-xl font-bold text-primary">Cesaria Chat</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Olá, {user.displayName || user.email}</span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </div>

    {/* Main Chat Interface */}
    <div className="flex-1 flex overflow-hidden">
      <ChatList />
      <ChatWindow />
    </div>

    {/* Notifications */}
    <NotificationSystem />
  </div>
)
}

export default ChatApp
