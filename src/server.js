import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
    const {
        sockets: {
            adapter: {
                sids,
                rooms
            },
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}


wsServer.on("connection", socket => {
    socket["nickname"] = "익명"
    socket.onAny((event) => {
        console.log(`Socket Event:${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName); //만드는 것과 join하는 것은 같은 것
        done();
        socket.to(roomName).emit("welcome", socket.nickname);
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    })
    socket.on("nickname", nickname => socket["nickname"] = nickname)
});

// const wss = new WebSocket.Server({server}); //http와 ws을 같은 서버, 같은 포트에서 둘 다 작동시킨다.
// const sockets = [];
// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "익명";
//     console.log("connected from the Browser ⭕");
//     socket.on("close", () => {
//         console.log("disconnected from the Browser ❌");
//     })
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg.toString('utf8'));
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//             case "nickname":
//                 socket["nickname"] = message.payload;

//         }
//     });
// });

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);