import { send } from '../services';
import * as pb from '../proto';
import _ from 'lodash';
import { SCREEN } from '../actions';

import { GSN } from '../components/public'
import { eventProxy } from '../utils'

const initialCfgState = {
    screen: {
        serial: 0,
        newID: {},
        walls: new Map,
        queryID: 0
    },
    walls: {},
    cells: []
}

const QUERY_SIZE = 10;

export const mspsScreenCfg = (state = initialCfgState, action) => {

    switch (action.type) {


        case 'mspsScreenCfg/clear':
        {
            return initialCfgState;
        }
        case '/msp/v2/tv/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(10)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')

            if (GSN.SCREENCFG == payload.serial) state.screen.walls.clear()
            if (GSN.SCREENCFG == payload.serial) state.screen.newID = 0
            if (GSN.SCHEDULE == payload.serial) state.walls = {}
            send({ evt: action.type, body, serial: payload.serial })
            return _.cloneDeep(state);
        }
        case '/msp/v2/tv/query/ack': {
            const mesg = action.body.unpack(pb.TvList.deserializeBinary, 'msp.cnt.tv.TvList')
            const walls = mesg.getTvbasicList()
            const tvquery = (o, n, s) => {
                const _mesg = new pb.Query()
                _mesg.setOffset(o)
                _mesg.setSize(n)
                const body = new proto.google.protobuf.Any()
                body.pack(_mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/tv/query', body, serial: s })
            }

            if (GSN.SCREENCFG == action.serial) {
                const nstate = state
                walls.map(m => nstate.screen.walls.set(m.toObject().id, m.toObject()))
                if (walls.length >= 10) {
                    tvquery(nstate.screen.walls.size, 10, action.serial)
                    return nstate;
                }
                return _.cloneDeep(nstate)
            } else if (GSN.SCHEDULE == action.serial) {
                walls.map(m => state.walls[m.getId()] = m.toObject())
                if (walls.length >= 10) tvquery(Object.keys(state.walls).length, 10, action.serial)
                else return { ...state, walls: { ...state.walls } }
            }

            return state;
        }
        case '/msp/v2/tv/delete': {
            const { payload } = action;
            const mesg = new pb.ValueU32()
            mesg.setValue(payload.id)
            console.log('del wall:', payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt: action.type, body, serial: payload.serial })
            return state;
        }
        case '/msp/v2/tv/delete/ack': {
            const recv = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const backID = recv.getValue()
            eventProxy.trigger('/msp/v2/tv/delete/ack', backID)

            const mesg = new pb.Query()
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: GSN.SCHEDULE })
            return { ...state, walls: {} };
        }
        case '/msp/v2/tv/detail/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            state.screen.queryID = payload.id
            state.screen.serial = payload.serial
            mesg.setId(payload.id)
            mesg.setOffset(0)
            mesg.setSize(30)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt: action.type, body, serial: 0 })
            return state;
        }
        case '/msp/v2/tv/detail/query/ack': {
            const mesg = action.body.unpack(pb.TvCellList.deserializeBinary, 'msp.cnt.tv.TvCellList')
            if (!mesg) return state;
            const walls = mesg.getTvcellList()
            state.cells = action.serial ? state.cells : []
            walls.map(m => {
                if (!state.cells.find(n => n.id == m.id))
                    state.cells.push(m.toObject())
            })
            if (walls.length >= 30) {
                const _mesg = new pb.Query()
                _mesg.setId(state.screen.queryID)
                _mesg.setOffset(state.cells.length)
                _mesg.setSize(30)
                const body = new proto.google.protobuf.Any()
                body.pack(_mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/tv/detail/query', body, serial: state.cells.length })
                return state;
            }
            return { ...state, cells: [...state.cells] }
        }

        case '/msp/v2/tv/config':
            {
                const { payload } = action;
                state.tip=payload.tip
                const mesg = new pb.TvInfo()
                console.log('save wallll', payload.wallInfo.cells)
                const base = new pb.TvBasic(Object.values(payload.wallInfo.wall))
                console.log('base:', base)
                mesg.setBase(base)
                mesg.setPackage(0)

                mesg.setCelllsList(payload.wallInfo.cells.map(
                    m => {
                        return new pb.TvCell(Object.values(m))
                    }
                ))
                // mesg.addCellls()

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.TvInfo')

                console.log('unpack:', body.unpack(pb.TvInfo.deserializeBinary, 'msp.cnt.tv.TvInfo'))
                send({ evt: action.type, body, serial: payload.serial })

                state.screen.newID={backID:0}
                return state
            }
        case '/msp/v2/tv/config/ack': {
            if(!action.err)
                state.tip.success()
            else
                return state    
            const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
            const backID = mesg.getValue()
            console.log('add wall:', backID)
            eventProxy.trigger('/msp/v2/tv/config/ack', backID)
            const nstate = _.cloneDeep(state)
            if (nstate.screen.walls.has(backID)) {
                nstate.screen.walls.set(backID, { ...nstate.screen.walls.get(backID), id: backID })
            } else {
                nstate.screen.walls.set(backID, { ...nstate.screen.walls.get(0), id: backID })
                nstate.screen.walls.delete(0)
            }

            console.log('wall flush:', nstate.screen.walls.keys())
            console.log('wall flush:', nstate.screen.walls.values())
            nstate.screen.newID = {backID:backID}
            return nstate;
        }
        default: return state;
    }
}

const initialMapState = {
    map:
    {
        wallMaps: []
    }
}
export const mspsScreenMap = (state = initialMapState, action) => {
    switch (action.type) {
        case '/msp/v2/tv/back/query':
            {
                const { payload } = action;
                const mesg = new pb.Query()
                mesg.setId(payload.id)
                console.log('get map:', payload.id)
                mesg.setOffset(0)
                mesg.setSize(8)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: action.type, body, serial: payload.serial })
                return state;
            }
        case '/msp/v2/tv/back/query/ack':
            {
                const mesg = action.body.unpack(pb.TvBackList.deserializeBinary, 'msp.cnt.tv.TvBackList')
                state.map.wallMaps = []


                const nstate = _.cloneDeep(state)

                const walls = mesg.getTvbackList()
                walls.map(m => nstate.map.wallMaps.push(m.toObject()))
                console.log('recv maps:', nstate)
                return nstate;
            }
        case '/msp/v2/tv/back/add':
            {
                const { payload } = action;
                console.log('save wallMap', payload.wallMapInfo)
                const mesg = new pb.TvBack(Object.values(payload.wallMapInfo))

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.TvBack')

                console.log('unpack:', body.unpack(pb.TvBack.deserializeBinary, 'msp.cnt.tv.TvBack').toObject())

                send({ evt: action.type, body, serial: payload.serial })
                return state
            }
        case '/msp/v2/tv/back/add/ack':
            {
                const mesg = action.body.unpack(pb.TvBack.deserializeBinary, 'msp.cnt.tv.TvBack')
                const nstate = _.cloneDeep(state)

                return nstate;
            }
        case '/msp/v2/tv/back/delete':
            {
                const { payload } = action;
                console.log('save wallMap', payload.wallMapInfo)
                const mesg = new pb.TvBack(Object.values(payload.wallMapInfo))

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.TvBack')

                console.log('unpack:', body.unpack(pb.TvBack.deserializeBinary, 'msp.cnt.tv.TvBack').toObject())

                send({ evt: action.type, body, serial: payload.serial })
                return state
            }
        case '/msp/v2/tv/back/delete/ack':
            {
                return state;
            }
        case '/msp/v2/tv/backtrans/end/config':
            {
                const { payload } = action;
                const mesg = new pb.BackTrans(Object.values({ id: payload.wallMapInfo.id, tvid: payload.wallMapInfo.tvid, no: 0, url: '' }))

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.BackTrans')

                console.log('unpack:', body.unpack(pb.BackTrans.deserializeBinary, 'msp.cnt.tv.BackTrans').toObject())

                send({ evt: action.type, body, serial: payload.serial })

                return state
            }
        case '/msp/v2/tv/backtrans/end/config/ack':
            {

                return state;
            }

        case '/msp/v2/tv/back/config':
            {
                const { payload } = action;
                console.log('use map', payload.wallMapInfo)
                const mesg = new pb.TvBack(Object.values(payload.wallMapInfo))

                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.TvBack')

                console.log('unpack:', body.unpack(pb.TvBack.deserializeBinary, 'msp.cnt.tv.TvBack').toObject())

                send({ evt: action.type, body, serial: payload.serial })
                return state
            }
        case '/msp/v2/tv/back/config/ack':
            {
                const mesg = action.body.unpack(pb.TvBack.deserializeBinary, 'msp.cnt.tv.TvBack')
                const nstate = _.cloneDeep(state)

                return nstate;
            }
        default: return state;
    }
}

const initialOsdState = {
    osd:
    {
        cur:
        {
            id: 0,
            osd: []
        },
        status: {}
    }
}
export const mspsScreenOsd = (state = initialOsdState, action) => {
    switch (action.type) {
        case '/msp/v2/tv/osd/cfg/query':
            {
                state.osd.cur.osd = []
                const { payload } = action;
                const mesg = new pb.Query()
                mesg.setId(payload.id)
                console.log('get osd:', payload.id)
                mesg.setOffset(0)
                mesg.setSize(0)

                for (let index in [0, 1, 2]) {
                    mesg.setSubid(index)
                    const body = new proto.google.protobuf.Any()
                    body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                    send({ evt: action.type, body, serial: payload.serial })
                }
                return state;
            }
        case '/msp/v2/tv/osd/cfg/query/ack':
            {
                const mesg = action.body.unpack(pb.OSDList.deserializeBinary, 'msp.cnt.tv.OSDList')
                //state.osd.cur.osd = []
                const nstate = _.cloneDeep(state)
                nstate.osd.cur.id = mesg.getId()
                const osds = mesg.getOsdList()
                osds.map(m => nstate.osd.cur.osd.push(m.toObject()))

                console.log('osd list:', nstate.osd.cur)
                nstate.osd.status.ack = '/msp/v2/tv/osd/cfg/query/ack'
                return nstate;
            }
        case '/msp/v2/tv/osd/cfg/add':
            {
                const { payload } = action;
                const mesg = new pb.OSDList()
                console.log('payload.osdInfo', payload.osdInfo)
                //state.osd.cur.osd = []
                mesg.setId(payload.osdInfo.id)
                mesg.setOsdList(payload.osdInfo.osd.map(
                    m => {
                        state.osd.cur.osd.push(m)
                        return new pb.OSD(Object.values(m))
                    }
                ))
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.OSDList')
                console.log('unpack:', body.unpack(pb.OSDList.deserializeBinary, 'msp.cnt.tv.OSDList').toObject())
                send({ evt: action.type, body, serial: payload.serial })
                return state;
            }
        case '/msp/v2/tv/osd/cfg/add/ack':
            {
                const mesg = action.body.unpack(pb.OsdStatus.deserializeBinary, 'msp.cnt.tv.OsdStatus')
                state.osd.status = {}
                const nstate = _.cloneDeep(state)
                const status = mesg.toObject()
                console.log('osd add ack:', status)
                nstate.osd.status = status
                nstate.osd.status.ack = '/msp/v2/tv/osd/cfg/add/ack'
                return nstate;
            }
        case '/msp/v2/tv/osd/cfg/delete':
            {
                const { payload } = action;
                const mesg = new pb.OSDList()
                mesg.setId(payload.wallID)
                mesg.setOsdList([0, 1, 2].map(
                    m => {
                        let osd = new pb.OSD()//Object.values(m)
                        osd.setId(m)
                        return osd
                    }
                ))
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.OSDList')
                send({ evt: action.type, body, serial: payload.serial })
                state.osd.cur.osd = []
                return state;
            }
        case '/msp/v2/tv/osd/cfg/delete/ack':
            {
                const nstate = _.cloneDeep(state)
                nstate.osd.status.ack = '/msp/v2/tv/osd/cfg/delete/ack'
                return nstate;
            }
        case '/msp/v2/tv/osd/add':
            {
                console.log('use osd:', status)
                const { payload } = action;
                const mesg = new pb.OSDCtrl()
                mesg.setId(payload.wallID)
                mesg.setUse(payload.bUse)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.tv.OSDCtrl')
                console.log('use osd:', payload)
                send({ evt: action.type, body, serial: payload.serial })
                return state;
            }
        case '/msp/v2/tv/osd/add/ack':
            {
                if (action.err) return
                const nstate = _.cloneDeep(state)
                nstate.osd.status.ack = '/msp/v2/tv/osd/add/ack'
                return nstate;
            }
        case '/msp/v2/tv/osd/status/query':
            {
                const { payload } = action;
                const mesg = new pb.Query()
                mesg.setId(payload.wallID)
                mesg.setSubid(0)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')

                send({ evt: action.type, body, serial: payload.serial })
                return state;
            }
        case '/msp/v2/tv/osd/status/query/ack':
            {
                const mesg = action.body.unpack(pb.OsdStatus.deserializeBinary, 'msp.cnt.tv.OsdStatus')
                state.osd.status = _.cloneDeep(state.osd.status)
                const status = mesg.toObject()
                state.osd.status = status
                return state;
            }
        case '/msp/v2/tv/osd/status/updata':
            {
                const mesg = action.body.unpack(pb.OsdStatus.deserializeBinary, 'msp.cnt.tv.OsdStatus')
                //state.osd.status = _.cloneDeep(state.osd.status)
                const status = mesg.toObject()
                //state.osd.status = status
                return state;
            }
        case '/msp/v2/tv/osd/query':
            {
                const { payload } = action;
                const mesg = new pb.ValueU32()
                mesg.setValue(payload.wallID)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
                console.log('osd used',payload.wallID)
                send({ evt: action.type, body, serial: payload.serial })
                return state;
            }
        case '/msp/v2/tv/osd/query/ack':
            {
                const mesg = action.body.unpack(pb.ValueU32.deserializeBinary, 'msp.cnt.ValueU32')
                state.osd.status = _.cloneDeep(state.osd.status)
                state.osd.status.ack = '/msp/v2/tv/osd/query/ack'
                state.osd.status.buse = mesg.getValue()
                console.log('osd used',state.osd.status.buse)
                return state;
            }
        default: return state;
    }
}


const initialUpdateState = {
    screen: {},
    map: {
        action: 0,
        back: {}
    },
    osd: {

    }
}
export const mspsScreenUpdate = (state = initialUpdateState, action) => {

    switch (action.type) {
        case '/msp/v2/tv/back/updata':
            {
                // const test = new pb.BackState()
                // const _state = new pb.ValueU32()
                // _state.setValue(1)


                // test.setState(_state)
                // console.log('_state:', _state)
                // const base = new pb.TvBack(Object.values({id:1,exist:false,state:1,tvid:1,name:'11',startx:0,starty:0,width:300,height:400}))
                // test.setBack(base)
                // const body = new proto.google.protobuf.Any()
                // body.pack(test.serializeBinary(), 'msp.cnt.tv.BackState')
                // console.log('body:', body)


                const mesg = action.body.unpack(pb.BackState.deserializeBinary, 'msp.cnt.tv.BackState')
                console.log('mapupdate', mesg)

                const nstate = _.cloneDeep(state)

                const mapstate = mesg.getState()
                const back = mesg.getBack().toObject()
                switch (mapstate) {
                    case 0://添加
                        break;
                    case 1://修改
                        break;
                    case 2://删除
                        break;
                    case 3://使用图片
                        break;
                }
                nstate.map.action = mapstate
                nstate.map.back = back
                return nstate;
            }
        default: return state;
    }
}


const initialRateState = {
    rate: {}
}

export const mspsScreenRate = (state = initialRateState, action) => {

    switch (action.type) {
        case '/msp/v2/tv/custom/query':
            {
                const { payload } = action;
                const mesg = new pb.ValueU32()
                mesg.setValue(payload.wallID)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
                console.log('getRate', payload.wallID)
                send({ evt: action.type, body, serial: payload.serial })
                state.rate = {}
                return _.cloneDeep(state)
            }

        case '/msp/v2/tv/custom/query/ack':
            {

                const mesg = action.body.unpack(pb.MonitorInfo.deserializeBinary, 'msp.cnt.kvm.MonitorInfo')
                if (!mesg)
                    return state
                const _rate = mesg.toObject()
                console.log('getRate', _rate)

                state.rate = { ..._rate }
                return state
            }
        case '/msp/v2/tv/costom/config':
            {
                const { payload } = action;
                const arr = Object.values(payload.rateinfo)
                const _val = [...arr.slice(0, 7), arr.slice(7, 11), arr.slice(11, 15), arr[15]]
                console.log('nnnnnnnnnnnneeeeeeeeeeeeww:', _val)
                const mesg = new pb.MonitorInfo(_val)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.kvm.MonitorInfo')
                console.log('nnnnnnnnnnnneeeeeeeeeeeeww:', payload.rateinfo, body.unpack(pb.MonitorInfo.deserializeBinary, 'msp.cnt.kvm.MonitorInfo').toObject())
                send({ evt: action.type, body, serial: payload.serial })
                return state
            }

        case '/msp/v2/tv/custom/config/ack':
            {
                return state
            }
    }
    return state
}