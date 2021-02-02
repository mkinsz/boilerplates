import React from 'react';
import { CustomMenu } from '../public';
import { useLocation } from 'react-router-dom';

const SiderMenu = props => {
  const [selectedKeys, setSelectedKeys] = React.useState([]);
  const [openKeys, setOpenKeys] = React.useState([])

  const location = useLocation();

  React.useEffect(() => {
    if(!location.pathname) return;
    const regx = /\/(\w+)/;
    const module = location.pathname.match(regx)
    setOpenKeys([location.pathname.substr(0, location.pathname.lastIndexOf('/'))])
    module && setSelectedKeys([module[0]])
  }, [location])

  React.useEffect(() => {
    props.collapsed && setOpenKeys([])
  }, [props.collapsed])

  const handleOpenChange = v => {
    setOpenKeys([v[v.length - 1]]);
  };

  return (
    <CustomMenu
      theme={props.theme}
      menus={props.menus}
      mode={props.mode ? props.mode : props.collapsed ? 'vertical' : 'inline'}
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
    ></CustomMenu>
  );
}

export default SiderMenu;