const artist_div = document.querySelector('.spotify-track')
const navbar = document.querySelector('.nav-links')

async function checkLoginStatus(){
    return fetch('/api/me/status')
        .then(res => res.json())
        .then(async status => {
            return status.loggedIn
        })
}

async function changeLogin(){
    const loggedIn = await checkLoginStatus()
    console.log("LOGGED IN:", loggedIn)
    const authButton = document.getElementById('auth-btn')
    if(loggedIn){
        authButton.innerText = 'Profile'
        authButton.onclick = () => {
            window.location.href = '/profile.html'
        }
        const create_playlist = document.createElement('a')
        create_playlist.href = 'create_playlist.html'
        create_playlist.textContent = 'Create Playlist'

        navbar.appendChild(create_playlist)

        const sync_songs = document.createElement('button')
        sync_songs.innerText = 'Sync Your Songs'
        sync_songs.classList.add("nav-link-btn")

        const spinner = document.createElement('div')
        spinner.classList.add("spinner")
        
        sync_songs.onclick = () => {
            spinner.style.display = 'block'
            syncSongs(spinner)
        }

        navbar.appendChild(sync_songs)
        navbar.appendChild(spinner)
    } else {
        authButton.innerText = 'Log in'
        authButton.onclick = () => {
            window.location.href = '/api/login'
        }
    }
}

async function syncSongs(element){
    try {
        const res = await fetch('/api/me/saved-tracks')
        const data = await res.json()
        alert(data.message)
    } catch(err){
        alert("Failed to sync liked songs:", err)
    }

    element.style.display = 'none'
}

async function getProfile(){
    await fetch('/api/me/profile')
        .then(response => response.json())
        .then(details => {
            const profileDiv = document.getElementById('profile')
            
            profileDiv.innerHTML = `
                <h3><strong>Username:</strong> ${details.name}</h3>
                <img src="${details.profileImage}" alt=${details.name} Image><br>
                <a href="${details.spotifyProfileLink}"><strong>Link to Spotify Profile</strong></a>
                <h3><strong>Number of Followers:</strong> ${details.followers}</h3>
            `
        })
}

function getTopArtists(){
    fetch('/api/me/top-tracks')
        .then(data => data.json())
        .then(async songs => {
            const loggedIn = await checkLoginStatus()
            if(loggedIn){
                if(!document.querySelector('.track-card')){
                    songs.forEach(song => {
                        const track = document.createElement('div')
                        track.classList.add('track-card')
                        track.innerHTML = `
                        <p><strong>Artist:</strong> ${song.artist}</p>
                        <p><strong>Song Name:</strong> ${song.name}</p><br>
                        <p><strong>Album:</strong> ${song.album}</p>
                        <img src="${song.albumImage}" alt=${song.album} Image>
                        `
                        artist_div.appendChild(track)
                    })
                } else {
                    console.error("Already sent Top Artists")
                }
            } else {
                if(!document.querySelector('.error-msg')){
                    const error_msg = document.createElement('h4')
                    error_msg.classList.add("error-msg")
                    error_msg.innerText = "You must log in before accessing your top artists"
                    artist_div.appendChild(error_msg)
                } else {
                    console.error("Please log in with Spotify account")
                }
            }
        }).catch(error => 
            console.error("Error fetching data:", error)
        )
}

// playlists
let currentPlaylistID = null

function renderPlaylistList(playlists){
    const list = document.getElementById("playlist-list")
    list.innerHTML = ""
    playlists.forEach(playlist => {
        const item = document.createElement("div")
        const imageURL = `data:image/jpeg;base64,${playlist.cover_image}`
        item.innerHTML = `
            <img src="${imageURL}" alt="${playlist.title}">
            <h3>${playlist.title}</h3>
            <button class="delete-btn" onclick="deletePlaylist(${playlist.id})" id="del-playlist">X</button>
        `
        item.classList.add("playlist-item")
        item.onclick = () => showPlaylistDetails(playlist)
        list.appendChild(item)
    })
}

function showPlaylistDetails(playlist){
    currentPlaylistID = playlist.id
    const details = document.getElementById("playlist-details")
    const imageURL = `data:image/jpeg;base64,${playlist.cover_image}`

    details.innerHTML = `
        <div id="playlist-title-details">
            <img src="${imageURL}" alt="${playlist.title}">
            <h1>Title: ${playlist.title}</h1>
        </div>
        <div class="track-list" id="tracks-${playlist.id}"></div>
    `

    getPlaylistTracks(playlist.id)
}

async function createPlaylist(event){
    event.preventDefault()
    const title = document.getElementById("title").value.trim()
    const fileInput = document.getElementById("cover-image")
    const file = fileInput.files[0]

    if(!title || !file) return alert("Please provide title and image.")

    const reader = new FileReader()
    reader.onload = async function (){
        const base64 = reader.result.split(",")[1]

        const res = await fetch("/api/playlists", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ title, imageBase64: base64 })
        })

        if(res.ok){
            listPlaylists()
            document.getElementById("create-playlist-form").reset()
        } else {
            alert("Failed to create playlist.")
        }
    }

    reader.readAsDataURL(file)
}

async function listPlaylists(){
    const res = await fetch("/api/playlists")
    if(!res.ok) return

    const playlists = await res.json()
    renderPlaylistList(playlists)
}

async function deletePlaylist(playlistID){
    if(!confirm("Are you sure you want to delete this playlist?")) return

    await fetch(`/api/playlists/${playlistID}`, {
        method: 'DELETE'
    })

    listPlaylists() // refresh sidebar list
}

async function getPlaylistTracks(id){
    const res = await fetch(`/api/playlists/${id}/tracks`)
    const tracks = await res.json()
    const container = document.getElementById(`tracks-${id}`)

    container.innerHTML = tracks.map(track => `
        <div>
            <p>${track.name} - ${track.artist}</p>
            <button class="delete-btn" onclick="deleteTrack('${id}', '${track.id}')" id="del-track">X</button>
        </div>
    `).join("")
}

async function deleteTrack(playlistID, trackID){
    await fetch(`/api/playlists/${playlistID}/tracks/${trackID}`, {
        method: 'DELETE'
    })
    getPlaylistTracks(playlistID)
}

async function searchSongs(event){
    event.preventDefault()
    const query = document.getElementById("search-query").value.trim()
    if(!query || !currentPlaylistID) return

    const res = await fetch(`/api/search-tracks/${encodeURIComponent(query)}`)
    const songs = await res.json()
    const resultsDiv = document.getElementById("search-results")
    resultsDiv.innerHTML = ""

    songs.forEach(song => {
        const div = document.createElement("div")
        div.innerHTML = `${song.name} - ${song.artist}`
        const addBtn = document.createElement("button")
        addBtn.textContent = "+"
        addBtn.onclick = () => addSong(song)
        div.appendChild(addBtn)
        resultsDiv.appendChild(div)
    })
}

async function addSong(song){
    if(!currentPlaylistID) return

    await fetch(`/api/playlists/${currentPlaylistID}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(song)
    })

    getPlaylistTracks(currentPlaylistID)
}

async function exportCurrentPlaylist(){
    if(!currentPlaylistID) return alert("Select a playlist first.")
    const res = await fetch(`/api/playlists/${currentPlaylistID}/export`, {
        method: "POST"
    })
    const result = await res.json()

    if(result.spotifyUrl){
        alert("Exported! Opening Spotify...")
        window.open(result.spotifyUrl, '_blank')
    } else {
        alert("Failed to export playlist.")
    }
}


// pre reqs
changeLogin()

if(window.location.href.includes("profile.html")){
    getProfile()
    const loggedIn = checkLoginStatus()
    .then(res => {
        if(!res){
            window.location.href = '/'
        }
    })
}

if(window.location.href.includes("create_playlist.html")){
    listPlaylists()
    const loggedIn = checkLoginStatus()
    .then(res => {
        if(!res){
            window.location.href = '/'
        }
    })
}