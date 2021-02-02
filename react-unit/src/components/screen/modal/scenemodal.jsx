import React, { useState, useEffect } from 'react';
import { Modal, Table, Space, Form, Button, List, Transfer, Input, Checkbox, InputNumber, Row, Col, Popconfirm, message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import difference from 'lodash/difference';
import '../style/scenemodal.less'

const layout = {
    labelCol: {
        span: 3,
    },
    wrapperCol: {
        span: 20,
    },
};

const swap = (a, i, j) => {
    a[i] = a.splice(j, 1, a[i])[0]
}

const toTop = (a, i) => {
    if (i) a.unshift(a.splice(i, 1)[0])
}

const toBottom = (a, i) => {
    a.push(a.splice(i, 1)[0])
}

const toUp = (a, i) => {
    if (i) a[i] = a.splice(i - 1, 1, a[i])[0]
    else a.push(a.shift())
}

const toDown = (a, i) => {
    if (i != a.length - 1) a[i] = a.splice(i + 1, 1, a[i])[0];
    else a.unshift(a.splice(i, 1)[0])
}

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
            <Form.Item style={{ margin: 0 }} name={dataIndex}
                rules={[{ required: true, message: `请输入${title}...` }]}>
                <Input ref={inputRef} maxLength={20} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
                <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
                    {children}
                </div>
            );
    }

    return <td {...restProps}>{childNode}</td>;
};

const SceneNewModal = props => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const { visible, onCancel, onConfirm } = props

    useEffect(() => {
        if (visible) form.resetFields();
    }, [visible])

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const datas = await form.validateFields()
            dispatch({ type: '/msp/v2/schemes/save', payload: { op: 0, name: datas.name, tvid: props.tvid } })
            onConfirm();
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    return (
        <Modal centered title="新建场景" okText="确认" cancelText="取消" getContainer={props.parentRef.current}
            visible={visible} onCancel={onCancel} onOk={handleSubmit}>
            <Form form={form} {...layout}>
                <Form.Item label="名称" name='name'
                    rules={[
                        { required: true, message: '请输入场景名称...' },
                        {
                            validator: (_, value) => {
                                const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                                if(!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                                let len = 0;
                                Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                                return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                            },
                        }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

const SceneSaveasModal = props => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const { visible, onCancel, onConfirm } = props

    useEffect(() => {
        if (visible) form.resetFields();
    }, [visible])

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const datas = await form.validateFields()
            dispatch({ type: '/msp/v2/schemes/save', payload: { op: 4, name: datas.name, tvid: props.tvid, schid: props.schid } })
            onConfirm();
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    return (
        <Modal centered title="场景另存为" okText="确认" cancelText="取消" getContainer={props.parentRef.current}
            visible={visible} onCancel={onCancel} onOk={handleSubmit}>
            <Form form={form} {...layout}>
                <Form.Item label="名称" name="name" rules={[
                    { required: true, message: '请输入场景名称' },
                    {
                        validator: (_, value) => {
                            const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                            if(!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                            let len = 0;
                            Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                            return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                        },
                    }]}><Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

const SceneConfigModal = props => {
    const [data, setData] = useState([])
    const [selectedKey, setSelectedKey] = useState();

    const dispatch = useDispatch();
    const curschm = useSelector(({ mspsSch }) => mspsSch.curschm)

    const { schemes, visible, onCancel, onConfirm } = props

    useEffect(() => {
        setData(schemes.map(m => ({ ...m, key: m.id })))
    }, [schemes])

    const handleSubmit = e => {
        e.preventDefault();
        try {
            dispatch({ type: '/msp/v2/schemes/config', payload: { tvid: props.tvid, schemes: data, isend: false } })
            dispatch({ type: '/msp/v2/schemes/config', payload: { tvid: props.tvid, schemes: data, isend: true } })
            onConfirm();
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    const handleDelete = key => {
        if (key == curschm.id) {
            message.warning('删除场景失败，该场景正在使用中...');
            return;
        }
        setData([...data].filter(m => m.key !== key))
        dispatch({ type: '/msp/v2/schemes/delete', payload: { id: key, tvid: props.tvid } })
    }

    const handleSelectChange = keys => {
        console.log('selectedRowKeys changed: ', keys);
        if (keys.length == 1) setSelectedKey(keys[0]);
        else if (keys.length > 1) setSelectedKey(keys[keys.length - 1]);
        else setSelectedKey()
    };

    const columns = [
        {
            title: 'ID',
            key: 'id',
            dataIndex: 'id'
        },
        {
            title: '名称',
            key: 'name',
            dataIndex: 'name',
            editable: true,
            width: '50%'
        },
        {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) =>
                data.length >= 1 ? (
                    <Popconfirm title="是否确认删除?" onConfirm={() => handleDelete(record.key)}>
                        <a>删除</a>
                    </Popconfirm>
                ) : null
        },
    ];


    const handleUp = () => {
        const index = data.findIndex(m => m.key == selectedKey)
        if (index > -1) {
            const ndata = [...data]
            toUp(ndata, index)
            setData(ndata)
        }
    }

    const handleDown = () => {
        const index = data.findIndex(m => m.key == selectedKey)
        if (index > -1) {
            const ndata = [...data]
            toDown(ndata, index)
            setData(ndata)
        }
    }

    const handleTop = () => {
        const index = data.findIndex(m => m.key == selectedKey)
        if (index > -1) {
            const ndata = [...data]
            toTop(ndata, index)
            setData(ndata)
        }
    }

    const handleBottom = () => {
        const index = data.findIndex(m => m.key == selectedKey)
        if (index > -1) {
            const ndata = [...data]
            toBottom(ndata, index)
            setData(ndata)
        }
    }

    const title = () => <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        场景
        <Space>
            <Button size='small' onClick={handleUp} disabled={!selectedKey}>上移</Button>
            <Button size='small' onClick={handleDown} disabled={!selectedKey}>下移</Button>
            <Button size='small' onClick={handleTop} disabled={!selectedKey}>置顶</Button>
            <Button size='small' onClick={handleBottom} disabled={!selectedKey}>置底</Button>
        </Space>
    </div>

    const rowSelection = {
        hideSelectAll: true,
        selectedRowKeys: [selectedKey],
        onChange: handleSelectChange,
    };

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const handleRowSave = row => {
        const newData = [...data];
        if(newData.find(m => m.name == row.name && m.key != row.key)) {
            message.warning('存在重复场景名称...')
            return;
        }

        const index = newData.findIndex(item => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData)
    }

    const ncolumns = columns.map(col => {
        if (!col.editable) return col;

        return {
            ...col,
            onCell: record => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave: handleRowSave,
            }),
        };
    });

    return (
        <Modal
            centered
            title="场景管理"
            okText="确认"
            cancelText="取消"
            visible={visible}
            onCancel={onCancel}
            getContainer={props.parentRef.current}
            onOk={handleSubmit} style={{ maxHeight: 600 }}>
            <Table
                size="small"
                bordered
                title={title}
                dataSource={data}
                columns={ncolumns}
                pagination={false}
                components={components}
                rowSelection={rowSelection}
                rowClassName={() => 'editable-row'}
                scroll={{ y: 400 }}
                onRow={({ key, disabled: itemDisabled }) => ({
                    onClick: () => {
                        if (itemDisabled) return;
                        setSelectedKey(key);
                    },
                })}
            />
        </Modal>
    );
}

// Customize Table Transfer
const TableTransfer = ({ leftColumns, rightColumns, onRowSave, ...restProps }) => (
    <Transfer {...restProps} showSelectAll={false} className="tree-transfer">
        {({
            direction,
            filteredItems,
            onItemSelectAll,
            onItemSelect,
            selectedKeys: listSelectedKeys,
            disabled: listDisabled,
        }) => {
            const rowSelection = {
                getCheckboxProps: item => ({ disabled: listDisabled || item.disabled }),
                onSelectAll(selected, selectedRows) {
                    const treeSelectedKeys = selectedRows
                        .filter(item => !item.disabled)
                        .map(({ key }) => key);
                    const diffKeys = selected
                        ? difference(treeSelectedKeys, listSelectedKeys)
                        : difference(listSelectedKeys, treeSelectedKeys);
                    onItemSelectAll(diffKeys, selected);
                },
                onSelect({ key }, selected) {
                    onItemSelect(key, selected);
                },
                selectedRowKeys: listSelectedKeys,
            };

            const components = {
                body: {
                    row: EditableRow,
                    cell: EditableCell,
                },
            };

            const columns = (direction === 'left' ? leftColumns : rightColumns).map(col => {
                if (!col.editable) return col;

                return {
                    ...col,
                    onCell: record => ({
                        record,
                        editable: col.editable,
                        dataIndex: col.dataIndex,
                        title: col.title,
                        handleSave: onRowSave,
                    }),
                };
            });

            return (
                <Table
                    size="small"
                    columns={columns}
                    pagination={false}
                    rowClassName={() => 'editable-row'}
                    rowSelection={rowSelection}
                    dataSource={filteredItems}
                    components={components}
                    style={{ pointerEvents: listDisabled ? 'none' : null, height: 400, overflow: 'auto' }}
                    onRow={({ key, disabled: itemDisabled }) => ({
                        onClick: () => {
                            if (itemDisabled || listDisabled) return;
                            onItemSelect(key, !listSelectedKeys.includes(key));
                        },
                    })}
                />
            );
        }}
    </Transfer>
);

const leftTableColumns = [
    {
        dataIndex: 'name',
        title: '名称',
    }
];
const rightTableColumns = [
    {
        dataIndex: 'name',
        title: '名称',
    },
    {
        dataIndex: 'interval',
        title: '轮巡间隔',
        width: '50%',
        editable: true,
    }
];

const ScenePollModal = props => {
    const [data, setData] = useState([])
    const [targetKeys, setTargetKeys] = useState([])
    const [selectedKey, setSelectedKey] = useState()
    const [showSearch, setShowSearch] = useState(false)
    const [interval, setInterval] = useState(5)

    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const poll = useSelector(({ mspsSch }) => mspsSch.poll)

    const { visible, tvid, onCancel, onConfirm } = props

    useEffect(() => {
        if (!visible) return;
        dispatch({ type: '/msp/v2/schemes/poll/param/query', payload: { tvid } })
        dispatch({ type: '/msp/v2/schemes/pollmem/param/query', payload: { tvid } })
    }, [visible])

    useEffect(() => {
        if (!visible) return;
        const ndata = props.schemes.map(m => ({ ...m, key: m.id, interval: 5 }))
        const keys = poll.mems.map(m => {
            const index = ndata.findIndex(n => n.id == m.id)
            if (index > -1) ndata.splice(index, 1, { ...ndata[index], interval: m.interval })
            return m.id
        })
        setData(ndata)
        setTargetKeys(keys);

        form.setFieldsValue({ 'keep': poll.param.keep, 'check': !!poll.param.keep })
    }, [poll, props.schemes])

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const vs = await form.validateFields()
            const mems = []
            targetKeys.map(m => {
                const mem = data.find(n => n.id == m);
                if (mem) mems.push(mem)
            })
            dispatch({ type: '/msp/v2/schemes/poll/param/config', payload: { mems, tvid, param: { keep: vs.keep, issame: false, interval: 0 } } })
            dispatch({ type: '/msp/v2/schemes/pollmem/stop/add', payload: { tvid } })
            if (vs.start) dispatch({ type: '/msp/v2/schemes/poll/start/config', payload: { tvid } })
            onConfirm();
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    const handleChange = (nextTargetKeys, direction, moveKeys) => {
        if (nextTargetKeys.length > 16) {
            message.warning('场景轮询最多16个...')
            return;
        }
        setTargetKeys(nextTargetKeys)
    };

    const handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        if (targetSelectedKeys.length == 1)
            setSelectedKey(targetSelectedKeys[0]);
        else if (targetSelectedKeys.length > 1)
            setSelectedKey(targetSelectedKeys[targetSelectedKeys.length - 1]);
        else
            setSelectedKey()
    };

    const handleScroll = (direction, e) => {
        console.log('direction:', direction);
        console.log('target:', e.target);
    };

    const handleRowSave = row => {
        const newData = [...data];
        const index = newData.findIndex(item => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData)
    }

    const handleUp = () => {
        const index = targetKeys.findIndex(m => m == selectedKey)
        if (index > -1) {
            const keys = [...targetKeys]
            toUp(keys, index)
            setTargetKeys(keys)
        }
    }

    const handleDown = () => {
        const index = targetKeys.findIndex(m => m == selectedKey)
        if (index > -1) {
            const keys = [...targetKeys]
            toDown(keys, index)
            setTargetKeys(keys)
        }
    }

    const handleTop = () => {
        const index = targetKeys.findIndex(m => m == selectedKey)
        if (index > -1) {
            const keys = [...targetKeys]
            toTop(keys, index)
            setTargetKeys(keys)
        }
    }

    const handleBottom = () => {
        const index = targetKeys.findIndex(m => m == selectedKey)
        if (index > -1) {
            const keys = [...targetKeys]
            toBottom(keys, index)
            setTargetKeys(keys)
        }
    }

    const handleSetInterval = () => {
        setData(origin => origin.map(m => {
            const index = targetKeys.findIndex(n => n == m.key)
            if (index > -1) m.interval = interval;
            return m;
        }))
    }

    return (
        <Modal
            centered
            title="场景轮巡配置"
            okText="确认"
            cancelText="取消"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            getContainer={props.parentRef.current}
            style={{ minWidth: 800 }}>
            <TableTransfer
                dataSource={data}
                titles={['场景', <Space>
                    <Button size='small' disabled={!selectedKey} onClick={handleUp}>上移</Button>
                    <Button size='small' disabled={!selectedKey} onClick={handleDown}>下移</Button>
                    <Button size='small' disabled={!selectedKey} onClick={handleTop}>置顶</Button>
                    <Button size='small' disabled={!selectedKey} onClick={handleBottom}>置底</Button>
                </Space>]}
                targetKeys={targetKeys}
                showSearch={showSearch}
                onChange={handleChange}
                onScroll={handleScroll}
                onSelectChange={handleSelectChange}
                onRowSave={handleRowSave}
                filterOption={(inputValue, item) =>
                    item.title.indexOf(inputValue) !== -1 || item.tag.indexOf(inputValue) !== -1
                }
                leftColumns={leftTableColumns}
                rightColumns={rightTableColumns}
            />
            <Row gutter={4} style={{ marginTop: 10, height: 80 }}>
                <Col span={12}>
                    <Form form={form}>
                        <Form.Item noStyle >
                            <Form.Item name="check" valuePropName='checked' style={{ display: 'inline-block' }}><Checkbox>轮巡时长(s):</Checkbox></Form.Item>
                            <Form.Item name='keep' style={{ display: 'inline-block' }}><InputNumber min={1} max={7200} /></Form.Item>
                        </Form.Item>
                        <Form.Item name="start" valuePropName='checked'><Checkbox>完成后开始</Checkbox></Form.Item>
                    </Form>
                </Col>
                <Col span={12}>
                    <Row gutter={0}>
                        <Col span={12} style={{ textAlign: 'center', lineHeight: '32px' }}>设置轮巡间隔(5-7200s):</Col>
                        <Col span={12}>
                            <Space>
                                <InputNumber min={5} max={7200} defaultValue={interval} value={interval} onChange={v => setInterval(v)} />
                                <Button onClick={handleSetInterval}>设置</Button>
                            </Space>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Modal>
    );
}

export { SceneNewModal, SceneSaveasModal, ScenePollModal, SceneConfigModal }