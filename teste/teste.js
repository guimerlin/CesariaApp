import Message from "./messages.js";


const message = "Isso é puramente  para testes.";
const user = "Josh Dun";
const chatId = "Josh Dun_TI";
const answerId = null;


const newmessage = new Message(message, user,  chatId, answerId)
console.log(newmessage.send());