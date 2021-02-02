import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Modal, Button, Tree, Empty } from 'antd';
import { CONFIG } from '../../../../actions';

const SwitchModal = props => {
  const [data, setData] = useState([])
  const [visible, setVisible] = useState(false)
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const dispatch = useDispatch()

  useEffect(() => {
    if (visible) {
      dispatch({ type: '/msp/v2/kvm/kvmswitch/query', payload: { id: props.kvmid } })
      dispatch({ type: '/msp/v2/kvm/kvmswitch/cur/query', payload: { id: props.kvmid } })
    }
  }, [visible])

  useEffect(() => {
    if (!props.switchpush.memberList) return
    const { memberList } = props.switchpush;
    const kvms = memberList.map(m => props.kvms[m.value])
    setData(kvms.map(m => ({ title: m.name, key: m.id, ...m })))
  }, [props.switchpush])

  useEffect(() => {
    const { memberList } = props.switchcur
    memberList && setCheckedKeys(memberList.map(m => m.value))
  }, [props.switchcur])

  const handleOk = () => {
    setVisible(false)
    dispatch({ type: '/msp/v2/kvm/kvmswitch/cur/config', payload: { id: props.kvmid, mems: checkedKeys } })
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const onCheck = checkedKeys => {
    // console.log('onCheck', checkedKeys);
    setCheckedKeys(checkedKeys);
  };

  const onSelect = (selectedKeys, info) => {
    // console.log('onSelect', info);
    setSelectedKeys(selectedKeys);
  };

  const treeDate = [
    {
      title: '全部',
      key: '1',
      children: data
    }
  ]

  return <>
    <Button type='primary' disabled={props.disabled} style={props.style} onClick={() => setVisible(true)}>{props.children}</Button>
    <Modal
      centered
      title="切换配置"
      okText='确认'
      cancelText='取消'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div style={{ height: 400 }}>
        {data.length ? <Tree
          checkable
          defaultExpandAll
          autoExpandParent
          onCheck={onCheck}
          checkedKeys={checkedKeys}
          onSelect={onSelect}
          selectedKeys={selectedKeys}
          treeData={treeDate}
        /> : <Empty />}
      </div>

    </Modal>
  </>
}


const mapStateToProps = state => ({
  kvms: state.mspsCfg.kvm.kvms,
  switchpush: state.mspsCfg.kvm.switchpush,
  switchcur: state.mspsCfg.kvm.switchcur
})

export default connect(mapStateToProps)(SwitchModal);