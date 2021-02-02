import { useDispatch } from 'react-redux';

const useActions = () => {
    const dispatch = useDispatch();
    const windows_open_config = (tvid, sceneid, srcid, layout, ...rests) => {
        const payload = { tvid, sceneid, srcid, layout }

        console.log('->', tvid, sceneid, srcid, layout, rests)

        if (rests[0]) payload.id = rests[0]
        if (rests[1] != undefined) {
            payload.iscut = rests[1]
            payload.cut = rests[2]
        }
        dispatch({ type: '/msp/v2/windows/open/config', payload })
    }

    return { windows_open_config }
}

export default useActions;