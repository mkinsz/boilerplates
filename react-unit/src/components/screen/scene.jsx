import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';

const toRound = m => {
    if (m == 0 || m == 1) return m;
    else if (m % 1 < 0.5) return Math.round(m) + 0.5
    else if (m % 1 > 0.5) return Math.round(m) - 0.5
    else return m
}

const toActual = (exp, total) => {
    switch (typeof exp) {
        case 'string':
            return eval(exp) * total
        case 'number':
            if (exp > 1 || exp < 0) return exp
            else return exp * total
    }
}

const Box = React.forwardRef((props, ref) => {
    const { l, t, w, h, r, data } = props;

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

    return <div ref={ref} style={{
        fontSize: 14,
        position: 'absolute',
        whiteSpace: 'nowrap',
        top: t * r, left: l * r,
        width: w * r, height: h * r,
    }}
        ratio={r}
        id={data.id}
        className='box'
        chnid={data.chnid}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
    >
        {l == data.startx && t == data.starty ? props.title || '' : ''}
    </div>
})

const presets = {
    1: [
        [0, 0, 0.5, 1],
        [0.5, 0, 0.5, 1]
    ],
    2: [
        [0, 0, '1/3', 1], ['1/3', 0, '1/3', 1], ['2/3', 0, '1/3', 1],
    ],
    3: [
        [0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5],
        [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5],
    ],
    4: [
        [0, 0, '1/3', '1/3'], ['1/3', 0, '1/3', '1/3'], ['2/3', 0, '1/3', '1/3'],
        [0, '1/3', '1/3', '1/3'], ['1/3', '1/3', '1/3', '1/3'], ['2/3', '1/3', '1/3', '1/3'],
        [0, '2/3', '1/3', '1/3'], ['1/3', '2/3', '1/3', '1/3'], ['2/3', '2/3', '1/3', '1/3'],
    ],
    5: [
        [0, 0, 0.25, 0.25], [0.25, 0, 0.25, 0.25], [0.5, 0, 0.25, 0.25], [0.75, 0, 0.25, 0.25],
        [0, 0.25, 0.25, 0.25], [0.25, 0.25, 0.25, 0.25], [0.5, 0.25, 0.25, 0.25], [0.75, 0.25, 0.25, 0.25],
        [0, 0.5, 0.25, 0.25], [0.25, 0.5, 0.25, 0.25], [0.5, 0.5, 0.25, 0.25], [0.75, 0.5, 0.25, 0.25],
        [0, 0.75, 0.25, 0.25], [0.25, 0.75, 0.25, 0.25], [0.5, 0.75, 0.25, 0.25], [0.75, 0.75, 0.25, 0.25],
    ],
}

const Scene = props => {
    const [data, setData] = useState()
    const { chns, cells, ratio } = props;

    const cref = useRef();

    useEffect(() => {
        const xs = props.grids.xs.map(m => m * ratio)
        const ys = props.grids.ys.map(m => m * ratio)
        setData({ xs, ys })
    }, [props.grids])

    useLayoutEffect(() => {
        if (!data) return;

        const canvas = cref.current;
        const gw = canvas.width;
        const gh = canvas.height;
        if (!gw || !gh) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, gw, gh);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(74, 154, 255, 1)';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, 0)
        ctx.lineTo(gw, 0)
        ctx.stroke()
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(0, gh)
        ctx.lineTo(gw, gh)
        ctx.stroke()
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(0, 0)
        ctx.lineTo(0, gh)
        ctx.stroke()
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(gw, 0)
        ctx.lineTo(gw, gh)
        ctx.stroke()
        ctx.closePath();

        // solid line
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(74, 154, 255, 0.5)';
        data.xs.map((m, i, a) => {
            if (i == 0 || i == a.length - 1) return;
            m = toRound(m)
            // console.log('Solid Y-Line: ', m)
            ctx.beginPath();
            ctx.moveTo(m, 0);
            ctx.lineTo(m, gh);
            ctx.stroke();
            ctx.closePath()
        })

        data.ys.map((m, i, a) => {
            if (i == 0 || i == a.length - 1) return;
            m = toRound(m)
            // console.log('Solid X-Line: ', m)
            ctx.beginPath();
            ctx.moveTo(0, m);
            ctx.lineTo(gw, m);
            ctx.stroke();
            ctx.closePath()
        })

        // dot line
        ctx.setLineDash([4, 2, 1, 2]);
        ctx.strokeStyle = 'rgba(74, 154, 255, 0.25)';
        data.xs.map((m, i, a) => {
            if (i == a.length - 1) return;
            m = toRound((m + a[i + 1]) / 2.0)
            // console.log('Dot Y-Line: ', m)
            ctx.beginPath()
            ctx.moveTo(m, 0);
            ctx.lineTo(m, gh);
            ctx.stroke();
            ctx.closePath()
        });

        data.ys.map((m, i, a) => {
            if (i == a.length - 1) return;
            m = toRound((m + a[i + 1]) / 2.0)
            // console.log('Dot X-Line: ', m)
            ctx.beginPath()
            ctx.moveTo(0, m);
            ctx.lineTo(gw, m);
            ctx.stroke();
            ctx.closePath()
        })
    }, [data])

    const s = useMemo(() => 2) // 大屏 row: 2, column: 2
    const w = useMemo(() => props.width * ratio, [props.width, ratio])
    const h = useMemo(() => props.height * ratio, [props.height, ratio])

    return (
        <div className='scene' style={{ width: w, height: h, position: 'absolute', backgroundColor: '#F5FAFF' }}>
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
                <canvas ref={cref} width={w} height={h} />
                {
                    cells.reduce((t, m) => {
                        const chn = chns ? chns[m.chnid] : undefined
                        const { startx: x, starty: y, width: w, hight: h } = m;
                        for (let i = 0; i < s; ++i)
                            for (let j = 0; j < s; ++j)
                                t.push({
                                    title: chn ? chn.name : '',
                                    data: m, w: w / s, h: h / s,
                                    l: x + i * w / s, t: y + j * h / s,
                                })
                        return t;
                    }, []).map(m => <Box key={uuidv4()} {...m} r={ratio} />)
                }
            </div>
            {props.children}
        </div>
    );
}

export default Scene;