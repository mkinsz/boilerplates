import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import {
  GlobalOutlined,
  LaptopOutlined,
  EditOutlined,
  LockOutlined,
  TrophyOutlined,
  BuildOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ContactsOutlined,
  InboxOutlined,
  BankOutlined,
  CloudOutlined,
  BulbOutlined,
  UserOutlined,
  SafetyOutlined,
  UngroupOutlined
} from '@ant-design/icons';

const name2icon = {
  'global': <GlobalOutlined />,
  'laptop': <LaptopOutlined />,
  'edit': <EditOutlined />,
  'lock': <LockOutlined />,
  'trophy': <TrophyOutlined />,
  'build': <BuildOutlined />,
  'setting': <SettingOutlined />,
  'info-circle': <InfoCircleOutlined />,
  'contacts': <ContactsOutlined />,
  'inbox': <InboxOutlined />,
  'bank': <BankOutlined />,
  'cloud': <CloudOutlined />,
  'bulb': <BulbOutlined />,
  'user': <UserOutlined />,
  'safety': <SafetyOutlined />,
  'unite': <UngroupOutlined />
}

export const CustomMenu = props => {
  const renderItem = item => {
    return (
      <Menu.Item key={item.key}>
        <Link to={item.key}>
          {item.icon && name2icon[item.icon]}
          <span>{item.title}</span>
        </Link>
      </Menu.Item>
    );
  };

  const renderMenu = item => {
    return (
      <Menu.SubMenu
        key={item.key}
        title={
          <span>
            {item.icon && name2icon[item.icon]}
            <span>{item.title}</span>
          </span>
        }
      >
        {item.subs.map(item => renderItem(item))}
      </Menu.SubMenu>
    );
  };

  return (
    <Menu {...props} style={{ height: '100%' }}>
      {props.menus.map(item => {
        return item.subs && item.subs.length > 0
          ? renderMenu(item)
          : renderItem(item);
      })}
    </Menu>
  );
}
