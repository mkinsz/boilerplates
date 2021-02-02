import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Tree, List, Button, Empty, Form, InputNumber } from 'antd';
import { Scene, View } from './scene';
import { v4 as uuidv4 } from 'uuid';
import { GSN } from '../../../public';

const TvModal = props => {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false)
    const [selectedKey, setSelectedKey] = useState()
    const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 })

    const dispatch = useDispatch();

    const pushs = useSelector(({ mspsCfg }) => mspsCfg.kvm.tvpush)
    const cells = useSelector(({ mspsScreenCfg }) => mspsScreenCfg.cells)
    const walls = useSelector(({ mspsScreenCfg }) => mspsScreenCfg.screen.walls)

    const [tvpushs, setTvpushs] = useState([])

    useEffect(() => {
        setTvpushs(pushs)
    }, [pushs])

    useEffect(() => {
        setTvpushs([])
        setRect({ x: 0, y: 0, w: 0, h: 0 })
        form.setFieldsValue({ x: 0, y: 0, w: 0, h: 0 })
    }, [visible])

    const tvs = useMemo(() => [...walls.values()].map(m => ({ title: m.name, key: m.id, ...m })), [walls])

    useEffect(() => {
        if (tvs.length) {
            const id = tvs[0].key
            setSelectedKey(id)
            dispatch({ type: '/msp/v2/tv/detail/query', payload: { id, serial: GSN.SCREENCFG } })
        }
    }, [tvs])

    const data = useMemo(() => {
        if (!cells.length) return { w: 0, h: 0, r: 0, rw: 0, rh: 0 };
        const { x: w, y: h } = cells.reduce(({ x = 0, y = 0 }, m) => {
            const r = m.startx + m.width
            const b = m.starty + m.hight
            return { x: x < r ? r : x, y: y < b ? b : y }
        }, 0)

        const x = 600; const y = 400;
        const radio = (x * h > y * w) ? y / h : x / w
        return { w: w * radio, h: h * radio, r: radio, rw: w, rh: h }
    }, [cells])

    useEffect(() => {
        const { r } = data;
        const index = tvpushs.findIndex(m => m.id == selectedKey);
        if (index > -1) {
            const m = tvpushs[index]
            form.setFieldsValue({
                x: m.startx,
                y: m.starty,
                w: m.width,
                h: m.height
            })
            setRect({ x: m.startx * r, y: m.starty * r, w: m.width * r, h: m.height * r })
        }
    }, [data, tvpushs, selectedKey])

    const handleClick = () => {
        setVisible(true)
        dispatch({ type: '/msp/v2/tv/query', payload: { serial: GSN.SCREENCFG } })
        dispatch({ type: '/msp/v2/kvm/tvpush/query', payload: { id: props.kvmid } })
    }

    const save2pushs = ({x, y, w, h}) => {
        const ntps = [...tvpushs]
        const index = ntps.findIndex(m => m.id == selectedKey)
        if (index > -1) {
            ntps[index].startx = x
            ntps[index].starty = y
            ntps[index].width = w
            ntps[index].height = h
        }else {
            if(w && h) ntps.push({id: selectedKey, startx: x, starty: y, width: w, height: h, subid: 0})
        }

        setTvpushs(ntps)
        return ntps;
    }

    const handleOk = async () => {
        const row = await form.validateFields()
        const ntps = save2pushs(row)

        dispatch({ type: '/msp/v2/kvm/push/config', payload: { id: props.kvmid, type: 2, dsts: ntps } })
        setVisible(false)
    }

    const handleCancel = () => {
        setVisible(false)
    }

    const handleSelect = async id => {
        setSelectedKey(id)  //must be first

        const row = await form.validateFields()
        save2pushs(row)

        setRect({ x: 0, y: 0, w: 0, h: 0 })
        form.setFieldsValue({ x: 0, y: 0, w: 0, h: 0 })

        dispatch({ type: '/msp/v2/tv/detail/query', payload: { id, serial: GSN.SCREENCFG } })
    }

    const handleValuesChange = (changedValues, allValues) => {
        const { x, y, w, h } = allValues;
        setRect({ x: x * data.r, y: y * data.r, w: w * data.r, h: h * data.r })
    }

    const handelClick = () => {
        setRect({ x: 0, y: 0, w: 0, h: 0 })
        form.setFieldsValue({ x: 0, y: 0, w: 0, h: 0 })
    }

    const handleRectChange = rect => {
        const { left, top, width, height } = rect;
        form.setFieldsValue({
            x: Math.round(left / data.r),
            y: Math.round(top / data.r),
            w: Math.round(width / data.r),
            h: Math.round(height / data.r),
        })
    }

    const sceneComponent = useMemo(() => <Scene w={data.w} h={data.h} data={cells} radio={data.r} onChange={handleRectChange}>
        <View key={uuidv4()} x={rect.x} y={rect.y} w={rect.w} h={rect.h}></View>
    </Scene>, [rect, data, cells])

    return <>
        <Button type='primary' disabled={props.disabled} style={props.style} onClick={handleClick}>{props.children}</Button>
        <Modal
            centered
            title="大屏推送"
            okText='确认'
            cancelText='取消'
            visible={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            maskClosable={false}
            style={{ minWidth: 800 }}
        >
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ width: 200, height: 460, overflow: 'auto', marginRight: 10 }}>
                    <List
                        header={'大屏列表'}
                        bordered
                        size='small'
                        style={{ height: '100%' }}
                        dataSource={tvs}
                        scroll={{ y: '67vh' }}
                        renderItem={m => <List.Item key={m.id} onClick={() => handleSelect(m.id)}
                            style={{ userSelect: 'none', background: selectedKey == m.id ? "#BAE7FF" : 'inherit' }}>
                            {m.name} </List.Item>
                        }
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                        width: 600, height: 400, display: 'flex',
                        justifyContent: 'center', alignItems: 'center',
                        boxSizing: 'content-box', border: '1px solid #F0F0F0'
                    }}>
                        {selectedKey ? sceneComponent : <Empty />}
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <Form
                            form={form}
                            layout='inline'
                            onValuesChange={handleValuesChange}
                            initialValues={{ x: 0, y: 0, w: 0, h: 0 }}
                        >
                            <Form.Item label="X" name='x'>
                                <InputNumber disabled={!selectedKey} min={0} max={data.rw - 100} placeholder="请输入大小" />
                            </Form.Item>
                            <Form.Item label="Y" name='y'>
                                <InputNumber min={0} max={data.rh - 100} placeholder="请输入大小" />
                            </Form.Item>
                            <Form.Item label="W" name='w'>
                                <InputNumber min={0} max={data.rw} placeholder="请输入大小" />
                            </Form.Item>
                            <Form.Item label="H" name='h'>
                                <InputNumber min={0} max={data.rh} placeholder="请输入大小" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" onClick={handelClick}>清除</Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </Modal>
    </>
}

export default TvModal;