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
            window.location.href = '/profile'
        }
    } else {
        authButton.innerText = 'Log in'
        authButton.onclick = () => {
            window.location.href = '/login'
        }
    }
}

function getProfile(){
    fetch('/api/me/profile')
        .then(response => response.json())
        .then(async details => {
            
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

changeLogin()