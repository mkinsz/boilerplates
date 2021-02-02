import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Space, Button } from 'antd';
import { UniteModal, DelModal, ChnModal } from './modal';
import { useDispatch, useSelector } from 'react-redux';

const cnnType = {
    0: 'IP',
    1: '串口',
    2: '域名'
}

const platStatus = {
    0: '不在线',
    1: '在线不可用',
    2: '在线可用'
}

const Unite = props => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    const dispatch = useDispatch()
    const unite = useSelector(({ mspsCfg }) => mspsCfg.unite)

    useEffect(() => {
        dispatch({ type: '/msp/v2/sys/cascade/query' })
    }, [])

    const data = useMemo(() => Object.values(unite).map(m => ({ ...m, key: m.msp })), [unite])

    const handleEnable = record => {
        const { msp, box, enable } = record;
        dispatch({ type: '/msp/v2/sys/cascade/enable/config', payload: { msp, enable: !enable ? 1 : 0 } })
    }

    const handleImport = record => {

    }

    const columns = [
        { title: '序号', dataIndex: 'key', key: 'key' },
        { title: '名称', dataIndex: 'name', key: 'name', render: text => <a>{text}</a>, },
        { title: '连接方式', dataIndex: 'mode', key: 'mode', render: text => cnnType[text] },
        { title: '机箱号', dataIndex: 'box', key: 'box' },
        { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
        { title: '用户名', dataIndex: 'username', key: 'username' },
        { title: '平台状态', dataIndex: 'state', key: 'state', render: text => platStatus[text] },
        {
            title: '级联通道', dataIndex: 'port', key: 'port', width: 80,
            render: (text, record) => <ChnModal name='配置' title='级联通道配置' data={record}></ChnModal>,
        },
        {
            title: '使能', dataIndex: 'enable', key: 'enable', width: 60,
            render: (text, record) => <Button size="middle" onClick={() => handleEnable(record)}>{text ? '关' : '开'}</Button>,
        },
        {
            title: '数据', dataIndex: 'data', key: 'data', width: 80,
            render: (text, record) => <Button size="middle" onClick={() => handleImport(record)}>导入</Button>,
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onSelect: (record, selected) => {
            setSelectedRowKeys(selected ? [record.key] : [])
        }
    }

    const handleRow = record => {
        return {
            onClick: e => {
                setSelectedRowKeys([record.key])
            }
        }
    }

    return <Card title="级联平台" size='small' extra={<Space>
        <UniteModal new={true} />
        <UniteModal new={false} data={selectedRowKeys.length ? unite[selectedRowKeys[0]] : undefined} />
        <DelModal data={selectedRowKeys.length ? unite[selectedRowKeys[0]] : undefined} />
    </Space>} >
        <Table
            size='small'
            columns={columns}
            dataSource={data}
            rowSelection={rowSelection}
            onRow={handleRow}
            pagination={{ size: 'middle' }}
        >
        </Table>
    </Card>
}

export default Unite;