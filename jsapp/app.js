#!/usr/bin/env node

const http = require('http')

const dancers = []

const handleRequest = (req, res) => {
	const [path, query] = req.url.split('?')
	if (req.method == "GET") {
		return sendResponse(res, dancers, 200)
	}
	if (req.method == "POST") {
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