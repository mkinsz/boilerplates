import React, { forwardRef, useMemo, useState, useLayoutEffect, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';

import './style/window.less'

import View from './view'
import Scene from './scene'
import Layout from './layout'

import { RESIZE } from './view';
import useActions from './public/actions';
import { useComponentResize } from '../public';
import { magnet, boom, shrink2single, shrink2own } from './public'

const tvs = {
    1: { row: 1, col: 2 },
    2: { row: 2, col: 2 },
    3: { row: 3, col: 3 },
    4: { row: 4, col: 4 },
    5: { row: 5, col: 5 },
    6: { row: 6, col: 6 },
    7: { row: 7, col: 7 },
    8: { row: 8, col: 8 },
    9: { row: 9, col: 9 },
    10: { row: 10, col: 10 },
    11: { row: 3, col: 6, count: 5, unite: [[1, 1, 2, 3], [1, 4, 2, 3], [3, 1, 1, 2], [3, 3, 1, 2], [3, 5, 1, 2]] },
    12: { row: 3, col: 3, count: 6, unite: [[1, 1, 2, 2]] },
    13: { row: 3, col: 4, count: 7, unite: [[1, 1, 2, 3]] },
    14: { row: 4, col: 4, count: 8, unite: [[1, 1, 3, 3]] },
    15: { row: 5, col: 5, count: 10, unite: [[1, 1, 4, 4]] },
    16: { row: 6, col: 6, count: 12, unite: [[1, 1, 5, 5]] },
    17: { row: 7, col: 7, count: 14, unite: [[1, 1, 6, 6]] },
}

const Window = React.forwardRef((props, ref) => {
    const [data, setData] = useState({})
    const [pos, setPos] = useState()
    const [current, setCurrent] = useState()
    const [selected, setSelected] = useState()

    const voutchns = useSelector(({ mspsDev }) => mspsDev.vouts)
    const sglobal = useSelector(({ mspsSch }) => mspsSch.sglobal)
    const cells = useSelector(({ mspsScreenCfg }) => mspsScreenCfg.cells)

    const actions = useActions();

    const lref = React.useRef();
    const rref = React.useRef();
    const observer = useComponentResize(lref);
    React.useImperativeHandle(ref, () => ({
        isfull: id => handleIsFull(id),
        shrink2own: id => handleShrink2Own(id),
        shrink2single: id => handleShrink2Single(id),
        fullscreen: id => handleViewFullScreen(id),
        move: (id, l, t, w, h) => handleViewMove(id, l, t, w, h),
    }));

    const size = useMemo(() => {
        if (!rref.current || !cells.length) return { w: 0, h: 0, r: 0, rw: 0, rh: 0 };
        const { clientWidth: wr, clientHeight: hr } = rref.current;
        const { x: w, y: h } = cells.reduce(({ x = 0, y = 0 }, m) => {
            const r = m.startx + m.width
            const b = m.starty + m.hight
            return { x: x < r ? r : x, y: y < b ? b : y }
        }, 0)
        const r = (wr * h > hr * w) ? hr / h : wr / w
        return { w, h, r, rw: w * r, rh: h * r }
    }, [observer, cells])

    const grids = useMemo(() => {
        const xs = [...new Set(cells.map(m => m.startx).concat(cells.map(m => (m.startx + m.width))))].sort((a, b) => a - b)
        const ys = [...new Set(cells.map(m => m.starty).concat(cells.map(m => (m.starty + m.hight))))].sort((a, b) => a - b)
        const xms = xs.reduce((t, m, i, a) => { t.push(m); if (i < a.length - 1) t.push((m + a[i + 1]) / 2); return t; }, [])
        const yms = ys.reduce((t, m, i, a) => { t.push(m); if (i < a.length - 1) t.push((m + a[i + 1]) / 2); return t; }, [])
        return { xs, ys, xms, yms }
    }, [size])

    const layouts = useMemo(() => {
        const lay = tvs[props.layout]
        if (!lay) return { xs: [], ys: [], rect: [] };

        const { col, row,
            count, unite
        } = lay

        const gw = size.w
        const gh = size.h
        const sw = gw / col
        const sh = gh / row

        const o = []
        const n = unite ? unite.map(m => [m[0], m[1], m[0] + m[2], m[1] + m[3]]) : []
        for (let i = 1; i <= row; ++i)
            for (let j = 1; j <= col; ++j)
                if (!n.find(m => m[0] <= i && m[1] <= j && m[2] > i && m[3] > j)) o.push([i, j, 1, 1])

        const os = o.concat(unite || [])
        const xs = [...new Set(os.map(m => (m[1] - 1) * sw).concat([gw]))].sort((a, b) => a - b)
        const ys = [...new Set(os.map(m => (m[0] - 1) * sh).concat([gh]))].sort((a, b) => a - b)
        const rect = os.map(m => ({ l: (m[1] - 1) * sw, t: (m[0] - 1) * sh, w: m[3] * sw, h: m[2] * sh }))
        return { xs, ys, rect }
    }, [props.layout, size])

    const edge = useMemo(() => Math.round(50 / size.r), [size])

    useLayoutEffect(() => {
        const ndata = {}
        props.windows.map(m => {
            const { x: l, y: t, w, h } = m.layout;
            const layout = { w, h, l, t, r: l + w, b: t + h }

            const orig = data[m.id]
            const unit = { ...m, layout }
            ndata[m.id] = orig ? { ...orig, ...unit } : unit
        })
        setData(ndata)
    }, [props.windows])

    useEffect(() => {
        props.onSelectChanged(selected)
    }, [selected])

    useEffect(() => props.onWinSizeChange(size.w, size.h, size.r), [size])

    const handleViewMove = (id, l, t, w, h) => {
        data[id] && setData(origin => {
            origin[id].layout = { l, t, w, h }
            return { ...origin }
        })
    }

    const handleViewFullScreen = id => {
        const ndata = { ...data }
        const { tvid, scheme: { id: sceneid } } = props;

        const m = ndata[id]
        const { l, t, w, h } = m.prelayout || m.layout;
        if (m.prelayout) {
            m.layout = { l, t, w, h }
            delete m.prelayout;
        } else {
            m.layout = { l: 0, t: 0, w: size.w, h: size.h }
            m.prelayout = { l, t, w, h }
        }

        const { iscut, cut } = m;
        const layout = { x: m.layout.l, y: m.layout.t, w: m.layout.w, h: m.layout.h }
        actions.windows_open_config(tvid, sceneid, m.srcid, layout, id, iscut, cut)

        setData(ndata)
        return !!m.prelayout
    }

    const handleShrink2Single = id => {
        const { tvid, scheme: { id: sceneid } } = props;
        const origin = { ...data }
        const m = origin[id];
        const { l: x, t: y } = m.layout;
        const { l, t, w, h } = shrink2single({ x, y }, grids.xms, grids.yms)
        if (!l && !t && !w && !h) return;

        m.layout = { l, t, w, h }
        const { iscut, cut } = m;
        console.log('------->', tvid, sceneid, m.srcid, { x: l, y: t, w, h }, id, iscut, cut)
        actions.windows_open_config(tvid, sceneid, m.srcid, { x: l, y: t, w, h }, id, iscut, cut)
        setData(origin)
    }

    const handleShrink2Own = id => {
        const { tvid, scheme: { id: sceneid } } = props;
        const origin = { ...data }
        const m = origin[id];
        const { l: x, t: y, w: wi, h: hi } = m.layout;
        const { l, t, w, h } = shrink2own({ l: x, t: y, r: wi + x, b: hi + y }, grids.xs, grids.ys)

        if (!l && !t && !w && !h) return;

        m.layout = { l, t, w, h }
        const { iscut, cut } = m;
        actions.windows_open_config(tvid, sceneid, m.srcid, { x: l, y: t, w, h }, id, iscut, cut)

        setData(origin)
    }

    const handleIsFull = id => {
        const ndata = { ...data }
        const m = ndata[id]
        return m && !!m.prelayout
    }

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        if (sglobal.lock) return;

        const ndata = { ...data }
        const title = e.dataTransfer.getData('title')
        const chnid = e.dataTransfer.getData('chnid')
        const gbid = e.dataTransfer.getData('gbid')

        if (!title) return;
        const { tvid, scheme: { id: sceneid } } = props;

        if (e.target.className == 'view') {
            const { id } = e.target;
            const { l: x, t: y, w, h } = ndata[id].layout
            actions.windows_open_config(tvid, sceneid, Number(chnid), { x, y, w, h }, Number(id))
        } else {
            if (!!props.layout) {
                const { offsetLeft: ol, offsetTop: ot,
                    offsetWidth: ow, offsetHeight: oh } = e.target;
                const tx = Math.floor((ol + ow / 2) / size.r)
                const ty = Math.floor((ot + oh / 2) / size.r)

                const index = layouts.rect.findIndex(m =>
                    m.l <= tx && (m.l + m.w) >= tx && m.t <= ty && (m.t + m.h) >= ty)
                if (index == -1) return;

                const { l: x, t: y, w, h } = layouts.rect[index]
                const layout = {
                    x: Math.round(x), y: Math.round(y),
                    w: Math.round(w), h: Math.round(h)
                }
                actions.windows_open_config(tvid, sceneid, chnid, layout)

            } else {
                const { left, top, width, height } = e.target.style
                const layout = {
                    x: Math.round(parseFloat(left) / size.r), y: Math.round(parseFloat(top) / size.r),
                    w: Math.round(parseFloat(width) / size.r), h: Math.round(parseFloat(height) / size.r),
                }
                actions.windows_open_config(tvid, sceneid, chnid, layout);
            }
        }
    };

    const handleMouseDown = e => {
        e.stopPropagation();
        if (e.button || sglobal.lock) return;

        const { id, className, style: { cursor } } = e.target;
        if (className != 'view' && className != 'view-btn') {
            if (!props.lockKeys.length) setSelected()
            return;
        }

        id !== selected && setSelected(id)
        if (props.lockKeys.find(m => m == id)) return;

        setCurrent({ id, cursor, layout: { ...data[id].layout } })
        setPos({ x: e.clientX, y: e.clientY })
    };

    const handleMouseUp = e => {
        e.stopPropagation();
        setPos(); setCurrent();

        if (!current) return;
        if (pos && (pos.x != e.clientX || pos.y != e.clientY)) {
            const d = data[current.id];
            if (!d) return false;
            const { srcid, layout, iscut, cut } = d;
            const { l: x, t: y, w, h } = layout;
            const { tvid, scheme: { id: sceneid } } = props;
            actions.windows_open_config(tvid, sceneid, srcid, { x, y, w, h }, Number(current.id), iscut, cut)
        }
        return false;
    };

    const handleMouseMove = e => {
        e.stopPropagation();
        e.preventDefault();
        if (!current || !pos || e.button || sglobal.lock) return;

        let br = { ...current.layout }
        const diffX = Math.round((e.clientX - pos.x) / size.r)
        const diffY = Math.round((e.clientY - pos.y) / size.r)
        switch (current.cursor) {
            case RESIZE.l:
            case RESIZE.bl:
            case RESIZE.tl:
                br.l += diffX;
                br.w -= diffX;
                break;
            case RESIZE.r:
            case RESIZE.br:
            case RESIZE.tr:
                br.w += diffX;
                break;
            case RESIZE.m:
                br.l += diffX;
                break;
        }

        switch (current.cursor) {
            case RESIZE.t:
            case RESIZE.tl:
            case RESIZE.tr:
                br.t += diffY;
                br.h -= diffY;
                break;
            case RESIZE.b:
            case RESIZE.bl:
            case RESIZE.br:
                br.h += diffY;
                break;
            case RESIZE.m:
                br.t += diffY;
                break;
        }
        
        if(br.w < edge) br.w = edge;
        if(br.h < edge) br.h = edge;
        br.r = br.l + br.w;
        br.b = br.t + br.h;

        // console.log('----->', br)
        const move = current.cursor ? -1 == current.cursor.search('resize') : true
        const layout = !!!props.layout ?
            magnet(br, move, grids.xms, grids.yms, size.r) :
            magnet(br, move, layouts.xs, layouts.ys, size.r)

        setData(origin => {
            const d = origin[current.id]
            if (d) d.layout = layout;
            return { ...origin };
        })
    }

    const handleDoubleClick = e => {
        e.stopPropagation()
        if (!!props.layout || sglobal.lock) return;
        if (e.target.className != 'view') return;

        const id = Number(e.target.id);
        const br = data[id].layout;
        const { iscut, cut } = data[id]

        const { offsetLeft: ol, offsetTop: ot } = e.target;
        const { tvid, scheme: { id: sceneid } } = props;
        const pos = {
            x: Math.round((ol + e.nativeEvent.offsetX) / size.r),
            y: Math.round((ot + e.nativeEvent.offsetY) / size.r)
        }
        const { l, t, w, h } = boom(br, pos, grids.xs, grids.ys, grids.xms, grids.yms)
        actions.windows_open_config(tvid, sceneid, data[id].srcid, { x: l, y: t, w, h }, id, iscut, cut)
    }

    const handleMouseLeave = e => {
        return handleMouseUp(e)
    }

    const views = useMemo(() => Object.values(data).map(m => {
        const ps = {
            key: m.id, id: m.id,
            name: m.name || '(不在线)',
            schid: props.scheme.id,
            tvid: props.tvid, data: m,
            selected: selected == m.id,
            polled: m.polled, srcid: m.srcid,
            locked: props.lockKeys.find(n => n == m.id) ? 1 : 0,
            glocked: sglobal.lock ? 1 : 0,
            gsize: size,
        }
        // console.log('------->', ps)
        return React.createElement(View, ps)
    }), [data, selected, sglobal, size, props.lockKeys])

    return <div ref={lref} id='windows' className='window' style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', margin: '10px 10px 10px 10px' }}>
        <div ref={rref} onMouseMove={() => { setCurrent() }} style={{
            boxSizing: 'content-box', flexGrow: 1, backgroundColor: 'transparent', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: current ? current.cursor : RESIZE.m,
        }}>
            {!!props.tvid && <div style={{ width: size.rw, height: size.rh, position: 'relative', overflow: 'hidden' }}
                draggable={false}
                onDrop={handleDrop}
                onMouseUp={handleMouseUp}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}>
                <Scene cells={cells} chns={voutchns} ratio={size.r} grids={grids} width={size.w} height={size.h} >
                    {!!props.layout && <Layout ratio={size.r} width={size.w} height={size.h} layout={tvs[props.layout]} />}
                    {views}
                </Scene>
            </div>}
        </div>
    </div>
})

export { Window as default }