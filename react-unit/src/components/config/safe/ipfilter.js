import React, { useEffect } from 'react';
import { useState, useRef, useContext } from 'react';
import { Collapse, Modal, Row, Col, Button, Table, Input, List, InputNumber, Popconfirm, Form, Tabs } from "antd";
const { Panel } = Collapse;
import { Radio, message } from 'antd';
import { connect } from 'react-redux';
import { SAFE } from "../../../actions";
import '../screen/index.css'

const EditableContext = React.createContext();

const num2type = (num) => {
  switch (num) {
    case 1:
      return 'white'
    case 2:
      return 'black'
  }
  return 'no'
}

const type2num = (type) => {
  switch (type) {
    case 'white':
      return
    case 'black':
      return 2
  }
  return 0
}

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef();
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async e => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
          {
            pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/,
            message: '请输入合法的IP地址'
          }
        ]}
      >
        <Input ref={inputRef} maxLength={20} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24,
          }}
          onClick={toggleEdit}
        >
          {children}
        </div>
      );
  }

  return <td {...restProps}>{childNode}</td>;
};

const EditableTable = props => {
  const [data, setData] = React.useState([])

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: '5%'
    },
    {
      title: 'IP',
      dataIndex: 'IP',
      width: '30%',
      editable: true
    },
    {
      title: '删除',
      dataIndex: 'operation',
      render: (text, record) =>
        data.length >= 1 ? (
          <Popconfirm title="是否删除?" cancelText='取消' okText='确定' onConfirm={() => handleDelete(record)}>
            <a>删除</a>
          </Popconfirm>
        ) : null,
    },
  ];

  React.useEffect(() => {
    if (!props.data) return;
    console.log(props.data)
    setData(props.data.map((m, i) => ({ key: (i).toString(), index: i + 1, IP: m })))
  }, [props.data])

  const handleDelete = record => {
    props.onDelete(record.IP)
  };

  const handleSave = row => {
    const newData = [...data];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    props.onUpdate(item.IP, row.IP)
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const ncolumns = columns.map(col => {
    if (!col.editable) return col;

    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: handleSave,
      }),
    };
  });

  return (
    <div>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={data}
        columns={ncolumns}
        pagination={{
          pageSize: 4,
          total: '',
          onChange: '',
        }}
      />
    </div>
  );
}

const formLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 19 },
};

const AddForm = props => {
  const [form] = Form.useForm()
  const { onCancel, onConfirm } = props

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const row = await form.validateFields();
      onConfirm(row.IP);
    } catch (err) {
      console.log('Validate Failed:', err);
    }
  };

  return (
    <Modal
      visible={true}
      title={"添加IP"}
      okText="确认" cancelText="取消"
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} {...formLayout}>
        <Form.Item name='IP' label="IP" rules={[{ required: true, message: '请输入IP' }]}><Input maxLength={20} /></Form.Item>
      </Form>
    </Modal>
  );
};


const IpFilter = props => {
  const [ssh, setSsh] = useState(0)
  const [addvisible, setAddvisible] = useState(false)
  const [fileterData, setFilterData] = useState({ 0: [], 1: [], 2: [] })
  const [filterType, setFilterType] = useState(1)

  useEffect(() => {
    SAFE.getSSHstate()
    SAFE.getFilterType()
  }, []);

  useEffect(() => {
    setSsh(props.ssh)
  }, [props.ssh])

  useEffect(() => {
    if (props.filtertype==undefined) return;
    if (props.filterType == filterType) return;
    setFilterType(props.filtertype)
  }, [props.filtertype])

  useEffect(() => {
    setFilterData({ ...fileterData, [filterType]: props.ips[num2type(filterType)] })
    console.log('props.ips', props.ips)
  }, [props.ips])

  const handleSsh = () => {
    SAFE.setSSHstate(ssh == 0 ? 1 : 0)
    setSsh(ssh == 0 ? 1 : 0)
  }

  const handleFilterType = (e) => {
    setFilterType(e.target.value)
    SAFE.getFilterForm(e.target.value)
    if (e.target.value == 0) {
      var Btn = document.getElementById('Button')
      var Btn1 = document.getElementById('Button1')
      Btn.disabled = true
      Btn1.disabled = true
    } else {
      var Btn = document.getElementById('Button')
      var Btn1 = document.getElementById('Button1')
      Btn.disabled = false
      Btn1.disabled = false
    }
  }

  const handleClear = () => {
    setFilterData({ ...fileterData, [filterType]: [] })
  }

  const handleSave = () => {
    SAFE.setFilterForm(filterType, fileterData[filterType])
    return message.success('保存成功')
  }


  const handleCancel = () => {
    setAddvisible(false)
  }

  const handleDelete = (value) => {
    let iparr = fileterData[filterType].filter(item => item != value)
    setFilterData({ ...fileterData, [filterType]: iparr })
  }
  const handleConfirm = (value) => {
    setAddvisible(false)
    let iparr = [...fileterData[filterType]];
    var util = {
      isValidIp: function (e) {
        return /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/.test(e)
      }
    };
    if (!util.isValidIp(value)) {
      return message.error('IP地址格式输入错误，请重新输入')
    } else {
      if (iparr.includes(value))
        return message.error('IP已添加')
      else message.success('IP添加成功')
      iparr.push(value)
      console.log(iparr, '22222222222222222222')
      setFilterData({ ...fileterData, [filterType]: iparr })
    }

  }

  const handleUpdate = (_old, _new) => {
    const index = fileterData[filterType].findIndex(obj => obj == _old)
    if (index >= 0) {
      let iparr = fileterData[filterType]
      iparr.splice(index, 1, _new)
      console.log('iparr:', iparr)
      setFilterData({ ...fileterData, [filterType]: iparr })
    }
  }

  console.log(fileterData)

  return (
    <div>
      <Collapse bordered={false} defaultActiveKey={["1", "2"]}>
        <Panel header="SSH" key="1">
          <Row gutter={[8, 8]}>
            <Col span={3} style={{ alignSelf: 'center' }}>SSH</Col>
            <Col span={8}><Button onClick={handleSsh}>{ssh == 0 ? '开启' : '关闭'}</Button></Col>
          </Row>
        </Panel>
        <Panel header="IP过滤" key="2">
          <Row gutter={[8, 8]} style={{ background: 'white' }}>
            <Col span={3} style={{ alignSelf: 'center' }}>IP过滤方式:</Col>
            <Col span={6} >
              <Radio.Group value={filterType} onChange={handleFilterType} style={{ display: 'inline-flex', width: '100%', height: '100%' }}>
                <Radio value={0} style={{ textAlign: 'center', lineHeight: '30px' }}>禁止</Radio>
                <Radio value={1} style={{ textAlign: 'center', lineHeight: '30px' }}>白名单</Radio>
                <Radio value={2} style={{ textAlign: 'center', lineHeight: '30px' }}>黑名单</Radio>
              </Radio.Group>
            </Col>
            <Col span={3} style={{ alignSelf: 'center' }}>(切换后保存生效)</Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col span={24} >
              <EditableTable data={fileterData[filterType]} onDelete={handleDelete} onUpdate={handleUpdate} />
              {addvisible && <AddForm onCancel={handleCancel} onConfirm={handleConfirm} />}
            </Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col><Button id='Button' onClick={() => setAddvisible(true)}>添加</Button></Col>
            <Col><Button id='Button1' onClick={handleClear}>清空</Button></Col>
            <Col><Button id='Button2' onClick={handleSave}>保存</Button></Col>
          </Row>
        </Panel>
      </Collapse>
    </div>
  );
}

const mapStateToProps = state => {
  return {
    ssh: state.mspsCfg.safe.ssh,
    filtertype: state.mspsCfg.safe.filtertype,
    ips: state.mspsCfg.safe.ips
  };
};

export default connect(mapStateToProps)(IpFilter);