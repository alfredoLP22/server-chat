const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const connectionDB = require("./config/db");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true, // enable set cookie with CORS
  })
);
connectionDB();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const chatSchema = new mongoose.Schema({
  room: String,
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Chat = mongoose.model("Chat", chatSchema);

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", (room, username) => {
    socket.join(room);

    Chat.aggregate([
      {
        $match: { room: room }, // Replace yourRoom with the actual room value
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $limit: 20,
      },
      {
        $project: {
          _id: 0, // Exclude the _id field if you don't need it
          timestamp: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          message: 1,
          username: 1,
          room: 1,
        },
      },
    ])
      .then((messages) => {
        io.to(room).emit("load messages", messages);
      })
      .catch((err) => {
        console.error(err);
      });

    socket.on("chat message", (msg) => {
      const chatMessage = new Chat({ ...msg, room });
      chatMessage
        .save()
        .then(() => {
          io.to(room).emit("chat message", msg);
        })
        .catch((err) => {
          console.error(err);
        });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
});

// REST API endpoint to fetch old messages
app.get("/api/messages/:room", async (req, res) => {
  try {
    const room = req.params.room;
    const messages = await Chat.find({ room }).sort({ timestamp: 1 }).limit(20);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
