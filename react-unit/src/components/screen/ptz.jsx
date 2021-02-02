import React, { useState, useEffect } from 'react'
import { Slider, Button, Space, Tooltip } from 'antd';
import './style/ptz.less'

import { ReactComponent as Ptz_T } from '@/assets/tv/ptz_t.svg'
import { ReactComponent as Ptz_R } from '@/assets/tv/ptz_r.svg'
import { ReactComponent as Ptz_B } from '@/assets/tv/ptz_b.svg'
import { ReactComponent as Ptz_L } from '@/assets/tv/ptz_l.svg'
import { ReactComponent as Return } from '@/assets/tv/return.svg'

import { ReactComponent as Tree_L } from '@/assets/tv/tree.svg'
import { ReactComponent as Tree_R } from '@/assets/tv/trees.svg'

import { ReactComponent as Focus_L } from '@/assets/tv/focus.svg'
import { ReactComponent as Focus_R } from '@/assets/tv/focuss.svg'

import { ReactComponent as Grab_L } from '@/assets/tv/grab.svg'
import { ReactComponent as Grab_R } from '@/assets/tv/grabs.svg'

import { ReactComponent as Walk } from '@/assets/tv/walk.svg'

import { ReactComponent as Outer_Circle } from '@/assets/tv/outer_circle.svg'
import { ReactComponent as Inner_Circle } from '@/assets/tv/inner_circle.svg'

import { PTZCODE } from '../public'
import { useDispatch } from 'react-redux';

export default props => {
    const [step, setStep] = useState(1);
    const [preset, setPreset] = useState(0);

    const { disabled, data, umtid } = props;

    const dispatch = useDispatch()

    const handleClick = opcode => {
        if (disabled) return;
        const { srcid: id } = data
        dispatch({ type: '/msp/v2/windows/ptz/config', payload: { id, code: PTZCODE[opcode], on: 1, param: step } })
    }

    const handlePreset = id => {
        setPreset(id)
    }

    const handleSave = () => {
        const { srcid: id } = data
        dispatch({ type: '/msp/v2/windows/ptz/config', payload: { id, code: PTZCODE['SETPRESET'], on: 1, param: preset } })
    }

    const handleLoad = () => {
        const { srcid: id } = data
        dispatch({ type: '/msp/v2/windows/ptz/config', payload: { id, code: PTZCODE['GOTOPRESET'], on: 1, param: preset } })
    }

    const presets = []
    for (let i = 0; i < 16; i++) {
        presets.push(<Button key={i} size='small' className='presetbtn' disabled={disabled}
            type={i == preset ? 'primary' : 'default'} onClick={() => handlePreset(i)} >{i + 1}</Button>)
    }

    const style = { fill: disabled ? '#BEBEBE' : '#4999FF' }

    return <div className='ptz_contain'>
        <div className='top_contain'>
            <div className='left_area'>
                <div className='outer_bak' />
                <div className='direction'>
                    <div />
                    <div className='left_btn' disabled={disabled} onClick={() => handleClick('MOVEUP')} ><Ptz_T style={style} /></div>
                    <div />
                    <div className='left_btn' disabled={disabled} onClick={() => handleClick('MOVELEFT')}><Ptz_L style={style} /></div>
                    <div className='left_btn' disabled={disabled}>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <div style={{ position: "absolute" }}>
                                <Inner_Circle className='inner_circle' />
                            </div>
                            <div className='inner_btn' disabled={disabled}
                                onClick={() => handleClick('MOVEAUTO')}
                                style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', position: "absolute"
                                }}>
                                <Tooltip title='恢复'><Return style={style} /></Tooltip>
                            </div>
                        </div>
                    </div>
                    <div className='left_btn' disabled={disabled} onClick={() => handleClick('MOVERIGHT')}><Ptz_R style={style} /></div>
                    <div />
                    <div className='left_btn' disabled={disabled} onClick={() => handleClick('MOVEDOWN')}><Ptz_B style={style} /></div>
                    <div />
                </div>
            </div>
            <div className='mid_area'>
                <Tooltip title='倍率变小'><div className='button' disabled={disabled} onClick={() => handleClick('ZOOMLARGER')}><Tree_L style={style} /></div></Tooltip>
                <Tooltip title='倍率变大'><div className='button' disabled={disabled} onClick={() => handleClick('ZOOMSMALL')}><Tree_R style={style} /></div></Tooltip>
                <Tooltip title='光圈-'><div className='button' disabled={disabled} onClick={() => handleClick('LIGHTLARGER')}><Grab_L style={style} /></div></Tooltip>
                <Tooltip title='光圈+'><div className='button' disabled={disabled} onClick={() => handleClick('LIGHTSMALL')}><Grab_R style={style} /></div></Tooltip>
                <Tooltip title='聚远'><div className='button' disabled={disabled} onClick={() => handleClick('FOCUSNEAR')}><Focus_L style={style} /></div></Tooltip>
                <Tooltip title='聚近'><div className='button' disabled={disabled} onClick={() => handleClick('FOCUSFAR')}><Focus_R style={style} /></div></Tooltip>
            </div>
            <div className='right_area'>
                <div className='right_head'>
                    <Tooltip title='步长'><Walk style={{ fontSize: 26 }} style={style} /></Tooltip>
                    {step}
                </div>
                <Slider vertical className='slider' disabled={disabled} marks={false}
                    min={1} max={64} step={1} value={step} onChange={v => setStep(v)} />
            </div>
        </div>
        <div className='bottom_contain' >
            预置位
            <div className='btn_grids'>{presets}</div>
            <Space style={{ marginTop: 10 }}>
                <Button size='small' disabled={disabled} onClick={handleSave}>保存</Button>
                <Button size='small' disabled={disabled} onClick={handleLoad}>载入</Button>
            </Space>
        </div>
    </div>
}