import React, { useEffect, useMemo, useState, useRef } from 'react';
import { CloseOutlined, LockOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux';

import Video from './video'

import { ReactComponent as VoiceOpen} from '@/assets/tv/voiceopen.svg'
import { ReactComponent as VoiceClose } from '@/assets/tv/voiceclose.svg'

const RESIZE = {
    m: 'default',
    l: 'w-resize',
    r: 'e-resize',
    t: 'n-resize',
    b: 's-resize',
    tl: 'nw-resize',
    tr: 'ne-resize',
    br: 'se-resize',
    bl: 'sw-resize'
};

const MARGIN = 12

const toPx = p => `${p}px`;
const toNum = (n) => parseFloat(n);

const View = props => {
    const [cursor, setCursor] = useState(RESIZE.m);
    const [pressed, setPressed] = useState(false)
    const [muted, setMuted] = useState(false)

    const ref = useRef();
    const dispatch = useDispatch()
    const { data, polled, locked, glocked, gsize } = props;

    useEffect(() => {
        setMuted(data.audio)
    }, [data])

    const handleMouseMove = e => {
        if (locked || glocked || e.target.className != 'view') return;

        const { offsetX: x, offsetY: y } = e.nativeEvent;
        const {
            offsetLeft: ol,
            offsetTop: ot,
            offsetWidth: ow,
            offsetHeight: oh
        } = ref.current;

        if (x < MARGIN && y > MARGIN && y < oh - MARGIN)
            setCursor(RESIZE.l);
        else if (x > ow - MARGIN && y > MARGIN && y < oh - MARGIN)
            setCursor(RESIZE.r);
        else if (y < MARGIN && x > MARGIN && x < ow - MARGIN)
            setCursor(RESIZE.t);
        else if (y > oh - MARGIN && x > MARGIN && x < ow - MARGIN)
            setCursor(RESIZE.b);
        else if (x < MARGIN && y < MARGIN) setCursor(RESIZE.tl);
        else if (x > ow - MARGIN && y < MARGIN) setCursor(RESIZE.tr);
        else if (x < MARGIN && y > oh - MARGIN) setCursor(RESIZE.bl);
        else if (x > ow - MARGIN && y > oh - MARGIN) setCursor(RESIZE.br);
        else setCursor(RESIZE.m);
    }

    const handleMouseDown = e => {
        if (glocked) return;
        setPressed(true)
    }

    const handleMouseUp = e => {
        if (glocked) return;
        locked && e.stopPropagation();

        setPressed(false)
    }

    const handleDoubleClick = e => {
        if (glocked) return;
        locked && e.stopPropagation();
    }

    const handleClose = e => {
        if (locked || glocked) return;

        const { id, sceneid, tvid } = data;
        dispatch({ type: '/msp/v2/windows/close/config', payload: { id, sceneid, tvid } })

        e.stopPropagation();
        return false;
    }

    const handleDragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleAudioClick = e => {
        e.preventDefault();
        e.stopPropagation();
        
        if (locked || glocked) return false;

        setMuted(!muted)
        const { id, sceneid, tvid } = data;
        dispatch({ type: '/msp/v2/windows/audio/config', payload: { id, sceneid, tvid, audio: !muted } })
    }

    return <div {...props} ref={ref}
        style={{
            position: 'absolute', left: data.layout.l * gsize.r, top: data.layout.t * gsize.r,
            width: data.layout.w * gsize.r, height: data.layout.h * gsize.r,
            fontSize: 14, userSelect: 'none', overflow: 'hidden', cursor: cursor,
            backgroundColor: !polled ? 'beige' : 'lightcyan', textOverflow: 'ellipsis',
            zIndex: pressed ? 100 : data.layer, border: '1px solid #4A9AFF77', boxSizing: 'border-box',
        }}
        className='view'
        draggable={false}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
    >
        {/* {data.gbid && <Video chnid={data.gbid} />} */}
        <div style={{
            width: '100%', height: '100%', display: 'flex', 
            flexDirection: 'column', pointerEvents: 'none',
            position: 'absolute', zIndex: 1, color: '#96999C', userSelect: 'none'
        }}>
            <div style={{
                height: 30, width: '100%', display: 'flex', alignItems: 'center',
                backgroundColor: props.selected ? '#409EFF' : 'transparent',
                color: props.selected ? 'white' : '#96999C',
            }} >
                <div style={{
                    overflow: 'hidden', whiteSpace: 'nowrap',
                    userSelect: 'none', margin: '0 5px', textOverflow: 'ellipsis'
                }}>{!!locked && <LockOutlined />} {props.name || props.title}</div>
                {(props.selected) && <div className='view-btn' style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'auto', width: 24, height: 18, backgroundColor: '#3080CE'
                }} onMouseDown={handleAudioClick}>{muted ?
                    <VoiceOpen style={{ width: 12, height: 12, fill: 'white', pointerEvents: 'none' }} /> :
                    <VoiceClose style={{ width: 12, height: 12, fill: 'white', pointerEvents: 'none' }} />}
                </div>}
                <div style={{ flexGrow: 1 }} />
                {(props.selected) && <CloseOutlined onMouseDown={handleClose}
                    style={{ fontSize: 14, marginRight: 6, pointerEvents: 'auto', cursor: 'pointer' }} />}
            </div>
            <div style={{ flexGrow: 1, textAlign: 'center', }}>{polled ? '轮巡中...' : null}</div>
        </div>
    </div>
}

export { View as default, RESIZE };