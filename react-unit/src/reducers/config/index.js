import { combineReducers } from 'redux';
import ext from './ext.redux'
import kvm from './kvm.redux'
import net from './net.redux'
import mass from './mass.redux'
import eqp from './eqp.redux'
import system from './system.redux'
import safe from './safe.redux'
import user from './user.redux'
// import screen from './screen.redux'

import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';

const initState = {

}

const QUERY_SIZE = 20;

const plan2msg = payload => {
    const mesg = new pb.PlatInfo()
    mesg.setMmsp(payload.mmsp)
    mesg.setMsp(payload.msp)
    mesg.setName(payload.name)
    mesg.setMode(payload.mode)
    mesg.setBox(payload.box)
    mesg.setState(payload.state)
    mesg.setEnable(payload.enable)
    mesg.setIp(payload.ip)
    mesg.setDomain(payload.domain)
    mesg.setPort(payload.port)
    mesg.setUsername(payload.username)
    mesg.setPassword(payload.password)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.sys.PlatInfo')
    return body;
}

const unite = (state = initState, action) => {
    const { type: evt } = action;
    switch (action.type) {
        case '/msp/v2/sys/cascade/query': {
            send({ evt })
            return state
        }
        case '/msp/v2/sys/cascade/query/ack': {
            const body = action.body.unpack(pb.PlatInfos.deserializeBinary, 'msp.cnt.sys.PlatInfos')
            if (!body) return state;
            const mesg = body.getPlatinfoList();
            const nstate = { ...state }
            mesg.map(m => nstate[m.getMsp()] = m.toObject())
            return nstate;
        }
        case '/msp/v2/sys/cascade/add': {
            const { payload } = action;
            payload.msp = Object.keys(state) + 1
            payload.state = 0
            payload.enable = 0
            const body = plan2msg(payload)
            send({ evt, body, serial: payload.msp })
            const nstate = { ...state }
            nstate[payload.msp] = { ...payload }
            return nstate;
        }
        case '/msp/v2/sys/cascade/add/ack': {
            const nstate = { ...state }
            if (action.err) {
                delete nstate[action.serial]
                return nstate;
            }

            const body = action.body.unpack(pb.PlatInfo.deserializeBinary, 'msp.cnt.sys.PlatInfo')
            if (!body) return state;

            const msp = body.getMsp();
            const sta = body.getState();
            if (action.serial != msp) {
                nstate[msp] = { ...nstate[action.serial] }
                delete nstate[action.serial]
            }
            nstate[msp].msp = msp;
            nstate[msp].state = sta;
            return nstate;
        }
        case '/msp/v2/sys/cascade/config': {
            const { payload } = action;
            const body = plan2msg(payload)
            send({ evt, body })
            return state;
        }
        case '/msp/v2/sys/cascade/config/ack': {
            const body = action.body.unpack(pb.PlatInfo.deserializeBinary, 'msp.cnt.sys.PlatInfo')
            if (!body) return state;
            const msp = body.getMsp();
            const nstate = { ...state }
            nstate[msp].state = body.getState()
            return nstate;
        }
        case '/msp/v2/sys/cascade/delete': {
            const { payload } = action;
            const mesg = new pb.PlatInfo()
            mesg.setMsp(payload.msp)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.PlatInfo')
            const nstate = { ...state }
            delete nstate[payload.msp]
            send({ evt, body })
            return nstate;
        }
        case '/msp/v2/sys/cascade/delete/ack': {
            return state;
        }
        case '/msp/v2/sys/cascade/enable/config': {
            const { payload } = action;
            const mesg = new pb.PlatInfo()
            mesg.setMsp(payload.msp)
            mesg.setEnable(payload.enable)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.PlatInfo')
            const nstate = { ...state }
            nstate[payload.msp].enable = payload.enable;
            send({ evt, body, serial: payload.msp })
            return nstate;
        }
        case '/msp/v2/sys/cascade/enable/config/ack': {
            if (action.err) {
                const nstate = { ...state }
                nstate[action.serial].enable = !state[action.serial].enable
                return nstate;
            }
            return state;
        }
        case '/msp/v2/sys/cascade/updata': {
            const body = action.body.unpack(pb.PlatInfo.deserializeBinary, 'msp.cnt.sys.PlatInfo')
            if (!body) return state;
            const nstate = { ...state }
            const status = body.getState()
            const info = { ...body.toObject() }
            switch (status) {
                case 3: {// new
                    nstate[info.msp] = info;
                } break;
                case 4: {// del
                    delete nstate[info.msp]
                } break;
                case 5: {// mod
                    nstate[info.msp] = { ...nstate[info.msp], ...info };
                } break;
            }
            return nstate;
        }
        case '/msp/v2/sys/cascade/channel/query': {
            const { payload } = action;
            const offset = payload.offset || 0
            const mesg = new pb.Query()
            mesg.setOffset(offset)
            mesg.setSize(QUERY_SIZE)
            mesg.setId(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body, serial: payload.id, context: offset })
            return state;
        }
        case '/msp/v2/sys/cascade/channel/query/ack': {
            const nstate = { ...state }
            const plan = nstate[action.serial]
            if (!action.context && plan) {
                plan.chns = []
            }
            const recv = action.body.unpack(pb.CascChnls.deserializeBinary, 'msp.cnt.sys.CascChnls')
            const cs = recv.getCascchnlList()
            cs.map(m => plan.chns.push(m.toObject()))

            if (cs.length == QUERY_SIZE) {
                const offset = plan.chns.length
                const mesg = new pb.Query()
                mesg.setOffset(offset)
                mesg.setSize(QUERY_SIZE)
                mesg.setId(action.serial)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: evt.slice(0, -4), body, serial: action.serial, context: offset })
            }

            return nstate;
        }
        case '/msp/v2/sys/cascade/channel/add': {
            const { payload } = action;
            const { box, slot, port, type, cbox, cslot, cport, cip, id } = payload;
            const mesg = new pb.CascChnls()
            const chn = new pb.CascChnl([box, slot, port, type, cbox, cslot, cport, cip])
            mesg.addCascchnl(chn)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.CascChnls')
            send({ evt, body })
            const nstate = { ...state }
            const plan = nstate[id]
            if (plan) {
                plan.chns = [...plan.chns]
                plan.chns.push({ box, slot, port, type, cbox, cslot, cport, cip })
                return nstate;
            }
            return state;
        }
        case '/msp/v2/sys/cascade/channel/add/ack': {
            return state;
        }
        case '/msp/v2/sys/cascade/channel/delete': {
            const { payload } = action;
            const { box, slot, port, type, cbox, cslot, cport, cip, id } = payload;
            const mesg = new pb.CascChnls()
            const chn = new pb.CascChnl([box, slot, port, type, cbox, cslot, cport, cip])
            mesg.addCascchnl(chn)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.CascChnls')
            send({ evt, body })
            const nstate = { ...state }
            const plan = nstate[id]
            if (!plan) return state;

            const index = plan.chns.findIndex(m =>
                m.box == box && m.slot == slot &&
                m.port == port && m.type == type &&
                m.cbox == cbox && m.cslot == cslot &&
                m.cport == cport && m.cip == cip)
            if (index > -1) plan.chns.splice(index, 1)
            return nstate;
        }
        case '/msp/v2/sys/cascade/channel/delete/ack': {
            return state;
        }
        case '/msp/v2/sys/cascade/channel/updata': {
            // 业务未支持
            // const recv = action.body.unpack(pb.CascChnls.deserializeBinary, 'msp.cnt.sys.CascChnls')
            // const cs = recv.getCascchnlList()
            // const op = recv.getOpt()
            // if(op) { // 0: add ; 1: del;
            // }

            return state;
        }
        case '/msp/v2/sys/cascade/transparent/config': {
            return state;
        }
        case '/msp/v2/sys/cascade/transparent/config/ack': {
            return state;
        }
        case '/msp/v2/sys/cascade/transparent/updata': {
            return state;
        }
        default: return state;
    }
}

export default combineReducers({
    ext, kvm, net, mass, system, eqp, safe, user, unite
})