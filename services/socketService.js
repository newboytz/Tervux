import { Server } from "socket.io";
import EventEmitter from "events";

let io;
const eventBus = new EventEmitter();

export const initSocket = async (server) => {
    console.log("🔌 Initializing Socket.io for Multi-Account...");

    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
        : ["http://localhost:3000", "http://localhost:5173"];

    io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("📡 Client connected to Socket.io:", socket.id);

        // 🔥 UNYAMA WA KWANZA: Dashboard inajiunga kwenye chumba cha akaunti husika
        socket.on("join_account", (accountName) => {
            if (accountName) {
                socket.join(accountName);
                console.log(`🚪 Client ${socket.id} joined room: [${accountName}]`);
            }
        });

        socket.on("disconnect", () => {
            console.log("📡 Client disconnected:", socket.id);
        });
    });

    // Subiri updates kutoka kwa bot maalum
    eventBus.on("bot_update", ({ accountName, event, data }) => {
        if (io && accountName) {
            // 🔥 UNYAMA WA PILI: Inatuma updates kwa watu waliofungua akaunti hiyo tu!
            io.to(accountName).emit(event, data);
        }
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

/**
 * Emit update kwa akaunti maalum pekee kuzuia mwingiliano
 */
export const emitUpdate = (accountName, event, data) => {
    if (io && accountName) {
        io.to(accountName).emit(event, data);
    }
};

export { eventBus };
