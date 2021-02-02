import React, { useState, useRef, useMemo } from 'react'
import {
    CloseOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons'
import { Space, Tooltip } from 'antd'
import './style/gallery.less'

import Video from './video'

import { ReactComponent as VoiceOpen} from '@/assets/tv/voiceopen.svg'
import { ReactComponent as VoiceClose } from '@/assets/tv/voiceclose.svg'
import { useDispatch, useSelector } from 'react-redux'

// const surl = 'ws://xx.xx.xx.xx:port?id=gbid&mediaid=xx'
// surl.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
//     console.log('====>', key, value)
// })

const Thumb = props => {
    const [data, setData] = useState()
    const [hovered, setHovered] = useState(false)
    const [mute, setMute] = useState(false)
    const [fulled, setFulled] = useState(false)

    const ref = useRef();

    const dispatch = useDispatch();

    const chnmap = useSelector(({ mspsSch }) => mspsSch.chnmap)

    const live = useMemo(() => {
        if (!data || !Object.keys(chnmap).length) return;

        const chn = chnmap[data.chnid]
        if (chn) {
            const url = chn.url;
            const pam = {}
            const info = url.split('?')
            url.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => pam[key] = value)
            return { url: info[0], gbid: pam.id, mediaid: pam.mediaid }
        }
    }, [chnmap, data])

    const handleDrag = e => {
        e.preventDefault();
        e.stopPropagation();
    }

    const handleDragStart = e => {
        if (!data) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const dt = e.dataTransfer;
        dt.setData('from', 'gallery')
        dt.setData('gbid', data.gbid);
        dt.setData('chnid', data.chnid);
        dt.setData('title', data.title);
    }

    const handleDragEnd = e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    const handleDragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        const dt = e.dataTransfer;
        const from = dt.getData('from');
        if (from == 'gallery') return true;

        const gbid = dt.getData('gbid');
        const title = dt.getData('title');
        const chnid = dt.getData('chnid');

        if (data && chnid == data.chnid) return false;

        setData({ title, gbid, chnid })
        dispatch({ type: '/msp/v2/windows/live/start/config', payload: { id: chnid } })
    };

    const handleMouseEnter = e => {
        setHovered(true)
        return true;
    }

    const handleMouseLeave = e => {
        setHovered(false)
        return true;
    }

    const handleClose = e => {
        live && dispatch({ type: '/msp/v2/windows/live/stop/config', payload: { id: data.chnid } })
        setData()
    }

    const handleScreenfull = () => {
        setFulled(fullScreen(ref.current))
    }

    const style = {
        fontSize: 14, minWidth: 260, minHeight: 144,
        backgroundColor: data ? 'beige' : 'transparent',
        position: 'relative', border: '1px dashed #D9D9D9'
    }

    const fullScreen = el => {
        var isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
        if (!isFullscreen) { //进入全屏,多重短路表达式
            (el.requestFullscreen && el.requestFullscreen()) ||
                (el.mozRequestFullScreen && el.mozRequestFullScreen()) ||
                (el.webkitRequestFullscreen && el.webkitRequestFullscreen()) || (el.msRequestFullscreen && el.msRequestFullscreen());
            return true;
        } else { //退出全屏,三目运算符
            document.exitFullscreen ? document.exitFullscreen() :
                document.mozCancelFullScreen ? document.mozCancelFullScreen() :
                    document.webkitExitFullscreen ? document.webkitExitFullscreen() : '';
            return false;
        }
    }

    const isFullScreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;

    const handleAudioClick = e => {
        e.preventDefault();
        e.stopPropagation();
        setMute(!mute)
    }

    return <div {...props} ref={ref} className={`gallery_view`} draggable style={{ ...style, ...props.style }}
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
    // onMouseEnter={handleMouseEnter}
    // onMouseLeave={handleMouseLeave}
    >
        {live && <Video url={live.url} cid={live.gbid} mediaid={live.mediaid} muted={mute} />}
        {!data && <div style={{
            textAlign: 'center', fontSize: 20, color: '#D9D9D9',
            position: 'absolute', margin: '60px 0', width: '100%'
        }}>{props.index}</div>}

        {data && <div style={{
            alignItems: 'center', fontSize: 14, color: 'white',
            height: 20, width: '100%', display: 'flex', zIndex: 1,
            position: 'absolute', backgroundColor: 'rgba(0,0,0,0.4)',
        }} >
            <div style={{
                margin: '0 5px', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', overflow: 'hidden'
            }}>{data.title}</div>

            <div onClick={handleAudioClick}>{mute ?
                <VoiceClose style={{ width: 12, height: 12, fill: 'white' }} /> :
                <VoiceOpen style={{ width: 12, height: 12, fill: 'white' }} />}
            </div>

            <div style={{ flexGrow: 1 }} />
            {data && <Space>
                <Tooltip title={isFullScreen ? '恢复' : '最大化'}>
                    {!isFullScreen ? <FullscreenOutlined onClick={handleScreenfull} /> : <FullscreenExitOutlined onClick={handleScreenfull} />}
                </Tooltip>
                <CloseOutlined style={{ marginRight: 3 }} onClick={handleClose} />
            </Space>
            }
        </div>}
    </div>
}

export default props => {
    const ref = useRef();
    const [pressed, setPressed] = useState(false)

    const thumbnails = React.useMemo(() => {
        const boxes = []
        for (let i = 0; i < props.size; ++i) {
            const ps = { key: i, index: i + 1, style: {} }
            if (i != props.size - 1) ps.style.marginRight = props.space
            boxes.push(React.createElement(Thumb, ps))
        }
        return boxes
    })

    const handleWheel = e => {
        ref.current.scrollLeft += e.deltaY
    }

    // const handleMouseUp = e => {
    //     setPressed(false)
    // }

    // const handleMouseDown = e => {
    //     setPressed(true)
    // }

    // const handleMouseMove = e => {
    //     if (!pressed) return false;
    //     ref.current.scrollLeft -= e.movementX
    // }

    // const handleMouseLeave = e => {
    //     setPressed(false)
    // }

    return <div ref={ref} style={props.style}
        className='gallery'
        onWheel={handleWheel}
        // onMouseUp={handleMouseUp}
        // onMouseDown={handleMouseDown}
        // onMouseMove={handleMouseMove}
        // onMouseLeave={handleMouseLeave}
        >
        {thumbnails}
    </div>
}