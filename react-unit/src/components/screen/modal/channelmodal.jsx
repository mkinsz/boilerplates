import React from 'react';
import { Modal, Space, Tree, Row, Input, Col, Checkbox, InputNumber, Form, Button, Table, Card } from 'antd';
import difference from 'lodash/difference';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { toTop, toBottom, toUp, toDown } from '../../../utils'
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash'

import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'
import { ReactComponent as Svg_Folder } from '@/assets/public/folder.svg'
import { ReactComponent as Svg_FolderOpen } from '@/assets/public/folder-open.svg'

import * as ws from '../../../services'

const isChecked = (selectedKeys, eventKey) => {
    return selectedKeys.indexOf(eventKey) !== -1;
};

const generateTree = (treeNodes = [], checkedKeys = []) => {
    return treeNodes.map(({ children, ...props }) => {
        const node = { ...props, disabled: checkedKeys.includes(props.key) }
        if (children) node.children = generateTree(children, checkedKeys)
        return node;
    });
};

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

const filterRecursive = (list, ret = []) => {
    console.log("Filter: ", list, ret)
    list.map(m => {
        if (ret.length < 64) {
            if (m.isLeaf) ret.push(m)
            else if (m.children) filterRecursive(m.children)
            console.log('Recursive: ', ret)
        }
    })
}

const buildGroupTree = (nb, bs) => {
    const ns = bs.filter(m => m.parentid == nb.id)
    const vs = bs.filter(m => m.parentid != nb.id)
    ns.reverse().map(m => {
        if (nb.children) {
            const b = nb.children.find(n => n.id == m.id)
            if (!b) nb.children.unshift({ ...m, key: m.id, title: m.name })
        }
        buildGroupTree(m, vs)
    })
}

const updateSingleTreeData = (list, id, data) => {
    return list.map(node => {
        if (node.id === id)
            return { ...node, ...data };
        if (node.children)
            return { ...node, children: updateSingleTreeData(node.children, id, data) };
        return node;
    });
}

const buildRes = (node, list = []) => {
    if (!node || !list.length) return undefined

    const nlist = list.filter(m => m.parentid == node.id)
    if (!nlist.length) return undefined;

    const elist = list.filter(m => m.parentid != node.id)
    return nlist.map(m => {
        const children = buildRes(m, elist)
        const ret = { ...m, key: uuidv4(), title: m.name, interval: 5 }
        children && (ret.children = children)
        return ret;
    })
}

const updateTreeData = (list, key, datas) => {
    return list.map(node => {
        if (node.key === key) {
            let children = []
            if (node.children) {
                children = [...node.children]
                const last = children[children.length - 1]
                if (last && last.id == 'loading') children.pop();
            }

            const pendings = []
            datas.map(m => {
                if (!children.find(n => n.id == m.id)) {
                    pendings.push({
                        ...m, key: String(m.id), title: m.name, isLeaf: true, interval: 5,
                        icon: <Svg_Round style={{width: 20,height:20, fill: m.online ? '#53d81f' : '#999999' }} />
                    })
                }
            })

            children = children.concat(pendings)

            const length = children.filter(m => m.isLeaf).length
            if (datas.length == 8) children.push({
                key: uuidv4(), id: 'loading', umtid: node.umtid, checkable: false,
                length, groupid: node.id, isLeaf: true, title: "加载更多..."
            })
            return { ...node, children };
        } else if (node.children)
            return { ...node, children: updateTreeData(node.children, key, datas) };

        return node;
    });
}

export default props => {
    const [data, setData] = React.useState([])
    const [rdata, setRdata] = React.useState([])

    const [checkedKeys, setCheckedKeys] = React.useState([])
    const [checkedNodes, setCheckedNodes] = React.useState([])
    const [selectedKeys, setSelectedKeys] = React.useState([])

    const [disabled, setDisabled] = React.useState(false)
    const [interval, setInterval] = React.useState(5)

    const [form] = Form.useForm()
    const dispatch = useDispatch()

    const { wdata, visible, onCancel, onConfirm } = props

    const vins = useSelector(({ mspsDev }) => mspsDev.vins)
    const groups = useSelector(({ mspsDev }) => mspsDev.groups)
    const umttree = useSelector(({ mspsDev }) => mspsDev.umttree)
    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.umts)
    const chnpoll = useSelector(({ mspsSch }) => mspsSch.chnpoll)

    React.useEffect(() => {
        if (!visible) return;
        const { id, sceneid, tvid } = wdata
        const payload = { id, sceneid, tvid }
        dispatch({ type: '/msp/v2/windows/poll/param/query', payload })
        dispatch({ type: '/msp/v2/windows/pollmem/param/query', payload })
    }, [visible])

    React.useEffect(() => {
        setRdata(chnpoll.mems.map(m => ({
            key: m.id, ...m
        })))

        form.setFieldsValue({ 'keep': chnpoll.param.keep, 'check': !!chnpoll.param.keep })
    }, [chnpoll])

    React.useEffect(() => {
        const groupData = { key: '0-1', id: -1 >>> 0, title: '自定义分组', children: [], checkable: false }
        buildGroupTree(groupData, Object.values(groups))

        const localData = { title: '模拟信号', key: '0-2', checkable: false }
        localData.children = Object.values(vins).map(m => ({
            ..._.cloneDeep(m), key: m.id, title: m.name, interval: 5,
            icon: <Svg_Round style={{ width: 20,height:20, fill: m.online ? '#53d81f' : '#bbbbbb' }} />, isLeaf: true
        }))

        const umts = Object.values(nets).filter(m => m.type == 2).
            map(m => ({ ...m, title: m.name, key: m.id, checkable: false, children: [] }))
        if (!umts.length) return;
        const netData = umts[0]
        netData.children = umttree

        setData([groupData, localData, netData])
    }, [vins, groups, nets, umttree])

    const handleLoadingMore = (umtid, groupid, offset) => {
        dispatch({ type: '/msp/v2/chn/umt/chn/query', payload: { id: umtid, sn: groupid, offset } })
    }

    const handleLoadData = async node => {
        const msg = { payload: { id: node.id, offset: 0 } }
        if (node.umtid) { msg.type = '/msp/v2/chn/umt/chn/query', msg.payload.id = node.umtid, msg.payload.sn = node.id }
        else if (node.nextid) msg.type = '/msp/v2/chn/group/mem/query'
        else return;

        dispatch(msg)
        await ws.receive()
    }

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const vs = await form.validateFields();
            const { id, sceneid, tvid } = wdata
            const beid = { id, sceneid, tvid }
            dispatch({ type: '/msp/v2/windows/poll/param/config', payload: { mems: rdata, beid, param: { keep: vs.keep, issame: false, interval: 0 } } })
            dispatch({ type: '/msp/v2/windows/pollmem/start/add', payload: { mems: rdata, beid } })
            dispatch({ type: '/msp/v2/windows/pollmem/stop/add', payload: beid })
            if (vs.start) {
                dispatch({ type: '/msp/v2/windows/poll/start/config', payload: beid })
                props.onPolledStart();
            }
            onConfirm()
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };

    const handleSetInterval = () => {
        const ndata = [...rdata]
        ndata.map(m => m.interval = interval)
        setRdata(ndata)
    }

    const tableColumns = [
        {
            dataIndex: 'name',
            title: '名称',
            render: text => <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{text}</div>,
        },
        {
            dataIndex: 'interval',
            title: '轮巡间隔',
            width: '30%',
            editable: true,
        }
    ];

    const handleMove = type => {
        const index = rdata.findIndex(m => m.id == selectedKeys[0])
        if (index == -1) return;

        const ndata = [...rdata]
        switch (type) {
            case 'up': toUp(ndata, index); break;
            case 'top': toTop(ndata, index); break;
            case 'down': toDown(ndata, index); break;
            case 'bottom': toBottom(ndata, index); break;
        }
        setRdata(ndata)
    }

    const handleRowSave = row => {
        const ndata = [...rdata]
        const index = ndata.findIndex(m => m.id == row.id)
        if (index > -1) {
            ndata[index] = { ...row }
        }
        setRdata(ndata)
    }

    const HandleIcon = props => {
        const { id, isLeaf, expanded, data } = props
        if (id == 'loading') return <></>
        if (isLeaf) return <Svg_Round style={{width: 20,height:20, fill: data.online ? '#53d81f' : '#999999' }} />
        return expanded ? <Svg_FolderOpen style={{ width: 20,height:20 }}/> : <Svg_Folder style={{ width: 20,height:20 }}/>
    }

    const rowSelection = {
        onSelectAll(selected, selectedRows) {
            setSelectedKeys(selectedRows.map(m => m.key))
        },
        onSelect(record, selected, selectedRows, nativeEvent) {
            setSelectedKeys(selectedRows.map(m => m.key))
        },
        selectedRowKeys: selectedKeys,
    };

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const columns = tableColumns.map(col => {
        if (!col.editable) return col;

        return {
            ...col,
            onCell: record => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                name: col.name,
                handleSave: handleRowSave,
            }),
        };
    });

    const handleItemSelect = (keys, nodes) => {
        setCheckedKeys(keys)
        const rets = [];
        nodes.map(m => m.isLeaf && rets.push(m))
        setCheckedNodes(rets)
    }

    const handleImport = () => {
        const ndata = [...rdata]
        checkedNodes.map(m => {
            if (-1 == ndata.findIndex(n => n.id == m.id))
                ndata.push({ key: m.id, id: m.id, interval: 5, name: m.name })
        })
        setRdata(ndata)
    }

    const handleExport = () => {
        const ndata = [...rdata]
        setSelectedKeys([])
        selectedKeys.map(m => {
            const index = ndata.findIndex(n => n.id == m)
            if (index > -1) ndata.splice(index, 1)
        })
        setRdata(ndata)
    }

    return (
        <Modal
            title="通道轮巡配置"
            okText="确认"
            cancelText="取消"
            centered
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            style={{ minWidth: 800 }} >

            <Space>
                <Card size="small" title="通道" style={{ width: 350 }}>
                    <div style={{ height: 400, overflow: 'auto' }}>
                        <Tree showIcon blockNode checkable // checkStrictly
                            icon={HandleIcon}
                            checkedKeys={checkedKeys}
                            loadData={handleLoadData}
                            treeData={data}
                            onCheck={(checkedKeys, { checkedNodes: nodes }) => {
                                handleItemSelect(checkedKeys, nodes);
                            }}
                            onSelect={(selectedKeys, { selectedNodes: nodes, node: { selected, key, id, groupid, umtid, length, children } }) => {
                                console.log("Select: ", selected, key, id, groupid, umtid, length)
                                if (id == 'loading') {
                                    !selected && handleLoadingMore(umtid, groupid, length)
                                }
                            }}
                            style={{ whiteSpace: 'nowrap', transition: '0s' }}
                        />
                    </div>
                </Card>
                <Space direction='vertical'>
                    <Button icon={<RightOutlined />} onClick={handleImport}></Button>
                    <Button icon={<LeftOutlined />} onClick={handleExport}></Button>
                </Space>
                <Card size="small" title="成员" bodyStyle={{ paddingLeft: 0, paddingRight: 0 }} extra={<Space>
                    <Button size='small' disabled={!selectedKeys.length} onClick={() => handleMove('up')}>上移</Button>
                    <Button size='small' disabled={!selectedKeys.length} onClick={() => handleMove('down')}>下移</Button>
                    <Button size='small' disabled={!selectedKeys.length} onClick={() => handleMove('top')}>置顶</Button>
                    <Button size='small' disabled={!selectedKeys.length} onClick={() => handleMove('bottom')}>置底</Button>
                </Space>} style={{ width: 350 }}>
                    <Table
                        size="small"
                        pagination={false}
                        expandable={false}
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={rdata}
                        components={components}
                        style={{ pointerEvents: disabled ? 'none' : null, height: 400, overflow: 'auto' }}
                    />
                </Card>
            </Space>

            <Row gutter={4} style={{ marginTop: 10, height: 80 }}>
                <Col span={12}>
                    <Form form={form}>
                        <Form.Item noStyle >
                            <Form.Item name="check" valuePropName='checked' style={{ display: 'inline-block' }}><Checkbox>轮巡时长(s):</Checkbox></Form.Item>
                            <Form.Item name='keep' style={{ display: 'inline-block' }}><InputNumber min={1} max={7200}/></Form.Item>
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