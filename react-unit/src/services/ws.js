import "core-js/stable";
import "regenerator-runtime/runtime";
import { store, err2str } from '../utils';
import { AUTH } from '../actions';
import * as pb from '../proto';
import { message } from 'antd';
import { getToken, setToken, setUser } from '../utils';
import { DEBUG_ADDR } from '../config'

let socket = null;
let ktimer = null;	// 保活定时器
let manual = false;
let opened = false;
let recnum = 0;

/*
	connect -> token ? -> query check-token ? -> login & token or it's ok
					   -> login & token
*/

class Queue {
	constructor() {
		this.queue = []
	}
	enqueue(obj) {
		this.queue.push(obj)
	}
	dequeue() {
		return this.queue.shift();
	}
	clear() {
		this.queue = []
	}
	length() {
		return this.queue.length
	}
	empty() {
		return this.queue.length ? false : true;
	}
}

const msgpool = new Queue()

const msgworker = async () => {
	while(!msgpool.empty()) {
		const msg = msgpool.dequeue();
		setTimeout(() => request(msg), 0)
	}
}

const send = msg => {
	if (!socket || WebSocket.OPEN != socket.readyState || !opened) {
		// socket && console.warn("ws error：", socket, socket.readyState)
		msgpool.enqueue(msg)
		return;
	}

	request(msg);

	switch (msg.evt) {
		case '/msp/v2/authen/alive': break
		default: console.log('send: ', msg.evt);
	}
};

const handle = buf => {
	const msg = {};
	const b = new Uint8Array(buf);
	console.log('recv size: ', b.length)
	const m = pb.Msg.deserializeBinary(b)
	const h = m.getHead().toObject()

	msg.type = h.uri
	msg.err = h.err
	msg.serial = h.serial
	msg.context = h.context
	msg.body = m.getBody()

	// Silence and Special
	switch (msg.type) {
		case '/msp/v2/authen/login/ack': msg.token = h.token; break;
		default: ;
	}

	switch (msg.type) {
		case '/msp/v2/authen/alive': return;
		default: console.log('recv: ', msg.type);
	}

	if (msg.err.length) {
		// Error Number Filiter
		switch (parseInt(msg.err)) {
			case 20002:
			case 20203:
			case 20204: break;
			default: {
				const value = { 'Type': msg.type, 'Error': msg.err }
				console.log('%c  [%s] : %c %o', 'color: red', "Error", 'color: #0000ff', value);
				message.error(err2str[msg.err] || `未知错误: ${msg.err}`)
			}
		}
	}

	store.dispatch(msg)
}

const request = msg => {
	const token = getToken();
	const mesg = new pb.Msg()
	const head = new pb.Head()

	head.setUri(msg.evt)
	head.setSerial(msg.serial)
	head.setContext(msg.context)
	token && head.setToken(token)

	mesg.setHead(head)
	mesg.setBody(msg.body)

	socket.send(mesg.serializeBinary());
}

const response = data => {
	if (!data.size) return;
	if (data.arrayBuffer) {
		data.arrayBuffer().then(buf => handle(buf)).catch(e => console.log('err: ', e))
	} else {
		const reader = new FileReader()
		reader.readAsArrayBuffer(data)
		reader.onloadend = () => handle(reader.result)
	}
};

const receive = (time = 0) => {
	return new Promise((resolve, reject) => {
		socket.onmessage = e => { response(e.data); resolve(); }
		setTimeout(() => {
			resolve('timeout...')
		}, time || 3000)
	})
}

const open = (resolve) => {
	console.log('ws open...');
	opened = true;
	ktimer = setInterval(() => AUTH.keepalive(), 5000);
	msgworker();
	resolve(true)
}

const close = (e, url = null) => {
	// Temporary
	setToken();

	socket = null;
	opened = false;
	clearInterval(ktimer);
	console.log('ws close...', 'code:', e.code, 'was-clean:', e.wasClean, 'reason:', e.reason)

	msgpool.clear();
	if(!manual) {
		AUTH.disconnect()
		setTimeout(() => reconnect(url), 5000)
	} 
}

const error = e => {
	opened = false;
	if(socket) {
		console.log('ws err: ', e)
		socket = null;
	}
}

const connect = url => {
	return socket || new Promise(resolve => {
		socket = new WebSocket(url);
		socket.onerror = e => error(e)
		socket.onclose = e => close(e, url);
		socket.onmessage = e => response(e.data);
		socket.onopen = e => open(resolve)
	})
};

const disconnect = () => {
	return !socket || new Promise((resolve, reject) => {
		socket.onclose = e => { close(e); resolve(); }
		socket.close();
	})
};

const reconnect = url => {
	recnum++;
	if(recnum < 3) connect(url)
}

const init = async () => {
	console.log('ws init...')
	recnum = 0;
	manual = false;

	let url = 'https:' === location.protocol ? 'wss://' : 'ws://';
	url += process.env.NODE_ENV == 'production' ? window.location.hostname : DEBUG_ADDR
	url += ':28712'
	await connect(url)
}

const release = () => {
	manual = true;
	return disconnect();
}

const status = () => {
	return socket && socket.readyState
}

export { send, receive, init, release, status };
