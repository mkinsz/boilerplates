import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, Menu, Empty, Button, Popover, Space, Modal } from 'antd';
import {
  ShrinkOutlined,
  ArrowsAltOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import screenfull from 'screenfull';
import { createUseStyles } from 'react-jss';
import { AUTH } from '../../actions'
import * as ws from '../../services'
import * as session from '../../utils'
import pic_logo from '@/assets/public/logo.png'
import {ReactComponent as Svg_User } from '@/assets/public/user.svg'
import { useDispatch } from 'react-redux';

const useStyles = createUseStyles({
  contain: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    padding: '0px 0px 0px 20px',
    alignItems: 'center',
  },
  trigger: {
    fontSize: 18,
    height: '100%',
    cursor: 'pointer',
    '&:hover': {
      color: '#1890ff'
    }
  },
  headerTitle: {
    width: '100%',
    height: '100%',
    marginLeft: 0,
    fontSize: 18
  },
  headerTool: {
    height: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 120,
  },
});

const HeaderBar = props => {
  const [count, setCount] = useState(0)
  const [tips, setTips] = useState([])

  const classes = useStyles();
  const history = useHistory();

  const { collapsed, onToggle } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    return () => { screenfull.off('change'); }
  }, [])

  const handleOut = async () => {
    dispatch({ type: '/msp/v2/chn/query', payload: { clear: true } })

    AUTH.logout()
    AUTH.remove()
    try { await ws.release() } catch (e) { console.log('ws releae:', e) }
    history.push('/login')
  };

  const handleAbout = () => {
    Modal.info({
      centered: true,
      title: '关于',
      content: (
        <div style={{ margin: '20px 0 0 0' }}>
          <p>{logoComponent}</p>
          <p>晶灵MSP1000(1.3.1.17286 - 2021.2.2</p>
          {/* <p>苏州科达科技股份有限公司 版权所有</p> */}
          <p>Copyright &copy; 2021 KEDACOM. All rights reserved.</p>
          <a href="https://www.kedacom.com"> https://www.kedacom.com </a>
        </div>
      ),
    });
  }

  const handleModify = () => {

  }

  const titleComponent = <Space>
    你好 -
    <a>{session.getUser()}</a>
  </Space>

  const menu = (
    <Menu className={classes.menu}>
      <Menu.ItemGroup title={titleComponent}>
        <Menu.Item onClick={handleAbout}>关于</Menu.Item>
        {/* <Menu.Item onClick={handleModify}>修改密码</Menu.Item> */}
        <Menu.Item onClick={handleOut}>退出登录</Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  const text = <div style={{ display: 'flex', fontWeight: 500, justifyContent: 'space-between' }}>
    <span>消息盒子</span> <Button size='small' disabled={!tips.length}>清除</Button></div>;

  const content = (
    <div>{
      !tips.length ? <Empty /> :
        tips.map(m => <p>{m}</p>)
    }</div>
  );

  const logoComponent = <img src={pic_logo}></img>

  return (
    <div className={classes.contain}>
      {/* <div>
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: classes.trigger,
          onClick: onToggle,
        })}
      </div> */}
      <div className={classes.headerTitle}>{logoComponent}</div>
      <div className={classes.headerTool}>
        {/* <Badge
          count={count}
          overflowCount={count}
          style={{ marginRight: -17 }}
          onClick={() => setCount(0)}
        >
          <Popover arrowPointAtCenter placement="bottom" title={text} content={content} trigger="click">
            <NotificationOutlined />
          </Popover>
        </Badge> */}
        {React.createElement(screenfull.isFullscreen ? ShrinkOutlined : ArrowsAltOutlined, {
          onClick: () => { screenfull.toggle() },
        })}

        <Dropdown overlay={menu}>
          <Svg_User style={{ width: 32, height: 32 }} />
          {/* <Avatar icon={<Svg_User />}></Avatar> */}
        </Dropdown>
      </div>
    </div>
  )
}

export default HeaderBar;