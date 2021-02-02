import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { message } from 'antd';

const initState = {
    mpu: {},
    time: {},
    access: {},
    auth: {},
    mass: {},
    access: {},
    exps: []
}

const LICENCEBIT = {
    'KVM': 0,
    'VIDEO': 1,
    'AUDIO': 2,
    'Rest': 3,
    'ZK': 4,
    'TVS': 5
}

export default (state = initState, action) => {
    switch (action.type) {
        case '/msp/v2/sys/query': {
            send({ evt: action.type, context: 1 })
            return state;
        }
        case '/msp/v2/sys/query/ack': {
            const mesg = action.body.unpack(pb.DevBasic.deserializeBinary, 'msp.cnt.dev.DevBasic')
            console.log(action.context)
            const nstate = _.cloneDeep(state)
            nstate.mpu = mesg.toObject()
            return nstate;
        }
        case '/msp/v2/sys/config': {
            const { payload } = action;
            const mesg = new pb.DevBasic()
            mesg.setSn(payload.sn)
            mesg.setBox(payload.box)
            mesg.setHid(payload.hid)
            mesg.setPid(payload.pid)
            mesg.setMac(payload.mac)
            mesg.setName(payload.name)
            mesg.setSlot(payload.slot)
            mesg.setModel(payload.model)
            mesg.setHwver(payload.hwver)
            mesg.setSoftver(payload.softver)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.dev.DevBasic')
            send({ evt: action.type, body });
            return { ...state, tmpinfo: payload };
        }
        case '/msp/v2/sys/config/ack': {
            const nstate = { ...state }
            if (action.err) {
                delete nstate.tmpinfo;
                return nstate;
            }
            message.success('设置成功...')
            nstate.mpu = { ...nstate.tmpinfo };
            delete nstate.tmpinfo;
            return nstate;
        }
        case '/msp/v2/sys/time/config': {
            const { payload } = action;
            const mesg = new pb.Time(Object.values(payload))
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.Time')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/time/config/ack': {
            if (!action.err) {
                message.info('同步成功...')
            }
            return state;
        }
        case '/msp/v2/sys/time/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/time/query/ack': {
            const mesg = action.body.unpack(pb.Time.deserializeBinary, 'msp.cnt.sys.Time')
            const nstate = _.cloneDeep(state)
            nstate.time = mesg.toObject()
            return nstate;
        }
        case '/msp/v2/sys/restore/config': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.type])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/accesscode/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/access/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/accesscode/query/ack': {
            if (action.err) return state;
            const mesg = action.body.unpack(pb.AccessCode.deserializeBinary, 'msp.cnt.sys.AccessCode')
            const access = mesg.toObject();
            return { ...state, access };
        }
        case '/msp/v2/sys/access/query/ack': {
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!mesg) return state;
            const access = { ...state.access }
            access.status = mesg.getValue()
            return { ...state, access };
        }
        case '/msp/v2/sys/access/config': {
            const { payload } = action;
            const mesg = new pb.AccessCode()
            mesg.setCode(payload.code)
            mesg.setOpt(payload.opt)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.AccessCode')
            send({ evt: action.type, body });
            if (!payload.opt) {
                const access = { ...state.access }
                delete access.code;
                return { ...state, access }
            }
            return state;
        }
        case '/msp/v2/sys/access/config/ack': {
            send({ evt: '/msp/v2/sys/access/query' })
            return state;
        }
        case '/msp/v2/sys/filetrans/end/config': {
            const { payload } = action;
            const mesg = new pb.FileInfo()
            mesg.setSize(payload.size)
            mesg.setName(payload.name)
            mesg.setOpt(payload.opt)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.FileInfo')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/filetrans/end/config/ack': {
            return state;
        }
        case '/msp/v2/sys/filetrans/updata': {
            return state;
        }
        case '/msp/v2/sys/licence/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/licence/query/ack': {
            if (action.err) return state;

            const mesg = action.body.unpack(pb.SysLicence.deserializeBinary, 'msp.cnt.sys.SysLicence')
            if (!mesg) return state;
            const auth = mesg.toObject()
            return { ...state, auth };
        }
        case '/msp/v2/sys/licence/config': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/licence/config/ack': {
            return state;
        }
        case '/msp/v2/sys/licence/end/config': {
            const { payload } = action;
            const mesg = new pb.FileInfo()
            mesg.setSize(payload.size)
            mesg.setName(payload.name)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.FileInfo')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/licence/end/config/ack': {
            return state;
        }
        case '/msp/v2/sys/licence/detail/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setSubid(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/licence/detail/query/ack': {
            const mesg = action.body.unpack(pb.LicenceState.deserializeBinary, 'msp.cnt.sys.LicenceState')
            if (!mesg) return state;
            // TODO:
            return state;
        }
        case '/msp/v2/sys/licence/expire/config': {
            const { payload } = action;
            const mesg = new pb.LicenceState()
            mesg.setModule(payload.module)
            mesg.setValue(payload.value)
            mesg.setEffecdue(payload.days)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.LicenceState')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/sys/licence/expire/config/ack': {            
            return state;
        }
        case '/msp/v2/sys/licence/expire/updata': {
            // TODO: 
            const mesg = action.body.unpack(pb.LicenceStateList.deserializeBinary, 'msp.cnt.sys.LicenceStateList')
            if (!mesg) return state;
            const exps = mesg.getLicenceList().toObject()
            console.warn('!!!!!!!!!!>', exps)
            return { ...state, expired: false, exps };
        }
        case '/msp/v2/sys/reboot/config': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/sys/reboot/config/ack': {
            return state;
        }
        case '/msp/v2/sys/reboot/updata': {
            message.warning('服务器正在重启...')
            return state;
        }
        default: return state;
    }
}