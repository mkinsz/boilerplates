import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { Card, Table, Col, Row, Select, Form, Popconfirm } from 'antd';
import { DEVTYPE } from '../../public'

const { Option } = Select;

const DT = {
    IN2OUT: 0,
    OUT2IN: 1,
}

const EditableTable = props => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState('');
    const [row, setRow] = useState();

    const dispatch = useDispatch();

    const eqps = useSelector(({ mspsDev }) => mspsDev.eqps)
    const _ext = useSelector(({ mspsCfg }) => mspsCfg.ext.exts) || []
    const mpu = useSelector(({ mspsCfg }) => mspsCfg.system.mpu)

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        dataType,
        record,
        index,
        children,
        ...restProps
    }) => {
        return (
            <td {...restProps}>
                {editing ? <Form.Item name={dataIndex} style={{ margin: 0 }} rules={[{ required: true, message: `请选择!`, },]}>
                    <Select>
                        {(dataIndex == 'inid' ?
                            devs.filter(m => (m.type == DEVTYPE.IN) && (!dataType ?
                                m.base.box == mpu.box : m.base.box != mpu.box)) :
                            devs.filter(m => (m.type == DEVTYPE.OUT) && (!dataType ?
                                m.base.box != mpu.box : m.base.box == mpu.box))).
                            map(m => (<Option key={m.sn} value={m.sn}>{m.base.name}</Option>))}
                    </Select>
                </Form.Item> : children}
            </td>
        );
    };

    const exts = useMemo(() =>
        _ext.filter(m => !props.type ? eqps[m.inid] : eqps[m.outid])
            .filter(m => !props.type ? eqps[m.inid].base.box == mpu.box :
                eqps[m.outid].base.box == mpu.box).map((m, i) => ({ ...m, key: i }))
        , [_ext, eqps, mpu])

    const devs = useMemo(() => {
        const uls = exts.reduce((t, m) => { t.push(m.inid); t.push(m.outid); return t }, [])
        const ufs = Object.values(eqps)
            .filter(m => m.type == DEVTYPE.IN || m.type == DEVTYPE.OUT)
        return ufs.filter(m => !uls.find(n => m.sn == n))
    }, [eqps, exts])

    const data = useMemo(() => row ? [...exts, row] : exts, [exts, row])

    const isEditing = record => record.key === editingKey;

    const edit = record => {
        form.setFieldsValue({ ...record });
        setEditingKey(record.key);
    };

    const cancel = record => {
        row && setRow()
        setEditingKey('');
        form.setFieldsValue({});
    };

    const save = async key => {
        try {
            const row = await form.validateFields();
            dispatch({ type: '/msp/v2/devex/port/extend/config', payload: { type: 'add', data: row } })
            setRow();
            setEditingKey('');
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleNew = () => {
        if (row) return;

        const newData = {
            key: 'tmp',
            inid: null,
            outid: null,
        };
        setRow(newData)
        form.setFieldsValue({ ...newData });
        setEditingKey('tmp')
    }

    const handleDel = record => {
        if (record.key == 'tmp') setRow()
        else dispatch({ type: '/msp/v2/devex/port/extend/config', payload: { type: 'del', data: record } })
    }

    const columns = (!props.type ? [
        {
            title: "本机输入", dataIndex: "inid", width: '35%', editable: true,
            render: text => eqps && eqps[text] && eqps[text].base.name
        },
        {
            title: "外机输出", dataIndex: "outid", width: '35%', editable: true,
            render: text => eqps && eqps[text] && eqps[text].base.name
        }] : [
            {
                title: "外机输入", dataIndex: "inid", width: '35%', editable: true,
                render: text => eqps && eqps[text] && eqps[text].base.name
            },
            {
                title: "本机输出", dataIndex: "outid", width: '35%', editable: true,
                render: text => eqps && eqps[text] && eqps[text].base.name
            }]).concat(
                {
                    title: '操作', key: 'operation', width: '30%', editable: false,
                    render: (_, record) => {
                        const editable = isEditing(record);
                        return editable ? (
                            <span>
                                <a onClick={() => save(record.key)} style={{ marginRight: 8, }}>保存</a>
                                <Popconfirm title="是否取消?" okText='确定' cancelText='取消'
                                    onConfirm={() => cancel(record)}><a>取消</a></Popconfirm>
                            </span>
                        ) : (
                                <span>
                                    <a disabled={editingKey !== ''} onClick={() => edit(record)} style={{ marginRight: 8 }}>编辑</a>
                                    <Popconfirm disabled={editingKey !== ''} title="是否取消?" okText='确定' cancelText='取消'
                                    onConfirm={() => handleDel(record)}><a disabled={editingKey !== ''}>删除</a></Popconfirm>
                                    
                                </span>
                            );
                    },
                })

    const mergedColumns = columns.map(col => {
        if (!col.editable) return col;

        return {
            ...col,
            onCell: record => ({
                record,
                dataType: props.type,
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    return (
        <Form form={form} component={false}>
            <Card title={props.title} size="small" extra={<a onClick={() => handleNew()}>新建</a>}>
                <Table
                    bordered
                    size='middle'
                    dataSource={data}
                    columns={mergedColumns}
                    components={{ body: { cell: EditableCell, }, }}
                    pagination={false}
                />
            </Card>
        </Form>
    );
};

const HeapUp = props => {

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({ type: '/msp/v2/sys/query' })
        dispatch({ type: '/msp/v2/devex/port/extend/query' })
        dispatch({ type: '/msp/v2/eqp/query', payload: { id: DEVTYPE.IN } })
        dispatch({ type: '/msp/v2/eqp/query', payload: { id: DEVTYPE.OUT } })
    }, [])

    return <>
        <Row gutter={16}>
            <Col span={12}>
                <EditableTable title="本机 - 外机" type={DT.IN2OUT}></EditableTable>
            </Col>
            <Col span={12}>
                <EditableTable title="外机 - 本机" type={DT.OUT2IN}></EditableTable>
            </Col>
        </Row>
    </>
}



export default HeapUp;