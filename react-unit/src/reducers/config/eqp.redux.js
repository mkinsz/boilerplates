import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { message } from 'antd';

const initState = {
    searchdev: {},
    chnnets: {},    // 通道网络使能
    edid: {
        offset: 0,
        edid: {},
        lst: {},
    },
    edids: {},
    defedid: '',
    curedid: undefined,
    upgrade: {},
    vaudioParam: {}, //视频通道音频参数
    batched: true,
}

const QUERY_SIZE = 10;

const batch_info = payload => {
    const mesg = new pb.BatchInfo()
    mesg.setMeth(payload.meth)
    mesg.setBody(payload.body)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.dev.BatchInfo')
    return body;
}

export default (state = initState, action) => {
    const { type: evt } = action;
    switch (action.type) {
        case '/msp/v2/eqp/batch/detail/query': {
            const { payload } = action;
            if (!payload) {
                return { ...state, upgrade: {} }
            }
            const mesg = new pb.PackageInfo()
            mesg.setName(payload.name)
            mesg.setPath(payload.path)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.dev.PackageInfo')
            send({ evt: action.type, body })
            return { ...state, upgrade: { loading: true } };
        }
        case '/msp/v2/eqp/batch/detail/query/ack': {
            const body = action.body.unpack(pb.PackageInfo.deserializeBinary, 'msp.cnt.dev.PackageInfo')
            if (!body) return state;
            const upgrade = body.toObject();
            upgrade.loading = false
            return { ...state, upgrade };
        }
        case '/msp/v2/eqp/search/config': {
            const { payload } = action;
            const mesg = new pb.SearchCfg()
            mesg.setTimeout(payload.timeout)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.dev.SearchCfg')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/eqp/search/config/ack': {
            return state;
        }
        case '/msp/v2/eqp/search/updata': {
            const mesg = action.body.unpack(pb.SearchDevList.deserializeBinary, 'msp.cnt.dev.SearchDevList')
            const searchdev = { ...state.searchdev }
            const devs = mesg.getDevList();
            devs.map(m => searchdev[m.getMac()] = m.toObject())
            return { ...state, searchdev };
        }

        case '/msp/v2/eqp/search/register/config': {
            const mesg = new pb.RegDevList()
            action.payload.map(m => {
                const dev = new pb.RegDev()
                dev.setMac(m.mac)
                dev.setIp(m.ip)
                dev.setRegip(m.regip)
                mesg.addDev(dev)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.dev.RegDevList')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/eqp/search/register/config/ack': {
            if (action.err) {
                message.warning('注册出错...')
                return state;
            }

            message.info('注册成功...')
            return state;
        }
        case '/msp/v2/eqp/batch/config': {
            const { payload } = action;
            const mesg = new pb.BatchCfgList()
            mesg.setMeth(payload.meth)
            payload.list.map(m => {
                const dev = new pb.BatchCfg()
                dev.setSn(m.sn)
                dev.setIp(m.ip)
                dev.setType(m.type)
                mesg.addBatch(dev)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.dev.BatchCfgList')
            send({ evt: action.type, body, serial: payload.meth })
            return state;
        }
        case '/msp/v2/eqp/batch/config/ack': {
            if(!action.err) {
                const payload = { meth: 0 }
                const body = batch_info(payload)
                switch(action.serial) {
                    case 0: {
                        send({evt: '/msp/v2/eqp/batch/add', body})
                        send({evt: '/msp/v2/eqp/batch/start/config', body })
                    } break;
                    case 1: {
                        send({evt: '/msp/v2/eqp/batch/start/config', body})
                    }break;
                }
            }
            return { ...state, batched: action.err ? false : true };
        }
        case '/msp/v2/eqp/batch/add': {
            const { payload } = action;
            const body = batch_info(payload)
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/eqp/batch/start/config': {
            const { payload } = action;
            const body = batch_info(payload)
            send({ evt: action.type, body, serial: payload.meth, context: payload.meth })
            if (payload.meth == 3) {

                return state;
            }
            return state;
        }
        case '/msp/v2/eqp/batch/start/config/ack': {
            // upgrade 3
            // board-upgrade : batch/stop/config can't be sent when received start/config/ack 
            if (!action.err && action.serial != 3)
                send({ evt: '/msp/v2/eqp/batch/stop/config' })

            return state;
        }
        case '/msp/v2/eqp/batch/stop/config': {
            // const { payload } = action;
            // const mesg = new pb.BatchInfo()
            // mesg.setMeth (payload.meth)
            // mesg.setBody (payload.body)
            // const body = new proto.google.protobuf.Any()
            // body.pack(mesg.serializeBinary(), 'msp.cnt.dev.BatchInfo')
            // send({ evt: action.type, body })
            send({ evt })
            return state;
        }
        case '/msp/v2/eqp/batch/stop/config/ack': {
            return state;
        }
        case '/msp/v2/eqp/batch/end/updata': {
            message.success('批处理结束...')
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/config': {
            const { payload } = action;
            const mesg = new pb.ChnEdid()
            mesg.setId(payload.id)
            mesg.setEdid(payload.edid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnEdid')
            send({ evt: action.type, body, serial: payload.no })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/config/ack': {
            if (action.err) return state;
            message.success('EDID使用成功...')
            return { ...state, curedid: action.serial };
        }
        case '/msp/v2/chn/cfg/vedio/edid/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/delete/ack': {
            if (action.err) return state;
            message.success('EDID取消使用成功...')
            return { ...state, curedid: undefined, defedid: '' };
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/delete': {
            const { payload } = action;
            const mesg = new pb.EdidList()
            const edids = { ...state.edids }
            payload.list.map(m => {
                const mem = new pb.Edid()
                mem.setId(m.key)
                mesg.addEdid(mem)
                delete edids[m.key]
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.EdidList')
            send({ evt: action.type, body })
            return { ...state, edids };
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/delete/ack': {
            if (action.err) {
                const mesg = new pb.Query()
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/chn/cfg/vedio/edid/plan/query', body })
                return state;
            }
            message.success('EDID删除成功...')
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/modify/ack': {
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!body) return state;
            const nstate = _.cloneDeep(state);
            const id = nstate.edid.edid.key
            nstate.edid.lst[id] = { ...nstate.edid.edid };
            return nstate;
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/modify': {
            const { payload } = action;
            const mesg = new pb.Edid()
            mesg.setId(payload.key)
            mesg.setWidth(payload.width)
            mesg.setHeight(payload.height)
            mesg.setModule(payload.module)
            mesg.setCfg(payload.cfg)
            mesg.setDesc(payload.desc)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.Edid')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/add': {
            const { payload } = action;
            const mesg = new pb.Edid()
            // mesg.setId(payload.id)
            // mesg.setWidth(payload.width)
            // mesg.setHeight(payload.height)
            // mesg.setModule(payload.module)
            const { cfg, desc } = payload;
            mesg.setCfg(cfg)
            mesg.setDesc(desc)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.Edid')
            send({ evt: action.type, body })
            const tmpedid = { cfg, desc }
            return { ...state, tmpedid };
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/add/ack': {
            if (action.err) {
                const nstate = { ...state }
                delete nstate.tmpedid;
                return nstate;
            }

            if (!state.tmpedid) return state;
            message.success(`${state.tmpedid.desc} 添加成功...`)

            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const nstate = { ...state }
            nstate.tmpedid.id = body.getValue()
            const edids = { ...state.edids }
            edids[nstate.tmpedid.id] = { ...nstate.tmpedid }
            delete nstate.tmpedid;

            return { ...nstate, edids };
        }
        case '/msp/v2/chn/cfg/vedio/edid/cur/query': {
            const mesg = new pb.ValueU32()
            mesg.setValue(action.payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/cur/query/ack': {
            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            if (!body) return state;
            const curedid = body.getValue()
            return { ...state, curedid };
        }
        case '/msp/v2/chn/cfg/vedio/edid/query': {
            const mesg = new pb.ValueU32()
            mesg.setValue(action.payload.key)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/edid/query/ack': {
            const body = action.body.unpack(pb.ChnEdid.deserializeBinary, 'msp.cnt.chn.ChnEdid')
            if (!body) return state;
            const defedid = body.getEdid()
            return { ...state, defedid };
        }
        case '/msp/v2/chn/cfg/vedio/edid/plan/query': {
            const mesg = new pb.Query()
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body })
            return { ...state, edids: {} };
        }

        case '/msp/v2/chn/cfg/vedio/edid/plan/query/ack': {
            const body = action.body.unpack(pb.EdidList.deserializeBinary, 'msp.cnt.chn.EdidList')
            if (!body) return state;
            const edids = { ...state.edids }
            const lsts = body.getEdidList();
            lsts.map(m => edids[m.getId()] = m.toObject())

            if (lsts.length == QUERY_SIZE) {
                const mesg = new pb.Query()
                mesg.setOffset(Object.keys(edid).length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/chn/cfg/vedio/edid/plan/query', body })
            }

            return { ...state, edids };
        }

        case '/msp/v2/chn/cfg/net/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/chn/cfg/net/query/ack': {
            const mesg = action.body.unpack(pb.ChnNetEnalbe.deserializeBinary, 'msp.cnt.chn.ChnNetEnalbe')
            const chnnets = { ...state.chnnets }
            const cn = mesg.toObject();
            chnnets[cn.id] = cn;
            return { ...state, chnnets };
        }
        case '/msp/v2/chn/cfg/net/config': {
            const { payload } = action;
            const mesg = new pb.ChnNetEnalbeList()
            payload.list.map(m => {
                const dev = new pb.ChnNetEnalbe()
                dev.setId(m.id)
                dev.setEnable(m.enable)
                mesg.addChnnetnable(dev)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnNetEnalbeList')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/chn/cfg/net/config/ack': {
            return state;
        }
        case '/msp/v2/chn/cfg/net/sync/config': {
            const { payload } = action;
            const mesg = new pb.ChnNetEnalbe()
            mesg.setId(payload.id)
            mesg.setEnable(payload.enable)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnNetEnalbe')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/chn/cfg/net/sync/config/ack': {
            return state;
        }
        case '/msp/v2/chn/rename/config': {
            const { payload } = action;
            const mesg = new pb.ChnBasic()
            mesg.setName(payload.name)
            mesg.setId(payload.id)
            mesg.setChntype(payload.chntype)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnBasic')
            send({ evt: action.type, body });

            return state;
        }
        case '/msp/v2/chn/rename/config/ack': {
            return state;
        }
        case '/msp/v2/chn/cfg/audio/config': {
            const { payload } = action;
            const mesg = new pb.Property()
            mesg.setId(payload.id)
            mesg.setType(payload.type)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.Property')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/chn/cfg/audio/config/ack': {
            return state;
        }
        case '/msp/v2/chn/cfg/audio/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/audio/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/chn/cfg/vedio/audio/query/ack': {
            const mesg = action.body.unpack(pb.ChnMode.deserializeBinary, 'msp.cnt.chn.ChnMode')
            const vaudioParam = { ...state.vaudioParam }
            const data = mesg.toObject();
            vaudioParam[data.id] = data
            return { ...state, vaudioParam };
        }
        case '/msp/v2/chn/cfg/vedio/audio/config': {
            const { payload } = action;
            const mesg = new pb.ChnMode()
            mesg.setId(payload.id)
            mesg.setModule(payload.module)
            mesg.setHdmi(payload.hdmi)
            mesg.setLine(payload.line)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.chn.ChnMode')
            send({ evt: action.type, body });

            return state;
        }
        default: return state;
    }
}