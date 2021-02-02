import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Select, message, Table, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types';
import XLSX from 'xlsx';

const CheckModal = props => {
    const [visible, setVisible] = useState(false)

    const dispatch = useDispatch();
    const ext = useSelector(({ mspsCfg }) => mspsCfg.ext)

    useEffect(() => {
        dispatch({ type: '/msp/v2/devex/port/redundancy/check/query' })
    }, [visible])

    const data = useMemo(() => {
        const pre_zero = n => n < 10 ? '0' + n : n;
        return ext.checks.map((m, i) => {
            const { fit, lstate, fstate, phyport, phystate } = m;
            const type = (m.type ? 'OPU' : 'IPU') + pre_zero(m.lbox) + '-';
            const lname = type + pre_zero(m.lslot) + '-' + pre_zero(m.lport);
            const fname = type + pre_zero(m.fslot) + '-' + pre_zero(m.fport);
            return { key: i + 1, lname, fname, fit, lstate, fstate, phyport, phystate }
        })
    }, [ext.checks])

    const handleOk = e => {
        setVisible(false)
    }

    const handleCancel = e => {
        setVisible(false)
    }

    const s2ab = s => {
        if (typeof ArrayBuffer !== 'undefined') {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        } else {
            var buf = new Array(s.length);
            for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
    }


    const handleExport = e => {
        if (!data.length) {
            message.warning('无数据导出')
            return
        }

        const wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };
        const wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
        const ndata = data.map(m => {
            return {
                "主端口": m.lname,
                '匹配状态': m.fit ? '不支持' : '支持',
                '主状态': m.lstate ? '在线' : '离线',
                '备端口': m.fname,
                '备状态': m.fstate ? '在线' : '离线',
            }
        })
        wb.Sheets['Sheet1'] = XLSX.utils.json_to_sheet(ndata);
        const blob = new Blob([s2ab(XLSX.write(wb, wopts))], { type: "application/octet-stream" })
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'check.xlsx';
        a.click();
        URL.revokeObjectURL(a.herf);
        a.remove();
    }

    const handleClick = async e => {
        if (props.onPreCheck) {
            const check = await props.onPreCheck()
            if (!check) return;
        }
        setVisible(true)
    }

    const columns = [
        { title: '序号', dataIndex: 'key', key: 'key' },
        { title: '主端口', dataIndex: 'lname', key: 'lname', render: t => <a>{t}</a>, },
        { title: '匹配状态', dataIndex: 'fit', key: 'fit', render: t => <div style={{ color: t ? 'red' : 'inherit' }}>{t ? '不支持' : '支持'}</div>, },
        { title: '主状态', dataIndex: 'lstate', key: 'lstate', render: t => t ? '在线' : '离线' },
        { title: '备端口', dataIndex: 'fname', key: 'fname', render: t => <a>{t}</a>, },
        { title: '备状态', dataIndex: 'fstate', key: 'fstate', render: t => t ? '在线' : '离线' },
    ];

    return <>
        <Button type='primary' onClick={handleClick}>{props.children}</Button>
        <Modal
            centered
            title={'一键检测'}
            visible={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            style={{ maxHeight: 500, minWidth: 700 }}>
            <Table
                bordered
                size='small'
                columns={columns}
                dataSource={data}
                footer={() => <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={handleExport}>一键导出</Button></div>}
            ></Table>
        </Modal>
    </>
}

export default CheckModal