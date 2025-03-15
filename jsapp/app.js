#!/usr/bin/env node

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const SpotifyWebAPI = require('spotify-web-api-node')

const app = express()
const port = 3000

// session
const session = require('express-session')

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}))

const db = require('./database')

// parsing "application/x-www-form-urlencoded"
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(express.json())

// Admin Features
const { authenticate } = require('./users')

const requireAuth = (req, res, next) => {
	if(!authenticate(req.headers.authorization)) {
		res.setHeader(
			"WWW-Authenticate", "Basic realm='Melofy Admin Access'"
		)
		return res.status(401).json({error: "Unauthorized access"})
	}
	next()
}

// API testing (for class)
const dancers = []

app.get('/api', (req, res) => {
    const {who, x, y} = req.query

    console.log("PATH /api")
    console.log("QUERY", req.query)

    if (who || x || y) {
        const filteredDancers = dancers.filter(item =>
            item.who === who || item.x === x || item.y === y
        )
        if (filteredDancers.length > 0) {
            return res.status(200).json(filteredDancers)
        } else {
            return res.status(404).json({error: "Dancer not found"})
        }
    }

    return res.status(200).json(dancers) // No query params, return all dancers
})

app.post('/api', (req, res) => {
    console.log("- WOAH IN POST")
    const {who, x, y} = req.body

    if (!who || !x || !y) {
        return res.status(400).json({error: "Missing parameters"})
    }

    dancers.push({who, x, y})
    return res.status(201).json(dancers)
})

app.put('/api', (req, res) => {
    console.log("- IN PUT!!")
    const {who, x, y} = req.body

    if (!who || !x || !y) {
        return res.status(400).json({error: "Missing parameters"})
    }

    const index = dancers.findIndex(dancer => dancer.who === who)
    if (index !== -1) {
        dancers[index] = {who, x, y}
        return res.status(201).json(dancers)
    } else {
        return res.status(404).json({error: "Dancer not found"})
    }
})

app.delete('/api', (req, res) => {
    console.log("- IN DELETE!!")
    const {who} = req.body

    if (!who) {
        return res.status(400).json({error: "Missing 'who' parameter"})
    }

    const index = dancers.findIndex(dancer => dancer.who === who)
    if (index !== -1) {
        dancers.splice(index, 1)
        return res.status(200).json(dancers)
    } else {
        return res.status(404).json({error: "Dancer not found."})
    }
})

// -- SPOTIFY INTEGRATION --

const spotifyAPI = new SpotifyWebAPI({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
})

app.get('/api/login', (req, res) => {
	const scopes = [
		'user-read-private',
		'user-top-read',
		'user-read-recently-played',
		'user-read-playback-position'
	]
	res.redirect(spotifyAPI.createAuthorizeURL(scopes, null, true))
})

app.post('/api/login', async (req, res) => {
    const { spotifyId, name } = req.body;

    db.run(`INSERT INTO users (spotify_id, name) VALUES (?, ?) 
            ON CONFLICT(spotify_id) DO UPDATE SET name = excluded.name`, 
        [spotifyId, name], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: "Database error" })
            }

            req.session.spotifyId = spotifyId;
            res.json({ message: "User logged in", spotifyId })
        }
    )
})

app.get('/api/callback', async (req, res) => {
	console.log("REDIRECTED")
	const error = req.query.error
	const code = req.query.code

	if(error){
		console.error('Error:', error)
		res.send(`Error: ${error}`)
		return
	}
	
	try {
		const data = await spotifyAPI.authorizationCodeGrant(code)
		const accessToken = data.body.access_token
		const refreshToken = data.body.refresh_token

		spotifyAPI.setAccessToken(accessToken)
		spotifyAPI.setRefreshToken(refreshToken)

		req.session.accessToken = accessToken
		req.session.refreshToken = refreshToken

		const profile = await fetchWebApi('v1/me', accessToken)
		const spotifyID = profile.id
		const name = profile.display_name

		// storing user in database
		db.run(`INSERT INTO users (spotify_id, name) VALUES (?, ?) 
				ON CONFLICT(spotify_id) DO UPDATE SET name = excluded.name`, 
			[spotifyID, name], 
			function(err) {
				if (err) {
					return res.status(500).json({ error: "Database error" })
				}
			}
		)

		req.session.spotifyID = spotifyID
		res.redirect('/spotify.html')
	} catch(error) {
		console.error('Error:', error)
		res.send("Error getting token")
	}
})

const isAuthenticated = (req, res, next) => {
    if (req.session.spotifyID) {
        return next()
    }
    return res.status(401).json({error: "You must be logged in to access this."})
}


app.get('/api/me/status', (req, res) => {
	if(req.session.accessToken){
		res.json({loggedIn: true})
	} else {
		res.json({loggedIn: false})
	}
})

async function fetchWebApi(endpoint, accessToken){
	try {
		const response = await fetch(`https://api.spotify.com/${endpoint}`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		})
		return await response.json()
	} catch (error) {
		console.error("Error:", error)
		res.status(500).json({ error: 'Internal server error' })
	}
}


app.get('/api/me/profile', isAuthenticated, async (req, res) => {
	const accessToken = req.session.accessToken
	if(!accessToken){
		return res.status(401).json({ message: 'Not logged in'})
	}

	const profile = await fetchWebApi('v1/me', accessToken)

	if (!profile.display_name) {
        return res.status(500).json({ error: "Unable to fetch Spotify display name" })
    }

	const details = {
		name: profile.display_name,
		profileImage: profile.images[0]?.url || '',
		spotifyProfileLink: profile.href,
		followers: profile.followers?.total,
	}
	res.json(details)
})

app.get('/api/search-tracks/:track', isAuthenticated, async (req, res) => {
	const accessToken = req.session.accessToken
	if(!accessToken){
		return res.status(401).json({message: 'Not logged in'})
	}

	const track = req.params.track.replaceAll(" ", "+")
	if (!track) {
		return res.status(404).json({message: 'No track found'})
	}

	const track_search = await fetchWebApi(`v1/search?q=${track}&type=track&limit=5`, accessToken)
	if (!track_search.tracks.items.length) {
		return res.status(404).json({message: 'No tracks found'})
	}

	const tracks = track_search.tracks.items.map(track => ({
		id: track.id,
		name: track.name,
		artist: track.artists.map(artist => artist.name).join(", "),
		albumImage: track.album.images[0]?.url || '',
	}))

	res.json(tracks)
})


app.get('/api/me/top-tracks', async (req, res) => {
	const {time_range} = req.query

	const accessToken = req.session.accessToken
	if(!accessToken){
		return res.status(401).json({ message: 'Not logged in'})
	}

	try {
		const response = await fetch('https://api.spotify.com/v1/me/top/tracks', {
			headers: { Authorization: `Bearer ${accessToken}` }
		})

		if(!response.ok){
			const error = await response.json()
			return res.status(response.status).json({error})
		}

		const data = await response.json()
		const tracks = data.items.map(track => ({
			artist: track.artists.map(artist => artist.name).join(', '),
			name: track.name,
			album: track.album.name,
			albumImage: track.album.images[0]?.url,
			popularity: track.popularity
		}))
		console.log("Sent Tracks!")
		res.json(tracks)
	} catch (error) {
		console.error("Error fetching top tracks:", error)
		res.status(500).json({ error: 'Internal server error' })
	}
})

// -- Playlist creation --

const playlists = {}

// create playlist
app.post('/api/playlists', isAuthenticated, (req, res) => {
	const {title} = req.body
	if(!title){
		return res.status(400).json({ message: 'No playlist title'})
	}

	const userID = req.session.spotifyID;

    db.run(`INSERT INTO playlists (title, user_id) VALUES (?, ?)`, 
        [title, userID], 
        function(err) {
            if (err){
				return res.status(500).json({ error: "Database error" })
			}
            res.status(201).json({ id: this.lastID, title })
        }
    )
})

// get all playlists for specific user
app.get('/api/playlists', isAuthenticated, (req, res) => {
    const userID = req.session.spotifyID;

    db.all(`SELECT * FROM playlists WHERE user_id = ?`, 
        [userID], 
        (err, playlists) => {
            if (err){
				return res.status(500).json({ error: "Database error" })
			}
            res.json(playlists)
        }
    )
})

// delete playlist (only if owner)
app.delete('/api/playlists/:id', isAuthenticated, (req, res) => {
    const playlistID = req.params.id;
    const userID = req.session.spotifyID;

    db.run(`DELETE FROM playlists WHERE id = ? AND user_id = ?`, 
        [playlistID, userID], 
        function(err) {
            if (err){
				return res.status(500).json({ error: "Database error" })
			}
            if (this.changes === 0){
				return res.status(403).json({error: "Unauthorized"})
			}

            res.json({message: "Playlist deleted"})
        }
    )
})

/*
// get specific playlist
app.get('/api/playlists/:id', (req, res) => {
	const playlist = playlists[req.params.id]
	if(!playlist){
		return res.status(404).json({ message: 'No playlist found'})
	}

	res.json(playlist)
})


// update playlist
app.put('/api/playlists/:id', (req, res) => {
	const playlist = playlists[req.params.id]
	if(!playlist){
		return res.status(404).json({ message: 'No playlist found'})
	}

	new_title = req.body.title || playlist.title
	playlist.title = new_title
	res.json(playlist)
})

// delete playlist
app.delete('/api/playlists/:id', (req, res) => {
	const {id} = req.params
	if(!playlists[id]){
		return res.status(404).json({ message: 'No playlist found'})
	}

	delete playlists[id]
	res.status(204).json()
})
*/

// -- Tracks w/ in playlists --

// add a track to playlist
app.post('/api/playlists/:id/tracks', isAuthenticated, (req, res) => {
    const { name, artist } = req.body
    const playlistID = req.params.id
    const userID = req.session.spotifyID

    db.get(`SELECT * FROM playlists WHERE id = ? AND user_id = ?`, 
        [playlistID, userID], 
        (err, playlist) => {
            if (err) return res.status(500).json({error: "Database error"})
            if (!playlist) return res.status(403).json({error: "Unauthorized"})

            db.run(`INSERT INTO tracks (name, artist, playlist_id) VALUES (?, ?, ?)`, 
                [name, artist, playlistID], 
                function(err) {
                    if (err) return res.status(500).json({error: "Database error"})
                    res.status(201).json({id: this.lastID, name, artist})
                }
            )
        }
    )
})

// get all tracks in a playlist
app.get('/api/playlists/:id/tracks', isAuthenticated, (req, res) => {
    const playlistID = req.params.id
    const userID = req.session.spotifyID

    db.get(`SELECT * FROM playlists WHERE id = ? AND user_id = ?`, 
        [playlistID, userID], 
        (err, playlist) => {
            if (err) return res.status(500).json({ error: "Database error" })
            if (!playlist) return res.status(403).json({ error: "Unauthorized" })

            db.all(`SELECT * FROM tracks WHERE playlist_id = ?`, 
                [playlistID], 
                (err, tracks) => {
                    if (err) return res.status(500).json({ error: "Database error" })
                    res.json(tracks)
                }
            )
        }
    )
})

// delete track from playlist
app.delete('/api/playlists/:playlistId/tracks/:trackId', isAuthenticated, (req, res) => {
    const { playlistID, trackID } = req.params
    const userID = req.session.spotifyID

    db.get(`SELECT * FROM playlists WHERE id = ? AND user_id = ?`, 
        [playlistID, userID], 
        (err, playlist) => {
            if (err) return res.status(500).json({ error: "Database error" })
            if (!playlist) return res.status(403).json({ error: "Unauthorized" })

            db.run(`DELETE FROM tracks WHERE id = ? AND playlist_id = ?`, 
                [trackID, playlistID], 
                function(err) {
                    if (err) return res.status(500).json({ error: "Database error" })
                    if (this.changes === 0) return res.status(404).json({ error: "Track not found" })
                    res.json({ message: "Track deleted" })
                }
            )
        }
    )
})

/*
// Add tracks
app.post('/api/playlists/:id/tracks', (req, res) => {
	const playlist = playlists[req.params.id]
	if (!playlist) {
		return res.status(404).json({ message: 'No playlist found'})
	}
	const { name, artist } = req.body
	const track = { id: crypto.randomUUID(), name, artist }
	playlist.tracks.push(track)
	res.status(201).json(track)
})

// Update track in playlist
app.put('/api/playlists/:playlistId/tracks/:trackId', (req, res) => {
	const playlist = playlists[req.params.playlistId]
	if (!playlist) {
		return res.status(404).json({ message: 'No playlist found'})
	}
	const track = playlist.tracks.find(t => t.id === req.params.trackId)
	if (!track) {
		return res.status(404).json({ message: 'No track found'})
	}
	track.name = req.body.name || track.name
	track.artist = req.body.artist || track.artist
	res.json(track)
})

// Delete track from playlist
app.delete('/api/playlists/:playlistId/tracks/:trackId', (req, res) => {
	const playlist = playlists[req.params.playlistId]
	if (!playlist) {
		return res.status(404).json({ message: 'Playlist not found' })
	}
	const trackIndex = playlist.tracks.findIndex(t => t.id === req.params.trackId)
	if (trackIndex === -1) {
		return res.status(404).json({ message: 'Track not found' })
	}
	playlist.tracks.splice(trackIndex, 1)
	res.status(204).send()
})
*/

app.listen(port, () => {
    console.log(`Listening at port ${port}`)
})
