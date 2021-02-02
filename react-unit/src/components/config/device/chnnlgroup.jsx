import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Tree, Button, Input, Popconfirm, Modal, Form, Select, Card, message, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux'
import * as ws from '@/services'
import { CHNTYPE } from '@/components/public';
import { v4 as uuidv4 } from 'uuid';

import _ from 'lodash'

import { ReactComponent as Svg_Round } from '@/assets/public/round.svg'
import { ReactComponent as Svg_Folder } from '@/assets/public/folder.svg'
import { ReactComponent as Svg_FolderOpen } from '@/assets/public/folder-open.svg'

const { DirectoryTree } = Tree;

const NewModal = props => {
  const [form] = Form.useForm()
  const { visible, modify, onCancel, onConfirm, memid } = props

  const dispatch = useDispatch()

  useEffect(() => {
    if (!visible) return;

    form.setFieldsValue({ 'node': 1 })
  }, [visible])

  const handleSubmit = async e => {
    try {
      const values = await form.validateFields()
      dispatch({
        type: '/msp/v2/chn/group/add', payload: {
          name: values.grpname,
          parentid: values.node ? memid : 4294967295
        }
      })
      onConfirm();
      form.resetFields();
    } catch (e) {
      console.log('Validate Failed:', e);
    }
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 18 },
    },
  };

  return (
    <Modal visible={visible} title={"配置"}
      okText="确认" cancelText="取消" onCancel={onCancel} onOk={handleSubmit}>
      <Form {...formItemLayout} form={form} initialValues={{ 'node': 1 }}>
        <Form.Item label="节点" name='node' >
          <Select>
            <Select.Option value={0}>根节点</Select.Option>
            <Select.Option value={1}>当前节点</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="组名" name="grpname" rules={[
          { required: true, message: '请输入组名' },
          {
            validator: (_, value) => {
              const reg = /^[-_a-zA-Z0-9\u4e00-\u9fa5]+$/
              if (!!value && !reg.test(value)) return Promise.reject('请输入正确格式的名称')
              let len = 0;
              Array.from(value).map(m => /[\u4e00-\u9fa5]/.test(m) ? len += 3 : len++)
              return len < 64 ? Promise.resolve() : Promise.reject('请输入正确长度的名称')
            },
          }
        ]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default props => {
  const [expandedKeys, setExpandedKeys] = useState([])
  const [checkedNode, setCheckedNode] = useState()

  const [selectedNode, setSelectedNode] = useState()
  const [originExpandKeys, setOriginExpandKeys] = useState([])

  const [visible, setVisible] = useState(false)
  const [originData, setOriginData] = useState([])
  const [treeData, setTreeData] = useState([])

  const [search, setSearch] = useState();

  const dispatch = useDispatch();

  const vins = useSelector(({ mspsDev }) => mspsDev.vins)
  const groups = useSelector(({ mspsDev }) => mspsDev.groups)
  const umttree = useSelector(({ mspsDev }) => mspsDev.umttree)
  const umts = useSelector(({ mspsCfg }) => mspsCfg.net.umts)

  const searchs = useSelector(({ mspsDev }) => mspsDev.searchs)

  const rtKey = useMemo(() => uuidv4(), []);
  const seeks = useMemo(() => Object.values(searchs).map(m => ({ key: m.id, ...m })), [searchs])

  const umtGroups = useMemo(() => {
    const recursion = root => root ? root.map(m => {
      if(!m.isLeaf) {
        m.checkable = false;
        m.children = recursion(m.children);
      }
      return m;
    }) : []
    return recursion(umttree)
  }, [umttree])

  const checkedKeys = useMemo(() => checkedNode ? [checkedNode.key] : [], [checkedNode])
  const selectedKeys = useMemo(() => selectedNode ? [selectedNode.key] : [], [selectedNode])

  useEffect(() => {
    dispatch({ type: '/msp/v2/net/umt/query' })
    dispatch({ type: '/msp/v2/chn/group/query' })
    // dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN } })
    dispatch({ type: '/msp/v2/chn/search/config' })
  }, [])

  useEffect(() => {
    const nets = Object.values(umts).filter(m => m.type == 2);
    if (!nets.length) return;
    dispatch({ type: '/msp/v2/chn/umt/group/query', payload: { id: nets[0].id } })
  }, [umts])

  const generateLocal = React.useCallback(() => {
    return {
      title: '模拟信号',
      key: '0-2',
      checkable: false,
      children: Object.values(vins).map(m => ({
        ..._.cloneDeep(m), key: m.id, title: m.name,
        icon: <Svg_Round style={{ height:20, maxWidth: 20, minWidth: 20, fill: m.online ? '#53d81f' : '#bbbbbb' }} />, isLeaf: true
      }))
    }
  }, [vins])

  const generateNet = React.useCallback(() => {
    const nets = Object.values(umts).map(m => ({ ...m, title: m.name, key: m.id, children: [] })).filter(m => m.type == 2)
    if (nets.length) {
      const netData = nets[0]
      netData.checkable = false
      netData.children = umtGroups
      return netData
    }
  }, [umtGroups])

  useEffect(() => {
    const netData = generateNet()
    const localData = generateLocal()

    const data = []
    data.push(localData)
    if (netData) data.push(netData)

    setOriginData(data)
  }, [generateLocal, generateNet])

  useEffect(() => {
    const rootid = -1 >>> 0
    const gtree = { key: rootid, id: rootid, title: '自定义分组', children: [] }
    const buildTree = (nbranch, branchs) => {
      const nbs = branchs.filter(m => m.parentid == nbranch.id)
      if (nbranch.id == -1 >>> 0) nbs.reverse()
      nbs.map(m => {
        const nb = _.cloneDeep(m)
        nb.key = nb.id
        nb.title = nb.name
        nbranch.children.unshift(nb)
        buildTree(nb, branchs.filter(m => m.parentid != nbranch.id))
      })
    }

    buildTree(gtree, Object.values(groups))
    setTreeData([gtree])

    const node = {};
    if (selectedKeys.length && selectedNode) {
      const { id, parentid } = selectedNode
      findDataRecursive(node, [gtree], parentid, id)
      setSelectedNode(node.value)
    }
  }, [groups])

  const handleExpand = keys => {
    setExpandedKeys(keys)
  };

  const handleSelected = (selectedKeys, info) => {
    const { selected, node } = info;
    setSelectedNode(selected ? node : undefined)
  };

  const handleLoadingMore = (umtid, groupid, offset) => {
    dispatch({ type: '/msp/v2/chn/umt/chn/query', payload: { id: umtid, sn: groupid, offset } })
  }

  const handleOriginSelect = (keys, event) => {
    const { selected, node } = event;
    setCheckedNode(selected ? node : undefined)
    if (selected && node.id == 'loading') {
      handleLoadingMore(node.umtid, node.groupid, node.length)
    }
  }

  const handleOriginExpand = keys => {
    setOriginExpandKeys(keys)
  }

  const handleOriginCheck = (keys, info) => {
    const { checked, checkedNodes, node } = info;
    setCheckedNode(checked ? node : undefined)
  }

  const handleDelBtnClick = () => {
    if (!selectedNode) {
      message.warning("请先选择...")
      return;
    }

    if (!!selectedNode.isLeaf) {
      dispatch({
        type: '/msp/v2/chn/group/mem/delete', payload: {
          id: selectedNode.parentid,
          list: [{ id: selectedNode.id, groupid: selectedNode.parentid }]
        }
      })
    }
    else {
      dispatch({ type: '/msp/v2/chn/group/delete', payload: { id: selectedNode.id } })
    }
  }

  const handleRightBtnClick = () => {
    if (!!!selectedNode || !!selectedNode.isLeaf) {
      message.warning('请选择一个分组...');
      return;
    }

    if(!checkedNode.isLeaf) {
      message.warning('请选择一个资源节点...');
      return;
    }

    const { id, name, online } = checkedNode
    dispatch({ type: '/msp/v2/chn/group/mem/add', payload: { id: selectedNode.id, mems: [{ id, name, online }] } })
  }

  const handleUpBtnClick = () => {
    if (!!!selectedNode || !!!selectedNode.isLeaf) {
      message.warning('请选择一个设备...');
      return;
    }

    const { id, parentid, nextid } = selectedNode;
    dispatch({ type: '/msp/v2/chn/group/mem/config', payload: { op: 'up', id, parentid, nextid } })
  }

  const handleDownBtnClick = () => {
    if (!!!selectedNode || !!!selectedNode.isLeaf) {
      message.warning("请选择一个设备...")
      return;
    }

    const { id, parentid, nextid } = selectedNode;
    dispatch({ type: '/msp/v2/chn/group/mem/config', payload: { op: 'down', id, parentid, nextid } })
  }

  const handleNewGroup = () => {
    if (!selectedNode) {
      message.warning('请选择一个分组...');
      return;
    }

    // TODO: 



    setVisible(true)
  }

  const handleLoadData = async node => {
    const msg = { payload: { id: node.id, offset: 0 } }
    if (node.umtid) { msg.type = '/msp/v2/chn/umt/chn/query', msg.payload.id = node.umtid, msg.payload.sn = node.id }
    else if (node.nextid) msg.type = '/msp/v2/chn/group/mem/query'
    else return;

    dispatch(msg)
    await ws.receive()
  }

  const HandleIcon = props => {
    const { id, isLeaf, expanded, data } = props
    if (id == 'loading' || id == 'loadingmore') return <></>
    if (isLeaf) return <Svg_Round style={{ height:20, maxWidth: 20, minWidth: 20, fill: data.online ? '#53d81f' : '#999999' }} />
    return expanded ? <Svg_FolderOpen style={{ width: 20,height:20 }}/> : <Svg_Folder style={{ width: 20,height:20 }}/>
  }

  const findDataRecursive = (data, list, groupid, id) => {
    return list.some((node) => {
      if (node.id === groupid) {
        data.value = node.children.find(m => m.id == id)
        return true;
      } else if (node.children) {
        findDataRecursive(data, node.children, groupid, id);
      }
    });
  }

  const handleSearch = value => {
    if (!value) {
      setOriginExpandKeys([])
      dispatch({ type: '/msp/v2/chn/search/config' })
    } else {
      dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: value } })
    }
  }

  const handleLoadMoreSearch = e => {
    e.preventDefault();
    e.stopPropagation();
    e.persist();
    dispatch({ type: '/msp/v2/chn/search/config', payload: { sn: search, offset: seeks.length } })
  }

  const seekTreeData = useMemo(() => {
    const isMore = !(seeks.length % 16)

    const skvalues = seeks.map(m => ({ ...m, title: m.name, isLeaf: true }))
    const children = !isMore ? skvalues : skvalues.concat({
      key: 'loadingmore', id: 'loadingmore', isLeaf: true, checkable: false,
      title: <a onClick={handleLoadMoreSearch}>加载更多...</a>
    })

    seeks.length && setOriginExpandKeys([rtKey])
    return [{ key: rtKey, id: rtKey, title: '搜索', children }]
  }, [seeks])

  const treeProps = {
    checkable: true,
    showIcon: true,
    selectable: true,
    draggable: true,
    blockNode: true,
    virtual: true,
    autoExpandParent: true,
    checkedKeys: checkedKeys,
    selectedKeys: checkedKeys,
    expandedKeys: originExpandKeys,
    icon: HandleIcon,
    onCheck: handleOriginCheck,
    onExpand: handleOriginExpand,
    onSelect: handleOriginSelect
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <NewModal visible={visible} memid={selectedNode && selectedNode.id} onCancel={() => setVisible(false)} onConfirm={() => setVisible(false)} />
      <Card title="全部资源" type="inner" size="small" extra={<Input.Search placeholder="资源搜索"
        allowClear maxLength={20} onChange={({ target: { value } }) => setSearch(value)} onSearch={handleSearch} />}
        style={{ height: 'inherit', width: 'calc((100% - 230px)/2)', overflowY: 'auto' }}>
        {
          seeks.length ? <Tree
            {...treeProps}
            treeData={seekTreeData}
          /> : <Tree
              {...treeProps}
              treeData={originData}
              loadData={handleLoadData}
            />
        }

      </Card>
      <div style={{ height: '100%', width: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0px 10px' }}>
        <Button disabled={!!!checkedKeys.length} onClick={handleRightBtnClick}>{'>>'}</Button>
      </div>
      <Card title="分组" type="inner" size="small" style={{ height: 'inherit', width: 'calc((100% - 230px)/2)', overflowY: 'auto' }}>
        <DirectoryTree
          showIcon
          multiple
          icon={HandleIcon}
          onExpand={handleExpand}
          onSelect={handleSelected}
          selectedKeys={selectedKeys}
          defaultExpandAll
          expandedKeys={expandedKeys}
          selectable
          draggable
          treeData={treeData}
        >
        </DirectoryTree>
      </Card>
      <div style={{ height: '100%', marginLeft: 10, width: 100 }}>
        <Space direction='vertical'>
          <Button disabled={!selectedNode || selectedNode && selectedNode.isLeaf} onClick={handleNewGroup}>新建分组</Button>
          <Popconfirm title={selectedNode && ('是否确定删除该' + (selectedNode.isLeaf ? '成员' : '分组') + '?')} okText='确定' cancelText='取消'
            disabled={!selectedNode || selectedNode && selectedNode.id == (-1 >>> 0)} onConfirm={handleDelBtnClick}>
            <Button block disabled={!selectedNode || selectedNode && selectedNode.id == (-1 >>> 0)}>删除</Button>
          </Popconfirm>
          <Button block disabled={!selectedNode || selectedNode && !selectedNode.isLeaf} onClick={handleUpBtnClick}>上移</Button>
          <Button block disabled={!selectedNode || selectedNode && !selectedNode.isLeaf} onClick={handleDownBtnClick}>下移</Button>
        </Space>
      </div>
    </div>
  )
}