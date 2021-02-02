import React from 'react';
import { connect } from 'react-redux';
import { Table, Row, Col, List } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import { DEVTYPE } from '../../public';

const AttendStatus = props => {
    const [data, setData] = React.useState([]);
    const [selectedKey, setSelectedKey] = React.useState()

    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch({ type: '/msp/v2/kvm/query', payload: { offset: 0 } })
    }, [])

    React.useEffect(() => {
        // 通道id，u8+u8+u8+u8（机箱号+槽位号+端口号+索引号）
        if (!selectedKey) return;
        const s = props.status[selectedKey];
        setData(Object.values(s).map((m, i) => ({
            key: i,
            box: m.id >> 24 >>> 0,
            slot: m.id << 8 >>> 24,
            port: m.id << 16 >>> 24,
            ...m,
        })))
    }, [props.status])

    const columns = [
        { title: "编号", dataIndex: "key", key: "key", width: 50 },
        { title: "机箱号", dataIndex: "box", key: "box", width: 70 },
        { title: "槽位号", dataIndex: "slot", key: "slot", width: 70 },
        { title: "端口号", dataIndex: "port", key: "port", width: 70 },
        { title: "IP", dataIndex: "ip", key: "ip", width: 100 },
        { title: "对端IP", dataIndex: "dstip", key: "dstip", width: 100 },
        { title: "在线状态", dataIndex: "online", key: "online", width: 100, render: text => text ? '在线' : '离线' },
        { title: "连接状态", dataIndex: "trslink", key: "trslink", width: 100, render: text => text ? '连接' : '断开' },
        { title: "设备类型", dataIndex: "type", key: "type", width: 100, render: text => text == DEVTYPE.TX ? 'Sender' : 'Krb' },
    ];

    const handleSelect = (key) => {
        if (selectedKey == key) return;
        setSelectedKey(key)
        dispatch({ type: '/msp/v2/kvm/status/query', payload: { id: key, type: DEVTYPE.TX } })
        dispatch({ type: '/msp/v2/kvm/status/query', payload: { id: key, type: DEVTYPE.RX } })
    }

    return (
        <div style={{height: '100%', width: '100%',display: 'flex'}}>
            <List
                header={<div>坐席列表</div>}
                bordered
                size='small'
                style={{ height: '100%', width: 250 }}
                dataSource={Object.values(props.kvms)}
                renderItem={item => {
                    return (
                        <List.Item onClick={() => handleSelect(item.id)}
                            style={{ background: selectedKey == item.id ? "#BAE7FF" : 'inherit', userSelect: 'none' }}>
                            {item.name}
                        </List.Item>
                    )
                }}
            />
            <div style={{width: 10}}></div>
            <Table
                columns={columns}
                bordered={false}
                dataSource={data}
                size='small'
                style={{ height: '100%', flexGrow: 1, border: '1px solid #D9D9D9' }}
            />
        </div>
    )
}

const mapStateToProps = state => ({
    kvms: state.mspsCfg.kvm.kvms,
    status: state.mspsCfg.kvm.status
})

export default connect(mapStateToProps)(AttendStatus);