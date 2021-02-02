// import './utils/wdyr';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './utils';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Modal, ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN';
import { QuestionCircleOutlined } from '@ant-design/icons';

const root = document.createElement('div');
root.style.height = '100%';
document.body.appendChild(root)

const getConfirmation = (message, callback) => {
	Modal.confirm({
		centered: true,
		title: message,
		icon: <QuestionCircleOutlined />,
		onOk: () => callback(true),
		onCancel: () => callback(false)
	});
};

render(
	<Provider store={store}>
		<Router getUserConfirmation={getConfirmation}>
			<ConfigProvider locale={zhCN}>
				<App />
			</ConfigProvider>
		</Router>
	</Provider>,
	root
);
