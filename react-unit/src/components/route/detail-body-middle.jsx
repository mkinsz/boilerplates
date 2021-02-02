import React from 'react'
import { Button, Radio } from 'antd'
import DetailBodyMiddlePart from "./detail-body-middle-part"

import './index.less'

const DetailBodyMiddle = (props) => {
    
    return (
        <div className="detail-body-middle">
            {
            props.data.map((value,key)=><DetailBodyMiddlePart data={{...value, Index:key}}></DetailBodyMiddlePart>)
        }
        </div>
    )
}

export default DetailBodyMiddle