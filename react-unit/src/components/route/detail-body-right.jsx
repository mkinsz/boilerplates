import React from 'react'
import { Button, Radio,Tree } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { GSN, CHNTYPE } from '../public';
import _ from 'lodash'
import './index.less'

const { DirectoryTree } = Tree;

const DetailBodyRight = () => {
    const [data, setData] = React.useState([])
    const [chns, setChns] = React.useState({})
    //const vinchn = useSelector(({ mspsDev }) => mspsDev.vins)
    const vinchn = useSelector(state => state.mspsDev.vins)
    console.log(vinchn)
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN } });
    }, [])

    React.useEffect(() => {
        const ndata = [
            {
                title: '自定义分组',
                key: '0-0',
                children: [
                    { title: '指挥大厅01', key: '0-0-0', isLeaf: true },
                    { title: '指挥大厅02', key: '0-0-1', isLeaf: true },
                    { title: '指挥大厅03', key: '0-0-2', isLeaf: true },
                ],
            },
            {
                title: '模拟信号',
                key: '0-1',
                children: Object.values(vinchn).map(m => {return({..._.cloneDeep(m), key: m.id, title: m.name, isLeaf: true })})
            }]
        setData(ndata)
    }, [vinchn])

    const handleDragStart = info => {
        if (!info.node.isLeaf) return false;

        const dt = info.event.dataTransfer
        dt.setData('title', info.node.title)
        dt.setData('id', info.node.id)
        console.log(info.event.dataTransfer)
    }

    return (
        <div className="detail-body-right">
            <div style={{ flexGrow: 1, overflow: 'auto' }}>
                    <DirectoryTree
                        virtual={true}
                        multiple
                        defaultExpandAll
                        //onSelect={onSelect}
                        //onExpand={onExpand}
                        treeData={data}
                        //loadData={onLoadData}
                        onDragStart={handleDragStart}
                        draggable
                    />
            </div>
        </div>
    )
}

export default DetailBodyRight