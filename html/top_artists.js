const artist_div = document.querySelector('.spotify-track')

function getTopArtists(){
    fetch('/spotify/me/top-tracks')
        .then(response => response.json())
        .then(data => ({body: data}))
        .then(({body}) => {
            if (body.message === 'Not logged in'){
                if(!document.querySelector('.error-msg')){
                    const error_msg = document.createElement('h4')
                    error_msg.classList.add("error-msg")
                    error_msg.innerText = "You must log in before accessing your top artists"
                    artist_div.appendChild(error_msg)
                } else {
                    console.error("Please log in with Spotify account")
                }
            } else {
                if(!document.querySelector('.track-card')){
                    body.forEach(song => {
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
            }
        }).catch(error => 
            console.error("Error fetching data:", error)
        )
}