import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { eventProxy } from '../../utils'
import { message } from 'antd'

const initialState = {
    offset: 0,
    tmpAdd: undefined,
    users: {},
    udevs: [],
    uwalls: []
}

export default (state = initialState, action) => {
    switch (action.type) {
        case '/msp/v2/user/updata': {
            const mesg = action.body.unpack(pb.UserList.deserializeBinary, 'msp.cnt.user.UserList')
            if (!mesg) return state;
            const users = { ...state.users }
            mesg.getStateList().map(m => {
                const uu = m.toObject();
                users[uu.id] = { ...uu, ...uu.user }
            })
            return { ...state, users };
        }
        case '/msp/v2/user/lock/updata': {
            const mesg = action.body.unpack(pb.UserLockState.deserializeBinary, 'msp.cnt.user.UserLockState')
            if (!mesg) return state;
            const users = { ...state.users }
            const u =  users[mesg.getId()]
            u && (u.islock = mesg.getState())
            return { ...state, users };
        }
        case '/msp/v2/user/permission/delete': {
            const { payload } = action;
            const mesg = new pb.UserResList()
            mesg.setUserid(payload.id)
            payload.list.map(m => {
                const user = new pb.UserRes()
                user.setType(payload.type)
                user.setId(m)
                mesg.addRes(user)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.user.UserResList')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/user/permission/add': {
            const { payload } = action;
            const mesg = new pb.UserResList()
            mesg.setUserid(payload.id)
            payload.list.map(m => {
                const user = new pb.UserRes()
                user.setType(payload.type)
                user.setId(m)
                mesg.addRes(user)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.user.UserResList')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/user/permission/query/ack': {
            const body = action.body.unpack(pb.UserResList.deserializeBinary, 'msp.cnt.user.UserResList')
            if (!body) return state;
            const id = body.getUserid()
            const udevs = body.getResList().map(m => m.toObject())
            if (udevs.length <= 0) return state;
            return udevs[0].type == 2 ? { ...state, udevs } : { ...state, uwalls: udevs };
        }
        case '/msp/v2/user/permission/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setSubid(payload.subid)
            mesg.setSize(200)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.subid })
            return state;
        }
        case '/msp/v2/user/lock/config': {
            const mesg = new pb.ValueU32()
            mesg.setValue(action.payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: action.payload.id })
            return state
        }
        case '/msp/v2/user/lock/config/ack': {
            if (action.err) return state;
            const users = { ...state.users }
            const u = users[action.serial]
            u && (u.islock = 0);
            message.success('操作成功');
            return { ...state, users };
        }
        case '/msp/v2/user/delete': {
            const mesg = new pb.ValueU32()
            mesg.setValue(action.payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            const users = { ...state.users }
            delete users[action.payload.id]
            return { ...state, users };
        }
        case '/msp/v2/user/delete/ack': {

            return state;
        }
        case '/msp/v2/user/config/ack': {
            if (action.err) return state;
            const recv = action.body.unpack(pb.User.deserializeBinary, 'msp.cnt.user.User')
            if (!recv) return state;
            const user = recv.toObject()
            const users = { ...state.users }
            users[user.id] = user
            return { ...state, users };
        }
        case '/msp/v2/user/config': {
            const { payload } = action;
            const mesg = new pb.User()
            mesg.setId(payload.id)
            mesg.setName(payload.name)
            mesg.setPass(payload.pass)
            mesg.setType(payload.type)
            mesg.setIslock(payload.islock)
            mesg.setIsuse(payload.isuse)
            mesg.setValidity(payload.validity)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.user.User')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/user/password/config': {
            const { payload } = action;
            const tmpAdd = payload;
            const mesg = new pb.UserPassword()
            mesg.setId(payload.id)
            mesg.setOldpwd(payload.oldpwd)
            mesg.setNewpwd(payload.newpwd)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.user.UserPassword')
            send({ evt: action.type, body })
            return { ...state, tmpAdd };
        }
        case '/msp/v2/user/password/config/ack': {
            return state;
        }
        case '/msp/v2/user/query': {
            const { payload } = action;
            const nstate = _.cloneDeep(state);
            nstate.users = {}
            const mesg = new pb.Query()
            mesg.setSize(10)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body })
            return nstate;
        }
        case '/msp/v2/user/query/ack': {
            const body = action.body.unpack(pb.UserList.deserializeBinary, 'msp.cnt.user.UserList')
            if (!body) return state;
            const nstate = _.cloneDeep(state);

            const lsts = body.getUserList();

            if (lsts.length == 0) {
                nstate.offset = 0
                return nstate
            }
            else {
                nstate.offset += lsts.length
                const mesg = new pb.Query()
                mesg.setOffset(nstate.offset)
                mesg.setSize(10)
                const body = new proto.google.protobuf.Any()

                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/user/query', body, serial: action.serial })
            }
            lsts.map(m => { nstate.users[m.getId()] = m.toObject(), nstate.users[m.getId()].key = m.getId() })
            return nstate;
        }
        default: return state;
    }
}