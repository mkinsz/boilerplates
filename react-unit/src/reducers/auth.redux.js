import { send } from '../services';
import * as pb from '../proto';
import _ from 'lodash';
import { message } from 'antd';
import { setUser, setToken, setAuthType } from '../utils';
import * as session from '../utils';

const initialState = {
	id: null,
	connected: false,
	occupy: false,
	logouted: false,
	favors: {},
	manulogout: false,
	type: undefined
};

const QUERY_SIZE = 16;

export const mspsAuth = (state = initialState, action) => {
	switch (action.type) {
		case 'MSP_CONNECT': {
			return { ...state, connected: true };
		}
		case 'MSP_DISCONNECT': {
			return { ...state, connected: false };
		}
		case 'MSP_KEEP_ALIVE': {
			send({ evt: '/msp/v2/authen/alive' })
			return state;
		}
		case '/msp/v2/authen/login': {
			const msg = new pb.Login()
			msg.setUser(action.user)
			msg.setPass(action.pass)
			const body = new proto.google.protobuf.Any()
			body.pack(msg.serializeBinary(), 'msp.cnt.user.Login')

			send({ evt: action.type, body })
			return state;
		}
		case '/msp/v2/authen/login/ack': {
			const body = action.body.unpack(pb.LoginAck.deserializeBinary, 'msp.cnt.user.LoginAck')
			const count = body.getCount()
			if (action.err == 20002) {
				!count ? message.warning('账号已锁定...') :
					message.warning(`账户名密码不正确, ${count}次后被锁定...`)
				return state;
			}

			const token = action.token;

			const id = body.getId()
			const tp = body.getType()

			setToken(token);
			setAuthType(tp);
			
			return { ...state, id, token, type: tp, occupy: false, manulogout:false }
		}
		case '/msp/v2/authen/logout': {
			send({ evt: action.type })
			return { ...state, token: null, favors: {}, manulogout: true };
		}
		case '/msp/v2/authen/logout/ack': {
			setToken();
			return state;
		}
		case '/msp/v2/user/grab/updata': {
			return { ...state, occupy: true };
		}
		case '/msp/v2/authen/notify': {
			const body = action.body.unpack(pb.Notify.deserializeBinary, 'msp.cnt.Notify')
			const status = body.getState()
			console.log('=> auth notify', status)
			switch (status) {
				case 0: break;
				case 1:
				case 2: setToken(); return { ...state, token: null };
				case 3: break;
				default: ;
			}
			return state
		}
		case '/msp/v2/chn/favorite/query': {
			const favors = Object.values(state.favors)
			if (favors.length) return state;

			const mesg = new pb.Query()
			mesg.setOffset(0)
			mesg.setSize(QUERY_SIZE)
			const body = new proto.google.protobuf.Any()
			body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
			send({ evt: action.type, body })
			return state;
		}
		case '/msp/v2/chn/favorite/query/ack': {
			const recv = action.body.unpack(pb.GroupMemList.deserializeBinary, 'msp.cnt.chn.GroupMemList')
			const favors = { ...state.favors }
			const devs = recv.getGroupmenList();
			devs.map(m => favors[m.getId()] = m.toObject())
			if (devs.length == QUERY_SIZE) {
				const mesg = new pb.Query()
				mesg.setSize(QUERY_SIZE)
				mesg.setOffset(Object.values(favors).length)

				const body = new proto.google.protobuf.Any()
				body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
				send({ evt: action.type, body, serial: action.serial })
			}

			return { ...state, favors };
		}
		case '/msp/v2/chn/favorite/config': {
			const { payload } = action;
			const mesg = new pb.GroupMemList()
			// mesg.setId(payload.id)   //用户ID，业务未用到
			mesg.setState(payload.type)
			payload.list.map(m => {
				const dev = new pb.GroupMem()
				dev.setId(m.id)
				mesg.addGroupmen(dev)
			})
			const body = new proto.google.protobuf.Any()
			body.pack(mesg.serializeBinary(), 'msp.cnt.chn.GroupMemList')
			send({ evt: action.type, body })

			const favors = { ...state.favors }
			payload.list.map(m => {
				if (7 == payload.type) delete favors[m.id] //取消收藏
				else if (6 == payload.type) favors[m.id] = m
			})
			return { ...state, favors };
		}
		case '/msp/v2/chn/favorite/config/ack': {
			return state;
		}
		case '/msp/v2/chn/favorite/clean': {
			send({ evt: action.type })
			return state;
		}
		case '/msp/v2/chn/favorite/clean/ack': {
			return state;
		}
		default:
			return state;
	}
}
