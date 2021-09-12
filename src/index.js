const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage , locationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)// because socket io expects a http server
 
const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname , '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket Connection')
       
    socket.on('join' , ( {username , room}, callback ) => {
        const{ error, user } = addUser({ id:socket.id, username, room })
        
        if(error) {
            return callback(error)
        }
        
        socket.join(user.room) 
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
        
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })


    socket.on('sendMessage' , (message , callback) => {
        const user = getUser(socket.id)
        const filter = new Filter
        if (filter.isProfane(message)) {
            return callback('foul language not allowed')
        }
        
        io.to(user.room).emit('message'  , generateMessage(user.username, message) )
         callback('delivered')
    })
    
    socket.on('sendLocation' , (location , callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage' , locationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('location shared')
    })

    socket.on('disconnect', () => {
        const removedUser = removeUser(socket.id)

        if(removedUser) {
            io.to(removedUser.room).emit('message', generateMessage('Admin',`${removedUser.username} has left!`))
            io.to(removedUser.room).emit('roomData', {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            })
        }

    })

})

server.listen(port , () => {
    console.log(`server is running on port ${port}!`)
})