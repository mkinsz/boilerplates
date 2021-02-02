import React from 'react'

import DetailHeader from './detail-header'
import DetailBodyLeft from './detail-body-left'
import DetailBodyMiddle from './detail-body-middle'
import DetailBodyRight from './detail-body-right'
import {useLocation } from 'react-router-dom';
import { post, stringify } from '../../services/graphql'
import { useSelector, useDispatch } from 'react-redux'

import './index.less'

const Index = () => {
    const state = useLocation().state
    const [data, setData] = React.useState([])
    const dispatch = useDispatch()

    React.useEffect(() => {
        post(`{RouteGroups(parent:${state.data.id}){id,name,parent,pos,chnnls{id,outname,outid,inname,inid,type,curinname,curinid,state,parent}}}`).then(_data => {
        dispatch({ type: '/routescene/scene/get', data: _data,enable:state.data.state })
        setData(_data.data.RouteGroups)
    })
    }, [])

    return (
        <div className="detail">
            <DetailHeader data={state.data}></DetailHeader>
            <div className="detail-body">
                <DetailBodyLeft data={state.data}></DetailBodyLeft>
                <DetailBodyMiddle  data={data}></DetailBodyMiddle>
                <DetailBodyRight></DetailBodyRight>
            </div>
        </div>
    )
}

export default Index