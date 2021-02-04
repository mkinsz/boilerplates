import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { message } from 'antd'

const QUERY_SIZE = 16

const initState = {
    mpus: {},
    umts: {},
    decs: [],
    nets: [],
    preset: [],
    details: {}
}

export default (state = initState, action) => {
    switch (action.type) {
        case '/msp/v2/net/mpulan/query': {
            send({ evt: action.type })
            return state;
        }

        case '/msp/v2/net/mpulan/query/ack': {
            const body = action.body.unpack(pb.Lancfg.deserializeBinary, 'msp.cnt.cfg.Lancfg')
            if (!body) return state;
            const mpus = { ...state.mpus }
            mpus.lanin = body.getIpin()
            mpus.lanout = body.getIpout()
            return { ...state, mpus };
        }

        case '/msp/v2/net/mpugw/query': {
            send({ evt: action.type });
            return state;
        }

        case '/msp/v2/net/mpugw/query/ack': {
            const body = action.body.unpack(pb.String.deserializeBinary, 'msp.cnt.String')
            const mpus = { ...state.mpus }
            mpus.gw = body ? body.getValue() : 0
            return { ...state, mpus };
        }

        case '/msp/v2/net/mpu/query': {
            const msg = new pb.Query()
            msg.setOffset(0)
            msg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(msg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/net/mpu/query/ack': {
            const body = action.body.unpack(pb.NetCfgList.deserializeBinary, 'msp.cnt.cfg.NetCfgList')
            const nets = []
            body.getNetList().map((m, i) => nets.push({ key: i, ...m.toObject() }))
            return { ...state, nets };
        }
        case '/msp/v2/net/mpu/config': {
            const { payload } = action;
            const mesg = new pb.NetCfg()
            mesg.setId(payload.id)
            mesg.setName(payload.name)
            mesg.setUse(payload.use)
            mesg.setDhcp(payload.dhcp)
            mesg.setIp(payload.ip)
            mesg.setType(payload.type)
            mesg.setMask(payload.mask)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.NetCfg')
            send({ evt: action.type, body });

            const nets = [...state.nets];
            const index = nets.findIndex(m => payload.key === m.key)
            if (index > -1)
                nets.splice(index, 1, { ...nets[index], ...payload })
            return { ...state, nets };
        }
        case '/msp/v2/net/mpu/config/ack': {
            return state;
        }
        case '/msp/v2/net/mpu/updata': {
            const body = action.body.unpack(pb.NetCfg.deserializeBinary, 'msp.cnt.cfg.NetCfg')
            const nets = [...state.nets];
            const index = nets.findIndex(m => body.getId() === m.id)
            if (index > -1)
                nets.splice(index, 1, { ...body.toObject() })
            return { ...state, nets };
        }
        case '/msp/v2/net/umt/query': {
            if (Object.keys(state.umts).length) return state;
            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/net/umt/query/ack': {
            const body = action.body.unpack(pb.UmtList.deserializeBinary, 'msp.cnt.cfg.UmtList')
            if (!body) return state;
            const umtlist = body.getUmtList()
            const umts = { ...state.umts }
            umtlist.map(u => umts[u.getId()] = u.toObject())
            return { ...state, umts };
        }
        case '/msp/v2/net/umt/config': {
            const { payload } = action;
            const mesg = new pb.Umt()
            mesg.setId(payload.id)
            mesg.setName(payload.name)
            mesg.setType(payload.type)
            mesg.setIp(payload.ip)
            mesg.setPort(payload.port)
            mesg.setUser(payload.user)
            mesg.setPass(payload.pass)
            mesg.setRtsp(payload.rtsp)
            mesg.setIpcmedia(payload.ipcmedia)
            mesg.setMtmedia(payload.mtmedia)
            mesg.setConf(payload.conf)
            mesg.setDevice(payload.device)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.Umt')
            send({ evt: action.type, body });

            if (payload.id) {
                const umts = { ...state.umts }
                _.merge(umts[payload.id], payload)
                return { ...state, umts }
            }

            return { ...state, tmpumt: { ...payload } };
        }
        case '/msp/v2/net/umt/config/ack': {
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!state.tmpumt) return state;
            if (!body) return state;
            const id = body.getValue()
            if (!id) {
                delete state.tmpumt
                return { ...state }
            }

            const umts = { ...state.umts }
            umts[id] = { ...state.tmpumt, id }
            delete state.tmpumt;
            return { ...state, umts };
        }
        case '/msp/v2/net/umt/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: payload.id });
            return state;
        }
        case '/msp/v2/net/umt/delete/ack': {
            if (action.err) return state;
            const umts = { ...state.umts }
            delete umts[action.serial]
            return { ...state, umts };
        }
        case '/msp/v2/net/umt/updata': {
            const body = action.body.unpack(pb.UmtStateList.deserializeBinary, 'msp.cnt.cfg.UmtStateList')
            const umtstates = body.getUmtStateList()
            umtstates.map(m => {
                const mesg = new pb.Query()
                mesg.setId(m.id)
                mesg.setOffset(0)
                mesg.setSize(1)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: action.type, body });
            })
            return state;
        }
        case '/msp/v2/net/umtdec/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/net/umtdec/query/ack': {
            const body = action.body.unpack(pb.UmtDecList.deserializeBinary, 'msp.cnt.cfg.UmtDecList')
            if (!body) return state;
            const decs = []
            const umtdecs = body.getUmtdecList()
            umtdecs.map(d => {
                decs.push(d.toObject())
                const mesg = new pb.Query()
                mesg.setId(d.getBox())
                mesg.setSubid(d.getSlot())
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/net/umtdev/module/query', body });
            })
            return { ...state, decs };
        }
        case '/msp/v2/net/umtdec/add': {
            const { payload } = action;
            const mesg = new pb.UmtDecList()
            const dec = new pb.UmtDec()
            dec.setId(payload.id)
            dec.setBox(payload.box)
            dec.setSlot(payload.slot)
            dec.setMode(payload.mode)
            mesg.addUmtdec(dec);
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.UmtDecList')
            send({ evt: action.type, body });

            const decs = [...state.decs]
            const index = decs.findIndex(
                m => payload.id === m.id &&
                    payload.box === m.box &&
                    payload.slot === m.slot);
            if (index > -1) decs[index].mode = payload.mode;
            else decs.push(payload)
            return { ...state, decs };
        }
        case '/msp/v2/net/umtdec/add/ack': {
            return state;
        }
        case '/msp/v2/net/umtdec/delete': {
            const { payload } = action;
            const mesg = new pb.UmtDecList()
            const dec = new pb.UmtDec()
            dec.setId(payload.id)
            dec.setBox(payload.box)
            dec.setSlot(payload.slot)
            mesg.addUmtdec(dec)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.UmtDecList')
            send({ evt: action.type, body, serial: payload.id });
            return { ...state, tmp_del_dec: payload };
        }
        case '/msp/v2/net/umtdec/delete/ack': {
            if (action.err || !state.tmp_del_dec) return state;
            const decs = [...state.decs]
            const index = decs.findIndex(
                m => state.tmp_del_dec.id === m.id &&
                    state.tmp_del_dec.box === m.box &&
                    state.tmp_del_dec.slot === m.slot);
            if (index > -1) decs.splice(index, 1);
            const nstate = { ...state, decs }
            delete nstate.tmp_del_dec
            return nstate;
        }
        case '/msp/v2/net/umtdev/module/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setOffset(payload.offset)
            mesg.setSize(payload.size)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/net/umtdev/module/query/ack': {
            const body = action.body.unpack(pb.DecModeList.deserializeBinary, 'msp.cnt.cfg.DecModeList')
            if (!body) return state;
            const modes = body.getModeList()
            const decs = [...state.decs]
            modes.map(m => {
                const index = decs.findIndex(d => d.slot == m.getSlot() && d.box == m.getBox())
                if (index > -1)
                    decs[index].module = m.getModule()
            })
            return { ...state, decs };
        }
        case '/msp/v2/net/umtdev/module/config': {
            const { payload } = action;
            const mesg = new pb.DecModeList()
            const mode = new pb.DecMode()
            mode.setBox(payload.box)
            mode.setSlot(payload.slot)
            mode.setModule(payload.module)
            mesg.addMode(mode);
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.DecModeList')
            send({ evt: action.type, body });

            const decs = [...state.decs]
            const index = decs.findIndex(d => d.slot == payload.slot && d.box == payload.box)
            if (index > -1)
                decs[index].module = payload.module
            return { ...state, decs };
        }
        case '/msp/v2/net/umtdev/module/config/ack': {
            return state;
        }
        case '/msp/v2/net/mpulan/config': {
            const { payload } = action
            const mesg = new pb.Lancfg()
            mesg.setIpin(payload.ipin)
            mesg.setIpout(payload.ipin)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.Lancfg')
            send({ evt: action.type, body });

            const mpus = { ...state.mpus }
            mpus.lanin = payload.ipin;
            mpus.lanout = payload.ipout;
            return { ...state, mpus };
        }
        case '/msp/v2/net/mpulan/config/ack': {
            return state;
        }
        case '/msp/v2/net/mpugw/config': {
            const { payload } = action;
            const mpus = { ...state.mpus };
            mpus.gw = payload.value;
            const mesg = new pb.String()
            mesg.setValue(payload.value)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.String')
            send({ evt: action.type, body });
            return { ...state, mpus };
        }
        case '/msp/v2/net/mpugw/config/ack': {
            return state;
        }
        case '/msp/v2/net/umtdev/module/updata': {
            state.decs.map(m => {
                if (m.type == 2) {
                    const mesg = new pb.Query()
                    mesg.setId(m.getBox())
                    mesg.setSubid(m.getSlot())
                    const body = new proto.google.protobuf.Any()
                    body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                    send({ evt: '/msp/v2/net/umtdev/module/query', body });
                }
            })
            return state;
        }
        //查询所有预调列表
        case '/msp/v2/net/media/precall/list/query': {
            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial:0 })
            return state
        }
        //应答
        case '/msp/v2/net/media/precall/list/query/ack': {
            const recv = action.body.unpack(pb.PrePlans.deserializeBinary, 'msp.cnt.cfg.PrePlans')
            if (!recv) return state;
            const preset = action.serial ? [...state.preset] : []
            const plans = recv.getPlanList()
            plans.map(m => preset.push(m.toObject()))
            if(plans.length == QUERY_SIZE) {
                const mesg = new pb.Query()
                mesg.setOffset(preset.length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/net/media/precall/list/query', body, serial:plans.length })
            }
            return { ...state, preset }
        }
        //预调详情
        case '/msp/v2/net/media/precall/detail/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setOffset(0)
            mesg.setSize(128)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, })
            return state
        }
        //应答
        case '/msp/v2/net/media/precall/detail/query/ack': {
            const body = action.body.unpack(pb.GroupMems.deserializeBinary, 'msp.cnt.cfg.GroupMems')
            if (!body) return state;
            const details = {}
            const chns = body.getChnList()
            chns.map(m => details[m.getId()] = m.toObject())
            return { ...state, details }
        }
        case '/msp/v2/net/media/precall/add': {
            const { payload } = action;
            const mesg = new pb.PrePlan()
            mesg.setName(payload.name)
            mesg.setEnable(payload.enable)
            mesg.setAction(payload.action)
            payload.chns.map(m => {
                const mem = new pb.GroupMem()
                mem.setId(m.id)
                mesg.addChn(mem)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.PrePlan')
            send({ evt: action.type, body })
            return { ...state, tmppreset: payload }
        }
        case '/msp/v2/net/media/precall/add/ack': {
            if(action.err) {
                const nstate = {...state}
                delete nstate.tmppreset;
                return nstate;
            }
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!body) return state;
            if (state.tmppreset) {
                const id = body.getValue()
                const preset = [ ...state.preset ]
                state.tmppreset.id = id;
                preset.push({ ...state.tmppreset })
                const details = {}
                // state.tmppreset.chns.map(m => details[m.id] = m);
                delete state.tmppreset;
                return { ...state, preset, details }
            }
            return state;
        }
        //预调删除
        case '/msp/v2/net/media/precall/delete': {
            const { payload } = action;
            const mesg = new pb.Ids()
            mesg.addId(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.Ids')
            send({ evt: action.type, body })

            const preset = [ ...state.preset ]
            const index = preset.findIndex(m => m.id == payload.id)
            if(index > -1) preset.splice(index, 1)
            return { ...state, preset }
        }
        //应答
        case '/msp/v2/net/media/precall/delete/ack': {
            return state
        }
        case '/msp/v2/net/media/precall/modify': {
            const { payload } = action;
            const mesg = new pb.PrePlan()
            mesg.setId(payload.id)
            mesg.setName(payload.name)
            mesg.setEnable(payload.enable)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.PrePlan')
            send({ evt: action.type, body })
            const preset = [ ...state.preset ]
            const index = preset.findIndex(m => m.id == payload.id)
            if(index > -1) {
                preset[index].name = payload.name
                preset[index].enable = payload.enable ? 1 : 0
            }
            return { ...state, preset }
        }
        case '/msp/v2/net/media/precall/modify/ack': {
            return state
        }
        //预调成员的增加和删除
        case '/msp/v2/net/media/precall/mem/modify': {
            const { payload } = action;
            const mesg = new pb.PrePlan()
            mesg.setId(payload.id)
            mesg.setName(payload.name)
            mesg.setEnable(payload.enable)
            mesg.setAction(payload.action)
            payload.chns.map(m => {
                const mem = new pb.GroupMem()
                mem.setId(payload.action == 2 ? m : m.id)
                mesg.addChn(mem)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.PrePlan')
            send({ evt: action.type, body })
            const details = { ...state.details }
            switch (payload.action) {
                case 2: { //删除组员
                    payload.chns.map(m => delete details[m])
                } break;
                case 3: { //添加组员
                    payload.chns.map(m => details[m.id] = m)
                } break;
            }
            return { ...state, details }
        }
        //应答
        case '/msp/v2/net/media/precall/mem/modify/ack': {
            if (action.err) message.error('删除失败')
            return state
        }
        default: return state;
    }
}