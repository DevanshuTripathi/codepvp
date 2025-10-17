
export function ChatHandlers(io, socket) {
    
    socket.on("Join_chat", ({ roomID, username }) => {
        if (!roomID || !username) return; 
        socket.join(roomID);
        console.log(`${username} joined room: ${roomID}`); // not sure of my code that's why
    });

   
    socket.on("send_message", ({ roomID, username, message }) => {
        
        
        if (!roomID || !username || !message) return;
        

        const msgData = {
            roomId: roomID,
            username,
            message,
            timestamp: new Date().toISOString() // just want to add this 
        };

        
        io.to(roomID).emit("receive_message", msgData);
        console.log(`Message sent to room ${roomID}:`, msgData); 
    });
}
