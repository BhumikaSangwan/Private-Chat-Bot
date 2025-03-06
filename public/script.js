const socket = io();

const input = document.getElementById("input");
const sendButton = document.getElementById("send");
const messagesList = document.getElementById("messages");

const userId = prompt("Enter your user ID:");
const username = prompt("Enter your name:");
socket.emit("join", {userId, username});

socket.on("ready", () => {
    input.disabled = false;
    sendButton.disabled = false;
});

socket.on("waiting", (message) => {
    input.disabled = true;
    sendButton.disabled = true;
    alert(message);
});

socket.on("reload", () => {
    alert("Too many users joined. Reloading...");
    location.reload();
});

sendButton.addEventListener("click", () => {
    const message = input.value.trim();
    if (message) {
        socket.emit("sendMessage", { message });
        addMessage(`You: ${message}`, "sentMsg");
        input.value = "";
    }
});

socket.on("receiveMessage", (data) => {
    addMessage(`${data.from}: ${data.message}`, "receivedMsg");
});

//show chat
function addMessage(text, className) {
    const li = document.createElement("li");
    li.textContent = text;
    li.setAttribute('class', className);
    messagesList.appendChild(li);
}
