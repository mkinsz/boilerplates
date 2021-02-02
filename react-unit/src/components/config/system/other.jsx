import React from 'react'
import { Input, InputNumber, Button, Form, Checkbox, Col, Row, Modal } from "antd";
import { useSelector, useDispatch } from 'react-redux'
import './index.less'

const AskModal = props => {
    const [show, setShow] = React.useState(false)

    return <>
        <Button type="primary" onClick={() => setShow(true)}>
            {props.button}
        </Button>
        <Modal
            title="提示"
            visible={show}
            onOk={() => { props.handleOk(); setShow(false) }}
            onCancel={() => setShow(false)}
        >
            <p>{props.content}</p>
        </Modal>
    </>
}

const get_from_local = key => new Promise((resolve, reject) => {
    const value = window.localStorage.getItem(key)
    value ? resolve(value) : reject()
})

const set_to_local = (key, value) => new Promise(resolve => {
    window.localStorage.setItem(key, value)
    resolve();
})

const SystemOther = () => {
    const [checked, setChecked] = React.useState(0)

    const dispatch = useDispatch()

    React.useEffect(() => {
        get_from_local('ONE_KEY_PREVIEW').then(v => {
            setChecked(parseInt(v))
        }).catch(err => {
            setChecked(0)
        })
    }, [])

    const handleClick = async () => {
        const row = await form.validateFields()
    }

    const handleCheckChange = ({ target: { checked } }) => {
        setChecked(checked)
        set_to_local('ONE_KEY_PREVIEW', checked ? 1 : 0)
    }

    const handleOK = () => {

    }

    return <>
        <Checkbox checked={checked} defaultChecked={false} onChange={handleCheckChange}>预览</Checkbox>

        <Col className="gutter-row" span={6}>
            {/* <Row gutter={[16, 10]}>
                <Col style={{ alignSelf: 'center' }}>一键备份</Col>
                <Col><Button type='primary'>备份</Button></Col>
            </Row>
            <Row gutter={[16, 10]}>
                <Col style={{ alignSelf: 'center' }}>一键还原</Col>
                <Col><AskModal button='还原' content='一键还原会使主控重启并覆盖预案数据，是否进行一键还原?' handleOK={handleOK} /></Col>
            </Row> */}
        </Col>
    </>
}

export default SystemOther
