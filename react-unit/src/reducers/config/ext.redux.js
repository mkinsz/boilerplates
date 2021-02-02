import { send } from '../../services';
import * as pb from '../../proto';
import { message } from 'antd';
import _ from 'lodash';

const initState = {
    boxes: [],
    ports: {},
    outputs: [],
    exts: [],
    checks: []
}

const QUERY_SIZE = 16

export default (state = initState, action) => {
    const { type: evt } = action;
    switch (action.type) {
        case '/msp/v2/devex/box/redundancy/query': {
            send({ evt });
            return state;
        }
        case '/msp/v2/devex/box/redundancy/query/ack': {
            const nstate = _.cloneDeep(state)
            const mesg = action.body.unpack(pb.RdBoxList.deserializeBinary, 'msp.cnt.cfg.RdBoxList')
            const boxes = mesg.getRdboxList()
            boxes.map(m => nstate.boxes.push(m.toObject()))
            return nstate;
        }
        case '/msp/v2/devex/box/redundancy/config': {
            const { payload } = action;
            const boxes = [...state.boxes]
            switch (payload.op) {
                case 'add': {
                    payload.box.main = !boxes.length
                    boxes.push(payload.box)
                } break;
                case 'del': {
                    const index = boxes.findIndex(m =>
                        m.ip == payload.box.ip &&
                        m.port == payload.box.port &&
                        m.main == payload.box.main)
                    if (index > -1) {
                        const main = boxes[index].main;
                        boxes.splice(index, 1)
                        main && boxes.length && (boxes[0].main = true)
                    }
                } break;
                case 'mod': {
                    if (1 != boxes.length) {
                        const mindex = boxes.findIndex(m => m.main)
                        mindex > -1 && (boxes[mindex].main = false);

                        const index = boxes.findIndex(m =>
                            m.ip == payload.box.ip &&
                            m.port == payload.box.port)
                        index > -1 && boxes.splice(index, 1, { ...boxes[index], main: true })
                    }
                } break;
                default: {
                    const mesg = new pb.RdBoxList();
                    state.boxes.map(m => {
                        const rdbox = new pb.RdBox();
                        rdbox.setIp(m.ip)
                        rdbox.setPort(m.port)
                        rdbox.setMain(m.main)
                        mesg.addRdbox(rdbox)
                    })
                    const body = new proto.google.protobuf.Any()
                    body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.RdBoxList')
                    send({ evt, body });
                    return state;
                }
            }
            return { ...state, boxes }
        }
        case '/msp/v2/devex/box/redundancy/config/ack': {
            return state;
        }
        case '/msp/v2/devex/port/redundancy/query': {
            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/devex/port/redundancy/query/ack': {
            const recv = action.body.unpack(pb.RdPortList.deserializeBinary, 'msp.cnt.cfg.RdPortList')
            const rdports = recv.getRdportList()
            const ports = { ...state.ports }
            rdports.map(m => ports[m.getId()] = m.toObject())
            if (QUERY_SIZE == rdports.length) {
                const mesg = new pb.Query()
                mesg.setOffset(Object.values(rdports).length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/devex/port/redundancy/query', body })
            }
            return { ...state, ports };
        }
        case '/msp/v2/devex/port/redundancy/add': {
            const { payload } = action;
            const mesg = new pb.RdPort()
            mesg.setLbox(payload.lbox)
            mesg.setType(payload.type)
            mesg.setLslot(payload.lslot)
            mesg.setLport(payload.lport)
            mesg.setFslot(payload.fslot)
            mesg.setFport(payload.fport)
            mesg.setModule(payload.module)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.RdPort')
            send({ evt, body })

            const ports = { ...state.ports }
            const tmpport = { ...payload }
            return { ...state, ports, tmpport };
        }
        case '/msp/v2/devex/port/redundancy/add/ack': {
            const nstate = { ...state }
            const ports = { ...state.ports }
            if (action.err.length) {
                delete nstate.tmpport;
                return { ...state, ports };
            }

            const body = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const port = { ...state.tmpport, id: body.getValue() }
            ports[port.id] = port
            delete state.tmpport
            return { ...state, ports };
        }
        case '/msp/v2/devex/port/redundancy/modify': {
            const { payload } = action;
            const mesg = new pb.RdPort()
            mesg.setLbox(payload.lbox)
            mesg.setType(payload.type)
            mesg.setLslot(payload.lslot)
            mesg.setLport(payload.lport)
            mesg.setFslot(payload.fslot)
            mesg.setFport(payload.fport)
            mesg.setModule(payload.module)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.RdPort')
            send({ evt, body })

            const ports = { ...state.ports }
            _.merge(ports[payload.id], payload)
            return { ...state, ports };
        }
        case '/msp/v2/devex/port/redundancy/modify/ack': {
            return state;
        }
        case '/msp/v2/devex/port/redundancy/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body })

            const ports = { ...state.ports }
            delete ports[payload.id]
            return { ...state, ports };
        }
        case '/msp/v2/devex/port/redundancy/delete/ack': {
            return state;
        }
        case '/msp/v2/devex/port/redundancy/check/query': {
            send({ evt })
            return state;
        }
        case '/msp/v2/devex/port/redundancy/check/query/ack': {
            const mesg = action.body.unpack(pb.RdPortList.deserializeBinary, 'msp.cnt.cfg.RdPortList')
            const rdports = mesg.getRdportList()
            const checks = rdports.map(m => _.merge(state.ports[m.getId()], m.toObject()))
            return { ...state, checks };
        }
        case '/msp/v2/devex/port/redundancy/apply/config': {
            send({ evt })
            return state;
        }
        case '/msp/v2/devex/port/redundancy/apply/config/ack': {
            if (!action.err) message.info("使用成功...")
            return state;
        }
        case '/msp/v2/devex/port/redundancy/updata': {
            return state;
            const msg = action.body.unpack(pb.RdPortUpdate.deserializeBinary, 'msp.cnt.cfg.RdPortUpdate')
            const ctx = msg.getContext().toObject();
            const ports = { ...state.ports }
            switch (msg.getType()) {
                case 'add': ports[ctx.id] = ctx; break
                case 'mod': _.merge(ports[ctx.id], ctx); break
                case 'del': delete ports[ctx.id]; break;
                default: return state;
            }
            return { ...state, ports }
        }
        case '/msp/v2/devex/output/redundancy/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.box)
            mesg.setSubid(payload.slot)
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body, serial: payload.box, context: payload.slot })
            return { ...state, outputs: [] };
        }
        case '/msp/v2/devex/output/redundancy/query/ack': {
            const msg = action.body.unpack(pb.RdOutputList.deserializeBinary, 'msp.cnt.cfg.RdOutputList')
            const rdouts = msg.getRdoutList()
            const outputs = [...state.outputs]
            rdouts.map(m => outputs.push(m.toObject()))
            if (rdouts.length == QUERY_SIZE) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setSubid(action.context)
                mesg.setOffset(outputs.length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt, body, serial: action.serial, context: action.context })
            }
            return { ...state, outputs };
        }
        case '/msp/v2/devex/output/redundancy/config': {
            const mesg = new pb.RdOutputList()
            action.payload.map(m => {
                const out = new pb.RdOutput()
                out.setSid(m.sid)
                out.setDid(m.did)
                out.setOn(m.on)
                mesg.addRdout(out)
            })
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.RdOutputList')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/devex/output/redundancy/config/ack': {
            const mesg = action.body.unpack(pb.RdOutputList.deserializeBinary, 'msp.cnt.cfg.RdOutputList')
            const outs = mesg.getRdoutList();
            const outputs = []
            outs.map(m => outputs.push(m.toObject()))
            return { ...state, outputs };
        }
        case '/msp/v2/devex/output/redundancy/updata': {
            const mesg = action.body.unpack(pb.RdOutputList.deserializeBinary, 'msp.cnt.cfg.RdOutputList')
            const outs = mesg.getOutList();
            outs.map(m => console.log('Output Updata: ', m.toObject()))
            return state;
        }
        case '/msp/v2/devex/port/extend/query': {
            send({ evt })
            return state;
        }
        case '/msp/v2/devex/port/extend/query/ack': {
            const mesg = action.body.unpack(pb.BoxExtList.deserializeBinary, 'msp.cnt.cfg.BoxExtList')
            const exts = []
            const boxs = mesg.getBoxList()
            boxs.map(m => exts.push(m.toObject()))
            return { ...state, exts };
        }
        case '/msp/v2/devex/port/extend/config': {
            const { payload } = action;
            const mesg = new pb.BoxExtList()
            const box = new pb.BoxExt()
            box.setInid(payload.data.inid)
            box.setOutid(payload.data.outid)
            mesg.addBox(box)
            mesg.setType(payload.type)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.cfg.BoxExtList')
            send({ evt, body })

            const exts = [...state.exts]
            const { inid, outid } = payload.data;
            const index = exts.findIndex(m =>
                m.inid == inid && m.outid == outid)
            switch (payload.type) {
                case 'add': index < 0 && exts.push({ inid, outid }); break;
                case 'del': index > -1 && exts.splice(index, 1); break;
            }

            return { ...state, exts };
        }
        case '/msp/v2/devex/port/extend/config/ack': {
            // const mesg = action.body.unpack(pb.BoxExtList.deserializeBinary, 'msp.cnt.BoxExtList')
            return state;
        }
        default: return state;
    }
}