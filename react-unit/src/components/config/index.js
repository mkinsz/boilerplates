import React, { useEffect } from 'react';
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom';
import { Layout, Empty } from 'antd';
import Routes from './routes'
import { useDispatch } from 'react-redux';
import { CustomMenu, CHNTYPE } from '../public';

const { Sider, Content } = Layout;

const Users = React.lazy(() => import('./users/index.jsx'));
const Mass = React.lazy(() => import('./mass'));
const TcpIp = React.lazy(() => import('./network/tcpip'));
const Access = React.lazy(() => import('./network/access'));
const CaseIdle = React.lazy(() => import('./expand/caseidle'));
const PortIdle = React.lazy(() => import('./expand/portidle'));
const OutIdle = React.lazy(() => import('./expand/outidle'));
const HeapUp = React.lazy(() => import('./expand/heapup'));
const DeviceBoard = React.lazy(() => import('./device/board.jsx'));
const DeviceChnnl = React.lazy(() => import('./device/chnnlcfg.jsx'));
const DeviceGroup = React.lazy(() => import('./device/chnnlgroup.jsx'));
const DeviceSerial = React.lazy(() => import('./device/serialport.jsx'));
const Test = React.lazy(() => import('./device/test.jsx'));
const ScreenSet = React.lazy(() => import('./screen/screenset'));
const ScreenMap = React.lazy(() => import('./screen/screenmap'));
const ScreenOsd = React.lazy(() => import('./screen/screenosd'));
const IpFilter = React.lazy(() => import('./safe/ipfilter'));
const AttendStatus = React.lazy(() => import('./attend/status'));
const AttendConfig = React.lazy(() => import('./attend/config'));
const AttendGroup = React.lazy(() => import('./attend/group'));
const AttendRemote = React.lazy(() => import('./attend/remote'));
const SystemInfo = React.lazy(() => import('./system/sysinfo'));
const SystemCtrl = React.lazy(() => import('./system/sysctrl'));
const SystemAuth = React.lazy(() => import('./system/sysauth'));
const SystemOther = React.lazy(() => import('./system/other'));
const Preset = React.lazy(() => import('./network/preset'))
const Unite = React.lazy(() => import('./unite'))

const Config = ({ match, location }) => {
  const [openKeys, setOpenKeys] = React.useState([]);
  const [selectedKeys, setSelectedKeys] = React.useState([]);

  const dispatch = useDispatch();

  const handleOpenChange = openKeys => {
    openKeys.length === 0 || openKeys.length === 1 ?
      setOpenKeys(openKeys) : setOpenKeys([openKeys[openKeys.length - 1]])
  };

  useEffect(() => {
    setTimeout(() => {
      dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VIN, offset: 0 } });
      dispatch({ type: '/msp/v2/chn/query', payload: { type: CHNTYPE.VOUT, offset: 0 } });
    }, 100)
  }, [])

  useEffect(() => {
    setOpenKeys([location.pathname.substr(0, location.pathname.lastIndexOf("/"))])
    setSelectedKeys([location.pathname])
  }, [location])

  return (
    <Layout style={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
      <Sider theme='light' width={160}>
        <CustomMenu
          menus={Routes.menus}
          theme="light"
          mode='inline'
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
        ></CustomMenu>
      </Sider>
      <Content style={{ padding: '0 10px', backgroundColor: 'white' }}>
        <React.Suspense fallback={null}>
          <Switch>
            <Route path={`${match.url}/:topic/:index`} component={Topic} />
            <Route path={`${match.url}/:topic`} component={Topic} />
            <Redirect to={`${match.url}/net/tcpip`} />
          </Switch>
        </React.Suspense>
      </Content>
    </Layout>
  );
}

const index2component = index => {
  switch (index) {
    case 'tcpip': return <TcpIp />
    case 'access': return <Access />
    case 'preset': return <Preset />
    case 'board': return <DeviceBoard />
    case 'chnnl': return <DeviceChnnl />
    case 'devgrp': return <DeviceGroup />
    case 'serial': return <DeviceSerial />
    case 'test': return <Test />
    case 'case': return <CaseIdle />
    case 'port': return <PortIdle />
    case 'out': return <OutIdle />
    case 'heap': return <HeapUp />
    case 'screenset': return <ScreenSet />
    case 'screenmap': return <ScreenMap />
    case 'screenosd': return <ScreenOsd />
    case 'status': return <AttendStatus />
    case 'config': return <AttendConfig />
    case 'kvmgrp': return <AttendGroup />
    case 'remote': return <AttendRemote />
    case 'info': return <SystemInfo />
    case 'ctrl': return <SystemCtrl />
    case 'auth': return <SystemAuth />
    case 'other': return <SystemOther />
    default: return <Empty />;
  }
}

const Topic = ({ match }) => {
  // console.log('Topic: ', match)

  if (match.params.topic) {
    switch (match.params.topic) {
      case 'user': return <Users />
      case 'mass': return <Mass />
      case 'safe': return <IpFilter />
      case 'unite': return <Unite />
      // case 'net':
      // case 'res':
      // case 'exp':
      // case 'sys':
      // case 'screen':
      // case 'attend':
      default:return index2component(match.params.index);
    }
  }
}

export default Config;