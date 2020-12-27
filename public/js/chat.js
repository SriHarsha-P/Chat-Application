// This is client

const socket = io()

const $messageform = document.querySelector('#message-form')
const $messageFormInput = $messageform.querySelector('input')
const $messageFormButton = $messageform.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages= document.querySelector('#messages')

//Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#loaction-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room }= Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message Element
    const $newMessage = $messages.lastElementChild

    // Height of he new message
    const newMessageStyles = getComputedStyle($newMessage) 
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far I have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(location) => {
    console.log(location)
    const html=Mustache.render(locationTemplate,{
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    //socket.emit('sendMessage', message)

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message Delivered!')
    })
})

$sendLocationButton.addEventListener('click', (e) => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        return alert('Geo Location is not supported by browser.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Loaction Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

