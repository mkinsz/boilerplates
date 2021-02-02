import React, { useRef, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import '@/assets/js/kmedia.js'

const config = (dom, url, cid, mediaid) => ({
    selector: dom,
    mediaUrl: './static/demo.mp4',
    mediaType: 'video',
    playType: 'liveStreaming',
    realtime: 'av',
    theme: 'all',
    hideControlsBar: true,
    videoFit: 'cover',
    loading: 'rotate',
    // tools: ['requestFullscreen'],
    mediaInfo: {
        file: {},
        liveStreaming: {
            websocketUrl: url,
            devId: cid,
            nmediaId: mediaid,
        }
    }
})

const Video = props => {
    const ref = useRef()

    useEffect(() => {
        if (!props.cid) return;

        KMedia.scenario(4)
        let kmedia = new KMedia(config(ref.current, props.url, props.cid, props.mediaid))
        kmedia.error(() => kmedia = null)
        return () => {
            if (kmedia) kmedia.stop();
            kmedia = null;
        }
    }, [props.cid])

    return <div ref={ref}
        style={{
            ...props.style, height: '100%', width: '100%',
            position: 'absolute', pointerEvents: 'none'
        }} />
}

Video.propTypes = {
    url: PropTypes.string.isRequired,
    // cid: PropTypes.string.isRequired,
    // onClose: PropTypes.func.isRequired
}

export default Video;