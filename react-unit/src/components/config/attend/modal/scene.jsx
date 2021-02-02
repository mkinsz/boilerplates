import React, { useState, useEffect, useRef, useCallback } from 'react';

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

const MARGIN = 10
const NEAR = 6

const toPx = p => `${p}px`;
const isset = (o) => ('undefined' !== typeof o);

export const View = props => {
    const [cursor, setCursor] = useState(RESIZE.m);
    const [pressed, setPressed] = useState(false)
    const [moveable, setMoveable] = useState(true)

    useEffect(() => {
        isset(props.moveable) && setMoveable(props.moveable)
    }, [])

    const handleMouseMove = e => {
        if (pressed || !moveable) return true;
        // e.stopPropagation()
        // e.preventDefault()
        const { offsetX: x, offsetY: y } = e.nativeEvent;
        const {
            offsetLeft: ol,
            offsetTop: ot,
            offsetWidth: ow,
            offsetHeight: oh
        } = e.target;

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
        setPressed(true)
    }

    const handleMouseUp = e => {
        setPressed(false)
    }

    const style = {
        left: props.x, top: props.y, width: props.w, height: props.h, cursor: cursor,
        position: 'absolute', opacity: props.opacity ? props.opacity : 1,
        zIndex: 0, border: '1px solid red', boxSizing: 'border-box'
    };

    return <div id='view' className={moveable ? 'box' : 'cell'}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        // onMouseLeave={handleMouseLeave}
        style={style}>
    </div>
}

const tonum = (n) => parseFloat(n);

export const Scene = props => {
    const [pos, setPos] = useState()
    const [current, setCurrent] = useState()
    const [xys, setXys] = useState({ xs: [], ys: [] });
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [geo, setGeo] = useState()
    const cref = useRef();
    const ref = useRef();

    const getOffsetTop = obj => {
        if (!obj) return 0;
        let tmp = obj.offsetTop;
        let val = obj.offsetParent;
        while (val) {
            tmp += val.offsetTop;
            val = val.offsetParent;
        }
        return tmp;
    }
    const getOffsetLeft = obj => {
        if (!obj) return 0;
        let tmp = obj.offsetLeft;
        let val = obj.offsetParent;
        while (val) {
            tmp += val.offsetLeft;
            val = val.offsetParent;
        }
        return tmp;
    }

    useEffect(() => {
        const { data, radio } = props;
        const xs = [...new Set(data.map(m => m.startx * radio).concat(data.map(m => (m.startx + m.width) * radio)))]
        const ys = [...new Set(data.map(m => m.starty * radio).concat(data.map(m => (m.starty + m.hight) * radio)))]
        setXys({ xs, ys })
    }, [props.data, props.radio])

    useEffect(() => {
        const canvas = cref.current;
        const gw = canvas.width;
        const gh = canvas.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, gw, gh);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'lightgray';

        ctx.beginPath();
        xys.xs.map(m => {
            m = Math.round(m)
            // console.log('X: ', m)
            ctx.moveTo(m, 0);
            ctx.lineTo(m, gh);
            ctx.stroke();
        })
        xys.ys.map(m => {
            m = Math.round(m)
            // console.log('Y: ', m)
            ctx.moveTo(0, m);
            ctx.lineTo(gw, m);
            ctx.stroke();
        })
        ctx.closePath()
    }, [xys])

    useEffect(() => {
        if (!current) return;
        current.style.zIndex = 100;
        const l = tonum(current.style.left);
        const t = tonum(current.style.top);
        const w = tonum(current.style.width);
        const h = tonum(current.style.height);
        setGeo({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h })
    }, [current])

    const handleMouseDown = e => {
        e.preventDefault();
        e.stopPropagation();

        const x = getOffsetLeft(ref.current)
        const y = getOffsetTop(ref.current)

        setOffset({ x, y })
        setPos({ x: e.clientX - x, y: e.clientY - y })
        e.target.className == 'box' && setCurrent(e.target)
    };

    const handleMouseUp = e => {
        e.preventDefault();
        e.stopPropagation();

        setPos()
        setCurrent()
        current && (current.style.zIndex = 0)
    };

    const handleMouseMove = e => {
        if (!pos) return true;
        e.preventDefault();
        e.stopPropagation();

        const offsetX = e.clientX - offset.x;
        const offsetY = e.clientY - offset.y;
        const diffX = offsetX - pos.x;
        const diffY = offsetY - pos.y;

        if (!current) {
            const view = document.getElementById('view')
            const rect = {
                left: pos.x, top: pos.y,
                width: diffX, height: diffY,
                right: pos.x + diffX, bottom: pos.y + diffY
            }
            handleResize(rect)
            handleEnd(view, rect)
        } else {
            const rect = { ...geo }
            switch (current.style.cursor) {
                case RESIZE.l:
                case RESIZE.bl:
                case RESIZE.tl:
                    rect.left += diffX;
                    rect.width -= diffX;
                    break;
                case RESIZE.r:
                case RESIZE.br:
                case RESIZE.tr:
                    rect.width += diffX;
                    break;
                case RESIZE.m:
                    rect.left += diffX;
                    break;
            }

            switch (current.style.cursor) {
                case RESIZE.t:
                case RESIZE.tl:
                case RESIZE.tr:
                    rect.top += diffY;
                    rect.height -= diffY;
                    break;
                case RESIZE.b:
                case RESIZE.bl:
                case RESIZE.br:
                    rect.height += diffY
                    break;
                case RESIZE.m:
                    rect.top += diffY;
                    break;
            }
            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;

            RESIZE.m == current.style.cursor ?
                handleMove(rect) : handleResize(rect)
            handleEnd(current, rect)
        }
    };

    const handleMouseLeave = e => {
        handleMouseUp(e)
    }

    const handleMove = rect => {
        xys.xs.some(m => (Math.abs(m - rect.left) < NEAR) && (rect.left = m))
        xys.xs.some(m => (Math.abs(m - rect.right) < NEAR) && (rect.left = m - rect.width))
        xys.ys.some(m => (Math.abs(m - rect.top) < NEAR) && (rect.top = m))
        xys.ys.some(m => (Math.abs(m - rect.bottom) < NEAR) && (rect.top = m - rect.height))
    }

    const handleResize = rect => {
        xys.xs.some(m => (Math.abs(m - rect.left) < NEAR) && (rect.left = m, rect.width = rect.right - m))
        xys.xs.some(m => (Math.abs(m - rect.right) < NEAR) && (rect.right = m, rect.width = m - rect.left))
        xys.ys.some(m => (Math.abs(m - rect.top) < NEAR) && (rect.top = m, rect.height = rect.bottom - m))
        xys.ys.some(m => (Math.abs(m - rect.bottom) < NEAR) && (rect.bottom = m, rect.height = m - rect.top))
    }

    const handleEnd = (current, rect) => {
        current.style.top = toPx(rect.top);
        current.style.left = toPx(rect.left);
        current.style.width = toPx(rect.width);
        current.style.height = toPx(rect.height);
        current.style.bottom = 'auto'
        current.style.right = 'auto'
        props.onChange(rect)
    }

    const style = {
        width: props.w,
        height: props.h,
        background: '#F5F8FA',
        border: '0px solid lightgray',
        position: 'relative',
        boxShadow: '4px 4px 8px rgba(0,0,0,0.5)',
        overflow: 'hidden', boxSizing: 'content-box'
    };

    return (
        <div style={style} ref={ref}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}>
            <canvas ref={cref} width={props.w} height={props.h} />
            {props.children}
        </div>
    );
}