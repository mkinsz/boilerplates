import React, {useMemo} from 'react';
import { Tree, Space, Button, Menu, Dropdown, Input, Tooltip, Divider, Badge } from 'antd';
import { StarFilled, StarTwoTone } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash'
import * as ws from '../../services'

import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'
import { ReactComponent as Svg_Folder } from '@/assets/public/folder.svg'
import { ReactComponent as Svg_FolderOpen } from '@/assets/public/folder-open.svg'
import './style/resource.less'

const { DirectoryTree } = Tree;

const buildGroupTree = (nb, bs) => {
    const ns = bs.filter(m => m.parentid == nb.id)
    const vs = bs.filter(m => m.parentid != nb.id)
    ns.reverse().map(m => {
        if (nb.children) {
            const b = nb.children.find(n => n.id == m.id)
            if (!b) nb.children.unshift({ ...m, key: m.id, title: m.name })
        }
        buildGroupTree(m, vs)
    })
}

const buildRes = (node, list = []) => {
    if (!node || !list.length) return undefined

    const nlist = list.filter(m => m.parentid == node.id)
    if (!nlist.length) return undefined;

    const elist = list.filter(m => m.parentid != node.id)
    return nlist.map(m => {
        const children = buildRes(m, elist)
        const ret = { ...m, key: uuidv4(), title: m.name }
        children && (ret.children = children)
        return ret;
    })
}

const generateTree = (treeNodes = [], checkedKeys = []) => {
    return treeNodes.map(({ children, ...props }) => ({
        ...props,
        disabled: checkedKeys.includes(props.key),
        children: generateTree(children, checkedKeys),
    }));
};

export default props => {
    const [expandKeys, setExpandKeys] = React.useState([])

    const dispatch = useDispatch()

    const favors = useSelector(({ mspsAuth }) => mspsAuth.favors)
    const vins = useSelector(({ mspsDev }) => mspsDev.vins)
    const groups = useSelector(({ mspsDev }) => mspsDev.groups)
    const umttree = useSelector(({ mspsDev }) => mspsDev.umttree)
    const nets = useSelector(({ mspsCfg }) => mspsCfg.net.umts)

    const favorData = useMemo(() => {
        const data = { title: '收藏夹', key: '0-0', children: [] }
        data.children = Object.values(favors).map(m => ({
            key: uuidv4(), title: m.name, ...m, isLeaf: true, favor: true
        }))
        return data
    }, [favors])

    const groupData = useMemo(() => {
        const data = { title: '自定义分组', key: '0-1', id: -1 >>> 0, children: [] }
        buildGroupTree(data, Object.values(groups))
        return data;
    }, [groups])

    const localData = useMemo(() => {
        const data = { title: '模拟信号', key: '0-2', children: [] }
        data.children = Object.values(vins).map(m => ({
            ..._.cloneDeep(m), key: m.id, title: m.name, isLeaf: true
        }));
        return data;
    }, [vins])

    const netData = useMemo(() => {
        // 0=流媒体、1=新流媒体、2=统一设备、3=会议调度平台
        const umts = Object.values(nets).filter(m => m.type === 2).map(m => (
            { ...m, title: m.name, key: m.id, children: [] }
        ))

        if (!umts.length) return;
        const data = umts[0]
        data.children = umttree
        return data
    }, [nets, umttree])

    const data = useMemo(() => !netData ?
        [favorData, groupData, localData] :
        [favorData, groupData, localData, netData]
        , [favorData, groupData, localData, netData])

    const handleLoadingMore = (umtid, groupid, offset) => {
        dispatch({ type: '/msp/v2/chn/umt/chn/query', payload: { id: umtid, sn: groupid, offset } })
    }

    const handleSelect = (keys, event) => {
        const { selected, node } = event;
        if (selected && node.id == 'loading') {
            // console.log('Loading More: ', node.umtid, node.groupid, node.length)
            handleLoadingMore(node.umtid, node.groupid, node.length)
        }
    };

    const handleExpand = (expandedKeys, { expanded: bool, node }) => {
        setExpandKeys(expandedKeys)
    };

    const handleLoadData = async node => {
        const keys = Object.keys(node)
        const msg = { payload: { id: node.id, offset: 0 } }

        if (keys.includes('nextid')) {
            msg.type = '/msp/v2/chn/group/mem/query'
        }
        else if (keys.includes('umtid')) {
            msg.payload.sn = node.id
            msg.payload.id = node.umtid
            msg.type = '/msp/v2/chn/umt/chn/query'
        }
        else return;

        dispatch(msg)
        await ws.receive()
    }

    const handleIcon = props => {
        const { id, isLeaf, expanded, data } = props
        if (id == 'loading') return <></>
        if (isLeaf) return <Svg_Round style={{ width: 20, height:20, fill: data.online ? '#53d81f' : '#999999' }} />
        return expanded ? <Svg_FolderOpen style={{ width: 20,height:20 }}/> : <Svg_Folder style={{ width: 20, height: 20 }}/>
    }

    const handleTitle = node => {
        const ECHN_SAVE = 6;     // 收藏
        const ECHN_NOSAVE = 7;   // 取消收藏

        const handleFavor = () => {
            dispatch({
                type: '/msp/v2/chn/favorite/config', payload: {
                    type: node.favor ? ECHN_NOSAVE : ECHN_SAVE,
                    list: [{ id: node.id, name: node.name, online: node.online }]
                }
            })
        }

        return !node.isLeaf || node.id == 'loading' ? node.title : <div style={{
            width: 'calc(100% - 30px)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'space-between'
        }}>
            <div>{node.title}</div>
            <div onClick={handleFavor}>{Boolean(true) === node.favor ?
                <StarFilled style={{color:  "#FCC63F"}} /> :
                <StarTwoTone twoToneColor="#FCC63F" />}</div>
        </div>
    }

    return <DirectoryTree className='resource_tree'
        showIcon
        draggable={props.draggable}
        icon={handleIcon}
        treeData={data}
        blockNode={true}
        titleRender={handleTitle}
        onSelect={handleSelect}
        onExpand={handleExpand}
        // defaultExpandedKeys={expandKeys}
        expandedKeys={expandKeys}
        loadData={handleLoadData}
        onDragStart={props.draggable && props.onDragStart}
        style={{ whiteSpace: 'nowrap', ...props.style }}
        {...props}
    />
}