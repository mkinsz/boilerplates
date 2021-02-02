import { store } from '../utils';

export const CONFIG = {
    delUmt: id => store.dispatch({ type: '/msp/v2/net/umt/delete', payload: { id }}),
    getDecMode: payload => store.dispatch({type: '/msp/v2/net/umtdev/module/query', payload}),
    setRdBox: payload => store.dispatch({type: '/msp/v2/devex/box/redundancy/config', payload}),
    getDevs: (type, offset, size, serial) => {
        store.dispatch({type: '/msp/v2/eqp/query', serial, payload: {id: type, offset, size}})
    },
    getKvmGroupMem: id => store.dispatch({type: '/msp/v2/kvm/group/mem/query', payload: {id}}),
    dispatch: (evt, payload) => store.dispatch({type: evt, payload}),
}