#!/usr/bin/env node

const http = require('http')
const url = require('url')

const dancers = []

const handleRequest = (req, res) => {
	const parsed = url.parse(req.url, true)
	const path = parsed.pathname
	const query = parsed.query

	console.log("PATH", path)
	console.log("QUERY", query)

	if (req.method === "GET") {
		console.log("- WOAH IN GET")
		if (Object.keys(query).length > 0) {	// if we get any parameters under GET response
			const current_dancers = dancers.filter(item => 
				item.who === query.who || 
				item.x === query.x || 
				item.y === query.y)
			if (current_dancers.length > 0) {
				return sendResponse(res, current_dancers, 200)
			} else {
				return sendResponse(res, { error: "Dancer not found." }, 404)
			}
		}
		return sendResponse(res, dancers, 200)	// without any params, just return all dancers
	}

	if (req.method === "POST") {
		console.log("- WOAH IN POST")
		let body = ''
		req.on('data', (data) => {
			body += data
		})
		req.on('end', () => {
			const params = Object.fromEntries(body.split('&').map(
				(param) => param.split('=')
			))

			if(!params.who || !params.x || !params.y){
				return sendResponse(res, {error: "Missing parameters."}, 400)
			}
			dancers.push(params)
			return sendResponse(res, dancers, 201)
		})
	}

	if (req.method == "PUT") {
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
			if (index != -1) {
				console.log("WE HAVE A DANCER")
				dancers[index] = params
				sendResponse(res, dancers, 201)
			} else {
				console.log("NO DANCER")
				sendResponse(res, { error: "Dancer not found." }, 404)
			}
		})
	}

	if (req.method == "DELETE") {
		console.log("- IN DELETE!!")
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
			if (index != -1) {
				console.log("WE HAVE A DANCER")
				dancers.splice(index, 1)
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