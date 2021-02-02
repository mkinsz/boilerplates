import React, { useState, useEffect } from 'react';
import {
    Switch, Table, Form, Space, Input,
    Collapse, Card, Button, Popconfirm
} from "antd";
import { useDispatch, useSelector } from 'react-redux';
import { Prompt, useHistory, useLocation } from 'react-router-dom';

import { CONFIG } from '../../../actions'

const tabList = [
    {
        key: 'ipv4',
        tab: 'IPv4',
    },
    {
        key: 'ipv6',
        tab: 'IPv6',
    },
];

const regxRule = {
    message: 'IP地址格式不符合要求',
    pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
}

const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
}) => {
    const formProps = {
        name: dataIndex
    }
    if (inputType === 'switch') formProps.valuePropName = "checked"
    // if (dataIndex == 'ip' || dataIndex == 'mask') formProps.rules = [regxRule];
    return (
        <td {...restProps}>
            {editing ? <Form.Item {...formProps} style={{ margin: 0 }}>{inputType === 'switch' ? <Switch /> : <Input />}</Form.Item> : (children)}
        </td>
    );
};

const TcpIp = props => {
    const [form] = Form.useForm();
    const [gwform] = Form.useForm();
    const [lanform] = Form.useForm();

    const [data, setData] = useState([])
    const [actTab, setActTab] = useState('ipv4');
    const [editingKey, setEditingKey] = useState('');
    const [modNet, setModNet] = useState(false);
    const [modGw, setModGw] = useState(false);

    const dispatch = useDispatch()

    const mpus = useSelector(({ mspsCfg }) => mspsCfg.net.mpus)
    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.nets)

    useEffect(() => {
        dispatch({ type: '/msp/v2/net/mpugw/query' })   // GW
        dispatch({ type: '/msp/v2/net/mpulan/query' })  // IP
        dispatch({ type: '/msp/v2/net/mpu/query'})
    }, [])

    useEffect(() => {
        lanform.setFieldsValue({ 'lan': mpus.lanin })
    }, [mpus.lanin])

    useEffect(() => {
        gwform.setFieldsValue({ 'gw': mpus.gw })
    }, [mpus.gw])

    useEffect(() => {
        const ips = []
        const type = actTab === 'ipv4' ? 0 : 1
        nets.map(n => { if (type === n.type) ips.push(n) })
        setData([...ips])
    }, [nets, actTab]);

    const isEditing = record => record.key === editingKey;

    const edit = record => {
        form.setFieldsValue({ ...record });
        setEditingKey(record.key);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async key => {
        try {
            const row = await form.validateFields();
            const newData = [...data];
            const index = newData.findIndex(item => key === item.key);

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                dispatch({ type: '/msp/v2/net/mpu/config', payload: {...item, ...row} })
            } else {
                newData.push(row);
            }
            setData(newData);
            setEditingKey('');
        } catch (errInfo) {
            console.log('校验失败：', errInfo);
        }
    };

    const columns = [
        // { title: '网卡编号', dataIndex: 'id', width: '10%' },
        { title: '名称', dataIndex: 'name', width: '15%', editable: false },
        { title: 'IP', dataIndex: 'ip', width: '20%', editable: true },
        { title: '子网掩码', dataIndex: 'mask', width: '20%', editable: true },
        // {
        //     title: 'DHCP', dataIndex: 'dhcp', width: '10%', editable: true,
        //     render: (text, record) => <span>{text ? '是' : '否'}</span>
        // },
        {
            title: '启用', dataIndex: 'use', width: '10%', editable: true,
            render: (text, record) => <span>{text ? '是' : '否'}</span>
        },
        // {
        //     title: '编辑',
        //     dataIndex: 'operation',
        //     render: (text, record) => {
        //         const editable = isEditing(record);
        //         return editable ? (
        //             <Space>
        //                 <Popconfirm title="此操作会导致主控重启，是否确认?" okText="确认" cancelText="取消" onConfirm={() => save(record.key)}>
        //                     <a>保存</a>
        //                 </Popconfirm>
        //                 <a onClick={() => cancel(record.key)}>取消</a>
        //             </Space>
        //         ) : (<a disabled={editingKey !== ''} onClick={() => edit(record)}>编辑</a>);
        //     },
        // },
    ];

    const components = {
        body: {
            cell: EditableCell,
        },
    };

    const mergedColumns = columns.map(col => {
        if (!col.editable) return col;

        return {
            ...col,
            onCell: record => ({
                record,
                inputType: (col.dataIndex === 'use' || col.dataIndex === 'dhcp') ? 'switch' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    const handleNetSaved = async () => {
        try {
            const v = await lanform.validateFields();
            dispatch({type: '/msp/v2/net/mpulan/config', payload: {ipin: v.lan}})
        } catch (e) {
            console.log('保存失败:', e)
        }
        setModNet(false);
    }

    const handleGwSaved = async () => {
        try {
            const v = await gwform.validateFields();
            dispatch({type: '/msp/v2/net/mpugw/config', payload: { value: v.gw }})
        } catch (e) {
            console.log('save net err:', e)
        }

        setModGw(false);
    }

    return (
        <>
            <Prompt message={location => "修改未保存, 是否确认离开?"} when={modNet || modGw} />
            <Collapse defaultActiveKey={["1", "2"]}>
                <Collapse.Panel header="业务网络配置" key="1">
                    <Form form={lanform} labelCol={{ span: 2 }} wrapperCol={{ span: 12 }} labelAlign='left'
                        onValuesChange={() => setModNet(true)} style={{ width: 800 }}>
                        <Form.Item label='IP 地址'>
                            <Space>
                                <Form.Item name='lan' noStyle rules={[regxRule]}>
                                    <Input allowClear placeholder='请输入组网地址' autoComplete='off' maxLength={20} style={{ width: 300 }} />
                                </Form.Item>
                                <Popconfirm title="此操作会导致主控重启，是否确认?" okText="确认" cancelText="取消" onConfirm={handleNetSaved}>
                                    <Button type='primary'>保存</Button>
                                </Popconfirm>
                                
                            </Space>
                        </Form.Item>
                    </Form>
                    <Form form={gwform} labelCol={{ span: 2 }} wrapperCol={{ span: 12 }} labelAlign='left'
                        onValuesChange={() => setModGw(true)} style={{ width: 800 }}>
                        <Form.Item label='默认网关'>
                            <Space>
                                <Form.Item name='gw' noStyle rules={[regxRule]}>
                                    <Input allowClear placeholder='请输入网关地址' autoComplete='off' maxLength={20} style={{ width: 300 }} />
                                </Form.Item>
                                <Popconfirm title="此操作会导致主控重启，是否确认?" okText="确认" cancelText="取消" onConfirm={handleGwSaved}>
                                    <Button type='primary'>保存</Button>
                                </Popconfirm>
                            </Space>
                        </Form.Item>
                    </Form>
                </Collapse.Panel>
                <Collapse.Panel header="主控网络配置" key="2">
                    <Card style={{ width: '100%' }} tabList={tabList} activeTabKey={actTab} onTabChange={key => { cancel(); setActTab(key) }}>
                        <Form form={form} component={false}>
                            <Table bordered size='small'
                                dataSource={data}
                                components={components}
                                columns={mergedColumns}
                                pagination={{ 
                                    size: 'default',
                                    onChange: cancel,
                                }}
                            />
                        </Form>
                    </Card>
                </Collapse.Panel>
            </Collapse>
        </>
    );
}

export default TcpIp
