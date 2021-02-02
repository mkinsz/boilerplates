import React, { useState, useEffect, useMemo } from 'react'
import { Select, Tooltip } from 'antd'

const { Option } = Select;

const CellView = props => {
    const { index, chnouts, chnins, srcins, outid, onCellChange } = props;

    const data = useMemo(() => ({
        id: index, chnout: outid,
        chnin: chnins.length && chnins[0] || null
    }), [outid, chnins, index])

    const handleChange = value => {
        const newData = { ...data, chnout: value }
        onCellChange(newData)
    }

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        const dt = e.dataTransfer;
        const chnstr = dt.getData('chnin');
        if (!chnstr) return false;

        const chn = parseInt(chnstr)
        const newData = { ...data, chnin: chn ? chn : null }
        props.onCellChange(newData)
    }

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
    }

    const params = <>
        <div>{`屏幕ID: ${index}`}</div>
        <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} >
            {`默认输入: ${data ? (srcins[data.chnin] ? srcins[data.chnin].name : '') : ''}`}</div>
        <div>W: 1920</div>
        <div>H: 1080</div>
    </>

    const selections = useMemo(() =>
        chnouts.map(m => <Option key={m.id} title={m.name} value={m.id}>{m.name}</Option>),
        [chnouts])

    return <Tooltip title={() => <div style={{ fontSize: 12 }}>{params}</div>} >
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="cellview"
            style={{
                height: '100%', width: '100%', display: 'flex', overflow: 'hidden',
                flexDirection: 'column', border: '1px solid #AAAAAA',
            }}>
            <Select listHeight={192} value={data.chnout} onChange={handleChange} >
                {selections}
            </Select>
            <div style={{ marginTop: 5, marginLeft: 8, fontSize: 14, }}>
                {params}
            </div>
        </div>
    </Tooltip>
}

export default CellView;