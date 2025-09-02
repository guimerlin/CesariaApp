"use client"

import { useEffect, useRef } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { Card } from "./ui/card"
import { Button } from "./ui/button"

const NotificationSystem = () => {
  const { inAppNotifications, removeInAppNotification } = useNotification()
  const timeoutsRef = useRef(new Map())

  useEffect(() => {
    inAppNotifications.forEach((notification) => {
      // Se já existe um timeout para esta notificação, não criar outro
      if (!timeoutsRef.current.has(notification.id)) {
        const timeoutId = setTimeout(() => {
          removeInAppNotification(notification.id)
          timeoutsRef.current.delete(notification.id)
        }, 5000)

        timeoutsRef.current.set(notification.id, timeoutId)
      }
    })

    // Limpar timeouts de notificações que foram removidas manualmente
    const currentNotificationIds = new Set(inAppNotifications.map((n) => n.id))
    for (const [notificationId, timeoutId] of timeoutsRef.current.entries()) {
      if (!currentNotificationIds.has(notificationId)) {
        clearTimeout(timeoutId)
        timeoutsRef.current.delete(notificationId)
      }
    }

    // Cleanup ao desmontar o componente
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutsRef.current.clear()
    }
  }, [inAppNotifications, removeInAppNotification])

  if (inAppNotifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {inAppNotifications.map((notification) => (
        <Card
          key={notification.id}
          className="p-4 bg-secondary text-secondary-foreground shadow-lg animate-in slide-in-from-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {notification.timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeInAppNotification(notification.id)}
              className="ml-2 h-6 w-6 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default NotificationSystem
