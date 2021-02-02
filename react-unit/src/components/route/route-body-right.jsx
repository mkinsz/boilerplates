import React from 'react'
import { Button, Radio, Modal } from 'antd';
import RouterBodyRightPart from "./route-body-right-part"
import { useSelector, useDispatch } from 'react-redux'
import { post, stringify } from '../../services/graphql'
import { eventProxy } from '../../utils'
import './index.less'
let _data = []

const RouteBodyRight = () => {
    const dispatch = useDispatch()
    const search = useSelector(state => state.routescene.search)

    const [groups, setGroups] = React.useState([])
    const [type, setType] = React.useState("all")


    React.useEffect(() => {
        post(`{RoutescenesByparent(parent:0){id,name,level,groups,parent,pos}}`)
        .then(data => setGroups(data.data.RoutescenesByparent))
        .catch(err => console.error(err))
    }, [])

    React.useEffect(() => {
        const eventID = '/msp/custom/route/addgroup'
        eventProxy.on(eventID, (msg) => {
            post(`{RoutescenesByparent(parent:0){id,name,level,groups,parent,pos}}`)
            .then(data => setGroups(data.data.RoutescenesByparent))
            .catch(err => console.error(err))
        });
        return function cleanup() {
            eventProxy.off(eventID)
        };
    }, [])

    const handleTypeChange = (e) => {
        setType(e.target.value)
    }

    return (
        <div className="route-body-right">
            <div className="buttons">
                <Radio.Group buttonStyle="solid" defaultValue="all" onChange={e => handleTypeChange(e)}>
                    <Radio.Button type="primary" value="all" >全部</Radio.Button>
                    <Radio.Button type="primary" value="open" >已开启</Radio.Button>
                    <Radio.Button type="primary" value="close" >未开启</Radio.Button>
                </Radio.Group>
            </div>
            {
                groups.map(value => <RouterBodyRightPart data={value} type={type}></RouterBodyRightPart>)
            }
        </div>
    )
}

export default RouteBodyRight