const artist_div = document.querySelector('.spotify-track')

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

async function listPlaylists(){
    await fetch('/api/playlists', {
        method: 'GET',
    }).then(async res => res.json())
        .then(playlists => {
            const container = document.getElementById('playlists')
            container.innerHTML = playlists.map(playlist => `
                <div class="spotify-track">
                    <div class="track-card">
                        <h2>Title: ${playlist.title}</h2>
                        <button class="delete" onclick="deletePlaylist('${playlist.id}')">Delete</button>
                        <button class="button" onclick="getPlaylist('${playlist.id}')">View Tracks</button>
                        <form onsubmit="addTrack(event, '${playlist.id}')">
                            <input type="text" placeholder="Track name" name="trackName" required />
                            <input type="text" placeholder="Artist name" name="artistName" required />
                            <button type="submit">Add Track</button>
                        </form>
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
    }).then(async res => {
            const data = await res.json()
            console.log(data)
            listPlaylists()
        })
}


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
                        ${track.name} by ${track.artist}
                        <button class="delete" onclick="deleteTrack('${id}', '${track.id}')">Delete Track</button>
                    <div>
                `).join('')
            }
        })
}

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

async function deletePlaylist(id){
    await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
    })
    listPlaylists()
}

async function addTrack(event, id) {
    event.preventDefault()
    const formData = new FormData(event.target)
    const trackName = formData.get('trackName').toString().trim()
    const artistName = formData.get('artistName').toString().trim()

    if(!trackName || !artistName) {
        alert('Both track and artist names are required')
        return
    }

    await fetch(`/api/playlists/${id}/tracks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: trackName, artist: artistName})
    })
    getPlaylist(id)
}

async function deleteTrack(playlistID, trackID){
    await fetch(`/api/playlists/${playlistID}/tracks/${trackID}`, {
        method: 'DELETE'
    })

    getPlaylist(playlistID)
}

async function searchSong(event){
    event.preventDefault()
    const formData = new FormData(event.target)
    const search = formData.get('search-track').toString().trim()

    await fetch('/api/search-track', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({search})
    }).then(async res => {
            const data = await res.json()
            console.log(data)
        })
}

changeLogin()
getProfile()