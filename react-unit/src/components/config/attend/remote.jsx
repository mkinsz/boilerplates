import React from 'react';
import { Table, Input, Select, Form, Row, Col, Radio, Button } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import { DEVTYPE, CHNTYPE } from '../../public';

const proto2text = {
    0: '科达私有2.0',
    1: '串口协议',
    2: 'Wake On LAN',
    3: '科达私有1.0'
}

const AttendRemote = props => {
    const [data, setData] = React.useState([]);
    const [proto, setProto] = React.useState(0);
    const [selectedRowKeys, setSelectedRowKeys] = React.useState([])

    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const powers = useSelector(({ mspsCfg: { kvm } }) => kvm.powers)
    const vinchns = useSelector(({ mspsDev }) => mspsDev.vins)

    const formItemLayout = {
        labelCol: {
            span: 6,
        },
        wrapperCol: {
            span: 18,
        },
    };

    React.useEffect(() => {
        Object.keys(vinchns).map(m => dispatch({ type: '/msp/v2/kvm/power/query', payload: { id: m } }))
    }, [vinchns])

    React.useEffect(() => {
        setData(Object.values(vinchns).map((m, i) =>
            ({ key: i, ...m, ...powers[m.id] })))
    }, [powers, vinchns])

    const columns = [
        { title: "编号", dataIndex: "key", key: "key", width: 50 },
        { title: "通道名", dataIndex: "name", key: "name", width: 130 },
        { title: "电源协议", dataIndex: "protocol", key: "protocol", render: text => proto2text[text], width: 110 },
        { title: "开指令", dataIndex: "on", key: "on", width: 100 },
        { title: "关指令", dataIndex: "off", key: "off", width: 100 },
        { title: "Mac", dataIndex: "mac", key: "mac", width: 100 },
        { title: "IP", dataIndex: "ip", key: "ip", width: 100 },
        { title: "槽位", dataIndex: "slot", key: "slot", render: t => !t ? '' : t, width: 60 },
    ];

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
        const chnidList = selectedRowKeys.map(m => data[m].id)
        dispatch({ type: '/msp/v2/kvm/power/config', payload: { chnidList, ...values, slot: parseInt(values.slot) } })
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
                />
            </Col>
            <Col span={7}>
                <Form form={form} {...formItemLayout} onFinish={handleFinish} onValuesChange={handleValueChange}>
                    <Form.Item label="协议类型" name="protocol" rules={[{ required: true }]}>
                        <Select disabled={!selectedRowKeys.length} style={{ minWidth: 120 }}>
                            <Select.Option value={3}>{proto2text[3]}</Select.Option>
                            <Select.Option value={0}>{proto2text[0]}</Select.Option>
                            <Select.Option value={1}>{proto2text[1]}</Select.Option>
                            <Select.Option value={2}>{proto2text[2]}</Select.Option>
                        </Select>
                    </Form.Item>

                    {3 == proto && <>
                        <Form.Item name="ip" label="IP" rules={[
                            { required: true, message: '请填写IP地址!' },
                            { pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/, message: 'Ip地址格式有误!' }]}>
                            <Input maxLength={20}/>
                        </Form.Item>
                        <Form.Item name="slot" label="槽位" rules={[{ required: true, message: '请填写端口号!' }]}>
                            <Input maxLength={20}/>
                        </Form.Item>
                    </>}
                    {1 == proto && <>
                        <Form.Item name="on" label="开指令" rules={[{ required: true, message: '请填写开指令!' }]}>
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item name="off" label="关指令" rules={[{ required: true, message: '请填写关指令!' }]}>
                            <Input.TextArea />
                        </Form.Item>
                    </>}
                    {2 == proto && <>
                        <Form.Item name="mode" label="模式" rules={[{ required: true, message: '请选择模式!' }]}>
                            <Radio.Group>
                                <Radio value={0}>网络</Radio>
                                <Radio value={1}>串口</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item name="mac" label="Mac" rules={[
                            // { required: true, message: '请填写Mac地址!' },
                            { pattern: /[A-F\d]{2}-[A-F\d]{2}-[A-F\d]{2}-[A-F\d]{2}-[A-F\d]{2}-[A-F\d]{2}/, message: 'Mac地址格式有误!' }
                        ]}>
                            <Input maxLength={20}/>
                        </Form.Item>
                        <Form.Item name="ip" label="IP" rules={[
                            { required: true, message: '请填写Ip地址!' },
                            { pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/, message: 'Ip地址格式有误!' }]}>
                            <Input maxLength={20}/>
                        </Form.Item>
                    </>}
                    <Form.Item wrapperCol={{ span: 18, offset: 6 }} >
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Col>
        </Row>
    )
}

export default AttendRemote;