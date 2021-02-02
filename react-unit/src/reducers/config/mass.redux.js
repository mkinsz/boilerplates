import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';
import { combineReducers } from 'redux';

const createReducer = (initialState, handlers) => (state = initialState, action) => {
    return handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state
}

const intact = (state, action) => {
    send({ evt: action.type })
    return state;
}

const pcRsp = (state, action) => {
    const mesg = action.body.unpack(pb.PcInfoList.deserializeBinary, 'msp.cnt.pc.PcInfoList')
    if (!mesg) return state;
    const nstate = _.cloneDeep(state)
    nstate.cnt = {}
    mesg.getPcinfoList().map(m => nstate.cnt[m.getId()] = m.toObject())
    return nstate;
}

const pcCfgReq = (state, action) => {
    const { payload } = action;
    const mesg = new pb.PcInfo()
    payload.cnntmode = 0;
    mesg.setId(payload.id)
    mesg.setName(payload.name)
    mesg.setIp(payload.ip)
    mesg.setPort(payload.port)
    mesg.setCnntmode(payload.cnntmode)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.pc.PcInfo')
    send({ evt: action.type, body });

    const nstate = _.cloneDeep(state)
    if (payload.id) {
        _.merge(nstate.cnt[payload.id], payload)
    } else {
        if (state.tmp) return state; //TODO: 做提示
        nstate.tmp = { ...payload };
    }
    return nstate;
}

const pcCfgRsp = (state, action) => {
    const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
    if (!body || !state.tmp) return state;
    const nstate = _.cloneDeep(state);
    nstate.tmp.id = body.getValue()
    nstate.cnt[body.getValue()] = _.cloneDeep(nstate.tmp)
    delete nstate.tmp;
    return nstate;
}

const pcDelReq = (state, action) => {
    const { payload } = action;
    const mesg = new pb.PcList()
    mesg.addId(payload.id)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.pc.PcList')
    send({ evt: action.type, body });

    const nstate = _.cloneDeep(state)
    delete nstate.cnt[payload.id]
    return nstate
}

const pcDelRsp = (state, action) => {
    return state;
}

const bdReq = (state, action) => {
    return state;
}

const bdRsp = (state, action) => {
    const body = action.body.unpack(pb.PcBdInfoList.deserializeBinary, 'msp.nmc.PcBdInfoList')
    if (!body) return state;
    console.log('PcBD:', body.getPcdbinfoList().toObject())
    const nstate = _.cloneDeep(state);
    nstate.cnt = body.getValue()
    nstate.cnt[body.getValue()] = _.cloneDeep(nstate.tmp)
    delete nstate.tmp;
    return nstate;
}



const bdCmn = (state, action) => {
    return state;
}

const pcsReducers = createReducer({ cnt: {} }, {
    '/msp/v2/pc/query': intact,
    '/msp/v2/pc/query/ack': pcRsp,
    '/msp/v2/pc/config': pcCfgReq,
    '/msp/v2/pc/config/ack': pcCfgRsp,
    '/msp/v2/pc/delete': pcDelReq,
    '/msp/v2/pc/delete/ack': pcDelRsp,
});

const nmcReducers = createReducer({}, {
    '/p1010/v1/pc/bd/query': intact,
    '/p1010/v1/pc/bd/query/ack': bdRsp,
    '/p1010/v1/pc/bd/modify': bdCmn,
    '/p1010/v1/pc/bd/modify/ack': bdCmn,
    '/p1010/v1/pc/bd/config': bdCmn,
    '/p1010/v1/pc/bd/config/ack': bdCmn,
    '/p1010/v1/pc/bd/upgrade/config': bdCmn,
    '/p1010/v1/pc/bd/upgrade/config/ack': bdCmn,
    '/p1010/v1/pc/bd/upgrade/start/config': bdCmn,
    '/p1010/v1/pc/bd/upgrade/start/config/ack': bdCmn,
    '/p1010/v1/pc/bd/upgrade/updata': bdCmn
});

export default combineReducers({
    pcs: pcsReducers,
    nmc: nmcReducers
})