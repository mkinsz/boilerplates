import { store } from '../utils';

export const SAFE = {
    
    //安全相关
    getSSHstate:() =>store.dispatch({ type: '/msp/v2/safe/ssh/query', payload: {}}),
    setSSHstate:(state)=>store.dispatch({type:'/msp/v2/safe/ssh/config',payload:{state}}),

    getFilterType:()=>store.dispatch({ type: '/msp/v2/safe/filter/query', payload: {}}),
    getFilterForm:(type)=>store.dispatch({ type: '/msp/v2/safe/filterform/query', payload: {type}}),
    setFilterForm:(type,ips)=>store.dispatch({ type: '/msp/v2/safe/filterform/config', payload: {type,ips}}),

    dispatch: (evt, payload) => store.dispatch({type: evt, payload}),
}