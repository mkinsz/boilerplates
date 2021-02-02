import { store } from '../utils';
import { notification, message } from 'antd'

import * as ws from '../services'
import * as session from '../utils'

export const AUTH = {
	connect: () => store.dispatch({ type: 'MSP_CONNECT' }),
	disconnect: () => {
		store.dispatch({ type: 'MSP_DISCONNECT' });
		notification['warning']({ message: '系统提醒', description: '服务器已断开...' })
	},
	login: (user, pass) => store.dispatch({ type: '/msp/v2/authen/login', user, pass }),
	logout: async () => {
		store.dispatch({ type: '/msp/v2/authen/logout' })
		try{ await ws.receive(1000) }catch(e) { message.warning('登出超时...') }
	},
	token: () => store.dispatch({ type: '/msp/v2/authen/token', payload: { timestamp: '0' } }),
	keepalive: () => store.dispatch({ type: 'MSP_KEEP_ALIVE' }),
	remove: () => {
		session.setToken()
		const r = session.getRem()
		const rem = r && JSON.parse(r)
		!rem && session.setUser()
		!rem && session.setPass()
	},
	release: async () => {
		try{ await ws.release() }catch(e) { console.log('ws releae:', e) }
	}
};