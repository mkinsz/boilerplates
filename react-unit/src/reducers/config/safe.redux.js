import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';

const num2type = (num) => {
    switch (num) {
        case 1:
            return 'white'
        case 2:
            return 'black'
    }
    return 'no'
}

const type2num = (type) => {
    switch (type) {
        case 'white':
            return 1
        case 'black':
            return 2
    }
    return 0
}

const initialCfgState = {
    ssh: 0,
    filtertype: undefined,
    ips: {
        no: [],
        white: [],
        black: []
    }
}

export default (state = initialCfgState, action) => {
    switch (action.type) {
        case '/msp/v2/safe/ssh/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/safe/ssh/query/ack': {
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const nstate = _.cloneDeep(state)
            nstate.ssh = mesg.getValue()
            return nstate;
        }

        case '/msp/v2/safe/ssh/config': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.state)
            console.log('set ssh', payload.state)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body })
            return state;
        }
        case '/msp/v2/safe/ssh/config/ack': {
            return state;
        }

        case '/msp/v2/safe/filter/query': {
            send({ evt: action.type })
            return state;
        }
        case '/msp/v2/safe/filter/query/ack': {
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const nstate = _.cloneDeep(state)
            const type = mesg.getValue();
            nstate.filtertype = type
            nstate.ips[num2type(type)] = []
            const msg = new pb.Query()
            msg.setSubid(type)
            msg.setOffset(0)
            msg.setSize(200)
            const body = new proto.google.protobuf.Any()
            body.pack(msg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: '/msp/v2/safe/filterform/query', body, serial: type })
            return nstate;
        }

        case '/msp/v2/safe/filterform/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            state.ips[num2type(payload.type)] = []
            mesg.setSubid(payload.type)
            mesg.setOffset(0)
            mesg.setSize(200)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: payload.type })
            return state;
        }
        case '/msp/v2/safe/filterform/query/ack': {
            const mesg = action.body.unpack(pb.FilterForm.deserializeBinary, 'msp.cnt.sys.FilterForm')
            const nstate = state
            const type = action.serial
            let sType = num2type(type)
            const ips = mesg.getIpList()
            nstate.ips[sType] = nstate.ips[sType].concat(ips)
            if (ips.length >= 200) {
                const _mesg = new pb.Query()
                _mesg.setSubid(type)
                _mesg.setOffset(nstate.ips[sType].size)
                _mesg.setSize(200)
                const body = new proto.google.protobuf.Any()
                body.pack(_mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/safe/filterform/query', body })
            } else {
                return _.cloneDeep(nstate)
            }
            return nstate;
        }
        case '/msp/v2/safe/filterform/config': {
            const { payload } = action;
            state.tip = payload.tip
            const mesg = new pb.FilterForm()
            mesg.setValue(payload.type)
            mesg.setIpList(payload.ips)
            console.log('payload.type', payload.type)
            console.log('payload.ips', payload.ips)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sys.FilterForm')

            console.log('unpack:', body.unpack(pb.FilterForm.deserializeBinary, 'msp.cnt.sys.FilterForm'))

            send({ evt: action.type, body })
            return state
        }
        case '/msp/v2/safe/filterform/config/ack': {
            if (!action.err)state.tip.success()
            return state;
        }
        case '/msp/v2/safe/filter/updata':
            {
                const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
                const nstate = _.cloneDeep(state)
                nstate.ssh = mesg.getValue()

                return nstate;
            }
        default: return state;
    }
}