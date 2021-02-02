import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Radio, Button, Select, Row, Col, Table, Space, InputNumber } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types';

const ModalButton = props => {
    const [visible, setVisible] = useState(false)

    const handleOk = e => {
        setVisible(false)
        props.onOk(e)
    }

    const handleCancel = e => {
        setVisible(false)
        props.onCancel(e)
    }

    const handleClick = async e => {
        if (props.onPreCheck) {
            const check = await props.onPreCheck()
            if (!check) return;
        }
        setVisible(true)
    }

    return <>
        <Button onClick={handleClick}>{props.name}</Button>
        <Modal
            centered
            title={props.title}
            visible={visible}
            onOk={handleOk}
            onCancel={handleCancel} style={props.style}>
            {props.children}
        </Modal>
    </>
}

ModalButton.defaultProps = {
    name: '',
    title: '',
}

ModalButton.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}

const UniteModal = props => {
    const [cmode, setCmode] = useState(0)

    const [form] = Form.useForm();

    const dispatch = useDispatch();

    const handleOk = async e => {
        const row = await form.validateFields()
        props.new ? dispatch({
            type: '/msp/v2/sys/cascade/add', payload: row
        }) : dispatch({
            type: '/msp/v2/sys/cascade/config', payload: { ...props.data, ...row }
        })
    }

    const handleCancel = e => {

    }

    const handleValuesChange = (change, values) => {
        if (values.mode != cmode) setCmode(values.mode)
    }

    const handlePreCheck = () => {
        props.data && form.setFieldsValue({
            ...props.data
        })
        return new Promise(resolve => {
            if (props.new) {
                return resolve(true);
            }

            if (!props.data) {
                Modal.warning({
                    centered: true,
                    title: '提示',
                    content: '请先选中...',
                    okText: '确定'
                })
                return resolve(false)
            }
            return resolve(true)
        })
    }

    const formItemLayout = {
        labelCol: {
            xs: { span: 4, },
            sm: { span: 4, },
        },
        wrapperCol: {
            xs: { span: 19, },
            sm: { span: 19, },
        },
    };
    return <ModalButton name={props.new ? '添加' : '修改'} title={`${props.new ? '添加' : '修改'}级联`} onOk={handleOk}
        onCancel={handleCancel} onPreCheck={handlePreCheck}>
        <Form form={form} initialValues={{ 'mode': 0 }} {...formItemLayout} onValuesChange={handleValuesChange}>
            <Form.Item name='name' label='名称' rules={[
                { required: true, message: `请输入名称!` },
                {
                    validator: (_, value) => {
                        const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                        if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                        let len = 0;
                        Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                        return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                    },
                }]}> <Input />
            </Form.Item>
            <Form.Item name='mode' label='连接方式' rules={[{ required: true, message: `请选择连接方式!`, }]}>
                <Radio.Group >
                    <Radio value={0}>IP连接</Radio>
                    <Radio value={2}>串口连接</Radio>
                    <Radio value={1}>URL连接</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name='box' label='机箱号' rules={[{ required: true, message: `请输入机箱号!`, }]}>
                <InputNumber min={1} max={7} style={{ width: '100%' }} />
            </Form.Item>
            {
                !cmode && <>
                    <Form.Item name='ip' label='IP' rules={[{ required: true, message: `请输入IP!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                    <Form.Item name='port' label='端口' rules={[{ required: true, message: `请输入端口号!`, }]}>
                        <InputNumber min={1} max={65535} />
                    </Form.Item>
                    <Form.Item name='username' label='用户名' rules={[{ required: true, message: `请输入用户名!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                    <Form.Item name='password' label='密码' rules={[{ required: true, message: `请输入密码!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </>
            }
            {
                cmode == 2 && <>
                    <Form.Item name='ip' label='IP' rules={[{ required: true, message: `请输入IP!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                    <Form.Item name='domain' label='串口名' rules={[{ required: true, message: `请输入串口名!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </>
            }
            {
                cmode == 1 && <>
                    <Form.Item name='domain' label='URL' rules={[{ required: true, message: `请输入URL!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </>
            }
        </Form>
    </ModalButton>
}

const DelModal = props => {
    const dispatch = useDispatch();

    const handleDeleteConfirm = () => {
        !props.data ? Modal.warning({
            centered: true,
            title: '提示',
            content: '请先选中...',
            okText: '确定',
        }) : Modal.confirm({
            title: '警告',
            icon: <ExclamationCircleOutlined />,
            content: '确定删除该级联平台?',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                dispatch({ type: '/msp/v2/sys/cascade/delete', payload: { msp: props.data.msp } })
            },
            onCancel() {

            },
        });
    }

    return <Button onClick={handleDeleteConfirm}>删除</Button>
}

const ChnModal = props => {
    const [inout, setInout] = useState(true)
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    const [form] = Form.useForm()
    const dispatch = useDispatch()

    const unite = useSelector(({ mspsCfg }) => mspsCfg.unite)

    const data = useMemo(() => {
        const plan = unite[props.data.msp] || {};
        const chns = plan.chns || []
        return chns.map((m, i) => ({ key: i, ...m }))
    }, [unite, props.data])

    const handleOk = e => {

    }

    const handleCancel = e => {

    }

    const handleAdd = async e => {
        const row = await form.validateFields()
        row.type = row.chn1
        row.cip = props.data.ip
        dispatch({ type: '/msp/v2/sys/cascade/channel/add', payload: { ...row } })
    }

    const handleDel = e => {
        const chns = selectedRowKeys.map(m => data.find(n => n.key == m))
        dispatch({ type: '/msp/v2/sys/cascade/channel/delete', payload: { chns } })
    }

    const handleValuesChange = (changedValues, allValues) => {
        console.log('values change: ', changedValues, allValues)
        const { chn1, chn2 } = changedValues
        if (chn1 !== undefined) {
            setInout(!chn1)
            form.setFieldsValue({ ...allValues, chn1, chn2: chn1 ? 0 : 1 })
        } else if (chn2 !== undefined) {
            setInout(chn2)
            form.setFieldsValue({ ...allValues, chn2, chn1: chn2 ? 0 : 1 })
        }
    }

    const handlePreCheck = () => {
        const { data: { msp } } = props;
        dispatch({ type: '/msp/v2/sys/cascade/channel/query', payload: { id: msp } })
        form.setFieldsValue({ chn1: 0, chn2: 1 })
        setInout(true);
        return true;
    }

    const formItemLayout = {
        labelCol: {
            span: 6,
        },
        wrapperCol: {
            span: 18,
        },
    };

    const columns = [
        { title: '序号', dataIndex: 'key', key: 'key' },
        { title: '当前机箱', dataIndex: 'box', key: 'box', render: text => <a>{text}</a>, },
        { title: '当前槽位', dataIndex: 'slot', key: 'slot' },
        { title: '当前端口', dataIndex: 'port', key: 'port' },
        { title: '级联机箱', dataIndex: 'cbox', key: 'cbox' },
        { title: '级联IP', dataIndex: 'cip', key: 'cip' },
        { title: '级联槽位', dataIndex: 'cslot', key: 'cslot' },
        { title: '级联端口', dataIndex: 'cport', key: 'cport' },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys, rows) => {
            setSelectedRowKeys(keys)
        }
    }

    const handleRow = record => {
        return {
            onClick: e => {
                let nkeys = [...selectedRowKeys]
                const index = nkeys.findIndex(m => m == record.key)
                if (index == -1) {
                    nkeys.push(record.key)
                } else {
                    nkeys = nkeys.filter(m => m != record.key)
                }
                setSelectedRowKeys(nkeys)
            }
        }
    }

    return <ModalButton name='配置' title='级联通道配置' onOk={handleOk}
        onCancel={handleCancel} onPreCheck={handlePreCheck} style={{ minWidth: 900, maxHeight: 600 }}>
        <Form form={form} size='middle' onValuesChange={handleValuesChange} >
            <Row gutter={24}>
                <Col span={6}>
                    <Form.Item name='box' label='本级机箱号' rules={[{ required: true, message: `请输入机箱号!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='chn1' label='IPU' {...formItemLayout}>
                        <Select>
                            <Select.Option value={0}>输入</Select.Option>
                            <Select.Option value={1}>输出</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='slot' label='本级槽位' rules={[{ required: true, message: `请输入槽位!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='port' label='本级端口' rules={[{ required: true, message: `请输入端口!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='cbox' label='级联机箱号' rules={[{ required: true, message: `请输入机箱号!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='chn2' label='OPU' {...formItemLayout}>
                        <Select>
                            <Select.Option value={0}>输入</Select.Option>
                            <Select.Option value={1}>输出</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='cslot' label='级联槽位' rules={[{ required: true, message: `请输入槽位!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name='cport' label='级联端口' rules={[{ required: true, message: `请输入端口!`, }]}>
                        <Input maxLength={20} />
                    </Form.Item>
                </Col>
            </Row>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                    <Button onClick={handleAdd}>添加</Button>
                    <Button onClick={handleDel}>删除</Button>
                </Space>
            </div>

        </Form>
        <Table
            size='small'
            columns={columns}
            dataSource={data}
            rowSelection={rowSelection}
            onRow={handleRow}
            style={{ marginTop: 8 }}
        ></Table>
    </ModalButton >
}

export { UniteModal, DelModal, ChnModal }