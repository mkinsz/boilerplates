import { send } from '../../services';
import * as pb from '../../proto';
import _ from 'lodash';

const OPCODE = {
    OPTOP: 0,
    OPBOTTOM: 1,
    OPUP: 2,
    OPDOWN: 3,
    OPOPEN: 4,
    OPCLOSE: 5,
    OPCLEAN: 6,
    OPUPDATA: 7
}

const init_state = {
    schemes: {},
    curschm: {},
    windows: {},
    dftwins: {},
    mrgwins: {},
    schstates: {},
    poll: {
        state: {},
        param: {},
        mems: []
    },
    chnpoll: {
        state: {},
        param: {},
        mems: []
    },
    sglobal: { lock: false },
    chnmap: {}
}

const QUERY_SIZE = 16;

const load_scheme = (evt, tvid, schid, schms) => {
    const mesg = new pb.Tswid()
    mesg.setSceneid(schid)
    mesg.setTvid(tvid)
    const body = new proto.google.protobuf.Any()
    body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
    send({ evt, body })

    const tvschs = schms[tvid]
    const index = tvschs.findIndex(m => m.id == schid)
    return tvschs[index]
}

export default (state = init_state, action) => {
    const { type: evt } = action;
    switch (evt) {
        case '/msp/v2/schemes/query': {
            const { payload } = action;
            if (payload) {
                const mesg = new pb.Query()
                mesg.setId(payload.id)
                mesg.setOffset(0)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt, body, serial: payload.id, context: 0 })
                return state;
            }
            return { ...state, schemes: {} }
        }
        case '/msp/v2/schemes/query/ack': {
            const recv = action.body.unpack(pb.Schemes.deserializeBinary, 'msp.cnt.sch.Schemes')
            const schemes = { ...state.schemes }
            const list = recv.getSchemeList()
            const schms = !action.context ? [] : schemes[action.serial] || []
            list.map(m => schms.push(m.toObject()))
            schemes[action.serial] = schms

            if (list.length == QUERY_SIZE) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setOffset(schms.length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/schemes/query', body, serial: action.serial, context: schms.length })
            }
            return { ...state, schemes };
        }
        case '/msp/v2/schemes/default/detail/query':
        case '/msp/v2/schemes/current/detail/query': {
            const { payload } = action;
            const tvwins = state.windows[payload.tvid]
            // if (tvwins && tvwins.schid == payload.schid) return state;
            const mesg = new pb.Query()
            mesg.setId(payload.tvid)
            mesg.setSubid(payload.schid)
            mesg.setOffset(0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body, serial: payload.tvid, context: payload.schid })
            const windows = { ...state.windows }
            const tvwinds = windows[payload.tvid] || {}
            tvwinds.schid = payload.schid;
            tvwinds.wins = []
            windows[payload.tvid] = tvwinds
            return { ...state, windows };
        }
        case '/msp/v2/schemes/default/detail/query/ack':
        case '/msp/v2/schemes/current/detail/query/ack': {
            const recv = action.body.unpack(pb.Windows.deserializeBinary, 'msp.cnt.wds.Windows')
            if (!recv) return state;
            const wins = recv.getWindowList()
            const windows = { ...state.windows }
            const tvwinds = windows[action.serial]

            wins.map(m => {
                const w = m.toObject();
                const i = tvwinds.wins.findIndex(n => n.id == w.id)
                if (i == -1) tvwinds.wins.push(m.toObject())
            })

            if (QUERY_SIZE == wins.length) {
                const { serial, context } = action;
                const mesg = new pb.Query()
                mesg.setId(serial)
                mesg.setSubid(context)
                mesg.setOffset(tvwinds.wins.length)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({
                    body, serial, context, evt: evt.search(/default/g) > -1
                        ? '/msp/v2/schemes/default/detail/query'
                        : '/msp/v2/schemes/current/detail/query'
                })
            }
            return { ...state, windows };
        }
        case '/msp/v2/schemes/current/query': {
            const { payload } = action;
            if (payload) {
                const mesg = new pb.Query()
                mesg.setId(payload.id)
                mesg.setSize(1)
                mesg.setOffset(0)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt, body })
                return state;
            }
            return { ...state, curschm: {}, windows: {} }
        }
        case '/msp/v2/schemes/current/query/ack': {
            const mesg = action.body.unpack(pb.Scheme.deserializeBinary, 'msp.cnt.sch.Scheme')
            return { ...state, curschm: mesg.toObject() }
        }
        case '/msp/v2/schemes/save': {
            const { payload } = action;
            const mesg = new pb.SchemeState()
            const schm = new pb.Scheme()
            let nstate = state;
            switch (payload.op) {
                case 0: {
                    schm.setName(payload.name)
                    schm.setTvid(payload.tvid)
                    mesg.setState(new pb.ValueU32([0]))

                    const tmpschm = { name: payload.name, tvid: payload.tvid }
                    nstate = { ...state, tmpschm };
                } break;
                case 3: {
                    const schemes = { ...state.schemes }
                    const tvschs = schemes[payload.tvid]

                    const index = tvschs.findIndex(m => m.id == payload.id)
                    if (index < 0) return state;
                    const scheme = tvschs[index]
                    const wndnum = Object.keys(state.windows).length
                    schm.setId(payload.id)
                    schm.setTvid(scheme.tvid)
                    schm.setName(scheme.name)
                    schm.setWndnum(wndnum)

                    tvschs.splice(index, 1, { ...scheme, wndnum })
                    nstate = { ...state, schemes };
                } break;
                case 4: {
                    const schemes = { ...state.schemes }
                    const tvschs = schemes[payload.tvid]

                    const wndnum = Object.keys(state.windows).length;
                    schm.setTvid(payload.tvid)
                    schm.setName(payload.name)
                    schm.setWndnum(wndnum)

                    const index = tvschs.findIndex(m => m.id == payload.schid)
                    if (index < 0) return state;
                    const scheme = { ...tvschs[index] }
                    delete scheme.id
                    nstate = { ...state, tmpschm: { ...scheme, name: payload.name, wndnum: payload.wndnum } };
                } break;
                default: ;
            }

            mesg.setScheme(schm)
            mesg.setState(new pb.ValueU32([payload.op]))
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.SchemeState')
            send({ evt, body, serial: payload.op })
            return nstate;
        }
        case '/msp/v2/schemes/save/ack': {
            if (action.err) {
                const nstate = { ...state }
                delete nstate.tmpschm
                return nstate;
            }
            if (!state.tmpschm) return state;
            const mesg = action.body.unpack(pb.Tswid.deserializeBinary, 'msp.cnt.sch.Tswid')
            const tvid = mesg.getTvid()
            const id = mesg.getSceneid()
            const schm = { ..._.cloneDeep(state.tmpschm), id, tvid }
            const schemes = { ...state.schemes }
            const tvschs = schemes[tvid]
            const index = tvschs.findIndex(m => m.id == id)
            index == -1 ? tvschs.push(schm) : tvschs[index] = schm
            const curschm = load_scheme('/msp/v2/schemes/load/config', tvid, id, schemes)
            const nstate = { ...state, schemes, curschm }
            delete nstate.tmpschm
            return nstate;
        }
        case '/msp/v2/schemes/delete': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setSceneid(payload.id)
            mesg.setTvid(payload.tvid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            const schemes = { ...state.schemes }
            const tvschs = schemes[payload.tvid]
            schemes[payload.tvid] = tvschs.filter(m => m.id !== payload.id)
            return { ...state, schemes };
        }
        case '/msp/v2/schemes/delete/ack': {
            return state;
        }
        case '/msp/v2/schemes/load/config': {
            const { payload } = action;
            const curschm = load_scheme(evt, payload.tvid, payload.schid, state.schemes)
            return { ...state, curschm };
        }
        case '/msp/v2/schemes/load/config/ack': {
            return state;
        }
        case '/msp/v2/schemes/config': {
            const { payload } = action;
            const mesg = new pb.Schemes()
            const schemes = { ...state.schemes }
            const tvschs = [...schemes[payload.tvid]]
            const ntvschs = payload.schemes.map(m => {
                const schm = tvschs.find(n => n.id == m.id)
                if (schm) {
                    schm.name = m.name;
                    const sch = new pb.Scheme()
                    sch.setId(schm.id)
                    sch.setName(schm.name)
                    sch.setTvid(schm.tvid)
                    sch.setWndnum(schm.wndnum)
                    mesg.addScheme(sch)
                    return schm
                }
            })
            schemes[payload.tvid] = ntvschs;
            mesg.setIsend(payload.isend)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Schemes')
            send({ evt, body })
            return { ...state, schemes };
        }
        case '/msp/v2/schemes/config/ack': {
            return state;
        }
        case '/msp/v2/schemes/updata': {
            const mesg = action.body.unpack(pb.SchemeState.deserializeBinary, 'msp.cnt.sch.SchemeState')
            const stat = mesg.getState()
            const schm = mesg.getScheme().toObject();
            const schemes = { ...state.schemes }
            let tvschs = schemes[schm.tvid] || []
            // 2：删除场景， 0： 新建场景
            if (2 == stat) tvschs = tvschs.filter(m => m.id !== schm.id)
            else if (0 == stat) tvschs.push(schm)
            schemes[schm.tvid] = tvschs;
            return { ...state, schemes };
        }
        case '/msp/v2/schemes/load/updata': {
            const mesg = action.body.unpack(pb.Scheme.deserializeBinary, 'msp.cnt.sch.Scheme')
            const curschm = mesg.toObject()
            if (state.curschm.tvid != curschm.tvid) return state;
            return { ...state, curschm }
        }
        case '/msp/v2/schemes/poll/state/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.id])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/poll/state/query/ack': {
            const mesg = action.body.unpack(pb.PollState.deserializeBinary, 'msp.cnt.sch.PollState')
            const pstate = mesg.toObject()
            const pollstate = {
                ...pstate,
                beid: pstate.beid || {}
            }
            return { ...state, poll: { ...state.poll, state: pollstate } };
        }
        case '/msp/v2/schemes/poll/param/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.tvid])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/poll/param/query/ack': {
            const mesg = action.body.unpack(pb.PollPrm.deserializeBinary, 'msp.cnt.sch.PollPrm')
            const param = {
                keep: mesg.getKeep(),
                issame: mesg.getIssame(),
                interval: mesg.getInterval(),
                beid: mesg.getBeid().toObject()
            }
            return { ...state, poll: { ...state.poll, param } };
        }
        case '/msp/v2/schemes/pollmem/param/query': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.tvid])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/pollmem/param/query/ack': {
            const mesg = action.body.unpack(pb.PollMems.deserializeBinary, 'msp.cnt.sch.PollMems')
            const mems = mesg.getPollmemList().map(m => m.toObject())
            return { ...state, poll: { ...state.poll, mems } };
        }
        case '/msp/v2/schemes/poll/param/config': {
            const { payload } = action;
            const mesg = new pb.Poll();
            payload.mems.map(m => mesg.addPollmem(new pb.PollMem([m.interval, m.id])))
            const nparam = new pb.PollPrm([payload.param.keep, payload.param.issame, payload.param.interval])
            mesg.setParam(nparam)
            const beid = new pb.Tswid()
            beid.setTvid(payload.tvid)
            mesg.setBeid(beid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Poll')
            send({ evt, body })
            const mems = [...payload.mems]
            const param = { ...payload.param }
            return { ...state, poll: { state: {}, mems, param } };
        }
        case '/msp/v2/schemes/poll/param/config/ack': {
            return state;
        }
        case '/msp/v2/schemes/pollmem/start/add': {
            const { payload } = action;
            const mesg = new pb.Poll();
            payload.mems.map(m => mesg.addPollmem(new pb.PollMem([m.interval, m.id])))
            const beid = new pb.Tswid([payload.beid, payload.sceneid, payload.tvid])
            mesg.setBeid(beid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Poll')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/pollmem/start/add/ack': {
            return state;
        }
        case '/msp/v2/schemes/pollmem/stop/add': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setTvid(payload.tvid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/pollmem/stop/add/ack': {
            return state;
        }
        case '/msp/v2/schemes/poll/start/config': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setTvid(payload.tvid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body, serial: payload.tvid })
            return state;
        }
        case '/msp/v2/schemes/poll/start/config/ack': {
            if (!action.err) {
                const mesg = new pb.ValueU32([action.serial])
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
                send({ evt: '/msp/v2/schemes/poll/state/query', body })
            }
            return state;
        }
        case '/msp/v2/schemes/poll/stop/config': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setTvid(payload.tvid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/schemes/poll/stop/config/ack': {
            if (!action.err) {
                const mesg = new pb.ValueU32([action.serial])
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
                send({ evt: '/msp/v2/schemes/poll/state/query', body })
            }
            return state;
        }
        case '/msp/v2/schemes/poll/state/updata': {
            const mesg = action.body.unpack(pb.PollStates.deserializeBinary, 'msp.cnt.sch.PollStates')
            const schstates = mesg.getPollstateList().map(m => m.toObject())
            const schstate = schstates.find(m => m.beid.tvid == state.curschm.tvid)
            const poll = { ...state.poll, state: _.cloneDeep(schstate) }
            return { ...state, schstates, poll };
        }
        case '/msp/v2/windows/open/config': {
            const { payload } = action;
            const tvwinds = state.windows[payload.tvid]
            if (!tvwinds) return state;
            if (tvwinds.schid != payload.sceneid) return state;

            const mesg = new pb.Window()
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.sceneid)
            mesg.setSrcid(payload.srcid)
            if (payload.layout) {
                const { x, y, w, h } = payload.layout;
                const layout = new pb.Rect([x, y, w, h])
                mesg.setLayout(layout)
            }

            if (payload.iscut || payload.cut) {
                mesg.setIscut(payload.iscut)
                const { x, y, w, h } = payload.cut
                const cut = new pb.Rect([x, y, w, h])
                mesg.setCut(cut)
            }

            if (!payload.id) {
                const layer = tvwinds.wins.reduce(
                    (t, m) => t < m.layer ? m.layer : t,
                    tvwinds.wins[0] ? tvwinds.wins[0].layer : 0) + 1
                console.log('---------------------------------->', layer)
                payload.layer = layer;
                mesg.setLayer(layer);
            } else {
                mesg.setId(payload.id)
            }

            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.wds.Window')
            send({ evt, body, serial: payload.id ? true : false })
            if (!payload.id) return { ...state, tmpwin: { ...payload } };

            const index = tvwinds.wins.findIndex(m => m.id == payload.id)
            return -1 == index ? state : { ...state, tmpwin: { ...tvwinds.wins[index], ...payload } }
        }
        case '/msp/v2/windows/open/config/ack': {
            const mesg = action.body.unpack(pb.Tswid.deserializeBinary, 'msp.cnt.sch.Tswid')
            if (!mesg) return state;
            const data = mesg.toObject()
            if (!state.tmpwin) return state

            const windows = { ...state.windows }
            const tvwinds = windows[data.tvid]

            if (action.err) {
                if (state.tmpwin.id) {
                    const index = tvwinds.wins.findIndex(m => m.id == data.id)
                    if (index > -1)
                        tvwinds.wins[index] = _.cloneDeep(tvwinds.wins[index])
                }
                delete state.tmpwin
                return { ...state, windows };
            }

            const win = _.cloneDeep(state.tmpwin)
            if (!action.serial) {
                win.id = data.id
                tvwinds.wins.push(win)
            } else {
                const index = tvwinds.wins.findIndex(m => m.id == data.id)
                if (index > -1) _.merge(tvwinds.wins[index], win)
            }

            delete state.tmpwin
            return { ...state, windows };
        }
        case '/msp/v2/windows/close/config': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setId(payload.id)
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.sceneid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })

            const windows = { ...state.windows }
            const tvwinds = windows[payload.tvid]
            const index = tvwinds.wins.findIndex(m => m.id == payload.id)
            if (index > -1) tvwinds.wins.splice(index, 1)
            return { ...state, windows };
        }
        case '/msp/v2/windows/close/config/ack': {

            return state;
        }
        case '/msp/v2/windows/clean/config': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.schid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            const windows = { ...state.windows }
            const tvwinds = windows[payload.tvid]
            if (tvwinds) tvwinds.wins = []
            return { ...state, windows };
        }
        case '/msp/v2/windows/clean/config/ack': {
            return state;
        }
        case '/msp/v2/windows/reorder/config': {
            const { payload } = action;
            const mesg = new pb.Reorder()
            mesg.setId(payload.id)
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.sceneid)
            mesg.setOrder(payload.order)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.wds.Reorder')
            send({ evt, body, serial: payload.tvid, context: payload.sceneid })
            return state;
        }
        case '/msp/v2/windows/reorder/config/ack': {
            const mesg = action.body.unpack(pb.Window.deserializeBinary, 'msp.cnt.wds.Window')
            const tmp = mesg.toObject()
            const windows = { ...state.windows }
            const scene = windows[action.serial]
            if (scene.schid != action.context) return state;
            const wins = scene.wins.filter(m => m.id != tmp.id)
            wins.sort((a, b) => a.layer - b.layer)
            wins.splice(tmp.layer, 0, tmp)
            scene.wins = wins.map((m, i) => ({ ...m, layer: i }))
            return { ...state, windows };
        }
        case '/msp/v2/windows/updata': {
            const mesg = action.body.unpack(pb.WinState.deserializeBinary, 'msp.cnt.wds.WinState')
            const opc = mesg.getState()
            const win = mesg.getWindow().toObject()
            console.log('windows updata: ---> ', opc, win)

            const {id: schid, tvid} = state.curschm;
            if(win.tvid != tvid || win.schemeid != schid) return state; 

            const windows = { ...state.windows }
            const tvwinds = windows[win.tvid]
            if (!tvwinds) return state;
            if (tvwinds.schid != win.sceneid) return state;

            const index = tvwinds.wins.findIndex(m => m.id == win.id)
            if (-1 == index) {
                if (OPCODE.OPOPEN == opc) {
                    tvwinds.wins.push(win)
                    return { ...state, windows };
                }
                return state;
            }
            const origwin = tvwinds.wins[index]

            console.log('1: ', index, tvwinds.wins)

            switch (opc) {
                case OPCODE.OPUP: origwin.layer += 1; break;
                case OPCODE.OPDOWN: origwin.layer -= 1; break;
                case OPCODE.OPBOTTOM: origwin.layer = 0; break;
                case OPCODE.OPTOP: origwin.layer = tvwinds.wins.length; break;
                case OPCODE.OPOPEN: // weird definition , too bad
                case OPCODE.OPUPDATA: tvwinds.wins[index] = { ...origwin, ...win }; break;
                case OPCODE.OPCLOSE: tvwinds.wins.splice(index, 1); break;
                case OPCODE.OPCLEAN: delete windows[win.tvid]; break;
            }

            console.log('2: ', index, tvwinds.wins)
            return { ...state, windows };
        }
        case '/msp/v2/windows/audio/query': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setId(payload.id)
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.schmid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/audio/query/ack': {
            return state;
        }
        case '/msp/v2/windows/audio/config': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.sceneid)
            payload.audio && mesg.setId(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            const windows = { ...state.windows }
            const wins = windows[payload.tvid].wins || []
            wins.map(m => m.audio = false)
            const index = wins.findIndex(m => m.id == payload.id)
            if (index > -1)
                wins[index].audio = payload.audio;
            windows[payload.tvid].wins = wins;
            send({ evt, body, serial: payload.id })
            return { ...state, windows };
        }
        case '/msp/v2/windows/audio/config/ack': {
            return state;
        }
        case '/msp/v2/windows/audio/updata': {
            // TODO
            const mesg = action.body.unpack(pb.WinState.deserializeBinary, 'msp.cnt.wds.WinState')
            const stat = mesg.getState()
            const wind = mesg.getWindow().toObject();

            const {id: schid, tvid} = state.curschm;
            if(win.tvid != tvid || win.schemeid != schid) return state;

            const windows = { ...state.windows }
            const wd = windows[wind.id]
            if (!wd && (wind.tvid != wd.tvid ||
                wind.sceneid != wd.sceneid)) return state;
            if (OPCODE.OPOPEN == stat) wd.audio = true
            else if (OPCODE.OPCLOSE == stat) wd.audio = false
            return { ...state, windows };
        }
        case '/msp/v2/windows/style/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.tvid)
            mesg.setSubid(payload.schmid)
            mesg.setOffset(0)
            mesg.setSize(20)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/style/query/ack': {
            const mesg = action.body.unpack(pb.MergeWnds.deserializeBinary, 'msp.cnt.wds.MergeWnds')
            if (!mesg) return state;
            const wins = mesg.getMergewndList()
            const mrgwins = !action.serial ? {} : { ...state.mrgwins }
            wins.map(m => mrgwins[m.getId()] = m.toObject())
            //TODO: 未查完继续查
            return { ...state, mrgwins };
        }
        case '/msp/v2/windows/style/open/config': {
            return state;
        }
        case '/msp/v2/windows/style/open/config/ack': {
            return state;
        }
        case '/msp/v2/windows/style/close/config': {
            return state;
        }
        case '/msp/v2/windows/style/close/config/ack': {
            return state;
        }
        case '/msp/v2/windows/style/open/updata': {
            const mesg = action.body.unpack(pb.MergeWnds.deserializeBinary, 'msp.cnt.wds.MergeWnds')
            if (!mesg) return state;
            const wins = mesg.getMergewndList()
            const mrgwins = !action.serial ? {} : { ...state.mrgwins }
            wins.map(m => mrgwins[m.getId()] = m.toObject())
            return { ...state, mrgwins };
        }
        case '/msp/v2/windows/poll/state/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.tvid)
            mesg.setSubid(payload.schid)
            mesg.setOffset(payload.offset || 0)
            mesg.setSize(QUERY_SIZE)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body, serial: payload.offset || 0 })
            return state;
        }
        case '/msp/v2/windows/poll/state/query/ack': {
            const mesg = action.body.unpack(pb.PollStates.deserializeBinary, 'msp.cnt.sch.PollStates')
            const pollstates = action.serial ? { ...state.chnpoll.state } : {}
            mesg.getPollstateList().map(m => {
                const ps = m.toObject()
                pollstates[ps.beid.id] = ps;
            })
            const offset = Object.values(pollstates).length;
            if (pollstates.length == QUERY_SIZE) {
                const old = pollstates[0].toObject();
                const mesg = new pb.Query()
                mesg.setId(old.beid.tvid)
                mesg.setSubid(old.beid.schid)
                mesg.setOffset(offset)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/windows/poll/state/query', body, serial: offset })
            }

            const chnpoll = { ...state.chnpoll, state: pollstates }
            return { ...state, chnpoll };
        }
        case '/msp/v2/windows/poll/param/query': {
            const { payload } = action;
            const mesg = new pb.Tswid()
            mesg.setId(payload.id)
            mesg.setTvid(payload.tvid)
            mesg.setSceneid(payload.sceneid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/poll/param/query/ack': {
            const mesg = action.body.unpack(pb.PollPrm.deserializeBinary, 'msp.cnt.sch.PollPrm')
            const param = {
                keep: mesg.getKeep(),
                issame: mesg.getIssame(),
                interval: mesg.getInterval(),
                beid: mesg.getBeid().toObject()
            }
            return { ...state, chnpoll: { ...state.chnpoll, param } };
        }
        case '/msp/v2/windows/pollmem/param/query': {
            const { payload } = action;
            const mesg = new pb.Query()
            mesg.setId(payload.tvid)
            mesg.setSubid(payload.sceneid)
            mesg.setOffset(0)
            mesg.setSize(20)
            mesg.setExid(payload.id)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/pollmem/param/query/ack': {
            const mesg = action.body.unpack(pb.PollMems.deserializeBinary, 'msp.cnt.sch.PollMems')
            const mems = mesg.getPollmemList().map(m => m.toObject()).
                reduce((t, m) => { !t.find(n => n.id == m.id) && t.push(m); return t; }, [])
            return { ...state, chnpoll: { ...state.chnpoll, mems } };
        }
        case '/msp/v2/windows/poll/param/config': {
            const { payload } = action;
            const mesg = new pb.Poll();
            payload.mems.map(m => mesg.addPollmem(new pb.PollMem([m.interval, m.id, m.name])))
            const param = new pb.PollPrm([payload.param.keep, payload.param.issame, payload.param.interval])
            mesg.setParam(param)
            const beid = new pb.Tswid([payload.beid.id, payload.beid.sceneid, payload.beid.tvid])
            mesg.setBeid(beid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Poll')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/poll/param/config': {
            return state;
        }
        case '/msp/v2/windows/pollmem/start/add': {
            const { payload } = action;
            const mesg = new pb.Poll();
            payload.mems.map(m => mesg.addPollmem(new pb.PollMem([m.interval, m.id, m.name])))
            const beid = new pb.Tswid([payload.beid.id, payload.beid.sceneid, payload.beid.tvid])
            mesg.setBeid(beid)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Poll')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/pollmem/start/add/ack': {
            return state;
        }
        case '/msp/v2/windows/pollmem/stop/add': {
            const { payload } = action;
            const mesg = new pb.Tswid([payload.id, payload.sceneid, payload.tvid])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body })
            return state;
        }
        case '/msp/v2/windows/pollmem/stop/add/ack': {
            return state;
        }
        case '/msp/v2/windows/poll/start/config': {
            const { payload } = action;
            const mesg = new pb.Tswid([payload.id, payload.sceneid, payload.tvid]);
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body, serial: payload.tvid, context: payload.sceneid })
            return state;
        }
        case '/msp/v2/windows/poll/start/config/ack': {
            if (!action.err) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setSubid(action.context)
                mesg.setOffset(0)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/windows/poll/state/query', body, serial: 0 })
            }
            return state;
        }
        case '/msp/v2/windows/poll/stop/config': {
            const { payload } = action;
            const mesg = new pb.Tswid([payload.id, payload.sceneid, payload.tvid])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.sch.Tswid')
            send({ evt, body, serial: payload.tvid, context: payload.sceneid })
            return state;
        }
        case '/msp/v2/windows/poll/stop/config/ack': {
            if (!action.err) {
                const mesg = new pb.Query()
                mesg.setId(action.serial)
                mesg.setSubid(action.context)
                mesg.setOffset(0)
                mesg.setSize(QUERY_SIZE)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.Query')
                send({ evt: '/msp/v2/windows/poll/state/query', body, serial: 0 })
            }
            return state;
        }
        case '/msp/v2/windows/poll/state/updata': {
            const mesg = action.body.unpack(pb.PollStates.deserializeBinary, 'msp.cnt.sch.PollStates')
            const chnpoll = { ...state.chnpoll, state: { ...state.chnpoll.state } }
            const { id: schid, tvid } = state.curschm;
            if (!schid || !tvid) return state;
            mesg.getPollstateList().map(m => {
                const poll = m.toObject()
                if (tvid == poll.beid.tvid &&
                    schid == poll.beid.schemeid) {
                    chnpoll.state[poll.beid.id] = poll
                }
            })
            return { ...state, chnpoll };
        }
        case '/msp/v2/windows/ptz/config': {
            const { payload } = action;
            const mesg = new pb.Ptz()
            mesg.setId(payload.id)
            // const beid = new pb.Tswid()
            // beid.setId(payload.umtid)
            // mesg.setBeid(beid)
            mesg.setOn(payload.on)
            mesg.setCode(payload.code)
            mesg.setParam(payload.param)
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.wds.Ptz')
            send({ evt, body, serial: payload.id, context: payload.code })
            return state;
        }
        case '/msp/v2/windows/ptz/config/ack': {
            if (!action.err && action.serial) {
                const mesg = new pb.Ptz()
                mesg.setId(action.serial)
                mesg.setOn(0)
                mesg.setCode(action.context)
                const body = new proto.google.protobuf.Any()
                body.pack(mesg.serializeBinary(), 'msp.cnt.wds.Ptz')
                send({ evt: '/msp/v2/windows/ptz/config', body })
            }
            return state;
        }
        case '/msp/v2/schdule/screen/lock': {
            const sglobal = { ...state.sglobal }
            sglobal.lock = sglobal.lock ? false : true
            return { ...state, sglobal }
        }
        case '/msp/v2/windows/live/start/config': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.id])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/windows/live/start/config/ack': {
            const mesg = action.body.unpack(pb.RealPlay.deserializeBinary, 'msp.cnt.wds.RealPlay')
            const chnmap = { ...state.chnmap }
            chnmap[mesg.getId()] = mesg.toObject()
            return { ...state, chnmap };
        }
        case '/msp/v2/windows/live/stop/config': {
            const { payload } = action;
            const mesg = new pb.ValueU32([payload.id])
            const body = new proto.google.protobuf.Any()
            body.pack(mesg.serializeBinary(), 'msp.cnt.ValueU32')
            send({ evt, body, serial: payload.id })
            return state;
        }
        case '/msp/v2/windows/live/stop/config/ack': {
            return state;
        }
        default: return state;
    }
}