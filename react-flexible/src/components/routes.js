const routes = [
  {
    path: "/",
    exact: true,
    sidebar: () => <div>home!</div>,
    main: () => <h2>Home</h2>,
  },
  {
    path: "/bubble",
    sidebar: () => <div>bubble!</div>,
    main: () => <h2>Bubble</h2>,
  },
  {
    path: "/test",
    sidebar: () => <div>test!</div>,
    main: () => <h2>Test</h2>,
  },
];

export default routes;