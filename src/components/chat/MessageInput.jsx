"use client"

import { useState } from "react"
import { useChat } from "../../contexts/ChatContext"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Send, AlertTriangle, Loader2 } from "lucide-react"

const MessageInput = () => {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const { activeChat, sendMessage } = useChat()

  const handleSend = async (isUrgent = false) => {
    if (!message.trim() || !activeChat || sending) return

    setSending(true)
    const result = await sendMessage(activeChat, message, isUrgent)

    if (result.success) {
      setMessage("")
    }
    setSending(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleSend(false)
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
          disabled={!activeChat || sending}
          className="flex-1"
        />
        <Button type="submit" disabled={!message.trim() || sending} className="px-4">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => handleSend(true)}
          disabled={!message.trim() || sending}
          className="px-4"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  )
}

export default MessageInput
