import React, { useEffect, useState, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { Tree, Space, Button, Menu, Dropdown, Input, Select, Drawer, Tabs, Tooltip, Divider } from 'antd';
import { DownOutlined, EllipsisOutlined, SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import SplitterLayout from 'react-splitter-layout';
import screenfull from 'screenfull';
import Search from './public/search'
import _ from 'lodash';

import './style/index.less'

import Window from './window'
import Gallery from './gallery'
import Resources from './resources'
import SideBar from './sidebar'
import ToolBar from './toolbar'

import {
    SceneNewModal,
    SceneSaveasModal,
    ScenePollModal,
    SceneConfigModal
} from './modal/scenemodal'

import { ReactComponent as Svg_Clear } from '@/assets/tv/clear.svg'
import { ReactComponent as Svg_Reset } from '@/assets/tv/reset.svg'
import { ReactComponent as Svg_Save } from '@/assets/tv/save.svg'
import { ReactComponent as Svg_Saveas } from '@/assets/tv/saveas.svg'
import { ReactComponent as Svg_Lock } from '@/assets/tv/lock.svg'
import { ReactComponent as Svg_Unlock } from '@/assets/tv/unlock.svg'
import { ReactComponent as Svg_Style } from '@/assets/tv/tvstyle.svg'
import { ReactComponent as Svg_PollStop } from '@/assets/tv/poll-stop.svg'
import { ReactComponent as Svg_PollStart } from '@/assets/tv/poll-start.svg'

import pic_bar from '@/assets/tv/bar.png'

import { GSN, CHNTYPE } from '../public';

const { Option } = Select;

const get_from_local = key => new Promise((resolve, reject) => {
    const value = window.localStorage.getItem(key)
    value ? resolve(value) : reject()
})

const save_to_local = (key, value) => new Promise(resolve => {
    window.localStorage.setItem(key, value)
    resolve();
})

export default () => {
    const [order, setOrder] = useState(0)
    const [layout, setLayout] = useState(0)
    const [paneSize, setPaneSize] = useState(0)
    const [selectIndex, setSelectIndex] = useState(0)

    const [tvid, setTvid] = useState()
    const [schID, setSchID] = useState()
    const [fold, setFold] = useState(true)
    const [viewed, setViewed] = useState(true)
    const [lockKeys, setLockKeys] = useState([])
    const [winSize, setWinSize] = useState({ w: 0, h: 0, r: 0 })

    const walls = useSelector(({ mspsScreenCfg }) => mspsScreenCfg.walls)

    const curschm = useSelector(({ mspsSch }) => mspsSch.curschm)
    const tvschms = useSelector(({ mspsSch }) => mspsSch.schemes)
    const tvwinds = useSelector(({ mspsSch }) => mspsSch.windows)
    const sglobal = useSelector(({ mspsSch }) => mspsSch.sglobal)

    const vins = useSelector(({ mspsDev }) => mspsDev.vins)
    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.umts)
    const searchs = useSelector(({ mspsDev }) => mspsDev.searchs)
    const netdevs = useSelector(({ mspsDev }) => mspsDev.netdevs)

    const chnpoll = useSelector(({ mspsSch }) => mspsSch.chnpoll)
    const pollstate = useSelector(({ mspsSch }) => mspsSch.poll.state)

    const ref = useRef()
    const vef = useRef()
    const dispatch = useDispatch();

    const schemes = useMemo(() => tvschms[tvid] || [], [tvschms, tvid])
    const seeks = useMemo(() => Object.values(searchs).map(m => ({ key: m.id, ...m })), [searchs])
    const windows = useMemo(() => {
        const winds = tvwinds[tvid]
        if (!winds || !winds.wins) return []
        return winds.wins.map(m => ({ key: m.id, ...m }))
    }, [tvwinds, tvid])
    const data = useMemo(() => windows.map(m => {
        const pol = chnpoll.state[m.id]
        const chn = netdevs[m.srcid] || vins[m.srcid]
        return {
            ...m, polled: pol && pol.state,
            name: chn ? chn.name : null,
            gbid: chn ? chn.gbid : null,
        }
    }), [windows, chnpoll, netdevs, vins])

    const pitch = useMemo(() => data.find(m => m.id == selectIndex) || {}, [data, selectIndex])
    const tv_sels = useMemo(() => Object.values(walls).map(m => <Option key={m.id} value={m.id}>{m.name}</Option>), [walls])
    const scene_sels = schemes.map(m => <Option key={m.id} value={m.id}><Tooltip title={m.name} >{m.name}</Tooltip></Option>)

    useEffect(() => {
        get_from_local('_MAIN_SPLIT_SEC_PERCENT_')
            .then(v => setPaneSize(v ? Number(v) : 84))
            .catch(e => console.log('get split percent err: ', e))

        dispatch({ type: '/msp/v2/net/umt/query' })
        dispatch({ type: '/msp/v2/chn/group/query' })
        dispatch({ type: '/msp/v2/chn/favorite/query' })
        dispatch({ type: '/msp/v2/tv/query', payload: { serial: GSN.SCHEDULE } })
        dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN, offset: 0 } });
        dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VOUT, offset: 0 } });
    }, [])

    useEffect(() => {
        const ids = Object.keys(walls)
        if (ids.length) {
            const tid = parseInt(window.localStorage.getItem('_SCREEN_WALL_ID_'))
            setTvid(tid && ids.find(m => m == tid) ? tid : parseInt(ids[0]))
        }else {
            dispatch({ type: '/msp/v2/schemes/query'})
            dispatch({ type: '/msp/v2/schemes/current/query'})
        }
    }, [walls])

    useEffect(() => {
        if (tvid) {
            wall_change_query(tvid)
            save_to_local('_SCREEN_WALL_ID_', tvid)
        }
    }, [tvid])

    useEffect(() => {
        const { id: schid } = curschm;
        if (!tvid || !schid) return;

        setLockKeys([])
        dispatch({ type: '/msp/v2/windows/poll/state/query', payload: { tvid, schid } })
        if (schid != schID)
            dispatch({ type: '/msp/v2/schemes/current/detail/query', payload: { tvid, schid } })
    }, [tvid, curschm])

    useEffect(() => {
        const umts = Object.values(nets).filter(m => m.type == 2);
        if (!umts.length) return;
        dispatch({ type: '/msp/v2/chn/umt/group/query', payload: { id: umts[0].id } })
    }, [nets])

    useEffect(() => {
        const chns = windows.filter(m => !vins[m.srcid]).filter(m => !netdevs[m.srcid]).map(m => m.srcid)
        if (chns.length) dispatch({ type: '/msp/v2/chn/umt/chn/simple/query', payload: chns })
    }, [windows])

    const wall_change_query = async tvid => {
        dispatch({ type: '/msp/v2/schemes/query', payload: { id: tvid } })
        dispatch({ type: '/msp/v2/schemes/current/query', payload: { id: tvid } })
        dispatch({ type: '/msp/v2/tv/detail/query', payload: { serial: GSN.SCHEDULE, id: tvid } })
        dispatch({ type: '/msp/v2/schemes/poll/state/query', payload: { id: tvid } })
    }

    const handleDragStart = info => {
        if (!info.node.isLeaf) return false;
        const dt = info.event.dataTransfer

        dt.setData('chnid', info.node.id)
        dt.setData('gbid', info.node.gbid)
        dt.setData('title', info.node.title)
    }

    const handleMenuClick = e => {
        setLayout(parseInt(e.key));
    }

    const handlePressEnter = value => {
        if (!value) {
            dispatch({ type: '/msp/v2/chn/search/config' })
        } else {
            dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: value } })
        }
    }

    const handleLoadMore = useCallback(search => {
        dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: search, offset: Object.keys(searchs).length } })
    }, [searchs])

    const handleCancel = () => {
        setOrder(0)
    }

    const handleConfirm = () => {
        setOrder(0)
    }

    const handleSchMenuClick = e => {
        setOrder(e.key);
    }

    const handleSchBtnClick = e => {
        console.log('click left button', e);
    }

    const handleSaveClick = () => {
        dispatch({ type: '/msp/v2/schemes/save', payload: { op: 3, id: curschm.id, tvid } })
    }

    const handleClearClick = () => {
        dispatch({ type: '/msp/v2/windows/clean/config', payload: { tvid, schid: curschm.id } })
    }

    const handlePoll = () => {
        const type = !pollstate.state ? '/msp/v2/schemes/poll/start/config' : '/msp/v2/schemes/poll/stop/config'
        dispatch({ type, payload: { tvid } })
    }

    const handleSplitChange = size => {
        console.log('Split Change: ', size, paneSize)
        setPaneSize(size)

        const save_percent = size => new Promise(resolve => {
            window.localStorage.setItem('_MAIN_SPLIT_SEC_PERCENT_', size)
            resolve();
        })
        save_percent(size).catch(err => console.log('save split error:', err))
    }

    const handleWallChange = wid => { 
        setLayout(0)
        setTvid(wid)
    }

    const handleSchemeChange = schid => {
        if (!schemes.length) return;

        const save_scene = schid => new Promise(resolve => {
            window.localStorage.setItem('_SCREEN_SCHEME_ID_', schid)
            resolve();
        })

        if (!schid) {
            schid = curschm.id
        } else {
            setSchID(schid)
            save_scene(schid).catch(err => console.log('save scheme error: ', err))
        }

        dispatch({ type: '/msp/v2/schemes/load/config', payload: { schid, tvid } })
        dispatch({ type: '/msp/v2/schemes/default/detail/query', payload: { tvid, schid } })
    }

    const handleLockClick = () => {
        dispatch({ type: '/msp/v2/schdule/screen/lock' })
    }

    const handleSelectChanged = id => {
        setSelectIndex(id)
    }

    const handleWinSizeChange = (w, h, r) => {
        setWinSize({w, h, r})
    }

    const handleLockChanged = (key, checked) => {
        console.log(lockKeys, key, checked)
        !checked ?
            setLockKeys(origin => origin.filter(m => m != key)) :
            setLockKeys(origin => { origin.push(key); return [...origin] })
    }

    const handleMove = (id, l, t, w, h) => {
        ref.current.move(id, l, t, w, h)
    }

    const handleFullScreen = id => {
        const bFull = ref.current.fullscreen(id)
    }

    const handleShrink = (id, single) => {
        single ? ref.current.shrink2single(id) : ref.current.shrink2own(id)
    }

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item key={0}>无风格</Menu.Item>
            <Menu.Divider />
            <Menu.Item key={1}>1 x 2</Menu.Item>
            <Menu.Item key={2}>2 x 2</Menu.Item>
            <Menu.Item key={3}>3 x 3</Menu.Item>
            <Menu.Item key={4}>4 x 4</Menu.Item>
            <Menu.Item key={5}>5 x 5</Menu.Item>
            <Menu.Item key={6}>6 x 6</Menu.Item>
            <Menu.Item key={7}>7 x 7</Menu.Item>
            <Menu.Item key={8}>8 x 8</Menu.Item>
            <Menu.Item key={9}>9 x 9</Menu.Item>
            <Menu.Divider />
            <Menu.Item key={11}>五画面</Menu.Item>
            <Menu.Item key={12}>六画面</Menu.Item>
            <Menu.Item key={13}>七画面</Menu.Item>
            <Menu.Item key={14}>八画面</Menu.Item>
            <Menu.Item key={15}>十画面</Menu.Item>
            <Menu.Item key={16}>十二画面</Menu.Item>
            <Menu.Item key={17}>十四画面</Menu.Item>
        </Menu>
    );

    const smenu = (
        <Menu onClick={handleSchMenuClick}>
            <Menu.Item key={1}>新建</Menu.Item>
            <Menu.Item key={2}>另存为</Menu.Item>
            <Menu.Item key={3}>轮巡配置</Menu.Item>
            <Menu.Item key={4}>管理</Menu.Item>
        </Menu>
    );

    const isGlobalLock = sglobal.lock
    const isSchemPoll = pollstate && pollstate.state
    const isSchemNull = !schemes.length

    const isDisabled = isGlobalLock || isSchemNull || isSchemPoll

    const isWinFull = useMemo(() => ref.current && ref.current.isfull(selectIndex), [ref, selectIndex])

    return (
        <div className='screen_container'>
            <SplitterLayout percentage secondaryInitialSize={84} onSecondaryPaneSizeChange={handleSplitChange}>
                <div className='left_area'>
                    <div className='left_title'>
                        信号源列表
                    </div>
                    <div className='left_sider'>
                        <Search
                            data={seeks}
                            draggable={true}
                            onLoadMore={handleLoadMore}
                            onPressEnter={handlePressEnter}
                            style={{ height: 30 }} />

                        <div className='res_area' >
                            <Resources draggable onDragStart={handleDragStart} />
                        </div>
                    </div>
                </div>
                <div className='content_area'>
                    <div className='center_area' ref={vef} style={{ height: viewed ? 'calc(100% - 164px)' : '100%' }}>
                        <div className='head_bar'>
                            <Space size={20}>
                                <Space>
                                    屏幕墙
                                    <Select value={tvid} onChange={handleWallChange} style={{ width: 160 }} >
                                        {tv_sels}
                                    </Select>
                                </Space>
                                <Space>
                                    场景
                                    <Select value={curschm.id} onChange={handleSchemeChange} style={{ width: 160 }} >
                                        {scene_sels}
                                    </Select>
                                </Space>
                                <Dropdown overlay={smenu} trigger={['click']}>
                                    <Button className={'dropdown-btn'} onClick={e => e.preventDefault()}>
                                        场景菜单 <DownOutlined />
                                    </Button>
                                </Dropdown>
                            </Space>
                            <Space>
                                <Space size={10}>
                                    <Tooltip title={pollstate && !pollstate.state ? '开始轮巡' : '停止轮巡'}>
                                        <Button className='ghost-btn' ghost onClick={handlePoll} icon={
                                            pollstate && !pollstate.state ? <Svg_PollStart /> : <Svg_PollStop />}></Button>
                                    </Tooltip>
                                    <Tooltip title='画面风格'>
                                        <Dropdown overlay={menu} trigger={['click']} getPopupContainer={triggerNode => triggerNode.parentNode}>
                                            <Button className='ghost-btn' ghost disabled={isSchemNull}
                                                icon={<Svg_Style style={{ fill: isSchemNull ? '#BEBEBE' : '#4999FF' }} />}
                                                onClick={e => e.preventDefault()}></Button>
                                        </Dropdown>
                                    </Tooltip>
                                    <Tooltip title='另存为'><Button className='ghost-btn' ghost disabled={isDisabled} onClick={() => setOrder(2)}
                                        icon={<Svg_Saveas style={{ fill: isDisabled ? '#BEBEBE' : '#4999FF' }} />}></Button></Tooltip>
                                    <Tooltip title='保存'><Button className='ghost-btn' ghost disabled={isDisabled} onClick={handleSaveClick}
                                        icon={<Svg_Save style={{ fill: isDisabled ? '#BEBEBE' : '#4999FF' }} />}></Button></Tooltip>
                                    <Tooltip title='重置'><Button className='ghost-btn' ghost disabled={isDisabled} onClick={() => handleSchemeChange()}
                                        icon={<Svg_Reset style={{ fill: isDisabled? '#BEBEBE' : '#4999FF' }} />}></Button></Tooltip>
                                    <Tooltip title='锁定'><Button className='ghost-btn' ghost onClick={handleLockClick}
                                        icon={isGlobalLock ? <Svg_Lock /> : <Svg_Unlock />}></Button></Tooltip>
                                    <Tooltip title='清空'><Button className='ghost-btn' ghost disabled={isDisabled} onClick={handleClearClick}
                                        icon={<Svg_Clear style={{ fill: isDisabled ? '#BEBEBE' : '#4999FF' }} />}></Button></Tooltip>
                                </Space>
                            </Space>
                        </div>
                        <div className='view_area' >
                            <div style={{ display: 'flex', flexDirection: 'column', cursor: 'default', width: fold ? '100%' : 'calc(100% - 322px)' }}>
                                <Window ref={ref} windows={data} layout={layout} tvid={tvid} 
                                    scheme={curschm} lockKeys={lockKeys} onLockChange={handleLockChanged} 
                                    onSelectChanged={handleSelectChanged} onWinSizeChange={handleWinSizeChange} />
                                <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(219, 223, 229, 0.4)' }} />
                                <ToolBar fold={fold} onFoldChange={f => setFold(f)} parentRef={vef} />
                            </div>
                            {!fold && <>
                                <div style={{ width: 2, minWidth: 2, height: '100%', background: '#F0F2F5' }} />
                                <SideBar data={pitch} tvid={tvid} scheme={curschm} winSize={winSize} index={selectIndex} isFull={isWinFull} lockKeys={lockKeys} disabled={sglobal.lock}
                                    onLockChange={handleLockChanged} onMove={handleMove} onFullScreen={handleFullScreen} onShrink={handleShrink} />
                            </>}
                        </div>
                    </div>
                    <div style={{ width: '100%', height: viewed ? 4 : 0, backgroundColor: '#F0F2F5' }} />
                    <div className='gallery_bar' style={{ top: viewed ? 'calc(100% - 160px)' : 'calc(100% - 10px)' }}>
                        <img src={pic_bar} onClick={() => setViewed(!viewed)} style={{ transform: viewed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
                    </div>
                    <div className='gallery_area' style={{ minHeight: viewed ? 160 : 0 }} >
                        <div className='gallery_content' style={{ display: viewed ? '' : 'none' }}>
                            <Gallery size={16} space={8} style={{ margin: 10 }} />
                        </div>
                    </div>
                </div>
            </SplitterLayout>
            {1 == order && <SceneNewModal visible={1 == order} parentRef={vef} tvid={tvid} schemes={schemes} onCancel={handleCancel} onConfirm={handleConfirm} />}
            {2 == order && <SceneSaveasModal visible={2 == order} parentRef={vef} tvid={tvid} schemes={schemes} schid={curschm.id} onCancel={handleCancel} onConfirm={handleConfirm} />}
            {3 == order && <ScenePollModal visible={3 == order} parentRef={vef} tvid={tvid} schemes={schemes} onCancel={handleCancel} onConfirm={handleConfirm} />}
            {4 == order && <SceneConfigModal visible={4 == order} parentRef={vef} tvid={tvid} schemes={schemes} onCancel={handleCancel} onConfirm={handleConfirm} />}
        </div>
    );
}