import { ref, push, onValue, set } from "firebase/database";
import { firebaseDb } from "../src/utils/firebaseConfig.js";


export default class Message {
    constructor(message, user,  chatId, replyId) {
        this.content = message;
        this.userId = user;
        this.chatId = chatId;
        this.replyId = replyId;
    }

    send() {
        const  messageRef = ref(firebaseDb, `messages/${this.chatId}`);
        const newMessageRef = push(messageRef, {
            text: this.content,
            senderName: this.userId,
            sender: this.userId,
            urgent: false,
            chatId: this.chatId,
            answerId:  null
            timestamp: Date.now(),
        });
        return newMessageRef;
    }

    sendUrgent() {
        const  messageRef = ref(firebaseDb, `messages/${this.chatId}`);
        const newMessageRef = push(messageRef, {
            text: this.content,
            senderName: this.userId,
            sender: this.userId,
            urgent: true,
            chatId: this.chatId,
            answerId: null
            timestamp: Date.now(),
        });
        return newMessageRef;
    }

    reply() {
        const  messageRef = ref(firebaseDb, `messages/${this.chatId}`);
        const newMessageRef = push(messageRef, {
            text: this.content,
            senderName: this.userId,
            sender: this.userId,
            urgent: true,
            chatId: this.chatId,
            answerId: this.replyId
            timestamp: Date.now(),
    }
}