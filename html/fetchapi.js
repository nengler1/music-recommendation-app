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
    } else {
        authButton.innerText = 'Log in'
        authButton.onclick = () => {
            window.location.href = '/api/login'
        }
    }
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
            console.log("TLOGGED IN:", loggedIn)
            if (loggedIn){
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

async function listPlaylists(){
    await fetch('/api/playlists', {
        method: 'GET',
    })
    .then(async res => {
        if(res.status === 401) {
            document.getElementById('playlists').innerHTML = "<p>You need to log in to view your playlists.</p>"
            return
        }

        const playlists = await res.json()
        const container = document.getElementById('playlists')

        if(playlists.length === 0){
            container.innerHTML = "<p>You have no playlists yet.</p>"
            return
        }
        container.innerHTML = playlists.map(playlist => `
            <div class="spotify-track">
                <div class="track-card">
                    <h2>Title: ${playlist.title}</h2>
                    <button class="delete" onclick="deletePlaylist('${playlist.id}')">Delete</button>
                    <button class="button" onclick="getPlaylistTracks('${playlist.id}')">View Tracks</button>

                    <!-- Search and add song -->
                    <form onsubmit="getSong(event, '${playlist.id}')">
                        <input type="text" placeholder="Search for a song..." name="search-track" required />
                        <button type="submit">Search</button>
                    </form>

                    <select id="song-dropdown-${playlist.id}">
                        <option value="">Select a song</option>
                    </select>
                    <button onclick="addSong('${playlist.id}')">Add to Playlist</button>

                    <div class="track-list" id="tracks-${playlist.id}"></div>
                </div>
            </div>
        `).join('')
    })
}

async function createPlaylist(event){
    event.preventDefault()
    const formData = new FormData(event.target)
    const title = formData.get('title').toString().trim()

    await fetch('/api/playlists', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title})
    })
    .then(async res => {
        if(res.ok){
            listPlaylists()
        } else {
            alert("Failed to create playlist.")
        }
    })
}

/*
async function getPlaylist(id){
    await fetch(`/api/playlists/${id}`, {
        method: 'GET'
    }).then(async res => {
            const playlist = await res.json()
            console.log(playlist)
            
            const tracksDiv = document.getElementById(`tracks-${id}`)
            if(playlist.tracks.length === 0){
                tracksDiv.innerHTML = "<p>No tracks in playlist</p>"
            } else {
                tracksDiv.innerHTML = playlist.tracks.map(track => `
                    <div>
                        ${track.name} - ${track.artist}
                        <button class="delete" onclick="deleteTrack('${id}', '${track.id}')">Delete Track</button>
                    <div>
                `).join('')
            }
        })
}
*/

// Fetch and Display Tracks in a Playlist
async function getPlaylistTracks(playlistID) {
    await fetch(`/api/playlists/${playlistID}/tracks`)
    .then(async res => {
        const tracks = await res.json()
        const trackList = document.getElementById(`tracks-${playlistID}`)

        if (tracks.length === 0) {
            trackList.innerHTML = "<p>No tracks in this playlist.</p>"
            return
        }

        trackList.innerHTML = tracks.map(track => `
            <div>${track.name} - ${track.artist}
                <button class="delete" onclick="deleteTrack('${playlistID}', '${track.id}')">Delete</button>
            </div>
        `).join('')
    })
}

/*
async function updatePlaylist(event){
    event.preventDefault()
    const formData = new FormData(event.target)
    const title = formData.get('title').toString().trim()

    await fetch('/api/playlists', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title})
    }).then(async res => {
            const data = await res.json()
            console.log(data)
            listPlaylists()
        })
}
*/

async function deletePlaylist(id){
    await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
    })
    listPlaylists()
}

// tracks

async function getSong(event, playlistID){
    event.preventDefault()
    const formData = new FormData(event.target)
    const search = formData.get('search-track').toString().trim()

    await fetch(`/api/search-tracks/${encodeURIComponent(search)}`, {
        method: 'GET',
    })
    .then(async res => {
        if (!res.ok) {
            console.error("Error fetching songs")
            return
        }

        const songs = await res.json()
        const dropdown = document.getElementById(`song-dropdown-${playlistID}`)
        dropdown.innerHTML = '<option value="">Select a song</option>'

        songs.forEach(song => {
            const songOption = document.createElement("option")
            songOption.value = JSON.stringify(song)
            songOption.innerText = `${song.name} - ${song.artist}`
            dropdown.appendChild(songOption)
        })
    }).catch(error => {
        console.error("Error fetching songs:", error)
    })
}

async function addSong(playlistID) {
    const dropdown = document.getElementById(`song-dropdown-${playlistID}`)
    const selectedOption = dropdown.options[dropdown.selectedIndex]

    if(!selectedOption.value) {
        alert("Please select a song first!")
        return
    }

    const song = JSON.parse(selectedOption.value)

    await fetch(`/api/playlists/${playlistID}/tracks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: song.name, artist: song.artist})
    })
    .then(res => {
        if(res.ok) {
            getPlaylistTracks(playlistID)
        } else {
            alert("Error adding song to playlist")
        }
    }).catch(error => {
        console.error("Error:", error)
    })
}

async function deleteTrack(playlistID, trackID){
    await fetch(`/api/playlists/${playlistID}/tracks/${trackID}`, {
        method: 'DELETE'
    })

    getPlaylistTracks(playlistID)
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