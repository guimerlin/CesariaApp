"use client"
import { useState } from "react"
import { useFirestore } from "../../contexts/FirestoreContext"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { MessageCircle, Users, Search, User } from "lucide-react"

const ChatList = () => {
  const { chats, activeChat, setActiveChat, messages, user, allUsers, createPrivateChat } = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [showUsers, setShowUsers] = useState(false)

  const getLastMessage = (chatId) => {
    const chatMessages = messages[chatId] || []
    return chatMessages[chatMessages.length - 1]
  }

  const getUnreadCount = (chatId) => {
    const chatMessages = messages[chatId] || []
    return chatMessages.filter((msg) => msg.senderId !== user?.uid && !msg.read).length
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredChats = chats.filter((chat) => chat.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  console.log("[v0] Total de usuários carregados:", allUsers.length)
  console.log("[v0] Usuários filtrados:", filteredUsers.length)
  console.log("[v0] Usuário atual:", user?.uid)
  console.log(
    "[v0] Lista completa de usuários:",
    allUsers.map((u) => ({ id: u.id, name: u.name, email: u.email })),
  )
  console.log("[v0] ShowUsers:", showUsers)
  console.log("[v0] SearchTerm:", searchTerm)

  const handleStartChat = async (targetUser) => {
    await createPrivateChat(targetUser.id)
    setShowUsers(false)
    setSearchTerm("")
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{showUsers ? "Usuários" : "Conversas"}</h2>

        <div className="flex gap-2 mb-3">
          <Button
            variant={!showUsers ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUsers(false)}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chats
          </Button>
          <Button
            variant={showUsers ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUsers(true)}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={showUsers ? "Buscar usuários..." : "Buscar chats..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!showUsers ? (
          // Lista de chats
          <>
            {filteredChats.map((chat) => {
              const lastMessage = getLastMessage(chat.id)
              const unreadCount = getUnreadCount(chat.id)
              const isActive = activeChat === chat.id

              return (
                <Card
                  key={chat.id}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md border ${
                    isActive ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate flex-1 text-gray-900">{chat.name || "Chat Privado"}</h3>
                    {unreadCount > 0 && <Badge className="ml-2 bg-orange-500 text-white">{unreadCount}</Badge>}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <p className="truncate flex-1">{lastMessage ? lastMessage.content : "Nenhuma mensagem"}</p>
                    {lastMessage && (
                      <span className="ml-2 text-xs text-gray-400">{formatTime(lastMessage.createdAt)}</span>
                    )}
                  </div>

                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${chat.type === "public" ? "bg-green-500" : "bg-blue-500"}`}
                    />
                    {chat.isGeneral ? "Chat Geral" : chat.type === "public" ? "Público" : "Privado"}
                  </div>
                </Card>
              )
            })}

            {filteredChats.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma conversa encontrada</p>
                <p className="text-sm mt-1">
                  {searchTerm ? "Tente outro termo de busca" : "Clique em 'Usuários' para iniciar um chat"}
                </p>
              </div>
            )}
          </>
        ) : (
          // Lista de usuários
          <>
            {filteredUsers.map((targetUser) => {
              const isCurrentUser = targetUser.id === user?.uid

              return (
                <Card
                  key={targetUser.id}
                  className={`p-3 transition-all duration-200 border ${
                    isCurrentUser
                      ? "border-orange-200 bg-orange-50 cursor-default"
                      : "cursor-pointer hover:shadow-md border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={isCurrentUser ? undefined : () => handleStartChat(targetUser)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        isCurrentUser ? "bg-orange-200" : "bg-orange-100"
                      }`}
                    >
                      <User className={`w-5 h-5 ${isCurrentUser ? "text-orange-700" : "text-orange-600"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {targetUser.name || "Usuário"}
                        {isCurrentUser && <span className="text-orange-600 ml-2">(Você)</span>}
                      </h3>
                      <p className="text-sm text-gray-600">{targetUser.email}</p>
                    </div>
                    {!isCurrentUser && <MessageCircle className="w-4 h-4 text-gray-400" />}
                  </div>
                </Card>
              )
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum usuário encontrado</p>
                <p className="text-sm mt-1">
                  {searchTerm ? "Tente outro termo de busca" : "Não há outros usuários no momento"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ChatList
