import React from 'react'
import { Input, Button,message } from 'antd'
import './index.less'
import { useLocation } from 'react-router-dom';
import { post } from '../../services/graphql'
import { useSelector, useDispatch } from 'react-redux'
import { eventProxy } from '../../utils'

import 重置 from '@/assets/route/重置.svg'
import 保存 from '@/assets/route/保存.svg'
import 另存为 from '@/assets/route/另存为.svg'

const DetailHeader = (props) => {
    const scene = useSelector(state => state.routescene.scene)
    const [enable, setEnable] = React.useState(props.data.state)
    const dispatch = useDispatch()

    const handleBack = () => {
        window.history.back(-1)
    }
    const onBtnEnableClick = () => {
        let _enable = 1 - enable;
        post(`mutation{UpdateRouteScene(id:${props.data.id},state:${_enable}){id,state}}`).then(_data => {
            setEnable(_enable)
        })
        dispatch({ type: '/routescene/enable', enable: _enable })
    }
    const onBtnResetClick = () => {
        eventProxy.trigger('/routescene/reset')
        post(`{RouteGroups(parent:${props.data.id}){id,name,parent,pos,chnnls{id,outname,outid,inname,inid,type,curinname,curinid,state,parent}}}`).then(_data => {
            dispatch({ type: '/routescene/scene/get', data: _data, enable: props.data.state })
            message.success('重置成功')
        })
    }
    const onBtnSaveClick = () => {
        let arr = []
        for (const x in scene) {
            for (const y in scene[x].chnnls) {
                const e = scene[x].chnnls[y]
                arr.push({ id: e.id, state:e.state, outid: e.outid, outname: e.outname, inid: e.inid, inname: e.inname })
            }
        }

        let s = "["
        for (const i in arr) {
            const e = arr[i]
            s += `{id:${e.id},state:${e.state}, outid:"${e.outid}",outname:"${e.outname}",inid:"${e.inid}",inname:"${e.inname}"},`
        }
        s += "]"
        const a = `mutation{SaveRouteScene(chnnls:${s}){id}}`
        console.log(a)
        post(a).then(data => {
            if(data.data.SaveRouteScene.id == 1){
                message.success('保存成功')
            }
            
            console.log(data)
        })
    }

    return (
        <div className="detail-header">
            <Button type="link" className="left" onClick={() => handleBack()}> &lt; 返回</Button>
            <div className="middle"><Button type="primary" className="enabel" onClick={onBtnEnableClick}>{enable == 0 ? `开启` : `关闭`}</Button></div>
            <div className="right">
                <div style={{ display: 'flex', height: "20px" }}>
                    {
                    //<Button type='link' icon={<另存为 />}></Button>
                    }
                    <Button type='link' icon={<保存 />} onClick={() => onBtnSaveClick()}></Button>
                    <Button type='link' icon={<重置 />} onClick={() => onBtnResetClick()}></Button>
                </div>
            </div>
        </div>
    )
}

export default DetailHeader