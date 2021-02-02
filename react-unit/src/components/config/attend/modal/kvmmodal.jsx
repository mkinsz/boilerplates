import React from 'react';
import { connect, useDispatch } from 'react-redux';
import { Modal, Button, Tree, Empty } from 'antd';
import { CONFIG } from '../../../../actions';

const KvmModal = props => {
  const [data, setData] = React.useState([])
  const [visible, setVisible] = React.useState(false)
  const [expandedKeys, setExpandedKeys] = React.useState([]);
  const [checkedKeys, setCheckedKeys] = React.useState([]);
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const [autoExpandParent, setAutoExpandParent] = React.useState(true);

  const dispatch = useDispatch();

  React.useEffect(() => {
    if(visible) {
      dispatch({type: '/msp/v2/kvm/kvmpush/query', payload: {id: props.kvmid}})
      dispatch({type: '/msp/v2/kvm/push/query', payload: {id: props.kvmid}})
    }
  }, [visible])

  React.useEffect(() => {
    const { memberList } = props.kvmpush;
    if(!memberList) return;

    const kvms = memberList.map(m => props.kvms[m.value])
    setData(kvms.map(m => ({ title: m.name, key: m.id, ...m })))
  }, [props.kvmpush])

  React.useEffect(() => {
    setCheckedKeys(props.kvmpushmems)
  }, [props.kvmpushmems])

  const handleOk = () => {
    setVisible(false)
    dispatch({type: '/msp/v2/kvm/push/config', payload: {id: props.kvmid, type: 3, dsts: checkedKeys}})
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const onExpand = expandedKeys => {
    console.log('onExpand', expandedKeys);

    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  const onCheck = checkedKeys => {
    console.log('onCheck', checkedKeys);
    setCheckedKeys(checkedKeys);
  };

  const onSelect = (selectedKeys, info) => {
    console.log('onSelect', info);
    setSelectedKeys(selectedKeys);
  };

  return <>
    <Button type='primary' disabled={props.disabled} style={props.style} onClick={() => setVisible(true)}>{props.children}</Button>
    <Modal
      centered
      title="坐席推送"
      okText='确认'
      cancelText='取消'
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      {data.length ?
        <Tree
          checkable
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onCheck={onCheck}
          checkedKeys={checkedKeys}
          onSelect={onSelect}
          selectedKeys={selectedKeys}
          treeData={data}
        /> : <Empty />
      }
    </Modal>
  </>
}


const mapStateToProps = state => ({
  kvms: state.mspsCfg.kvm.kvms,
  kvmpush: state.mspsCfg.kvm.kvmpush,
  kvmpushmems: state.mspsCfg.kvm.kvmpushmems
})

export default connect(mapStateToProps)(KvmModal);