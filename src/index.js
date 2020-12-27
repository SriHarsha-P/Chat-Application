// This is Server

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io') 
const Filter = require('bad-words')
// app is to start application with express
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// creating the port to run
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// server (emits) -> client (receives) - countUpdated
// client (emits) -> server (receives) - increment 

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if(error){
            return callback(error)
        }
        socket.join(user.room)

        // socket.io, socket.emit, socket.broadcast.emit - this is for all the users irrespective of rooms
        // socket.to.io, socket.to.emit,socket.broadcast.to.emit - this is for particular room

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room) 
        })

        callback()
    })
    

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username,message)) 
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    }) 
    
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})


