import { combineReducers } from 'redux'
import { mspsAuth } from './auth.redux'
import { mspsLog } from './log.redux'
import { routescene } from './routescene.redux'
import mspsCfg from './config'
import mspsSch from './schedule'
import { mspsDev } from './device.redux'
import { mspsScreenCfg } from './screen.redux'
import { mspsScreenMap } from './screen.redux'
import { mspsScreenOsd } from './screen.redux'
import { mspsScreenUpdate } from './screen.redux'
import { mspsScreenRate } from './screen.redux'

import MediaCenter from './media-center'

import { send } from '../services';
import * as pb from '../proto';
import _ from 'lodash';
import { TRANS } from '../components/public'

const initState = {
    umpu: {},
    dcfg: {},
    ucfg: {},
    ulic: {},
    map: {},
    casc: {},
    eqp: {},
    trans: {},
}

const msps = (state = initState, action) => {
    switch (action.type) {
        case '/msp/v2/transmission/config': {
            const { payload } = action;
            const mesg = new pb.TransCfg()
            mesg.setType(payload.type)
            mesg.setOpt(payload.opt)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.TransCfg')
            send({ evt: action.type, body, serial: payload.type, context: payload.opt });
            return state;
        }
        case '/msp/v2/transmission/config/ack': {
            const mesg = action.body.unpack(pb.FileTrans.deserializeBinary, 'msp.cnt.FileTrans')
            if (!mesg) return state;
            let type = null
            switch (action.serial) {
                case TRANS.MPUUP: type = 'umpu'; break;
                case TRANS.MPUCFG: type = action.context ? 'ucfg' : 'dcfg'; break;
                case TRANS.LICEN: type = 'ulic'; break;
                case TRANS.BACK: type = 'map'; break;
                case TRANS.CASCCHN: type = 'casc'; break;
                case TRANS.EQP: type = 'eqp'; break;
                default: return state;
            }
            const nstate = { ...state }
            nstate[type] = mesg.toObject();
            return nstate;
        }
        case '/msp/v2/transmission/end/config': {
            const { payload } = action;
            const mesg = new pb.TransCfg()
            mesg.setSize(payload.size)
            mesg.setName(payload.name)
            mesg.setType(payload.type)
            mesg.setOpt(payload.opt)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.TransCfg')
            send({ evt: action.type, body });
            return state;
        }
        case '/msp/v2/transmission/end/config/ack': {
            return state;
        }
        case '/msp/v2/sys/filetrans/config': {
            const { payload } = action;
            const mesg = new pb.FileInfo()
            mesg.setOpt(payload.opt)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.FileInfo')
            send({ evt: action.type, body, serial: payload.opt });
            const dcfg = { ...state.dcfg }
            dcfg.loading = true;
            return { ...state, dcfg };
        }
        case '/msp/v2/sys/filetrans/config/ack': {
            const mesg = action.body.unpack(pb.FileTrans.deserializeBinary, 'msp.cnt.FileTrans')
            if (!mesg) return state;
            const trans = { ...state.trans }
            if (1 == action.serial)
                trans.upload = mesg.toObject()
            else {
                trans.download = mesg.toObject()

                fetch(`http://${state.dcfg.ip}:${state.dcfg.port}/download`, {
                    method: 'post',
                    body: JSON.stringify({
                        filepath: state.dcfg.path,
                        filename: state.dcfg.filename
                    })
                }).then(res => {
                    if (res.ok) {
                        res.blob().then(blob => {
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = state.dcfg.filename;
                            a.click();
                            URL.revokeObjectURL(a.herf);
                            a.remove();
                        })
                    }
                })
            }
            const dcfg = { ...state.dcfg }
            dcfg.loading = false;
            return { ...state, trans, dcfg };
        }
        default: return state
    }
}

export default combineReducers({
    msps,
    mspsAuth,
    mspsLog,
    mspsCfg,
    mspsDev,
    mspsSch,
    mspsScreenCfg,
    mspsScreenMap,
    mspsScreenOsd,
    mspsScreenUpdate,
    mspsScreenRate,

    routescene,
    MediaCenter,
})
