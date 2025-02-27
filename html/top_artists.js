const params = new URLSearchParams(window.location.search)
const access_token = params.get('access_token')

if(access_token){
    localStorage.setItem('spotifyAccessToken', access_token)
    fetch('https://api.spotify.com/v1/me/top/tracks', {
        headers: { Authorization: `Bearer ${accessToken}`}
    })
    .then(data => {
        console.log(data.json())
        data.json()
    })
    .then(songs => {
        songs.forEach(song => {
            const track = document.createElement('div')
            const artist_div = document.querySelector('.spotify-track')
            track.classList.add('track-card')
            track.innerHTML = `
            <p><strong>Artist:</strong> ${song.artist}</p>
            <p><strong>Song Name:</strong> ${song.name}</p><br>
            `
            artist_div.appendChild(track)
        })
    }).catch(error => 
        console.error("Error fetching data:", error)
    )
} else {
    console.log("No access token found. Redirecting to login.")
    window.location.href = "/login"
}