import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { message } from 'antd';

const KVM_REQ_NUM = 10
const QUERY_SIZE = 10;

const initState = {
    kvms: {},
    monitor: {},
    status: {},
    tvpush: [],
    switchpush: {},
    switchcur: {},
    group: {},
    powers: {},
    kvmpush: {},
    kvmpushmems: []
}

const kvmReq = (type, payload) => {
    const mesg = new pb.Query()
    mesg.setOffset(payload.offset)
    mesg.setSize(payload.size || KVM_REQ_NUM)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
    send({ evt: type, body })
}

export default (state = initState, action) => {
    switch (action.type) {
        case '/msp/v2/kvm/query': {
            kvmReq(action.type, action.payload)
            return state;
        }
        case '/msp/v2/kvm/query/ack': {
            const mesg = action.body.unpack(pb.KvmInfoList.deserializeBinary, 'msp.cnt.kvm.KvmInfoList')
            if (!mesg) return state;
            const kvms = { ...state.kvms }
            const recv = mesg.getKvminfoList()
            recv.map(m => kvms[m.getId()] = m.toObject())
            if (recv.length == KVM_REQ_NUM)
                kvmReq('/msp/v2/kvm/query', { offset: Object.keys(kvms).length, size: KVM_REQ_NUM })
            return { ...state, kvms };
        }
        case '/msp/v2/kvm/detail/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/kvm/detail/query/ack': {
            const mesg = action.body.unpack(pb.KvmInfo.deserializeBinary, 'msp.cnt.kvm.KvmInfo')
            if (!mesg) return state;
            const kvms = { ...state.kvms }
            kvms[mesg.getId()] = mesg.toObject()
            return { ...state, kvms };
        }
        case '/msp/v2/kvm/config': {
            const { payload } = action;
            const mesg = new pb.KvmInfo();
            mesg.setName(payload.name)
            mesg.setId(payload.id)
            mesg.setRow(payload.row)
            mesg.setCol(payload.col)
            mesg.setModule(payload.module)
            mesg.setMenu(payload.menu)
            payload.arraytvList.map(m => {
                const tv = new pb.KvmTv()
                tv.setId(m.id)
                tv.setOutid(m.outid)
                tv.setArrayinList(m.arrayinList)
                mesg.addArraytv(tv)
            })
            mesg.setArraysrcList(payload.arraysrcList)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.KvmInfo')
            send({ evt: action.type, body })
            if (!payload.id) {
                const nstate = { ...state }
                nstate.tmp = payload
                return nstate;
            } else {
                const kvms = { ...state.kvms }
                kvms[payload.id] = { ...kvms[payload.id], ...payload }
                return { ...state, kvms };
            }
        }
        case '/msp/v2/kvm/config/ack': {
            if (action.err) {
                delete state.tmp
                return { ...state };
            }
            message.success('保存成功')
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!body || !state.tmp) return state;
            const id = body.getValue();
            const kvms = { ...state.kvms }
            kvms[id] = { ...state.tmp, id }
            delete state.tmp;
            return { ...state, kvms };

        }
        case '/msp/v2/kvm/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });

            const kvms = { ...state.kvms }
            delete kvms[payload.id]
            return { ...state, kvms };
        }
        case '/msp/v2/kvm/delete/ack': {
            if (!action.err) message.success('删除成功')
            return state;
        }
        case '/msp/v2/kvm/monitor/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/kvm/monitor/query/ack': {
            const body = action.body.unpack(pb.MonitorInfo.deserializeBinary, 'msp.cnt.kvm.MonitorInfo')
            if (!body) return state;
            const monitor = { ...state.monitor }
            monitor[body.getId()] = body.toObject()
            return { ...state, monitor };
        }
        case '/msp/v2/kvm/monitor/config': {
            const { payload } = action;
            const monitor = { ...state.monitor }
            const data = Object.values(payload.base)
            data.concat(
                Object.values(payload.advhor),
                Object.values(payload.advver),
                [payload.flag]
            )
            const mesg = new pb.MonitorInfo(data)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.MonitorInfo')

            _.merge(monitor[payload.base.id],
                {
                    ...payload.base, advhor: payload.advhor,
                    advver: payload.advver, flag: payload.flag
                })

            return { ...state, monitor };
        }
        case '/msp/v2/kvm/monitor/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/tv/monitor/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setSubid(payload.subid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/kvm/tv/monitor/query/ack': {
            // TODO: same as kvm/monitor/query above
            return state;
        }
        case '/msp/v2/kvm/tv/monitor/config': {
            // TODO: same as kvm/monitor/config above
            return state;
        }
        case '/msp/v2/kvm/tv/monitor/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/updata': {
            const body = action.body.unpack(pb.KvmCfgState.deserializeBinary, 'msp.cnt.kvm.KvmCfgState')
            if (!body) return state;
            const kvms = { ...state.kvms }
            const type = body.getState()
            const kvm = body.getKvm().toObject()
            if (type == 0) {
                kvms[kvm.id] = kvms[kvm.id] || {}
                _.merge(kvms[kvm.id], kvm);
            } else if (type == 2) {
                delete kvms[kvm.id]
            }
            return { ...state, kvms };
        }
        case '/msp/v2/kvm/status/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setSubid(payload.type)
            mesg.setOffset(0)
            mesg.setSize(10)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/kvm/status/query/ack': {
            const body = action.body.unpack(pb.KvmStateList.deserializeBinary, 'msp.cnt.kvm.KvmStateList')
            if (!body) return state;
            const status = { ...state.status }
            status[action.serial] = status[action.serial] || {}
            // 通道id，u8+u8+u8+u8（机箱号+槽位号+端口号+索引号）
            body.getKvmstateList().map(m => status[action.serial][m.getId()] = m.toObject())
            return { ...state, status };
        }
        case '/msp/v2/kvm/status/updata': {
            const body = action.body.unpack(pb.KvmStateList.deserializeBinary, 'msp.cnt.KvmStateList')

            return state;
        }
        case '/msp/v2/kvm/tvpush/query': {
            const { payload } = action;
            const mesg = new pb.PushCfg()
            mesg.setId(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.PushCfg')
            send({ evt: action.type, body, serial: payload.id })
            return { ...state, tvpush: [] };
        }
        case '/msp/v2/kvm/tvpush/query/ack': {
            const body = action.body.unpack(pb.PushCfg.deserializeBinary, 'msp.cnt.kvm.PushCfg')
            if (!body) return state;
            const tp = body.toObject()
            return { ...state, tvpush: tp.dstidList };
        }
        case '/msp/v2/kvm/push/config': {
            const { payload } = action;
            const mesg = new pb.PushCfg()
            mesg.setId(payload.id)
            mesg.setType(payload.type)
            switch (payload.type) {
                case 1:
                case 2: {
                    payload.dsts.map(m => {
                        const kp = new pb.KvmPush()
                        kp.setId(m.id)
                        kp.setWidth(m.width)
                        kp.setHeight(m.height)
                        kp.setStartx(m.startx)
                        kp.setStarty(m.starty)
                        mesg.addDstid(kp)
                    })
                } break;
                case 3: {
                    payload.dsts.map(m => {
                        const kp = new pb.KvmPush()
                        kp.setId(m)
                        mesg.addDstid(kp)
                    })
                } break;
            }

            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.PushCfg')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/kvm/push/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/kvmpush/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            delete state.kvmpush;
            return state;
        }
        case '/msp/v2/kvm/kvmpush/query/ack': {
            const body = action.body.unpack(pb.KvmGroupInfo.deserializeBinary, 'msp.cnt.kvm.KvmGroupInfo')
            if (!body) return state;
            const kvmpush = body.toObject();
            return { ...state, kvmpush };
        }
        case '/msp/v2/kvm/push/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/kvm/push/query/ack': {
            const body = action.body.unpack(pb.Ids.deserializeBinary, 'msp.cnt.cfg.Ids')
            if (!body) return state;
            const kvmpushmems = body.getIdList()
            console.log('Kvm push query: ', kvmpushmems)
            return { ...state, kvmpushmems };
        }
        case '/msp/v2/kvm/kvmswitch/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/kvm/kvmswitch/query/ack': {
            const body = action.body.unpack(pb.KvmGroupInfo.deserializeBinary, 'msp.cnt.kvm.KvmGroupInfo')
            if (!body) return state;
            const switchpush = body.toObject();
            return { ...state, switchpush };
        }
        case '/msp/v2/kvm/kvmswitch/cur/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/kvm/kvmswitch/cur/query/ack': {
            const body = action.body.unpack(pb.KvmGroupInfo.deserializeBinary, 'msp.cnt.kvm.KvmGroupInfo')
            if (!body) return state;
            const switchcur = body.toObject();
            return { ...state, switchcur };
        }
        case '/msp/v2/kvm/kvmswitch/cur/config': {
            const { payload } = action;
            const mesg = new pb.KvmGroupInfo()
            mesg.setId(payload.id)
            payload.mems.map(m => mesg.addMember(new pb.ValueU32([parseInt(m)])))
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.KvmGroupInfo')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/kvm/kvmswitch/cur/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/trans/start/config': {
            return state;
        }
        case '/msp/v2/kvm/trans/start/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/trans/end/config': {
            return state;
        }
        case '/msp/v2/kvm/trans/end/config/ack': {
            return state;
        }
        case '/msp/v2/kvm/reset/config': {
            return state;
        }
        case '/msp/v2/kvm/group/query': {
            const msg = new pb.Query()
            msg.setOffset(0)
            msg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(msg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body });
            return { ...state, group: {} };
        }
        case '/msp/v2/kvm/group/query/ack': {
            const mesg = action.body.unpack(pb.KvmGroupList.deserializeBinary, 'msp.cnt.kvm.KvmGroupList')
            if (!mesg) return state;
            const data = mesg.toObject().kvmgroupList;
            if (data.length == QUERY_SIZE) {
                const msg = new pb.Query()
                msg.setOffset(Object.keys(state.group).length)
                msg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(msg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/kvm/group/query', body });
            }

            const group = { ...state.group }
            data.map(m => {
                if (m.memnum && m.parentid) {
                    const mesg = new pb.ValueU32()
                    mesg.setValue(m.id)
                    const body = new proto.google.protobuf.Any()
                    body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
                    send({ evt: '/msp/v2/kvm/group/mem/query', body, serial: m.id });
                }
                group[m.id] = { ...m }
            })
            return { ...state, group };
        }
        case '/msp/v2/kvm/group/mem/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: payload.id });
            return state;
        }
        case '/msp/v2/kvm/group/mem/query/ack': {
            const body = action.body.unpack(pb.KvmGroupInfo.deserializeBinary, 'msp.cnt.kvm.KvmGroupInfo')
            if (!body) return state;
            const group = { ...state.group }
            group[action.serial].mems = body.toObject().memberList.map(m => m.value);
            return { ...state, group };
        }
        case '/msp/v2/kvm/group/config': {
            const { group, kvmids } = action.payload;
            const mesg = new pb.KvmGroupInfo()
            const kgroup = new pb.KvmGroup(Object.values(group))
            kvmids.map(m => {
                const mem = new pb.ValueU32()
                mem.setValue(m)
                mesg.addMember(mem)
            })
            mesg.setGroup(kgroup)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.KvmGroupInfo')
            send({ evt: action.type, body });

            const grp = { ...state.group }
            group.mems = kvmids
            delete grp.group[group.id]
            grp[group.id] = _.cloneDeep(group)
            return { ...state, group: grp };
        }
        case '/msp/v2/kvm/group/config/ack': {
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!body) return state;
            const nstate = _.cloneDeep(state);
            const group = _.cloneDeep(nstate.group[0])
            if (group) {
                const index = body.getValue();
                group.id = index
                delete nstate.group[0]
                nstate.group[index] = group
            }
            return nstate;
        }
        case '/msp/v2/kvm/group/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });

            if (payload.id != 1) {
                const group = { ...state.group }
                delete group[payload.id]
                return { ...state, group };
            } else {
                return { ...state, group: {} }
            }
        }
        case '/msp/v2/kvm/group/delete/ack': {
            return state;
        }
        case '/msp/v2/kvm/power/query': {
            const { payload } = action;
            const mesg = new pb.ChnList();
            mesg.addChnid(Number(payload.id))
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.ChnList')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/kvm/power/query/ack': {
            const body = action.body.unpack(pb.PowerPrms.deserializeBinary, 'msp.cnt.kvm.PowerPrms')
            if (!body) return state;
            const ps = body.getPowerprmList();
            const powers = { ...state.powers }
            powers[action.serial] = ps[0].toObject()
            return { ...state, powers };
        }
        case '/msp/v2/kvm/power/config': {
            const { payload } = action;
            const { ip, on, off, mac, slot, mode,
                protocol, chnidList } = payload;
            const mesg = new pb.PowerPrm();
            chnidList.map(m => mesg.addChnid(Number(m)))
            ip && mesg.setIp(ip)
            on && mesg.setOn(on)
            off && mesg.setOff(off)
            mac && mesg.setMac(mac)
            slot && mesg.setSlot(slot)
            mode && mesg.setMode(mode)
            mesg.setProtocol(protocol)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.PowerPrm')
            send({ evt: action.type, body })
            const powers = { ...state.powers }
            const cfg = { ...payload, chnidList: [] }
            chnidList.map(m => powers[m] = cfg)
            return { ...state, powers };
        }
        case '/msp/v2/kvm/power/config/ack': {
            if (!action.err) {
                message.success('保存成功...')
            }
            return state;
        }
        case '/msp/v2/kvm/power/notify': {
            const body = action.body.unpack(pb.PowerPrms.deserializeBinary, 'msp.cnt.kvm.PowerPrms')
            if (!body) return state;
            const ps = body.getPowerprmList();
            const powers = { ...state.powers }
            powers[action.serial] = ps[0].toObject()
            return { ...state, powers };
        }
        default: return state;
    }
}