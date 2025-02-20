#!/usr/bin/env node

const http = require('http')

const dancers = []

const handleRequest = (req, res) => {
	const [path, query] = req.url.split('?')
	console.log(req.method)
	if(req.method === "GET"){
		console.log("- WOAH IN GET")
		return sendResponse(res, dancers, 200)
	}

	if(req.method === "POST"){
		console.log("- WOAH IN POST")
		let body = ''
		req.on('data', (data) => {
			body += data
		})
		req.on('end', () => {
			const params = Object.fromEntries(body.split('&').map(
				(param) => param.split('=')
			))
			dancers.push(params)
			sendResponse(res, dancers, 200)
		})
	}

	if(req.method == "PUT"){
		console.log("- IN PUT!!")
		let body = ''
		req.on('data', (data) => {
			body += data
		})
		req.on('end', () => {
			const params = Object.fromEntries(body.split('&').map(
				(param) => param.split('=')
			))
			console.log(params)
			const index = dancers.findIndex(name => name.who === params.who)
			if(index != -1){
				console.log("WE HAVE A DANCER")
				dancers[index] = params
				sendResponse(res, dancers, 200)
			} else {
				console.log("NO DANCER")
				sendResponse(res, dancers, 404)
			}
		})
	}
}
const sendResponse = (res, data, status_code) => {
	res.writeHead(status_code, {
		"Content-Type": "application/json"
	})
	res.write(JSON.stringify(data))
	res.end()
}
const server = http.createServer(handleRequest)
server.listen(3000)