async function postDancer(event){
    event.preventDefault()
    const formData = new FormData(event.target)
    console.log("POST FORM DATA:", formData)
    await fetch('/api', {
        method: 'POST',
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

async function deleteDancer(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    console.log("DELETE FORM DATA:", formData)
    await fetch('/api', {
        method: 'DELETE',
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

async function updateDancer(event) {
    event.preventDefault()
    const formData = new FormData(event.target)
    console.log("PUT FORM DATA:", formData)
    await fetch('/api', {
        method: 'PUT',
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