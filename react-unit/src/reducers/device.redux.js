import { send } from '../services';
import * as pb from '../proto';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { GSN, CHNTYPE } from '../components/public'
import { message } from 'antd';

const initialState = {
    tmp: {},
    eqps: {},
    fws: {},
    mpu: {},
    ains: {},
    aouts: {},
    vins: {},
    vouts: {},
    groups: {},
    mems: {},
    umtgroups: {},
    umtdevs: {},
    umtupdatings: [],
    umttree: [],
    netdevs: {},
    coms: {},
    searchs: {}, //通道查询结果
    batchs: {}
}

const QUERY_SIZE = 16
const QUERY_SUB_SIZE = 8

const UMTCHN_STATE = {
    OFF: 0,
    ON: 1,
    NEW: 2,
    DEL: 3,
    MOD: 4
}

const buildGroupBranch = (_mems, chns) => {
    const a = _mems[_mems.length - 1]
    const index = chns.findIndex(m => a.nextid == m.id)
    if (index > -1) {
        _mems.push(chns[index])
        chns.splice(index, 1);
        return buildGroupBranch(_mems, chns)
    }
    return [..._mems];
}

const buildUmtTree = (list, id, datas) => {
    return list.map(node => {
        if (node.id === id) {
            let children = []
            if (node.children) {
                children = [...node.children]
                const last = children[children.length - 1]
                if (last && last.id == 'loading') children.pop();
            }

            const pendings = []
            datas.map(m => {
                !children.find(n => m.id == n.id) && pendings.push({
                    ...m, key: m.id, title: m.name, isLeaf: true
                })
            })
            children = children.concat(pendings)
            const length = children.filter(m => m.isLeaf).length
            datas.length == 8 && children.push({
                key: uuidv4(), id: 'loading', umtid: node.umtid, length,
                groupid: node.id, isLeaf: true, checkable: false, title: "加载更多..."
            })
            return { ...node, children };
        }

        if (node.children)
            return { ...node, children: buildUmtTree(node.children, id, datas) };

        return node;
    });
}

const umtTreeDataUpdata = (list, pid, dev, op) => {
    return list.map(node => {
        if (node.id === pid) {
            const children = [...node.children]
            const index = children.findIndex(m => m.id == dev.id)
            const chnnl = children[index]
            switch (op) {
                case UMTCHN_STATE.NEW: children.push(dev); break;
                case UMTCHN_STATE.ON: if (index > -1) chnnl.online = true; break;
                case UMTCHN_STATE.OFF: if (index > -1) chnnl.online = false; break;
                case UMTCHN_STATE.DEL: if (index > -1) children = children.splice(index, 1); break;
                case UMTCHN_STATE.MOD: if (index > -1) children = children.splice(index, 1, { ...chnnl, ...dev }); break;
                default: ;
            }
            return { ...node, children };
        }
        if (node.children)
            return { ...node, children: umtTreeDataUpdata(node.children, pid, dev) };

        return node;
    });
}

const buildUmtChildren = (node, list = []) => {
    if (!node || !list.length) return undefined

    const nlist = list.filter(m => m.parentid == node.id)
    if (!nlist.length) return undefined;

    const elist = list.filter(m => m.parentid != node.id)
    return nlist.map(m => {
        const children = buildUmtChildren(m, elist)
        const ret = { ...m, key: String(m.id), isLeaf: false, title: m.name }
        children && (ret.children = children)
        return ret;
    })
}

const buildUmtGroups = groups => {
    const roots = groups.filter(n => n.parentid == '' || n.parentid == '0')
    const leafs = groups.filter(n => n.parentid != '' && n.parentid != '0')
    return roots.map(n => ({ ...n, key: String(n.id), title: n.name, children: buildUmtChildren(n, leafs) }));
}

function chn_closure(context) {
    var chns = {};
    var finished = false
    function inner() {
        return finished ? chns : undefined;
    }
    inner.reset = () => {
        chns = {}
        finished = false
    }
    inner.modify = (id, property, value) => {
        const chn = chns[id]
        if(chn) {
            chn[property] = value;
        }
    }
    inner.alter = (chnlist) => {
        chnlist.map(m => {
            const inf = m.toObject();
            chns[inf.base.id] = { ...inf, ...inf.base }
        })

        if (chnlist.length == QUERY_SIZE) {
            const offset = Object.keys(chns).length
            const mesg = new pb.Query()
            mesg.setOffset(offset)
            mesg.setSize(QUERY_SIZE)
            mesg.setId(context)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: '/msp/v2/chn/query', body, serial: offset, context: context })
        } else {
            finished = true
        }
    }
    return inner;
}

const vins = chn_closure(CHNTYPE.VIN)
const ains = chn_closure(CHNTYPE.AIN)
const vouts = chn_closure(CHNTYPE.VOUT)
const aouts = chn_closure(CHNTYPE.AOUT)

export const mspsDev = (state = initialState, action) => {
    switch (action.type) {
        case '/msp/v2/eqp/fw/query': {
            const { payload } = action;
            if (state.fws[payload.sn]) return state;
            const mesg = new pb.Query()
            mesg.setSn(payload.sn)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/eqp/fw/query/ack': {
            const recv = action.body.unpack(pb.FwList.deserializeBinary, 'msp.cnt.dev.FwList')
            const sn = recv.getSn()
            const devs = recv.getFwList();
            const fws = { ...state.fws }
            fws[sn] = devs.map(m => m.toObject());
            return { ...state, fws };
        }

        case '/msp/v2/eqp/query': {
            const { payload } = action;

            // const eqps = Object.values(state.eqps)
            // const len = !payload.id ? eqps.length :
            //     eqps.filter(m => m.type == payload.id).length
            // if (len >= QUERY_SIZE) return state;

            const mesg = new pb.Query()
            mesg.setSn(payload.sn)
            mesg.setId(payload.id)
            mesg.setSubid(payload.subid)
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.id, context: 0 })
            return state;
        }
        case '/msp/v2/eqp/query/ack': {
            const recv = action.body.unpack(pb.DevList.deserializeBinary, 'msp.cnt.dev.DevList')
            if (!recv) return state;
            const eqps = { ...state.eqps }
            const devs = recv.getDevList();
            devs.map(m => eqps[m.getSn()] = m.toObject())
            if (devs.length == QUERY_SIZE) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setSize(QUERY_SIZE)

                const tdevs = !action.serial ? Object.values(eqps) :
                    Object.values(eqps).filter(m => m.type == action.serial)
                mesg.setOffset(action.context + QUERY_SIZE)

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/eqp/query', body, serial: action.serial, context: action.context + QUERY_SIZE })
            }

            return { ...state, eqps };
        }
        case '/msp/v2/eqp/mpu/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/eqp/mpu/query/ack': {
            const mesg = action.body.unpack(pb.DevBasic.deserializeBinary, 'msp.cnt.dev.DevBasic')
            const mpu = mesg.toObject()
            return { ...state, mpu };
        }
        case '/msp/v2/chn/change': {
            const {payload} = action;
            let chns;
            switch (payload.type) {
                case CHNTYPE.AIN: chns = ains; break;
                case CHNTYPE.VIN: chns = vins; break;
                case CHNTYPE.AOUT: chns = aouts; break;
                case CHNTYPE.VOUT: chns = vouts; break;
                default: return state;
            }
            const {id, property, value } = payload;
            chns.modify(id, property, value);
            
            const chnnls = chns() || {};

            const nstate = { ...state }
            switch (action.context) {
                case CHNTYPE.AIN: nstate.ains = { ...chnnls }; break;
                case CHNTYPE.VIN: nstate.vins = { ...chnnls }; break;
                case CHNTYPE.AOUT: nstate.aouts = { ...chnnls }; break;
                case CHNTYPE.VOUT: nstate.vouts = { ...chnnls }; break;
            }

            return nstate;
        }
        case '/msp/v2/chn/query': {
            const { payload } = action;
            if (payload.clear) {
                ains.reset();
                vins.reset();
                aouts.reset();
                vouts.reset();
                return { ...state, vins: {}, ains: {}, vouts: {}, aouts: {} };
            }
            if (true == payload.forced) {
                switch (payload.type) {
                    case CHNTYPE.AIN: ains.reset(); break;
                    case CHNTYPE.VIN: vins.reset(); break;
                    case CHNTYPE.AOUT: aouts.reset(); break;
                    case CHNTYPE.VOUT: vouts.reset(); break;
                }
            } else {
                switch (payload.type) {
                    case CHNTYPE.AIN: if (Object.keys(state.ains).length) return state; break;
                    case CHNTYPE.VIN: if (Object.keys(state.vins).length) return state; break;
                    case CHNTYPE.AOUT: if (Object.keys(state.aouts).length) return state; break;
                    case CHNTYPE.VOUT: if (Object.keys(state.vouts).length) return state; break;
                }
            }

            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            mesg.setId(payload.type)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: 0, context: payload.type })
            return state;
        }
        case '/msp/v2/chn/query/ack': {
            if (action.err) return state;
            const mesg = action.body.unpack(pb.ChnInfoList.deserializeBinary, 'msp.cnt.chn.ChnInfoList')
            const chnlist = mesg.getChnList()

            let chns;
            switch (action.context) {
                case CHNTYPE.AIN: chns = ains; break;
                case CHNTYPE.VIN: chns = vins; break;
                case CHNTYPE.AOUT: chns = aouts; break;
                case CHNTYPE.VOUT: chns = vouts; break;
                default: return state;
            }

            chns.alter(chnlist)
            const chnnls = chns();
            if (!chnnls) return state;

            const nstate = { ...state }
            switch (action.context) {
                case CHNTYPE.AIN: nstate.ains = { ...chnnls }; break;
                case CHNTYPE.VIN: nstate.vins = { ...chnnls }; break;
                case CHNTYPE.AOUT: nstate.aouts = { ...chnnls }; break;
                case CHNTYPE.VOUT: nstate.vouts = { ...chnnls }; break;
            }

            return nstate;
        }
        case '/msp/v2/chn/cfg/audio/query/ack': {
            const mesg = action.body.unpack(pb.Property.deserializeBinary, 'msp.cnt.chn.Property')
            let nstate = _.cloneDeep(state)
            const data = mesg.toObject();
            nstate.ains[data.id] = { ...nstate.ains[data.id], audio: data.type }
            return nstate;
        }
        case '/msp/v2/chn/updata': {
            const mesg = action.body.unpack(pb.ChnInfoList.deserializeBinary, 'msp.cnt.chn.ChnInfoList')
            const chns = mesg.getChnList()
            const tains = [], tvins = [], taouts = [], tvouts = []

            chns.map(m => {
                const info = m.toObject();
                const chn = { ...info, ...info.base }
                switch (chn.base.chntype) {
                    case CHNTYPE.AIN: tains.push(chn); break;
                    case CHNTYPE.VIN: tvins.push(chn); break;
                    case CHNTYPE.AOUT: taouts.push(chn); break;
                    case CHNTYPE.VOUT: tvouts.push(chn); break;
                    default: ;
                }
            })

            tains.length && console.log('--------->', tains)
            tvins.length && console.log('--------->', tvins)
            taouts.length && console.log('--------->', taouts)
            tvouts.length && console.log('--------->', tvouts)

            const chn_updata = (ins, sins) => {
                if (ins.length) {
                    ins.map(m => {
                        const st = m.state;
                        delete m.state;
                        switch (st) {
                            case 3: delete sins[m.id]; break;
                            default: sins[m.id] = m;
                        }
                    })
                    return { ...sins }
                }
                return sins
            }

            const ains = chn_updata(tains, state.ains)
            const vins = chn_updata(tvins, state.vins)
            const aouts = chn_updata(taouts, state.aouts)
            const vouts = chn_updata(tvouts, state.vouts)
            return { ...state, ains, vins, aouts, vouts }
        }
        case '/msp/v2/chn/group/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/chn/group/query/ack': {
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            return { ...state, groupnum: body.getValue() };
        }
        case '/msp/v2/chn/group/updata': {
            const mesg = action.body.unpack(pb.ChnGroupList.deserializeBinary, 'msp.cnt.chn.ChnGroupList')
            const gchns = mesg.getChngroupList();
            const groups = { ...state.groups }
            gchns.map(m => groups[m.getId()] = { ...m.toObject(), children: [] })
            gchns.map(m => {
                const mesg = new pb.Query()
                mesg.setId(m.getId())
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/chn/group/mem/query', body, serial: m.getId() })
            })

            return { ...state, groups: { ...state.groups, ...groups } };
        }
        case '/msp/v2/chn/group/add': {
            const { payload } = action;
            const mesg = new pb.ChnGroup()
            mesg.setName(payload.name)
            mesg.setParentid(payload.parentid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnGroup')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/group/add/ack': {
            if (action.err) return state;
            const mesg = action.body.unpack(pb.ChnGroup.deserializeBinary, 'msp.cnt.chn.ChnGroup')
            const group = mesg.toObject();
            const groups = { ...state.groups }
            groups[group.id] = { ...group, title: group.name, key: group.id, children: [] }
            return { ...state, groups };
        }
        case '/msp/v2/chn/group/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/group/delete/ack': {
            if (action.err) return state;
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const value = body.getValue()
            const groups = { ...state.groups }
            delete groups[value]
            return { ...state, groups };
        }
        case '/msp/v2/chn/group/config': {
            const { payload } = action;
            const mesg = new pb.ChnGroup()
            mesg.setName(payload.name)
            mesg.setParentid(payload.parentid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnGroup')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/group/state/updata': {

            return state;
        }
        case '/msp/v2/chn/group/mem/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/chn/group/mem/query/ack': {
            const mesg = action.body.unpack(pb.GroupMemList.deserializeBinary, 'msp.cnt.chn.GroupMemList')
            const gmems = mesg.getGroupmenList()
            if (!gmems.length) return state;
            const groups = { ...state.groups }
            if (!groups[action.serial]) return state;
            const children = []
            const devs = gmems.map(m => m.toObject())

            const buildGroupData = (devs, children) => {
                const head = devs.find(m => {
                    const index = devs.findIndex(n => { if (!!n.nextid) return m.id == n.nextid })
                    return index < 0 ? m : false;
                })
                if (!head) return;
                const nmems = buildGroupBranch([head], _.cloneDeep(devs))
                nmems.map(m => {
                    const index = children.findIndex(n => n.id == m.id)
                    if (index > -1) children.splice(index, 1, { ...m, title: m.name, key: uuidv4(), parentid: action.serial, isLeaf: true })
                    else children.push({ ...m, title: m.name, key: uuidv4(), parentid: action.serial, isLeaf: true })
                })
            }

            buildGroupData(devs, children)
            groups[action.serial].children = children;
            return { ...state, groups };
        }
        case '/msp/v2/chn/group/mem/add': {
            const { payload } = action;
            const groups = { ...state.groups }
            const mesg = new pb.GroupMemList()
            mesg.setId(payload.id)

            payload.mems.map(m => {
                const gmems = groups[payload.id].children
                if (gmems.findIndex(n => n.id == m.id) < 0) {
                    if (gmems.length) gmems[gmems.length - 1].nextid = m.id;
                    gmems.push({
                        ...m, key: uuidv4(), title: m.name, nextid: 0,
                        parentid: payload.id, isLeaf: true, online: m.online
                    })
                }

                const mem = new pb.GroupMem()
                mem.setNextid(0)
                mem.setId(m.id)
                mem.setName(m.name)
                mem.setGroupid(payload.id)
                mesg.addGroupmen(mem)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.GroupMemList')

            send({ evt: action.type, body, serial: payload.id })
            return { ...state, groups };
        } dfd
        case '/msp/v2/chn/group/mem/add/ack': {
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const id = mesg.getValue();
            return state;
        }
        case '/msp/v2/chn/group/mem/delete': {
            const { payload } = action;
            const mesg = new pb.GroupMemList()
            mesg.setId(payload.id)
            payload.list.map(m => {
                const dev = new pb.GroupMem()
                dev.setId(m.id)
                dev.setGroupid(m.groupid)
                mesg.addGroupmen(dev)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.GroupMemList')
            send({ evt: action.type, body })

            const groups = { ...state.groups }
            const group = groups[payload.list[0].groupid]
            group.children = group.children.filter(m => m.id != payload.list[0].id)
            return { ...state, groups };
        }
        case '/msp/v2/chn/group/mem/delete/ack': {
            return state;
        }
        case '/msp/v2/chn/group/mem/clean': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/group/mem/clean/ack': {
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            // const id = mesg.getValue();
            return state;
        }
        case '/msp/v2/chn/group/mem/config': {
            const { payload } = action;
            const mesg = new pb.GroupMem()
            mesg.setId(payload.id)
            mesg.setGroupid(payload.parentid)
            const groups = { ...state.groups }
            const group = groups[payload.parentid]
            const devs = _.cloneDeep(group.children);
            switch (payload.op) {
                case 'up': {
                    const curIndex = devs.findIndex(m => m.id == payload.id)
                    const preIndex = devs.findIndex(m => m.nextid == payload.id)
                    if (preIndex == -1) return state;
                    const preDev = devs[preIndex];
                    const curDev = devs[curIndex]

                    const lstIndex = devs.findIndex(m => m.nextid == preDev.id)
                    if (lstIndex > -1) devs[lstIndex].nextid = payload.id

                    curDev.nextid = preDev.id
                    preDev.nextid = payload.nextid;
                    mesg.setNextid(preDev.id)
                } break;
                case 'down': {
                    const curIndex = devs.findIndex(m => m.id == payload.id)
                    const preIndex = devs.findIndex(m => m.nextid == payload.id)
                    const nexIndex = devs.findIndex(m => m.id == payload.nextid)
                    if (nexIndex == -1) return state;
                    if (preIndex > -1) devs[preIndex].nextid = payload.nextid

                    const curDev = devs[curIndex]
                    const nexDev = devs[nexIndex]

                    curDev.nextid = nexDev.nextid
                    nexDev.nextid = payload.id
                    mesg.setNextid(curDev.nextid)
                } break;
                default: return state;
            }
            const head = devs.find(m => {
                const index = devs.findIndex(n => { if (!!n.nextid) return m.id == n.nextid })
                return index < 0 ? m : false;
            })
            if (!head) return state;

            const children = buildGroupBranch([head], devs)
            group.children = children;

            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.GroupMem')
            send({ evt: action.type, body, serial: payload.parentid })
            return { ...state, groups };
        }
        case '/msp/v2/chn/group/mem/config/ack': {
            return state;
        }
        case '/msp/v2/chn/group/mem/updata': {
            const mesg = action.body.unpack(pb.GroupMemList.deserializeBinary, 'msp.cnt.chn.GroupMemList')
            const status = mesg.getState()
            const gmems = mesg.getGroupmenList()
            switch (status) {
                case 1: {   // 新建

                } break;
                case 2: {   // 修改

                } break;
                case 3: {   // 删除

                } break;
                case 4: {   // 上移

                } break;
                case 5: {   // 下移

                } break;
            }
            // TODO: 
            return state;
        }
        case '/msp/v2/chn/umt/group/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.id)
            mesg.setOffset(payload.offset)
            mesg.setSize(QUERY_SUB_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/chn/umt/group/query/ack': {
            const umtgps = action.body.unpack(pb.UmtGroupList.deserializeBinary, 'msp.cnt.chn.UmtGroupList')
            const groups = { ...state.umtgroups[action.serial] }
            const umts = umtgps.getUmtgroupList();
            umts.map(m => groups[m.getId()] = m.toObject())
            if (QUERY_SUB_SIZE == umts.length) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setOffset(Object.keys(groups).length)
                mesg.setSize(QUERY_SUB_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/chn/umt/group/query', body, serial: action.serial })
            }
            const umtgroups = { ...state.umtgroups }
            umtgroups[action.serial] = groups
            const umttree = buildUmtGroups(Object.values(groups))
            return { ...state, umtgroups, umttree }
        }
        case '/msp/v2/chn/umt/chn/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setSn(payload.sn)
            mesg.setId(payload.id)
            mesg.setOffset(payload.offset)
            mesg.setSize(QUERY_SUB_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({
                evt: action.type, body,
                serial: QUERY_SUB_SIZE,
                context: payload.offset + QUERY_SUB_SIZE
            })
            return state;
        }
        case '/msp/v2/chn/umt/chn/query/ack': {
            const nmesg = action.body.unpack(pb.UmtChnList.deserializeBinary, 'msp.cnt.chn.UmtChnList')
            const devs = nmesg.getUmtchnList()
            if (!devs.length) return state;
            const umtid = devs[0].getUmtid()
            const gid = devs[0].getParentid()
            const pendings = devs.map(m => {
                const dev = m.toObject()
                return dev;
            })

            const ntree = [...state.umttree]
            const umttree = buildUmtTree(ntree, gid, pendings)

            if (devs.length == QUERY_SUB_SIZE &&
                action.serial < 16) {
                const mesg = new pb.Query()
                mesg.setSn(gid)
                mesg.setId(umtid)
                mesg.setOffset(action.context)
                mesg.setSize(QUERY_SUB_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({
                    evt: '/msp/v2/chn/umt/chn/query', body,
                    serial: action.serial + QUERY_SUB_SIZE,
                    context: action.context + QUERY_SUB_SIZE
                })
            }
            return { ...state, umttree }
        }
        case '/msp/v2/chn/umt/chn/updata': {
            const mesg = action.body.unpack(pb.UmtChnStateList.deserializeBinary, 'msp.cnt.chn.UmtChnStateList')
            const umtstates = mesg.getUmtchnstateList()
            let umttree = [...state.umttree]
            umtstates.map(m => {
                const dev = m.getDev()
                const sta = m.getState()
                umttree = umtTreeDataUpdata(umttree, dev.parentid, dev, sta)
            })
            return { ...state, umttree }
        }
        case '/msp/v2/chn/umt/chn/simple/query': {
            const mesg = new pb.QueryChnList()
            action.payload.map(m => mesg.addChn(new pb.QueryChn([m])))
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.QueryChnList')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/umt/chn/simple/query/ack': {
            const mesg = action.body.unpack(pb.QueryChnList.deserializeBinary, 'msp.cnt.chn.QueryChnList')
            const chns = mesg.getChnList();
            if (!chns.length) return state;
            const netdevs = { ...state.netdevs }
            chns.map(m => {
                const chn = m.toObject()
                netdevs[chn.id] = { ...chn, name: chn.alias, gbid: chn.no }
            })
            return { ...state, netdevs };
        }
        case '/msp/v2/chn/cfg/vedio/com/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/com/query/ack': {
            const mesg = action.body.unpack(pb.ComCfg.deserializeBinary, 'msp.cnt.chn.ComCfg')
            const coms = { ...state.coms }
            coms[action.serial] = mesg.toObject()
            return { ...state, coms };
        }
        case '/msp/v2/chn/cfg/vedio/com/config': {
            const { payload } = action;
            const { id, type, port, databits, stopbits, parity, baudrate } = payload;
            const mesg = new pb.ComCfg();
            mesg.setId(id)
            mesg.setType(type)
            mesg.setPort(port)
            mesg.setParity(parity)
            mesg.setDatabits(databits)
            mesg.setStopbits(stopbits)
            mesg.setBaudrate(baudrate)
            mesg.setState(payload.state)
            mesg.setProto(payload.proto)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ComCfg')
            send({ evt: action.type, body })
            const coms = { ...state.coms }
            coms[id] = payload
            return { ...state, coms };
        }
        case '/msp/v2/chn/cfg/vedio/com/config/ack': {
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/com/ptz/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/com/ptz/query/ack': {
            const mesg = action.body.unpack(pb.ComPtz.deserializeBinary, 'msp.cnt.chn.ComPtz')
            const coms = { ...state.coms }
            coms[action.serial].enable = mesg.getEnable()
            return { ...state, coms };
        }
        case '/msp/v2/chn/cfg/vedio/com/ptz/config': {
            const { payload } = action;
            const mesg = new pb.ComPtz()
            mesg.setId(payload.id)
            mesg.setEnable(payload.enable)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ComPtz')
            send({ evt: action.type, body, serial: payload.id })
            const coms = { ...state.coms }
            coms[payload.id].enable = payload.enable;
            return { ...state, coms };
        }
        case '/msp/v2/chn/cfg/vedio/com/ptz/config/ack': {
            return state;
        }
        case '/msp/v2/chn/search/config': {
            const { payload } = action;
            if (payload) {
                const mesg = new pb.Query()
                mesg.setSn(payload.sn)
                mesg.setOffset(payload.offset || 0)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: action.type, body, serial: payload.offset || 0 })
                return state;
            }
            return { ...state, searchs: {} };
        }
        case '/msp/v2/chn/search/config/ack': {
            const recv = action.body.unpack(pb.GroupMemList.deserializeBinary, 'msp.cnt.chn.GroupMemList')
            const devs = recv.getGroupmenList();
            if (!devs.length) message.warn('未搜索到匹配的数据...')
            const searchs = !action.serial ? {} : { ...state.searchs }
            devs.map(m => searchs[m.getId()] = m.toObject())
            return { ...state, searchs };
        }
        case '/msp/v2/eqp/updata': {
            const recv = action.body.unpack(pb.DevInfo.deserializeBinary, 'msp.cnt.dev.DevInfo')
            const sn = recv.getSn();
            const eqps = { ...state.eqps }
            const batchs = { ...state.batchs }
            const info = recv.toObject();
            if (info.online) {
                eqps[sn] = info;
                delete batchs[sn];
                const mesg = new pb.Query()
                mesg.setSn(sn)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/eqp/fw/query', body })
            } else {
                delete eqps[sn];
            }
            return { ...state, eqps, batchs };
        }
        case '/msp/v2/eqp/batch/progress/updata': {
            const mesg = action.body.unpack(pb.BatchProg.deserializeBinary, 'msp.cnt.dev.BatchProg')
            const sn = mesg.getSn();
            const batchs = { ...state.batchs }
            batchs[sn] = { ...mesg.toObject() }
            return { ...state, batchs };
        }
        default: return state;
    }
}