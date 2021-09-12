const socket = io()

//elements
const form = document.querySelector('#chat-form')
const locationButton = document.querySelector('#location-button')
const messageInput = document.querySelector('input')
const submitButton = document.querySelector('#submit-message')
const messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // const newMessage = messages.lastElementChild

    // //height of the new message
    // const newMessageStyle = getComputedStyle(newMessage) 
    // const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    // const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // //height of messages container
    // const visibleHeight = messages.offsetHeight
    // const containerHeight = messages.scrollHeight

    // //how far have i scrolled
    // const scrollOffset = messages.scrollTop + visibleHeight

    // if (containerHeight - newMessageHeight <= scrollOffset) {
    // }
    messages.scrollTop = messages.scrollHeight
    
}

socket.on('message' , (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message: message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

form.addEventListener('submit' , (e) => {
    e.preventDefault()
    submitButton.setAttribute('disabled' , 'disabled')
    

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        submitButton.removeAttribute('disabled')
        messageInput.value = ''
        messageInput.focus(

        )
        if(error) {
            return console.log(error)
        }
        console.log(message)
    })
    //third param of the function is the acknowledgement function which runs after the message is shared

    
})

locationButton.addEventListener('click' , () => {
    
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }
    
    locationButton.setAttribute('disabled' , 'disabled')
    
    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', { 
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
         }, (acknowledgementMessage) => {
             console.log(acknowledgementMessage)
         })
         locationButton.removeAttribute('disabled')
    })
})

socket.on('locationMessage' , (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate , {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', { username , room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})