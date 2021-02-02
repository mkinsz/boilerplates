import { store } from '../utils';
import { DEVTYPE } from '../components/public';
import { GSN } from '../components/public'

const serial = GSN.SCREENCFG
export const SCREEN = {
    
    //大屏相关
    getWalls:() =>store.dispatch({ type: '/msp/v2/tv/query', payload: {serial}}),
    getWallCells:(id)=>store.dispatch({type:'/msp/v2/tv/detail/query',payload:{serial,id}}),
    getChannels:(type)=>store.dispatch({type:'/msp/v2/chn/query',payload:{serial,type,forced:true}}),

    addWall:(wallInfo)=>store.dispatch({type:'/msp/v2/tv/config',payload:{serial,wallInfo}}),

    delWall:(id)=>store.dispatch({type:'/msp/v2/tv/delete',payload:{serial,id}}),

    getWallMaps:(id)=>store.dispatch({type:'/msp/v2/tv/back/query',payload:{serial,id}}),

    addWallMap:(wallMapInfo)=>store.dispatch({type:'/msp/v2/tv/back/add',payload:{serial,wallMapInfo}}),

    delWallMap:(wallMapInfo)=>store.dispatch({type:'/msp/v2/tv/back/delete',payload:{serial,wallMapInfo}}),

    WallMapUpFinish:(wallMapInfo)=>store.dispatch({type:'/msp/v2/tv/backtrans/end/config',payload:{serial,wallMapInfo}}),

    useWallMap:(wallMapInfo)=>store.dispatch({type:'/msp/v2/tv/back/config',payload:{serial,wallMapInfo}}),

    getOsds:(id)=>store.dispatch({type:'/msp/v2/tv/osd/cfg/query',payload:{serial,id}}),

    addOsd:(osdInfo)=>store.dispatch({type:'/msp/v2/tv/osd/cfg/add',payload:{serial,osdInfo}}),

    delOsd:(wallID)=>store.dispatch({type:'/msp/v2/tv/osd/cfg/delete',payload:{serial,wallID}}),

    useOsd:(wallID,bUse)=>store.dispatch({type:'/msp/v2/tv/osd/add',payload:{serial,wallID,bUse}}),

    getOsdUse:(wallID)=>store.dispatch({type:'/msp/v2/tv/osd/query',payload:{serial,wallID}}),

    getRate:(wallID)=>store.dispatch({type:'/msp/v2/tv/custom/query',payload:{serial,wallID}}),

    setRate:(rateinfo)=>store.dispatch({type:'/msp/v2/tv/costom/config',payload:{serial,rateinfo}}),

    clearCache:(reducer)=>store.dispatch({type:reducer+'/clear',payload:{serial}}),

    dispatch: (evt, payload) => store.dispatch({type: evt, payload}),
}