import React, { useEffect, useState } from 'react'
import { Input, Button, Modal } from 'antd'
import { post, stringify } from '../../services/graphql'
import { useSelector, useDispatch } from 'react-redux'
import { eventProxy } from '../../utils'
import './index.less'
const { Search } = Input;


const DlgAdd = props => {
    const [value, setValue] = useState()

    useEffect(() => {
        props.visible && setValue()
    }, [props.visible])

    return (
        <Modal visible={props.visible} title="新建" okText="确认" cancelText="取消" onCancel={() => props.onCancel()} onOk={() => props.onConfirm(value)}>
            <Input value={value} maxLength={20} onChange={({target: {value}}) => setValue(value)} />
        </Modal>
    )
}

const RouteHeader = () => {
    const [visible, setVisible] = React.useState(false)
    const dispatch = useDispatch()

    const handlAddClick = (name) => {
        setVisible(false)
        post(`mutation{Addroutescene(name:"${name}"){id}}`).then(_data => { eventProxy.trigger('/msp/custom/route/addgroup') })
    }

    return (
        <div className="route-header">
            <DlgAdd visible={visible} onCancel={() => setVisible(false)} onConfirm={(name) => { handlAddClick(name) }} />

            <div className="left"></div>
            <div className="middle">预案调度</div>
            <div className="right">
                <div style={{ display: 'flex', height: "20px" }}>
                    <Search
                        placeholder="搜索"
                        onSearch={value => dispatch({ type: '/routescene/search', search: value })}
                        style={{ width: 200 }}
                        className="common"
                    />
                    <Button type="primary" className="common" size="small" onClick={() => setVisible(true)}>新增组</Button>
                </div>
            </div>
        </div>
    )
}

export default RouteHeader