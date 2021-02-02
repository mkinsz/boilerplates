import React from 'react'
import { Button, Switch } from 'antd';
import { DetailBodyMiddlePartBlock } from './detail-body-middle-part-block'
import './index.less'
import { useLocation } from 'react-router-dom';
import { post, stringify } from '../../services/graphql'
import { useSelector, useDispatch } from 'react-redux'

const DetailBodyMiddlePart = (props) => {
    const data = useSelector(state => state.routescene.scene[props.data.id])
    const [a, setA] = React.useState([])
    const [checked, setChecked] = React.useState()
    React.useEffect(() => {
        generate()
    }, [])


    const generate = () => {
        const b = []
        for (let i = 0; i < 10; i++) {
            b.push({ name: '周一例会' + i + '点准时召开' })
        }
        setA(b)
    }

    const state = useLocation().state

    const onSwitchChange = (checked, e) => {
        setChecked(checked)
        console.log(props.data)
    }
    return (
        <div className="detail-body-middle-part">
            <div className="grouptitle">
                <div className="name">{props.data.name}</div>
                <Switch className="switch" onChange={onSwitchChange}></Switch>
                <div className="enable">{checked ? `已开启` : `已关闭`}</div>
                <div className="line" />
            </div>

            <div className="grid">
                {
                    Object.values(data.chnnls).map((value, key) => <DetailBodyMiddlePartBlock data={{...value, parent:props.data.id}} ></DetailBodyMiddlePartBlock>)
                }
            </div>
        </div>
    )
}

export default DetailBodyMiddlePart