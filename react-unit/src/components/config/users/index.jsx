import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import {
    Popconfirm, Table, Button, Modal, Form, Input,
    Checkbox, Select, Space, TreeSelect, message, DatePicker
} from 'antd';
import { CHNTYPE } from '../../public';
import { v4 as uuidv4 } from 'uuid';

import moment from 'moment';

const ChnnlCfg = props => {
    const { visible, record, onCancel, onConfirm } = props
    const [values, setValues] = useState('0-1-1222')

    const dispatch = useDispatch();

    const vins = useSelector(({ mspsDev }) => mspsDev.vins)
    const udevs = useSelector(({ mspsCfg }) => mspsCfg.user.udevs)

    useEffect(() => {
        return () => setValues([]);
    }, [])

    const olddevs = useMemo(() => {
        const olds = udevs.map(m => m.id)
        setValues(olds)
        return olds;
    }, [udevs])

    const handleTreeSelectChange = value => {
        setValues(value)
    };

    const handleConfirm = () => {
        const add = values.filter(m => olddevs.indexOf(m) == -1)
        const del = olddevs.filter(m => values.indexOf(m) == -1)

        dispatch({ type: '/msp/v2/user/permission/add', payload: { id: record.id, type: 2, list: add } })
        dispatch({ type: '/msp/v2/user/permission/delete', payload: { id: record.id, type: 2, list: del } })

        onConfirm()
    }

    const treeData = useMemo(() => ([{
        title: '全选', key: '1',
        children: Object.values(vins).map(m => ({ key: m.base.id, title: m.name }))
    }]), [vins])

    const tProps = {
        treeData,
        value: values,
        size: 'small',
        onChange: handleTreeSelectChange,
        treeDefaultExpandAll: true,
        treeCheckable: true,
        allowClear: true,
        maxTagPlaceholder: 10,
        placeholder: '请选择',
        style: {
            width: 600
        },
    };

    return (
        <Modal visible={visible} title="配置通道" okText="确认" cancelText="取消" width={650}
            onCancel={onCancel} onOk={handleConfirm} >
            <TreeSelect {...tProps} />
        </Modal>
    );
}

const WallCfg = props => {
    const { visible, record, onCancel, onConfirm } = props
    const [values, setValues] = useState([])

    const dispatch = useDispatch();

    const uwalls = useSelector(({ mspsCfg }) => mspsCfg.user.uwalls)
    const walls = useSelector(({ mspsScreenCfg }) => mspsScreenCfg.walls)

    useEffect(() => {
        return () => setValues([])
    }, [])

    const oldwalls = useMemo(() => {
        const olds = uwalls.map(m => m.id)
        setValues(olds)
        return olds;
    }, [uwalls])

    const onChange = value => {
        setValues(value)
    };

    const handleConfirm = () => {
        const add = values.filter(m => oldwalls.indexOf(m) == -1)
        const del = oldwalls.filter(m => values.indexOf(m) == -1)

        dispatch({ type: '/msp/v2/user/permission/add', payload: { id: record.id, type: 3, list: add } })
        dispatch({ type: '/msp/v2/user/permission/delete', payload: { id: record.id, type: 3, list: del } })
        onConfirm();
    }

    const treeData = useMemo(() => ([{
        title: '全部', key: uuidv4(),
        children: Object.values(walls).map(m => ({ ...m, key: m.id, title: m.name }))
    }]), [walls])

    const tProps = {
        treeData,
        value: values,
        onChange: onChange,
        treeCheckable: true,
        treeDefaultExpandAll: true,
        placeholder: '请选择',
        style: {
            width: '100%',
        },
    };

    return (
        <Modal visible={visible} title="配置大屏"
            okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleConfirm}>
            <TreeSelect {...tProps} />
        </Modal>
    );
}

const UserModal = props => {
    const [form] = Form.useForm()
    const { visible, isMod, record, onCancel, onConfirm } = props

    const [isUse, setIsUse] = useState(false);
    const [isAdv, setIsAdv] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        if (visible) {
            setIsAdv(false)
            setIsUse(record ? record.isuse : false)
            isMod ? form.setFieldsValue({
                id: record.id,
                username: record.name,
                password: '',
                oldpwd: '',
                newpwd: '',
                type: record.type,
                online: record.online,
                islock: record.islock,
                isuse: record.isuse,
                validity: record.isuse ? moment(record.validity * 1000) : undefined,
            }) : form.setFieldsValue({
                username: '',
                password: '',
                oldpwd: '',
                newpwd: '',
                verpwd: '',
                type: 0,
                islock: 0,
                isuse: 0,
                validity: undefined
            });
        }
    }, [visible, isMod])

    const formLayout = {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
    };

    const handleValuesChange = (changedValues, allValues) => {
        setIsUse(allValues.isuse)
        // console.log('====>', allValues.validity.format('YYYY-MM-DD HH:mm:ss').valueOf(), allValues.validity.unix())
        if (!!changedValues.password) {
            var simple = new RegExp('^[0-9A-Za-z]{1,16}$')
            var medium = new RegExp('^(?=.{6,16})[0-9A-Za-z]*[^0-9A-Za-z][0-9A-Za-z]*$')
            var difficult = new RegExp('^(?=.{6,16})([0-9A-Za-z]*[^0-9A-Za-z][0-9A-Za-z]*){2,}$')
            if (('' + changedValues.password).match(simple)) {
                document.getElementById('weak').style.backgroundColor = 'red'
                document.getElementById('middle').style.backgroundColor = ''
                document.getElementById('strong').style.backgroundColor = ''
            } else if (('' + changedValues.password).match(medium)) {
                document.getElementById('middle').style.backgroundColor = 'yellow'
                document.getElementById('weak').style.backgroundColor = 'red'
                document.getElementById('strong').style.backgroundColor = ''
            } else if (('' + changedValues.password).match(difficult)) {
                document.getElementById('strong').style.backgroundColor = 'green'
                document.getElementById('middle').style.backgroundColor = 'yellow'
                document.getElementById('weak').style.backgroundColor = 'red'
            } else {
                document.getElementById('weak').style.backgroundColor = 'red'
                document.getElementById('middle').style.backgroundColor = ''
                document.getElementById('strong').style.backgroundColor = ''
            }
        }
    }

    const handleConfirm = async () => {
        try {
            const values = await form.validateFields();
            if (!isMod) {
                const payload = {
                    id: values.id,
                    name: values.username,
                    pass: values.password,
                    type: values.type,
                    islock: values.islock,
                    isuse: values.isuse,
                    validity: values.validity ? values.validity.unix() : undefined,
                }
                dispatch({ type: '/msp/v2/user/config', payload })
            } else {
                const { id } = record;
                if (isAdv) {
                    const { oldpwd, newpwd } = values;
                    dispatch({ type: '/msp/v2/user/password/config', payload: { id, oldpwd, newpwd } })
                }
                const payload = {
                    id,
                    name: values.username,
                    type: values.type,
                    islock: values.islock,
                    isuse: values.isuse,
                    validity: values.validity ? values.validity.unix() : undefined,
                }
                dispatch({ type: '/msp/v2/user/config', payload })
            }
            onConfirm();
        } catch (error) {
            console.log('Failed:', error);
        }
    }

    const modPwdComponent = <>
        <Form.Item name='oldpwd' label="原密码" rules={[
            { required: true, message: '请输入原密码' },
            { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{7,15})+$/, message: '密码格式不正确' }]}>
            <Input.Password onCut={e => e.preventDefault()}
                onCopy={e => e.preventDefault()}
                onPaste={e => e.preventDefault()} />
        </Form.Item>
        <Form.Item name='newpwd' label="新密码" rules={[
            { required: true, message: '请输入新密码' },
            { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{7,15})+$/, message: '密码格式不正确' }
        ]}><Input.Password />
        </Form.Item>
        <Form.Item>
            <table border="1" style={{ marginLeft: '100px', marginTop: '-10px', width: '300px', height: '16px' }}>
                <tbody>
                    <tr>
                        <td id='weak'>弱</td>
                        <td id='middle'>中</td>
                        <td id='strong'>强</td>
                    </tr>
                </tbody>
            </table>
        </Form.Item>
        <Form.Item name='verpwd' label="确认密码" rules={[
            { required: true, message: '请输入新密码' },
            { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{7,15})+$/, message: '密码格式不正确' }]}>
            <Input.Password />
        </Form.Item>
    </>

    const newPwdComponent = <>
        <Form.Item name='password' label="密码" rules={[
            { required: true, message: '请输入密码' },
            { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{7,15})+$/, message: '密码格式不正确' }]}>
            <Input.Password onCut={e => e.preventDefault()}
                onCopy={e => e.preventDefault()}
                onPaste={e => e.preventDefault()} />
        </Form.Item>
        <Form.Item>
            <table border="1" style={{ marginLeft: '100px', marginTop: '-10px', width: '300px', height: '16px', }}>
                <tbody>
                    <tr>
                        <td id='weak'>弱</td>
                        <td id='middle'>中</td>
                        <td id='strong'>强</td>
                    </tr>
                </tbody>
            </table>
        </Form.Item>
    </>

    const handleChange = e => {
        setIsAdv(e.target.checked)
    }

    return (
        <Modal visible={visible} centered title={isMod ? '修改' : '新建'}
            okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleConfirm}>
            <Form form={form} onValuesChange={handleValuesChange} {...formLayout}>
                <Form.Item name='username' label="用户名" rules={[
                    { required: true, message: '请输入用户名' },
                    { pattern: /^[a-zA-Z]([-_a-zA-Z0-9]{1,19})+$/, message: '请输入正确格式的用户名' }
                ]}><Input /></Form.Item>
                {!isMod && newPwdComponent}
                <Form.Item label="用户类型" name="type">
                    <Select>
                        <Select.Option value={0}>管理员</Select.Option>
                        <Select.Option value={1}>操作员</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name='isuse' label="启用有效期" valuePropName="checked"><Checkbox></Checkbox></Form.Item>
                <Form.Item name='validity' disabled={!isUse} label="有效期至">
                    <DatePicker
                        format="YYYY-MM-DD HH:mm:ss" disabled={!isUse}
                        showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                    />
                </Form.Item>
                {isMod && <Form.Item noStyle>
                    <Checkbox checked={isAdv} onChange={handleChange}>密码修改</Checkbox>
                </Form.Item>}
                {isMod && isAdv && modPwdComponent}
            </Form>
        </Modal>
    );
};

const User = props => {
    const [visible, setVisible] = useState(false)
    const [visibleWall, setVisibleWall] = useState(false)
    const [visibleChnnl, setVisibleChnnl] = useState(false)

    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [current, setCurrent] = useState()
    const [modData, setModData] = useState();

    const dispatch = useDispatch();

    const users = useSelector(({ mspsCfg }) => mspsCfg.user.users)

    const data = useMemo(() => Object.values(users).map(m => ({ ...m, key: m.id })), [users])

    useEffect(() => {
        handleUpdateUser()
    }, [])

    const handleUpdateUser = () => {
        dispatch({ type: '/msp/v2/user/query' })
        setSelectedRowKeys([])
    }

    const handleAddUser = () => {
        setVisible(true)
        setModData()
    }

    const handleDelConfirm = e => {
        selectedRowKeys.map(id => dispatch({ type: '/msp/v2/user/delete', payload: { id } }))
        setSelectedRowKeys([])
        message.success('删除成功');
    }

    const handleDelCancel = e => {

    }

    const handleModify = record => {
        setModData(record)
        setVisible(true)
    }

    const onChnnlCfg = (record) => {
        // dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN } })
        dispatch({ type: '/msp/v2/user/permission/query', payload: { id: record.id, subid: 2 } })

        setCurrent(record)
        setVisibleChnnl(true)
    }

    const onWallCfg = (record) => {
        dispatch({ type: '/msp/v2/tv/query', payload: { serial: 6 } })
        dispatch({ type: '/msp/v2/user/permission/query', payload: { id: record.id, subid: 3 } })

        setCurrent(record)
        setVisibleWall(true)
    }

    const handleUnlock = (record) => {
        dispatch({ type: '/msp/v2/user/lock/config', payload: { id: record.id } })
    }

    const handleCancel = () => {
        setVisible(false)
    }

    const handleConfirm = () => {
        setVisible(false)
        setModData()
    }

    const handleCancelWall = () => {
        setVisibleWall(false)
    }

    const handleConfirmWall = () => {
        setVisibleWall(false)
    }
    const handleCancelChnnl = () => {
        setVisibleChnnl(false)
    }
    const handleConfirmChnnl = () => {
        setVisibleChnnl(false)
    }

    const columns = [
        { title: 'id', dataIndex: 'id', width: 80, fixed: 'left', },
        { title: '用户名', dataIndex: 'name', width: 300, fixed: 'left', editable: true },
        { title: '类型', dataIndex: 'type', render: (text, record) => { return (record.type == 0 ? '管理员' : '操作员') } },
        { title: '在线状态', dataIndex: 'online', render: (text, record) => { return (record.online == 1 ? '在线' : '离线') } },
        { title: '锁定状态', dataIndex: 'islock', render: (text, record) => { return (record.islock == 0 ? '未锁定' : '锁定') } },
        {
            title: '编辑/修改',
            dataIndex: 'modify',
            render: (text, record, index) =>
                <Space>
                    {record.online == 0 ?
                        <Button size='small' onClick={() => handleModify(record)}>修改</Button> :
                        <Button disabled={true} size='small' onClick={() => handleModify(record)}>修改</Button>}
                    {record.type == 1 && <Button size='small' onClick={() => onChnnlCfg(record)}>配置信号源</Button>}
                    {record.type == 1 && <Button size='small' onClick={() => onWallCfg(record)}>配置大屏</Button>}
                    <Button disabled={!record.islock} size='small' onClick={() => handleUnlock(record)}>{record.islock == 0 ? '已解锁' : '解锁'}</Button>
                </Space>
        },
    ]
    return (
        <>
            <div style={{ display: "inline-flex", marginBottom: 16, justifyContent: 'space-between', width: 200 }}>
                <Button type='primary' onClick={handleUpdateUser}>更新</Button>
                <Button type="primary" onClick={handleAddUser}>添加</Button>
                <Popconfirm
                    disabled={!selectedRowKeys.length}
                    onConfirm={handleDelConfirm}
                    onCancel={handleDelCancel}
                    title="是否确认此操作?"
                    okText="确定"
                    cancelText="取消"
                >
                    <Button type="primary" disabled={!selectedRowKeys.length}>删除</Button>
                </Popconfirm>
            </div>
            <Table
                columns={columns}
                bordered
                dataSource={data}
                size='small'
                pagination={{ size: 'default', showSizeChanger: false }}
                rowSelection={{ selectedRowKeys, onChange: (keys, rows) => setSelectedRowKeys(keys) }}
            />
            <UserModal isMod={modData} visible={visible} record={modData} onCancel={handleCancel} onConfirm={handleConfirm} />
            {visibleWall && <WallCfg record={current} visible={visibleWall} onCancel={handleCancelWall} onConfirm={handleConfirmWall} />}
            {visibleChnnl && <ChnnlCfg record={current} visible={visibleChnnl} onCancel={handleCancelChnnl} onConfirm={handleConfirmChnnl} />}
        </>
    )
}

export default User