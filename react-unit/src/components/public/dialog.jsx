import React from 'react'
import { Modal } from 'antd'

const Dialog = props => {
	const buttonProps = {size: 'small'}
	return <Modal title={props.title} visible={props.visible}
		width={props.width} centered destroyOnClose
		onOk={props.onOk} onCancel={props.onCancel}
		confirmLoading={props.confirmLoading}
		closable={!props.confirmLoading}
		maskClosable={!props.confirmLoading}
		okButtonProps={buttonProps}
		cancelButtonProps={{...buttonProps, disabled: props.confirmLoading}}>
		{props.children}
	</Modal>
}

export default Dialog
