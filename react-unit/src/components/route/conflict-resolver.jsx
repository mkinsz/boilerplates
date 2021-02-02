import React from 'react'
import Dialog from '../public/dialog'
import { Table } from 'antd'

const columns = [{
	title: '端口',
	dataIndex: 'Port',
}, {
	title: '预案',
	dataIndex: 'Scene',
}]

const ConflictResolver = props => {
	return <Dialog title='端口冲突，是否抢占？' visible={!!props.data}
		onOk={props.onOk} onCancel={props.onCancel}
		confirmLoading={props.confirmLoading}>
		<Table dataSource={props.data} columns={columns} size='small' />
	</Dialog>
}

export default ConflictResolver
