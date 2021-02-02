import React, { useState, useEffect, useMemo } from 'react';
import { message, Tree, Modal, Form, Input, Button, Transfer, Space, Popconfirm } from 'antd';
import { useSelector, useDispatch } from 'react-redux'
import _ from 'lodash'

const { DirectoryTree } = Tree;
const { TreeNode } = Tree;

const isChecked = (selectedKeys, eventKey) => {
  return selectedKeys.indexOf(eventKey) !== -1;
};

const generateTree = (treeNodes = [], checkedKeys = []) => {
  return treeNodes.map(({ children, ...props }) => (
    <TreeNode {...props} disabled={checkedKeys.includes(props.key)} key={props.key}>
      {generateTree(children, checkedKeys)}
    </TreeNode>
  ));
};

const NewModal = props => {
  const [form] = Form.useForm();
  const [visible, setVisible] = React.useState(false)

  const dispatch = useDispatch();

  const handleOk = async () => {
    const row = await form.validateFields()
    if (Object.values(props.group).find(m => m.name == row.name)) {
      message.warning('分组名不能重复...');
      return;
    }

    const group = { id: 0, parentid: props.selectedKey || (-1 >>> 0), name: row.name, memnum: 0 };
    const kvmids = []
    dispatch({ type: '/msp/v2/kvm/group/config', payload: { group, kvmids } })
    setVisible(false)
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleClick = () => {
    if (!props.selectedKey && !props.empty) {
      message.warning('请先选择一个坐席组...');
      return;
    }
    form.resetFields()
    setVisible(true)
  }

  return (
    <div>
      <Button type="primary" onClick={handleClick}>新建分组</Button>
      <Modal title="新建坐席分组" okText='确认' cancelText='取消' visible={visible} onOk={handleOk} onCancel={handleCancel}  >
        <Form form={form}>
          <Form.Item name="name" label="坐席组名" rules={[
            { required: true, message: '请输入名字' },
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
    </div>
  );
}

const AttendGroup = props => {
  const [expandKeys, setExpandKeys] = useState([])
  const [selectedKey, setSelectedKey] = useState()

  const dispatch = useDispatch();

  const _kvms = useSelector(({ mspsCfg }) => mspsCfg.kvm.kvms)
  const _group = useSelector(({ mspsCfg }) => mspsCfg.kvm.group)

  useEffect(() => {
    dispatch({ type: '/msp/v2/kvm/query', payload: { offset: 0 } })
    dispatch({ type: '/msp/v2/kvm/group/query' })
  }, [])

  const kvms = useMemo(() => Object.values(_kvms).map(m => ({ key: m.id, title: m.name, ...m })), [_kvms])

  const buildTree = (group, root = {}) => {
    if (!Object.keys(root).length) {
      const ret = Object.values(group).some(m => {
        if (-1 != m.parentid << 0) return false
        root = _.cloneDeep(group[m.id])
        root.key = root.id
        root.title = root.name
        root.checkable = false;
        buildTree(group, root)
        return true;
      })
      return ret ? root : null
    }
    Object.values(group).filter(m => root.id == m.parentid && !m.isLeaf).map(m => {
      const tree = _.cloneDeep(m);
      tree.key = m.id
      tree.title = m.name
      tree.checkable = false;
      root.children = root.children || []
      root.children.push(tree)
    })
    root.children && root.children.filter(m => !m.isLeaf).map(m => buildTree(group, m))
  }

  const buildLeaf = group => {
    if (!group.memnum) return;
    group.children = group.children || []
    group.mems && group.mems.map(m => {
      if (_kvms[m]) {
        const child = _.cloneDeep(_kvms[m])
        child.key = group.id + '_' + child.id
        child.title = child.name
        child.isLeaf = true
        group.children.push(child)
      }
    })
  }

  const data = useMemo(() => {
    const kgrps = Object.keys(_group)
    if (kgrps && kgrps.length) {
      const group = _.cloneDeep(_group)
      for (let m in group) buildLeaf(group[m])
      const root = buildTree(group)
      return root ? [root] : []
    }
    return []
  }, [_group])

  useEffect(() => {
    const keys = [];
    const flatten = (list = []) => {
      list.forEach(item => { keys.push(item.key); flatten(item.children) });
    }
    flatten(data);
    setExpandKeys(keys)
  }, [data])

  const onExpand = (expandedKeys) => {
    setExpandKeys(expandedKeys)
  };

  const handleChange = (nextTargetKeys, direction, moveKeys) => {
    console.log('targetKeys: ', nextTargetKeys);
    console.log('direction: ', direction);
    console.log('moveKeys: ', moveKeys);

    if (direction == 'right') {
      const sgrp = _group[selectedKey];
      if (!sgrp) {
        message.warn('请先选择一个坐席分组...')
        return;
      }
      const group = _.cloneDeep(sgrp)
      group.mems = group.mems || []
      moveKeys.map(m => !group.mems.find(n => n == m) && group.mems.push(m))
      group.memnum = group.mems.length
      dispatch({ type: '/msp/v2/kvm/group/config', payload: { group, kvmids: group.mems } })
    }
    else {
      moveKeys = moveKeys.filter(m => typeof (m) == 'string')
      if (!moveKeys.length) return;
      const id = moveKeys[0].split('_').slice(-2, -1)[0]
      const group = _.cloneDeep(_group[id])
      if (!group) return;
      moveKeys.map(m => {
        const id = parseInt(m.split('_').slice(-1))
        if (group.mems) {
          const index = group.mems.findIndex(n => n == id)
          index > -1 && group.mems.splice(index, 1)
        }
      })
      group.memnum = group.mems.length
      dispatch({ type: '/msp/v2/kvm/group/config', payload: { group, kvmids: group.mems } })
    }
  }

  const handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
    console.log('sourceSelectedKeys: ', sourceSelectedKeys);
    console.log('targetSelectedKeys: ', targetSelectedKeys);
  };

  const handleDel = () => {
    if (!selectedKey) {
      message.warning('请先选择一个坐席组...');
      return;
    }
    dispatch({ type: '/msp/v2/kvm/group/delete', payload: { id: selectedKey } })
    setSelectedKey(null)
  }

  const ops = <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <>坐席分组</>
  </div>

  return (
    <>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <Space size={10}>
          (删除修改分组配置后需要重新上传菜单图片)
          <NewModal group={_group} selectedKey={selectedKey} empty={!data.length} />
          <Popconfirm disabled={!selectedKey} onConfirm={handleDel}
            title="是否确定删除此分组?" okText="确定" cancelText="取消">
            <Button disabled={!selectedKey}>删除分组</Button>
          </Popconfirm>
        </Space>
      </div>
      <Transfer
        dataSource={kvms}
        render={item => item.title}
        showSelectAll={false}
        onChange={handleChange}
        titles={['坐席列表', ops]}
        onSelectChange={handleSelectChange}
        style={{ height: '100%' }}
      >
        {({ direction, onItemSelect, selectedKeys }) => {
          if (direction === 'right') {
            return (
              <DirectoryTree
                multiple blockNode checkable
                defaultExpandAll
                treeData={data}
                onExpand={onExpand}
                expandedKeys={expandKeys}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onCheck={(_, { node }) => {
                  const { props: { eventKey } } = node;
                  const checked = isChecked(selectedKeys, eventKey);
                  !checked && setSelectedKey()
                  onItemSelect(eventKey, !checked);
                }}
                onSelect={(_, { node }) => {
                  const { props: { eventKey } } = node;
                  if (!node.isLeaf) setSelectedKey(eventKey)
                }}
              >
              </DirectoryTree>
            );
          }
        }}
      </Transfer>
    </>
  )
}

export default AttendGroup;