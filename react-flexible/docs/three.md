# three.js 3D

### model

Threejs支持的常见导出模型的文件格式有哪些？
- JSON（*.js/ *.json）：专门为Three.js自己设计的JSON格式，你可以使用它以声明的方式定义模型，及模型材质和动画。
- OBJ和MTL（*.obj/ *.mtl）：OBJ是一种简单的三维文件格式，只用来定义对象的几何体。MTL文件通常和OBJ文件一起使用，在一个MTL文件中，定义对象的材质。 
- Collada (*.dae)：用来定义XML类文件中数字内容的格式。差不多所有的三维软件和渲染引擎都支持这个格式。 
- STL (*.stl)：立体成型术 。 广泛用于快速成型。例如，三维打印机的模型文件通常是STL文件。Three.js有一个可定制的STL导出工具，STLExporter.js。可以将Three.js中的模型导出到一个STL文件。 
- FBX (*.fbx)：是FilmBoX这套软件所使用的格式，其最大的用途是用在诸如在max、maya、softimage等软件间进行模型、材质、动作和摄影机信息的互导，因此在创建三维内容的应用软件之间具有无与伦比的互用性。
- CTM (*.ctm)：由openCTM创建的格式。可以用来压缩存储表示三维网格的三角形面片。 
- VTK（*.vtk）：Visualization Tookit 定义的文件格式，用来指定顶点和面。VTK有两种格式，Three.js支持旧的格式，即Asscii格式。 
- PDB（*.pdb）：特别的数据格式，由 蛋白质数据银行 场景，用来定义蛋白质的形状。Three.js可以加载并显示这种描述格式的蛋白质。 
- PLY (*.ply)：多边形文件格式。通常保存三维扫描仪的数据。

Threejs中导入以上外部模型文件所需的辅助函数是哪些？

- threejs中导入外部文件所需的辅助函数都在https://github.com/mrdoob/three.js/tree/dev/examples/js/loaders下可以找到。这里除了JSON模型文件的导入外，其余模型文件都需要引用其对应名称的辅助函数。例如：导入OBJ格式的模型，除了导入必要的three.js文件外，还需要在界面中引用OBJLoader.js文件。而JSONLoader函数集成在three.js中，所以无需再导入其他辅助文件！

3D软件导出的模型文件可以解析哪些东西呢？
- 可解析出网格（模型）的有：JSON, STL, OBJ
- 可解析出模型材质的有：JSON, MTL
- 可解析出模型动画的有：FBX， DAE,  JSON
  理解就是，如：导出的json文件既可以存物体的模型，也可以存其材质及动画信息。

### reference

- webgl中文网       http://www.hewebgl.com/
- three.js官方文档  https://threejs.org/
- 3D模型下载        https://sketchfab.com
