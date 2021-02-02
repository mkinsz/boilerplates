import React, { useMemo, useEffect, useState } from 'react';
import { Table, Input, Select, Form, Row, Col, Modal, Button } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import { DEVTYPE, CHNTYPE } from '../../public';

const proto2text = {
    0: 'VISCA',
    1: 'PELCO-D',
    2: 'PELCO-P',
    255: '其他'
}

const com2text = {
    0: 'RS485',
    1: 'RS232',
    2: 'RS422',
    3: '其他'
}

const DeviceSerial = props => {
    const [proto, setProto] = useState(0);
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const coms = useSelector(({ mspsDev }) => mspsDev.coms)
    const vinchns = useSelector(({ mspsDev }) => mspsDev.vins)

    const formItemLayout = {
        labelCol: {
            span: 6,
        },
        wrapperCol: {
            span: 18,
        },
    };

    // useEffect(() => {
    //     dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN, offset: 0 } });
    // }, [])

    useEffect(() => {
        Object.keys(vinchns).map(m => {
            dispatch({ type: '/msp/v2/chn/cfg/vedio/com/query', payload: { id: m } })
            dispatch({ type: '/msp/v2/chn/cfg/vedio/com/ptz/query', payload: { id: m } })
        })
    }, [vinchns])

    const data = useMemo(() =>
        Object.values(vinchns).map((m, i) =>
            ({ key: m.id, index: i+1, ...m, ...coms[m.id] }))
        , [coms, vinchns])

    const columns = [
        { title: "编号", dataIndex: "index", key: "index", width: 50 },
        { title: "通道名", dataIndex: "name", key: "name", width: 130 },
        { title: "串口协议", dataIndex: "proto", key: "proto", render: text => proto2text[text], width: 110 },
        { title: "串口类型", dataIndex: "type", key: "type", render: t => com2text[t], width: 100 },
        // { title: "串口号", dataIndex: "port", key: "port", width: 100 },
        { title: "波特率", dataIndex: "baudrate", key: "baudrate", width: 100 },
        { title: "使能", dataIndex: "enable", key: "enable", render: (t, r) => <Button onClick={() => handleEnabled(r)}>{t ? '开' : '关'}</Button>, width: 60 },
    ];

    const handleEnabled = r => {
        dispatch({ type: '/msp/v2/chn/cfg/vedio/com/ptz/config', payload: { id: r.id, enable: !r.enable } })
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys, rows) => {
            setSelectedRowKeys(keys)
            if (rows.length) {
                setProto(rows[0].protocol)
                form.setFieldsValue(rows[0])
            }
        },
    }

    const handleValueChange = (changedValues, allValues) => {
        const { protocol } = allValues
        if (proto != protocol) {
            form.setFieldsValue({ ip: '', slot: null, on: '', off: '', mac: '', mode: 0 })
            setProto(protocol)
        }

    }

    const handleFinish = values => {
        if (!selectedRowKeys.length) return;
        if (selectedRowKeys.find(m => !coms[m].enable)) {
            Modal.warning({
                centered: true,
                content: '包含使能未打开的通道，无法进行配置',
            })
            return;
        }
        selectedRowKeys.map(m =>
            dispatch({ type: '/msp/v2/chn/cfg/vedio/com/config', payload: { ...coms[m], ...values, id: coms[m].id } })
        )
    }

    const handleRow = record => {
        return {
            onClick: e => {
                let nkeys = [...selectedRowKeys]
                const index = nkeys.findIndex(m => m == record.key)
                if (index == -1) {
                    nkeys.push(record.key)
                    setProto(record.protocol)
                    form.setFieldsValue(record)
                } else {
                    nkeys = nkeys.filter(m => m != record.key)
                }
                setSelectedRowKeys(nkeys)
            }
        }
    }

    return (
        <Row gutter={1} style={{ height: '100%', width: '100%', display: 'flex' }}>
            <Col span={17} style={{ height: '100%', overflow: 'auto' }}>
                <Table
                    size='small'
                    bordered
                    columns={columns}
                    dataSource={data}
                    rowSelection={rowSelection}
                    onRow={handleRow}
                    pagination={{
                        size: 'middle'
                    }}
                />
            </Col>
            <Col span={7}>
                <Form form={form} {...formItemLayout} onFinish={handleFinish} onValuesChange={handleValueChange}>
                    <Form.Item label="类型" name="type">
                        <Select disabled={true} style={{ minWidth: 120 }}>
                            <Select.Option value={0}>{com2text[0]}</Select.Option>
                            <Select.Option value={1}>{com2text[1]}</Select.Option>
                            <Select.Option value={2}>{com2text[2]}</Select.Option>
                            <Select.Option value={3}>{com2text[3]}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="名称" >
                        <Input value='com1' maxLength={20} disabled={true} placeholder='com1' />
                    </Form.Item>
                    <Form.Item name="baudrate" label="波特率">
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={1200}>1200</Select.Option>
                            <Select.Option value={2400}>2400</Select.Option>
                            <Select.Option value={4800}>4800</Select.Option>
                            <Select.Option value={9600}>9600</Select.Option>
                            <Select.Option value={14400}>14400</Select.Option>
                            <Select.Option value={19200}>19200</Select.Option>
                            <Select.Option value={38400}>38400</Select.Option>
                            <Select.Option value={56000}>56000</Select.Option>
                            <Select.Option value={57600}>57600</Select.Option>
                            <Select.Option value={115200}>115200</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="databits" label="数据位">
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={6}>{6}</Select.Option>
                            <Select.Option value={7}>{7}</Select.Option>
                            <Select.Option value={8}>{8}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="stopbits" label="停止位">
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={1}>1</Select.Option>
                            <Select.Option value={2}>2</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="parity" label="校验">
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={0}>0</Select.Option>
                            <Select.Option value={1}>1</Select.Option>
                            <Select.Option value={2}>2</Select.Option>
                            <Select.Option value={3}>3</Select.Option>
                            <Select.Option value={255}>255</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="proto" label="控制协议">
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={0}>{proto2text[0]}</Select.Option>
                            <Select.Option value={1}>{proto2text[1]}</Select.Option>
                            <Select.Option value={2}>{proto2text[2]}</Select.Option>
                            <Select.Option value={255}>{proto2text[255]}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item wrapperCol={{ span: 18, offset: 6 }} >
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Col>
        </Row>
    )
}

export default DeviceSerial;