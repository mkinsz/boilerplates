import React from 'react'
import { Button } from 'antd';
import { FormOutlined, DeleteOutlined } from '@ant-design/icons';
import { post, stringify } from '../../services/graphql'
import { useLocation } from 'react-router-dom';
import { eventProxy } from '../../utils'
import { useSelector, useDispatch } from 'react-redux'

import './index.less'
import 视频 from '@/assets/route/视频.svg'
import 音频 from '@/assets/route/音频.svg'
import 视频播放 from '@/assets/route/视频播放.svg'
import 视频暂停 from '@/assets/route/视频暂停.svg'
import 音量 from '@/assets/route/音量.svg'
import 静音 from '@/assets/route/静音.svg'
import 重置 from '@/assets/route/重置.svg'
import 恢复 from '@/assets/route/恢复.svg'
import 播放 from '@/assets/route/播放.svg'
import 停止 from '@/assets/route/停止.svg'
import 删除 from '@/assets/route/删除.svg'
import 专项预案 from '@/assets/route/专项预案.svg'

const DetailBodyMiddlePartBlock = (props) => {
    //var [data, setData] = React.useState(props.data)
    let data = useSelector(state => state.routescene.scene[props.data.parent].chnnls[props.data.id])
    var [fresh, setFresh] = React.useState(false)
    console.log(data)
    
    const state = useLocation().state
    const dispatch = useDispatch()

    React.useEffect(()=>{
        if(data.enable){
            post(`{RouteChnnlUni(outid:"${data.outid}"){inid,inname}}`).then(_data=>{
                console.log(_data.data.RouteChnnlUni)
                data.inname = _data.data.RouteChnnlUni.inname
                data.inid = _data.data.RouteChnnlUni.inid
                setFresh(!fresh)
        })
        }
    },[])

    React.useEffect(() => {
        const eventID = '/routescene/reset'
        eventProxy.on(eventID, (msg) => {
        });
        return function cleanup() {
            eventProxy.off(eventID)
        };
    }, [])

    React.useEffect(() => {
        const eventID = '/routescene/enable'
        eventProxy.on(eventID, (msg) => {
            console.log(data)
        });
        return function cleanup() {
            eventProxy.off(eventID)
        };
    }, [])

    const onBtnDelClick = (e) => {
        e.stopPropagation();
        data.inname = ""
        data.inid = ""
        setFresh(!fresh)
        if(data.enable){
            post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
            var type = data.type == 8 ? 1 : 2
            post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:1, type:"${type}")}`).then(_data=>console.log(_data))
        }
    }
    const onBtnResetClick = (e) => {
        e.stopPropagation();
        console.log(props.data)
        post(`{RouteChnnl(id:${props.data.id}){id,inid,inname,parent}}`).then(_data=>{
            data.inname = _data.data.RouteChnnl.inname
            data.inid = _data.data.RouteChnnl.inid
            setFresh(!fresh)
            if(data.enable){
                post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
            var type = data.type == 8 ? 1 : 2
            post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:1, type:"${type}")}`).then(_data=>console.log(_data))
            }
        })

        //update(_data)
    }
    const onBtnPlayClick = (e) => {
        e.stopPropagation();
        data.state = 1 - data.state
        if(data.enable){
                post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
            var type = data.type == 8 ? 1 : 2
            post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:${data.state}, type:"${type}")}`).then(_data=>console.log(_data))
        }
        setFresh(!fresh)
    }

    const onBtnMutexClick = (e) => {
        e.stopPropagation();
        data.state = 1 - data.state
        if(data.enable){
            post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
        var type = data.type == 8 ? 1 : 2
        post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:${data.state}, type:"${type}")}`).then(_data=>console.log(_data))
        }
        setFresh(!fresh)
    }

    const update = (_data) => {
        //dispatch({ type: '/routescene/scene/update', data: _data })
        data = _data
        setFresh(!fresh)
    }
    const video = (
        <div className={data.inname == "" ? "block3" : "block"}
            onDragOver={e => {
                e.preventDefault()
            }
            }
            onDrop={e => {
                const title = e.dataTransfer.getData('title')
                const id = e.dataTransfer.getData('id')
                data.inname = title
                data.inid = id
                setFresh(!fresh)
                if(data.enable){
                    post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
                    var type = data.type == 8 ? 1 : 2
                    post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:1, type:"${type}")}`).then(_data=>console.log(_data))
                }
            }}
        >
            <div className="top">
                <Button onClick={onBtnDelClick} type='link' icon={<删除 fill={"#1890FF"} />} size='small'></Button>
                <Button onClick={onBtnResetClick} type='link' icon={<恢复 fill={"#1890FF"} />} size='small'></Button>
                <Button onClick={onBtnPlayClick} type='link' icon={data.state == 1 ? <停止 fill={"#28902F"} /> : <播放 fill={"#1890FF"} />} size='small'></Button>
            </div>
            <div className="middle">
                <div className="ico"><视频 fill={data.state == 1 ? "#28DF30" : "#666666"} width="30" height="30" /> </div>
                <div className="context">{data.inname == "" ? "未定义" : data.inname}</div>
            </div>
            <div className={data.type == 8 ? "bottom" : "bottom2"}>
                {data.outname}
            </div>
        </div>)
    const audio = (
        <div className={data.inname == "" ? "block3" : "block2"}
            onDragOver={e => {
                e.preventDefault()
            }
            }
            onDrop={e => {
                const title = e.dataTransfer.getData('title')
                const id = e.dataTransfer.getData('id')
                data.inname = title
                data.inid = id
                setFresh(!fresh)
                if(data.enable){
                    post(`mutation{UpdateRouteChnnlUni(outid:"${data.outid}",inid:"${data.inid}",inname:"${data.inname}"){inid,inname}}`).then(_data=>console.log(_data))
                    var type = data.type == 8 ? 1 : 2
                    post(`mutation{Exchange(outid:"${data.outid}", inid:"${data.inid}", on:1, type:"${type}")}`).then(_data=>console.log(_data))
                }
            }}
        >
            <div className="top">
                <Button onClick={onBtnDelClick} type='link' icon={<删除 fill={"#1890FF"} />} size='small'></Button>
                <Button onClick={onBtnResetClick} type='link' icon={<恢复 fill={"#1890FF"} />} size='small'></Button>
                <Button onClick={onBtnPlayClick} type='link' icon={data.state == 1 ? <静音 fill={"#28902F"} /> : <音量 fill={"#1890FF"} />} size='small'></Button>
            </div>
            <div className="middle">
                <div className="ico"><视频 fill={data.state == 1 ? "#F4950E" : "#666666"} width="30" height="30" /> </div>
                <div className="context">{data.inname == "" ? "未定义" : data.inname}</div>
            </div>
            <div className={data.type == 8 ? "bottom" : "bottom2"}>
                {data.outname}
            </div>
        </div>)

    return (
        data.type == 8 ? video : audio
    )
}


export { DetailBodyMiddlePartBlock }