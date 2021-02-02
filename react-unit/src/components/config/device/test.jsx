import React from 'react'
import { Tree,Button } from 'antd';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      {
        title: 'parent 1-0',
        key: '0-0-0',
        disabled: true,
        children: [
          {
            title: 'leaf',
            key: '0-0-0-0',
            disableCheckbox: true,
          },
          {
            title: 'leaf',
            key: '0-0-0-1',
          },
        ],
      },
      {
        title: 'parent 1-1',
        key: '0-0-1',
        children: [
          {
            title: (
              <span
                style={{
                  color: '#1890ff',
                }}
              >
                sss
              </span>
            ),
            key: '0-0-1-0',
          },
        ],
      },
    ],
  },
];

const App = () => {
  const [data, setData] = React.useState([...treeData])

  const onBtnClick = () =>{
    let t = data.slice(0)
    let a = {title:"123", key:"123",children:[{title:"1234",key:"1234"}]}
    t.push(a)
    setData(t)
  }
  return (
    <div>
      <Button onClick={onBtnClick}>123</Button>
    <Tree
      checkable
      treeData={data}
    />
    </div>
  );
};

export default App;