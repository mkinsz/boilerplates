let sct = null
let kpt = null  // timer to keep alive

const useWebsocket = (url, port) => {
    
}

const create_socket = url => {
    if (!sct) {
        console.log('建立Websocket连接...')
        sct = new WebSocket(url)
        sct.onopen = handle_open
        sct.onerror = handle_error
        sct.onclose = handle_close
        sct.onmessage = handle_message
    } else {
        console.log('Websocket已连接...')
    }
}

const handle_open = () => {
    send_ping()
}

/**连接失败重连 */
const handle_error = () => {
    sct.close()
    clearInterval(kpt)
    console.log('连接失败重连中...')
    if (sct.readyState !== 3) {
        sct = null
        create_socket()
    }
}

/**WS数据接收统一处理 */
const handle_message = e => {
    window.dispatchEvent(new CustomEvent('handle_message', {
        detail: {
            data: e.data
        }
    }))
}

const connecting_send = message => {
    setTimeout(() => {
        if (sct.readyState === 0) {
            connecting_send(message)
        } else {
            sct.send(JSON.stringify(message))
        }
    }, 1000)
}

export const send_msg = message => {
    if (sct !== null && sct.readyState === 3) {
        sct.close()
        create_socket()
    } else if (sct.readyState === 1) {
        sct.send(JSON.stringify(message))
    } else if (sct.readyState === 0) {
        connecting_send(message)
    }
}

const handle_close = () => {
    clearInterval(kpt)
    console.log('Websocket已断开....正在尝试重连...')
    if (sct.readyState !== 2) {
        sct = null
        create_socket()
    }
}

const send_ping = (time = 5000, ping = 'ping') => {
    sct.send(ping)

    clearInterval(kpt)
    kpt = setInterval(() => {
        sct.send(ping)
    }, time)
}

export default useWebsocket;
