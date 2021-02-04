import React, { useCallback, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import {
    List, Form, Checkbox, Input, Tooltip,
    Radio, InputNumber, Button, Tree, Empty, Space, message, Modal, Popconfirm
} from 'antd';
import { CONFIG } from '../../../actions';
import { CHNTYPE } from '../../public'
import CellView from './cellview'
import TvModal from './modal/tvmodal'
import KvmModal from './modal/kvmmodal'
import SwitchModal from './modal/switchmodal'
import { v4 as uuidv4 } from 'uuid';
import * as ws from '@/services'
import _ from 'lodash'
import './style/config.less'

import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'

import { useComponentResize } from '../../public'

const ModeInput = ({ value = {}, onChange, disabled }) => {
    const [data, setData] = useState({})

    useEffect(() => {
        const { module, menu } = value;
        if (data.menu != menu ||
            data.module != module)
            setData({ module, menu })
    }, [value])

    const triggerChange = (changedValue) => {
        if (onChange) {
            onChange({
                ...data,
                ...value,
                ...changedValue,
            });
        }
    };

    const handleModeChange = (e) => {

        const num = parseInt(e.target.value || 0, 10);

        if (!('module' in value)) setData(o => ({ ...o, module: num }));

        triggerChange({ module: num });

    };

    const handleCheckChanged = e => {
        if (!('menu' in value))
            setData(o => ({ ...o, menu: e.target.checked }))

        triggerChange({ menu: e.target.checked });
    };

    return (
        <Space>
            <Radio.Group onChange={handleModeChange} value={data.module} disabled={disabled}>
                <Radio value={0}>小屏模式</Radio>
                <Radio value={1}>大屏模式(左上角为主屏)</Radio>
            </Radio.Group>
            <Checkbox disabled={disabled} checked={data.menu} onChange={handleCheckChanged}>不显示菜单</Checkbox>
        </Space>
    );
}

const TitleInput = ({ value = {}, onChange, disabled }) => {
    const [data, setData] = useState({})

    useEffect(() => {
        if (value.name != data.name)
            setData({ name: value.name })
    }, [value])

    const triggerChange = (changedValue) => {
        if (onChange) {
            onChange({
                ...data,
                ...value,
                ...changedValue,
            });
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value
        setData(o => ({ ...o, name }));
        triggerChange({ name });
    };

    return (
        <Space size={20}>
            <Input disabled={disabled} value={data.name} onChange={handleNameChange} style={{ width: 300 }} />
            <Button type='primary' disabled={disabled} htmlType='submit'>保存</Button>
        </Space>
    );
}

const LayoutInput = ({ value = {}, onChange, disabled, origin }) => {
    const [data, setData] = useState({})
    const [tvls, setTvls] = useState([])

    const dispatch = useDispatch();

    const chnins = useSelector(({ mspsDev }) => mspsDev.vins)
    const chnouts = useSelector(({ mspsDev }) => mspsDev.vouts)

    const vouts = useMemo(() => Object.values(chnouts).map(m => ({ ...m, key: m.id })), [chnouts])

    const ref = React.useRef();
    const resize = useComponentResize(ref)

    const genFl = useCallback((n, r) => {
        const { width: w, height: h } = resize;
        const ws = w ? w / n : w;
        const hs = h ? h / n : h;
        let s = '';
        while (n--) s += r ? `${hs}px ` : `${ws}px `
        return s;
    }, [resize])

    useEffect(() => {
        const { row, col, tvs } = value;
        // console.log('Value 1: ', tvs, tvls)
        const dts = _.difference(tvls, tvs)
        if (dts.length || (!tvls.length && tvs && tvs.length)) setTvls(tvs)
        if (data.row != row || data.col != col) setData({ ...data, row, col })

        // console.log('Value Update:', row, col, tvs, tvls, dts)
    }, [value])

    const handleCellChange = (cell, remove) => {
        if (!cell) return;
        const newTvs = _.cloneDeep(tvls)
        const tv = newTvs[cell.id] || {}
        tv.id = cell.id
        tv.arrayinList = []
        if(tv.outid != cell.chnout) {
            tv.outid && dispatch({type: '/msp/v2/chn/change', payload: {type: 8, id: tv.outid, property: 'signal', value: false}})
            // cell.chnout && dispatch({type: '/msp/v2/chn/change', payload: {type: 8, id: cell.chnout, property: 'signal', value: true}})
            tv.outid = cell.chnout
        }
        if (cell.chnin) tv.arrayinList = [cell.chnin]
        newTvs[cell.id] = tv

        if (!('tvs' in value)) setTvls(newTvs)
        triggerChange({ tvs: newTvs })
    }

    const grids = useMemo(() => {
        if (!origin) return [];

        const cells = []
        const { col, row } = data;
        const tvs = origin.arraytvList || [];
        const sel_outs = tvls.map(m => m.outid)
        const org_outs = tvs.map(m => m.outid)

        for (let i = 0; i < row; ++i) {
            for (let j = 0; j < col; ++j) {
                const index = j + col * i;
                const tvdat = tvls[index] || {};
                const outid = tvdat.outid || null;
                const inids = tvdat.arrayinList || [];
                const orgid = tvs.length && tvs[index] && tvs[index].outid;

                const couts = vouts.reduce((t, m) => {
                    if(m.id == outid || !m.signal) t.push(m)
                    return t;
                }, [])

                cells.push(<CellView key={uuidv4()} index={index} id={origin && origin.id} outid={outid}
                    chnins={inids} chnouts={couts} choseouts={sel_outs} srcins={chnins} onCellChange={handleCellChange} />)
            }
        }
        return cells
    }, [data, tvls, vouts, origin])

    const triggerChange = (changedValue) => {
        if (onChange) {
            const cData = {
                ...data,
                ...value,
                ...changedValue,
            }
            onChange(cData);
        }
    };

    const handleRowChange = num => {
        if (Number.isNaN(data.row)) return
        if (num > 4) num = 4
        if (!('row' in value)) setData(o => ({ ...o, row: num }));
        triggerChange({ row: num });
    };

    const handleColChange = num => {
        if (Number.isNaN(data.col)) return
        if (data.row * num > 8) num = Math.floor(8 / data.row)
        if (!('col' in value)) setData(o => ({ ...o, col: num }));
        triggerChange({ col: num });
    };

    return (
        <Space direction='vertical' style={{ width: '100%' }}>
            {/* <LayoutForm /> */}
            <Space>
                <InputNumber disabled={disabled} min={0} max={4} defaultValue={data.row} value={data.row} onChange={handleRowChange} style={{ width: 100 }} />行
                <InputNumber disabled={disabled} min={0} max={8} defaultValue={data.col} value={data.col} onChange={handleColChange} style={{ width: 100 }} />列(最多4行，8个显示器)
            </Space>
            <div style={{ marginTop: 8, border: '1px solid #F0F0F0', borderRadius: 4, padding: 4, height: 300 }}>
                <div ref={ref} disabled={disabled} style={{
                    width: '100%', height: '100%', display: 'grid', gridGap: 1,
                    gridTemplateColumns: genFl(data.col || 0, false), gridTemplateRows: genFl(data.row || 0, true)
                }}>
                    {grids}
                </div>
            </div>
        </Space>
    );
}

const AttendConfig = props => {
    const [form] = Form.useForm();

    const [row, setRow] = useState()
    const [mode, setMode] = useState(0)
    const [isMod, setIsMod] = useState(false)

    const [selectedKey, setSelectedKey] = useState()
    const [checkedKeys, setCheckedKeys] = useState([])

    const dispatch = useDispatch();

    const vins = useSelector(({ mspsDev }) => mspsDev.vins)
    const _kvms = useSelector(({ mspsCfg }) => mspsCfg.kvm.kvms)

    useEffect(() => {
        dispatch({ type: '/msp/v2/kvm/query', payload: { offset: 0 } })
    }, [])

    const chnins = useMemo(() =>
        Object.values(vins).filter(m => !m.signal).
            map(m => ({ ...m, title: m.name, key: m.id })), [vins])

    const kvms = useMemo(() => {
        const ks = Object.values(_kvms).
            map(m => ({
                ...m, key: m.id, layout:
                    { row: m.row, col: m.col, menus: m.menus }
            }))
        return row ? [...ks, row] : ks
    }, [_kvms, row])

    const selectedKvm = useMemo(() => {
        const kvm = kvms.find(m => selectedKey == m.key)
        if (!kvm) return undefined;
        return kvm;
    }, [kvms, selectedKey])

    useEffect(() => {
        if (!selectedKvm) {
            setCheckedKeys([])
            return;
        }

        const { module, menu, row, col,
            arraytvList, arraysrcList } = selectedKvm;

        setMode(module)
        setCheckedKeys(arraysrcList)

        form.setFieldsValue({
            ...selectedKvm, mode: { module, menu },
            layout: { row, col, tvs: arraytvList || [] }
        });
    }, [selectedKvm])

    useEffect(() => {
        if (selectedKey !== 'tmp') setRow();
    }, [selectedKey])

    const handleSelect = (key) => {
        if (selectedKey == key) return;
        const select_item = key => {
            setSelectedKey(key)
            dispatch({ type: '/msp/v2/kvm/detail/query', payload: { id: key } })
        }
        isMod ? Modal.confirm({
            content: '当前配置未保存，是否先保存?',
            onOk() {
                handleSave()
                // select_item(key);
            },
            onCancel() {
                select_item(key)
                setIsMod(false)
            },
        }) : select_item(key)
    }

    const handleNew = () => {
        const newRow = {
            key: 'tmp', id: 'tmp', module: 0, name: '新坐席',
            arraytvList: [], arraysrcList: [],
            mode: { module: 0, menu: false },
            layout: { row: 0, col: 0, tvs: [] }
        }

        setRow(newRow)
        setCheckedKeys([])
        setSelectedKey('tmp')
        form.setFieldsValue(newRow)

        // console.log('-->', Object.values(vins).filter(m => !m.signal))
    }

    const handleSave = async () => {
        const row = await form.validateFields()
        const payload = { id: selectedKvm.id == 'tmp' ? undefined : selectedKvm.id }
        const { layout, mode } = row;
        payload.col = layout.col;
        payload.row = layout.row;
        payload.menu = mode.menu;
        payload.name = row.name;
        payload.module = mode.module;
        payload.arraytvList = layout.tvs;
        payload.arraysrcList = checkedKeys;
        dispatch({ type: '/msp/v2/kvm/config', payload })

        setRow()
        setIsMod(false)
        setSelectedKey()
        setTimeout(() => dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VOUT, forced: true } }), 200)
    }

    const handleDragStart = ({ event, node }) => {
        if (!node.checked) return false;

        const dt = event.dataTransfer
        dt.setData('chnin', node.id)
    }

    const handleValuesChange = (changedValues, allValues) => {
        const { module } = allValues.mode;
        if (mode != module) setMode(allValues.mode.module)
        setIsMod(true)
    }

    const formItemLayout = {
        labelCol: { span: 3 },
        wrapperCol: { span: 21 },
    };

    const checkLayout = (rule, value) => {
        // console.log('CheckLayout: ', value)
        if (value.col == 0 || value.row == 0) return Promise.reject('屏幕布局设置有误')
        if (!value.tvs.length) return Promise.reject('请设置输入输出通道')
        if (value.tvs.some(m => !m.arrayinList.length ? true : false)) return Promise.reject('请设置输入通道')
        if (value.tvs.some(m => m.outid == '' ? true : false)) return Promise.reject('请设置输出通道')

        return Promise.resolve()
    };

    const handleIcon = props => {
        const { id, isLeaf, expanded, data } = props
        if (id == 'loading') return <></>
        return <Svg_Round style={{ width: 20, height: 20,  fill: data.online ? '#53d81f' : '#999999' }} />
    }
    const handleCheckChnins = (checkedKeys) => {
        setCheckedKeys(checkedKeys)
    }

    function confirm(e) {
        if (selectedKey == 'tmp') setRow();
        else {
            dispatch({ type: '/msp/v2/kvm/delete', payload: { id: selectedKey } })
            setTimeout(() => dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VOUT, forced: true } }), 200)
        }
        setSelectedKey()
    }

    function cancel() {
    }

    return (
        <div className='attend_config' style={{ display: 'flex', height: '100%' }}>
            <div style={{
                width: 250, overflow: 'hidden',
                height: '100%', marginRight: 8, display: 'flex', flexDirection: 'column'
            }}>
                <List
                    header={<div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                        <div>坐席列表</div>
                        <Space>
                            <Button type='primary' size='small' onClick={handleNew}>新建</Button>
                            <Popconfirm
                                onConfirm={confirm}
                                onCancel={cancel}
                                title="是否确认此操作?"
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button size='small'>删除</Button>
                            </Popconfirm>
                        </Space>
                    </div>}
                    bordered
                    size='small'
                    style={{ flexGrow: 1 }}
                    dataSource={kvms}
                    renderItem={item => {
                        return (
                            <List.Item onClick={() => handleSelect(item.id)}
                                style={{
                                    background: selectedKey == item.id ? "#BAE7FF" : 'inherit',
                                    userSelect: 'none', display: 'flex', justifyContent: 'space-bettwen'
                                }}>
                                <Tooltip title={item.name}><div style={{
                                    width: 170, whiteSpace: 'nowrap',
                                    overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>{item.name}</div></Tooltip>
                                <div>{item.module ? '大屏' : '小屏'}</div>
                            </List.Item>
                        )
                    }}
                />
            </div>

            <div style={{ height: '100%', flexGrow: 1, border: '1px solid #D9D9D9', padding: 8, overflowY: 'auto' }}>
                <Form form={form} {...formItemLayout} onValuesChange={handleValuesChange} onFinish={handleSave} >
                    <Form.Item name="name" label="坐席名称" rules={[
                        { required: true, message: '请输入坐席名称' },
                        {
                            validator: (_, value) => {
                                const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                                if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                                let len = 0;
                                Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                                return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                            },
                        }
                    ]}>
                        <Input disabled={!selectedKey} style={{ width: 300 }} ></Input>
                    </Form.Item>
                    <Form.Item name="mode" label="坐席模式">
                        <ModeInput disabled={!selectedKey} />
                    </Form.Item>
                    <Form.Item label="屏幕布局" name='layout' rules={[
                        { required: true, message: '请配置布局信息' },
                        { validator: checkLayout }]}>
                        <LayoutInput disabled={!selectedKey} origin={selectedKvm} />
                    </Form.Item>

                    <Form.Item label="选择推送">
                        <TvModal disabled={!selectedKey || row} kvmid={selectedKey} style={{ marginRight: 10 }}>大屏推送</TvModal>
                        <KvmModal disabled={!selectedKey || row} kvmid={selectedKey} style={{ marginRight: 10 }}>坐席推送</KvmModal>
                        {!mode && <SwitchModal disabled={!selectedKey || row} kvmid={selectedKey} style={{ marginRight: 10 }}>切换配置</SwitchModal>}
                    </Form.Item>
                    <Form.Item label="信号源" rules={[{ required: true }]}>
                        <div style={{ maxHeight: 260, height: '100%', width: 400, border: '1px solid #F0F0F0', overflowY: 'scroll' }}>
                            {
                                selectedKey ? <Tree showIcon blockNode draggable
                                    treeData={chnins}
                                    checkable={true}
                                    checkedKeys={checkedKeys}
                                    selectedKeys={[]}
                                    icon={handleIcon}
                                    onCheck={handleCheckChnins}
                                    onDragStart={handleDragStart} /> : <Empty />
                            }
                        </div>
                    </Form.Item>

                    <Button type='primary' disabled={!selectedKey} style={{ position: 'absolute', top: 69, right: 20 }} htmlType='submit'>保存</Button>
                </Form>
            </div>
        </div>
    )
}

export default AttendConfig;