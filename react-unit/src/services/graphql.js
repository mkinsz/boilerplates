import log from '../utils/log'

let host

const getHost = async () => {
	host = process.env.NODE_ENV == 'production' ? window.location.hostname : '10.67.12.106'
	// else host = '10.67.76.94'
	host += ':8090'
}

const post = async body => {
	if (!host) await getHost()
	console.log('post', host)
	log(body)
	return fetch(location.protocol + '//' + host + '/query', {
		method: 'POST',
		body: JSON.stringify({ "query": body })
	}).then(
		response => response.text()
	).then(responseBody => {
		try {
			const b = JSON.parse(responseBody)
			console.log(b)
			return b;
		} catch (error) {
			console.log(JSON.parse(responseBody))
			return responseBody;
		}
	}).catch(err => {
		console.log(err)
	})
}

// const post = async body => {
// 	if (!host) await getHost()
// 	console.log('post', host)
// 	log(body)
// 	return fetch(location.protocol + '//' + host + '/api/graphql', {
// 		method: 'POST',
// 		headers: {'Content-Type': 'application/graphql'},
// 		body:  body
// 	}).then(resp => {console.log(resp.json()); return resp})
// }

let ws

let id = 0

const listeners = {}

const connect = async () => {
	if (!host) getHost()

	ws = new WebSocket('ws://' + host + '/graphql', 'graphql-ws')
	ws.onmessage = e => {
		// console.log(e.data)
		const msg = JSON.parse(e.data)
		const listener = listeners[msg.id]
		if (!listener) return
		const onmessage = listener.listener.onmessage
		if (!onmessage) return
		onmessage(msg.payload)
	}
	ws.onclose = () => {
		for (const i in listeners)
			listeners[i].onclose()
		setTimeout(() => connect(), 1000)
	}
}

const listen = body => {
	if (!ws) connect()

	const listener = { onmessage, close }
	const innerlistener = { timer: null, onclose, listener: listener }
	const i = ++id
	if (!listeners[i]) listeners[i] = innerlistener

	innerlistener.onclose = () => {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			innerlistener.timer = setTimeout(innerlistener.onclose, 1000)
			return
		}
		ws.send(JSON.stringify({
			Type: 'start', ID: i.toString(), Payload: { query: body }
		}))
	}
	innerlistener.onclose()

	listener.close = () => {
		if (ws && ws.readyState === WebSocket.OPEN)
			ws.send(`{"Type":"stop","ID":"${i}"`)
		if (innerlistener.timer) clearTimeout(innerlistener.timer)
		delete listeners[i]
	}

	return listener
}

const stringify = value => {
	switch (typeof value) {
		case 'object':
			if (Array.isArray(value)) {
				let ret = '['
				let first = true
				for (const item of value) {
					if (first) first = false
					else ret += ','
					ret += stringify(item)
				}
				ret += ']'
				return ret
			} else {
				let ret = '{'
				let first = true
				for (const key in value) {
					if (first) first = false
					else ret += ','
					ret += `${key}:${stringify(value[key])}`
				}
				ret += '}'
				return ret
			}
		case 'string': return `"${value}"`
		default: return value
	}
}

export { post, listen, stringify }
