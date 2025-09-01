"use client"

import { useEffect, useRef } from "react"
import { useFirestore } from "../../contexts/FirestoreContext"
import MessageInput from "./MessageInput"
import { Card } from "./ui/card"

const ChatWindow = () => {
  const { activeChat, messages, user, getChatName } = useFirestore()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeChat])

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
          <p>Escolha uma conversa da lista para começar a conversar</p>
        </div>
      </div>
    )
  }

  const chatMessages = messages[activeChat] || []

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("pt-BR")
  }

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true

    const currentDate = currentMsg.createdAt?.toDate ? currentMsg.createdAt.toDate() : new Date(currentMsg.createdAt)
    const previousDate = previousMsg.createdAt?.toDate
      ? previousMsg.createdAt.toDate()
      : new Date(previousMsg.createdAt)

    return currentDate.toDateString() !== previousDate.toDateString()
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-card-foreground">{getChatName(activeChat)}</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message, index) => {
          const isOwnMessage = message.senderId === user?.uid
          const previousMessage = index > 0 ? chatMessages[index - 1] : null
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}

              <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                  <Card
                    className={`p-3 ${
                      isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                    }`}
                  >
                    {!isOwnMessage && <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}

export default ChatWindow
