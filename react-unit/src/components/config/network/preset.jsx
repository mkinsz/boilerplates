import React, { useMemo, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Tree, Card, Button, Input, Space, Table, Form, Switch, Modal, message, Tooltip, Popconfirm } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuidv4 } from 'uuid';
import './preset.css'

import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'
import { ReactComponent as Svg_Folder } from '@/assets/public/folder.svg'
import { ReactComponent as Svg_FolderOpen } from '@/assets/public/folder-open.svg'

import * as ws from '../../../services'

const Preset = props => {
    const [chns, setChns] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState([])
    const [checkedNodes, setCheckedNodes] = useState([])
    const [expandKeys, setExpandKeys] = useState([])

    const [row, setRow] = useState()
    const [selectedKey, setSelectedKey] = useState();
    const [visible, setVisible] = useState(false)
    const [selectedChnKeys, setSelectedChnKeys] = useState([]);

    const [search, setSearch] = useState()

    const [form] = Form.useForm();
    const dispatch = useDispatch();

    const searchs = useSelector(({ mspsDev }) => mspsDev.searchs)
    const preset = useSelector(({ mspsCfg: { net } }) => net.preset)
    const details = useSelector(({ mspsCfg: { net } }) => net.details)
    const netdevs = useSelector(({ mspsDev }) => mspsDev.netdevs)
    const umttree = useSelector(({ mspsDev }) => mspsDev.umttree)
    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.umts)

    const seeks = useMemo(() => Object.values(searchs).map(m => ({ key: m.id, ...m })), [searchs])
    const presets = useMemo(() => preset.map((m, i) => ({ ...m, key: m.id, index: i+1 })), [preset])
    const data = useMemo(() => row ? [...presets, row] : presets, [row, presets])

    const rtKey = useMemo(() => uuidv4(), []);

    const seekTreeData = useMemo(() => {
        const isMore = !(seeks.length % 16)

        const skvalues = seeks.map(m => ({ ...m, title: m.name, isLeaf: true }))
        const children = !isMore ? skvalues : skvalues.concat({
            key: 'loadingmore', id: 'loadingmore', isLeaf: true, checkable: false,
            title:'加载更多...'
        })

        seeks.length && setExpandKeys([rtKey])
        return [{ key: rtKey, id: rtKey, title: '搜索', children }]
    }, [seeks])

    useEffect(() => {
        dispatch({ type: '/msp/v2/net/umt/query' })
        dispatch({ type: '/msp/v2/net/media/precall/list/query' })
    }, [])

    //获取详情
    useEffect(() => {
        const ds = Object.values(details)
        setChns(ds.map((m, i) => ({ ...m, key: m.id, index: i + 1, name: `${m.id} (不在线)` })))
        const QUERY_SIZE = 20
        if (ds.length) {
            const num = parseInt(ds.length / QUERY_SIZE);
            const rem = ds.length % QUERY_SIZE;

            for (let i = 0; i < num; i++) {
                const payload = ds.slice(i * QUERY_SIZE, (i + 1) * QUERY_SIZE).map(m => m.id)
                dispatch({ type: '/msp/v2/chn/umt/chn/simple/query', payload })
            }
            if (rem) {
                const payload = ds.slice(-1 * rem).map(m => m.id)
                dispatch({ type: '/msp/v2/chn/umt/chn/simple/query', payload })
            }
        }
    }, [details])

    //获取点位名称
    useLayoutEffect(() => {
        setChns(chns.map(m => ({ ...m, name: netdevs[m.id] ? (netdevs[m.id].alias || `${m.id} (不在线)`) : `${m.id} (不在线)` })))
    }, [netdevs])

    useEffect(() => {
        if ('tmp' != selectedKey)
            dispatch({ type: '/msp/v2/net/media/precall/detail/query', payload: { id: selectedKey } })
    }, [selectedKey])

    useEffect(() => {
        if (!visible) {
            setCheckedKeys([])
            setCheckedNodes([])
        }
    }, [visible])

    useEffect(() => {
        const len = presets.length
        if(row && len) {
            setRow();
            setSelectedKey(presets[len - 1].id)
        }
    }, [preset])

    const net_data = useMemo(() => {
        const umts = Object.values(nets).filter(m => m.type == 2).
            map(m => ({ ...m, title: m.name, key: m.id, checkable: false, children: [] }))
        if (!umts.length) return;
        const netData = umts[0]
        netData.children = umttree
        return netData
    }, [nets, umttree])

    useEffect(() => {
        const umts = Object.values(nets).filter(m => m.type == 2);
        if (!umts.length) return;
        dispatch({ type: '/msp/v2/chn/umt/group/query', payload: { id: umts[0].id } })
    }, [nets])

    const handleChange = (record, checked) => {
        dispatch({ type: '/msp/v2/net/media/precall/modify', payload: { id: record.id, name: record.name, enable: checked } })
    }

    const cols = [
        { title: "编号", dataIndex: "index", key: "index", width: 60 },
        {
            title: "名称", dataIndex: "name", key: "name", width: 120, render: (t, r) =>
                <Tooltip title={t}>
                    <div style={{
                        width: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>{t}</div>
                </Tooltip>
        },
        {
            title: "开/关", dataIndex: "enable", key: "enable", render: (t, r) =>
                <Switch disabled={r.key == 'tmp'} checkedChildren="开" unCheckedChildren="关" checked={t} onChange={c => handleChange(r, c)} />
        },
    ];

    const handleSelected = (id, name) => {
        setSelectedKey(id)
        form.setFieldsValue({ name })
    }

    //预调任务选中
    const rowSelection = {
        columnWidth: 40,
        selectedRowKeys: [selectedKey],
        onSelect: (record, selected, selectedRows) => {
            handleSelected(selected ? record.key : undefined, record.name)
        }
    };
    //预调成员选中
    const chnSelection = {
        columnWidth: 40,
        selectedChnKeys,
        onChange: (keys, rows) => {
            setSelectedChnKeys(keys)
        },
    };
    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
            width: 100
        },
        {
            title: '点位名称',
            dataIndex: 'name',
            key: 'name',
            render: (t, r) => <Tooltip title={t} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} >{t}</Tooltip>
        },
        // {
        //     title: '在线情况',
        //     dataIndex: 'online',
        //     key: 'online',
        //     width: 120,
        //     render: (t, r) => <div>{t ? '在线' : '不在线'}</div>
        // },
    ];
    //新增
    const handleNew = () => {
        const len = data.length
        const nrow = {
            key: 'tmp',
            index: len + 1,
            name: '新建预调',
            enable: 0,
        }
        setChns([])
        setRow(nrow)
        setSelectedKey('tmp')
        form.setFieldsValue(nrow);
    }

    const handleOk = e => {
        const nchns = [...chns]
        checkedNodes.map(m => {
            if (!nchns.find(n => n.id == m.id)) {
                nchns.push({ ...m, key: m.id, index: (1 + nchns.length), name: m.title })
            }
        })
        setChns(nchns)
        setVisible(false)
    };

    const handleCancel = e => {
        setVisible(false)
    };

    const handleLoadMore = useCallback(search => {
        dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: search, offset: Object.keys(searchs).length } })
    }, [searchs])

    //input值发生改变
    const handleValueChange = (changedValues, allValues) => {
        console.log('allValues', allValues);
        console.log('changedValues', changedValues);
        // const { protocol } = allValues
        // if (proto != protocol) {
        //     form.setFieldsValue({ ip: '', slot: null, on: '', off: '', mac: '', mode: 0 })
        //     setProto(protocol)
        // }
    }

    //预调组删除
    const handleDel = () => {
        if (!selectedKey) {
            message.error('请选中要删除的预调分组');
            return;
        }

        selectedKey == 'tmp' ? setRow() :
            dispatch({ type: '/msp/v2/net/media/precall/delete', payload: { id: selectedKey } })
        setSelectedKey()
    }

    const onAdd = () => {
        if (!selectedKey) {
            message.error('请先选择一个预调方案');
            return;
        }
        setVisible(true)
    };

    //预调成员删除
    const onDel = () => {
        if (0 === selectedChnKeys.length) {
            message.error('请选中要删除的预调成员');
            return;
        }
        if (row) {
            setRow()
            setSelectedKey()
        } else dispatch({
            type: '/msp/v2/net/media/precall/mem/modify',
            payload: {
                action: 2, // 预调对象删除
                id: selectedKey,
                chns: selectedChnKeys
            }
        })
        setCheckedNodes([])
        setSelectedChnKeys([])
    }

    const handlePlanSave = async () => {
        if (!selectedKey) {
            message.error('请先选择一个预调方案');
            return;
        }

        const values = await form.validateFields()

        const select = data.find(m => m.key == selectedKey)
        const { enable } = select

        const payload = { enable, chns, name: values.name }
        if (row) {
            if(presets.find(m => m.name == values.name)) {
                message.warning('预案调度名称重复...')
                return;
            }
            payload.chns = chns
            dispatch({ type: '/msp/v2/net/media/precall/add', payload })
        } else {
            payload.id = selectedKey
            dispatch({ type: '/msp/v2/net/media/precall/modify', payload })
            dispatch({
                type: '/msp/v2/net/media/precall/mem/modify',
                payload: {
                    action: 3, // 添加预调对象
                    id: selectedKey,
                    chns: chns
                }
            })
        }

        setCheckedKeys([])
        setCheckedNodes([])
    }

    const handlePlanCancel = () => {
        if (!selectedKey) {
            message.error('请先选择一个预调方案');
            return;
        }

        dispatch({ type: '/msp/v2/net/media/precall/detail/query', payload: { id: selectedKey } })
    }

    const formItemLayout = {
        labelCol: {
            span: 3,
        },
        wrapperCol: {
            span: 19,
        },
    };

    const formTailLayout = {
        labelCol: {
            span: 3,
        },
        wrapperCol: {
            span: 19,
            offset: 3,
        },
    };

    const handleRow = record => {
        return {
            onClick: e => handleSelected(record.key, record.name)
        }
    }

    const handleItemSelect = (keys, nodes) => {
        setCheckedKeys(keys)
        const rets = [];
        nodes.map(m => m.isLeaf && rets.push(m))
        setCheckedNodes(rets)
    }

    const handleIcon = props => {
        const { id, isLeaf, expanded, data } = props
        if (id == 'loading' || id == 'loadingmore') return <></>
        if (isLeaf) return <Svg_Round style={{ width: 20,height:20, fill: data.online ? '#53d81f' : '#999999' }} />
        return expanded ? <Svg_FolderOpen style={{ width: 20,height:20 }}/> : <Svg_Folder style={{ width: 20,height:20 }}/>
    }

    const handleLoadData = async node => {
        const msg = { payload: { id: node.id, offset: 0 } }
        if (node.umtid) { msg.type = '/msp/v2/chn/umt/chn/query', msg.payload.id = node.umtid, msg.payload.sn = node.id }
        else if (node.nextid) msg.type = '/msp/v2/chn/group/mem/query'
        else return;

        dispatch(msg)
        await ws.receive()
    }

    const handleLoadingMore = (umtid, groupid, offset) => {
        dispatch({ type: '/msp/v2/chn/umt/chn/query', payload: { id: umtid, sn: groupid, offset } })
    }

    const handleSearch = value => {
        if (!value) {
            setExpandKeys([])
            dispatch({ type: '/msp/v2/chn/search/config' })
        } else {
            dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: value } })
        }
    }

    const handleSelect = (keys, event) => {
        const { node: { selected, id, groupid, umtid, length } } = event;
        if (id == 'loading') {
            !selected && handleLoadingMore(umtid, groupid, length)
        }else if(id == 'loadingmore') {
            dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: search, offset: seeks.length } })
        }
    }

    const netData = useMemo(() => net_data ? [net_data] : [], [net_data])

    const treeProps = {
        height: 400,
        checkable: true,
        showIcon: true,
        selectable: true,
        draggable: true,
        blockNode: true,
        virtual: true,
        autoExpandParent: true,
        checkedKeys: checkedKeys,
        selectedKeys: checkedKeys,
        icon: handleIcon,
        onCheck: (checkedKeys, { checkedNodes: nodes }) => {
            handleItemSelect(checkedKeys, nodes);
        },
        loadData:handleLoadData,
        onSelect: handleSelect
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: "hidden" }}>
            <Card key='0' title="预调分组" style={{ width: 300, height: '100%', marginRight: 10 }} extra={<Space>
                <Button type='primary' onClick={handleNew}>新建</Button>
                <Popconfirm title="是否删除该预调分组?" disabled={!selectedKey} okText='确定' cancelText='取消' onConfirm={handleDel}>
                    <Button disabled={!selectedKey}>删除</Button>
                </Popconfirm>
            </Space>} bodyStyle={{ padding: 0 }}>
                <Table
                    bordered
                    size='small'
                    rowSelection={rowSelection}
                    dataSource={data}
                    columns={cols}
                    pagination={false}
                    onRow={handleRow}
                    scroll={{ x: 240, y: 700 }}
                />
            </Card>
            <Card key='1' title="分组信息" style={{ flexGrow: 1, height: '100%', overflowY: 'auto' }}>
                <Form form={form} {...formItemLayout} onValuesChange={handleValueChange} >
                    <Form.Item name='name' label="预调组名" rules={[
                        { required: true, message: '请输入预调组名' },
                        {
                            validator: (_, value) => {
                                const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
                                if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
                                let len = 0;
                                Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
                                return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
                            },
                        }]}><Input disabled={!selectedKey} style={{ width: '30%' }} />
                    </Form.Item>
                    <Form.Item label="预调成员">
                        <Table
                            bordered
                            size='small'
                            columns={columns}
                            dataSource={chns}
                            rowSelection={chnSelection}
                            pagination={{ size: 'middle' }}
                        />
                    </Form.Item>
                    <Form.Item {...formTailLayout}>
                        <Space>
                            <Button type="primary" disabled={!selectedKey} onClick={onAdd}>添加</Button>
                            <Button type="primary" disabled={!selectedKey} onClick={onDel}>删除</Button>
                            <Button type='primary' disabled={!selectedKey} onClick={handlePlanSave}>保存</Button>
                            <Button type="primary" disabled={!selectedKey || row} onClick={handlePlanCancel}>取消</Button>
                        </Space>
                    </Form.Item>
                </Form>

                <Modal
                    title="添加成员"
                    visible={visible}
                    onOk={handleOk}
                    onCancel={handleCancel}>
                    <div style={{ maxHeight: 500, minHeight: 400, overflow: 'hidden' }}>
                        <Input.Search placeholder="资源搜索" allowClear maxLength={20} style={{ marginBottom: 10 }}
                            onChange={({ target: { value } }) => setSearch(value)} onSearch={handleSearch} />
                        {
                            seeks.length ? <Tree
                                {...treeProps}
                                expandedKeys={expandKeys}
                                treeData={seekTreeData}
                            /> : <Tree
                                    {...treeProps}
                                    treeData={netData}
                                />
                        }
                    </div>
                </Modal>
            </Card>
        </div>
    )
}

export default Preset;