import React from 'react';
import Cell from './public/cell'

const Layout = React.forwardRef((props, ref) => {
    const { width, height, ratio, layout } = props;

    const grids = React.useMemo(() => {
        if (!layout) return;

        const boxes = []
        const { col, row, count, unite } = layout

        const n = count || col * row;
        for (let i = 0; i < n; ++i) {
            const ref = React.createRef();
            const ps = { key: i.toString(), ref, style: {} }
            if (unite && unite[i]) {
                const m = unite[i]
                ps.style.gridArea = `${m[0]} / ${m[1]} / span ${m[2]} / span ${m[3]}`
            }
            boxes.push(React.createElement(Cell, ps))
        }
        return boxes;
    }, [layout])

    const genFl = n => {
        let s = '';
        while (n--) s += 'auto '
        return s;
    }

    return <div style={{
        position: 'absolute',
        width: width * ratio,
        height: height * ratio,
        display: 'grid', gridGap: 0,
        gridTemplateColumns: layout && genFl(layout.col),
        gridTemplateRows: layout && genFl(layout.row),
        backgroundColor: '#F5FAFF'
    }}>
        {grids}
    </div>
})

export default Layout;