async function fetchAPI(event, method){
    event.preventDefault()
    const formData = new FormData(event.target)
    await fetch('/api', {
        method: method,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(formData)
    }).then(async res => {
            const data = await res.json()
            console.log(data)
        })
        .catch(error => {
            console.error("An error has occured:", error)
        })
    listDancers()
}

async function listDancers(){
    await fetch('/api', { 
            method: 'GET'
        })
        .then(body => body.json())
        .then(dancers => {
            const dancers_list = document.getElementById("all-dancers-list")
            dancers_list.innerHTML = ''

            if (dancers_list.length === 0){
                dancers_list.innerHTML = '<li>No Dancers found</li>'
                return
            }

            dancers.forEach(dancer => {
                const li = document.createElement('li')
                li.classList.add('dancer')
                li.innerText = `Name: ${dancer.who} | X: ${dancer.x} | Y: ${dancer.y}`
                dancers_list.appendChild(li)
            })
        })
        .catch(error => {
            console.error("An error has occured:", error)
        })
}

async function getDancer(event){
    event.preventDefault()
    const formData = new FormData(event.target)
    console.log("GET FORM DATA:", formData)
    const who = new URLSearchParams(formData).toString()
    await fetch('/api' + `?${who}`, {
        method: 'GET',
    }).then(async res => {
            const data = await res.json()
            console.log(data)

            const dancer_list = document.getElementById("dancer-list")
            dancer_list.innerHTML = ''

            if (dancer_list.length === 0 || data.error){
                dancer_list.innerHTML = '<li>Dancer not found</li>'
                return
            }

            data.forEach(dancer => {
                const li = document.createElement('li')
                li.classList.add('dancer')
                li.innerText = `Name: ${dancer.who} | X: ${dancer.x} | Y: ${dancer.y}`
                dancer_list.appendChild(li)
            })
        })
        .catch(error => {
            console.error("An error has occured:", error)
        })
}

// admins

async function checkAdmin() {
    const res = await fetch('/api/me', {
        method: 'GET',
    })

    const data = await res.json()
    if (data.role === "admin") {
        document.getElementById("admin-section").style.display = "block"
        loadUsers()
        return true
    } else {
        document.getElementById("status-message").innerText = "Access Denied: Not an admin"
        return false
    }
}

async function loadUsers() {
    const res = await fetch('/api/admin/users', {
        method: 'GET',
    })

    const users = await res.json()
    const userTable = document.getElementById("user-list")
    userTable.innerHTML = ""

    users.forEach(user => {
        const row = document.createElement("tr")
        row.innerHTML = `
            <td>${user.username}</td>
            <td>
                <p>Update Role:</p>
                <select onchange="updateUser('${user.id}', this.value)">
                    <option value="author" ${user.role === "author" ? "selected" : ""}>Author</option>
                    <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td><button onclick="deleteUser('${user.id}')">Delete</button></td>
        `
        userTable.appendChild(row)
    })
}

async function createUser(event){
    event.preventDefault()
    const responseDiv = document.getElementById("user-response")

    const formData = new FormData(event.target)
    const username = formData.get('new-username').toString().trim()
    const password = formData.get('new-password').toString().trim()
    const role = formData.get('new-role').toString().trim()

    await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, role })
    })
    .then(async res => {
        const data = await res.json()
        responseDiv.innerText = `User ${data.username} created with role: ${data.role}`
        loadUsers()
    })
}

async function updateUser(userId, newRole) {
    const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
    })

    const result = await res.json()
}

async function deleteUser(userId) {
    const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
    })

    const result = await res.json()
    loadUsers()
}

if(window.location.href.includes("admin.html")){
    const isAdmin = checkAdmin()
    .then(res => {
        if(!res){
            window.location.href = '/hw.html'
        }
    })
}