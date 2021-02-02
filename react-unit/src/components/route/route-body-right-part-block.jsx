import React from 'react'
import { Button, Popconfirm } from 'antd';
import { FormOutlined, DeleteOutlined } from '@ant-design/icons';
import { post } from '../../services/graphql'

import './index.less'
import 视频 from '@/assets/route/视频.svg'
import 音频 from '@/assets/route/音频.svg'
import 视频播放 from '@/assets/route/视频播放.svg'
import 视频暂停 from '@/assets/route/视频暂停.svg'
import 音量 from '@/assets/route/音量.svg'
import 静音 from '@/assets/route/静音.svg'
import 重置 from '@/assets/route/重置.svg'
import 删除 from '@/assets/route/删除.svg'
import 专项预案 from '@/assets/route/专项预案.svg'

const RouteBodyRightPartBlock = (props) => {
    const data = props.data;

    const conText1 = (
        <div className="context">
            <div className="title">{data.name}</div>
            <div className="timestart">2020-02-12 12:12:12</div>
            <div className="timecover">8小时3分钟</div>
        </div>)

    const conText2 = (
        <div className="context">
            <div className="title">{data.name}</div>
            <div className="disable">未开启</div>
        </div>)

    const onBtnDelClick = (event) => {
        event.stopPropagation();
        post(`mutation{DelRouteScene(id:${data.id}){id}}`).then(data=>props.reset() )
    }
    return (
        <div onClick={() => { props.onClick() }} className={data.state == 1 ? "block" : "block2"}>
            <div className="top">
                <Button type='link' icon={<FormOutlined />} onClick={props.onModify} size='small'></Button>
                <Popconfirm title="确定删除吗？" onConfirm={onBtnDelClick} onCancel={e=>{e.stopPropagation()}} okText="是" cancelText="否">
                    <Button type='link' icon={<DeleteOutlined />} onClick={e=>{e.stopPropagation()}} size='small'></Button>
                </Popconfirm>

            </div>
            <div className="right">
                <div className="ico"><专项预案 fill={props.playing ? "#08c" : "gray"} width="50" height="50" /> </div>
                {
                    props.playing ? conText1 : conText2
                }
            </div>
        </div>
    )
}

const RouteBodyRightPartBlockAdd = (props) => {
    const data = props.data;

    return (
        <div className="blockadd" href="#" onClick={props.onClick}>
            <div className="ico">+</div>
            <div className="text">添加</div>
        </div>
    )
}

export { RouteBodyRightPartBlock, RouteBodyRightPartBlockAdd }