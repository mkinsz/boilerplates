import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Slider, InputNumber, Space, Tooltip, Form, Collapse, Switch, Checkbox } from 'antd';

import Ptz from './ptz';
import useActions from './public/actions';
import ChnsPollModal from './modal/channelmodal'

import { ReactComponent as Svg_Top } from '@/assets/tv/top.svg'
import { ReactComponent as Svg_Bottom } from '@/assets/tv/bottom.svg'
import { ReactComponent as Svg_Up } from '@/assets/tv/up.svg'
import { ReactComponent as Svg_Down } from '@/assets/tv/down.svg'

import './style/sidebar.less'

const TYPEZ = {
    TOP: 0,
    END: 1,
    UP: 2,
    DOWN: 3
}

const { Panel } = Collapse;

const Divider = () => <div style={{ height: 1, backgroundColor: '#F0F0F0', margin: 0 }} />

const PositionForm = props => {
    const [changed, setChanged] = useState(false)
    const [checked, setChecked] = useState(false)

    const { disabled, values } = props;
    const [form] = Form.useForm();

    useEffect(() => {
        setChanged(false)

        if (!values) return;
        const obj = {}
        for (let i in values)
            obj[i] = values[i]
        form.setFieldsValue(obj)
        setChecked(values.iscut)
    }, [values])

    const handleResetValues = () => {
        if (!values) return;
        const { x, y, w, h } = values;
        form.setFieldsValue({ 'x': x, 'y': y, 'w': w, 'h': h })

        setChanged(false)
        props.onValuesChange(x, y, w, h)
    }

    const handleValuesChange = (changedValues, allValues) => {
        setChanged(true)

        if (allValues.iscut != checked) setChecked(!checked)

        const { x, y, w, h } = allValues;
        props.onValuesChange(x, y, w, h)
    }

    const handleFinish = values => {
        const { x, y, w, h, iscut, cx, cy, cw, ch } = values
        props.onSubmit({ x, y, w, h }, iscut, { x: cx, y: cy, w: cw, h: ch })
    }

    return <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Form form={form} labelAlign='right' onFinish={handleFinish} onValuesChange={handleValuesChange} >
            <div style={{
                display: 'grid', gridTemplateColumns: 'auto auto', gridTemplateRows: '40px 40px', gridGap: 10
            }}>
                <Form.Item label='X ' name='x' labelCol={{ span: 7, offset: 0 }} rules={[{ required: true, },]} style={{ gridArea: '1 / 1 / span 1 / span 1', height: 30 }}>
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled} min={0} max={props.size && (props.size.w - 100)} /></Form.Item>
                <Form.Item label='Y ' name='y' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} rules={[{ required: true, },]} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled} min={0} max={props.size && (props.size.h - 100)} /></Form.Item>
                <Form.Item label='W' name='w' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} rules={[{ required: true, },]} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled} min={1} max={props.size && props.size.w} /></Form.Item>
                <Form.Item label='H' name='h' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} rules={[{ required: true, },]} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled} min={1} max={props.size && props.size.h} /></Form.Item>
            </div>
            <Form.Item name="iscut" valuePropName="checked" style={{ height: 20 }} >
                <Checkbox disabled={disabled}>是否裁剪</Checkbox>
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gridTemplateRows: '40px 40px', gridGap: 10 }}>
                <Form.Item label='X ' name='cx' labelCol={{ span: 7, offset: 0 }} style={{ gridArea: '1 / 1 / span 1 / span 1', height: 30 }}>
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled || !checked} min={0} max={values.w} /></Form.Item>
                <Form.Item label='Y ' name='cy' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled || !checked} min={0} max={values.h} /></Form.Item>
                <Form.Item label='W' name='cw' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled || !checked} min={1} max={values.w} /></Form.Item>
                <Form.Item label='H' name='ch' labelCol={{ span: 7, offset: 0 }} style={{ height: 30 }} >
                    <InputNumber style={{ width: 'inherit', height: 30 }} formatter={v => v.replace(/[^\d]/g, '')}
                        disabled={disabled || !checked} min={1} max={values.h} /></Form.Item>
            </div>

            <div className='row_layout'>
                <div />
                <Space style={{ marginTop: 10 }}>
                    <Button type="primary" disabled={disabled || !changed || !form.isFieldsTouched(false) ||
                        form.getFieldsError().filter(({ errors }) => errors.length).length} onClick={handleResetValues}>取消</Button>
                    <Button type="primary" disabled={disabled || !changed || !form.isFieldsTouched(false) ||
                        form.getFieldsError().filter(({ errors }) => errors.length).length} htmlType="submit">确定</Button>
                </Space>
            </div>
        </Form>
    </div>

}

PositionForm.defaultProps = {
    values: {}
}

const SiderBar = props => {
    const [vchn, setVchn] = useState(false)
    const [audio, setAudio] = useState(false)
    const [locked, setLocked] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const [isPolled, setIsPolled] = useState(false)
    const [fulled, setFulled] = useState(false)

    const { data, isFull, index } = props;

    const actions = useActions();
    const dispatch = useDispatch();

    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.umts)
    const pollstate = useSelector(({ mspsSch }) => mspsSch.poll.state)

    const umtid = useMemo(() => {
        const umts = Object.values(nets).filter(m => m.type === 2)
        if (!umts.length) return undefined;
        return umts[0].id
    })

    useEffect(() => {
        setDisabled(props.disabled)
    }, [props.disabled])

    useEffect(() => {
        setFulled(isFull)
    }, [index, isFull])

    useEffect(() => {
        setAudio(data.audio)
        setIsPolled(!!data.polled)
    }, [data])

    useEffect(() => {
        setLocked(data ? props.lockKeys.find(n => n == data.id) : false)
    }, [data, props.lockKeys])

    useEffect(() => {
        setDisabled(!index || pollstate.state)
    }, [index, pollstate])

    const layout = useMemo(() => {
        if (data.layout) {
            const { layout, iscut, cut } = data;
            if (cut) {
                const { x: cx, y: cy, w: cw, h: ch } = cut;
                return { ...layout, iscut, cx, cy, cw, ch }
            } else {
                return { ...layout, iscut, cx: 0, cy: 0, cw: 0, ch: 0 }
            }
        }
        return {}
    }, [data])

    const handleZClick = order => {
        if (!index) return;
        const { id, sceneid, tvid, layer } = data
        dispatch({ type: '/msp/v2/windows/reorder/config', payload: { id, sceneid, tvid, order, layer } })
    }

    const handleAudioClick = checked => {
        if (!index) return;
        setAudio(!audio)
        const { id, sceneid, tvid } = data
        dispatch({ type: '/msp/v2/windows/audio/config', payload: { id, tvid, sceneid, audio: !audio } })
    }

    const handleOpPoll = () => {
        setIsPolled(!isPolled)
        if (!index) return;
        const { id, sceneid, tvid, polled } = data
        dispatch({
            type: isPolled ?
                '/msp/v2/windows/poll/stop/config' :
                '/msp/v2/windows/poll/start/config',
            payload: { id, sceneid, tvid }
        })
    }

    const handleOpPolledInside = () => setIsPolled(true)

    const handleSubmit = (layout, iscut, cut) => {
        const { id, sceneid, tvid, srcid } = data;
        actions.windows_open_config(tvid, sceneid, srcid, layout, id, iscut, cut)
    }

    const handleFullClick = id => {
        props.onFullScreen(id)
        setFulled(!fulled);
    }

    return <div className='side_container'>
        <div className='side_title_area'>{data ? data.title || data.name : ' '}</div>
        <div className='side_content_area'>
            <Collapse
                ghost
                bordered={false}
                defaultActiveKey={[1, 2]}
                expandIconPosition='right'
                className="site-collapse-custom-collapse"
            >
                <Panel header="基本功能" key={1} className="site-collapse-custom-panel">
                    <Space direction='vertical' size={10} style={{ width: '100%' }}>
                        <div className='row_layout'>音频管理
                            <Switch disabled={disabled} checked={data && data.audio} checkedChildren="ON" unCheckedChildren="OFF" onClick={handleAudioClick} />
                        </div>
                        {/* <div className='row_layout'>
                            <Slider value={avalue} disabled onChange={handleSliderChange} style={{ width: 210 }} />
                            <InputNumber value={avalue} disabled min={0} max={100} onChange={handleSliderChange} style={{ width: 60, height: 30 }} />
                        </div> */}
                        <Divider />
                        <div className='row_layout'>锁定位置
                            <Switch disabled={disabled} checked={locked} checkedChildren="ON" unCheckedChildren="OFF"
                                onClick={() => { setLocked(!locked); props.onLockChange(data.id, !locked) }} />
                        </div>
                        <Divider />
                        <div className='row_layout'>全屏/恢复
                            <Button type="primary" disabled={disabled || locked} onClick={() => handleFullClick(data.id)}>{fulled ? '恢复' : '全屏'}</Button>
                        </div>
                        <Divider />
                        <div className='row_layout'>缩放到单屏
                            <Button type="primary" disabled={disabled || locked} onClick={() => props.onShrink(data.id, true)}>确定</Button>
                        </div>
                        <Divider />
                        <div className='row_layout'>缩放到所占屏
                            <Button type="primary" disabled={disabled || locked} onClick={() => props.onShrink(data.id, false)}>确定</Button>
                        </div>
                        <Divider />
                        <div className='row_layout'>
                            <Tooltip title='置顶'><Button type="primary" disabled={disabled || locked} onClick={() => handleZClick(TYPEZ.TOP)} ><Svg_Top /></Button></Tooltip>
                            <Tooltip title='置底'><Button type="primary" disabled={disabled || locked} onClick={() => handleZClick(TYPEZ.END)} ><Svg_Bottom /></Button></Tooltip>
                            <Tooltip title='上移'><Button type="primary" disabled={disabled || locked} onClick={() => handleZClick(TYPEZ.UP)} ><Svg_Up /></Button></Tooltip>
                            <Tooltip title='下移'><Button type="primary" disabled={disabled || locked} onClick={() => handleZClick(TYPEZ.DOWN)} ><Svg_Down /></Button></Tooltip>
                        </div>

                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>通道轮巡
                            <Space>
                                <Button type="primary" disabled={disabled || locked} onClick={() => setVchn(true)}>配置</Button>
                                <Button type="primary" disabled={disabled || locked} onClick={handleOpPoll}>{isPolled ? '关闭' : '开启'}</Button>
                            </Space>
                        </div>
                    </Space>
                </Panel>
                <Panel header='通用属性' key={2} className="site-collapse-custom-panel" >
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0px 5px 10px 5px' }}>
                        <div>{`窗口ID: ${data.id || ''}`}</div>
                        <div>{`通道ID: ${data.srcid || ''}`}</div>
                    </div>
                    <PositionForm disabled={disabled || locked} values={layout} size={props.winSize} onSubmit={handleSubmit}
                        onValuesChange={(l, t, w, h) => props.onMove(data.id, l, t, w, h)} />
                </Panel>
                <Panel header='云台PTZ' key={3} className="site-collapse-custom-panel">
                    <Ptz data={data} umtid={umtid} disabled={disabled || locked} />
                </Panel>
            </Collapse>
        </div>
        {vchn && <ChnsPollModal visible={vchn} wdata={data} onCancel={() => setVchn(false)} onConfirm={() => setVchn(false)} onPolledStart={handleOpPolledInside} />}
    </div>
}

export default SiderBar;