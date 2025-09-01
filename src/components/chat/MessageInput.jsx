"use client"

import { useState } from "react"
import { useFirestore } from "../../contexts/FirestoreContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

const MessageInput = () => {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const { activeChat, sendMessage } = useFirestore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || !activeChat || sending) return

    setSending(true)
    const result = await sendMessage(activeChat, message)

    if (result.success) {
      setMessage("")
    }
    setSending(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" disabled={!message.trim() || sending} className="px-6">
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </form>
    </div>
  )
}

export default MessageInput
