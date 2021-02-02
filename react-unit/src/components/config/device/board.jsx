import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Select, List, Card } from 'antd';
import { DEVTYPE } from '../../public';
import './index.less'

const { TabPane } = Tabs;

import BoardDetail from './board-table-detail'
import BoardRegist from './board-table-reg';
import BoardRestart from './board-table-restart';
import BoardRecovery from './board-table-recovery';
import BoardUpgrade from './board-table-upgrade';
import BoardBoxno from './board-table-boxno.jsx';


const dataBoard = [
    { id: "all", name: "全部" },
    { id: "input", name: "输入板" },
    { id: "output", name: "输出板" },
    { id: "reciver", name: "接收器" },
    { id: "sender", name: "发送器" },
    { id: "decoder", name: "解码板" },
    { id: "box", name: "机箱" },
    { id: "netmgr", name: "网管处理器" },
    { id: "videomgr", name: "视频处理器" },
    { id: "audiomgr", name: "音频处理器" },
    { id: "other", name: "其他" }
]

const tab2type = {
    'all': DEVTYPE.ALL,
    'input': DEVTYPE.IN,
    'output': DEVTYPE.OUT,
    'reciver': DEVTYPE.RX,
    'sender': DEVTYPE.TX,
    'decoder': DEVTYPE.DEC,
    'box': DEVTYPE.BOX,
    'netmgr': DEVTYPE.NMC,
    'videomgr': DEVTYPE.VSVR,
    'audiomgr': DEVTYPE.ASVR,
    'other': DEVTYPE.ASVR
}

const BoardManager = props => {
    const [selectedKey, setSelectedKey] = useState('all')
    const [activeKey, setActiveKey] = useState('detail')

    const handleSelect = (key) => {
        setSelectedKey(key)
        setActiveKey('detail')
    }

    const handleChange = key => {
        setActiveKey(key)
    }

    const all_tab = tab => {
        switch (tab) {
            case 'detail': return <BoardDetail bdtype={tab2type[selectedKey]} />
            case 'reg': return <BoardRegist />
            case 'upgrade': return <BoardUpgrade tab={selectedKey} bdtype={tab2type[selectedKey]} />
            case 'restart': return <BoardRestart bdtype={tab2type[selectedKey]} />
            case 'recover': return <BoardRecovery bdtype={tab2type[selectedKey]} />
            case 'boxno': return <BoardBoxno bdtype={tab2type[selectedKey]} />
            default: return <></>
        }
    }

    const tablist = {
        'all': [
            { key: 'detail', tab: '详细配置' },
            { key: 'reg', tab: '搜索注册' }
        ],
        'input': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'output': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'reciver': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
        ],
        'sender': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
        ],
        'decoder': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'box': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'netmgr': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'videomgr': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'videomgr': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'audiomgr': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'restart', tab: '重启' },
            { key: 'recover', tab: '恢复出厂' },
            { key: 'boxno', tab: '机箱号配置' }
        ],
        'other': [
            { key: 'detail', tab: '详细配置' },
            { key: 'upgrade', tab: '升级' },
            { key: 'boxno', tab: '机箱号配置' }
        ]
    }

    const pane = useMemo(() => {
        return <Card
            size='small'
            tabList={tablist[selectedKey]}
            activeTabKey={activeKey}
            onTabChange={handleChange}
            bodyStyle={{ overflowY: 'auto', height: '100%' }}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        > {all_tab(activeKey)} </Card>
    }, [selectedKey, activeKey])

    return (
        <div className="board">
            <div className="board-left">
                <List
                    header={'板卡类型'}
                    bordered
                    size='small'
                    style={{ height: '100%' }}
                    dataSource={dataBoard}
                    renderItem={m => <List.Item key={m.id} onClick={() => handleSelect(m.id)}
                        style={{ userSelect: 'none', background: selectedKey == m.id ? "#BAE7FF" : 'inherit' }}>
                        {m.name} </List.Item>
                    }
                />
            </div>
            <div className="board-right">{pane}</div>
        </div>
    )
}

export default BoardManager;