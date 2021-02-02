import React from 'react'
import './index.less'
import {useLocation } from 'react-router-dom';

const DetailBodyLeft = (props) => {

    console.log(props.data)
    return (
        <div className="detail-body-left">
            <div className="info">
                <div className="title">{props.data.name}</div>
                <div className="disable">已启用</div>
                <div className="timestart">2020-12-21 20:20:20</div>
                <div className="timecover">1小时57分钟</div>
            </div>
            <div ></div>
        </div>
    )
}

export default DetailBodyLeft