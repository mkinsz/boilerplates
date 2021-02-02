import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Card } from 'antd';
import { useDispatch, useSelector } from 'react-redux'

import ChnCfgVins from './chnnlcfg-table-vin'
import ChnCfgVouts from './chnnlcfg-table-vout'
import ChnCfgAins from './chnnlcfg-table-ain'
import ChnCfgAouts from './chnnlcfg-table-aout'

const { TabPane } = Tabs;

import { CHNTYPE } from '../../public';

const ChnConfig = props => {
    const dispatch = useDispatch();

    const [activeKey, setActiveKey] = useState('vin')

    const ext = useSelector(({ mspsDev }) => mspsDev.ains)

    useEffect(() => {
        dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.AIN } })
        dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.AOUT } })
    }, [])

    const tabList = [
        { key: 'vin', tab: '视频输入' },
        { key: 'vout', tab: '视频输出' },
        { key: 'ain', tab: '音频输入' },
        { key: 'aout', tab: '音频输出' },
    ]

    const tabComponent = useMemo(() => {
        switch (activeKey) {
            case 'vin': return <ChnCfgVins />
            case 'vout': return <ChnCfgVouts />
            case 'ain': return <ChnCfgAins data={ext} />
            case 'aout': return <ChnCfgAouts />
            default: return <></>
        }
    }, [activeKey, ext])

    const handleChange = key => {
        setActiveKey(key)
    }

    return <Card
        size='small'
        tabList={tabList}
        activekey={activeKey}
        onTabChange={handleChange}
        bodyStyle={{ overflowY: 'auto', height: '100%' }}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    > {tabComponent} </Card>
}

export default ChnConfig