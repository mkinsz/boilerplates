import React from 'react';
import { Table, Button, Upload, Badge, Modal, Popconfirm, Form, Input, Select, message, Space } from 'antd'
import { useDispatch, useSelector } from 'react-redux';
import { UploadOutlined } from '@ant-design/icons';
import './index.less'

const { Option } = Select;

const EditableContext = React.createContext();

const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = React.useState(false);
    const inputRef = React.useRef();
    const form = React.useContext(EditableContext);
    React.useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };

    const save = async e => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[{ required: true, message: `${title} is required.` }]}
            >
                <Input ref={inputRef} maxLength={20} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
                <div className="editable-cell-value-wrap"
                    style={{ paddingRight: 24 }}
                    onClick={toggleEdit}
                >{children}</div>
            );
    }

    return <td {...restProps}>{childNode}</td>;
};

const components = {
    body: {
        row: EditableRow,
        cell: EditableCell,
    },
};

const MassModal = props => {
    const [form] = Form.useForm()
    const [visible, setVisible] = React.useState(false)
    const dispatch = useDispatch();

    const handleClick = () => {
        setVisible(true)
    }

    const handleCancel = () => {
        setVisible(false)
    }

    const handleConfirm = async e => {
        e.preventDefault();
        try {
            const row = await form.validateFields();
            dispatch({ type: '/msp/v2/pc/config', payload: { ...row } })
            setVisible(false)
            form.resetFields();
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    const formLayout = {
        labelCol: { span: 5 },
        wrapperCol: { span: 16 },
    };

    return (<>
        <Button type='primary' style={props.style} onClick={handleClick}>{props.children}</Button>
        <Modal visible={visible} title="新建"
            okText="确认" cancelText="取消" onCancel={handleCancel} onOk={handleConfirm}>
            <Form form={form} {...formLayout}>
                <Form.Item name='name' label="名称" rules={[
                    { required: true, message: '请输入名称' },
                    {
                        validator: (_, value) => {
                            const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                            if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                            let len = 0;
                            Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                            return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                        },
                    }]}><Input /></Form.Item>
                <Form.Item name='ip' label="IP" rules={[{ required: true, message: '请输入IP' }]}><Input maxLength={20} /></Form.Item>
                <Form.Item name='port' label="端口" rules={[{ required: true, message: '请输入端口号' }]}><Input maxLength={20} /></Form.Item>
            </Form>
        </Modal>
    </>
    );
};

let st, kt = null;
let token = null;

const send = msg => {
    if (!st || WebSocket.OPEN != st.readyState) return;
    if (msg.head.uri != '/p1010/v1/pc/token')
        token && (msg.head.token = token)

    st.send(JSON.stringify(msg));

    switch (msg.head.uri) {
        case '/msp/v2/authen/alive': break
        default: console.log('send: ', msg);
    }
}

const reducer = (state, action) => {
    switch (action.type) {
        case '/msp/v2/authen/alive': return state;
        case '/p1010/v1/pc/token': {
            send({ head: { uri: action.type } });
            return state;
        }
        case '/p1010/v1/pc/token/ack': {
            token = action.head.token;

            send({ head: { uri: '/p1010/v1/pc/bd/query', token: action.head.token } })
            // send({ head: { uri: '/p1010/v1/pc/bd/upgrade/config', token: action.head.token }})
            return state;
        }
        case '/p1010/v1/pc/bd/query': {
            send({ head: { uri: action.type } })
            return state;
        }
        case '/p1010/v1/pc/bd/query/ack': {
            const cnt = {}
            if (!action.body) return state;
            const { bdls } = action.body;
            if (!bdls) return state;
            bdls.map(m => cnt[m.id] = m)
            return { ...state, cnt };
        }
        case '/p1010/v1/pc/bd/modify': {
            const { payload } = action;
            send({ head: { uri: action.type }, body: payload });

            const cnt = { ...state.cnt }
            cnt[payload.id] = payload;
            return { ...state, cnt }
        }
        case '/p1010/v1/pc/bd/modify/ack': {
            return state;
        }
        case '/p1010/v1/pc/bd/config': {
            const { payload } = action;
            send({ head: { uri: action.type }, body: { ls: [payload.id] } });
            return state;
        }
        case '/p1010/v1/pc/bd/config/ack': {
            return state;
        }
        case '/p1010/v1/pc/bd/upgrade/config': {
            send({ head: { uri: action.type } });
            return state;
        }
        case '/p1010/v1/pc/bd/upgrade/config/ack': {
            // console.log('BD Upgrade Path:', action.body)
            return { ...state, upload: action.body.path }
        }
        case '/p1010/v1/pc/bd/upgrade/start/config': {
            const { payload } = action;
            send({ head: { uri: action.type }, body: payload });
            return state;
        }
        case '/p1010/v1/pc/bd/upgrade/start/config/ack': {
            return state;
        }
        case '/p1010/v1/pc/bd/upgrade/updata': {
            return state;
        }
        default: return state;
    }
}

const Mass = () => {
    const dispatch = useDispatch();
    const mass = useSelector(({ mspsCfg }) => mspsCfg.mass)
    const [data, setData] = React.useState([])
    const [boards, setBoards] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [expandRowKey, setExpandRowKey] = React.useState()

    const [nmc, _dispatch] = React.useReducer(reducer, {})

    React.useEffect(() => {
        dispatch({ type: '/msp/v2/pc/query' })
        return () => {
            release();
        }
    }, [])

    React.useEffect(() => {
        setData(Object.values(mass.pcs.cnt).map(m => ({ key: m.id, ...m })))
    }, [mass.pcs])

    React.useEffect(() => {
        nmc.cnt && setBoards(Object.values(nmc.cnt).map(m => ({ key: m.id, ...m })))
    }, [nmc.cnt])

    React.useEffect(() => {
        if (!boards.length) setTimeout(setLoading(false), 3)
    }, [boards])

    const init = (url, time = 0) => {
        const proto = window.location.protocol == 'http:' ? 'ws://' : 'wss://'
        window.WebSocket = window.WebSocket || window.MozWebSocket;
        if (!window.WebSocket) { // 检测浏览器支持  
            console.log('Error: WebSocket is not supported .');
            return;
        }
        st = new WebSocket(proto + url)
        st.onmessage = e => recv(e.data)
        st.onclose = e => {
            st = null;
            clearInterval(kt)
        }
        st.onerror = e => st && console.log('ws err: ', e)
        return new Promise((resolve) => {
            st.onopen = () => {
                console.log('websocket open...')
                kt = setInterval(() => _dispatch({ type: 'MSP_KEEP_ALIVE' }), 5000);
                resolve();
            };

            !!time && setTimeout(() => {
                resolve('do not receive message')
            }, time);
        })
    }

    const recv = async blob => {
        let data = await (new Response(blob)).text()
        data = JSON.parse(data)
        const msg = { ...data, ...data.head, type: data.head.uri }

        // Silence
        switch (msg.type) {
            case '/msp/v2/authen/alive': return;
            default: console.log('recv: ', msg);
        }

        // msg.err.length && console.log(`错误代码: ${msg.err}`)
        _dispatch(msg)
    }

    const release = () => {
        if (!st) return;
        st.close()
        st = null;
        clearInterval(kt)
    }

    const expandedRowRender = () => {

        const columns = [
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: '别名', dataIndex: 'name', key: 'name', editable: true },
            { title: '槽位号', dataIndex: 'slot', key: 'slot' },
            {
                title: '在位状态', dataIndex: 'online', key: 'online',
                render: text => <span><Badge status={text ? "success" : "warning"} />{text ? '在位' : '离位'}</span>
            },
            {
                title: '上电状态', dataIndex: 'power',
                render: text => <span><Badge status={text ? "success" : "warning"} />{text ? '上电' : '下电'}</span>
            },
            {
                title: '操作',
                dataIndex: 'operation',
                key: 'operation',
                render: (text, record) => <Button onClick={() =>
                    _dispatch({ type: '/p1010/v1/pc/bd/config', payload: { id: record.id } })}>重启</Button>,
            },
        ];

        const ncolumns = columns.map(col => {
            if (!col.editable) return col;
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: row => {
                        delete row.key
                        _dispatch({ type: '/p1010/v1/pc/bd/modify', payload: { ...row } })
                    }
                }),
            };
        });

        return <Table
            size='small'
            columns={ncolumns}
            dataSource={boards}
            components={components}
            loading={loading}
            pagination={false} />
    };

    const handleDelete = key => {
        dispatch({ type: '/msp/v2/pc/delete', payload: { id: key } })
        key == expandRowKey && setExpandRowKey()
    };

    const handleSave = row => {
        delete row.key
        dispatch({ type: '/msp/v2/pc/config', payload: { ...row } })
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: '别名', dataIndex: 'name', key: 'name', editable: true },
        { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
        { title: '端口', dataIndex: 'port', key: 'port' },
        { title: '升级进度', dataIndex: 'upgradeNum', key: 'upgradeNum' },
        { title: '升级状态', dataIndex: 'creator', key: 'creator' },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) => (
                <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                    <Button>删除</Button>
                </Popconfirm>
            ),
        },
    ];

    const handleChange = value => {

    }

    const ncolumns = columns.map(col => {
        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: record => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave: handleSave,
            }),
        };
    });

    const handleExpand = async (expand, record) => {
        if (!expand) {
            setExpandRowKey()
            release();
        } else {
            // record.id
            const url = `${record.ip}:${record.port}`
            await init(url, 100)
            console.log('Mass:', url)
            _dispatch({ type: '/p1010/v1/pc/token' })
            setExpandRowKey(record.key)
            setLoading(true)
        }
    }

    const rowSelection = {
        columnWidth: 40,
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
        onSelect: (record, selected, selectedRows) => {
            console.log(record, selected, selectedRows);
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            console.log(selected, selectedRows, changeRows);
        },
    };

    const uploads = {
        showUploadList: false,
        action: 'http://' + nmc.upload,
        headers: {
            filepath: '/',
        },
        // beforeUpload: () => _dispatch({type: '/p1010/v1/pc/bd/upgrade/config'}),
        onChange({ file, fileList }) {
            if (file.status == 'done') {
                _dispatch({
                    type: '/p1010/v1/pc/bd/upgrade/start/config',
                    payload: {
                        size: file.size,
                        name: file.name,
                    }
                })
                message.success(`${file.name} 上传成功`);
            } else if (file.status === 'error') {
                message.error(`${file.name} 上传失败`);
            }
        },
    };

    const handleUploadClick = () => {
        _dispatch({ type: '/p1010/v1/pc/bd/upgrade/config' })
    }

    return <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <MassModal>添加服务器</MassModal>
            <Space>
                <Select defaultValue={0} style={{ width: 120 }} onChange={handleChange}>
                    <Option value={0}>交换板</Option>
                    <Option value={1}>电源板</Option>
                    <Option value={2}>P1010_1</Option>
                    {/* <Option value={3}>P1010_2</Option> */}
                    <Option value={4}>风扇板</Option>
                </Select>
                <Upload {...uploads}><Button onClick={handleUploadClick}><UploadOutlined />升级</Button></Upload>
            </Space>
        </div>
        <Table
            className="components-table-demo-nested"
            bordered
            size='small'
            rowClassName={() => 'editable-row'}
            columns={ncolumns}
            dataSource={data}
            onExpand={handleExpand}
            components={components}
            expandable={{ expandedRowRender }}
            rowSelection={rowSelection}
            expandedRowKeys={[expandRowKey]}
        />
    </>
}

export default Mass;