import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Form, Select, InputNumber, Popconfirm, Space, message } from 'antd';
import XLSX from 'xlsx';
import CheckModal from './modal'
import { CONFIG } from "../../../actions";

const { Option } = Select;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'select' ?
    <Select style={{ width: 'inherit' }} >
      <Option value={0}>输入</Option>
      <Option value={1}>输出</Option>
    </Select> :
    <InputNumber min={0} style={{ width: 'inherit' }} />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0, }} rules={[
          { required: true, message: `请输入 ${title}!` }]}>
          {inputNode}
        </Form.Item>
      ) : ('type' == dataIndex ? (!record.type ? '输入' : '输出') : children)}
    </td>
  );
};

const PortIdle = props => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [row, setRow] = useState()

  const dispatch = useDispatch()
  const extports = useSelector(({ mspsCfg: { ext } }) => ext.ports)

  useEffect(() => {
    dispatch({ type: '/msp/v2/devex/port/redundancy/query' })
  }, [])

  const data = useMemo(() => {
    const ds = Object.values(extports).map((m, i) => ({ key: m.id, index: i + 1, ...m }))
    return !row ? ds : [row, ...ds]
  }, [extports, row])

  const isEditing = record => record.key === editingKey;

  const edit = record => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const del = key => {
    dispatch({ type: '/msp/v2/devex/port/redundancy/delete', payload: { id: key } })
  }

  const cancel = record => {
    setRow()
    setEditingKey('');
  };

  const save = async record => {
    try {
      const row = await form.validateFields();
      const index = data.findIndex(item => record.key === item.key);
      if (index > -1) {
        const item = { ...data[index], ...row };
        delete item.key

        if (item.id) {
          dispatch({ type: '/msp/v2/devex/port/redundancy/modify', payload: item })
        } else {
          const i = data.findIndex(m =>
            m.lbox == row.lbox &&
            m.lport == row.lport &&
            m.lslot == row.lslot &&
            m.fslot == row.fslot &&
            m.fport == row.fport)
          if (i > -1) {
            message.warning("重复添加...")
          } else {
            dispatch({ type: '/msp/v2/devex/port/redundancy/add', payload: item })
          }
        }
      }
      setRow()
      setEditingKey('');

      form.resetFields();
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    { title: '编号', dataIndex: 'index', key: 'index', width: 50, fixed: 'left', },
    { title: '机箱', dataIndex: 'lbox', key: 'lbox', width: 100, fixed: 'left', editable: true },
    { title: '主槽位', dataIndex: 'lslot', key: 'lslot', editable: true },
    { title: '主端口', dataIndex: 'lport', key: 'lport', editable: true },
    {
      title: '主状态', dataIndex: 'lstate', key: 'lstate',
      render: text => text ? '在线' : '离线'
    },
    { title: '备槽位', dataIndex: 'fslot', key: 'fslot', editable: true },
    { title: '备端口', dataIndex: 'fport', key: 'fport', editable: true },
    {
      title: '备状态', dataIndex: 'fstate', key: 'fstate',
      render: text => text ? '在线' : '离线'
    },
    { title: '通道类型', dataIndex: 'type', key: 'type', editable: true },
    {
      title: '匹配状态', dataIndex: 'fit', key: 'fit',
      render: text => text ? '不匹配' : '匹配'
    },
    {
      title: '操作', dataIndex: 'operation', width: 100, fixed: 'right',
      render: (text, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Popconfirm title="是否确认保存?" okText="确认" cancelText="取消" onConfirm={() => save(record)}>
              <a>保存</a>
            </Popconfirm>
            <a onClick={() => cancel(record)}>取消</a>
          </Space>
        ) : (
            <Space>
              <a disabled={editingKey !== ''} onClick={() => edit(record)}>编辑</a>
              <Popconfirm title="是否删除?" okText="确认" cancelText="取消" onConfirm={() => del(record.key)}>
                <a>删除</a>
              </Popconfirm>
            </Space >);
      },
    },
  ];

  const components = {
    body: {
      cell: EditableCell,
    },
  };

  const ncolumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: record => ({
        record,
        inputType: col.dataIndex === 'type' ? 'select' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleNew = () => {
    if (row) {
      setEditingKey('tmp')
      return;
    }

    const len = data.length
    const newData = {
      key: 'tmp',
      index: len + 1,
      lbox: 0,
      lslot: 0,
      lport: 0,
      lstate: 0,
      fslot: 0,
      fport: 0,
      fstate: 0,
      type: 0,
      fit: 0
    };
    setRow(newData)
    form.setFieldsValue({ ...newData });
    setEditingKey('tmp')
  }

  const s2ab = s => {
    if (typeof ArrayBuffer !== 'undefined') {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    } else {
      var buf = new Array(s.length);
      for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }
  }

  const handleExport = () => {
    const wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };
    const wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
    const ndata = data.map(m => {
      return {
        '机箱号': m.lbox,
        '主槽位号': m.lslot,
        '主端口号': m.lport,
        '主状态': m.lstate ? '在线' : '离线',
        '备槽位号': m.fslot,
        '备端口号': m.fport,
        '备状态': m.fstate ? '在线' : '离线',
        '通道类型': !m.type ? '输入' : '输出',
        '匹配状态': m.fit ? '不匹配' : '匹配'
      }
    })
    wb.Sheets['Sheet1'] = XLSX.utils.json_to_sheet(ndata);
    const blob = new Blob([s2ab(XLSX.write(wb, wopts))], { type: "application/octet-stream" })
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'port.xlsx';
    a.click();
    URL.revokeObjectURL(a.herf);
    a.remove();
  }

  const handleStartAllPort = () => {
    dispatch({ type: '/msp/v2/devex/port/redundancy/apply/config' })
  }

  return <>
    <Space style={{ marginBottom: 16 }}>
      <Button type='primary' disabled={editingKey} onClick={handleNew}>新建</Button>
      <Button type='primary' onClick={handleExport}>导出</Button>
      <CheckModal>一键检测</CheckModal>
      <Button type="primary" onClick={handleStartAllPort}>全部生效</Button>
    </Space>
    <Form form={form} component={false}>
      <Table
        bordered
        size='small'
        dataSource={data}
        columns={ncolumns}
        components={components}
        pagination={false}
        scroll={{ x: 1300, y: 700 }}
      />
    </Form>
  </>
}

export default PortIdle;