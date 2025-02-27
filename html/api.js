fetch('/api', { method: 'GET'})
.then(body => body.json())
.then(dancers => {
    dancers.forEach(dancer => {
        const p = document.createElement('p')
        p.innerText = `Name: ${dancer.who}`
        document.body.append(p)
    })
})